/**
 * Fetches a saved vehicle URL and extracts current price/status.
 * Returns a diff object describing what changed (if anything).
 */

import { parseEuroPrice } from './parsePrice.js';

// ─── Fetch with timeout ──────────────────────────────────────────────────────

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // 15 s hard limit
  try {
    const res = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Accept': 'text/html' },
      signal: controller.signal,
    });
    if (!res.ok) return { status: res.status, html: null };
    const html = await res.text();
    return { status: res.status, html };
  } catch {
    // AbortError (timeout) or network error both map to status 0
    return { status: 0, html: null };
  } finally {
    clearTimeout(timer);
  }
}

function extractFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // ─── Price ───────────────────────────────────────────────────────────────
  const priceSelectors = [
    '.price-box .price',
    '.ClassifiedAd .price',
    '[class*="price"]',
    '.cena',
    '#cena',
  ];
  let priceText = '';
  for (const sel of priceSelectors) {
    const el = doc.querySelector(sel);
    if (el && el.textContent.trim()) {
      priceText = el.textContent.trim();
      break;
    }
  }
  // Fallback: scan all leaf text nodes for € pattern
  if (!priceText) {
    const all = doc.body?.querySelectorAll('*') ?? [];
    for (const el of all) {
      if (el.children.length === 0 && /\d[\d.,]*\s*€/.test(el.textContent)) {
        priceText = el.textContent.trim();
        break;
      }
    }
  }

  const priceNum = parseEuroPrice(priceText);

  // ─── Sold detection ───────────────────────────────────────────────────────
  const titleEl = doc.querySelector('h1');
  const titleText = (titleEl?.textContent ?? '').toLowerCase();
  const soldBadge = doc.querySelector('.sold-badge, .prodano-badge, [class*="sold-badge"]');
  const bodyText = (doc.body?.textContent ?? '').toLowerCase();

  const isSold =
    soldBadge !== null ||
    titleText.includes('prodano') ||
    titleText.includes('sold') ||
    // These phrases are reliable full-body signals (avto.net specific)
    bodyText.includes('ni več na voljo') ||
    bodyText.includes('oglas je bil umaknjen');

  // ─── Removed detection ────────────────────────────────────────────────────
  const title = titleEl?.textContent?.trim() ?? '';
  const isRemoved =
    bodyText.includes('oglas ni najden') ||
    bodyText.includes('stran ni najdena') ||
    // "404" must co-occur with a missing title to avoid false matches in body
    (bodyText.includes('404') && !title);

  return { priceText, priceNum, isSold, isRemoved, title };
}

export async function checkVehicle(vehicle) {
  const { html, status } = await fetchPage(vehicle.url);

  if (status === 0) {
    return {
      changed: false,
      checkFailed: true,
      vehicleId: vehicle.id,
      reason: 'network',
    }; // transient — try again next cycle
  }

  if (status === 404 || status === 410) {
    return {
      changed: vehicle.status !== 'removed',
      type: 'removed',
      vehicleId: vehicle.id,
      title: vehicle.title,
      message: `Oglas odstranjen: ${vehicle.title}`,
    };
  }

  if (status < 200 || status >= 300 || !html) {
    return {
      changed: false,
      checkFailed: true,
      vehicleId: vehicle.id,
      reason: 'http',
      httpStatus: status,
    };
  }

  const current = extractFromHtml(html);

  if (current.isRemoved) {
    return {
      changed: vehicle.status !== 'removed',
      type: 'removed',
      vehicleId: vehicle.id,
      title: vehicle.title,
      message: `Oglas ni več na voljo: ${vehicle.title}`,
    };
  }

  if (current.isSold) {
    return {
      changed: vehicle.status !== 'sold',
      type: 'sold',
      vehicleId: vehicle.id,
      title: vehicle.title,
      message: `Vozilo prodano: ${vehicle.title}`,
    };
  }

  // A successful HTTP response can still be a rate-limit/challenge/interstitial.
  // Without a title or price there is not enough evidence to mutate listing state.
  if (!current.title && !current.priceNum) {
    return {
      changed: false,
      checkFailed: true,
      vehicleId: vehicle.id,
      reason: 'unrecognized-page',
    };
  }

  // ─── Price change ─────────────────────────────────────────────────────────
  const savedPrice = vehicle.priceNum ?? parseEuroPrice(vehicle.price);
  const newPrice = current.priceNum;

  if (savedPrice && newPrice && Math.abs(newPrice - savedPrice) > 50) {
    const diff = newPrice - savedPrice;
    const sign = diff < 0 ? '▼' : '▲';
    const abs = Math.abs(diff).toLocaleString('sl-SI');
    return {
      changed: true,
      type: 'price_change',
      vehicleId: vehicle.id,
      title: vehicle.title,
      oldPrice: savedPrice,
      newPrice,
      message: `${sign} Cena spremenjena za ${abs} € — ${vehicle.title}`,
    };
  }

  return { changed: false, vehicleId: vehicle.id };
}

export function buildVehicleCheckPatch(vehicle, result, checkedAt = Date.now()) {
  if (result.checkFailed) {
    return {
      lastChecked: checkedAt,
      consecutiveFailures: (vehicle.consecutiveFailures ?? 0) + 1,
    };
  }

  const patch = {
    lastChecked: checkedAt,
    consecutiveFailures: 0,
  };

  if (!result.changed) return patch;

  patch.status = result.type;
  if (result.type === 'price_change') {
    patch.priceHistory = [
      ...(vehicle.priceHistory ?? []),
      { price: result.newPrice, ts: checkedAt },
    ];
    patch.priceNum = result.newPrice;
    patch.price = `${result.newPrice.toLocaleString('sl-SI')} €`;
  }
  return patch;
}

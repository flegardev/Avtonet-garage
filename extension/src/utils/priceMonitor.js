/**
 * Fetches a saved vehicle URL and extracts current price/status.
 * Returns a diff object describing what changed (if anything).
 */

import { parse } from 'parse5';
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

// parse5 is bundled locally and works in an MV3 worker without a DOM.
function extractFromHtml(html) {
  const nodes = [];
  function walk(node) {
    if (['script', 'style', 'template'].includes(node.tagName)) return;
    nodes.push(node);
    for (const child of node.childNodes || []) walk(child);
  }
  walk(parse(html));
  const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).filter(n => !['script', 'style', 'template'].includes(n.tagName)).map(text).join(' ');
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value || '';
  const title = text(nodes.find(n => n.tagName === 'h1') || {}).trim();
  const prices = nodes.filter(n => /(?:^|[\s_-])(price|cena)(?:$|[\s_-])/i.test(attr(n, 'class')) || attr(n, 'id') === 'cena');
  const priceText = prices.map(text).find(t => /\d/.test(t)) || nodes.filter(n => n.nodeName === '#text').map(text).find(t => /\d[\d., ]*\s*€/.test(t)) || '';
  const bodyText = nodes.filter(n => n.nodeName === '#text').map(text).join(' ').toLowerCase();
  const isSold = nodes.some(n => /(?:^|\s)(?:sold-badge|prodano-badge)(?:$|\s)/.test(attr(n, 'class'))) || /^(?:prodano|sold)\b/i.test(title);
  const isRemoved = /oglas ni najden|stran ni najdena|oglas je bil umaknjen|ni več na voljo/.test(bodyText);
  return { priceNum: parseEuroPrice(priceText), isSold, isRemoved, title };
}

export async function checkVehicle(vehicle) {
  let url;
  try { url = new URL(vehicle.url); } catch { return { changed: false, vehicleId: vehicle.id }; }
  if (!['http:', 'https:'].includes(url.protocol) || !(url.hostname === 'avto.net' || url.hostname.endsWith('.avto.net'))) return { changed: false, vehicleId: vehicle.id };
  const { html, status } = await fetchPage(url.href);

  if (status === 0 || (status !== 404 && status !== 410 && (status < 200 || status >= 300 || !html))) {
    return { changed: false, vehicleId: vehicle.id }; // transient — try again next cycle
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

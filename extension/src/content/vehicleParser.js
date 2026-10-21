/**
 * Parses vehicle data from an avto.net listing detail page.
 * Uses multiple selector strategies + text-pattern fallbacks for robustness.
 */

import { parseEuroPrice } from '../utils/parsePrice.js';
import {
  buildEquipmentSections,
  cleanVehicleText,
  isLikelyEquipmentBlob,
  normalizeDescription,
  toSearchText,
} from '../utils/vehiclePresentation.js';

function trySelectors(selectors, transform = (el) => el.textContent.trim()) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const val = transform(el);
        if (val) return val;
      }
    } catch {}
  }
  return '';
}

function trySelectorsAll(selectors, transform = (el) => el.src) {
  for (const sel of selectors) {
    try {
      const els = [...document.querySelectorAll(sel)];
      if (els.length) return els.map(transform).filter(Boolean);
    } catch {}
  }
  return [];
}

export function parseTitle() {
  // Try common structural selectors first
  const fromDOM = trySelectors([
    // avto.net-specific patterns
    '.GO-Results-Naslov',
    '.ClassifiedAdTitle',
    '.vehicle-header h1',
    '.ad-title h1',
    '.naslov-oglasa',
    '.title-main',
    // Generic fallbacks
    'h1.title',
    '.ClassifiedAd h1',
    '#ClassifiedAdTitle',
    '.vehicle-title h1',
    '.oglas-naslov h1',
    'h1[class*="title"]',
    'h1[class*="naslov"]',
    'h1[itemprop="name"]',
    '[itemprop="name"]',
    'main h1',
    'article h1',
    'h1',
  ]);
  if (fromDOM) return fromDOM;

  // Try Open Graph / meta title
  const ogTitle =
    document.querySelector('meta[property="og:title"]')?.content?.trim() ||
    document.querySelector('meta[name="title"]')?.content?.trim();
  if (ogTitle) return ogTitle;

  // Final fallback: document.title (strip trailing site name like " | avto.net")
  const docTitle = document.title?.trim();
  if (docTitle) {
    return docTitle.split(/\s*[|–-]\s*/)[0].trim() || docTitle;
  }

  return '';
}

export function parsePrice() {
  const raw = trySelectors([
    '.price-box .price',
    '.price-main',
    '.ClassifiedAd .cena',
    '#cena',
    '[class*="price"]:not(script)',
    '[class*="cena"]:not(script)',
    '.ClassifiedAdContainer .price',
  ]);
  if (raw) return raw;

  // Text node scan — look for "12.500 €" or "12500€" patterns
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (/^\d[\d.,\s]*€$/.test(t) || /^\d[\d.,\s]*\s*EUR$/i.test(t)) {
      return t;
    }
  }
  return '';
}

export function parsePriceNum(priceStr) {
  return parseEuroPrice(priceStr);
}

export function parseMileage() {
  // Common Slovenian: "km" unit
  const raw = trySelectors([
    '[class*="km"]',
    '[class*="mileage"]',
    '[class*="prevozeno"]',
    '#prevozenih-km',
    'td.km',
    '.specs-km',
  ]);
  if (raw) return raw;

  // Scan table cells / list items for "xxx.xxx km" pattern
  const candidates = [...document.querySelectorAll('td, li, .spec-value, .vrednost, dd')];
  for (const el of candidates) {
    const t = el.textContent.trim();
    if (/^\d[\d.]*\s*km$/i.test(t)) return t;
  }
  return '';
}

export function parseYear() {
  return trySelectors([
    '[class*="letnik"]',
    '[class*="year"]',
    '#letnik',
    'td.letnik',
    '.spec-year',
  ]);
}

export function parseImages() {
  // Prefer large gallery images over thumbnails
  const imgs = trySelectorsAll(
    [
      '#Gallery img[src]',
      '.gallery img[src]',
      '.photos img[src]',
      '.slike img[src]',
      '[class*="gallery"] img[src]',
      '[class*="photo"] img[src]',
      '[class*="slika"] img[src]',
      'img[src*="oglas"]',
      'img[src*="photo"]',
    ],
    (el) => el.src
  );

  // Filter out icons / placeholders (< 5 KB size hint by URL patterns)
  const filtered = imgs.filter(
    (src) =>
      src &&
      !src.includes('icon') &&
      !src.includes('logo') &&
      !src.includes('sprite') &&
      !src.includes('placeholder') &&
      (src.startsWith('http') || src.startsWith('//'))
  );

  // De-duplicate
  return [...new Set(filtered)].slice(0, 20);
}

export function parseSellerInfo() {
  const name = trySelectors([
    '.dealer-name',
    '.seller-name',
    '.prodajalec-naziv',
    '[class*="dealer"] [class*="name"]',
    '[class*="seller"] [class*="name"]',
    '#DealerName',
    '.contact-name',
  ]);

  const phone = trySelectors([
    '.dealer-phone',
    '.seller-phone',
    '[class*="phone"]',
    '[class*="telefon"]',
    'a[href^="tel:"]',
  ]);

  const location = trySelectors([
    '.dealer-location',
    '.seller-location',
    '[class*="lokacija"]',
    '[class*="location"]',
    '.kraj',
  ]);

  const type = document.querySelector('[class*="dealer"], [class*="prodajalec"]')
    ? 'dealer'
    : 'private';

  return { name, phone, location, type };
}

export function parseSpecs() {
  const rawPairs = collectSpecPairs();

  const specs = {
    year: parseYear() || findSpecValue(rawPairs, ['letnik', 'year', 'leto izdelave']),
    mileage: parseMileage() || findSpecValue(rawPairs, ['prevoženo', 'prevozeni km', 'kilometri', 'mileage']),
    fuel: findSpecValue(rawPairs, ['gorivo', 'fuel']),
    engine: findSpecValue(rawPairs, ['motor', 'engine', 'prostornina', 'ccm']),
    power: findSpecValue(rawPairs, ['moč', 'power', 'kw', 'konji']),
    transmission: findSpecValue(rawPairs, ['menjalnik', 'transmission', 'mjenjač']),
    color: findSpecValue(rawPairs, ['barva', 'color', 'colour']),
    doors: findSpecValue(rawPairs, ['vrata', 'doors']),
    bodyType: findSpecValue(rawPairs, ['karoserija', 'body', 'tip vozila', 'oblika']),
    drive: findSpecValue(rawPairs, ['pogon', 'drive', 'xdrive', '4x4', '4wd', 'awd']),
    rawPairs,
    rawText: rawPairs.map((pair) => `${pair.label} ${pair.value}`).join(' '),
  };

  for (const key of ['fuel', 'power', 'transmission', 'color', 'doors', 'bodyType', 'drive']) {
    if (isLikelyEquipmentBlob(specs[key])) specs[key] = '';
  }

  return specs;
}

function collectSpecPairs() {
  const pairs = [];
  const seen = new Set();

  const addPair = (label, value) => {
    const cleanLabel = cleanVehicleText(label).replace(/:$/, '');
    const cleanValue = cleanVehicleText(value);
    if (!cleanLabel || !cleanValue || cleanLabel === cleanValue) return;
    if (cleanLabel.length > 80 && !looksLikeSpecLabel(cleanLabel)) return;

    const key = `${toSearchText(cleanLabel)}::${toSearchText(cleanValue)}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ label: cleanLabel, value: cleanValue });
  };

  document.querySelectorAll('tr').forEach((row) => {
    const cells = [...row.children].filter((child) => /^(TH|TD)$/i.test(child.tagName));
    if (cells.length >= 2) {
      addPair(cells[0].textContent, cells.slice(1).map((cell) => cell.textContent).join(' '));
    }
  });

  document.querySelectorAll('dl').forEach((dl) => {
    const children = [...dl.children];
    children.forEach((child, index) => {
      if (child.tagName?.toLowerCase() !== 'dt') return;
      const dd = children.slice(index + 1).find((next) => next.tagName?.toLowerCase() === 'dd');
      if (dd) addPair(child.textContent, dd.textContent);
    });
  });

  document
    .querySelectorAll('.spec-row, .property-row, [class*="spec-item"], [class*="property-item"], [class*="podatek"]')
    .forEach((row) => {
      const labelEl = row.querySelector('.spec-label, .property-label, .label, [class*="label"], [class*="naziv"]');
      const valueEl = row.querySelector('.spec-value, .property-value, .value, [class*="value"], [class*="vrednost"]');
      if (labelEl && valueEl && labelEl !== valueEl) {
        addPair(labelEl.textContent, valueEl.textContent);
        return;
      }

      const children = [...row.children].filter((child) => cleanVehicleText(child.textContent));
      if (children.length >= 2) {
        addPair(children[0].textContent, children.slice(1).map((child) => child.textContent).join(' '));
      }
    });

  return pairs;
}

function findSpecValue(pairs, keys) {
  for (const pair of pairs) {
    if (!labelMatches(pair.label, keys)) continue;
    if (isLikelyEquipmentBlob(pair.value)) continue;
    return pair.value;
  }
  return '';
}

function labelMatches(label, keys) {
  const normalizedLabel = toSearchText(label);
  return keys.some((key) => {
    const normalizedKey = toSearchText(key);
    return normalizedLabel === normalizedKey || normalizedLabel.includes(normalizedKey);
  });
}

function looksLikeSpecLabel(label) {
  return labelMatches(label, [
    'letnik',
    'prevoženo',
    'gorivo',
    'motor',
    'moč',
    'menjalnik',
    'barva',
    'karoserija',
    'pogon',
    'vrata',
  ]);
}

export function parseDescription() {
  return cleanVehicleText(trySelectors([
    '.description-text',
    '.oglas-opis',
    '#opis',
    '[class*="description"]',
    '[class*="opis"]',
    'article p',
  ]));
}

export function parseEquipmentItems() {
  const selectors = [
    '[class*="oprema"] li',
    '[class*="equipment"] li',
    '[class*="feature"] li',
    '.dodatna-oprema li',
    '.vehicle-equipment li',
  ];

  const items = trySelectorsAll(selectors, (el) => cleanVehicleText(el.textContent));
  return [...new Set(items)].filter((item) => item && item.length <= 90);
}

export function isDetailPage() {
  const url = window.location.href.toLowerCase();
  if (
    url.includes('details.asp') ||
    url.includes('/oglas/') ||
    url.includes('/vozilo/')
  ) {
    return true;
  }

  const explicitDetailArea = document.querySelector(
    '.ClassifiedAdContainer, #ClassifiedAd, .oglas-detail, .vehicle-detail, [class*="detail"]'
  );
  const hasSellerContext = document.querySelector(
    '.contact-section, .kontakt, #kontakt, .seller-section, .ClassifiedAdContact, [class*="seller"]'
  );
  const mainArea = explicitDetailArea || (hasSellerContext && document.querySelector('main, article'));
  if (!mainArea) return false;
  return (
    !!document.querySelector('h1') &&
    !!document.querySelector('img') &&
    /\d+\s*€/i.test(mainArea.textContent)
  );
}

export function generateVehicleId(url) {
  // Use URL query param `id` if available — most reliable identifier
  const match = url.match(/[?&]id=(\w+)/i);
  if (match) return `avto_${match[1]}`;

  let cleanUrl = url;
  try {
    const u = new URL(url);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'mc_cid', 'mc_eid',
    ];
    trackingParams.forEach((p) => u.searchParams.delete(p));
    cleanUrl = u.toString();
  } catch {
    // Malformed URL — use as-is
  }

  // cyrb53: 53-bit hash, dramatically lower collision rate than 32-bit Knuth
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < cleanUrl.length; i++) {
    const ch = cleanUrl.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  return `avto_${hash}`;
}

export function collectVehicleData() {
  const url = window.location.href;
  const title = parseTitle();
  const price = parsePrice();
  const specs = parseSpecs();
  const description = normalizeDescription(parseDescription());
  const equipment = parseEquipmentItems();

  const draft = {
    id: generateVehicleId(url),
    url,
    title,
    price,
    priceNum: parsePriceNum(price),
    mileage: specs.mileage || parseMileage(),
    images: parseImages(),
    sellerInfo: parseSellerInfo(),
    description,
    equipment,
    specs,
    savedAt: Date.now(),
    status: 'active',
    priceHistory: [],
  };

  return {
    ...draft,
    equipmentSections: buildEquipmentSections(draft),
  };
}

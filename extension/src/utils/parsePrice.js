/**
 * Shared Euro-price parser used by both the content script (vehicleParser.js)
 * and the background monitor (priceMonitor.js).
 *
 * Handles Slovenian/European formatting:
 *   "12.500 €"     → 12500
 *   "12.500,99 €"  → 12500.99
 *   "12500"        → 12500
 *   "Na povpraševanje" → null
 */
export function parseEuroPrice(text) {
  if (!text) return null;
  // Remove thousand-separators (dots), then normalise decimal comma to dot,
  // then strip every non-numeric character except the decimal point.
  const clean = text
    .replace(/\./g, '')   // "12.500" → "12500"
    .replace(/,/g, '.')   // "12500,99" → "12500.99"
    .replace(/[^\d.]/g, ''); // strip € and whitespace
  if (!clean) return null;
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : null;
}

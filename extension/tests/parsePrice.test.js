import { describe, expect, it } from 'vitest';
import { parseEuroPrice } from '../src/utils/parsePrice.js';

describe('parseEuroPrice', () => {
  it('parses Slovenian and plain euro price formats', () => {
    expect(parseEuroPrice('12.500 €')).toBe(12500);
    expect(parseEuroPrice('12.500,99 €')).toBe(12500.99);
    expect(parseEuroPrice('12500 EUR')).toBe(12500);
  });

  it('returns null for missing or non-price text', () => {
    expect(parseEuroPrice('')).toBeNull();
    expect(parseEuroPrice('Na povpraševanje')).toBeNull();
    expect(parseEuroPrice(null)).toBeNull();
  });
});

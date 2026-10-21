import { describe, expect, it } from 'vitest';
import { analyzeVehicle } from '../src/content/smartAdvisor.js';

function vehicle(overrides = {}) {
  return {
    title: 'Volkswagen Golf 1.5 TSI',
    description: '',
    price: '14.900 €',
    priceNum: 14900,
    specs: {
      year: '2019',
      mileage: '72.000 km',
      fuel: 'Bencin',
    },
    images: new Array(10).fill('https://example.test/car.jpg'),
    sellerInfo: { type: 'dealer', name: 'Test dealer' },
    ...overrides,
  };
}

describe('analyzeVehicle', () => {
  it('uses risk-oriented recommendation labels instead of buy advice', () => {
    const result = analyzeVehicle(vehicle({
      description: 'Servisna knjiga, prvi lastnik, garancija.',
    }));

    expect(result.recommendation).toBe('low_risk');
    expect(result.positives.map((item) => item.label)).toContain('Servisna knjiga prisotna');
  });

  it('flags risky listings without producing purchase instructions', () => {
    const result = analyzeVehicle(vehicle({
      description: 'Havarirano, poškodovano, nujno, ogled ni mogoč.',
      specs: { year: '2010', mileage: '280.000 km' },
      images: [],
    }));

    expect(result.recommendation).toBe('high_risk');
    expect(result.redFlags.length).toBeGreaterThan(1);
  });

  it('keeps price verdict confidence low because it is not market-comparable data', () => {
    const result = analyzeVehicle(vehicle({
      price: '2.000 €',
      priceNum: 2000,
      specs: { year: '2022', mileage: '50.000 km' },
    }));

    expect(result.priceVerdict.verdict).toBe('nenavadno nizka');
    expect(result.priceVerdict.confidence).toBeLessThanOrEqual(30);
    expect(result.priceVerdict.explanation).not.toMatch(/tržna ocena/i);
  });
});

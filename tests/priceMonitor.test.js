// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildVehicleCheckPatch, checkVehicle } from '../src/utils/priceMonitor.js';

const savedVehicle = {
  id: 'avto_test',
  title: 'Test car',
  url: 'https://www.avto.net/Ads/details.asp?id=123',
  price: '10.000 €',
  priceNum: 10000,
  status: 'active',
};

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch({ status = 200, html = '' }) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
  });
}

describe('checkVehicle', () => {
  it('detects a meaningful price change', async () => {
    mockFetch({
      html: '<main><h1>Test car</h1><div class="price">9.400 €</div></main>',
    });

    const result = await checkVehicle(savedVehicle);

    expect(result.changed).toBe(true);
    expect(result.type).toBe('price_change');
    expect(result.oldPrice).toBe(10000);
    expect(result.newPrice).toBe(9400);
  });

  it('does not mark a listing removed on transient network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const result = await checkVehicle(savedVehicle);

    expect(result).toMatchObject({
      changed: false,
      checkFailed: true,
      vehicleId: savedVehicle.id,
      reason: 'network',
    });
  });

  it.each([403, 429, 500, 503])('treats HTTP %i as retryable instead of removed', async (status) => {
    mockFetch({ status, html: '' });

    const result = await checkVehicle(savedVehicle);

    expect(result).toMatchObject({
      changed: false,
      checkFailed: true,
      vehicleId: savedVehicle.id,
      reason: 'http',
      httpStatus: status,
    });
    expect(result.type).toBeUndefined();
  });

  it('treats an unrecognized 200 interstitial as retryable', async () => {
    mockFetch({ html: '<html><body><p>Please try again later.</p></body></html>' });

    await expect(checkVehicle(savedVehicle)).resolves.toMatchObject({
      changed: false,
      checkFailed: true,
      reason: 'unrecognized-page',
    });
  });

  it('detects sold and removed pages from explicit signals', async () => {
    mockFetch({ html: '<main><h1>Prodano: Test car</h1><div class="price">10.000 €</div></main>' });
    await expect(checkVehicle(savedVehicle)).resolves.toMatchObject({ changed: true, type: 'sold' });

    vi.restoreAllMocks();
    mockFetch({ status: 404, html: '' });
    await expect(checkVehicle(savedVehicle)).resolves.toMatchObject({ changed: true, type: 'removed' });
  });
});

describe('buildVehicleCheckPatch', () => {
  it('increments retry failures without mutating listing status', () => {
    expect(
      buildVehicleCheckPatch(
        { ...savedVehicle, consecutiveFailures: 2 },
        { changed: false, checkFailed: true },
        123,
      ),
    ).toEqual({ lastChecked: 123, consecutiveFailures: 3 });
  });

  it('resets failures after a successful unchanged check', () => {
    expect(
      buildVehicleCheckPatch(
        { ...savedVehicle, consecutiveFailures: 2 },
        { changed: false, vehicleId: savedVehicle.id },
        456,
      ),
    ).toEqual({ lastChecked: 456, consecutiveFailures: 0 });
  });
});

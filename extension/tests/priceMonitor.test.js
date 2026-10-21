// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkVehicle } from '../src/utils/priceMonitor.js';

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

    expect(result).toEqual({ changed: false, vehicleId: savedVehicle.id });
  });

  it('detects sold and removed pages from explicit signals', async () => {
    mockFetch({ html: '<main><h1>Prodano: Test car</h1><div class="price">10.000 €</div></main>' });
    await expect(checkVehicle(savedVehicle)).resolves.toMatchObject({ changed: true, type: 'sold' });

    vi.restoreAllMocks();
    mockFetch({ status: 404, html: '' });
    await expect(checkVehicle(savedVehicle)).resolves.toMatchObject({ changed: true, type: 'removed' });
  });
});


describe('MV3 worker safety', () => {
  it.each([403, 429, 500, 503])('keeps listings on HTTP %i', async status => {
    mockFetch({ status });
    expect(await checkVehicle(savedVehicle)).toEqual({ changed: false, vehicleId: savedVehicle.id });
  });
  it('does not read prices or sold signals from executable content', async () => {
    mockFetch({ html: '<h1>Test car</h1><script>sold 1.000 €</script><div class="price">10.000 &euro;</div>' });
    expect((await checkVehicle(savedVehicle)).changed).toBe(false);
  });
  it('never fetches an untrusted saved URL', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    expect((await checkVehicle({ ...savedVehicle, url: 'https://avto.net.evil.example/' })).changed).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

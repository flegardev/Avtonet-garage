import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllData, exportData, importData, getFolders, getSettings, getVehicles, upsertVehicle } from '../src/utils/storage.js';

const store = {};

beforeEach(() => {
  Object.keys(store).forEach((key) => delete store[key]);
  globalThis.chrome = {
    storage: {
      local: {
        get: async (key) => ({ [key]: store[key] }),
        set: async (patch) => Object.assign(store, patch),
      },
    },
  };
});

describe('storage utilities', () => {
  it('backup merge preserves existing records and restores notes on missing cars', async () => {
    await upsertVehicle({id:'one',title:'Original'});
    const count=await importData({version:1,vehicles:[{id:'one',title:'Overwrite',url:'https://www.avto.net/Ads/details.asp?id=1'},{id:'two',title:'Second',url:'https://www.avto.net/Ads/details.asp?id=2',buyerNotes:'Ask about service'}]});
    expect(count).toBe(1);expect((await getVehicles())[0].title).toBe('Original');expect((await getVehicles())[1].buyerNotes).toBe('Ask about service');
  });
  it('rejects an unsafe backup before any writes', async () => {
    expect(()=>importData({version:1,vehicles:[{id:'bad',title:'Bad',url:'javascript:alert(1)'}]})).toThrow();
    expect(await getVehicles()).toEqual([]);
  });
  it('re-saving a listing retains its folder, original save date and price history', async () => {
    await upsertVehicle({ id:'retained', title:'Car', folderId:'mine', savedAt:1, buyerNotes:'Keep this', buyerChecklist:[0], priceHistory:[{price:9000,ts:1}] });
    await upsertVehicle({ id:'retained', title:'Updated car', folderId:'all', savedAt:2, priceHistory:[] });
    expect((await getVehicles())[0]).toMatchObject({ title:'Updated car',folderId:'mine',savedAt:1,buyerNotes:'Keep this',buyerChecklist:[0],priceHistory:[{price:9000,ts:1}] });
  });
  it('normalizes large vehicle payloads before storing', async () => {
    const priceHistory = Array.from({ length: 130 }, (_, index) => ({ price: index, ts: index }));

    await upsertVehicle({
      id: 'car_1',
      title: 'Test car',
      images: new Array(20).fill('https://example.test/car.jpg'),
      description: 'x'.repeat(4000),
      priceHistory,
    });

    const [saved] = await getVehicles();
    expect(saved.images).toHaveLength(12);
    expect(saved.description).toHaveLength(3000);
    expect(saved.priceHistory).toHaveLength(100);
    expect(saved.priceHistory[0].price).toBe(30);
  });

  it('exports and clears local data', async () => {
    await upsertVehicle({ id: 'car_1', title: 'Test car' });
    const exported = await exportData();

    expect(exported.vehicles).toHaveLength(1);
    expect(exported.version).toBe(1);

    await clearAllData();

    expect(await getVehicles()).toEqual([]);
    expect(await getFolders()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'all', locked: true }),
    ]));
    expect(await getSettings()).toMatchObject({ checkIntervalMinutes: 60, notificationsEnabled: true });
  });
});

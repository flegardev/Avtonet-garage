// Integration tests use fresh disposable Chromium profiles and real Chrome APIs.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'output', 'playwright'); fs.mkdirSync(artifacts, { recursive:true });
const browserPath = process.env.EXTENSION_CHROMIUM;
const errors = [];
async function launch(extensionPath, profile) {
  const context = await chromium.launchPersistentContext(profile, {
    headless:true, channel: browserPath ? undefined : 'chromium', executablePath:browserPath,
    viewport:{ width:1280,height:900 },
    args:[`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]
  });
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  const item = page.locator('extensions-item').first();
  await item.waitFor({ timeout:15000 });
  const id = await item.getAttribute('id'); assert.match(id,/^[a-p]{32}$/);
  const popup = await context.newPage();
  popup.on('pageerror', e => errors.push(e.message));
  await popup.goto(`chrome-extension://${id}/popup.html?workspace=1`);
  return { context, page:popup, id };
}
const seedVehicles = [
  { id:'fixture-car-1',title:'Test fixture · Family estate',url:'https://www.avto.net/Ads/details.asp?id=123',priceNum:10000,price:'10.000 €',status:'active',folderId:'all',savedAt:Date.now(),images:[],priceHistory:[{price:11000,ts:Date.now()-86400000},{price:10000,ts:Date.now()}],specs:{year:'2020',mileage:'80.000 km',fuel:'Bencin'} },
  { id:'fixture-car-2',title:'Test fixture · City car',url:'https://www.avto.net/Ads/details.asp?id=124',priceNum:8000,price:'8.000 €',status:'active',folderId:'all',savedAt:Date.now(),images:[],priceHistory:[],specs:{year:'2019',mileage:'50.000 km',fuel:'Dizel'} }
];
async function avtonet() {
  const dir=path.join(root,'dist');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'avtonet-qa-'));
  const {context,page,id}=await launch(dir,profile);
  try {
    const worker=context.serviceWorkers().find(w=>w.url().startsWith(`chrome-extension://${id}/`)) || await context.waitForEvent('serviceworker');
    assert.ok(worker.url().endsWith('background.js'));
    await page.setViewportSize({width:760,height:600});
    await expect(page.getByText('Vaša garaža je prazna')).toBeVisible();
    await page.evaluate(v=>chrome.storage.local.set({ag_vehicles:v}),seedVehicles);
    await page.reload();
    await page.locator('summary').filter({hasText:'Primerjaj'}).click();
    await page.getByLabel(seedVehicles[0].title,{exact:true}).check();
    await page.getByLabel(seedVehicles[1].title,{exact:true}).check();
    await expect(page.getByRole('table')).toBeVisible();
    await page.locator('summary').filter({hasText:'Primerjaj'}).click();
    await page.locator('.vehicle-card').filter({hasText:seedVehicles[0].title}).click();
    await expect(page.getByRole('heading',{name:'Lastništvo in servis'})).toBeVisible();
    await page.getByLabel('Opis',{exact:true}).fill('Test fixture · Oil service');
    await page.getByLabel('Znesek (€)',{exact:true}).fill('135.50');
    await page.getByRole('button',{name:'Dodaj strošek'}).click();
    await expect(page.getByText('Strošek je shranjen.')).toBeVisible();
    await page.getByLabel('Naslednji servis',{exact:true}).fill('2020-01-01');
    await expect(page.getByText('Čas je za servis:',{exact:false})).toBeVisible();
    await page.screenshot({path:path.join(artifacts,'avtonet-ownership-after.png'),fullPage:true});
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.screenshot({path:path.join(artifacts,'avtonet-after.png'),fullPage:true});
    // Exercise the actual MV3 worker parser, without any DOMParser global.
    await worker.evaluate(()=> { globalThis.__originalFetch=fetch; globalThis.fetch=async()=>({ok:true,status:200,text:async()=>'<h1>Fixture car</h1><div class="price">9.000 €</div>'}); });
    const response=await page.evaluate(()=>chrome.runtime.sendMessage({type:'FORCE_CHECK'})); assert.equal(response.ok,true);
    await worker.evaluate(()=> { globalThis.fetch=globalThis.__originalFetch; delete globalThis.__originalFetch; });
    const stored=await page.evaluate(()=>chrome.storage.local.get(['ag_vehicles','ag_ownership']));
    assert.equal(stored.ag_vehicles[0].priceNum,9000); assert.equal(stored.ag_ownership['fixture-car-1'].expenses[0].amount,135.5);
    await page.reload();
    assert.equal((await page.evaluate(()=>chrome.storage.local.get('ag_ownership'))).ag_ownership['fixture-car-1'].expenses.length,1);
    await page.evaluate(()=>chrome.storage.local.set({ag_settings:{notificationsEnabled:false,checkIntervalMinutes:60}}));
    await context.route('https://www.avto.net/Ads/details.asp?id=555', route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><body><main><h1>Test fixture · Content save</h1><div class="price">12.000 €</div><table><tr><td>Letnik:</td><td>2020</td></tr><tr><td>Prevoženih km:</td><td>80.000</td></tr></table></main></body></html>'}));
    const listing=await context.newPage(); listing.on('pageerror',error=>errors.push(error.message));
    await listing.goto('https://www.avto.net/Ads/details.asp?id=555');
    await expect(listing.locator('#ag-advisor')).toContainText('hevristična ocena, brez tržnih podatkov v živo');
    await listing.locator('#ag-save-btn').click();
    await expect(listing.locator('#ag-save-btn')).toContainText('Shranjeno!');
    const saved=await page.evaluate(()=>chrome.storage.local.get('ag_vehicles'));
    assert.ok(saved.ag_vehicles.some(v=>v.title==='Test fixture · Content save'));
    console.log('PASS AvtoNet: empty state, legacy garage, comparison, expenses, due service, storage, keyboard dialog, real MV3 monitor');
  } finally { await context.close(); }
}

avtonet().then(()=>{ assert.deepEqual(errors,[]); }).catch(e=>{ console.error(e); process.exitCode=1; });

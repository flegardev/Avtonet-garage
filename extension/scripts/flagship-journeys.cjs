const {
  chromium,
  expect
} = require('@playwright/test');
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict');
const out = path.resolve(__dirname, '../output/playwright/flagship');
const results = [];
fs.mkdirSync(out, {
  recursive: true
});
async function launch(dir, profile) {
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    executablePath: process.env.EXTENSION_CHROMIUM,
    channel: process.env.EXTENSION_CHROMIUM ? undefined : 'chromium',
    viewport: {
      width: 1280,
      height: 900
    },
    args: [`--disable-extensions-except=${dir}`, `--load-extension=${dir}`]
  });
  const index = await context.newPage();
  await index.goto('chrome://extensions');
  await index.locator('extensions-item').first().waitFor();
  const id = await index.locator('extensions-item').first().getAttribute('id');
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return {
    context,
    page,
    id,
    errors
  };
}
async function shot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(out, name + '.png'),
    fullPage: true
  });
}
async function measure(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const samples = [];
  for (let i = 0; i < 5; i++) {
    await page.reload();
    await page.waitForTimeout(150);
    samples.push(await page.evaluate(() => globalThis.performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd));
  }
  const metrics = await cdp.send('Performance.getMetrics');
  await cdp.detach();
  return {
    domContentLoadedMs: samples,
    medianMs: samples.sort((a, b) => a - b)[2],
    metrics: Object.fromEntries(metrics.metrics.filter(m => ['JSHeapUsedSize', 'Nodes', 'TaskDuration'].includes(m.name)).map(m => [m.name, m.value]))
  };
}
async function avto() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'flagship-avto-'));
  let run = await launch(path.resolve(__dirname, '../dist'), profile);
  let {
    context,
    page,
    id
  } = run;
  try {
    await page.setViewportSize({
      width: 380,
      height: 600
    });
    await page.goto(`chrome-extension://${id}/popup.html`);
    await expect(page.getByRole('button', {
      name: /Odpri mojo garažo/
    })).toBeVisible();
    await shot(page, 'avtonet-launcher-after');
    const opened = context.waitForEvent('page');
    await page.getByRole('button', {
      name: /Odpri mojo garažo/
    }).click();
    const workspace = await opened;
    await workspace.waitForLoadState();
    await expect(workspace.getByText('Vaša garaža je prazna')).toBeVisible();
    const vehicles = [{
      id: 'demo-estate',
      title: 'Škoda Octavia Combi · pregledni primerek',
      url: 'https://www.avto.net/Ads/details.asp?id=123',
      price: '18.900 €',
      priceNum: 18900,
      savedAt: Date.now(),
      status: 'active',
      folderId: 'favourites',
      images: [],
      specs: {
        year: '2021',
        mileage: '82.000 km',
        fuel: 'Dizel'
      },
      priceHistory: [{
        price: 19900,
        ts: Date.now() - 86400000
      }, {
        price: 18900,
        ts: Date.now()
      }]
    }, {
      id: 'demo-city',
      title: 'Volkswagen Golf · pregledni primerek',
      url: 'https://www.avto.net/Ads/details.asp?id=124',
      price: '17.400 €',
      priceNum: 17400,
      savedAt: Date.now() - 1000,
      status: 'active',
      folderId: 'favourites',
      images: [],
      specs: {
        year: '2020',
        mileage: '65.000 km',
        fuel: 'Bencin'
      },
      priceHistory: []
    }];
    await workspace.evaluate(v => chrome.storage.local.set({
      ag_vehicles: v
    }), vehicles);
    await workspace.reload();
    await shot(workspace, 'avtonet-workspace-after');
    await workspace.locator('summary').filter({
      hasText: 'Primerjaj'
    }).click();
    for (const v of vehicles) await workspace.getByLabel(v.title, {
      exact: true
    }).check();
    await expect(workspace.getByText(/\+1.?500 €/)).toBeVisible();
    await shot(workspace, 'avtonet-comparison-after');
    await workspace.locator('.vehicle-card').first().click();
    await workspace.getByLabel('Zapiski za nakup').fill('Vprašaj za račune zadnjega servisa.');
    await workspace.getByLabel('Preverjena servisna zgodovina').check();
    await workspace.getByRole('button', {
      name: 'Shrani zapiske'
    }).click();
    await expect(workspace.getByText('Zapiski in kontrolni seznam so shranjeni.')).toBeVisible();
    await shot(workspace, 'avtonet-detail-after');
    await workspace.keyboard.press('Escape');
    await workspace.getByRole('tab', {
      name: 'Mape',
      exact: true
    }).click();
    await shot(workspace, 'avtonet-folders-after');
    await workspace.getByRole('button', {
      name: 'Obvestila',
      exact: true
    }).first().click();
    await shot(workspace, 'avtonet-notifications-after');
    await workspace.getByRole('button', {
      name: 'Nastavitve',
      exact: true
    }).click();
    await workspace.getByLabel('Obnovi varnostno kopijo (JSON, do 25 MB)').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{bad')
    });
    await expect(workspace.locator('.settings-status')).not.toBeEmpty();
    await shot(workspace, 'avtonet-settings-after');
    const performance = await measure(page);
    assert.deepEqual(run.errors, []);
    await context.close();
    run = await launch(path.resolve(__dirname, '../dist'), profile);
    ({
      context,
      page,
      id
    } = run);
    await page.goto(`chrome-extension://${id}/popup.html`);
    const data = await page.evaluate(() => chrome.storage.local.get('ag_vehicles'));
    assert.equal(data.ag_vehicles[0].buyerNotes, 'Vprašaj za račune zadnjega servisa.');
    results.push({
      product: 'AvtoNetGaraža',
      passed: true,
      performance
    });
  } finally {
    await context.close();
  }
}
avto().then(() => {
  fs.writeFileSync(path.join(out, 'journeys.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}).catch(e => {
  console.error(e);
  process.exitCode = 1;
});

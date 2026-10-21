import {
  getVehicles,
  getSettings,
  saveSettings,
  updateVehicleStatus,
  addNotification,
} from '../utils/storage.js';
import { checkVehicle } from '../utils/priceMonitor.js';
import {
  sendPriceChangeNotification,
  sendSoldNotification,
  sendRemovedNotification,
} from '../utils/notifications.js';

const ALARM_NAME = 'ag_check_vehicles';

// ─── Install / Startup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  scheduleAlarm(settings.checkIntervalMinutes);
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  scheduleAlarm(settings.checkIntervalMinutes);
});

function scheduleAlarm(intervalMinutes) {
  const safeInterval = normalizeInterval(intervalMinutes);
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: safeInterval,
      periodInMinutes: safeInterval,
    });
  });
}

// ─── Alarm handler ────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await runMonitoringCycle();
});

let monitoringCycle = null;
function runMonitoringCycle() {
  if (!monitoringCycle) monitoringCycle = performMonitoringCycle().finally(() => { monitoringCycle = null; });
  return monitoringCycle;
}
async function performMonitoringCycle() {
  const vehicles = await getVehicles();

  // Process in batches of 3 to avoid hammering the server
  const BATCH = 3;
  for (let i = 0; i < vehicles.length; i += BATCH) {
    const batch = vehicles.slice(i, i + BATCH);
    await Promise.all(batch.map(handleVehicleCheck));
    // Short delay between batches
    if (i + BATCH < vehicles.length) {
      await sleep(3000);
    }
  }

  await saveSettings({ lastChecked: Date.now() });
}

async function handleVehicleCheck(vehicle) {
  if (vehicle.status === 'removed' || vehicle.status === 'sold') return;

  try {
    const result = await checkVehicle(vehicle);
    if (!result.changed) return;

    // Persist updated status
    const statusPatch = {
      status: result.type,
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    };
    if (result.type === 'price_change') {
      statusPatch.priceHistory = [
        ...(vehicle.priceHistory ?? []),
        { price: result.newPrice, ts: Date.now() },
      ];
      statusPatch.priceNum = result.newPrice;
      statusPatch.price = `${result.newPrice.toLocaleString('sl-SI')} €`;
    }
    await updateVehicleStatus(vehicle.id, statusPatch);

    // Record notification
    const notif = {
      type: result.type,
      vehicleId: vehicle.id,
      vehicleTitle: vehicle.title,
      message: result.message,
      ...(result.oldPrice && { oldPrice: result.oldPrice, newPrice: result.newPrice }),
    };
    await addNotification(notif);

    const settings = await getSettings();
    if (settings.notificationsEnabled) {
      if (result.type === 'price_change') {
        sendPriceChangeNotification({ title: vehicle.title, oldPrice: result.oldPrice, newPrice: result.newPrice });
      } else if (result.type === 'sold') {
        sendSoldNotification({ title: vehicle.title });
      } else if (result.type === 'removed') {
        sendRemovedNotification({ title: vehicle.title });
      }
    }
  } catch (err) {
    console.warn('[AvtoGarage] Check failed for', vehicle.url, err);
    await updateVehicleStatus(vehicle.id, {
      lastChecked: Date.now(),
      consecutiveFailures: (vehicle.consecutiveFailures ?? 0) + 1,
    });
  }
}

// ─── Messages from content/popup ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return false;
  if (msg.type === 'SAVE_VEHICLE') {
    handleSaveVehicle(msg.payload).then(sendResponse).catch((e) =>
      sendResponse({ ok: false, error: e.message })
    );
    return true; // async
  }
  if (msg.type === 'FORCE_CHECK') {
    runMonitoringCycle().then(() => sendResponse({ ok: true })).catch((e) =>
      sendResponse({ ok: false, error: e.message })
    );
    return true;
  }
  if (msg.type === 'UPDATE_INTERVAL') {
    const minutes = normalizeInterval(msg.payload.minutes);
    saveSettings({ checkIntervalMinutes: minutes }).then((settings) => {
      scheduleAlarm(settings.checkIntervalMinutes);
      sendResponse({ ok: true, settings });
    }).catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

async function handleSaveVehicle(vehicle) {
  if (!vehicle || typeof vehicle.id !== 'string' || typeof vehicle.title !== 'string') throw new Error('Neveljavno vozilo.');
  const url = new URL(vehicle.url);
  if (!['http:', 'https:'].includes(url.protocol) || !(url.hostname === 'avto.net' || url.hostname.endsWith('.avto.net'))) throw new Error('Neveljaven avto.net URL.');
  const { upsertVehicle } = await import('../utils/storage.js');
  const { sendVehicleSavedNotification } = await import('../utils/notifications.js');

  const saved = await upsertVehicle({
    folderId: 'all',
    status: 'active',
    savedAt: Date.now(),
    lastChecked: Date.now(),
    priceHistory: [],
    ...vehicle,
  });

  const settings = await getSettings();
  if (settings.notificationsEnabled) {
    sendVehicleSavedNotification({ title: vehicle.title });
  }
  return { ok: true, count: saved.length };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeInterval(intervalMinutes) {
  return Math.max(1, Math.min(1440, Math.round(Number(intervalMinutes) || 60)));
}

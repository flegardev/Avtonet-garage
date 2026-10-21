const KEYS = {
  VEHICLES: 'ag_vehicles',
  FOLDERS: 'ag_folders',
  SETTINGS: 'ag_settings',
  NOTIFICATIONS: 'ag_notifications',
};

const DEFAULT_FOLDERS = [
  { id: 'all', name: 'Vsa vozila', color: '#f47920', locked: true },
  { id: 'favourites', name: 'Priljubljeni', color: '#f59e0b', locked: false },
];

const DEFAULT_SETTINGS = {
  checkIntervalMinutes: 60,
  notificationsEnabled: true,
  lastChecked: null,
};

const MAX_PRICE_HISTORY = 100;

// ─── Write-queue mutex ───────────────────────────────────────────────────────
// Serialize read-modify-write operations so background checks and popup actions
// cannot clobber each other when they touch storage at the same time.

let _writeChain = Promise.resolve();

function serialized(fn) {
  const run = () => globalThis.navigator?.locks ? navigator.locks.request('ag-storage-write', fn) : fn();
  const next = _writeChain.then(run, run); // run fn even if previous step threw
  _writeChain = next.catch(() => {});    // keep chain alive on error
  return next;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function getVehicles() {
  const r = await chrome.storage.local.get(KEYS.VEHICLES);
  return Array.isArray(r[KEYS.VEHICLES]) ? r[KEYS.VEHICLES] : [];
}

export async function getVehicleById(id) {
  const vehicles = await getVehicles();
  return vehicles.find((v) => v.id === id) ?? null;
}

export function upsertVehicle(vehicle) {
  return serialized(async () => {
    const vehicles = await getVehicles();
    const idx = vehicles.findIndex((v) => v.id === vehicle.id);
    const normalizedVehicle = normalizeVehicle(vehicle);
    if (idx >= 0) {
      const existing = vehicles[idx];
      vehicles[idx] = normalizeVehicle({ ...existing, ...normalizedVehicle,
        folderId: existing.folderId || normalizedVehicle.folderId,
        savedAt: existing.savedAt || normalizedVehicle.savedAt,
        priceHistory: existing.priceHistory?.length ? existing.priceHistory : normalizedVehicle.priceHistory,
      });
    } else {
      vehicles.push(normalizedVehicle);
    }
    await chrome.storage.local.set({ [KEYS.VEHICLES]: vehicles });
    return vehicles;
  });
}

export function removeVehicle(id) {
  return serialized(async () => {
    const vehicles = await getVehicles();
    const filtered = vehicles.filter((v) => v.id !== id);
    await chrome.storage.local.set({ [KEYS.VEHICLES]: filtered });
    return filtered;
  });
}

export function moveVehicleToFolder(vehicleId, folderId) {
  return serialized(async () => {
    const vehicles = await getVehicles();
    const updated = vehicles.map((v) =>
      v.id === vehicleId ? { ...v, folderId } : v
    );
    await chrome.storage.local.set({ [KEYS.VEHICLES]: updated });
    return updated;
  });
}

export function updateVehicleStatus(id, patch) {
  return serialized(async () => {
    const vehicles = await getVehicles();
    const updated = vehicles.map((v) => (v.id === id ? normalizeVehicle({ ...v, ...patch }) : v));
    await chrome.storage.local.set({ [KEYS.VEHICLES]: updated });
    return updated;
  });
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getFolders() {
  const r = await chrome.storage.local.get(KEYS.FOLDERS);
  const folders = Array.isArray(r[KEYS.FOLDERS]) ? r[KEYS.FOLDERS] : [];
  if (!folders.length) return cloneDefaultFolders();

  const byId = new Map(folders.filter((folder) => folder?.id).map((folder) => [folder.id, folder]));
  return cloneDefaultFolders()
    .map((folder) => ({ ...folder, ...(byId.get(folder.id) ?? {}) }))
    .concat(folders.filter((folder) => folder?.id && !DEFAULT_FOLDERS.some((item) => item.id === folder.id)));
}

export async function upsertFolder(folder) {
  return serialized(async () => {
    const folders = await getFolders();
    const idx = folders.findIndex((f) => f.id === folder.id);
    const normalizedFolder = normalizeFolder(folder);
    if (idx >= 0) {
      folders[idx] = normalizeFolder({ ...folders[idx], ...normalizedFolder });
    } else {
      folders.push(normalizedFolder);
    }
    await chrome.storage.local.set({ [KEYS.FOLDERS]: folders });
    return folders;
  });
}

export async function removeFolder(folderId) {
  return serialized(async () => {
    const folders = await getFolders();
    const target = folders.find((f) => f.id === folderId);
    if (!target || target.locked) return folders;

    const filtered = folders.filter((f) => f.id !== folderId);
    await chrome.storage.local.set({ [KEYS.FOLDERS]: filtered });
    const vehicles = await getVehicles();
    const updated = vehicles.map((v) =>
      v.folderId === folderId ? { ...v, folderId: 'all' } : v
    );
    await chrome.storage.local.set({ [KEYS.VEHICLES]: updated });
    return filtered;
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications() {
  const r = await chrome.storage.local.get(KEYS.NOTIFICATIONS);
  return Array.isArray(r[KEYS.NOTIFICATIONS]) ? r[KEYS.NOTIFICATIONS] : [];
}

export async function addNotification(notification) {
  return serialized(async () => {
    const notifications = await getNotifications();
    const entry = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: Date.now(),
      ...notification,
    };
    const trimmed = [entry, ...notifications].slice(0, 100);
    await chrome.storage.local.set({ [KEYS.NOTIFICATIONS]: trimmed });
    return trimmed;
  });
}

export async function markAllNotificationsRead() {
  const notifications = await getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  await chrome.storage.local.set({ [KEYS.NOTIFICATIONS]: updated });
  return updated;
}

export async function clearNotifications() {
  await chrome.storage.local.set({ [KEYS.NOTIFICATIONS]: [] });
  return [];
}

export async function exportData() {
  const [vehicles, folders, settings, notifications] = await Promise.all([
    getVehicles(),
    getFolders(),
    getSettings(),
    getNotifications(),
  ]);
  const { ag_ownership = {} } = await chrome.storage.local.get('ag_ownership');
  return {
    ownership: ag_ownership,
    exportedAt: new Date().toISOString(),
    version: 1,
    vehicles,
    folders,
    settings,
    notifications,
  };
}

export async function clearAllData() {
  return serialized(async () => {
    const folders = cloneDefaultFolders();
    const settings = normalizeSettings(DEFAULT_SETTINGS);
    await chrome.storage.local.set({
      ag_ownership: {},
      [KEYS.VEHICLES]: [],
      [KEYS.FOLDERS]: folders,
      [KEYS.NOTIFICATIONS]: [],
      [KEYS.SETTINGS]: settings,
    });
    return {
      vehicles: [],
      folders,
      notifications: [],
      settings,
    };
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings() {
  const r = await chrome.storage.local.get(KEYS.SETTINGS);
  return normalizeSettings({ ...DEFAULT_SETTINGS, ...(r[KEYS.SETTINGS] ?? {}) });
}

export async function saveSettings(patch) {
  return serialized(async () => {
    const current = await getSettings();
    const merged = normalizeSettings({ ...current, ...patch });
    await chrome.storage.local.set({ [KEYS.SETTINGS]: merged });
    return merged;
  });
}

function cloneDefaultFolders() {
  return DEFAULT_FOLDERS.map((folder) => ({ ...folder }));
}

function normalizeFolder(folder) {
  return {
    id: String(folder.id),
    name: String(folder.name ?? '').trim().slice(0, 40) || 'Mapa',
    color: /^#[0-9a-f]{6}$/i.test(folder.color) ? folder.color : '#6366f1',
    locked: Boolean(folder.locked),
  };
}

function normalizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    checkIntervalMinutes: Math.max(1, Math.min(1440, Math.round(Number(settings.checkIntervalMinutes) || 60))),
    notificationsEnabled: settings.notificationsEnabled !== false,
  };
}

function normalizeVehicle(vehicle) {
  return {
    ...vehicle,
    images: Array.isArray(vehicle.images) ? vehicle.images.slice(0, 12) : [],
    description:
      typeof vehicle.description === 'string'
        ? vehicle.description.slice(0, 3000)
        : vehicle.description,
    priceHistory: Array.isArray(vehicle.priceHistory)
      ? vehicle.priceHistory.slice(-MAX_PRICE_HISTORY)
      : [],
  };
}

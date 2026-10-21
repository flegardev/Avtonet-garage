import { createDemoState } from './demoData.js';

const DEMO_STORAGE_KEY = 'avtonet-garaza-demo-storage-v2';

const hasExtensionStorage = () =>
  Boolean(globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local);

export function installDemoChrome() {
  if (hasExtensionStorage()) return false;
  if (typeof window === 'undefined') return false;

  const listeners = new Set();

  function readStore() {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    const seeded = createDemoState();
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function writeStore(nextStore) {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(nextStore));
  }

  async function get(keys) {
    const store = readStore();

    if (keys === null || keys === undefined) return { ...store };

    if (typeof keys === 'string') {
      return { [keys]: store[keys] };
    }

    if (Array.isArray(keys)) {
      return Object.fromEntries(keys.map((key) => [key, store[key]]));
    }

    if (typeof keys === 'object') {
      return Object.fromEntries(
        Object.entries(keys).map(([key, fallback]) => [key, store[key] ?? fallback])
      );
    }

    return {};
  }

  async function set(items) {
    const previous = readStore();
    const next = { ...previous, ...items };
    writeStore(next);

    const changes = Object.fromEntries(
      Object.keys(items).map((key) => [
        key,
        {
          oldValue: previous[key],
          newValue: next[key],
        },
      ])
    );

    listeners.forEach((listener) => listener(changes, 'local'));
  }

  async function remove(keys) {
    const previous = readStore();
    const next = { ...previous };
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((key) => delete next[key]);
    writeStore(next);
  }

  async function clear() {
    writeStore(createDemoState());
  }

  async function sendMessage(message) {
    const store = readStore();
    if (message?.type === 'UPDATE_INTERVAL') {
      const minutes = message.payload?.minutes ?? store.ag_settings?.checkIntervalMinutes ?? 60;
      await set({
        ag_settings: {
          ...(store.ag_settings ?? {}),
          checkIntervalMinutes: minutes,
          lastChecked: Date.now(),
        },
      });
      return { ok: true };
    }

    if (message?.type === 'FORCE_CHECK') {
      await set({
        ag_settings: {
          ...(store.ag_settings ?? {}),
          lastChecked: Date.now(),
        },
      });
      return { ok: true };
    }

    return { ok: true };
  }

  globalThis.chrome = {
    ...(globalThis.chrome ?? {}),
    storage: {
      ...(globalThis.chrome?.storage ?? {}),
      local: { get, set, remove, clear },
      onChanged: {
        addListener(listener) {
          listeners.add(listener);
        },
        removeListener(listener) {
          listeners.delete(listener);
        },
      },
    },
    runtime: {
      ...(globalThis.chrome?.runtime ?? {}),
      sendMessage,
    },
    tabs: {
      ...(globalThis.chrome?.tabs ?? {}),
      create({ url }) {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
  };

  document.documentElement.classList.add('ag-demo-page');
  return true;
}

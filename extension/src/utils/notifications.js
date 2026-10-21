const ICON = 'icons/icon128.png';

// Deduplicate rapid-fire notifications: track the last notification ID per
// type so we can clear it before creating a new one of the same kind.
const _lastId = {};

function create(key, options) {
  const id = `${key}_${Date.now()}`;
  if (_lastId[key]) {
    chrome.notifications.clear(_lastId[key]);
  }
  _lastId[key] = id;
  chrome.notifications.create(id, options);
}

export function sendPriceChangeNotification({ title, oldPrice, newPrice }) {
  const diff = newPrice - oldPrice;
  const znak = diff < 0 ? '▼ Padla' : '▲ Narasla';
  const abs = Math.abs(diff).toLocaleString('sl-SI');
  const shortTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  create('price', {
    type: 'basic',
    iconUrl: ICON,
    title: `💰 Sprememba cene — ${znak} za ${abs} €`,
    message: shortTitle,
    priority: 1,
  });
}

export function sendSoldNotification({ title }) {
  const shortTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  create('sold', {
    type: 'basic',
    iconUrl: ICON,
    title: '🔴 Vozilo prodano',
    message: shortTitle,
    priority: 2,
  });
}

export function sendRemovedNotification({ title }) {
  const shortTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  create('removed', {
    type: 'basic',
    iconUrl: ICON,
    title: '🗑️ Oglas odstranjen',
    message: shortTitle,
    priority: 1,
  });
}

export function sendVehicleSavedNotification({ title }) {
  const shortTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  create('saved', {
    type: 'basic',
    iconUrl: ICON,
    title: '✅ Vozilo shranjeno v garažo',
    message: shortTitle,
    priority: 0,
  });
}

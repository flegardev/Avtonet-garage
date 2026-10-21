import React, { useState } from 'react';
import { clearNotifications } from '../../utils/storage.js';

const TYPE_CONFIG = {
  price_change: { icon: 'EUR', label: 'Sprememba cene', cls: 'notif--price'   },
  sold:         { icon: '!',   label: 'Prodano',         cls: 'notif--sold'    },
  removed:      { icon: 'X',   label: 'Odstranjeno',     cls: 'notif--removed' },
  saved:        { icon: 'OK',  label: 'Shranjeno',        cls: 'notif--saved'   },
};

function casNazaj(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 30) return new Date(ts).toLocaleDateString('sl-SI');
  if (d > 0)  return `pred ${d} d`;
  if (h > 0)  return `pred ${h} h`;
  if (m > 0)  return `pred ${m} min`;
  return 'Pravkar';
}

export default function NotificationsPanel({ notifications, onDataChange }) {
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleClear() {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    await clearNotifications();
    setConfirmClear(false);
    onDataChange();
  }

  if (notifications.length === 0) {
    return (
      <div className="notif-panel">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 className="empty-title">Še ni obvestil</h3>
          <p className="empty-desc">
            AvtoNetGaraža vas bo obvestila, ko se cena spremeni ali ko je oglas prodan oziroma odstranjen.
          </p>
        </div>
      </div>
    );
  }

  // Group by date for readability
  const grouped = notifications.reduce((acc, n) => {
    const day = new Date(n.createdAt).toLocaleDateString('sl-SI');
    (acc[day] = acc[day] ?? []).push(n);
    return acc;
  }, {});

  return (
    <div className="notif-panel">
      <div className="notif-header">
        <h2 className="section-heading">
          Obvestila
          <span className="notif-total-count">{notifications.length}</span>
        </h2>
        <button
          className={`btn-ghost btn-sm ${confirmClear ? 'btn-ghost--danger' : ''}`}
          onClick={handleClear}
          title={confirmClear ? 'Klikni znova za potrditev' : 'Počisti vsa obvestila'}
        >
          {confirmClear ? 'Potrdi?' : 'Počisti vse'}
        </button>
      </div>

      <div className="notif-list">
        {Object.entries(grouped).map(([day, items]) => (
          <React.Fragment key={day}>
            <div className="notif-day-divider">{day}</div>
            {items.map((n) => {
              const config = TYPE_CONFIG[n.type] ?? { icon: 'i', label: n.type, cls: '' };
              return (
                <div
                  key={n.id}
                  className={`notif-item ${config.cls} ${!n.read ? 'notif--unread' : ''}`}
                >
                  <span className="notif-icon">{config.icon}</span>
                  <div className="notif-content">
                    <div className="notif-type-label">{config.label}</div>
                    <div className="notif-message">{n.message}</div>
                    {n.oldPrice != null && n.newPrice != null && (
                      <div className="notif-price-detail">
                        <span className="old-price">{n.oldPrice.toLocaleString('sl-SI')} €</span>
                        <span className="price-arrow">→</span>
                        <span className={`new-price ${n.newPrice < n.oldPrice ? 'delta--down' : 'delta--up'}`}>
                          {n.newPrice.toLocaleString('sl-SI')} €
                        </span>
                        <span className={`price-diff ${n.newPrice < n.oldPrice ? 'delta--down' : 'delta--up'}`}>
                          ({n.newPrice < n.oldPrice ? '▼' : '▲'} {Math.abs(n.newPrice - n.oldPrice).toLocaleString('sl-SI')} €)
                        </span>
                      </div>
                    )}
                    <div className="notif-time">{casNazaj(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="unread-dot" />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

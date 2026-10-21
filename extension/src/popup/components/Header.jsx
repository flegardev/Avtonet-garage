import React, { useCallback } from 'react';

function casNazaj(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 23) return new Date(ts).toLocaleDateString('sl-SI');
  if (h > 0)  return `pred ${h} h`;
  if (m > 0)  return `pred ${m} min`;
  return 'Pravkar';
}

export default function Header({
  view,
  onViewChange,
  unreadCount,
  onOpenNotifications,
  searchQuery,
  onSearchChange,
  checking,
  onForceCheck,
  lastChecked,
}) {
  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onSearchChange('');
  }, [onSearchChange]);

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span className="logo-text">AvtoNetGaraža</span>
        </div>

        <div className="header-actions">
          {/* Force-check button */}
          <button
            className={`icon-btn ${checking ? 'icon-btn--spinning' : ''}`}
            onClick={onForceCheck}
            disabled={checking}
            title={checking ? 'Preverjam…' : lastChecked ? `Zadnje: ${casNazaj(lastChecked)}` : 'Preveri spremembe'}
            aria-label="Preveri spremembe zdaj"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: checking ? 'ag-spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>

          <button
            className={`icon-btn ${unreadCount > 0 ? 'has-badge' : ''}`}
            onClick={onOpenNotifications}
            title="Obvestila"
            aria-label={`Obvestila${unreadCount > 0 ? ` (${unreadCount} neprebrana)` : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          <button
            className={`icon-btn ${view === 'settings' ? 'active' : ''}`}
            onClick={() => onViewChange('settings')}
            title="Nastavitve"
            aria-label="Nastavitve"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 5a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.23.37.6.6 1 .6h.6a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="search-bar">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Iščite po naslovu, ceni, letniku…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          aria-label="Iskanje vozil"
        />
          {searchQuery && (
          <button
            className="search-clear"
            onClick={() => onSearchChange('')}
            type="button"
            aria-label="Počisti iskanje"
          >✕</button>
        )}
      </div>

      <nav className="nav-tabs" role="tablist">
        <button
          className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          role="tab"
          aria-selected={view === 'dashboard'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Garaža
        </button>
        <button
          className={`nav-tab ${view === 'folders' ? 'active' : ''}`}
          onClick={() => onViewChange('folders')}
          role="tab"
          aria-selected={view === 'folders'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Mape
        </button>
        <button
          className={`nav-tab ${view === 'notifications' ? 'active' : ''} ${unreadCount > 0 ? 'has-dot' : ''}`}
          onClick={onOpenNotifications}
          role="tab"
          aria-selected={view === 'notifications'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Obvestila
          {unreadCount > 0 && <span className="tab-dot" aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
}

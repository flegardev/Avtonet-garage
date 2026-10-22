import React, { useState, useMemo } from 'react';
import VehicleCard from './VehicleCard.jsx';
import Comparison from './Comparison.jsx';

const SORT_OPTIONS = [
  { value: 'savedAt_desc', label: 'Najnoveje shranjeno' },
  { value: 'savedAt_asc',  label: 'Najstarejše shranjeno' },
  { value: 'price_asc',    label: 'Cena: naraščajoče' },
  { value: 'price_desc',   label: 'Cena: padajoče' },
  { value: 'status',       label: 'Status (aktivni prvi)' },
];

const STATUS_ORDER = { active: 0, price_change: 1, sold: 2, removed: 3 };

export default function Dashboard({
  vehicles,
  allVehicles,
  folders,
  activeFolder,
  searchQuery,
  onFolderChange,
  onSelectVehicle,
  onDataChange,
}) {
  const [sort, setSort] = useState('savedAt_desc');

  const sorted = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      switch (sort) {
        case 'savedAt_asc':  return a.savedAt - b.savedAt;
        case 'savedAt_desc': return b.savedAt - a.savedAt;
        case 'price_asc':    return (a.priceNum ?? Infinity) - (b.priceNum ?? Infinity);
        case 'price_desc':   return (b.priceNum ?? 0) - (a.priceNum ?? 0);
        case 'status': {
          const sa = STATUS_ORDER[a.status] ?? 99;
          const sb = STATUS_ORDER[b.status] ?? 99;
          return sa !== sb ? sa - sb : b.savedAt - a.savedAt;
        }
        default: return 0;
      }
    });
  }, [vehicles, sort]);

  const folderCounts = useMemo(() => {
    const source = allVehicles ?? vehicles;
    const counts = { all: source.length };
    source.forEach((v) => {
      if (v.folderId && v.folderId !== 'all') {
        counts[v.folderId] = (counts[v.folderId] ?? 0) + 1;
      }
    });
    return counts;
  }, [allVehicles, vehicles]);

  // Count alerts for sidebar badges
  const alertCounts = useMemo(() => {
    const source = allVehicles ?? vehicles;
    const counts = {};
    source.forEach((v) => {
      if (v.status === 'price_change' || v.status === 'sold' || v.status === 'removed') {
        counts['all'] = (counts['all'] ?? 0) + 1;
        counts[v.folderId] = (counts[v.folderId] ?? 0) + 1;
      }
    });
    return counts;
  }, [allVehicles, vehicles]);

  const summary = useMemo(() => {
    const source = allVehicles ?? vehicles;
    const active = source.filter((v) => v.status === 'active').length;
    const alerts = source.filter((v) => v.status === 'price_change' || v.status === 'sold' || v.status === 'removed').length;
    const priceDrops = source.filter((v) => {
      const history = v.priceHistory ?? [];
      if (history.length < 2) return false;
      return history[history.length - 1].price < history[history.length - 2].price;
    }).length;

    return [
      { label: 'Shranjeno', value: source.length },
      { label: 'Aktivni oglasi', value: active },
      { label: 'Spremembe', value: alerts },
      { label: 'Znižane cene', value: priceDrops },
    ];
  }, [allVehicles, vehicles]);

  return (
    <div className="dashboard">
      {/* Folder sidebar */}
      <aside className="folder-sidebar">
        {folders.map((folder) => (
          <button
            key={folder.id}
            className={`folder-tab ${activeFolder === folder.id ? 'active' : ''}`}
            onClick={() => onFolderChange(folder.id)}
            style={{ '--folder-color': folder.color }}
            type="button"
          >
            <span className="folder-dot" />
            <span className="folder-tab-name">{folder.name}</span>
            <span className="folder-count">{folderCounts[folder.id] ?? 0}</span>
            {alertCounts[folder.id] > 0 && (
              <span className="folder-alert-dot" title="Spremembe" />
            )}
          </button>
        ))}
      </aside>

      {/* Main grid */}
      <div className="dashboard-main">
        <div className="workspace-intro"><h1>Vaš ožji izbor.</h1><p>Primerjajte pomembne razlike, zberite vprašanja za prodajalca in izberite z več zaupanja.</p></div>
        <Comparison vehicles={vehicles} />
        {(allVehicles ?? vehicles).length > 0 && (
          <div className="dashboard-summary" aria-label="Povzetek garaže">
            {summary.map((item) => (
              <div key={item.label} className="summary-tile">
                <span className="summary-value">{item.value}</span>
                <span className="summary-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="toolbar">
            <span className="count-label">
              {sorted.length} {sorted.length === 1 ? 'vozilo' : sorted.length < 5 ? 'vozila' : 'vozil'}
            </span>
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Razvrsti po"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {sorted.length === 0 ? (
          <EmptyState activeFolder={activeFolder} searchQuery={searchQuery} />
        ) : (
          <div className="vehicle-grid">
            {sorted.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                folders={folders}
                onSelect={onSelectVehicle}
                onDataChange={onDataChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ activeFolder, searchQuery }) {
  const isSearchEmpty = Boolean(searchQuery);

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <h3 className="empty-title">
        {isSearchEmpty
          ? 'Ni zadetkov za iskanje'
          : activeFolder === 'all' ? 'Vaša garaža je prazna' : 'V tej mapi ni vozil'}
      </h3>
      <p className="empty-desc">
        {isSearchEmpty ? (
          <>Poskusite z drugim naslovom, ceno, letnikom ali gorivom.</>
        ) : (
          <>
            Brskajte po <strong>avto.net</strong> in kliknite{' '}
            <span className="inline-badge">Shrani v garažo</span> na kateremkoli oglasu.
          </>
        )}
      </p>
    </div>
  );
}

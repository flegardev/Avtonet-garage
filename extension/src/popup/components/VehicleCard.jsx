import React, { useState, useEffect, useRef } from 'react';
import { removeVehicle, moveVehicleToFolder } from '../../utils/storage.js';

const STATUS_CONFIG = {
  active:       { label: 'Aktivno',           cls: 'status--active'   },
  sold:         { label: 'Prodano',            cls: 'status--sold'     },
  removed:      { label: 'Odstranjeno',        cls: 'status--removed'  },
  price_change: { label: 'Cena spremenjena',   cls: 'status--changed'  },
};

export default function VehicleCard({ vehicle, folders, onSelect, onDataChange }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef(null);

  const moveMenuRef = useRef(null);

  const status = STATUS_CONFIG[vehicle.status] ?? STATUS_CONFIG.active;
  const thumb = vehicle.images?.[0];

  const history = vehicle.priceHistory ?? [];
  const priceChanged = history.length >= 2;
  const priceDiff = priceChanged
    ? history[history.length - 1].price - history[history.length - 2].price
    : null;

  useEffect(() => {
    if (!showMoveMenu) return;
    function handleOutsideClick(e) {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target)) {
        setShowMoveMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoveMenu]);

  // Clean up the confirm-delete timer on unmount
  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  async function handleRemove(e) {
    e.stopPropagation();

    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    clearTimeout(confirmTimer.current);
    setConfirmDelete(false);
    setRemoving(true);
    await removeVehicle(vehicle.id);
    onDataChange();
  }

  async function handleMove(e, folderId) {
    e.stopPropagation();
    setShowMoveMenu(false);
    await moveVehicleToFolder(vehicle.id, folderId);
    onDataChange();
  }

  const currentFolder = folders.find((f) => f.id === vehicle.folderId);

  return (
    <div
      className={`vehicle-card ${removing ? 'removing' : ''} ${vehicle.status !== 'active' ? 'card--faded' : ''}`}
      onClick={() => onSelect(vehicle)}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(vehicle);
        }
      }}
    >
      {/* Thumbnail */}
      <div className="card-thumb">
        {thumb ? (
          <img src={thumb} alt={vehicle.title} loading="lazy" />
        ) : (
          <div className="card-thumb-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Status badge */}
        <span className={`status-badge ${status.cls}`}>{status.label}</span>

        {/* Folder chip */}
        {currentFolder && currentFolder.id !== 'all' && (
          <span
            className="folder-chip"
            style={{ background: currentFolder.color + '30', borderColor: currentFolder.color + '60', color: currentFolder.color }}
          >
            {currentFolder.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="card-body">
        <h3 className="card-title" title={vehicle.title}>
          {vehicle.title || 'Neznano vozilo'}
        </h3>

        <div className="card-meta">
          <div className="card-price">
            <span className="price-value">{vehicle.price || 'Ni cene'}</span>
            {priceDiff !== null && priceDiff !== 0 && (
              <span className={`price-delta ${priceDiff < 0 ? 'delta--down' : 'delta--up'}`}>
                {priceDiff < 0 ? '▼' : '▲'} {Math.abs(priceDiff).toLocaleString('sl-SI')} €
              </span>
            )}
          </div>

          <div className="card-specs">
            {vehicle.specs?.year && <span>{vehicle.specs.year}</span>}
            {vehicle.mileage && <span>{vehicle.mileage}</span>}
            {vehicle.specs?.fuel && <span>{vehicle.specs.fuel}</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {/* Move to folder */}
        <div className="action-menu-wrapper" ref={moveMenuRef}>
          <button
            className="card-action-btn"
            title="Premakni v mapo"
            type="button"
            aria-label="Premakni v mapo"
            aria-expanded={showMoveMenu}
            onClick={(e) => { e.stopPropagation(); setShowMoveMenu((v) => !v); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          {showMoveMenu && (
            <div className="action-menu">
              {folders.map((f) => (
                <button
                  key={f.id}
                  className={`action-menu-item ${vehicle.folderId === f.id ? 'active' : ''}`}
                  type="button"
                  onClick={(e) => handleMove(e, f.id)}
                  style={{ '--dot-color': f.color }}
                >
                  <span className="menu-dot" />
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Open link */}
        <button
          className="card-action-btn"
          title="Odpri oglas"
          type="button"
          aria-label="Odpri oglas"
          onClick={(e) => { e.stopPropagation(); chrome.tabs.create({ url: vehicle.url }); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>

        <button
          className={`card-action-btn card-action-btn--danger ${confirmDelete ? 'card-action-btn--confirm' : ''}`}
          title={confirmDelete ? 'Klikni znova za potrditev' : 'Odstrani iz garaže'}
          type="button"
          aria-label={confirmDelete ? 'Potrdi odstranitev iz garaže' : 'Odstrani iz garaže'}
          onClick={handleRemove}
        >
          {confirmDelete ? (
            // Show a "?" icon while waiting for the second confirming click
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

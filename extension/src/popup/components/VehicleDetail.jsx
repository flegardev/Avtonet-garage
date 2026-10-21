import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { removeVehicle, moveVehicleToFolder } from '../../utils/storage.js';
import Ownership from './Ownership.jsx';
import { analyzeVehicle } from '../../content/smartAdvisor.js';
import {
  buildEquipmentSections,
  buildSpecSections,
  normalizeDescription,
} from '../../utils/vehiclePresentation.js';

export default function VehicleDetail({ vehicle, folders, onClose, onDataChange }) {
  const [activeImage, setActiveImage] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const images = vehicle.images ?? [];
  const modalRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    modalRef.current?.querySelector('button')?.focus();
    function trap(event) {
      if (event.key !== 'Tab') return;
      const fields = [...modalRef.current.querySelectorAll('button:not(:disabled),a[href],input,select,textarea')].filter(el => el.getClientRects().length);
      const first = fields[0], last = fields[fields.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    const modal = modalRef.current; modal?.addEventListener('keydown', trap);
    return () => { modal?.removeEventListener('keydown', trap); previous?.focus(); };
  }, []);

  // Keyboard navigation: Escape closes, arrows navigate images
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (images.length < 2) return;
      if (e.key === 'ArrowLeft')  setActiveImage((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActiveImage((i) => (i + 1) % images.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, images.length]);

  // Reset image index when vehicle changes
  useEffect(() => { setActiveImage(0); }, [vehicle.id]);

  async function handleRemove() {
    if (!confirmRemove) { setConfirmRemove(true); return; }
    await removeVehicle(vehicle.id);
    onDataChange();
    onClose();
  }

  async function handleMove(folderId) {
    await moveVehicleToFolder(vehicle.id, folderId);
    onDataChange();
  }

  const priceHistory = vehicle.priceHistory ?? [];
  const hasPriceHistory = priceHistory.length > 1;
  const analysis = useMemo(() => analyzeVehicle(vehicle), [vehicle]);
  const specSections = useMemo(() => buildSpecSections(vehicle), [vehicle]);
  const equipmentSections = useMemo(() => buildEquipmentSections(vehicle), [vehicle]);
  const description = useMemo(() => normalizeDescription(vehicle.description), [vehicle.description]);
  const advisorGroups = useMemo(() => ([
    { key: 'positives', title: 'Prednosti', items: analysis.positives, tone: 'positive' },
    { key: 'warnings', title: 'Opozorila', items: analysis.warnings, tone: 'warning' },
    { key: 'redFlags', title: 'Tveganja', items: analysis.redFlags, tone: 'danger' },
  ].filter((group) => group.items.length > 0)), [analysis]);

  const prevImage = useCallback(
    () => setActiveImage((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const nextImage = useCallback(
    () => setActiveImage((i) => (i + 1) % images.length),
    [images.length]
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={vehicle.title}>
      <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title" title={vehicle.title}>{vehicle.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Zapri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="modal-gallery">
              <div className="gallery-main">
                <img
                  src={images[activeImage]}
                  alt={`${vehicle.title}, fotografija ${activeImage + 1}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {images.length > 1 && (
                  <>
                    <button className="gallery-nav gallery-nav--prev" onClick={prevImage} aria-label="Prejšnja">‹</button>
                    <button className="gallery-nav gallery-nav--next" onClick={nextImage} aria-label="Naslednja">›</button>
                  </>
                )}
                <span className="gallery-counter">{activeImage + 1} / {images.length}</span>
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.slice(0, 8).map((src, i) => (
                    <button
                      key={i}
                      className={`thumb-btn ${i === activeImage ? 'active' : ''}`}
                      aria-label={`Fotografija ${i + 1}`}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={src} alt="" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="modal-info">
            {/* Price + status */}
            <div className="detail-price-row">
              <span className="detail-price">{vehicle.price || 'Ni cene'}</span>
              <StatusBadge status={vehicle.status} />
            </div>

            {/* Price History */}
            {hasPriceHistory && (
              <div className="price-history">
                <h4 className="section-label">Zgodovina cen</h4>
                <div className="price-timeline">
                  {priceHistory.map((entry, i) => {
                    const prev = priceHistory[i - 1];
                    const delta = prev ? entry.price - prev.price : null;
                    return (
                      <div key={i} className="price-event">
                        <span className="pe-date">{new Date(entry.ts).toLocaleDateString('sl-SI')}</span>
                        <span className="pe-price">{entry.price.toLocaleString('sl-SI')} €</span>
                        {delta !== null && delta !== 0 && (
                          <span className={`pe-delta ${delta < 0 ? 'delta--down' : 'delta--up'}`}>
                            {delta < 0 ? '▼' : '▲'} {Math.abs(delta).toLocaleString('sl-SI')} €
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price advisor */}
            {analysis.priceVerdict && (
              <DetailSection title="Cenovni signal" className="detail-section--price">
                <div className="price-verdict-card">
                  <div className="price-verdict-title">
                    <span>{formatVerdict(analysis.priceVerdict.verdict)}</span>
                    <span className="price-confidence">
                      Hevristična ocena, brez tržnih podatkov v živo
                    </span>
                  </div>
                  <p>{analysis.priceVerdict.explanation}</p>
                </div>
              </DetailSection>
            )}

            {advisorGroups.length > 0 && (
              <DetailSection title="Pametni svetovalec">
                <div className="advisor-mini-grid">
                  {advisorGroups.map((group) => (
                    <div key={group.key} className={`advisor-mini advisor-mini--${group.tone}`}>
                      <h5>{group.title}</h5>
                      <ul>
                        {group.items.slice(0, 4).map((item) => (
                          <li key={`${group.key}-${item.label}`} title={item.detail}>
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {specSections.basicRows.length > 0 && (
              <DetailSection title="Osnovni podatki">
                <SpecGrid rows={specSections.basicRows} />
              </DetailSection>
            )}

            {specSections.engineRows.length > 0 && (
              <DetailSection title="Motor in pogon">
                <SpecGrid rows={specSections.engineRows} />
              </DetailSection>
            )}

            {equipmentSections.map((section) => (
              <DetailSection key={section.id} title={section.title}>
                <ul className="equipment-list">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DetailSection>
            ))}

            {description && (
              <DetailSection title="Opis oglasa">
                <p className="description-text">{description}</p>
              </DetailSection>
            )}

            {/* Seller */}
            {vehicle.sellerInfo && (vehicle.sellerInfo.name || vehicle.sellerInfo.location) && (
              <div className="seller-box">
                <h4 className="section-label">Prodajalec</h4>
                <div className="seller-info">
                  {vehicle.sellerInfo.name && (
                    <div className="seller-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {vehicle.sellerInfo.name}
                    </div>
                  )}
                  {vehicle.sellerInfo.phone && (
                    <div className="seller-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <a href={`tel:${vehicle.sellerInfo.phone}`} style={{ color: 'inherit' }}>
                        {vehicle.sellerInfo.phone}
                      </a>
                    </div>
                  )}
                  {vehicle.sellerInfo.location && (
                    <div className="seller-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {vehicle.sellerInfo.location}
                    </div>
                  )}
                  <div className="seller-type-badge">
                    {vehicle.sellerInfo.type === 'dealer' ? 'Trgovec' : 'Zasebnik'}
                  </div>
                </div>
              </div>
            )}

            <Ownership key={vehicle.id} vehicleId={vehicle.id} />

            {/* Move to folder */}
            <div className="move-folder-row">
              <h4 className="section-label">Mapa</h4>
              <div className="folder-chips">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    className={`folder-chip-btn ${vehicle.folderId === f.id ? 'active' : ''}`}
                    style={{ '--fc': f.color }}
                    onClick={() => handleMove(f.id)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved metadata */}
            <div className="detail-meta">
              {vehicle.savedAt && (
                <span className="meta-item">
                  Shranjeno: {new Date(vehicle.savedAt).toLocaleDateString('sl-SI')}
                </span>
              )}
              {vehicle.lastChecked && (
                <span className="meta-item">
                  Zadnje preverjanje: {new Date(vehicle.lastChecked).toLocaleDateString('sl-SI')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => chrome.tabs.create({ url: vehicle.url })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Odpri oglas
          </button>
          <button
            className={`btn-danger ${confirmRemove ? 'btn-danger--confirm' : ''}`}
            onClick={handleRemove}
            title={confirmRemove ? 'Klikni znova za potrditev' : 'Odstrani iz garaže'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            {confirmRemove ? 'Potrdi brisanje' : 'Odstrani'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    active:       { label: 'Aktivno',          cls: 'status--active'   },
    sold:         { label: 'Prodano',           cls: 'status--sold'     },
    removed:      { label: 'Odstranjeno',       cls: 'status--removed'  },
    price_change: { label: 'Cena spremenjena',  cls: 'status--changed'  },
  }[status] ?? { label: 'Aktivno', cls: 'status--active' };
  return <span className={`status-badge ${config.cls}`}>{config.label}</span>;
}

function DetailSection({ title, className = '', children }) {
  return (
    <section className={`detail-section ${className}`}>
      <h4 className="section-label">{title}</h4>
      {children}
    </section>
  );
}

function SpecGrid({ rows }) {
  return (
    <div className="specs-grid">
      {rows.map(([label, value]) => (
        <div key={label} className="spec-item">
          <span className="spec-label">{label}</span>
          <span className="spec-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

function formatVerdict(value) {
  if (!value) return '';
  return value.charAt(0).toLocaleUpperCase('sl-SI') + value.slice(1);
}

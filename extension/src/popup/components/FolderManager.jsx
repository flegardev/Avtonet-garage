import React, { useState, useEffect, useRef } from 'react';
import { upsertFolder, removeFolder } from '../../utils/storage.js';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

function generateId() {
  return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function FolderManager({ folders, vehicles, onDataChange }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Focus input when form opens
  useEffect(() => {
    if ((creating || editingId) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating, editingId]);

  function vehicleCount(folderId) {
    if (folderId === 'all') return vehicles.length;
    return vehicles.filter((v) => v.folderId === folderId).length;
  }

  function startCreate() {
    setName('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setCreating(true);
    setEditingId(null);
    setError('');
  }

  function startEdit(folder) {
    setName(folder.name);
    setColor(folder.color);
    setEditingId(folder.id);
    setCreating(false);
    setError('');
  }

  function cancelForm() {
    setCreating(false);
    setEditingId(null);
    setName('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Ime mape ne sme biti prazno.'); return; }

    // Prevent duplicate folder names (case-insensitive)
    const isDupe = folders.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== editingId
    );
    if (isDupe) { setError('Mapa s tem imenom že obstaja.'); return; }

    await upsertFolder({ id: editingId ?? generateId(), name: trimmed, color, locked: false });
    cancelForm();
    onDataChange();
  }

  async function handleDelete(folder) {
    await removeFolder(folder.id);
    onDataChange();
  }

  return (
    <div className="folder-manager">
      <div className="folder-manager-header">
        <h2 className="section-heading">Mape</h2>
        <button className="btn-primary btn-sm" onClick={startCreate}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nova mapa
        </button>
      </div>

      {/* Create / Edit form */}
      {(creating || editingId) && (
        <form className="folder-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className={`folder-input ${error ? 'folder-input--error' : ''}`}
            type="text"
            placeholder="Ime mape…"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            maxLength={40}
            aria-label="Ime mape"
            aria-invalid={Boolean(error)}
          />
          {error && <div className="folder-form-error">{error}</div>}
          <div className="color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Barva mape ${c}`}
              />
            ))}
          </div>
          <div className="folder-preview" style={{ borderColor: color, color }}>
            <span className="folder-dot" style={{ background: color }} />
            {name || 'Predogled…'}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-sm">
              {editingId ? 'Shrani' : 'Ustvari'}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={cancelForm}>
              Prekliči
            </button>
          </div>
        </form>
      )}

      {/* Folder list */}
      <div className="folders-list">
        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            count={vehicleCount(folder.id)}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function FolderRow({ folder, count, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    clearTimeout(timerRef.current);
    setConfirmDelete(false);
    onDelete(folder);
  }

  return (
    <div className="folder-row">
      <div className="folder-row-info">
        <span className="folder-color-dot" style={{ background: folder.color }} />
        <span className="folder-row-name">{folder.name}</span>
        <span className="folder-row-count">{count}</span>
      </div>
      {!folder.locked ? (
        <div className="folder-row-actions">
          <button
            className="icon-btn-sm"
            title="Uredi"
            type="button"
            aria-label={`Uredi mapo ${folder.name}`}
            onClick={() => onEdit(folder)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            className={`icon-btn-sm ${confirmDelete ? 'icon-btn-sm--confirm' : 'icon-btn-sm--danger'}`}
            title={confirmDelete ? 'Klikni znova za potrditev' : 'Izbriši mapo'}
            type="button"
            aria-label={confirmDelete ? `Potrdi izbris mape ${folder.name}` : `Izbriši mapo ${folder.name}`}
            onClick={handleDeleteClick}
          >
            {confirmDelete ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            )}
          </button>
        </div>
      ) : (
        <span className="locked-tag">Sistemsko</span>
      )}
    </div>
  );
}

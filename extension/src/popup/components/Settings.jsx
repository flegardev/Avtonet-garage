import React, { useEffect, useState } from 'react';
import { clearAllData, exportData, saveSettings } from '../../utils/storage.js';

export default function Settings({ settings, onDataChange }) {
  const [interval, setInterval] = useState(settings.checkIntervalMinutes ?? 60);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [status, setStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setInterval(settings.checkIntervalMinutes ?? 60);
    setNotificationsEnabled(settings.notificationsEnabled ?? true);
  }, [settings.checkIntervalMinutes, settings.notificationsEnabled]);

  async function handleNotificationsChange(e) {
    const enabled = e.target.checked;
    setNotificationsEnabled(enabled);
    try {
      await saveSettings({ notificationsEnabled: enabled });
      setStatus(enabled ? 'Obvestila so vklopljena.' : 'Obvestila so izklopljena. Spremljanje ostane aktivno.');
      onDataChange();
    } catch (err) {
      setNotificationsEnabled(!enabled);
      setStatus(err.message ?? 'Nastavitve ni bilo mogoče shraniti.');
    }
  }

  async function handleIntervalSubmit(e) {
    e.preventDefault();
    const minutes = Math.max(1, Math.min(1440, Math.round(Number(interval) || 60)));
    setInterval(minutes);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_INTERVAL',
        payload: { minutes },
      });
      if (!response?.ok) throw new Error(response?.error ?? 'Intervala ni bilo mogoče shraniti.');
      setStatus(`Preverjanje nastavljeno na ${minutes} min.`);
      onDataChange();
    } catch (err) {
      setStatus(err.message ?? 'Intervala ni bilo mogoče shraniti.');
    }
  }

  async function handleExport() {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `avtonet-garaza-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Izvoz je pripravljen kot JSON datoteka.');
    } catch (err) {
      setStatus(err.message ?? 'Izvoza ni bilo mogoče kopirati.');
    }
  }

  async function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      setStatus('Kliknite znova za potrditev brisanja vseh lokalnih podatkov.');
      window.setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    try {
      await clearAllData();
      setConfirmClear(false);
      setStatus('Vsi lokalni podatki so odstranjeni.');
      onDataChange();
    } catch (err) {
      setStatus(err.message ?? 'Podatkov ni bilo mogoče odstraniti.');
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2 className="section-heading">Nastavitve</h2>
        {status && <span className="settings-status">{status}</span>}
      </div>

      <section className="settings-section">
        <div className="settings-row">
          <div>
            <h3>Chrome obvestila</h3>
            <p>Spremljanje cen in statusa deluje tudi, ko so obvestila izklopljena.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleNotificationsChange}
              aria-label="Vklopi ali izklopi Chrome obvestila"
            />
            <span className="switch-slider" />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <form className="settings-row settings-row--form" onSubmit={handleIntervalSubmit}>
          <div>
            <h3>Interval preverjanja</h3>
            <p>Najmanj 1 minuta, največ 24 ur.</p>
          </div>
          <div className="interval-control">
            <input
              type="number"
              min="1"
              max="1440"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              aria-label="Interval preverjanja v minutah"
            />
            <button type="submit" className="btn-primary btn-sm">Shrani</button>
          </div>
        </form>
      </section>

      <section className="settings-section">
        <div className="settings-row">
          <div>
            <h3>Podatki</h3>
            <p>Podatki ostanejo lokalno v brskalniku. Izvoz prenese JSON varnostno kopijo.</p>
          </div>
          <div className="settings-actions">
            <button type="button" className="btn-secondary" onClick={handleExport}>
              Izvozi
            </button>
            <button
              type="button"
              className={`btn-danger ${confirmClear ? 'btn-danger--confirm' : ''}`}
              onClick={handleClearAll}
            >
              {confirmClear ? 'Potrdi brisanje' : 'Počisti vse'}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section settings-section--about">
        <div>
          <h3>AvtoNetGaraza</h3>
          <p>Če vam razširitev koristi, lahko razvoj podprete prek PayPala.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => chrome.tabs.create({ url: 'https://www.paypal.com/paypalme/TiniFlegar' })}
        >
          Podpri razvoj
        </button>
      </section>
    </div>
  );
}

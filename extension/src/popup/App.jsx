import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import FolderManager from './components/FolderManager.jsx';
import VehicleDetail from './components/VehicleDetail.jsx';
import NotificationsPanel from './components/NotificationsPanel.jsx';
import Settings from './components/Settings.jsx';
import {
  getVehicles,
  getFolders,
  getNotifications,
  getSettings,
  markAllNotificationsRead,
} from '../utils/storage.js';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeFolder, setActiveFolder] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [checking, setChecking] = useState(false);

  const loadData = useCallback(async () => {
    const [v, f, n, s] = await Promise.all([
      getVehicles(),
      getFolders(),
      getNotifications(),
      getSettings(),
    ]);
    setVehicles(v);
    setFolders(f);
    setNotifications(n);
    setSettings(s);
    setLoadError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData().catch((err) => {
      console.error('[AvtoGaraža] Failed to load data', err);
      setLoadError('Podatkov ni bilo mogoče naložiti. Zaprite in znova odprite razširitev.');
      setLoading(false);
    });
  }, [loadData]);

  // Keep UI in sync when storage changes (e.g. from background script)
  useEffect(() => {
    const handler = (changes) => {
      if (changes.ag_vehicles) setVehicles(changes.ag_vehicles.newValue ?? []);
      if (changes.ag_folders) setFolders(changes.ag_folders.newValue ?? []);
      if (changes.ag_notifications) setNotifications(changes.ag_notifications.newValue ?? []);
      if (changes.ag_settings) setSettings((s) => ({ ...s, ...changes.ag_settings.newValue }));
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenNotifications = async () => {
    setView('notifications');
    if (unreadCount > 0) {
      const updated = await markAllNotificationsRead();
      setNotifications(updated);
    }
  };

  const handleForceCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await chrome.runtime.sendMessage({ type: 'FORCE_CHECK' });
      await loadData();
    } catch (err) {
      console.error('[AvtoGaraža] Force check failed', err);
      setLoadError('Preverjanje trenutno ni uspelo. Poskusite znova pozneje.');
    } finally {
      setChecking(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const folderMatch = activeFolder === 'all' || v.folderId === activeFolder;
    if (!folderMatch) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.title?.toLowerCase().includes(q) ||
      v.price?.toLowerCase().includes(q) ||
      v.specs?.year?.includes(q) ||
      v.mileage?.toLowerCase().includes(q) ||
      v.specs?.fuel?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        view={view}
        onViewChange={setView}
        unreadCount={unreadCount}
        onOpenNotifications={handleOpenNotifications}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        checking={checking}
        onForceCheck={handleForceCheck}
        lastChecked={settings.lastChecked}
      />

      <div className="app-body">
        {loadError && (
          <div className="app-alert" role="alert">
            {loadError}
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard
            vehicles={filteredVehicles}
            allVehicles={vehicles}
            folders={folders}
            activeFolder={activeFolder}
            searchQuery={searchQuery}
            onFolderChange={setActiveFolder}
            onSelectVehicle={setSelectedVehicle}
            onDataChange={loadData}
          />
        )}

        {view === 'folders' && (
          <FolderManager
            folders={folders}
            vehicles={vehicles}
            onDataChange={loadData}
          />
        )}

        {view === 'notifications' && (
          <NotificationsPanel
            notifications={notifications}
            onDataChange={loadData}
          />
        )}

        {view === 'settings' && (
          <Settings
            settings={settings}
            onDataChange={loadData}
          />
        )}
      </div>

      {selectedVehicle && (
        <VehicleDetail
          vehicle={vehicles.find((v) => v.id === selectedVehicle.id) ?? selectedVehicle}
          folders={folders}
          onClose={() => setSelectedVehicle(null)}
          onDataChange={loadData}
        />
      )}
    </div>
  );
}

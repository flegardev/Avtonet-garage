import React from 'react';
import { createRoot } from 'react-dom/client';
import { installDemoChrome } from '../utils/demoChrome.js';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/globals.css';
import './styles/flagship.css';
import Launcher from './components/Launcher.jsx';

installDemoChrome();
const workspace = new URLSearchParams(location.search).has('workspace') || location.protocol !== 'chrome-extension:';
document.documentElement.classList.add(workspace ? 'garage-workspace' : 'garage-launcher');

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    {workspace ? <App /> : <Launcher />}
  </ErrorBoundary>
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { installDemoChrome } from '../utils/demoChrome.js';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/globals.css';

installDemoChrome();

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

# AvtoNetGaraža

> Chrome Extension — Save, track and analyse vehicle listings from [avto.net](https://www.avto.net) with a built-in Smart Advisor.

---

## Features

| Feature | Details |
|---|---|
| **Save Vehicle** | Floating button injected on every avto.net detail page |
| **Smart Advisor** | 0–100 risk-signal engine: red flags, positives, and rough price sanity checks |
| **Price Monitoring** | Background service worker polls saved listings hourly |
| **Price History** | Tracks every detected price change over time |
| **Sold / Removed Detection** | Automatically marks listings that disappear |
| **Chrome Notifications** | Optional alerts on price change, sold, or removed |
| **Settings** | Notification toggle, monitoring interval, export, and local data reset |
| **Folders** | Organise saved vehicles into custom colour-coded categories |
| **Dark UI** | Glassmorphism popup — 700 × 620 px |

Monitoring changes status only when the response supplies definitive evidence. HTTP 404/410 and explicit sold/removed page signals are actionable; network failures, throttling, server errors, empty responses, and unrecognized interstitials are recorded as retry failures without marking a vehicle removed.

---

## Quick Start

```bash
npm install
npm run build        # production build → dist/
npm run dev          # watch mode (rebuilds on save)
```

Load in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder

---

## Project Structure

```
src/
├── background/
│   └── service-worker.js      — alarms, polling cycle, message handler
├── content/
│   ├── index.js               — injection entry + MutationObserver + SPA nav
│   ├── vehicleParser.js       — DOM extraction (title, price, images, specs…)
│   ├── saveButton.js          — floating save button + Smart Advisor panel
│   ├── smartAdvisor.js        — scoring engine (0–100) + risk signals
│   └── content.css            — injected styles (ag- prefix)
├── popup/
│   ├── index.jsx              — React root + ErrorBoundary
│   ├── App.jsx                — state, storage sync, force-check
│   ├── components/
│   │   ├── Header.jsx         — search, nav tabs, force-check button
│   │   ├── Dashboard.jsx      — vehicle grid + folder sidebar + alert dots
│   │   ├── VehicleCard.jsx    — card with two-step delete + move menu
│   │   ├── VehicleDetail.jsx  — modal: gallery, price history, specs, seller
│   │   ├── FolderManager.jsx  — create/edit/delete folders with live preview
│   │   ├── NotificationsPanel.jsx — grouped by day, confirm clear
│   │   ├── Settings.jsx       — notification, interval, export, reset
│   │   └── ErrorBoundary.jsx  — catches render crashes gracefully
│   └── styles/globals.css     — full design system (CSS variables)
└── utils/
    ├── storage.js             — Chrome storage CRUD with write-queue mutex
    ├── parsePrice.js          — shared Euro price parser (content + SW)
    ├── priceMonitor.js        — fetch + status diff logic (15 s timeout)
    └── notifications.js       — chrome.notifications helpers
```

---

## Smart Advisor Scoring

Score **0–100** computed from weighted signals found in listing text, specs, and metadata:

| Signal | Points |
|---|---|
| Low mileage (< 80k km) | +15 |
| Service history / warranty / inspection | +10 each |
| Many photos, garaged, first owner | +5–8 each |
| Red-flag keyword (accident, urgent, as-is, no test drive…) | −12 each |
| Very high mileage (> 250k km) | −20 |
| High mileage (> 150k km) | −10 |
| Unusual price sanity-check signal | −3 |

**≥ 62** → Nižje zaznano tveganje
**38–61** → Preverite podrobnosti
**< 38** → Višje zaznano tveganje

Price signals are intentionally conservative. They are not live market valuations and should be compared against current similar listings.

---

## Architecture Notes

- **Manifest V3** — service worker background, no persistent background page
- **React 18** + Webpack 5 bundled into three entry points: `background.js`, `content.js`, `popup.js`
- **Write-queue mutex** in `storage.js` serialises all `chrome.storage.local` writes to prevent race conditions between the monitoring cycle and manual saves
- **Shared price parser** (`utils/parsePrice.js`) used by both content script and service worker to guarantee identical number parsing
- **SPA navigation** handled by `MutationObserver` + `popstate` listener with injection-state reset on URL change
- **ErrorBoundary** wraps the entire React tree — corrupted storage data shows a recovery screen instead of a blank popup

---

## Development

```bash
npm run dev          # webpack watch mode — reload extension after each build
npm run build        # minified production build
npm run test         # 19 focused unit tests for parsing, scoring, storage, and monitor state
npm run validate     # tests + high-severity audit + production build
npm run clean        # remove dist/ cross-platform
```

After rebuilding, reload the unpacked extension from `chrome://extensions`.

---

## Support

A **Podpri razvoj** button is available in Settings.

## Author

**Tini Flegar** — Full-Stack Developer · IT & Finance. Contact: [flegardev@gmail.com](mailto:flegardev@gmail.com).


## Portfolio & Source Rights

This project is part of the [Tini Flegar Software Engineering Portfolio](https://github.com/flegardev/flegartech-site).

The source code is publicly visible for portfolio review and demonstration. For usage terms and rights, please see [PORTFOLIO_USE.md](PORTFOLIO_USE.md).


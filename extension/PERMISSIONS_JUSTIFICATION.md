# Permission Justification — AvtoNetGaraža

Single purpose: **save avto.net vehicle listings, track their price/status changes, and notify the user.** All data is stored locally; no analytics or external servers.

## `permissions`
| Permission | Why it is needed |
|------------|------------------|
| `storage` | Persist saved vehicles and their price/status history via `chrome.storage`. Local only. |
| `alarms` | Periodically re-check saved listings for price/status changes in the background (MV3 has no persistent page). |
| `notifications` | Notify the user when a saved vehicle's price drops or its ad status changes. |

## `host_permissions`: `*://*.avto.net/*`
Scoped to **avto.net only**. Required so the content script can read the current listing (title, price, specs, images) on detail pages and inject the "Shrani v garažo" save button, and so the background re-check can fetch updated listing pages. No other domains are accessed.

## Resilience (store-review relevant)
The parser (`src/content/vehicleParser.js`) uses **multiple selector strategies with text-pattern and `og:`/meta fallbacks**, each wrapped in `try/catch`. The advisor/save UI anchors to a fallback chain (`.contact-section`/`.kontakt`/… → nearest `<section>` → `<main>`). If avto.net changes its markup, parsing degrades gracefully (returns nulls / skips injection) instead of throwing.

## Not requested
- ❌ `tabs`, `<all_urls>`, `webRequest`, `cookies`, `history`.
- ❌ No remote code, no `eval` (MV3 module service worker, default CSP).

## Data handling
Local only — see [PRIVACY.md](PRIVACY.md). No data leaves the device.

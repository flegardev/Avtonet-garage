# Testing Checklist — AvtoNetGaraža

## Automated (CI + local)
- [x] `npm run lint` — ESLint clean
- [x] `npm run test` — 10 unit tests pass (parser/utils)
- [x] `npm run build` — webpack production build to `dist/`
- [x] `npm audit --audit-level=high` — 0 high/critical
- [x] `npm run package` — ZIP built with forward-slash entries, integrity-verified

## Manual browser test (load unpacked `dist/`)
1. `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`.
2. Confirm no errors on the extension card; service worker starts.
3. Visit an avto.net vehicle **detail** page:
   - [ ] "Shrani v garažo" button is injected.
   - [ ] Clicking saves the vehicle (title, price, image parsed correctly).
   - [ ] Smart advisor panel appears and is collapsible.
4. Open the popup:
   - [ ] Saved vehicles list renders; duplicate saves are de-duplicated.
   - [ ] Removing a vehicle works.
5. Resilience:
   - [ ] On a non-detail avto.net page, nothing is injected and no console errors.
   - [ ] Parser returns gracefully (no throw) if expected elements are missing.
6. Notifications/alarms:
   - [ ] Background re-check alarm is registered (inspect service worker).
7. Reload / disable / re-enable the extension — state persists, no errors.

> Do not generate abusive traffic against avto.net during testing.

# Verification on 2026-10-21

Candidate 1.1.0, previous 1.0.4.

- Static validation/lint: passed.
- Unit and UI checks: 26 extension unit tests + 8 module tests, passed.
- Browser: Real MV3 worker monitor, comparison, expenses, service date, empty state, legacy garage and dialog keyboard flow passed.
- Upgrade fixture: old extension files replaced in the same disposable-profile path; identity and seeded data retained.
- Dependency audit: zero findings in each package root as checked locally.
- Manifest asset existence: passed.
- Store upload, submission and publication: not performed.
- Live marketplace variations and full YouTube playback: not verified by offline fixtures.
- CI: see the current PR checks; local checks do not imply hosted CI passed.

The actual published CRX was retrieved from Google on 2026-10-21. SHA256: `b76dcb12cc934114754213b858ade3c728ce6f47f6fe2007b95921fb6dc75969`. Historical source: `refs/pull/1/head`. Published compiled worker and popup were inspected alongside recovered sources.

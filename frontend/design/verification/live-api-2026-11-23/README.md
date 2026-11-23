# Live API browser smoke — 2026-11-23

Environment: Vite HTTP mode, actual FastAPI, dedicated PostgreSQL 14 database,
three synthetic shelters. Servers were stopped at the start and were restarted.
Browser: in-app browser; mobile layout and explicit 390x844 / 1440x900 viewports.
Viewport override reset after inspection. Language restored to Ukrainian.

## Observed passes

- Catalog and custom map pins load; shelter detail displays API address and facilities.
- Details can close and reopen; both mobile dialog and desktop side panel observed.
- EN/UA updates UI and retains selected shelter. Backend-only Ukrainian strings
  correctly remain Ukrainian when no English translation is supplied.
- Switching locale while desktop detail is open leaves view count unchanged (4 → 4).
- Required empty feedback form disables submit; filled site feedback reaches
  Feedback sent after real API submission. Synthetic Browser QA feedback remains in DB.
- Search Метро returns the server record; Escape clears/exits search.
- Mobile menu opens/closes; exit content remains mounted transiently for animation.

## Limits / follow-up

- Not a frame-time, Lighthouse or pixel-perfect audit. Screenshot captures a closing
  transition, not a settled reference layout.
- An immediate menu click during detail dismissal did not open the menu; a click
  after dismissal succeeded. Investigate transition hit testing before calling this
  behavior fully verified.
- Reopening details was exercised, but exact per-opening view deltas were not
  isolated for every action; only locale no-duplication was measured directly.
- Slow/offline API, 429, full keyboard trap/focus and physical devices remain to test.
- Console retained Vite websocket and dynamic-import errors from initial stopped
  server state; after restart/reload the map rendered. No claim of clean logs across
  a fresh dedicated console capture is made.
- Docker and production deployment remain pending.

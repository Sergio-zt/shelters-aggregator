# Desktop and tablet verification — 2026-11-06

Reference: Figma `Desktop · MVP (1440)` and `Handoff · Responsive layout` (node `498-12732`).

## Layout

- Below 768 px: full-width mobile layout, draggable result sheets and two-position informational sheets.
- 768–1023 px: 360 px fixed sidebar; from 1024 px: 390 px sidebar.
- Desktop top bar: 64 px. Sidebar search region: 84 px. Content starts at y=148 and scrolls inside the available height.
- Desktop panels are nonmodal and replace sidebar content. There is no mobile scrim or drag handle. Discard confirmation covers the entire viewport with a scrim and centered dialog.
- The map occupies the remaining width. Controls sit at bottom right, original pins render at 32 px, and Search this area keeps its five-second idle delay.

## Browser verification

Raw observations: `browser-checks.json`. Checked widths: 390, 767, 768, 1023, 1024, 1440 and 1920 px. None introduced horizontal page overflow. Also inspected state/form panels at 1024 × 600 and captured final views at 1024 × 768 and 768 × 900.

Verified interactions:

- Open details from a result, keep the selected pin visible to the right of the sidebar, and close back to the list.
- Filters in the sidebar; mobile Escape dismissal; a drafted 24/7 filter survives resizing to mobile.
- Desktop search suggestions and Escape cancellation, with the map still accessible.
- A dirty add-shelter form prompts before navigation/search replaces it. Keep editing retains its draft; Discard continues the requested navigation.
- Form values survive desktop → mobile → desktop, while semantics switch between nonmodal region and modal dialog.
- Discard confirmation is centered over the entire window and isolates keyboard focus.
- Tab from the final panel action reaches the map canvas; Shift+Tab returns to the panel.
- Mobile empty-state panel retains its shown/collapsed cycle.
- Loading, list error, location permission/denied/outside/steps, details loading/error, sent, and feedback panels fit the desktop sidebar. Footer actions remain inside the short viewport.

Screenshots: `desktop-1024.jpg`, `tablet-768.jpg`, `mobile-390.jpg`, `filters-1024.jpg`, `discard-1024.jpg`. These are browser captures, not physical-device or frame-rate measurements. Earlier Lighthouse reports cover earlier versions; Lighthouse was not rerun for this adaptation.

## Code checks

`npm run check`: ESLint, TypeScript/production build, 21 regression tests and Prettier. The existing Vite size advisory applies to the lazy MapLibre engine chunk.

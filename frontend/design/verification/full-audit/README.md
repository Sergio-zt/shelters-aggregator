# Full UI, motion and Lighthouse audit — 2026-11-02

## Results

Production preview: `http://127.0.0.1:4173/`. Lighthouse 12.8.2, local Chrome, default simulated mobile throttling and desktop preset. Individual lab runs, not field Core Web Vitals or real-device measurements.

| Category | Mobile before | Mobile after | Desktop after |
| --- | ---: | ---: | ---: |
| Performance | 91 | 97 | 100 |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 96 | 100 | 100 |
| SEO | 91 | 100 | 100 |

Mobile FCP: 2.0 → 1.4 s; LCP: 3.2 → 2.6 s; TBT: 0 ms; CLS: 0.001. Exact metrics: `summary.json`. Full reports: `lighthouse-before.report.html`, `lighthouse-mobile.report.html`, `lighthouse-desktop.json`.

Seven separate Lighthouse accessibility/Best Practices checks (search, details, filters, feedback error, add shelter, menu, location) score 100/100 after the contrast fix. Automated checks do not establish complete WCAG compliance.

116 screen/viewport checks: 27 states at 320 × 740, 390 × 844, 480 × 844 and 1440 × 1000, plus eight sheets at 390 × 568. No horizontal page/sheet-body overflow, broken image elements or action footers outside the viewport. No browser console warnings/errors. Raw results: `browser-checks.json`.

All 14 unit tests, strict TypeScript production build, ESLint and Prettier pass. npm audit reports zero vulnerabilities; raw result: `npm-audit.json`.

## Fixes

- Search suggestions started 10 px too low; the wrapped metro description grew its row by another 5 px. Corrected heading spacing, title line boxes and row padding. All rows are now 88 px; active search field is at y96, with its authored 16 px inner padding and menu button offset. `search-comparison.png` compares the same Figma/browser region.
- Added a 260 ms, 32 px eased sheet entrance, 180 ms fade and 160 ms, 24 px exit. Shared presence retains dismissed sheets through their exit, prevents input while closing and cancels removal on reopening. Internal navigation keeps the overlay wrapper mounted. These are implementation timings, not exported Figma values.
- The list now follows pointer movement, clamps to app bounds, snaps to collapsed/half/expanded and handles pointer cancellation. Dragging the selected card returns to the list. A manual drag reached 687 px expanded height; clicking the handle then collapsed it to 120 px.
- Short control color/border/pressed transitions. Overlay animations use opacity/transforms; list height interpolation resizes its scroll region. Reduced-motion CSS disables animation, and presence skips its delay. The reduced-motion branch was code-reviewed; a preference toggle was not exercised.
- Escape, Tab/Shift+Tab wrapping, inert background and focus return checked. Focus returns to the original trigger after Menu → About → Close.
- Combined ramp + 24/7 filters produced one parking result, one map pin and no cluster; the selected-card handle returned to the expanded list.
- Closing a draft during its local sending timer cancels that timer before the discard prompt. Keep editing retains the address and re-enables Send; Discard closes it. Local feedback reaches confirmation. Stale completion callbacks cannot reopen a dismissed form.
- Four full Geologica fonts converted losslessly to WOFF2: 522,200 → 153,652 bytes (70.6% less). Character maps and advance metrics compared; original TTFs retained. Regular/bold fonts and map SVG preloaded.
- Original Figma pin favicon resolves its 404; valid robots.txt resolves SPA fallback parsing errors.
- “Not listed” / “Not confirmed” had 3.48:1 contrast. Only those labels changed from Gray/600 to Gray/700. This deliberately differs from Figma's lighter text; source design tokens remain intact.

## Remaining differences and limits

- Eight local fixtures produce different counts, map pins, list contents and filter states from Figma. Geometry, typography and assets are compared separately from data.
- Prototype notices and explicit local-only confirmations differ from production copy and affect text blocks.
- Desktop remains a centered mobile layout; no desktop handoff was supplied.
- Motion timings supplement static states. No measured frame-rate or physical mobile-device smoothness claim.
- Automated accessibility is not a screen-reader audit. Real iOS Safari, live geolocation permission success and backend integration are not covered.
- Exact raster identity across Figma/browser color management and font antialiasing is not claimed.
- Lighthouse still reports about 43 KiB of unused initial JavaScript and a small render-blocking CSS opportunity. Mobile performance is 97.

## Download cleanup

66 verified project downloads (3,134,099 bytes) moved to macOS Trash using the native recoverable operation. SHA-256 checked before moving; all 66 original paths are absent afterward. Other Downloads retained. Useful full handoff exports saved in `../../source-exports/`; application SVGs and provenance remain in place.

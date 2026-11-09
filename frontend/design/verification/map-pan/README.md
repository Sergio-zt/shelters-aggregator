# Finite map pan regression — 2026-11-06

The map is an exported Figma SVG with React pin buttons, not a geographic tile renderer. Unbounded CSS translation could move the entire finite image outside the visible viewport. The reported browser state had an offset of approximately (-346, -129) at a 480 px app width, exposing a blank area.

`useMapPan` now clamps movement to the projected SVG image frame, accounts for nearby-mode offsets, derives new bounds after resize, ignores secondary pointers and clears gestures on pointer cancellation or capture loss. Blocked movement does not mark the map as moved. The original resting positions remain intact.

Verification in the production preview:

- Repeated diagonal drags at 390 × 844 stop at (0, -214); image coverage remains complete.
- Scrolling the shelter list to scrollTop 844 leaves the map transform unchanged.
- Nearby-mode dragging stops at (-10, -94).
- Selecting a visible pin after panning opens its selected card.
- Resizing to 320 × 740 clamps the offset again and preserves coverage.
- No console warnings/errors. Raw observations: `browser-checks.json`; screenshot: `after-drag.jpg`.
- All 16 tests, ESLint, TypeScript/build and formatting checks pass in `safeplace-repo`.

Full geographic navigation, zoom, live tiles and real pin coordinates remain a separate integration task.

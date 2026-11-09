# Interaction regression verification

Verified the production preview in the browser at a 390 × 844 viewport.

- Menu entry and exit: sampled transforms and scrim opacity, with stable header/list positions, scroll offsets and map camera. Raw observations are in `checks.json`; screenshots are the actual sampled frames, not a frame-rate benchmark.
- Filters: open, close via the top handle, and focus return without background movement.
- Search: blank-area click, Escape after leaving the input, header title, explicit Cancel, and restoration of the previously committed place after cancelling a draft. The map remains mounted.
- Empty-state panel: repeated handle clicks and upward drag use only shown/collapsed positions. Result lists retain three sizes. Final compact state-panel screenshots are `empty-shown.jpg`, `empty-collapsed.jpg` and `panel-states.jpg`.
- Dirty suggestion form: Keep editing preserves the draft; Discard closes the form. Confirmation and scrim retain their exit animations before removal.
- `npm run check`: ESLint, TypeScript/build, 21 tests, and Prettier pass. Vite reports the existing large lazy MapLibre engine chunk advisory.

These checks do not establish performance on a physical mobile device or a measured animation frame rate.

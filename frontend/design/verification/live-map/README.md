# Live map integration — 2026-11-06

The runtime now uses MapLibre GL JS 6.16.0 with OpenFreeMap's Positron vector basemap. The previous SVG illustration and finite-image pan hook are no longer used. The original SVG remains an archived reference asset.

## Data and integration boundary

- All fictional geographic positions are in `src/features/shelters/demoCoordinates.ts`: eight shelters, search destinations, initial camera center and a sample location for preview states. Demo text labels on the map are hidden at the user’s request.
- `fixtures.ts` joins demo positions to shelter IDs. The internal UI model uses `coordinates: { latitude, longitude }`; the future API adapter can map any agreed backend fields into this model.
- `shelterPoints` emits GeoJSON `[longitude, latitude]`, skips invalid coordinates and excludes the selected shelter from clustering, keeping its custom selected marker visible.
- Facility filters are combined with the current geographic search area. “Search this area” uses the visible viewport above the sheet. Suggestions use the local demo destination lookup and 2 km radius; no geocoding API is called.

## Map and UI

- Original Figma pin variants render through React portals inside MapLibre Marker elements. The SDK owns geographic projection and marker movement.
- Native GeoJSON clustering replaces the previous fixed group of five. Clicking a cluster uses its expansion zoom. Selecting a marker centers its actual coordinate and opens the existing card/details flow.
- Camera padding follows the lower sheet. Initial fitting uses MapLibre 6's `absolutePadding` to avoid adding the sheet inset twice. Selected-camera animation restarts after inset changes so resizing the sheet cannot interrupt centering.
- Attribution remains visible above the lower panel, including links to OpenFreeMap, OpenMapTiles and OpenStreetMap. MapLibre navigation controls support zoom; recentering uses the current/sample location.
- The map and standalone Vite worker load separately from the main app. The engine chunk is about 1.09 MB / 300 kB gzip, plus a 520 kB worker. Vite reports a large-chunk advisory; the map is already lazy-loaded.
- Network/WebGL errors have a retry state; the local shelter list remains usable. Live geolocation permission success, physical mobile devices and simulated provider outages were not exercised.

## Verification

- All 15 tests, ESLint, strict TypeScript/build and Prettier pass in `safeplace-repo`.
- Production browser verified actual rendered streets/buildings from OpenFreeMap, native clusters, Figma SVG markers, selected SVG state, precise selected-coordinate centering, opening details, zoom controls and geographic pan.
- Initial view clusters represent 8 fixtures as 4 + 2 + 2 at zoom 12.780. Two cluster clicks reveal the nested points. A selected metro centers at longitude 30.365700, latitude 50.455100, zoom 15.
- Scrolling the list to scrollTop 844 leaves the map camera unchanged. A subsequent map drag changes the geographic center, and searching the new visible area correctly returns no local demo records there.
- Ramp + 24/7 filters produce one parking marker and one list card.
- Local suggestion search moves the map to its demo destination; areas without nearby demo fixtures show the existing empty state.
- 12 responsive checks: initial/details/empty at 320×740, 390×844, 480×844 and 1440×1000. No horizontal overflow, zero-height map containers, broken image elements or old SVG backgrounds.
- Final fresh-tab browser console has no warnings or errors. Raw observations: `browser-checks.json`, `responsive-checks.json`. Screenshots: `initial.jpg`, `selected.jpg`, `filtered.jpg`.

Earlier Lighthouse reports apply to the SVG prototype, not this WebGL map. The basemap requires Internet access. Shelter records and positions are fictional; no shelter backend or routing has been added.

References: [OpenFreeMap integration guide](https://openfreemap.org/quick_start/), [MapLibre custom markers](https://maplibre.org/maplibre-gl-js/docs/examples/add-custom-icons-with-markers/).


## Type-name and label follow-up

Removed the top demo badge and the sample-location text pill; the location dot remains, and actual geolocation can still show “Your location”. Backend type names are preserved as strings. `shelterTypes.ts` maps known Ukrainian/English metro and parking names to their Figma pins, with a generic shelter pin for missing or unknown names. No separate backend type ID is required for this mapping. All 18 tests and project checks pass; browser verified both badges absent and no console errors. Screenshot: `no-demo-label.jpg`.

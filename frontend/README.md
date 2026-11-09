# SafePlace — Kyiv Shelter Finder

React + TypeScript frontend implementation of the [Kyiv Shelter Finder Figma design](https://www.figma.com/design/4YpVF2wQVoAVgclRHq9FQO/Kyiv-Shelter-Finder?node-id=0-1). Reference viewports are **390 × 844** for mobile and **1440 × 900** for desktop. The responsive layout follows the Figma **Desktop · MVP (1440) → Handoff · Responsive layout** section: mobile below 768 px, a 360 px sidebar at 768–1023 px, and a 390 px sidebar from 1024 px. The desktop top bar is 64 px high and the map fills the space to the right of the sidebar.

This stage includes layout and local frontend interactions only. All shelter records, pin positions, walking times and distances are **fictional design fixtures, not emergency information**. The basemap is a live MapLibre GL JS map using OpenFreeMap vector tiles. Shelter positions and search destinations are still explicit demo coordinates; no production shelter backend, real geocoding service or routing is connected. Data/search/forms use a replaceable mock/HTTP API boundary. In default mock mode forms do not send data outside the browser or persist across reloads. Language is a confirmed API preference (`uk`/`en`), with complete local Ukrainian/English JSON dictionaries; the mock preference survives reloads. HTTP mode uses the configured backend endpoints.

## Run

Use Node.js 22.12+ (the bundled Codex runtime is also suitable).

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally http://127.0.0.1:5173/. No API keys are needed in the default mock mode. See `.env.example` and `API_INTEGRATION.md` for the optional HTTP transport. The live map needs Internet access to `tiles.openfreemap.org` and WebGL support; the list remains usable if the basemap fails.

```sh
npm run build
npm test
npm run lint
npm run format:check
```

## Design system and structure

- `src/styles/tokens.css`: the Figma **Styles · v2** color palette and Geologica typography. Figma namespaces and capitalization are retained; `/` becomes `-` for CSS identifiers, e.g. `Primary/500` → `--Primary-500`, `System/Success/Fill` → `--System-Success-Fill`, `Body/M Regular` → `.Body-M-Regular`. `Elevation/Sheet` is the shared sheet shadow.
- `public/fonts/`: locally served Geologica weights 400/500/600/700 and the SIL Open Font License. No remote font requests.
- `src/features/shelters/demoCoordinates.ts`: all demo shelter/search coordinates, initial center, sample user position and local search radius. Replace these demo joins with an API adapter later.
- `src/hooks/useMapLibre.ts`: live map lifecycle, Vite worker setup, camera padding, controls, resize and retry.
- `src/hooks/useMapClusters.ts`: native geographic clustering of the currently filtered shelter points.
- `src/components/MapMarker.tsx`: React portals into MapLibre markers; original Figma SVGs retain their default/selected appearance.
- `public/assets/map.svg`: archived design reference; it is no longer loaded or rendered by the application.
- `src/components/ui/`: buttons, icon buttons and the shared modal sheet.
- `src/components/`: live map and custom markers, shelter card, access badge, metadata and facility icons.
- `src/features/shelters/`: search, filters, details, feedback, menu, help, forms, location sheets, typed fixtures and filtering.
- `src/hooks/`: geolocation, overlay focus restoration, dialog focus trapping, sheet dragging/snapping, toggle lists and local preview submission.
- `design/reference/`: Figma exports used for visual checks. `design/verification/`: implementation screenshots at the checked viewports.

Redux is intentionally not installed: the current state is small and local. Access and facility filters are combined with **AND**. Counts reflect local fixtures in the current search area, so they differ from the large dataset counts shown in Figma. Filters are drafted in the sheet and only applied when its action button is pressed. Closing discards filter edits. Add-shelter forms show address validation and a discard confirmation for unsaved edits. Mobile dialogs trap keyboard focus, close with Escape and return focus to the initiating control. Desktop panels are nonmodal; Tab continues from their final control to the map, and Shift+Tab returns. Discard confirmations remain modal and centered over the entire viewport. Mobile result lists support half, expanded and collapsed positions and dragging; informational panels have only shown/collapsed positions. Desktop side panels always occupy the available height and scroll internally.

Browser geolocation is requested only from the location action. Permission denial, unavailable position and outside-Kyiv states are handled. The broad Kyiv bounds are illustrative; shelter positions, distances and the shelter list remain demo data even after a real position is received. Coordinates stay in browser memory. No successful real-location permission flow was exercised during UI verification.

## Visual preview states

Append `?preview=NAME` to the local URL. These are explicit design previews, not API states:

| NAME                                                                                          | Screen                                               |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `nearby`, `picked`                                                                            | Nearby list / selected shelter                       |
| `search`, `search-empty`, `results`                                                           | Search suggestions / no matches / chosen location    |
| `filters`, `empty`                                                                            | Filters / no matching shelters                       |
| `details`, `details-loading`, `details-error`                                                 | Details / skeleton / retry state                     |
| `feedback`, `feedback-ready`, `feedback-error`                                                | Shared feedback with shelter context / ready / error |
| `menu`, `about`, `add`, `feedback-menu`, `feedback-menu-error`, `feedback-sent`, `sent`       | Menu and forms                                       |
| `location`, `denied`, `location-blocked`, `location-steps`, `location-unavailable`, `outside` | Location states                                      |
| `loading`, `error`, `map-error`                                                               | List loading / list error / map failure              |

Loading/error previews remain static for inspection. Retry on details error displays the fixture details. Submitting a valid local form shows the sending state and then a confirmation clearly marked as a demo. No external submission occurs.

## Code quality checks

ESLint checks TypeScript and React hook dependencies with zero tolerated warnings. `npm test` includes regression coverage for filter combinations, map projection, cluster membership, selected-pin visibility and search result types. `minimatch` is overridden to `^11.0.1` for the lint dependency tree to address [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249); lint and build have been checked with that version. The override can be removed after upstream dependencies adopt the fixed range.

The latest audit, design measurements and browser checks are recorded in `design/verification/quality-audit.md`.

## Original Figma SVG icons

All application icons now use the SVG assets exported through Figma's own export UI. Lucide and the hand-drawn icon paths have been removed. `src/components/FigmaIcon.tsx` renders the authored frames at their original dimensions; `src/components/UiIcons.tsx` and `FacilityIcon.tsx` supply semantic slots. Colored spot icons and pins retain their original paints. Monochrome glyphs use the same SVG paths as CSS masks where the design needs a contextual color.

`public/assets/figma/` contains 44 original exports and three icon tiles cropped from the original Search suggestion component set. The three crops only change the viewport; paths, colors and strokes remain unchanged. `design/figma-icons.json` records each source node URL, original export filename, dimensions and SHA-256 digest. `src/figmaIcons.ts` is the typed asset registry. Tests verify that files, dimensions, hashes and cropped path geometry remain consistent.

## Motion and final audit

Shared overlay presence supports animated dismissal with focus restoration. The list follows pointer dragging and snaps to three sizes. Motion tokens supplement static Figma styles and respect reduced-motion preferences. Geologica is served as WOFF2; original TTFs are retained.

The [2026-11-02 audit](design/verification/full-audit/README.md) records Lighthouse scores, 116 responsive screen checks, interaction verification and remaining design differences.

## Live map integration — 2026-11-06

The MapLibre 6 map and its worker are loaded as separate chunks. OpenFreeMap supplies the light Positron basemap. The map handles pan, wheel/pinch zoom, navigation controls, geographic clustering, selected-pin centering and current-location recentering. Explicit camera actions use the latest exposed map area. Desktop uses a separate map region to the right of the sidebar so selected points remain visible without moving the basemap when a panel opens.

All fictional geographic positions live in `src/features/shelters/demoCoordinates.ts`, separate from UI code and shelter descriptions. `fixtures.ts` joins them by shelter ID. The internal `Shelter.coordinates` object uses latitude/longitude; an eventual API adapter can convert whatever field names the backend supplies. No backend schema is imposed. GeoJSON and MapLibre receive `[longitude, latitude]` in that order.

Search suggestions use the local demo coordinate lookup and a 2 km demo radius. “Search this area” filters the demo candidates using the visible geographic bounds above the sheet; facility filters apply on top of that area. A backend implementation can replace these local selectors with its search endpoint. Real geocoding, verified shelter data and walking routes are not part of this integration.

The older Lighthouse/visual reports describe the previous SVG prototype. They should not be treated as performance measurements of this live WebGL map.

## Backend shelter type names

A shelter's `kind` preserves the backend's type name. No separate type ID is required for displaying pins. `src/features/shelters/shelterTypes.ts` maps known English/Ukrainian names to the original Metro/Parking icons; all other names use the generic shelter pin. Unknown labels remain visible unchanged on cards. Extend the alias mapping when the backend supplies its exact vocabulary. Map demo labels are hidden; demo coordinates remain in their separate data file.

## Desktop and tablet adaptation — 2026-11-06

`src/styles/responsive.css` holds layout rules using the existing design-system tokens. `TopBar.tsx` shares its language switch with the mobile menu. `useResponsiveLayout` switches behaviour at 768 px without duplicating application state. Search, details, filters, location states, forms and confirmations reuse the same content across layouts. Map controls move to the bottom right, pins use their 32 px desktop frame, and Search this area retains the five-second idle delay.

`useGuardedNavigation` protects a dirty add-shelter form when desktop navigation, search or a marker would replace it. Confirming discard continues the requested action; keeping the draft cancels navigation. A breakpoint change keeps the currently mounted form and its values.

Browser checks and screenshots are in `design/verification/desktop/`. Earlier Lighthouse reports do not measure this desktop adaptation.

## Motion and performance verification — 2026-11-06

The [desktop/mobile motion audit](design/verification/desktop-motion-audit/README.md) records interrupted/reversed transitions, panel navigation, fading search and confirmations, stable backgrounds, keyboard focus, 42 state/viewport checks, and the latest sequential Lighthouse reports. `useIdleMount` lets the interface paint before starting the WebGL engine. Sampled browser frames and an illustrative GIF are included in the audit folder.

## Shared feedback form — 2026-11-09

Figma Screens 14 / 14.1–14.5 now define a single Give feedback form: one plain-text comment, no facility answers, issue chips or topic choices. Opening from shelter details shows its name/address under the shared intro; opening from the menu or top bar omits that context. Empty and whitespace-only comments cannot be submitted. Sending disables the field/button; failure keeps the comment and offers Try again. A local successful submission shows Feedback sent and Back to map returns to the result list, including when opened from a shelter. Closing cancels the pending preview timer.

The separate SiteFeedbackSheet, its navigation state, old answer styles and four unused Answer SVGs/registry/provenance entries have been removed. Existing historical audit screenshots remain unchanged. Backend submission is still not connected; maximum comment length and an eventual request contract remain to be agreed with the backend.

## Localization and API foundation — 2026-11-09

UI copy is in `src/i18n/en.json` and `uk.json`. The API returns the initial language; switching saves the preference and applies its confirmed response. Open panels, drafts, filters, selected IDs and map camera survive language changes. Catalog records, district lookups, place search and forms pass through `AppApi`. DTO adapters validate coordinates and IDs; minimal backend points need no fixture lookup. The basemap remains unchanged.

See [API_INTEGRATION.md](API_INTEGRATION.md) for the service boundary, example DTOs, environment configuration and the remaining backend-contract decisions. These example endpoints are placeholders to adapt to the backend, not requirements for its implementation. The old timer-only `usePreviewSubmit` hook was replaced by cancellable API submissions. Earlier audit reports describe the builds tested on their stated dates.

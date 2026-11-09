# Code and design audit — 2026-11-01

Scope: local React + TypeScript UI prototype, compared with the checked-in Figma exports in `design/reference/`. This does not certify live shelter data, a geographic map service, a backend, or every raster pixel.

## Problems found and fixed

| Problem | Fix and verification |
| --- | --- |
| Effect dependencies were incomplete; adding the whole sheet object would make the effect unstable. | Stable overlay setter and explicit sheet setter dependency; ESLint hook rules pass without suppressions. |
| The loading button used the disabled grey treatment instead of the Figma blue sending state. | Separate loading modifier; browser measured `rgb(26, 107, 240)` with white text while busy. |
| The map still showed a cluster of five after filtering to one result, and the initial map could hide the selected point. | Cluster membership now uses only current results, counts actual members, excludes the selected pin, and never creates a singleton/empty cluster. A filtered parking result showed one pin and no cluster; selected parking stayed visible with four remaining cluster members. |
| Pins used fixed vertical coordinates while the SVG scaled or cropped on different viewports. | Shared SVG projection for pins, cluster and location marker. Measured anchor positions agree within 0.01 px on widths 320/390/480; hit areas remain 44 px. |
| Enter always chose Zhytomyrska, while a filtered street could receive a metro icon merely because it was first. | Typed search results shared by the panel and Enter handler. Enter on “Mala” produced “Mala Zhytomyrska St, Kyiv”; icon uses the result kind. |
| Focus trapping included disabled fields and could fail when a focused field became disabled during submission. | Disabled/inert/hidden controls are excluded. Keyboard trapping covers focus leaving the dialog. During busy add-shelter submission, Tab focused Close rather than a disabled field. |

Additional safeguards: unknown shelter IDs fall back to their own map coordinates; delayed focus restoration cannot steal focus from a newly opened overlay; the language toggle has a 44 px hit area without changing its visible dimensions.

## Design measurements — 390 × 844

| Element | Browser measurement | Reference |
| --- | --- | --- |
| Header | 158 px high | Matches |
| Main heading | 22 / 28 px, x16 y24 | Matches |
| Search | 48 px high, y94, radius16 | Matches |
| Half sheet | y433, height411, radius16 | Matches |
| Handle | 48 × 4, x171 y445 | Matches; 12 px below sheet top |
| Sheet heading | 20 / 26 px, x16 y470 | Matches |
| First shelter card | 358 × 158, x16 y541 | Matches |
| Card padding and corners | 16 px | Matches |
| Sending button | Primary/500, white text | Matches after fix |

Geologica and Styles · v2 tokens are locally served. The map uses the original exported SVG paths. The originally recreated pin glyphs and utility icons were replaced with original Figma SVG exports on 2026-11-02; see the follow-up below. Exact raster parity is not claimed. Counts, card contents and cluster membership follow the eight local fixtures, so data-driven layouts differ from the larger dataset in Figma. The desktop view is a centered mobile app because no desktop handoff was supplied.

## Checks

- ESLint: **0 errors, 0 warnings**; TypeScript and React hook dependency rules enabled.
- TypeScript: strict build passes; unused locals and parameters are now enforced in tsconfig.
- Unit tests: **12 / 12 pass**, including six new search/map regression cases.
- Production build and Prettier check pass.
- Supported bundled runtime: Node **24.22.1**; checks also passed on the installed Node 20.19.6 before the final pass.
- Browser: **48 screen/viewport combinations**, no horizontal page or sheet overflow, no console warnings/errors. All 27 preview screens at 390 px plus seven key screens at 320/480/1440 px. Raw results: `audit/browser-checks.json`.
- Interaction checks: search Enter, combined filters, selected pin visibility, loading button colors and keyboard focus during submission were exercised in the production build.
- npm dependency audit: **0 reported vulnerabilities** after setup. During ESLint installation, its dev-only minimatch dependency triggered [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The `minimatch ^11.0.1` override resolves it; lint, build and tests pass with the override. It should be removed when upstream dependencies require the fixed range.

Live geolocation permission success and external form submission remain outside this audit; forms are explicitly local previews. Static loading/error previews are layout fixtures, not backend integration tests.

Run all checks with `npm run check`.

## Original SVG follow-up — 2026-11-02

Replaced Lucide and manually drawn icon paths with 48 original Figma SVG exports and three search suggestion tiles cropped from the original component set. Source geometry and native frame dimensions are preserved. The registry uses Figma component names; `design/figma-icons.json` records source nodes and SHA-256 hashes. Monochrome contextual icons use the original SVG as a CSS mask.

Lint, strict TypeScript build, formatting and all 14 tests pass, including SVG integrity checks. Fifteen additional screen/viewport combinations at 320/390/480 px show no horizontal page overflow or broken image elements; the browser reports no warnings or errors. Screenshots and raw checks are in `figma-icons/`.

## Full motion/performance follow-up — 2026-11-02

See `full-audit/README.md` for corrected search spacing, animated overlay presence, direct list dragging, focus/submission cancellation fixes and WOFF2 fonts. Lighthouse: mobile 97/100/100/100; desktop 100/100/100/100. Seven screen accessibility checks pass at 100 after darkening two labels to Gray/700. 116 responsive combinations pass. Intentional contrast and remaining data/copy/desktop differences are documented there.

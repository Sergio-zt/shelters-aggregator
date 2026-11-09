# Visual and interaction verification

Checked against the Figma UI page at 390 × 844. `comparison.png` places the original initial-screen export beside the production browser screenshot. The production screenshots use the original Figma map SVG.

- 26 preview screens rendered at 390 × 844, without horizontal page overflow.
- Add-shelter, details, filters and menu checked at 320 × 740. Forms scroll inside the sheet; the footer action stays available.
- Centered mobile layout checked at 1440 × 1000.
- Search suggestions, no matches and choosing a suggestion checked.
- Combined ramp + 24/7 filters reduced the fixtures to one parking record, then opened its details.
- Shelter feedback selection, sending state, local confirmation and return to details checked.
- Address required-field validation, keeping a draft and discarding a draft checked.
- Escape, focus restoration to the menu trigger and focus wrapping checked.
- Expanded / collapsed sheet interaction checked.
- Production page produced no console warnings or errors during the final screen pass.
- `npm run build`, all 6 unit tests and `npm run format:check` passed.

Scope differences from the design reference: counts use eight local fixtures; the map is an illustration, not a geographic map engine; form confirmations disclose that no data was sent. The EN/UA toggle is visual only, as specified in the handoff. Successful live browser geolocation was not exercised. The initial recreated icons were replaced by original Figma SVGs on 2026-11-02; see `figma-icons/README.md` for the follow-up verification.

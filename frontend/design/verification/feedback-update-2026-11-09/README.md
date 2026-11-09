# Shared comment feedback — 2026-11-09

Reference: Kyiv Shelter Finder Figma, `5 · Shelter feedback`, `Handoff · Screens 14 · 14.1–14.4 · Feedback form`, plus Screen 14.5 (menu entry) and Screen 15 (confirmation).

## Implementation

- One `FeedbackSheet` with a plain-text multi-line comment. Shared intro/helper copy matches the updated handoff. Shelter name/address appears only when opened from its details; menu/top-bar entry has no shelter context, even with a selected map pin.
- Empty/whitespace-only comments disable Send feedback. Sending disables the field/action; errors retain the text and offer Try again. Closing cancels the local pending timer.
- Feedback sent uses the new copy and Back to map returns to the map/list, clearing the selection. Closing a shelter-specific form before submission still returns to its details.
- The separate `SiteFeedbackSheet`, topic selection, facility-answer state, issue chips and their CSS were removed. Four unused Answer SVGs, icon registry entries and provenance entries were also removed. Shared chip/toggle styles used by filters/add-shelter were kept.
- The comment field is 72 px high. Focus uses the white/blue-border state; normal/ready state uses the gray surface. Existing shared panel/scrim transitions remain in place.

## Verification

- ESLint, TypeScript/production build, 21 existing regression tests, and Prettier pass.
- Browser: shelter and menu entry, no context leakage from selected shelter into top-bar feedback, empty/whitespace input, multi-line input, sending state, error text preservation, edit/retry success, cancellation while sending, and Back to map without reopening shelter details.
- Resizing between 320, 390, 768, 1024 and 1440 px preserves the comment, with no horizontal overflow and footer actions inside the viewport (including 1024 × 600). Raw observations: `checks.json`.
- Targeted Lighthouse accessibility / best-practices audits: **100 / 100** for mobile shelter feedback and desktop menu feedback. Full JSON reports are adjacent. Root-page Performance/SEO was not remeasured; the earlier performance reports describe the previous build.
- Screenshots show mobile menu entry, shelter feedback, error and confirmation, plus desktop feedback.

Submission remains a local preview. No backend request contract, character limit or real error response was introduced. Existing historical design/audit artifacts were preserved.

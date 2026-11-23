# Locale layout fix — 2026-11-23

Removed forced line break from restricted-access explanation. Shared grid columns
and equal rows align all three explanations; at <=360px labels stack above text.
Card badges use stable access/facility rows with minimum widths across locales.
Desktop header buttons reserve widths for the longer locale; brand caption hides
through 1100px to keep tablet navigation within the viewport.

Browser verified: at 768px header nav x/width pairs are identical in EN/UA:
168/166, 342/142, 492/88, 588/164. No page overflow.
At 390px all explanation rows measure 72px; screenshot inspected.
At 320px all rows measure 72px; no explanation, badge or document overflow.
Build passes. No motion/Lighthouse rerun for this layout-only change.

# Desktop / tablet / mobile motion audit — 2026-11-06

## Fixed

- A persistent `.overlay-motion` container now owns panel movement. Changing panel content no longer restarts a full mobile slide. Content uses a short fade.
- CSS transitions with `@starting-style` replace fixed entry/exit keyframes. Rapid close/reopen reverses from the current transform and opacity. Presence waits for exit completion, with a timeout fallback.
- The scrim fades independently. The desktop result list remains visually underneath the panel during its fade, avoiding an empty flash; selected details no longer replace this underlying list with a transient picked card.
- Search retains its last results during dismissal and fades out before unmounting. Cancel restores the committed input without changing the outgoing result content.
- Discard confirmation uses interruptible transitions and a portal outside the moving panel so its center is the viewport center.
- Focus returns to the initiating control, or a visible result if that control disappeared after a layout change. Initial page load does not autofocus a result.
- Visible button names supply their accessible labels; the location graphic has an explicit image role.
- The WebGL engine is requested after the first interface paint and an idle callback, with a one-second scheduling timeout. The map is still loaded automatically; no artificial delay is used to defer it past the audit.

## Interaction evidence

`motion-samples.json` contains computed transforms/opacities sampled through the actual browser UI. Rapid desktop reversal, mobile opening and closing each preserved header y=0, shell scroll=0 and a constant map camera within the sequence. The mobile Menu → About transition kept the movement container at its settled transform instead of sliding it in again.

`interaction-checks.json` contains 42 state/viewport inspections at 390 × 844, 768 × 900 and 1440 × 900, with no horizontal page overflow. It also records search exit opacity decreasing to zero while retaining its content, and the centered 360 × 214 discard dialog at 1024 × 768 with the background inert.

`focus-checks.json` records focus returning to the selected result on desktop and mobile, initial BODY focus, and a visible fallback when the mobile menu trigger becomes hidden after resizing.

`menu-motion.gif` combines sampled browser frames, using their capture intervals and holds at the endpoints. It illustrates motion; it is not a video recording or a 60 fps benchmark. The original sampled frames are in `frames/`.

## Lighthouse and code quality

| Audit | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Desktop | 100 | 100 | 100 | 100 |
| Mobile | 98 | 100 | 100 | 100 |
| Desktop details | — | 100 | 100 | — |
| Desktop filters | — | 100 | 100 | — |

The full root-page desktop/mobile audits and the accessibility/best-practices checks for desktop details and filters were run sequentially in headless Chrome using Lighthouse 12.8.2. Reports and exact metrics are in `summary.json` and the four named JSON reports. Local Lighthouse scores vary with CPU, caching and the external tile service; they do not establish performance on physical devices or measure animation frame rate.

Reduced-motion CSS and the immediate-presence-removal branch were code-reviewed; the operating-system motion preference was not changed during browser verification. Existing functional tests remain 21/21; ESLint, TypeScript/production build and Prettier pass. Vite still reports the large lazy MapLibre chunk advisory. Older Lighthouse reports describe older implementations.

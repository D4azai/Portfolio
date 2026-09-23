> This documents the previous motion refinement. The later entry/form/private dashboard additions are documented in [CONTROL-REPORT.md](CONTROL-REPORT.md).

# Interactive engineering refinement

The existing single-page portfolio, all five projects, copy, fonts, charcoal/lime palette, sections, contact links, and native case/pillar dialogs are preserved. The live site was inspected with Playwright alongside the local baseline. There is no framework, router, application state library, or runtime dependency to migrate.

## Implementation

- `index.html`: loads the dedicated system stylesheet, marks the architecture exploration area, and stops loading the old three-second preloader. Original hero content is immediately available.
- `js/system-core.js` (new): dynamically imported architecture controller; wraps the existing SVG and semantic links in a CSS 3D plane; adds interface, orchestration, and infrastructure layers beneath the original AYNKO core. Small pointer rotations reveal depth and stop when a capability link is acquired, keeping click targets stable. Hover and keyboard focus identify the capability and preserve its existing process dialog. Scroll entry activates the existing node/path reveal; scrolling does not move the link targets.
- `system.css` (new): restrained physical layering, flat mobile fallback, relationship emphasis, project-title feedback, and a one-pixel page-progress indicator.
- `js/motion.js`: reuses existing timing/easing and lifecycle scopes; lazy-loads depth near the viewport; adds page progress and short dialog-card transitions; cancels the previous dialog animation scope before starting another.
- `motion.css`: reduces the contextual cursor diameter from 84px to 68px and increases project-image hover scale to 1.035. Existing masked headings, image masks, divider drawing, metadata stagger, architecture path activation, ambient packets, active navigation, and method progression remain the shared motion language.
- `js/pointer.js`: retains the ref-free DOM/rAF two-part cursor with frame-rate-aware ring interpolation, cached geometry, bounded magnetic offsets, and selection/input fallbacks. Adds case-explorer state recognition. States: dot/ring default, expanded action ring, VIEW, OPEN ↗, MAIL ↗, EXPLORE; DRAG remains supported for an actual draggable target, but none is invented. Dialogs deliberately use native pointers because they occupy the browser top layer.
- `script.js`: prevents queued close events from overriding the next focus target or unlocking a newly opened dialog. Native focus restoration is preserved. This site uses dialogs rather than separate case-study routes, so transitions enhance those existing views without introducing routing or whole-page snapshots.
- `tools/build.mjs` (new), `package.json`, `.gitignore`: syntax-check active modules and stage only public site files/assets in ignored `dist/`; source deployment remains possible.
- `tools/verify-interactions.mjs` (new): behavioral coverage for depth, cursor, magnetism, process progression, dynamic motion preferences, touch fallback, failed module loading, and lifecycle cleanup.
- `tools/verify-premium.mjs`: all nine requested widths, immediate hero expectation, and contrast audits after transitional opacity settles.
- `tools/performance.mjs`: includes the active depth module and stylesheet in size reporting.
- `README.md`, `DESIGN.md`, this report: updated operating instructions and implementation record.

## Dependencies and performance

No libraries added. CSS perspective and `preserve-3d` fit this sparse architectural scene without a canvas, mesh runtime, texture downloads, DPR allocation, or continuous WebGL rendering. Existing Web Animations, SVG, CSS transitions, IntersectionObserver, and native scroll cover the choreography.

Depth is lazy-loaded, stops updating offscreen or in hidden tabs, and schedules frames only while its pointer interpolation is settling. Event listeners use abortable scopes; observers, generated elements, and scheduled frames are cleaned up. Existing optimized WebP images, lazy galleries, reserved image dimensions, and local fonts remain intact.

The first local performance sample measured LCP 1004ms and CLS 0.000066 at 1440px; mobile measured LCP 1500ms and CLS 0 at 375px with 4× CPU slowdown, 1.6Mbps bandwidth, and 150ms latency. These are single-run lab observations, not field metrics or a guaranteed frame rate. Latest machine-readable results are in `artifacts/performance.json`.

## Accessibility and responsive behavior

Full depth and custom cursor require a fine hovering pointer, width above 960px, no reduced-motion preference, and no forced-colors mode. Other devices use the original interactive flat diagram. All four capability links retain keyboard, touch, and no-JavaScript behavior. Cursor elements never capture input; native text selection, inputs, keyboard interaction, and focus remain available. Reduced-motion changes cancel active animations and remove depth live. No essential information exists only in the new hover caption; the same content remains in the process views.

## Validation

Run `npm test`, `npm run test:interactions`, `npm run build`, and `npm run check:performance` with the preview server active. Reports and visual captures are under ignored `artifacts/`. Browser coverage uses installed Microsoft Edge via Playwright, with axe WCAG 2 A/AA and WCAG 2.1 A/AA checks. Responsive checks cover 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920px; all seven page sections, all five cases, and all four architecture process views are exercised.

Remaining optional checks: physical iOS/Safari and Firefox review, screen-reader testing with assistive technology, and field performance after deployment. No automated claim of a heap-level memory-leak audit or sustained 60 FPS is made. The site has not been deployed by this change.

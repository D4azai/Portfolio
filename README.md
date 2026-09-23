# AYNKO / Interactive portfolio + private control

The current product implementation, environment variables, Supabase migrations, security model, and deployment steps are documented in [CONTROL-REPORT.md](CONTROL-REPORT.md). The portfolio remains native HTML/CSS/JavaScript; Vercel server endpoints add Supabase Auth/PostgreSQL for the private owner dashboard, inbox, and opt-in analytics. No runtime library was added.

```sh
npm ci
npm run dev
npm run test:security
npm run test:product
npm test
npm run test:interactions
npm run build
```

Public preview: http://127.0.0.1:4173. Owner login: `/owner/login`; private dashboard: `/admin`. Copy `.env.example` to ignored `.env.local` and configure the server values to use live Supabase locally. Without configuration, public content works, submissions show an honest email fallback, and owner endpoints deny access. `test:security` and `test:product` use ephemeral PostgreSQL and a test identity provider; they do not need cloud credentials.

Deploy the repository through Vercel using `vercel.json`; `dist/` alone does not contain the server APIs. Complete the hosted authentication/database smoke test described in CONTROL-REPORT.md before enabling production collection.

## Previous visual refinement notes

The following documents the preceding motion upgrade. Its immediate-entry description is superseded by the new 1.9-second, immediately skippable systems-operator scene.

﻿# AYNKO / Systems practice

An independent software engineering portfolio built with HTML, CSS, SVG, and native JavaScript. The upgrade preserves the charcoal/lime identity, original five project stories, architecture illustration, working method, and contact destination. There are no runtime dependencies. `npm run build` validates JavaScript and stages a deployable static site in `dist/`.

## Preview

Use Node.js 22 or newer:

```sh
npm run dev
```

Open http://127.0.0.1:4173. On Windows with PowerShell script restrictions, use `npm.cmd` instead of `npm`. Serve over HTTP because the controllers use ES modules.

## Implementation

| File | Responsibility |
| --- | --- |
| `index.html` | Content, architecture illustration, project cards, About, native FAQ, case dialog, inert evidence template |
| `styles.css` | Local fonts, visual tokens, layout, responsive navigation, preloader, component styles |
| `motion.css` | Shared animation and reduced-motion rules |
| `script.js` | Original case-study content, optimized gallery rendering, dialog focus handling |
| `js/navigation.js` | Early, dependency-free mobile navigation initialization without layout shifts |
| `js/system-core.js` / `system.css` | Lazy CSS 3D architecture layers, pointer depth, semantic highlighting, mobile fallback |
| `js/motion.js` | Reveal observers, architecture illustration motion, active navigation, method progress |
| `js/motion-utils.js` | Shared animation lifecycle and accessibility preferences |
| `js/pointer.js` | Existing fine-pointer enhancement with native input and reduced-motion fallbacks |
| `js/image-manifest.js` | Responsive image metadata used by the case galleries |
| `js/pillars.js` | Data, Flow, AI, and Edge process content and card rendering |
| `assets/fonts/` | Locally hosted Manrope and DM Mono, with their licenses |
| `assets/optimized/` | Existing WebP derivatives; original screenshots remain available at full size |
| `DESIGN.md` | Audit, design decisions, and verification scope |
| `CONTENT-NEEDED.md` | Real evidence and company information needed for future trust sections |

The unused `js/interface.js`, `js/case-study.js`, and `js/dialog.js` are retained from an earlier variant; the current page does not load them. The older `tools/verify.mjs`, `tools/capture.mjs`, and `tools/verify-edge-cases.mjs` target that earlier variant. Use the current commands below.

## Behavior

- The original hero enters immediately through a masked, staggered reveal completed in about 1.2 seconds. The old preloader is no longer loaded.
- The compact sticky header has active navigation and an accessible mobile menu with Escape dismissal, focus handling, outside-click closure, and viewport reset.
- The hero Explore the work action opens five explanatory project cards in a native dialog. Each card opens its case study, with an All projects button to return. Closing restores focus to the hero action. Without JavaScript, the action scrolls to the project section.
- The architecture nodes open Data, Flow, AI, and Edge process views. Each has three numbered process cards, working outputs, an intended outcome, and navigation between pillars. The dark dialog supports keyboard/touch access, restores focus on close, and adapts to mobile. Without JavaScript, nodes link to the working method. These describe an approach, not measured performance or guaranteed deliverables.
- Five project buttons open native case dialogs. Escape closes them; focus returns to the originating button. Each dialog has a project-specific email enquiry link. Original screenshots open separately at full resolution.
- FAQ uses native details/summary and works without JavaScript. The rest of the page and email links remain available without JavaScript; expanded project notes require it.
- Scroll remains native. Motion responds to live reduced-motion changes. The system core uses CSS perspective and actual DOM layers, dynamically loaded near the viewport. Desktop pointer motion settles to idle; touch, narrow screens, forced colors, and reduced motion use the original flat diagram. No framework, WebGL, animation dependency, or remote font request.

## Verification

Start the preview server, then:

```sh
npm ci
npm test
node tools/capture-premium.mjs review
npm run check:performance
```

These tools use installed Microsoft Edge via Playwright. Reports and screenshots are written to ignored `artifacts/`. Verification covers nine widths from 320 to 1920px; case dialogs and focus; mobile navigation; FAQ keyboard operation; first/return visits; slow fonts; storage denial; reduced motion; no JavaScript; image failure; missing assets; and automated WCAG checks. Performance results are local lab measurements, not field Core Web Vitals or a substitute for device testing.

Optional asset maintenance: `npm run images` and `node tools/prepare-fonts.mjs`. Assets already exist and are committed.

## Publishing

Deploy `dist/` after `npm run build`, or serve the repository root directly as a static site. Review `CONTENT-NEEDED.md` before publishing. Canonical, Open Graph, structured data, sitemap, and robots URLs use `https://aynko.dev/`; change them together if the domain differs. Contact remains `aymane.chellak@outlook.fr`. The construction ERP remains UAT. No invented business results or endorsements are displayed.

See [MOTION-REPORT.md](MOTION-REPORT.md) for the interaction implementation, validation, and remaining device checks.

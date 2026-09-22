# AYNKO / Systems practice

A portfolio for a software engineer and systems architect. The site preserves the existing operational project stories and contact flow, with an interactive architecture drawing, editorial project presentation, and a shared motion language.

The frontend has **zero runtime dependencies**. HTML, CSS, SVG, and native JavaScript modules are served directly. There is no build step.

## Preview

Use Node.js 22 or newer:

```sh
npm run dev
```

Open http://127.0.0.1:4173. The preview server does not require an install. Any static HTTP server also works; use HTTP rather than opening the HTML as a local file because the controllers use ES modules.

## Implementation map

| File                   | Responsibility                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `index.html`           | Semantic content, architecture SVG, project links, module controls, native dialogs                                            |
| `styles.css`           | Typography, visual tokens, shared motion primitives, responsive layouts, cursor and transition styling                        |
| `script.js`            | Original case-study content and feature initialization                                                                        |
| `js/motion.js`         | Reduced-motion preferences, reveal observers, section tracking, method progress, interpolated cursor and restrained magnetism |
| `js/interface.js`      | Mobile navigation, architecture selection, capability connections, searchable command palette                                 |
| `js/case-study.js`     | Six-chapter case studies, operational diagrams, URL/history handling, shared-title View Transitions and fallback              |
| `js/dialog.js`         | Shared keyboard focus cycling                                                                                                 |
| `js/image-manifest.js` | Generated responsive screenshot metadata                                                                                      |
| `assets/fonts/`        | Locally served Manrope and DM Mono, with OFL licenses                                                                         |
| `assets/optimized/`    | Responsive WebP derivatives; original screenshots remain intact                                                               |
| `DESIGN.md`            | Existing-site audit, art direction, interaction rationale, and verification notes                                             |

## Interactions

- Architecture layers support pointer hover, click/tap, Tab and arrow keys. All layer roles remain visible; selection expands the explanatory readout.
- Project cards link to `#case/affiliate`, `#case/erp`, `#case/crm`, `#case/studioNorth`, and `#case/northstar`. Links can be copied, opened in a new tab, and navigated using browser Back/Forward. The case dialog restores the original project link's focus and page position.
- Ctrl/Cmd+K opens system commands. Type to filter, use arrows and Enter to navigate, or Escape to close. The header also provides a visible command button.
- The two-layer cursor uses a precise point and interpolated corner reticle, with contextual VIEW, OPEN and MAIL labels. Native cursors remain available for text, selection, forms, touch, keyboard use, dialogs, reduced motion, and forced colors.
- CSS uses one easing curve and 180/350/650ms timing tokens. Hero entrance completes in about 1.2 seconds. Reveal observers run once, packets run only while the architecture is visible, and the pointer animation loop stops once it settles.
- Scroll remains native. There is no scroll hijacking, canvas, WebGL, GSAP, or framework bundle.

## Verification and asset tooling

```sh
npm install
npm test
npm run images
node tools/prepare-fonts.mjs
node tools/capture.mjs review
node tools/performance.mjs
```

Start the preview server before running browser checks. The browser scripts use installed Microsoft Edge on Windows. Test assets and reports are written to the ignored `artifacts/` directory. Image and font preparation are optional maintenance commands; all required assets are already committed with the source.

The verification suite covers 320, 375, 430, 768, 1024, 1440 and 1920px; all five case studies; direct links and history; dialog focus; commands; active navigation; method progress; touch; dynamic reduced-motion changes; no-JavaScript content; failed image requests; and automated WCAG checks. Automated checks complement device and assistive-technology review.

## Publishing

Deploy the repository root as a static site. No build command is required. Development dependencies are not shipped to the browser. The canonical, Open Graph and sitemap URLs currently point to `https://aynko.vercel.app/`; update them together if the public domain changes.

Keep the real project contribution wording and statuses accurate. The construction ERP remains marked UAT; no business metrics or production results have been invented. Contact remains `aymane.chellak@outlook.fr`.

Optional future additions: measured project outcomes, more detailed implementation diagrams backed by project documentation, a dedicated social preview image, and device testing on Safari/iOS.

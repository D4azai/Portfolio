# AYNKO / design and interaction system

## Existing-site audit

- Static HTML, one CSS file, one vanilla JavaScript file; no framework, bundler, or runtime dependencies.
- Sections: hero + architecture, practice strip, five selected projects, four capabilities, four working-method stages, contact, footer.
- Five data-driven case studies in a native dialog; existing mobile menu, keyboard dismissal, focus restoration, screenshot links and external project links.
- Typography: Manrope, DM Mono, and Georgia. Existing responsive breakpoints at 960px and 680px.
- Assets: actual Maroc Affiliate, Odoo, CRM and Studio North screenshots, plus a CSS Northstar composition. Preserve the source images and project claims.
- Performance opportunities: oversized PNG screenshots, remote font requests, full-screen noise compositing, no adaptive image sources. Existing animation is lightweight but disconnected (generic reveals and a dashed SVG line).
- Accessibility foundations worth retaining: semantic sections, skip link, native dialog, visible focus, reduced-motion query, readable content without JavaScript.
- Repository was clean apart from unrelated untracked IDE files, which are left intact.

## Direction

An architectural drawing brought into a product interface. Charcoal, warm paper and a single muted sage signal color. Large sans headings contrasted with editorial serif accents and small monospace annotations. Rectilinear borders and generous spacing; diagrams express relationships rather than ornament.

Preserve the original identity, section hierarchy, operational project detail and contact destination. Add no fabricated metrics or implementation claims. Keep portfolio runtime dependency-free; Node tooling is development-only.

## Interaction language

- Shared easing: cubic-bezier(.22, 1, .36, 1). Durations: 180ms feedback, 350ms controls, 650ms reveals; 80ms stagger.
- Hero: masked line entrance with the final supporting elements visible by 1.3 seconds; no blocking intro.
- Architecture: four accessible module buttons, projected SVG layers, selectable descriptions, focused connection paths and sparse data packets. Same information for hover, focus and touch.
- Desktop pointer: precise core and interpolated corner reticle; action labels only over actionable controls. Native text/form cursors and keyboard fallback. Small button magnetism and image translation.
- Projects: real screenshots, restrained image motion, clear status and numbering. Flagship story follows problem → system → result.
- Case studies: six numbered engineering chapters and a conceptual workflow diagram. Native dialog preserves navigation context; hash links allow direct access and browser Back. Optional View Transitions with immediate fallback.
- Capabilities: selectable modules connected to an operational center; descriptions always readable.
- Method: a scroll-progress timeline and sticky introduction on wide screens; vertical timeline on mobile.
- Command palette: Ctrl/Cmd+K, searchable real navigation destinations, native dialog and standard keyboard controls.

## Verification

Baseline screenshots before visual changes; then browser smoke checks at each implementation milestone. Final viewport matrix: 320, 375, 430, 768, 1024, 1440, 1920px. Check all case studies, hash history, keyboard/focus, touch, reduced motion, JavaScript-disabled rendering, image loading, console errors, accessibility and transferred asset size. Generated screenshots/reports live in ignored `artifacts/`.

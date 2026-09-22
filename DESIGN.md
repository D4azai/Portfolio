# AYNKO / Premium refinement

## Audit of the supplied implementation

The live source differs from the previous README: it uses a static HTML page, styles.css plus motion.css, a single case-study controller, and separate motion/pointer modules. Interactive architecture controls, command search, and hash-based case routes described in the old documentation are not wired into this version.

Strong foundations preserved: charcoal and lime identity; Manrope, DM Mono, and serif accents; architecture illustration; real project screenshots; all five case narratives; UAT status; four capability areas; the working method; direct email contact; semantic landmarks; native case dialogs; focus restoration; native scrolling.

Weaknesses addressed: non-sticky navigation; no loading experience; decorative glow and heavy rounded framing; less direct visitor/value copy; weak explanation of the individual practice; no FAQ; no service-to-project path or case-study enquiry; external font requests; full-size PNG downloads despite existing WebPs; documentation/testing mismatches; inconsistent canonical domains.

## Design and conversion

The visual direction remains architectural and restrained. Dark graphite, warm paper, and the original lime accent remain. Sharper panel corners, a quiet drawing grid, restrained borders, and reduced decorative gradients replace ornamental effects. The first screen keeps the original headline and diagram while clarifying the audience and adding a real project preview. The primary action starts a project enquiry; the secondary action explores the work.

A compact sticky header keeps the main sections and enquiry accessible. Mobile CTAs stack into generous touch targets; the menu uses an opacity/translation transition and remains removed from keyboard navigation when closed. Cards retain the original screenshots and project wording. Capability links connect the service descriptions to the work, process, or contact sections. About explains the independent practice; native FAQ answers scope and engagement questions. Case studies end with relevant enquiry links.

Trust rests on specific project detail, explicit statuses, and real work. There are no invented logos, reviews, metrics, certifications, team size, or partner claims. The inert project evidence template is ready for verified material; see CONTENT-NEEDED.md. Legal placeholders are not published as empty links.

## Loading and motion

The introduction reuses the existing lettermark and brand name with a thin line. It is decorative, not a false download percentage. It runs for about three seconds: 2.72 seconds of brand presentation plus a 280ms fade. A 3.5s CSS failure deadline, keyboard/pointer dismissal, and optional timestamp storage keep it from trapping visitors. Deep links, repeat visits within 24 hours, and reduced motion bypass it. The initial hero animation is skipped when the intro has run to avoid sequential animation delays.

Existing reveal observers, button feedback, architecture connections, method progress, and contextual pointer are retained. All new transitions respect reduced motion. FAQ requires no scripting. There is no parallax, scroll hijacking, or new runtime dependency.

## Performance and accessibility

The four architecture nodes are now genuine links enhanced into process dialogs. Data, Flow, AI, and Edge each have three numbered cards with working outputs, an intended outcome, cross-pillar navigation, and a relevant enquiry link. These views reuse the charcoal/lime architecture palette while project case studies retain their paper surface. Process copy is maintained separately in js/pillars.js and describes an approach rather than verified outcomes. Nodes fall back to the working-method section without JavaScript.

Fonts now load locally with swap and a single critical-font preload. Project cards and dialogs use existing responsive WebP derivatives; full-resolution originals are only opened deliberately. Gallery dimensions reserve space. Noncritical images remain lazy-loaded. The existing full-screen noise compositor is disabled.

Sticky-header scroll offsets, native dialogs, focus trapping/restoration, visible focus rings, native FAQ controls, reduced-motion support, and no-JavaScript content are maintained. Focus outlines on paper surfaces use a darker accent for contrast. The loading layer is decorative and never captures input or removes the page from the accessibility tree.

Navigation initializes independently before enhancement modules to prevent the expanded no-JavaScript navigation from shifting the mobile hero on slow connections. The no-JavaScript mobile header remains in document flow. The earlier performance run (before the requested three-second intro) measured LCP 492ms / CLS 0.00013 at 1440px, and LCP 1520ms / CLS 0 at 375px with 4x CPU throttling, 1.6Mbps bandwidth, and 150ms latency. These are single-run lab observations, not field results.

## Verification

Current checks: tools/verify-premium.mjs, tools/capture-premium.mjs, and tools/performance.mjs. The earlier verify/capture tools target an unused variant and are retained as historical tooling; npm test now invokes the current suite. Browser reports and before/after screenshots live in ignored artifacts/. Automated audits complement manual screenshot review; Safari/iOS and assistive-technology testing remain useful deployment checks. Performance numbers are local lab results, not production field guarantees.

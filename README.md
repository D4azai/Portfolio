# AYNKO — independent engineering portfolio

Aymane Chellak and Zakaria Bak’s portfolio, built with React 19, Tailwind CSS 4, pre-rendered HTML, and an original Three.js robot. The visual experience uses charcoal, warm ivory, pale lime, locally hosted typography, conceptual cover photography, and real screenshots inside the case studies.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. On Windows with PowerShell script restrictions, use `npm.cmd`. The development server rebuilds when files in `src/` change; refresh the browser after a rebuild. Use HTTP rather than opening `index.html` directly.

## The experience

- **Six focused pages.** Home, Work, Expertise, Process, About, and Contact each have pre-rendered content, page metadata, and direct navigation. The home page gives a short introduction and selected project previews.
- **Interactive system map.** On Expertise, switch between product and operations journeys, inspect nodes with a pointer or keyboard, and animate signal flow. The map illustrates workflows rather than claiming measured business results.
- **Articulated robot.** Shoulder and elbow gestures, subtle idle movement, pointer tracking, and a “Say hello” wave bring the character to life. Each scene has a pause control and honors reduced motion.
- **Ambient background.** A lightweight constellation responds gently to the pointer. Its pause preference persists between pages; animation stops in hidden tabs and follows reduced-motion settings.
- **Four animated process scenes on About.** Understand, Architect, Build, and Evolve each have an independent eight-second 3D loop. Buttons switch directly to the selected scene, which plays silently while visible. There is no native player bar or timeline inside the animation. A small motion toggle, reduced-motion posters, and readable descriptions keep the section accessible.
- **A practical feedback walkthrough.** The Process page’s Evolve stage follows an illustrative approval workflow from release to feedback to a clearer handoff. Select each stage or run the sequence; the animation respects pause and reduced-motion preferences.

- **Visitor-controlled introduction.** The fullscreen loading intro appears on the first home visit in a session and stays open after preparation completes. Enter portfolio, Skip intro, or Escape dismisses it. Direct links skip the intro, and a footer action replays it.
- **Real preparation state.** The progress indicator tracks fonts, the first project preview, and the robot renderer or its static fallback. Slow or failed optional assets cannot lock the visitor out: Enter and Skip are always available.
- **Original robot.** Reflective armor, a luminous visor, articulated hands, a rotating orbital core, and a subtle floating motion. The head follows a mouse pointer. Data performs a scan, Flow conducts with articulated arms, AI lifts the orbital core, and Edge launches the robot. Every click replays the gesture; each mode also changes the light color. Pause/Resume controls the animation.
- **Considered motion.** Typography enters after dismissal. Sections reveal on scroll, and project changes animate with a short stagger. Reduced motion disables continuous motion and transitions. The renderer stops while offscreen, while the document is hidden, or while the hero is behind the intro.
- **Contextual cursor.** A precise dot and softly following ring respond to links, with a “View project” label over previews. Main actions gently follow the pointer. Keyboard input, touch, text fields, dialogs, and reduced motion use native controls. The cursor loop stops when it settles.
- **Project-specific visual effects.** Each preview combines pointer-driven perspective, a moving light, a glass reflection, and an original decorative motif: delivery routes, financial curves, construction plans, relationship diagrams, or celestial orbits. Directional transitions reveal the next project and stagger its copy. Fast selection changes cancel unfinished transitions.
- **Effects shaped around each section.** Headings reveal through a mask; expertise rows have local lighting and responsive icons; process connections draw in sequence; the About monogram has depth; and the contact section uses soft lighting and concentric rings. A slim reading-progress line follows native scrolling. Decorative motifs are hidden from assistive technology and do not represent product data.
- **Five project stories.** The showcase is visible immediately. Each project has an original editorial cover photograph and matching thumbnail, with real interface screenshots preserved inside the case study. Previous/next, project tabs, and Arrow/Home/End keyboard navigation work across desktop and touch layouts.
- **Accessible fallbacks.** Native modal focus containment, Escape dismissal, restored focus, touch layouts, and a robot illustration when WebGL is unavailable. Without JavaScript, the intro stays closed and all five project summaries remain available.

## Where to edit

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | Page sections, navigation, intro replay, and dialog state |
| `src/components/Intro.jsx` | Persistent loading introduction and explicit entry |
| `src/components/Hero.jsx` | Hero copy and system layer selector |
| `src/components/AmbientField.jsx` | Shared canvas background and persistent pause preference |
| `src/components/SystemGraph.jsx` | Interactive workflow graph and signal controls |
| `src/refinements.css` | System graph, ambient controls, and responsive polish |
| `src/components/Hologram.jsx` | Renderer lifecycle, pause control, and fallback |
| `src/graphics/hologram.js` | Procedural robot geometry, articulated gestures, speech visualization, and lighting |
| `assets/operator.svg` | Static robot fallback |
| `src/components/RobotChat.jsx` | Conversational UI, optional browser speech, cancellation, and robot reactions |
| `server/chat.js` | Server-only OpenAI integration, published portfolio context, validation, and request limits |
| `src/components/ProcessDiagram.jsx` | Spatial process blueprint with pointer depth, orbiting signals, and pause controls |
| `src/interactive.css` | Conversation layouts, cover photography, diagram depth, and responsive fallbacks |
| `assets/covers/README.md` | Local cover files and exact imagegen prompts |
| `src/components/Projects.jsx` | Project selector and transitions |
| `src/components/ProjectAtmosphere.jsx` | Original project-specific decorative artwork |
| `src/components/ExperienceEffects.jsx` | Decorative cursor and reading-progress elements |
| `src/effects/experience.js` | Pointer, lighting, magnetism, scroll effects, and lifecycle |
| `src/effects.css` | Section choreography, project effects, and input fallbacks |
| `src/components/DetailDialog.jsx` | Case studies and system layer details |
| `src/data/` | Portfolio copy and original project stories |
| `src/app.css` | Tailwind entry, tokens, and shared base styles |
| `src/experience-design.css` | Current responsive design, robot, showcase, and intro |
| `src/document.html` | Metadata and secure enquiry form shell |
| `tools/verify-react.mjs` | Browser interaction, accessibility, and fallback checks |

`index.html` is generated by `npm run build:react`; do not edit it directly. Compiled React bundles and CSS under `assets/` are ignored by Git. Fonts, project screenshots, and the fallback SVG are local assets.

## Build and verify

```sh
npm run build
npm test
npm run test:enhancements
npm run test:process-film
```

The build compiles the public UI, validates the existing server modules, and stages production files in `dist/`. Tests use installed Microsoft Edge through Playwright against an isolated production preview. Screenshots, accessibility reports, and the test summary are saved under ignored `artifacts/`.

Coverage includes persistent intro behavior, replay and focus, real robot frames and pause/resume, offscreen suspension, system layers, every project, galleries, process tabs, eight widths from 320 to 1920px, mobile navigation, enquiry fallback, reduced motion, unavailable WebGL, no JavaScript, and protected routes. Automated WCAG checks complement visual review; they are not a substitute for device and assistive-technology testing.

Effects checks also cover cursor movement and keyboard fallback, button attraction, project lighting and depth, rapid selection changes, live reduced-motion cancellation, and a real touch-emulated project selector with automatic horizontal tab positioning.

## Enquiries and owner dashboard

Public content works without backend configuration. Submissions then provide an honest email fallback, and owner endpoints deny access.

Copy `.env.example` to ignored `.env.local` and configure the documented server values for live Supabase. Owner login is `/owner/login`; the dashboard is `/admin`. See [CONTROL-REPORT.md](CONTROL-REPORT.md) for server configuration, migrations, inbox, consent-based analytics, and deployment checks.

```sh
npm run test:security
npm run test:product
```

These backend checks use ephemeral PostgreSQL and a test identity provider; cloud credentials are not required.

## Publishing

Deploy the repository through Vercel using `vercel.json`; `dist/` alone does not include the server APIs. Complete the hosted authentication/database smoke test documented in CONTROL-REPORT.md before enabling production collection.

Canonical, Open Graph, structured data, sitemap, and robots URLs use `https://aynko.dev/`. Contact remains `aymane.chellak@outlook.fr`. The construction ERP remains in user acceptance testing; the site makes no invented outcome or endorsement claims. See [CONTENT-NEEDED.md](CONTENT-NEEDED.md) for outstanding project evidence.

The older DESIGN.md, MOTION-REPORT.md, and non-React visual scripts document previous versions. The current public-page verification is `npm test`.

See [ROBOT-GUIDE.md](ROBOT-GUIDE.md) for the interactive robot, 3D blueprint, photo covers, live AI configuration, voice controls, and conversation verification.

## Conversational robot

Open **Talk to A-01** below the four robot controls. On desktop, the view expands to keep the robot beside the conversation. Questions are answered through the server using the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text), with the published portfolio data included as context. The robot reacts while waiting and while speaking. **Voice off/on** enables optional browser speech synthesis; it is off by default. **Stop voice**, **Cancel reply**, **Clear chat**, and Escape are available. Typing works without speech support. Voice selection and pronunciation depend on installed browser/device voices.

For live answers, set these server environment values (in ignored `.env.local` for development, or the deployment environment):

```dotenv
SITE_ORIGIN=http://127.0.0.1:4173
OPENAI_API_KEY=your-key-here
OPENAI_CHAT_MODEL=gpt-5-mini
```

Use the exact deployed HTTPS origin in production. Restart the server after changing environment values. No API key is bundled into the browser. Without a key the interface clearly reports unavailable chat and points to the contact section; it does not simulate generated answers. Availability does not guarantee provider quota or model access.

History stays in page memory and sends at most five recent exchanges, additionally capped by request size. Reloading or clearing the conversation removes the local history. The API requests `store: false`; provider abuse-monitoring retention can still apply. Optional speech may be processed by the browser's voice provider. See the updated privacy page.

The endpoint validates origin, body size, message roles, and lengths, limits concurrent requests, and times out provider calls. Request limits are per server instance (eight per address per minute, sixty total). For a public deployment, configure a platform-wide rate limit for `/api/chat` and an OpenAI project spending limit; in-memory limits do not span serverless instances. Chat does not send email or write to the owner database.

```sh
npm run test:chat
npm run test:companion
```

These checks use a simulated provider, with no paid API requests. They cover validation, history, provider errors, rate limits, gestures and replay, speech start/stop, cancellation, escaped output, keyboard focus, accessibility, cover loading, diagram controls, mobile layouts, and reduced motion. Live provider authentication and actual device voice output require a configured deployment and device check.

# Robot and visual upgrades

The four buttons below A–01 now run distinct, replayable gestures: Data scans the body, Flow conducts with articulated arms, AI lifts the core and tilts its head, and Edge lifts and turns the robot. Pointer tracking, pause, offscreen suspension, WebGL fallback and reduced-motion support remain available.

The process blueprint has layered 3D planes, orbiting particles, animated connections and pointer-driven perspective. Its pause button controls the continuous animation; it also pauses while offscreen or while the tab is hidden.

Each project uses a local, optimized concept cover photograph in `assets/covers/`, with 640px and 1280px WebP sizes. Actual product screenshots remain in the case-study galleries.

## Enable live conversation

Copy `.env.example` to `.env.local` and set these server-side values for local development:

```dotenv
SITE_ORIGIN=http://127.0.0.1:4173
OPENAI_API_KEY=your-server-side-key
OPENAI_CHAT_MODEL=gpt-5-mini
```

Run `npm run dev` (or `npm.cmd run dev` in restricted PowerShell), then open `http://127.0.0.1:4173`. In production, configure the same values in Vercel, using the exact public origin for `SITE_ORIGIN`. Restart the local server or redeploy after changing environment values. Never put the key in browser code or commit `.env.local`.

The `/api/chat` endpoint uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) with published portfolio context and recent conversation history. It requests `store: false`, validates input and origin, bounds requests and output, applies per-instance burst and concurrency limits, and sanitizes provider errors. For a multi-instance public deployment, add a platform-wide rate limit and configure provider spending limits.

Visitors type a question and can enable **Voice on** to hear answers through browser speech synthesis. Speech availability and voice quality depend on the browser and installed voices. There is no microphone recording. The robot reacts while thinking and answering, including when voice is off. Closing chat cancels an in-flight request and stops speech. Conversations are not saved by this application and disappear when the page reloads. Messages are sent to OpenAI only when submitted; see the site's privacy page.

Without a server key, the interface explicitly reports that live AI is unavailable. It does not impersonate a generative model with canned replies.

## Verification

```sh
npm run build
node tools/verify-react.mjs
node --test tests/chat-contract.test.mjs
node tools/verify-robot-conversation.mjs
npm run test:security
```

The conversation browser check uses mocked provider answers and speech callbacks to verify question submission, context, thinking/answering states, speech controls, cancellation, replayable gestures, accessibility and responsive layouts. Real model answers and audible device speech require a configured key and a browser with speech support; automated mocked checks do not establish their live availability.

Visual review captures are saved under `artifacts/upgrade-*.png`.

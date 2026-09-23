# AYNKO public experience + private control

## Delivery and activation status

Implemented in the existing static portfolio without replacing the projects, branding, layout, masked hero, system core, cursor, magnetic interactions, or scroll architecture. No production deployment, cloud project creation, live Auth login, live email delivery, or real visitor collection has been performed. No Supabase credentials or owner UUID were available in this workspace. Until those are configured, the form reports its unavailable state with a direct email fallback and all private data operations fail closed.

The existing contact email, `aymane.chellak@outlook.fr`, is the **example** owner email in `.env.example`; access still requires the explicitly configured confirmed Supabase user ID. There is no default owner account, password, bypass, or demo data in the application.

## 1. Architecture and provider decision

The public site stays native HTML/CSS/ES modules. `api/control.js` is a single Vercel Node endpoint backed by server modules, with `/admin` and `/owner/login` rewrites. Private HTML is produced only by the server, after authorization for `/admin`; it is absent from `dist/`. Public dashboard CSS/JS contain no private data or credentials.

Supabase combines hosted Auth and PostgreSQL. Vercel Web Analytics was evaluated: it provides hosted traffic/custom-event reporting, but this owner interface also needs private inbox operations, exports, and custom aggregate queries. A small first-party event table in the already-required database avoids another analytics service and identity system. No Vercel Analytics, Umami, Plausible, PostHog, or overlapping trackers are installed.

Reference: [Vercel custom events](https://vercel.com/docs/analytics/custom-events), [Vercel hosted reporting](https://vercel.com/docs/analytics/using-web-analytics), [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js).

## 2. Authentication and authorization

Supabase email/password authentication is called **server-side** through its Auth HTTP API. The provider is asked for the authenticated user; both the immutable UUID and confirmed email must match `ADMIN_USER_ID` and `ADMIN_EMAIL`. Neither request JSON nor browser state can grant access.

After verification, the server creates a random 256-bit opaque session cookie. Only its SHA-256 hash is stored in PostgreSQL; the provider access token is encrypted using AES-256-GCM before storage. Cookies are HTTP-only, SameSite=Strict, Path=/, and use Secure plus the `__Host-` prefix on HTTPS. A session expires within one hour or the provider's shorter token lifetime. Reloading persists it until expiry. Expired sessions require a new login; there is deliberately no refresh token in the browser or automatic indefinite session.

Every private request looks up the session, checks expiry, verifies the provider user, and applies the owner allow-list **before querying private data**. Logout deletes the database session, so replaying its cookie is denied. Changing the allow-list also denies an existing session. Supabase sessions are additionally signed out on a best-effort basis. There is no public registration interface.

Reference: [Supabase verified user lookup](https://supabase.com/docs/reference/javascript/auth-getuser), [password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Auth sessions](https://supabase.com/docs/guides/auth/sessions).

## 3. Database and migrations

Run in order:

1. `supabase/migrations/001_control.sql`: `signals`, `owner_sessions`, `rate_buckets`, `events`; indexes; RLS; grants; atomic limiter; idempotent contact insertion; SQL analytics aggregation; retention function.
2. `supabase/migrations/002_events.sql`: allow-listed event insertion with duplicate UUID suppression.
3. `supabase/schedule-retention.sql`: enable pg_cron and schedule daily deletion at 03:17 UTC.

Signals contain ID/request ID, name, email, company, request type, message, budget, timeline, source page, received timestamp, and NEW/READ/REPLIED/ARCHIVED status. Contact PII is never joined to anonymous analytics. Event rows contain only the documented event dimensions and keyed random identifiers. All four tables enable RLS and revoke public/anon/authenticated access. RPC execution is revoked from those roles too; only the server service role receives access. The service role must never be exposed in frontend code.

SQL handles ranges/aggregation. Inbox responses are limited to 25 rows plus a next-page check; CSV exports have explicit 500-record batches. No endpoint loads every historical event into the browser. Events and submissions are retained for 365 days; expired sessions and rate buckets are pruned daily. Verify the cron job is active before enabling collection.

Reference: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

## 4. Public entry and character

`js/entry.js` and `experience.css` add a small systems-operator scene: seven actual CSS 3D volumes / 42 faces form a restrained mechanical humanoid, matching the current lime/charcoal architecture. Head tracking is bounded and interpolated; idle motion is two pixels. No remote model, texture, shader, post-processing pass, or WebGL loop is required.

The first visit has immediate Enter/Skip controls and continues automatically after 1.9 seconds. DATA/FLOW/AI/EDGE labels come online within roughly one second. The introduction is an intentional entry scene, not a claimed download percentage. Session storage skips repeat visits. Deep links, reduced motion, unavailable session storage, and hidden initial tabs skip the automatic scene. The hero offers an optional replay that remains open until dismissed.

Animation pauses while hidden and stops when closed. Mobile, reduced-motion, and forced-colors modes use an inline SVG silhouette. Existing desktop cursor and system-core interactions remain; native cursors are used inside top-layer dialogs, consistent with the previous implementation.

## 5. Visitor form

`js/contact.js` adds a native dialog opened by “Start a conversation” in the existing contact card. The email action remains available. Three steps cover Identity / Context / Message. Only name, email, request type, and the privacy acknowledgement are required. Company, message, budget, and timeline are optional. Every suggested request category is included.

The form has native validation, keyboard trapping, focus restoration, reduced-motion transitions, clear failures, preserved drafts, and a success state shown **only after database acknowledgement**. A stable request UUID makes retries idempotent. Hidden steps are disabled for correct validation/tab order, then fields are explicitly serialized at submission. Form text is never used as analytics metadata.

Server controls include length/type/email/enum validation, Unicode normalization and control-character removal, plain-text rendering, a 16KB request cap, signed expiring form challenge, honeypot, and durable rate limits. Client checks are convenience only. Forms fail honestly when storage is unavailable.

## 6. Analytics and privacy

The footer has an explicit analytics opt-in control, off by default, and a public privacy notice. DNT and GPC are respected. Consent withdrawal stops queued/new events and clears local browser/session IDs. IDs expire after 30 days / 30 minutes of inactivity and are HMAC-transformed before database storage. The consent choice itself persists until changed. Identifiers can reset or be shared, so the dashboard labels them approximate browsers, not verified people.

Both client and server exclude local development; the server additionally requires `VERCEL_ENV=production`, `ANALYTICS_ENABLED=true`, configured secrets, and an allowed origin. Preview deployments are excluded. An owner-session cookie suppresses measurement, including authenticated public browsing. No test-mode flag can enable tracking in the production app.

Events supported:

- `page_view`, `section_view` (headings visible for one second).
- `project_view` (media visible for one second), `project_open`, `project_external_click`.
- `hero_cta_click`, `contact_click`, `email_click`, `github_click`, `linkedin_click`.
- `contact_form_open`, `contact_form_started`, `contact_form_submitted`.
- `intro_skipped`, `3d_interaction` (one semantic interaction, not pointer coordinates).

GitHub/LinkedIn events only fire for actual matching links; no profiles were invented. Intro-skipped events are only observable for visitors who already opted in. Project opens include case-dialog opens through cards or the explorer. The private dashboard has no public tracker.

Traffic dimensions: referring **domain** (paths/query strings discarded), strictly constrained UTM source/medium/campaign labels, coarse device/browser/OS/screen category, first observed/returning browser, and country when Vercel supplies it. No city, precise location, raw user-agent string, raw IP address, fingerprints, keystrokes, recordings, or analytics form content are stored. IP addresses are processed transiently for short-lived HMAC rate-limit keys. Provider infrastructure logs remain subject to provider policies.

No home-grown human/bot classifier is presented as reliable. Enable Vercel managed bot rules for the collection route. Client analytics can be blocked or forged; dashboard caveats make that clear. Empty referrers are “Direct / unavailable.” “Recent” means distinct observed browsers in the last 30 minutes, not asserted online presence. “Retained history” replaces an unreliable lifetime-people claim. Zeroes are returned only from successful queries, never substituted for a failed service.

## 7. Owner dashboard

`server/pages.js`, `control/control.css`, `control/dashboard.js`, and `control/login.js` create AYNKO / CONTROL with Overview, Traffic, Projects, Visitors, Signals, and System sections. It shares the site's fonts/palette while using minimal motion.

- Today / 7-day / 30-day / retained-history views, approximate browsers and sessions; meaningful previous-period view trends.
- 24H / 7D / 30D / 90D traffic graph built directly with SVG, plus an accessible data table and UTC timestamps.
- Referrers/counts/percentages, section observations, device/browser/OS/country/screen/campaign summaries.
- Project card observations, opens, external clicks, and distinct viewed/opened sessions. No misleading conversion percentage when explorer opens can bypass a card impression.
- Paginated/filterable inbox, detail view, status mutation, explicit permanent deletion, authenticated CSV batches.
- Session/environment/analytics/notification configuration status; errors stay visible.

Tables remain horizontally scrollable and keyboard-focusable on small screens; mobile uses stacked cards and compact navigation. Private routes have `no-store`, `noindex`, CSP, anti-framing, and nosniff headers. There are no public dashboard links or sitemap entries. Robots exclusions supplement, never replace, authentication.

## 8. Notifications, security and dependency decisions

Optional Resend notifications send only a generic owner-inbox notice, after a successful insert, from a configured verified sender. Message content and visitor email are not included. Notification failure never reverses a saved submission; delivery is best effort, not a guaranteed outbox. No emails were sent during implementation/testing. [Resend send API](https://resend.com/docs/api-reference/emails/send-email).

Mutation requests require exact same-origin headers and JSON content type; session cookies are SameSite=Strict. The API never enables cross-origin credential sharing. Login, challenge, submission, and event collection have database-backed atomic rate limits. HMAC validation uses constant-time comparison. Queries are fixed server operations and parameterized provider calls; output uses textContent. CSV prefixes formula-like values to avoid spreadsheet execution. Provider errors never echo credentials or submitted records. Secrets and private source are excluded from the public build and local static serving.

No runtime dependency was added. Native fetch accesses the mature hosted Auth/Data APIs; CSS 3D and SVG avoid graphics/chart dependencies. **One dev dependency**, `@electric-sql/pglite@0.5.8`, executes actual PostgreSQL migrations, grants, functions, aggregates, and persistence in automated tests. It is never imported into the application or copied to `dist/`. Existing Playwright and axe are reused. [PGlite testing rationale](https://pglite.dev/docs/about).

## 9. Environment variables

All are server-side; `.env.example` is a template and `.env.local` is ignored.

| Variable | Purpose |
| --- | --- |
| `SITE_ORIGIN` | Exact canonical origin, e.g. `https://aynko.vercel.app`; local preview uses `http://127.0.0.1:4173` |
| `SUPABASE_URL` | Hosted project HTTPS URL |
| `SUPABASE_ANON_KEY` | Auth API key, used by the server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Data API service-role credential |
| `ADMIN_EMAIL` | Single confirmed owner email |
| `ADMIN_USER_ID` | Exact UUID of the same owner account |
| `SESSION_SECRET` | Random secret of at least 32 characters; encrypts stored access tokens |
| `RATE_LIMIT_SECRET` | Independent random secret; rate hashes and form challenge |
| `ANALYTICS_SECRET` | Independent random secret; anonymous ID HMAC |
| `ANALYTICS_ENABLED` | Explicit `true` only when production collection is ready |
| `VERCEL_ENV` / `VERCEL` | Set by Vercel; do not force production in preview |
| `RESEND_API_KEY` | Optional server-only email credential |
| `NOTIFICATION_FROM` | Optional verified sender |

Changing SESSION_SECRET invalidates existing owner sessions. Changing ANALYTICS_SECRET breaks continuity of approximate browser counts. Treat them as stable secrets, with intentional rotation.

## 10. Deployment steps

1. Create or select a Supabase project and the desired database region. Run both migrations and the retention schedule. Confirm all private tables have RLS and no anon/authenticated grants; verify cron activation and execution history.
2. Create the owner in Supabase Auth, confirm its email, and set a strong password. Set **both** its UUID and email in the Vercel environment. Disable public signups in Supabase Auth. No browser-side sign-up is used.
3. Set the remaining production secrets from `.env.example` in Vercel. Use three independently generated cryptographic random secrets; never commit them. For local integration, put values in `.env.local` with the local SITE_ORIGIN. Use a separate Supabase project for previews/test submissions rather than sharing a production inbox.
4. Optional: configure a verified Resend sender and key. Confirm actual delivery after deployment; the application does not invent delivery status.
5. Deploy the repository with Node 22+ and `vercel.json`. Vercel runs `npm run build`, serves `dist/`, and deploys `api/control.js` with its server imports. Uploading `dist/` to a static-only host does **not** deploy the APIs. Preview using `npm run dev`; to serve the built assets locally, use `node tools/serve.mjs dist`.
6. On the canonical production origin, verify anonymous `/admin` and private API/export denial; sign in at `/owner/login`; test session/logout; submit one clearly labeled verification enquiry; confirm inbox persistence/status/export; delete that test record. Verify the retention job. These hosted-provider checks remain outstanding until credentials/deployment are available.
7. Enable managed bot/rate rules in Vercel as appropriate. Enable ANALYTICS_ENABLED only after reviewing privacy/retention settings. Opt in and verify one production page/project event; do not seed invented visitor statistics.

## 11. Tests performed and limits

- `npm run test:security`: provider verification/allow-list failures, anonymous/forged/expired/non-owner sessions, protected pages/APIs/exports, replay after logout, CSRF, RLS/grants, request limits, validation/honeypot, deduplication, CSV injection, pagination/deletion, concurrent rate limiter, event whitelist/privacy/exclusion, real SQL aggregation/retention, source/config exposure.
- `npm run test:product`: Playwright browser entry/skip/replay/returning state, character response, actual PostgreSQL form persistence, real inbox data/status/export, login/logout, consent/withdrawal, event instrumentation, owner exclusion, dashboard responsiveness, reduced motion, unavailable-service draft recovery, and axe audits.
- `npm test`: original project/pillar dialogs, nine viewport widths (320 through 1920), navigation, FAQ, no-JavaScript/failed-assets behavior, accessibility, runtime/resources.
- `npm run test:interactions`: existing cursor states, magnets, system core, scroll/process interactions, reduced motion, touch, failed imports, and cleanup.
- `npm run build`: syntax validation and explicit public-only artifact assembly; production bundle/source checks. `npm audit` found no reported dependency vulnerabilities during installation.
- `npm run check:performance`: local first-entry sample at 1440px LCP 396ms / CLS 0.000125; at 375px with 4× CPU / 1.6Mbps / 150ms latency LCP 1624ms / CLS 0. The entry itself auto-dismisses at 1.9s; these browser paint metrics are not time-to-full-portfolio or field guarantees.

Test accounts/events/messages exist only inside ephemeral test databases, never as application demo data. **Supabase Auth is a test identity-provider double in integration tests**, while PostgreSQL is real via PGlite. Hosted Supabase Auth, Vercel routing/cookie behavior, pg_cron activation, and Resend delivery still need the deployment smoke test above. Safari/iOS and assistive-technology/device testing remain useful. No claim of an independent penetration test or heap-level leak audit is made.

## 12. Optional follow-ups

Owner MFA/passkeys with a full challenge flow; stronger managed bot challenges if actual abuse warrants them; delivery outbox/retries if email notification reliability becomes important; daily summary tables if event volume makes retained-history queries expensive; physical Safari/Firefox testing and production field-performance monitoring. The present implementation deliberately avoids separate analytics accounts, huge dashboard packages, and continuous 3D rendering.

# Content that would strengthen the site

The public page uses the existing projects, statuses, screenshots, contact address, and independent-practice positioning. No clients, testimonials, metrics, certifications, or partner relationships were added.

## Project evidence

For each project, provide:

- Your exact role and contribution, collaborators where relevant, dates, and current delivery status.
- A measurable outcome with its baseline, measurement period, method, and source. If there is no measured outcome, a precise approved qualitative result is sufficient.
- Permission to name the client and display their logo, screenshots, or project details.
- An exact approved testimonial, the person's name, role, company, and publication permission.

`index.html` includes an inert `#project-evidence-template` with a styled outcome and quote structure. It is deliberately not rendered. After evidence is approved, clone it into the relevant project body, replace every bracketed placeholder, and remove any unsupported paragraph or quote. Do not ship placeholders or imply that the project names are client endorsements.

## Practice and contact

Confirm the public name “Aymane Chellak” (inferred from the existing contact address), the independent-practice description, and whether Morocco/remote is still accurate. Supply an approved portrait and biography if you want to expand the About section. The lettermark currently fills that visual role without a stock portrait.

Supply any professional profile links, legal business name/registration, public business address, and applicable legal/privacy text you want published. No unverified registration, response-time promise, price, or delivery guarantee is shown.

## Domain and privacy

The metadata, sitemap, and robots file now consistently use the existing HTML's `https://aynko.dev/`. Confirm that this is the production domain before deploying.

There is no analytics or contact-form integration in the frontend. Email links use the visitor's email client. The introduction stores only a local timestamp (`aynko:last-intro`) to skip repeat animations for 24 hours; it is not transmitted by this code. Hosting logs and email-provider handling depend on your deployment. Supply reviewed legal copy based on those actual services before adding legal links.

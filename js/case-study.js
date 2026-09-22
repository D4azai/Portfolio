import { motionAllowed } from "./motion.js";
import { images } from "./image-manifest.js";
import { trapDialogFocus } from "./dialog.js";

// Editorial additions describe the supplied project scope, not unverified metrics.
const notes = {
  affiliate: {
    constraint:
      "Stock, destination tariffs, carrier handoffs and seller balances need to agree across several roles and three languages.",
    implementation:
      "Seller, warehouse, delivery and administration workspaces; role-based access; carrier integration; automated customer messages; and a wallet ledger tied to delivery.",
    flow: [
      "Seller / order",
      "Inventory / routing",
      "Carrier / delivery",
      "Wallet / payout",
    ],
    boundary: "Shared operational records · role-based access · FR / AR / EN",
    status: "LIVE PRODUCT",
  },
  erp: {
    constraint:
      "Each site needs an accountable manager, its own stock location and analytic cost structure, with explicit approval and closure conditions.",
    implementation:
      "Chantier numbering; lifecycle control; analytic accounting; material requests; estimates and BOQ revisions; quality inspections; RFIs; submittals; variations; and progress certificates.",
    result:
      "A connected foundation for site governance, materials and cost control, prepared for user acceptance testing.",
    flow: [
      "Project / site",
      "Materials / stock",
      "Estimate / BOQ",
      "Cost / approval",
    ],
    boundary: "Odoo 17 · custom Python addon · PostgreSQL · Docker",
    status: "UAT",
  },
  crm: {
    constraint:
      "Pipeline, relationships, communications and permissions must remain connected as teams move from an overview into daily follow-up.",
    architecture:
      "The operational model connects lead stages to contact and organization records, activities, communications and configurable workflows. User and role management governs the workspace.",
    implementation:
      "Dashboard reporting; lead management; contacts and organizations; activities; quotations; mail; user and role management; types, sources, attributes and workflow configuration.",
    flow: [
      "Lead / pipeline",
      "Contact / context",
      "Activity / follow-up",
      "Workflow / reporting",
    ],
    boundary: "Sales workspace · shared relationship context · users and roles",
    status: "PRODUCT WORKSPACE",
  },
  studioNorth: {
    constraint:
      "Balances, cash movement and invoice status compete for attention. The hierarchy must keep urgent numbers and next actions legible, including on mobile.",
    architecture:
      "An information architecture organized around a financial overview, with dedicated invoice and transaction surfaces. Supporting detail remains close to the summary that gives it context.",
    system:
      "Available balance, income and expense summaries, cash-flow charts, upcoming invoices, recent activity, transaction history, invoice status and mobile views.",
    implementation:
      "Responsive overview, invoice management, transaction history and mobile layouts, with a consistent hierarchy for amounts, statuses and next actions.",
    result:
      "A calm, connected finance interface that makes the daily position easier to scan and the next action easier to find.",
    flow: [
      "Balance / overview",
      "Cash flow / insight",
      "Invoice / status",
      "Transaction / detail",
    ],
    boundary:
      "Product interface · financial information architecture · responsive layouts",
    status: "PRODUCT EXPERIENCE",
  },
  northstar: {
    constraint:
      "A differentiated first impression needs a clear route to the offer and enquiry. Motion must preserve that reading order.",
    architecture:
      "A React single-page application built with Vite. The experience connects a focused hero, service pillars, the firm approach and a direct enquiry path.",
    implementation:
      "GSAP and ScrollTrigger provide the animation layer, static media provides the visual narrative, and Vercel handles deployment.",
    result:
      "A focused digital presence that gives the advisory brand a coherent path from first impression to enquiry.",
    flow: [
      "Position / hero",
      "Offer / services",
      "Approach / trust",
      "Enquiry / action",
    ],
    boundary: "React · Vite · GSAP / ScrollTrigger · Vercel",
    status: "LIVE EXPERIENCE",
  },
};

export function initCaseStudies(cases) {
  const caseKeys = Object.keys(cases);
  const dialog = document.querySelector(".case-dialog");
  trapDialogFocus(dialog);
  const content = dialog.querySelector(".dialog-content");
  const scroller = dialog.querySelector(".dialog-scroll");
  let trigger;
  let previousOverflow = "";
  let currentKey = "";
  let transition;
  let closing = false;
  let sourceHeading;
  let desiredKey = "";
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const animate = (update) => {
    transition?.skipTransition();
    if (motionAllowed() && document.startViewTransition) {
      transition = document.startViewTransition(update);
      transition.ready.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      transition.finished.catch(() => {});
    } else {
      update();
      if (dialog.open && motionAllowed())
        dialog.animate(
          [
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 350, easing: "cubic-bezier(.22,1,.36,1)" },
        );
    }
  };
  const render = (key) => {
    const item = cases[key];
    const note = notes[key];
    const original = Object.fromEntries(item.sections);
    const chapters = [
      ["Context", original.Problem || original.Focus || item.lede],
      ["Constraint", note.constraint],
      ["Architecture", note.architecture || original.Architecture],
      ["System", note.system || original.Solution],
      ["Implementation", note.implementation],
      [
        "Result",
        note.result || original.Result || original["Operational value"],
      ],
    ];
    const gallery = item.gallery
      ? `<div class="case-gallery">${item.gallery
          .map(([src, caption]) => {
            const asset = images[src];
            const attributes = asset
              ? `src="${asset.src}" srcset="${asset.srcset}" sizes="(max-width: 680px) 85vw, 500px" width="${asset.width}" height="${asset.height}"`
              : `src="${escape(src)}"`;
            return `<figure><a href="${escape(src)}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size screenshot: ${escape(item.title)} — ${escape(caption)} (new tab)"><img ${attributes} alt="" loading="lazy" decoding="async"></a><figcaption>${escape(caption)} <span aria-hidden="true">↗</span></figcaption></figure>`;
          })
          .join("")}</div>`
      : "";
    const nextKey = caseKeys[(caseKeys.indexOf(key) + 1) % caseKeys.length];
    content.innerHTML = `
      <p class="dialog-kicker">${escape(item.kicker)} <span aria-hidden="true"> / </span> ${note.status}</p>
      <h2 id="case-title">${escape(item.title)}</h2>
      <p class="dialog-lede">${escape(item.lede)}</p>
      <ul class="dialog-tags">${item.tags.map((tag) => `<li>${escape(tag)}</li>`).join("")}</ul>
      <div class="case-system" role="group" aria-label="${escape(item.title)} operational model">
        <p>FIG. 01 / OPERATIONAL MODEL</p>
        <ol class="case-flow">${note.flow.map((node, i) => `<li><small>0${i + 1}</small><strong>${escape(node)}</strong></li>`).join("")}</ol>
        <small>${escape(note.boundary)}</small>
      </div>
      <div class="case-sections">${chapters.map(([title, copy], i) => `<section class="case-section"><h3><span>0${i + 1}</span>${title}</h3><p>${escape(copy || item.lede)}</p></section>`).join("")}</div>
      ${gallery}
      <div class="case-footer">${item.live ? `<a class="button button-primary" href="${escape(item.live)}" target="_blank" rel="noopener noreferrer">Visit live project <span aria-hidden="true">↗</span></a>` : '<span class="dialog-kicker">AYNKO / SELECTED SYSTEMS</span>'}<a class="text-action" href="#case/${nextKey}" data-case="${nextKey}">Next: ${escape(cases[nextKey].title)} <span aria-hidden="true">→</span></a></div>`;
  };
  const show = (key) => {
    if (!caseKeys.includes(key) || (key === currentKey && dialog.open)) return;
    desiredKey = key;
    if (!dialog.open) {
      if (!currentKey) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }
      if (sourceHeading) sourceHeading.style.viewTransitionName = "";
      sourceHeading = trigger?.closest("article")?.querySelector("h3");
      if (sourceHeading && motionAllowed() && document.startViewTransition)
        sourceHeading.style.viewTransitionName = "project-heading";
    }
    currentKey = key;
    closing = false;
    document.title = `${cases[key].title} — AYNKO / Case study`;
    animate(() => {
      if (desiredKey !== key) return;
      if (sourceHeading) sourceHeading.style.viewTransitionName = "";
      render(key);
      content.querySelector("h2").style.viewTransitionName = "project-heading";
      if (!dialog.open) dialog.showModal();
      scroller.scrollTop = 0;
      dialog.querySelector(".dialog-close").focus({ preventScroll: true });
      document.dispatchEvent(new Event("aynko:dialog"));
    });
  };
  const hide = () => {
    desiredKey = "";
    if (!dialog.open) {
      document.body.style.overflow = previousOverflow;
      if (sourceHeading) sourceHeading.style.viewTransitionName = "";
      currentKey = "";
      document.title = "AYNKO — Software Engineer & Systems Architect";
      return;
    }
    if (closing) return;
    closing = true;
    animate(() => {
      if (desiredKey) return;
      dialog.close();
      if (sourceHeading && motionAllowed() && document.startViewTransition)
        sourceHeading.style.viewTransitionName = "project-heading";
    });
    const heading = sourceHeading;
    transition?.finished
      .finally(() => {
        if (heading) heading.style.viewTransitionName = "";
      })
      .catch(() => {});
  };
  const syncRoute = () => {
    const key = location.hash.startsWith("#case/")
      ? location.hash.slice(6)
      : "";
    if (caseKeys.includes(key)) show(key);
    else hide();
  };
  const close = () => {
    if (history.state?.aynkoCase) history.back();
    else {
      history.replaceState(null, "", "#work");
      hide();
    }
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-case]");
    if (
      !link ||
      !caseKeys.includes(link.dataset.case) ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button > 0
    )
      return;
    event.preventDefault();
    const key = link.dataset.case;
    if (!dialog.open) {
      trigger = link;
      history.pushState({ aynkoCase: true }, "", `#case/${key}`);
    } else history.replaceState(history.state, "", `#case/${key}`);
    show(key);
  });
  dialog.querySelector(".dialog-close").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    document.title = "AYNKO — Software Engineer & Systems Architect";
    currentKey = "";
    closing = false;
    const restore = trigger || document.querySelector("#work");
    restore.setAttribute("tabindex", restore.matches("a,button") ? "0" : "-1");
    restore.focus({ preventScroll: true });
  });
  addEventListener("popstate", syncRoute);
  addEventListener("hashchange", syncRoute);
  syncRoute();
}

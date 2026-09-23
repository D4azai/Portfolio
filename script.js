import { initMotion, animateDialog } from "./js/motion.js";
import { initPointer } from "./js/pointer.js";
import { images } from "./js/image-manifest.js";
import { pillars, renderPillar } from "./js/pillars.js";

const cases = {
  affiliate: {
    kicker: "Case study 01 / Operational SaaS",
    title: "Maroc Affiliate",
    lede: "A unified cash-on-delivery platform that connects inventory, routing, delivery, customer communication, and seller payouts.",
    tags: [
      "Custom SaaS",
      "Inventory",
      "Logistics",
      "WhatsApp automation",
      "Wallet & payouts",
      "Role-based access",
      "FR / AR / EN",
    ],
    live: "https://marocaffiliate.com/fr",
    gallery: [["maroc-affiliate-01.png", "Public product website"]],
    sections: [
      [
        "Problem",
        "Cash-on-delivery operations can fragment across spreadsheets, courier conversations, WhatsApp, and informal financial records. Stock, delivery tariffs, and seller margins become difficult to coordinate as volume grows.",
      ],
      [
        "Solution",
        "One operational platform built around the seller workflow. It exposes live stock, applies destination tariffs, selects a carrier, reserves inventory, follows the parcel, automates customer messages, and records seller wallet movement after delivery.",
      ],
      [
        "Architecture",
        "Localized public site and seller, warehouse, delivery, and administration workspaces connected to inventory, routing, carrier integrations, messaging automation, and a financial ledger.",
      ],
      [
        "Result",
        "A clearer operating model for the people managing fulfillment, delivery rules, customer communication, and financial reconciliation.",
      ],
    ],
  },
  erp: {
    kicker: "Case study 02 / ERP & Construction / User acceptance testing",
    title: "Construction Site ERP",
    lede: "A custom Odoo 17 construction system connecting site governance, material requests, estimating, BOQ workflows, quality, and project control.",
    tags: [
      "Odoo 17",
      "Python",
      "PostgreSQL",
      "Inventory",
      "Analytic accounting",
      "RBAC",
      "Docker",
    ],
    gallery: [
      ["odoo-02-chantier-form.png", "Controlled site lifecycle"],
      ["odoo-03-material-request.png", "Material request workflow"],
      ["odoo-04-estimation.png", "Construction estimating"],
      ["odoo-05-boq.png", "BOQ review workflow"],
    ],
    sections: [
      [
        "Problem",
        "Construction sites need more than task lists. Their lifecycle, stock location, cost structure, managers, and closure conditions must stay connected.",
      ],
      [
        "Solution",
        "A custom Odoo addon that gives every chantier a unique reference and controlled lifecycle. Manager initialization creates its analytic account and dedicated stock location beneath the selected warehouse.",
      ],
      [
        "Technical scope",
        "Chantier numbering; lifecycle control; analytic accounting; site stock locations; material requests; estimates; BOQ revisions; quality inspections; RFIs; submittals; variations; and progress certificates.",
      ],
      [
        "Architecture",
        "Odoo Project provides the foundation. The custom module connects it to native Inventory, Analytic Accounting, company security, PostgreSQL, and a repeatable Docker environment.",
      ],
    ],
  },
  crm: {
    kicker: "Case study 03 / CRM & Sales Operations",
    title: "CRM",
    lede: "A unified CRM workspace designed to give sales teams a practical view of pipeline health, customer relationships, and daily follow-up.",
    tags: [
      "Sales pipeline",
      "Dashboard",
      "Contacts",
      "Email templates",
      "Workflow automation",
      "Users & roles",
    ],
    gallery: [
      ["assets/crm/leads.png", "Pipeline board"],
      ["assets/crm/contacts.png", "Contact workspace"],
      ["assets/crm/workflows.png", "Workflow configuration"],
    ],
    sections: [
      [
        "Problem",
        "Sales teams lose context when pipeline, customer records, communications, permissions, and follow-up processes live in different tools.",
      ],
      [
        "Solution",
        "A connected workspace that keeps performance, pipeline stages, contacts, communications, and configuration within one operating surface.",
      ],
      [
        "Product surfaces",
        "Dashboard reporting; lead management; contacts and organizations; activities; quotations; mail; user and role management; types, sources, attributes, and workflow configuration.",
      ],
      [
        "Operational value",
        "Teams can move from a high-level sales view into the records and workflow settings that drive follow-up without unnecessary tool switching.",
      ],
    ],
  },
  studioNorth: {
    kicker: "Case study 04 / Finance Product Experience",
    title: "Studio North",
    lede: "A polished finance workspace that turns balances, cash flow, invoices, and transactions into an approachable daily overview.",
    tags: [
      "Financial overview",
      "Cash flow",
      "Invoices",
      "Transactions",
      "Insights",
      "Responsive UI",
    ],
    gallery: [
      [
        "Secondo project/Secondo project/demo-dashboard.png",
        "Financial overview",
      ],
      [
        "Secondo project/Secondo project/demo-invoices.png",
        "Invoice management",
      ],
      [
        "Secondo project/Secondo project/demo-transactions.png",
        "Transaction history",
      ],
      [
        "Secondo project/Secondo project/demo-phone-overview.png",
        "Mobile overview",
      ],
    ],
    sections: [
      [
        "Focus",
        "A calm, legible product interface for people who need to understand their financial position quickly.",
      ],
      [
        "Product surfaces",
        "Available balance, income and expense summaries, cash-flow charts, upcoming invoices, recent activity, transaction history, invoice status, and mobile views.",
      ],
      [
        "Experience",
        "The information hierarchy keeps urgent numbers and next actions visible while supporting detail remains easy to scan.",
      ],
    ],
  },
  northstar: {
    kicker: "Case study 05 / Digital Experience",
    title: "Northstar",
    live: "https://demo-beta-seven-31.vercel.app/",
    lede: "A cinematic, motion-led website that gives a business-advisory brand a focused and confident digital presence.",
    tags: ["React", "Vite", "GSAP", "ScrollTrigger", "Motion design", "Vercel"],
    sections: [
      [
        "Problem",
        "Professional-service websites often feel interchangeable. Generic layouts and weak hierarchy can make a considered offer appear ordinary before a conversation begins.",
      ],
      [
        "Solution",
        "A single-page brand experience built around a clear hero, service pillars, the firm approach, and a direct call to action. Video, typography, and scroll motion control pace and attention.",
      ],
      [
        "Technical approach",
        "A React single-page application built with Vite, with GSAP and ScrollTrigger providing the animation layer, static media providing the visual narrative, and Vercel handling deployment.",
      ],
    ],
  },
};
const dialog = document.querySelector(".case-dialog");
const dialogContent = dialog.querySelector(".dialog-content");
const dialogScroll = dialog.querySelector(".dialog-scroll");
let dialogTrigger;
let previousOverflow = "";

const closeDialog = () => {
  dialog.close();
  document.body.style.overflow = previousOverflow;
};
const showDialog = (content, trigger, variant = "") => {
  if (!dialog.open) {
    dialogTrigger = trigger;
    previousOverflow = document.body.style.overflow;
  }
  dialog.classList.toggle("pillar-dialog", variant === "pillar");
  dialogContent.innerHTML = content;
  if (!dialog.open) dialog.showModal();
  animateDialog(dialog);
  document.dispatchEvent(new Event("aynko:dialog"));
  document.body.style.overflow = "hidden";
  dialogScroll.scrollTop = 0;
  dialog.querySelector(".dialog-close").focus({ preventScroll: true });
};
const openDialog = (item, trigger, exploreKey = "") => {
  if (!item) return;
  dialog.dataset.project = Object.keys(cases).find(key => cases[key] === item) || "";
  const gallery = item.gallery
    ? `<div class="case-gallery">${item.gallery.map(([src, caption]) => {
      const image = images[src];
      const responsive = image ? `src="${image.src}" srcset="${image.srcset}" sizes="(max-width: 680px) 88vw, 430px" width="${image.width}" height="${image.height}"` : `src="${src}"`;
      return `<figure><a href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size screenshot: ${caption} (new tab)"><img ${responsive} alt="${caption}" loading="lazy" decoding="async"><figcaption>${caption} <span aria-hidden="true">↗</span></figcaption></a></figure>`;
    }).join("")}</div>`
    : "";
  const liveLink = item.live
    ? `<a class="button button-primary" href="${item.live}" target="_blank" rel="noopener noreferrer">Visit live project <span aria-hidden="true">↗</span></a>`
    : "";
  const sections = item.sections
    .map(
      ([heading, copy]) =>
        `<section class="case-section"><h3>${heading}</h3><p>${copy}</p></section>`,
    )
    .join("");
  const enquiry = `<aside class="case-enquiry"><h3>Facing a similar operational challenge?</h3><p>Share your workflow and the outcome you need. Let’s find the useful first step.</p><a class="text-action" href="mailto:aymane.chellak@outlook.fr?subject=${encodeURIComponent(`Project enquiry — ${item.title}`)}">Discuss your project <span aria-hidden="true">↗</span></a></aside>`;
  const back = exploreKey ? `<button class="text-action explore-back" type="button" data-explore-back="${exploreKey}">← All projects</button>` : "";
  showDialog(`${back}<p class="dialog-kicker">${item.kicker}</p><h2 id="case-title">${item.title}</h2><p class="dialog-lede">${item.lede}</p>${liveLink}<ul class="dialog-tags">${item.tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>${gallery}<div class="case-sections">${sections}</div>${enquiry}`, trigger);
};

const exploreTrigger = document.querySelector("[data-explore]");
const openExplorer = (selectedKey = "") => {
  const cards = Object.entries(cases).map(([key, item], index) => `<article class="explore-card"><small>0${index + 1} / ${key === "erp" ? "USER ACCEPTANCE TESTING" : "SELECTED PROJECT"}</small><h3>${item.title}</h3><p>${item.lede}</p><button class="text-action" type="button" data-explore-case="${key}" aria-label="Read the ${item.title} case study">Read the case study <span aria-hidden="true">↗</span></button></article>`).join("");
  showDialog(`<p class="dialog-kicker">AYNKO / Selected work</p><h2 id="case-title">Explore the systems.</h2><p class="dialog-lede">A closer look at what each project does. Choose a card to explore the problem, approach, and project details.</p><div class="explore-grid">${cards}</div>`, exploreTrigger);
  if (selectedKey) dialogContent.querySelector(`[data-explore-case="${selectedKey}"]`)?.focus();
};
exploreTrigger.setAttribute("aria-haspopup", "dialog");
exploreTrigger.addEventListener("click", event => {
  // Keep the underlying anchor usable in a new tab or without JavaScript.
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openExplorer();
});
dialogContent.addEventListener("click", event => {
  const pillar = event.target.closest("[data-pillar-switch]");
  if (pillar && pillars[pillar.dataset.pillarSwitch]) {
    showDialog(renderPillar(pillar.dataset.pillarSwitch), dialogTrigger, "pillar");
    dialogContent.querySelector("#case-title").focus({ preventScroll: true });
    return;
  }
  const card = event.target.closest("[data-explore-case]");
  const back = event.target.closest("[data-explore-back]");
  if (card) openDialog(cases[card.dataset.exploreCase], exploreTrigger, card.dataset.exploreCase);
  if (back) openExplorer(back.dataset.exploreBack);
});

document.querySelectorAll("[data-pillar]").forEach(trigger => {
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showDialog(renderPillar(trigger.dataset.pillar), trigger, "pillar");
  });
});
document
  .querySelectorAll("[data-case]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openDialog(cases[button.dataset.case], button),
    ),
  );
dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog();
});
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = [
    ...dialog.querySelectorAll("a[href], button:not([disabled])"),
  ];
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog.addEventListener("close", () => {
  // A queued close from a previous view must not steal focus from a reopened one.
  if (dialog.open) return;
  document.body.style.overflow = previousOverflow;
  // Native dialog.close() already restores focus synchronously. Only repair it
  // if the browser left focus on the body, never override a user's next target.
  if (document.activeElement === document.body) dialogTrigger?.focus({ preventScroll: true });
});

// All enhancements return cleanup functions; BFCache restores keep their listeners.
const cleanupMotion = initMotion();
const cleanupPointer = initPointer();
addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    cleanupPointer();
    cleanupMotion();
  }
});

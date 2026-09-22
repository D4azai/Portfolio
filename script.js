import { initMotion, animateDialog } from "./js/motion.js";
import { initPointer } from "./js/pointer.js";

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
    kicker: "Case study 02 / ERP & Construction",
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
document.documentElement.classList.add("js-ready");

const dialog = document.querySelector(".case-dialog");
const dialogContent = dialog.querySelector(".dialog-content");
const dialogScroll = dialog.querySelector(".dialog-scroll");
let dialogTrigger;
let previousOverflow = "";

const closeDialog = () => {
  dialog.close();
  document.body.style.overflow = previousOverflow;
};
const openDialog = (item, trigger) => {
  if (!item || dialog.open) return;
  dialogTrigger = trigger;
  previousOverflow = document.body.style.overflow;
  const gallery = item.gallery
    ? `<div class="case-gallery">${item.gallery.map(([src, caption]) => `<figure><a href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size screenshot: ${caption} (new tab)"><img src="${src}" alt="${caption}" loading="lazy" decoding="async"><figcaption>${caption} <span aria-hidden="true">↗</span></figcaption></a></figure>`).join("")}</div>`
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
  dialogContent.innerHTML = `<p class="dialog-kicker">${item.kicker}</p><h2 id="case-title">${item.title}</h2><p class="dialog-lede">${item.lede}</p>${liveLink}<ul class="dialog-tags">${item.tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>${gallery}<div class="case-sections">${sections}</div>`;
  dialog.showModal();
  animateDialog(dialog);
  document.dispatchEvent(new Event("aynko:dialog"));
  document.body.style.overflow = "hidden";
  dialogScroll.scrollTop = 0;
  dialog.querySelector(".dialog-close").focus({ preventScroll: true });
};
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
  document.body.style.overflow = previousOverflow;
  dialogTrigger?.focus({ preventScroll: true });
});

const header = document.querySelector("[data-header]");
const menu = document.querySelector(".menu-toggle");
const mobileNavigation = window.matchMedia("(max-width: 960px)");
const setMenuOpen = (open) => {
  header.classList.toggle("is-open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
};

menu.addEventListener("click", () => {
  setMenuOpen(!header.classList.contains("is-open"));
});
document.querySelectorAll(".site-nav a").forEach((link) =>
  link.addEventListener("click", () => {
    setMenuOpen(false);
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && header.classList.contains("is-open")) {
    setMenuOpen(false);
    menu.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) setMenuOpen(false);
});
header.addEventListener("focusout", (event) => {
  if (!header.contains(event.relatedTarget)) setMenuOpen(false);
});
mobileNavigation.addEventListener("change", () => setMenuOpen(false));

// All enhancements return cleanup functions; BFCache restores keep their listeners.
const cleanupMotion = initMotion();
const cleanupPointer = initPointer();
addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    cleanupPointer();
    cleanupMotion();
  }
});

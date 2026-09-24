export const cases = {
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


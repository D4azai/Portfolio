// Process descriptions are proposed working methods, not measured project claims.
export const pillars = {
  data: {
    number: "01", label: "Data", category: "The foundation",
    title: "Give every decision a reliable foundation.",
    intro: "Before connecting tools or automating decisions, establish what the information means, where it comes from, and who can change it.",
    steps: [
      ["Understand the source", "Map the records across your current tools, spreadsheets, and teams. Identify duplication, missing information, and ownership.", "Source and ownership map"],
      ["Design the shared model", "Define the entities, relationships, validation rules, and access permissions around the actual operation.", "Data model and access rules"],
      ["Validate the foundation", "Plan imports and integrations, reconcile sample records, and test how updates move between systems before relying on the data.", "Validation and migration plan"],
    ],
    outcome: "A shared understanding of the records the operation depends on, with explicit rules for quality, access, and change.",
    connection: "Reliable data gives Flow the context it needs to coordinate work.", next: "flow",
  },
  flow: {
    number: "02", label: "Flow", category: "The coordination layer",
    title: "Turn handoffs into a clear working process.",
    intro: "Connect people, decisions, and tools so each task has a clear owner, a next step, and a way to handle exceptions.",
    steps: [
      ["Map the real workflow", "Follow a task from request to completion. Identify delays, repeated entry, approval points, and the handoffs where context gets lost.", "Workflow and bottleneck map"],
      ["Connect the steps", "Define states, triggers, responsibilities, and integrations. Keep human approval where a decision needs judgment or accountability.", "Workflow and integration design"],
      ["Test the exceptions", "Validate a useful slice with the people doing the work. Check retries, failed integrations, duplicate events, and manual recovery paths.", "Tested workflow and recovery paths"],
    ],
    outcome: "A traceable process that makes the next action clear, including what happens when a step cannot complete as expected.",
    connection: "An explicit workflow shows where AI can assist without obscuring responsibility.", next: "ai",
  },
  ai: {
    number: "03", label: "AI", category: "The assistance layer",
    title: "Make intelligence useful, with clear boundaries.",
    intro: "Start with a specific task where assistance can help: finding information, extracting document details, or preparing a decision for review.",
    steps: [
      ["Choose the useful task", "Define the user need, available information, acceptable errors, and when a conventional rule or search would be more appropriate.", "Use case and acceptance criteria"],
      ["Ground the assistance", "Connect approved sources, scope data access, and design a review step. Make uncertainty and fallback behavior clear to the user.", "Grounded prototype and review flow"],
      ["Evaluate before expanding", "Test representative examples and difficult cases. Review accuracy, response time, and cost, then decide whether the feature is ready for broader use.", "Evaluation set and rollout decision"],
    ],
    outcome: "A bounded assistive feature with a defined purpose, evidence for its behavior, and a human review path where needed.",
    connection: "Edge brings that assistance into the interfaces people use every day.", next: "edge",
  },
  edge: {
    number: "04", label: "Edge", category: "The point of use",
    title: "Bring the system to the people doing the work.",
    intro: "Here, Edge means the interfaces and integration points where people meet the system: a portal, an operational dashboard, or a connected service.",
    steps: [
      ["Understand the context", "Identify users, devices, permissions, and the decisions they need to make. Plan for mobile use and accessibility from the start.", "User journeys and interface priorities"],
      ["Build the useful surface", "Turn core workflows into clear screens and service endpoints. Design loading, empty, error, and success states alongside the happy path.", "Responsive interfaces and integration contracts"],
      ["Deliver and observe", "Validate complete journeys, prepare deployment and recovery, and use operational feedback to guide the next improvement.", "Release checklist and improvement plan"],
    ],
    outcome: "A usable route into the system, with clear feedback, appropriate access, and a practical plan for operating it after release.",
    connection: "Every interaction creates new information, bringing the system back to Data.", next: "data",
  },
};

export function renderPillar(key) {
  const pillar = pillars[key];
  if (!pillar) return "";
  const navigation = Object.entries(pillars).map(([id, item]) => `<button type="button" data-pillar-switch="${id}" aria-pressed="${id === key}"><span>${item.number}</span>${item.label}</button>`).join("");
  const steps = pillar.steps.map(([title, description, deliverable], i) => `<li class="pillar-step"><span class="pillar-step-number">0${i + 1}</span><h3>${title}</h3><p>${description}</p><div class="pillar-deliverable"><small>WORKING OUTPUT</small><p>${deliverable}</p></div></li>`).join("");
  return `<nav class="pillar-nav" aria-label="Explore the four system pillars">${navigation}</nav>
    <div class="pillar-heading"><p class="dialog-kicker">${pillar.number} / ${pillar.label} / ${pillar.category}</p><h2 id="case-title" tabindex="-1">${pillar.title}</h2><p class="dialog-lede">${pillar.intro}</p></div>
    <div class="pillar-process-label"><span>THE PROCESS</span><span>UNDERSTAND → DESIGN → VALIDATE</span></div>
    <ol class="pillar-steps">${steps}</ol>
    <aside class="pillar-outcome"><span>WHAT THIS ENABLES</span><p>${pillar.outcome}</p></aside>
    <div class="pillar-footer"><div><p>${pillar.connection}</p><button type="button" class="text-action" data-pillar-switch="${pillar.next}">Explore ${pillars[pillar.next].label} <span aria-hidden="true">→</span></button></div><a class="button button-primary" href="mailto:aymane.chellak@outlook.fr?subject=${encodeURIComponent(`Project enquiry — ${pillar.label} pillar`)}">Discuss your system <span aria-hidden="true">↗</span></a></div>`;
}

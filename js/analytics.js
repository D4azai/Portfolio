// Consent is off by default. No event contains form text or a full page URL.
const projects = ["affiliate", "erp", "crm", "studioNorth", "northstar"];
document.documentElement.classList.add("analytics-ready");
const storageKey = "aynko:analytics";
let enabled = false, allowed = false, identity, session, observer, queue = Promise.resolve();
const seen = new Set();
const privacySignal = () => navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
function stored(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function setStored(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function ids() {
  const old = stored("aynko:visitor"), valid = old && old.expires > Date.now();
  identity = valid ? { ...old, returning: true } : { id: crypto.randomUUID(), expires: Date.now() + 30 * 86400000, returning: false };
  if (!setStored("aynko:visitor", identity)) return false;
  try {
    const previous = JSON.parse(sessionStorage.getItem("aynko:session") || "null");
    session = previous && Date.now() - previous.last < 1800000 ? previous : { id: crypto.randomUUID() };
    session.last = Date.now(); sessionStorage.setItem("aynko:session", JSON.stringify(session));
  } catch { return false; }
  return true;
}
export function track(name, detail = {}) {
  if (!enabled || !allowed || !identity || privacySignal()) return;
  if (Date.now() >= identity.expires && !ids()) return;
  if (Date.now() - session.last > 1800000) session.id = crypto.randomUUID();
  session.last = Date.now(); try { sessionStorage.setItem("aynko:session", JSON.stringify(session)); } catch { return; }
  let referrer = ""; try { referrer = new URL(document.referrer).origin; } catch { /* No source. */ }
  const params = new URLSearchParams(location.search);
  const payload = { id: crypto.randomUUID(), name, consent: true, visitor: identity.id, session: session.id, returning: identity.returning, referrer,
    source: params.get("utm_source") || "", medium: params.get("utm_medium") || "", campaign: params.get("utm_campaign") || "",
    screen: innerWidth < 681 ? "small" : innerWidth < 1025 ? "medium" : "large",
    ...(projects.includes(detail.project) ? { project: detail.project } : {}), ...(detail.section ? { section: detail.section } : {}) };
  queue = queue.then(async () => {
    if (!enabled) return;
    try { await fetch("/api/control?route=event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true, signal: AbortSignal.timeout(5000) }); } catch { /* Never block navigation. */ }
  });
}
function impressions() {
  observer?.disconnect(); const timers = new Map(), targets = new Map();
  document.querySelectorAll("main > section[id]").forEach(section => targets.set(section.querySelector("h1,h2") || section, { name: "section_view", section: section.id }));
  document.querySelectorAll(".featured-project,.project-card").forEach(card => targets.set(card.querySelector(".project-media") || card, { name: "project_view", project: card.querySelector("[data-case]")?.dataset.case }));
  observer = new IntersectionObserver(entries => entries.forEach(entry => {
    clearTimeout(timers.get(entry.target));
    if (!entry.isIntersecting || entry.intersectionRatio < .3 || document.hidden) return;
    timers.set(entry.target, setTimeout(() => {
      if (document.hidden || !enabled) return;
      const detail = targets.get(entry.target);
      const key = detail.project ? `project:${detail.project}` : `section:${detail.section}`;
      if (seen.has(key)) return; seen.add(key);
      track(detail.name, detail);
      observer.unobserve(entry.target);
    }, 1000));
  }), { threshold: .3 });
  targets.forEach((_, element) => observer.observe(element));
  return () => { observer.disconnect(); timers.forEach(clearTimeout); };
}
let stopImpressions;
async function configure() {
  enabled = allowed && stored(storageKey) === true && !privacySignal();
  stopImpressions?.();
  if (enabled && ids()) {
    if (!seen.has("page")) { seen.add("page"); track("page_view"); }
    stopImpressions = impressions();
  } else enabled = false;
  const button = document.querySelector("[data-analytics-toggle]");
  if (button) { button.textContent = `Anonymous analytics: ${enabled ? "on" : "off"}`; button.setAttribute("aria-pressed", String(enabled)); }
}
document.querySelector("[data-analytics-toggle]")?.addEventListener("click", async () => {
  const note = document.querySelector("#analytics-note");
  if (privacySignal()) { note.textContent = "Your browser privacy preference is respected. Analytics remain off."; return; }
  const next = stored(storageKey) !== true;
  if (!setStored(storageKey, next)) { note.textContent = "Storage is unavailable. Analytics remain off."; return; }
  if (!next) { try { localStorage.removeItem("aynko:visitor"); sessionStorage.removeItem("aynko:session"); } catch {} seen.clear(); }
  await configure();
  note.textContent = next && !allowed ? "Analytics are unavailable in this environment; no events are sent." : next ? "Anonymous measurement enabled. You can turn it off here anytime." : "Analytics disabled. Browser identifiers removed.";
});
document.addEventListener("aynko:event", event => track(event.detail.name, event.detail));
document.addEventListener("click", event => {
  const target = event.target.closest("a,button"); if (!target) return;
  const project = target.dataset.case || target.dataset.exploreCase;
  if (project) track("project_open", { project });
  if (target.matches("[data-contact]")) track("contact_click");
  if (target.closest(".hero-actions")) track("hero_cta_click");
  const href = target.getAttribute("href") || "";
  if (href.startsWith("mailto:")) track("email_click");
  if (/^https:\/\/(www\.)?github\.com\//.test(href)) track("github_click");
  if (/^https:\/\/(www\.)?linkedin\.com\//.test(href)) track("linkedin_click");
  if (target.matches('a[target="_blank"]')) {
    const parent = target.closest(".featured-project,.project-card");
    const key = parent?.querySelector("[data-case]")?.dataset.case || target.closest(".case-dialog")?.dataset.project;
    if (key && !/\.(png|webp)(\?|$)/i.test(href)) track("project_external_click", { project: key });
  }
});
document.addEventListener("pointerover", event => {
  if (!enabled || seen.has("3d") || !event.target.closest(".system-field,.operator-scene")) return;
  seen.add("3d"); track("3d_interaction");
}, { passive: true });
document.addEventListener("focusin", event => {
  if (!enabled || seen.has("3d") || !event.target.closest(".system-field")) return;
  seen.add("3d"); track("3d_interaction");
});
addEventListener("storage", event => { if (event.key === storageKey) configure(); });
addEventListener("pagehide", event => { if (!event.persisted) stopImpressions?.(); });
if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
  fetch("/api/control?route=analytics-config").then(response => response.json()).then(config => { allowed = config.enabled === true; configure(); }).catch(() => {});
} else configure();

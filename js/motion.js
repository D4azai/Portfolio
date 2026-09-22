import { clamp, createScope, finePointer, motionAllowed, reducedMotion, timing } from "./motion-utils.js";

const fadeUp = (distance = 12) => [
  { opacity: 0, translate: `0 ${distance}px` },
  { opacity: 1, translate: "0 0" },
];
const masked = [
  { opacity: 0, translate: "0 22px", clipPath: "inset(0 -0.15em 100% -0.15em)" },
  { opacity: 1, translate: "0 0", clipPath: "inset(-0.15em)" },
];

export function initMotion() {
  const scope = createScope();
  const root = document.documentElement;
  root.classList.add("motion-enhanced");
  scope.cleanup(() => root.classList.remove("motion-enhanced"));
  initHero(scope);
  initReveals(scope);
  initSystems(scope);
  initScrollTracking(scope);
  return () => scope.destroy();
}

function initHero(scope) {
  // Primary actions work throughout the entrance. Finish the last item at 1.2s.
  if (location.hash || scrollY > 40) return;
  scope.animate(document.querySelector(".site-header .brand"), fadeUp(4), { duration: 450 });
  scope.animate(document.querySelector(".hero .eyebrow"), fadeUp(6), { duration: 450, delay: 40 });
  document.querySelectorAll(".hero h1 > span").forEach((line, i) => {
    scope.animate(line, masked, { delay: 100 + i * timing.stagger });
  });
  scope.animate(document.querySelector(".hero-intro"), fadeUp(10), { duration: 550, delay: 330 });
  document.querySelectorAll(".hero-actions .button").forEach((button, i) => {
    scope.animate(button, fadeUp(8), { duration: 500, delay: 430 + i * timing.stagger });
  });
  document.querySelectorAll(".hero-facts > div").forEach((fact, i) => {
    scope.animate(fact, fadeUp(6), { duration: 450, delay: 580 + i * timing.stagger });
  });
}

function initReveals(scope) {
  if (!("IntersectionObserver" in window)) return;
  const elements = [...document.querySelectorAll("[data-reveal]")].filter((element) => !element.closest(".hero"));
  const observer = new IntersectionObserver((entries) => {
    const groups = new Map();
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      const group = target.closest(".project-grid, .capability-grid");
      const index = group ? (groups.get(group) || 0) : 0;
      if (group) groups.set(group, index + 1);
      // Stagger only siblings entering this frame, not cards several screens apart.
      const delay = Math.min(index, 3) * timing.stagger;
      target.style.setProperty("--reveal-delay", `${delay}ms`);
      target.classList.add("is-visible");
      if (target.matches(".section-head")) {
        scope.animate(target.querySelector("h2"), masked, { delay });
        scope.animate(target.querySelector(":scope > p"), fadeUp(8), { delay: delay + 100, duration: 500 });
      }
      target.querySelectorAll(".tags li").forEach((tag, i) => {
        scope.animate(tag, fadeUp(4), { duration: 350, delay: delay + 120 + i * 35 });
      });
    });
  }, { threshold: 0.04 });
  elements.forEach((element) => {
    if (motionAllowed()) element.classList.add("reveal-pending");
    if (element.matches(".project-card, .featured-project")) element.classList.add("motion-divider");
    observer.observe(element);
  });
  // Tabbing to a control must never put focus in a visually hidden card.
  scope.listen(document, "focusin", (event) => {
    const pending = event.target.closest(".reveal-pending:not(.is-visible)");
    if (pending) {
      pending.classList.add("is-visible");
      pending.style.setProperty("--reveal-delay", "0ms");
      observer.unobserve(pending);
    }
  });
  scope.listen(reducedMotion, "change", () => {
    if (!motionAllowed()) {
      elements.forEach((element) => element.classList.add("is-visible"));
      observer.disconnect();
    }
  });
  scope.cleanup(() => {
    observer.disconnect();
    elements.forEach((element) => {
      element.classList.remove("reveal-pending", "is-visible", "motion-divider");
      element.style.removeProperty("--reveal-delay");
    });
  });
}

function initSystems(scope) {
  const visual = document.querySelector(".hero-visual");
  const svg = visual?.querySelector(".system-lines");
  if (!svg) return;
  // The original drawing is unchanged. Separate its four paths for highlighting.
  const connector = svg.querySelector("path:not(.line-pulse)");
  const originalPath = connector.getAttribute("d");
  const lines = [...originalPath.matchAll(/M[^M]+/g)].map(([d], i) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", d);
    line.setAttribute("pathLength", "1");
    line.classList.add("system-connector");
    line.dataset.connection = ["data", "flow", "ai", "edge"][i];
    svg.insertBefore(line, connector);
    return line;
  });
  connector.style.display = "none";
  const nodes = [...visual.querySelectorAll(".system-node:not(.node-core)")];
  const highlight = (node) => {
    nodes.forEach((item, i) => {
      const active = item === node;
      item.classList.toggle("is-connected", active);
      lines[i]?.classList.toggle("is-connected", active);
    });
    visual.querySelector(".node-core").classList.toggle("is-connected", Boolean(node));
  };
  // Nodes remain a labelled illustration, not misleading keyboard controls.
  nodes.forEach((node) => {
    scope.listen(node, "pointerenter", () => {
      if (finePointer.matches) highlight(node);
    });
    scope.listen(node, "pointerleave", () => highlight(null));
  });
  let visible = false;
  let entered = false;
  const update = () => visual.classList.toggle("system-running", visible && !document.hidden && motionAllowed());
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !entered) {
        entered = true;
        scope.animate(visual, fadeUp(10), { duration: 600 });
        [visual.querySelector(".node-core"), ...nodes].forEach((node, i) => {
          scope.animate(node, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 120 + i * 80 });
        });
        lines.forEach((line, i) => {
          scope.animate(line, [{ strokeDasharray: "1", strokeDashoffset: 1 }, { strokeDasharray: "1", strokeDashoffset: 0 }], { delay: 250 + i * 70 });
        });
      }
      update();
    }, { threshold: 0.15 });
    observer.observe(visual);
    scope.cleanup(() => observer.disconnect());
  }
  scope.listen(document, "visibilitychange", update);
  scope.listen(reducedMotion, "change", update);
  scope.cleanup(() => {
    visual.classList.remove("system-running");
    highlight(null);
    lines.forEach((line) => line.remove());
    connector.style.display = "";
  });
}

function initScrollTracking(scope) {
  const sections = [...document.querySelectorAll("main > section[id]")];
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const method = document.querySelector(".method-list");
  const steps = [...method.children];
  let frame = 0;
  let sectionId = "";
  let activeStep = -1;
  let progress = -1;
  const update = () => {
    frame = 0;
    // Batch all geometry reads before any writes. One frame per scroll event batch.
    const sectionRects = sections.map((section) => section.getBoundingClientRect());
    const stepRects = steps.map((step) => step.getBoundingClientRect());
    const rect = method.getBoundingClientRect();
    const nextSection = sectionRects.reduce((active, item, i) => item.top <= innerHeight * 0.35 ? i : active, 0);
    const nextStep = stepRects.reduce((active, item, i) => item.top <= innerHeight * 0.55 ? i : active, 0);
    const nextProgress = clamp((innerHeight * 0.55 - rect.top - 40) / Math.max(1, rect.height - 76), 0, 1);
    if (sectionId !== sections[nextSection].id) {
      sectionId = sections[nextSection].id;
      links.forEach((link) => {
        if (link.hash === `#${sectionId}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    if (Math.abs(progress - nextProgress) > 0.002) {
      progress = nextProgress;
      method.style.setProperty("--method-progress", progress.toFixed(3));
    }
    if (activeStep !== nextStep && rect.bottom > 0 && rect.top < innerHeight) {
      activeStep = nextStep;
      steps.forEach((step, i) => {
        step.classList.toggle("is-active", i === activeStep);
        step.classList.toggle("is-complete", i < activeStep);
        if (i === activeStep) step.setAttribute("aria-current", "step");
        else step.removeAttribute("aria-current");
      });
      scope.animate(steps[activeStep].querySelector("span"), fadeUp(3), { duration: 350 });
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  scope.listen(window, "scroll", schedule, { passive: true });
  scope.listen(window, "resize", schedule, { passive: true });
  scope.listen(window, "pageshow", schedule);
  scope.listen(document, "load", schedule, { capture: true });
  document.fonts?.ready.then(schedule);
  schedule();
  scope.cleanup(() => {
    cancelAnimationFrame(frame);
    links.forEach((link) => link.removeAttribute("aria-current"));
    steps.forEach((step) => {
      step.removeAttribute("aria-current");
      step.classList.remove("is-active", "is-complete");
    });
    method.style.removeProperty("--method-progress");
  });
}

// Retain the original dialog's synchronous open/close and focus behavior.
// This animation is cosmetic, so interrupted/unsupported animation never blocks it.
export function animateDialog(dialog) {
  const scope = createScope();
  scope.animate(dialog, [
    { opacity: 0, transform: "translateY(12px) scale(.992)" },
    { opacity: 1, transform: "none" },
  ], { duration: timing.control });
  scope.listen(dialog, "close", () => scope.destroy(), { once: true });
}

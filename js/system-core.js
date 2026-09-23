import { clamp, createScope, desktopPointer, finePointer, forcedColors, motionAllowed, reducedMotion } from "./motion-utils.js";

// Real DOM depth, with the existing links and SVG on one connected plane.
// No canvas, textures, render loop, or alternate inaccessible controls.
export function initSystemCore(field) {
  const scope = createScope();
  const plane = document.createElement("div");
  plane.className = "system-plane";
  plane.append(...field.childNodes);
  field.append(plane);
  const core = plane.querySelector(".node-core");
  const layers = ["INTERFACE", "ORCHESTRATION", "INFRASTRUCTURE"].map((name, i) => {
    const layer = document.createElement("div");
    layer.className = "core-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--layer", i);
    layer.innerHTML = `<span>${name}</span><i></i><i></i><i></i>`;
    plane.insertBefore(layer, core);
    return layer;
  });
  const caption = document.createElement("p");
  caption.className = "system-caption";
  caption.textContent = "ONE CORE / CONNECTED CAPABILITIES";
  field.append(caption);
  const descriptions = {
    data: "DATA / Shared records & validation",
    flow: "FLOW / States, handoffs & recovery",
    ai: "AI / Assistance with clear boundaries",
    edge: "EDGE / Connected devices & services",
  };
  const nodes = [...plane.querySelectorAll("[data-pillar]")];
  let visible = false, enabled = false, frame = 0, bounds;
  let x = 0, y = 0, currentX = 0, currentY = 0;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const render = () => {
    frame = 0;
    if (!enabled || !visible || document.hidden) return;
    currentX += (x - currentX) * .12;
    currentY += (y - currentY) * .12;
    plane.style.setProperty("--core-x", `${currentX.toFixed(3)}deg`);
    plane.style.setProperty("--core-y", `${currentY.toFixed(3)}deg`);
    if (Math.abs(x - currentX) + Math.abs(y - currentY) > .01) frame = requestAnimationFrame(render);
  };
  const schedule = () => { if (!frame && enabled && visible && !document.hidden) frame = requestAnimationFrame(render); };
  const configure = () => {
    enabled = desktopPointer.matches && finePointer.matches && motionAllowed() && !forcedColors.matches;
    field.classList.toggle("has-depth", enabled);
    stop();
    x = y = currentX = currentY = 0;
    plane.style.removeProperty("--core-x");
    plane.style.removeProperty("--core-y");
    schedule();
  };
  const measure = () => {
    bounds = field.getBoundingClientRect();
    schedule();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) measure(); else stop();
  });
  observer.observe(field);
  scope.listen(field, "pointerenter", measure, { passive: true });
  scope.listen(field, "pointermove", event => {
    if (!enabled || event.pointerType !== "mouse" || !bounds) return;
    // Keep an acquired control still while the visitor aims and clicks.
    if (event.target.closest("[data-pillar]")) { x = currentX; y = currentY; stop(); return; }
    x = clamp((event.clientY - bounds.top) / bounds.height - .5, -.5, .5) * -6;
    y = clamp((event.clientX - bounds.left) / bounds.width - .5, -.5, .5) * 8;
    schedule();
  }, { passive: true });
  scope.listen(field, "pointerleave", () => { x = y = 0; schedule(); });
  scope.listen(window, "scroll", () => { if (visible && enabled) measure(); }, { passive: true });
  scope.listen(window, "resize", measure, { passive: true });
  scope.listen(document, "visibilitychange", () => { if (document.hidden) stop(); else schedule(); });
  scope.listen(document, "aynko:dialog", () => { x = y = 0; schedule(); });
  nodes.forEach(node => {
    const highlight = () => {
      field.dataset.active = node.dataset.pillar;
      caption.textContent = descriptions[node.dataset.pillar];
    };
    const reset = () => {
      delete field.dataset.active;
      caption.textContent = "ONE CORE / CONNECTED CAPABILITIES";
    };
    scope.listen(node, "pointerenter", highlight);
    scope.listen(node, "pointerleave", reset);
    scope.listen(node, "focus", highlight);
    scope.listen(node, "blur", reset);
  });
  [desktopPointer, finePointer, reducedMotion, forcedColors].forEach(query => scope.listen(query, "change", configure));
  configure();
  scope.cleanup(() => {
    stop(); observer.disconnect(); layers.forEach(layer => layer.remove()); caption.remove();
    field.append(...plane.childNodes); plane.remove(); field.classList.remove("has-depth"); delete field.dataset.active;
  });
  return () => scope.destroy();
}

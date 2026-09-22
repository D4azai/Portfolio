import { clamp, createScope, desktopPointer, finePointer, forcedColors, motionAllowed, reducedMotion } from "./motion-utils.js";

export function initPointer() {
  const scope = createScope();
  const root = document.documentElement;
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  const label = document.createElement("span");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  [dot, ring].forEach((element) => element.setAttribute("aria-hidden", "true"));
  ring.append(label);
  document.body.append(dot, ring);
  let enabled = false;
  let visible = false;
  let frame = 0;
  let previousTime = 0;
  let x = 0, y = 0, ringX = 0, ringY = 0;
  let target = null;
  let magnet = null, media = null;
  let magnetRect = null, mediaRect = null;
  let targetsDirty = true;
  let previousState = "";
  const nativeSelector = 'input, textarea, select, option, label, [contenteditable]:not([contenteditable="false"]), [role="textbox"], dialog[open], iframe, video, audio';
  const textSelector = "p, h1, h2, h3, dt, dd, small, .eyebrow, .tags, .project-kicker, .media-label, .system-log, .site-footer";
  const magnetSelector = ".site-nav a, .hero-actions .button, .contact-card .button, .project-actions .text-action, .card-body > .text-action";

  const resetTargets = () => {
    magnet?.style.removeProperty("--magnet-x");
    magnet?.style.removeProperty("--magnet-y");
    media?.style.removeProperty("--image-x");
    media?.style.removeProperty("--image-y");
    magnet = media = magnetRect = mediaRect = null;
    targetsDirty = true;
  };
  const hide = () => {
    visible = false;
    root.classList.remove("cursor-visible");
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    resetTargets();
  };
  const configure = () => {
    enabled = finePointer.matches && desktopPointer.matches && motionAllowed() && !forcedColors.matches;
    root.classList.toggle("cursor-enabled", enabled);
    hide();
  };
  [finePointer, desktopPointer, reducedMotion, forcedColors].forEach((query) => scope.listen(query, "change", configure));

  const tick = (time) => {
    frame = 0;
    if (!enabled || !target?.isConnected) return hide();
    const action = target.closest("a, button, [role=button]");
    if (document.querySelector("dialog[open]") || target.closest(nativeSelector) || (!action && target.closest(textSelector))) return hide();
    // Geometry is cached on target entry and invalidated by scroll/resize.
    const nextMagnet = action?.matches(magnetSelector) ? action : null;
    const nextMedia = target.closest(".project-media");
    if (targetsDirty || nextMagnet !== magnet || nextMedia !== media) {
      const nextMagnetRect = nextMagnet?.getBoundingClientRect();
      const nextMediaRect = nextMedia?.getBoundingClientRect();
      resetTargets();
      magnet = nextMagnet;
      media = nextMedia;
      magnetRect = nextMagnetRect;
      mediaRect = nextMediaRect;
      targetsDirty = false;
    }
    const state = action?.matches('[href^="mailto:"]') ? "mail"
      : action?.matches('[target="_blank"], [href^="https://"], [href^="http://"]') ? "open"
      : action?.hasAttribute("data-case") || nextMedia ? "view"
      : target.closest('[draggable="true"], [data-cursor="drag"]') ? "drag"
      : target.closest(".system-field, [data-cursor=explore]") ? "explore"
      : action ? "action" : "default";
    const delta = Math.min(40, previousTime ? time - previousTime : 16.67);
    previousTime = time;
    const ease = 1 - Math.pow(0.8, delta / 16.67);
    if (!visible) { ringX = x; ringY = y; }
    else { ringX += (x - ringX) * ease; ringY += (y - ringY) * ease; }
    // Only this rAF callback writes pointer coordinates or hover motion.
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    root.classList.toggle("cursor-on-paper", Boolean(target.closest(".expertise")));
    if (previousState !== state) {
      previousState = state;
      ring.dataset.state = state;
      label.textContent = { view: "VIEW", open: "OPEN ↗", mail: "MAIL ↗", explore: "EXPLORE", drag: "DRAG" }[state] || "";
      ring.classList.toggle("has-label", Boolean(label.textContent));
      // Short cross-fade on semantic state changes, not on every mouse event.
      scope.animate(label, [{ opacity: 0, translate: "0 2px" }, { opacity: 1, translate: "0 0" }], { duration: 180 });
    }
    if (magnetRect) {
      magnet.style.setProperty("--magnet-x", `${clamp((x - magnetRect.left - magnetRect.width / 2) * .065, -4, 4).toFixed(2)}px`);
      magnet.style.setProperty("--magnet-y", `${clamp((y - magnetRect.top - magnetRect.height / 2) * .1, -3, 3).toFixed(2)}px`);
    }
    if (mediaRect) {
      media.style.setProperty("--image-x", `${clamp((x - mediaRect.left) / mediaRect.width - .5, -.5, .5) * 7}px`);
      media.style.setProperty("--image-y", `${clamp((y - mediaRect.top) / mediaRect.height - .5, -.5, .5) * 5}px`);
    }
    if (!visible) { visible = true; root.classList.add("cursor-visible"); }
    if (Math.abs(x - ringX) + Math.abs(y - ringY) > .1) frame = requestAnimationFrame(tick);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(tick); };
  scope.listen(document, "pointermove", (event) => {
    if (!enabled || event.pointerType !== "mouse" || event.buttons || !getSelection()?.isCollapsed) return hide();
    if (target !== event.target) targetsDirty = true;
    target = event.target;
    x = event.clientX;
    y = event.clientY;
    schedule();
  }, { passive: true });
  scope.listen(document, "pointerover", (event) => {
    if (event.target.closest(nativeSelector)) hide();
  }, { passive: true });
  scope.listen(root, "pointerleave", hide);
  scope.listen(document, "pointerdown", hide, { passive: true });
  scope.listen(document, "keydown", hide);
  scope.listen(document, "selectionchange", () => { if (!getSelection()?.isCollapsed) hide(); });
  scope.listen(document, "visibilitychange", hide);
  scope.listen(document, "aynko:dialog", hide);
  scope.listen(window, "blur", hide);
  scope.listen(window, "pagehide", hide);
  scope.listen(window, "scroll", hide, { passive: true });
  scope.listen(window, "resize", hide, { passive: true });
  configure();
  scope.cleanup(() => {
    hide();
    root.classList.remove("cursor-enabled", "cursor-on-paper");
    dot.remove();
    ring.remove();
  });
  return () => scope.destroy();
}

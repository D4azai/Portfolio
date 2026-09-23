import { createScope, reducedMotion, finePointer, motionAllowed, clamp } from "./motion-utils.js";
const scope = createScope(), dialog = document.querySelector("#entry-dialog");
const scene = dialog.querySelector(".operator-scene"), model = scene.querySelector(".operator-model");
document.documentElement.classList.add("operator-ready");
let timer, frame = 0, x = 0, y = 0, currentX = 0, currentY = 0, startedAt = 0, bounds;
// Seven low-poly mechanical volumes; side faces make actual CSS perspective depth.
for (const part of model.querySelectorAll(".operator-volume")) {
  for (const face of ["front", "back", "left", "right", "top", "bottom"]) {
    const side = document.createElement("i"); side.className = `operator-face face-${face}`;
    if (part.classList.contains("operator-head") && face === "front") side.innerHTML = '<span class="operator-visor"><b></b><b></b></span>';
    if (part.classList.contains("operator-torso") && face === "front") side.innerHTML = '<span class="operator-mark">A</span><span class="operator-port"></span>';
    part.append(side);
  }
}
function tick() {
  frame = 0;
  if (!dialog.open || document.hidden || !motionAllowed() || !finePointer.matches) return;
  currentX += (x - currentX) * .15; currentY += (y - currentY) * .15;
  model.style.setProperty("--look-x", `${currentX.toFixed(2)}deg`); model.style.setProperty("--look-y", `${currentY.toFixed(2)}deg`);
  if (Math.abs(x - currentX) + Math.abs(y - currentY) > .02) frame = requestAnimationFrame(tick);
}
function close(skipped = false) {
  clearTimeout(timer); cancelAnimationFrame(frame); frame = 0;
  if (!dialog.open) return;
  dialog.close(); dialog.classList.remove("entry-running");
  try { sessionStorage.setItem("aynko:entry-seen", "1"); } catch { /* Never block access. */ }
  if (skipped) document.dispatchEvent(new CustomEvent("aynko:event", { detail: { name: "intro_skipped" } }));
}
function open(automatic = false) {
  if (document.querySelector("dialog[open]")) return;
  startedAt = performance.now(); dialog.showModal(); dialog.classList.add("entry-running");
  dialog.querySelector("[data-enter]").focus(); document.dispatchEvent(new Event("aynko:dialog"));
  bounds = scene.getBoundingClientRect();
  // First visit is deliberately brief. Replay can be explored until dismissed.
  if (automatic) timer = setTimeout(() => close(), 1900);
}
scope.listen(dialog.querySelector("[data-enter]"), "click", () => close(performance.now() - startedAt < 1900));
scope.listen(dialog.querySelector("[data-skip-entry]"), "click", () => close(true));
scope.listen(dialog, "cancel", event => { event.preventDefault(); close(true); });
scope.listen(dialog, "close", () => { clearTimeout(timer); cancelAnimationFrame(frame); frame = 0; dialog.classList.remove("entry-running"); });
document.querySelectorAll("[data-replay-entry]").forEach(button => scope.listen(button, "click", () => open()));
scope.listen(scene, "pointermove", event => {
  if (!dialog.open || !finePointer.matches || !motionAllowed() || innerWidth < 681) return;
  bounds ||= scene.getBoundingClientRect();
  x = clamp((event.clientY - bounds.top) / bounds.height - .5, -.5, .5) * -10;
  y = clamp((event.clientX - bounds.left) / bounds.width - .5, -.5, .5) * 20;
  if (!frame) frame = requestAnimationFrame(tick);
}, { passive: true });
scope.listen(scene, "pointerleave", () => { x = y = 0; if (!frame) frame = requestAnimationFrame(tick); });
scope.listen(window, "resize", () => { bounds = scene.getBoundingClientRect(); });
scope.listen(document, "visibilitychange", () => {
  dialog.classList.toggle("entry-paused", document.hidden);
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
});
scope.listen(reducedMotion, "change", () => {
  cancelAnimationFrame(frame); frame = 0; x = y = currentX = currentY = 0;
  model.style.removeProperty("--look-x"); model.style.removeProperty("--look-y");
  if (reducedMotion.matches) close();
});
let seen = false; try { seen = sessionStorage.getItem("aynko:entry-seen") === "1"; } catch { seen = true; }
if (!seen && !location.hash && motionAllowed() && !document.hidden) open(true);
addEventListener("pagehide", event => { if (!event.persisted) { close(); scope.destroy(); } });

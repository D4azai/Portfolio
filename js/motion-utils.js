// Shared timing, preferences and lifecycle for this static site's enhancements.
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
export const desktopPointer = matchMedia("(min-width: 961px)");
export const forcedColors = matchMedia("(forced-colors: active)");
export const motionAllowed = () => !reducedMotion.matches;
export const easing = "cubic-bezier(.22, 1, .36, 1)";
export const timing = { feedback: 180, control: 350, reveal: 650, stagger: 80 };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createScope() {
  const controller = new AbortController();
  const cleanups = [];
  const animations = new Set();
  const listen = (target, name, callback, options = {}) => {
    target.addEventListener(name, callback, { ...options, signal: controller.signal });
  };
  const cancelAnimations = () => {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  };
  listen(reducedMotion, "change", () => {
    if (!motionAllowed()) cancelAnimations();
  });
  return {
    listen,
    cleanup: (callback) => cleanups.push(callback),
    animate(element, frames, options = {}) {
      if (!element?.animate || !motionAllowed() || document.hidden) return;
      const animation = element.animate(frames, {
        duration: timing.reveal,
        easing,
        fill: "both",
        ...options,
      });
      animations.add(animation);
      // Remove finished effects: the underlying CSS is always the visible state.
      animation.finished.then(() => animation.cancel(), () => {}).finally(() => animations.delete(animation));
      return animation;
    },
    destroy() {
      controller.abort();
      cancelAnimations();
      cleanups.reverse().forEach((cleanup) => cleanup());
    },
  };
}

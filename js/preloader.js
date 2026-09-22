// Cosmetic first-visit introduction. Content never depends on this script.
(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const key = "aynko:last-intro";
  let returning = false;
  try {
    returning = Date.now() - Number(localStorage.getItem(key)) < 86400000;
  } catch { /* Storage is optional, including in private browsing. */ }
  if (returning || preference.matches || location.hash) return;
  root.classList.add("intro-active");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(deadline);
    root.classList.remove("intro-active");
    root.classList.add("intro-complete");
    try { localStorage.setItem(key, String(Date.now())); } catch { /* Optional. */ }
    document.removeEventListener("keydown", finish);
    document.removeEventListener("pointerdown", finish);
    preference.removeEventListener("change", finish);
    window.removeEventListener("pagehide", finish);
  };
  // A 2.72s brand introduction plus the 280ms CSS fade totals about 3s.
  // This is an intentional presentation duration, not a download percentage.
  const deadline = setTimeout(finish, 2720);
  document.addEventListener("keydown", finish);
  document.addEventListener("pointerdown", finish, { passive: true });
  preference.addEventListener("change", finish);
  window.addEventListener("pagehide", finish, { once: true });
})();

// Set the compact navigation layout before first paint. This controller has no
// module dependencies, so gallery/motion downloads cannot move the mobile hero.
(() => {
  const root = document.documentElement;
  root.classList.add("js-ready");
  const initialize = () => {
    if (document.readyState === "loading") return;
    document.removeEventListener("readystatechange", initialize);
    const header = document.querySelector("[data-header]");
    const menu = document.querySelector(".menu-toggle");
    if (!header || !menu) {
      root.classList.remove("js-ready");
      return;
    }
    const setOpen = open => {
      header.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    };
    menu.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
    header.querySelectorAll(".site-nav a").forEach(link => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        menu.focus();
      }
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) setOpen(false);
    });
    header.addEventListener("focusout", event => {
      if (!header.contains(event.relatedTarget)) setOpen(false);
    });
    matchMedia("(max-width: 960px)").addEventListener("change", () => setOpen(false));
  };
  if (document.readyState === "loading") document.addEventListener("readystatechange", initialize);
  else initialize();
})();

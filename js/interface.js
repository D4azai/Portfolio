import { finePointer, motionAllowed } from "./motion.js";
import { trapDialogFocus } from "./dialog.js";

export function initNavigation() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const mobile = matchMedia("(max-width: 960px)");
  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  };
  toggle.addEventListener("click", () =>
    setOpen(toggle.getAttribute("aria-expanded") !== "true"),
  );
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener("focusout", (event) => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  mobile.addEventListener("change", () => setOpen(false));
}

export function initArchitecture() {
  const stage = document.querySelector(".architecture-stage");
  const buttons = [...stage.querySelectorAll("[data-node]")];
  const planes = [...stage.querySelectorAll("[data-plane]")];
  const descriptions = {
    data: [
      "01 / DATA",
      "Reliable records. Clear ownership.",
      "A foundation the whole operation can trust.",
    ],
    flow: [
      "02 / FLOW",
      "Connected roles, services and decisions.",
      "Make the handoffs work as one system.",
    ],
    ai: [
      "03 / AI",
      "Intelligence where it earns its place.",
      "Turn repetitive effort into useful automation.",
    ],
    edge: [
      "04 / EDGE",
      "Complex systems. Clear interfaces.",
      "Put the right action in the right hands.",
    ],
  };
  const readout = document.querySelector(".architecture-readout");
  const activate = (key) => {
    if (stage.dataset.active === key) return;
    stage.dataset.active = key;
    buttons.forEach((button) => {
      const active = button.dataset.node === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    planes.forEach((plane) =>
      plane.classList.toggle("is-active", plane.dataset.plane === key),
    );
    const [title, line1, line2] = descriptions[key];
    readout.querySelector("span").textContent = title;
    readout
      .querySelector("p")
      .replaceChildren(
        document.createTextNode(line1),
        document.createElement("br"),
        document.createTextNode(line2),
      );
  };
  buttons.forEach((button) => {
    button.addEventListener("pointerenter", () => {
      if (finePointer.matches) activate(button.dataset.node);
    });
    button.addEventListener("focus", () => activate(button.dataset.node));
    button.addEventListener("click", () => activate(button.dataset.node));
    button.addEventListener("keydown", (event) => {
      if (
        !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      event.preventDefault();
      const step = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
      buttons[
        (buttons.indexOf(button) + step + buttons.length) % buttons.length
      ].focus();
    });
  });
  let bounds;
  stage.addEventListener("pointerenter", () => {
    bounds = stage.getBoundingClientRect();
  });
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || !motionAllowed() || !bounds) return;
      stage.style.setProperty(
        "--diagram-x",
        `${((event.clientX - bounds.left) / bounds.width - 0.5) * 5}px`,
      );
      stage.style.setProperty(
        "--diagram-y",
        `${((event.clientY - bounds.top) / bounds.height - 0.5) * 4}px`,
      );
    },
    { passive: true },
  );
  stage.addEventListener("pointerleave", () => {
    stage.style.removeProperty("--diagram-x");
    stage.style.removeProperty("--diagram-y");
  });
}

export function initCapabilities() {
  const modules = [...document.querySelectorAll("[data-capability]")];
  const paths = [...document.querySelectorAll("[data-capability-path]")];
  const output = document.querySelector(".capability-output");
  if (!output) return;
  const activate = (module) => {
    modules.forEach((item) => {
      const active = item === module;
      item.classList.toggle("is-active", active);
      item.querySelector("button").setAttribute("aria-pressed", String(active));
    });
    paths.forEach((path) =>
      path.classList.toggle(
        "is-active",
        path.dataset.capabilityPath === module.dataset.capability,
      ),
    );
    output.textContent = module.dataset.output;
  };
  modules.forEach((module) => {
    module.addEventListener("pointerenter", () => {
      if (finePointer.matches) activate(module);
    });
    module
      .querySelector("button")
      .addEventListener("focus", () => activate(module));
    module
      .querySelector("button")
      .addEventListener("click", () => activate(module));
  });
}

export function initCommands() {
  const dialog = document.querySelector(".command-dialog");
  if (!dialog) return;
  trapDialogFocus(dialog);
  const input = dialog.querySelector("input");
  const links = [...dialog.querySelectorAll(".command-results a")];
  const empty = dialog.querySelector(".command-empty");
  let trigger;
  let navigationTarget;
  let oldOverflow = "";
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    links.forEach((link) => {
      link.hidden = !link.textContent.toLowerCase().includes(query);
    });
    empty.hidden = links.some((link) => !link.hidden);
  };
  const close = () => dialog.close();
  const open = () => {
    if (document.querySelector("dialog[open]")) return;
    trigger = document.activeElement;
    navigationTarget = null;
    input.value = "";
    filter();
    oldOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    document.dispatchEvent(new Event("aynko:dialog"));
    input.focus();
  };
  document
    .querySelectorAll("[data-command-open]")
    .forEach((button) => button.addEventListener("click", open));
  document.addEventListener("keydown", (event) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "k" &&
      !event.altKey
    ) {
      if (
        event.target.closest("input,textarea,[contenteditable]") &&
        !dialog.open
      )
        return;
      event.preventDefault();
      if (dialog.open) close();
      else open();
    }
  });
  input.addEventListener("input", filter);
  dialog.addEventListener("keydown", (event) => {
    const visible = links.filter((link) => !link.hidden);
    if (
      event.key === "Enter" &&
      document.activeElement === input &&
      visible[0]
    ) {
      event.preventDefault();
      visible[0].click();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!visible.length) return;
      event.preventDefault();
      const index = visible.indexOf(document.activeElement);
      const next =
        event.key === "ArrowDown"
          ? (index + 1) % visible.length
          : index < 0
            ? visible.length - 1
            : (index - 1 + visible.length) % visible.length;
      visible[next].focus();
    }
  });
  links.forEach((link) =>
    link.addEventListener("click", () => {
      // Close synchronously before the anchor's native default action.
      navigationTarget = link.hash ? document.querySelector(link.hash) : null;
      navigationTarget?.setAttribute("tabindex", "-1");
      close();
    }),
  );
  dialog.querySelector("[data-command-close]").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = oldOverflow;
    (navigationTarget || trigger)?.focus({ preventScroll: true });
  });
}

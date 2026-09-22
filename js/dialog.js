// Native dialogs make the page inert; keep Tab cycling within visible controls
// rather than allowing the browser chrome to receive the next Tab stop.
export function trapDialogFocus(dialog) {
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      ),
    ].filter(
      (element) => element.getClientRects().length > 0 && !element.hidden,
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

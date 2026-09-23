import { createScope, timing } from "./motion-utils.js";
const scope = createScope();
document.documentElement.classList.add("contact-ready");
const dialog = document.querySelector("#contact-dialog"), form = dialog.querySelector("form"), status = dialog.querySelector("[data-form-status]");
let trigger, previousOverflow, step = 0, token = "", requestId = "", started = false, sending = false;
const emit = name => document.dispatchEvent(new CustomEvent("aynko:event", { detail: { name } }));
const panels = [...form.querySelectorAll("fieldset")];
function showStep(index) {
  step = index; panels.forEach((panel, i) => { panel.hidden = i !== index; panel.disabled = i !== index; });
  dialog.querySelectorAll("[data-step]").forEach((item, i) => { if (i === index) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current"); });
  dialog.querySelector("[data-back]").hidden = index === 0;
  dialog.querySelector("[data-next]").hidden = index === 2;
  dialog.querySelector("[data-send]").hidden = index !== 2;
  scope.animate(panels[index], [{ opacity: 0, translate: "0 8px" }, { opacity: 1, translate: "0 0" }], { duration: timing.control });
}
async function prepare() {
  token = "";
  const response = await fetch("/api/control?route=form-token", { signal: AbortSignal.timeout(12000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The form is unavailable. Please use the email link.");
  token = data.token;
}
document.querySelectorAll("[data-contact]").forEach(button => scope.listen(button, "click", async () => {
  trigger = button; previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
  status.textContent = ""; form.hidden = false; dialog.querySelector(".signal-success").hidden = true;
  requestId ||= crypto.randomUUID(); showStep(step); dialog.showModal(); dialog.querySelector("[data-close-contact]").focus();
  document.dispatchEvent(new Event("aynko:dialog")); emit("contact_form_open");
  try { await prepare(); } catch (error) { status.textContent = error.message; }
}));
scope.listen(dialog.querySelector("[data-close-contact]"), "click", () => dialog.close());
scope.listen(dialog, "close", () => { document.body.style.overflow = previousOverflow || ""; trigger?.focus({ preventScroll: true }); });
scope.listen(dialog, "keydown", event => {
  if (event.key !== "Tab") return;
  const controls = [...dialog.querySelectorAll("a,button,input,select,textarea")].filter(element => !element.disabled && element.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
scope.listen(form, "input", () => { if (!started) { started = true; emit("contact_form_started"); } });
function validStep() { return [...panels[step].querySelectorAll("input,select,textarea")].every(input => input.reportValidity()); }
scope.listen(dialog.querySelector("[data-next]"), "click", () => { if (validStep()) { showStep(step + 1); panels[step].querySelector("input,select,textarea")?.focus(); } });
scope.listen(dialog.querySelector("[data-back]"), "click", () => { showStep(step - 1); panels[step].querySelector("input,select,textarea")?.focus(); });
scope.listen(form, "submit", async event => {
  event.preventDefault();
  if (sending || !validStep()) return;
  if (step < 2) { showStep(step + 1); panels[step].querySelector("input,select,textarea")?.focus(); return; }
  status.textContent = "Sending your message…"; sending = true;
  const send = dialog.querySelector("[data-send]"); send.disabled = true;
  try {
    if (!token) { await prepare(); await new Promise(resolve => setTimeout(resolve, 1100)); }
    // Read fields explicitly: hidden steps stay disabled for correct keyboard/validation behavior.
    const body = Object.fromEntries(["name", "email", "company", "contact_type", "message", "budget", "timeline", "website"].map(key => [key, form.elements[key].value]));
    Object.assign(body, { token, request_id: requestId, privacy: form.elements.privacy.checked });
    const response = await fetch("/api/control?route=contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok) { if (response.status === 422) token = ""; throw new Error(result.error || "Unable to submit. Please try again."); }
    form.hidden = true; dialog.querySelector(".signal-success").hidden = false;
    dialog.querySelector(".signal-success h3").focus(); status.textContent = "Message received. Thank you.";
    emit("contact_form_submitted"); form.reset(); step = 0; requestId = ""; started = false;
    scope.animate(dialog.querySelector(".signal-success"), [{ opacity: 0, translate: "0 8px" }, { opacity: 1, translate: "0 0" }]);
  } catch (error) { status.textContent = error.name === "TimeoutError" ? "The connection timed out. You can retry safely without duplicating your message." : error.message; }
  finally { sending = false; send.disabled = false; }
});
addEventListener("pagehide", event => { if (!event.persisted) scope.destroy(); });

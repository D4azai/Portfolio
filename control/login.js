const form = document.querySelector("#login-form");
form.addEventListener("submit", async event => {
  event.preventDefault();
  const status = document.querySelector("#login-status"), button = form.querySelector("button");
  button.disabled = true; status.textContent = "Verifying owner access…";
  try {
    const response = await fetch("/api/control?route=login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    form.elements.password.value = "";
    if (!response.ok) throw new Error(data.error || "Unable to sign in");
    location.replace("/admin");
  } catch (error) { status.textContent = error.name === "TimeoutError" ? "Connection timed out. Please try again." : error.message; button.disabled = false; }
});

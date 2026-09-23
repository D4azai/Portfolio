const $ = selector => document.querySelector(selector);
const names = { affiliate: "Maroc Affiliate", erp: "Construction ERP", crm: "CRM", studioNorth: "Studio North", northstar: "Northstar" };
let hours = 168, page = 0, currentSignal = null, loading = false;
const date = value => new Date(value).toLocaleString(undefined, { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC";
const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
async function api(route, params = {}, method = "GET", body) {
  const response = await fetch(`/api/control?${new URLSearchParams({ route, ...params })}`, { method, ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}), signal: AbortSignal.timeout(15000) });
  if ([401, 403].includes(response.status)) { location.replace("/owner/login"); throw new Error("Session ended"); }
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load data"); return data;
}
function list(target, rows, percentages = false) {
  target.replaceChildren();
  if (!rows.length) { target.append(el("p", "No observations in this period.", "footnote")); return; }
  const total = Number(rows[0]?.total) || rows.reduce((sum, row) => sum + Number(row.count), 0);
  rows.slice(0, 15).forEach(row => {
    const line = el("div", null, "dimension-row");
    line.append(el("span", row.label || "Unavailable"), el("span", `${row.count}${percentages && total ? ` / ${Math.round(row.count / total * 100)}%` : ""}`)); target.append(line);
  });
}
function metricCard(row) {
  const card = el("article", null, "metric");
  card.append(el("h3", row.label.toUpperCase()), el("strong", Number(row.views).toLocaleString()), el("p", `page views · ${row.visitors} browsers`), el("p", `${row.sessions} observed sessions`));
  const previous = Number(row.previous_views);
  card.append(el("small", row.previous_views == null ? "Within retained history" : previous > 0 ? `${Math.round((row.views - previous) / previous * 100)}% views vs previous period` : "No previous baseline"));
  return card;
}
function chart(series) {
  const svg = $("#traffic-chart"); svg.replaceChildren();
  const ns = "http://www.w3.org/2000/svg";
  const item = (tag, attributes = {}, text) => { const node = document.createElementNS(ns, tag); Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value))); if (text) node.textContent = text; svg.append(node); return node; };
  const total = series.reduce((sum, row) => sum + Number(row.views), 0);
  item("title", { id: "chart-title" }, `${total} page views over ${hours / 24} days. Full values are available in the table below.`);
  const max = Math.max(1, ...series.map(row => Number(row.views)), ...series.map(row => Number(row.visitors)));
  for (let i = 0; i <= 4; i++) { const y = 220 - i * 50; item("line", { x1: 42, x2: 886, y1: y, y2: y, class: "chart-grid" }); item("text", { x: 0, y: y + 4, class: "chart-axis" }, String(Math.ceil(max * i / 4))); }
  for (const [key, style] of [["views", "chart-views"], ["visitors", "chart-visitors"]]) {
    const points = series.map((row, i) => `${42 + i / Math.max(1, series.length - 1) * 844},${220 - Number(row[key]) / max * 200}`).join(" ");
    item("polyline", { points, class: style });
  }
  $("#chart-start").textContent = series.length ? date(series[0].at) : "";
  $("#chart-end").textContent = series.length ? date(series.at(-1).at) : "";
  $("#traffic-table").replaceChildren(...series.map(row => { const tr = el("tr"); [date(row.at), row.views, row.visitors].forEach(value => tr.append(el("td", value))); return tr; }));
}
function renderOverview(data) {
  $("#metrics").replaceChildren(...data.metrics.map(metricCard)); $("#recent").textContent = data.recent; $("#new-signals").textContent = data.new_signals;
  chart(data.series || []);
  const dimensions = kind => (data.dimensions || []).filter(row => row.kind === kind);
  list($("#referrers"), dimensions("referrers"), true); list($("#sections"), dimensions("sections"));
  $("#visitor-dimensions").replaceChildren(...[["devices", "Devices"], ["browsers", "Browsers"], ["os", "Operating systems"], ["screens", "Screen categories"], ["countries", "Approximate countries"], ["visits", "Visit context"], ["campaigns", "Campaign / source / medium"], ["events", "Meaningful actions"]].map(([key, title]) => {
    const panel = el("article", null, "data-panel"), rows = el("div"); panel.append(el("h3", title), rows); list(rows, dimensions(key)); return panel;
  }));
  $("#project-rows").replaceChildren(...Object.entries(names).map(([key, name]) => {
    const row = data.projects.find(project => project.project === key) || { views: 0, opens: 0, external_clicks: 0, viewed_sessions: 0, opened_sessions: 0 };
    const tr = el("tr"); [name, row.views, row.opens, row.external_clicks, `${row.viewed_sessions} / ${row.opened_sessions}`].forEach(value => tr.append(el("td", value))); return tr;
  }));
  $("#sync-state").textContent = `Updated ${date(data.generated_at)}`;
}
async function loadSignals() {
  const data = await api("signals", { page, status: $("#signal-filter").value });
  $("#signal-rows").replaceChildren(...data.rows.map(row => {
    const tr = el("tr"), who = el("td", row.name), action = el("td"), button = el("button", "Open ↗"), status = el("td"), tag = el("span", row.status, "status-tag");
    who.append(el("small", row.company || "Independent")); tag.dataset.status = row.status; status.append(tag);
    button.setAttribute("aria-label", `Open signal from ${row.name}`); button.addEventListener("click", () => openSignal(row.id).catch(showError)); action.append(button);
    tr.append(who, el("td", row.contact_type), el("td", date(row.created_at)), status, action); return tr;
  }));
  if (!data.rows.length) { const tr = el("tr"), cell = el("td", "No signals in this view.", "empty"); cell.colSpan = 5; tr.append(cell); $("#signal-rows").append(tr); }
  $("#signal-page").textContent = `Page ${page + 1}`; $("#previous").disabled = page === 0; $("#next").disabled = !data.more;
}
async function openSignal(id) {
  const data = await api("signal", { id }); currentSignal = id;
  $("#signal-title").textContent = data.name;
  $("#signal-detail").replaceChildren(...[["Email", data.email], ["Organization", data.company], ["Request", data.contact_type], ["Message", data.message], ["Budget", data.budget], ["Timeline", data.timeline], ["Source", data.source_page], ["Received", date(data.created_at)]].flatMap(([label, value]) => [el("dt", label), el("dd", value || "Not provided")]));
  $("#signal-status").value = data.status; $("#signal-notice").textContent = ""; $("#signal-dialog").showModal(); $("#close-signal").focus();
}
const showError = error => { $("#dashboard-status").textContent = error.message; $("#sync-state").textContent = "Update unavailable"; };
async function refresh() {
  if (loading) return; loading = true; $("#refresh").disabled = true; $("#dashboard-status").textContent = "";
  document.querySelectorAll("[data-hours]").forEach(button => { button.disabled = true; });
  try {
    const [data, session, system] = await Promise.all([api("overview", { hours }), api("session"), api("system")]);
    renderOverview(data); $("#owner-email").textContent = session.email;
    $("#system-details").replaceChildren(...Object.entries({ Database: system.database, Analytics: system.analytics ? "Enabled / opt-in" : "Disabled in this environment", Environment: system.environment, Retention: `${system.retention_days} days (scheduled cleanup)`, Notifications: system.notifications ? "Configured / best effort" : "Not configured", "Session expires": date(session.expires_at) }).flatMap(([key, value]) => [el("dt", key), el("dd", value)]));
    await loadSignals();
  } catch (error) { showError(error); }
  finally { loading = false; $("#refresh").disabled = false; document.querySelectorAll("[data-hours]").forEach(button => { button.disabled = false; }); }
}
$("#refresh").addEventListener("click", refresh);
document.querySelectorAll("[data-hours]").forEach(button => button.addEventListener("click", () => {
  hours = Number(button.dataset.hours); document.querySelectorAll("[data-hours]").forEach(item => item.setAttribute("aria-pressed", String(item === button))); refresh();
}));
$("#signal-filter").addEventListener("change", () => { page = 0; loadSignals().catch(showError); });
$("#previous").addEventListener("click", () => { page = Math.max(0, page - 1); loadSignals().catch(showError); });
$("#next").addEventListener("click", () => { page++; loadSignals().catch(showError); });
$("#close-signal").addEventListener("click", () => $("#signal-dialog").close());
$("#save-status").addEventListener("click", async () => {
  const button = $("#save-status"); button.disabled = true;
  try { await api("signal", { id: currentSignal }, "PATCH", { status: $("#signal-status").value }); $("#signal-notice").textContent = "Status saved."; await loadSignals(); }
  catch (error) { $("#signal-notice").textContent = error.message; } finally { button.disabled = false; }
});
$("#delete-signal").addEventListener("click", async () => {
  if (!confirm("Permanently delete this submission? This cannot be undone.")) return;
  try { await api("signal", { id: currentSignal }, "DELETE"); $("#signal-dialog").close(); await loadSignals(); } catch (error) { $("#signal-notice").textContent = error.message; }
});
$("#export").addEventListener("click", () => {
  const value = Number($("#export-page").value); if (!Number.isInteger(value) || value < 1 || value > 10001) return $("#export-page").reportValidity();
  location.assign(`/api/control?${new URLSearchParams({ route: "export", page: value - 1, status: $("#signal-filter").value })}`);
});
$("#logout").addEventListener("click", async () => { try { await api("logout", {}, "POST", {}); location.replace("/owner/login"); } catch (error) { showError(error); } });
refresh();

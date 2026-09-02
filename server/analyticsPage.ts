/**
 * `GET /analytics` — the log, read back as a page.
 *
 * Server-rendered HTML with no build step and no bundle of its own. The wizard is a Vite
 * SPA whose catch-all answers every unmatched path with its own index.html, so a route
 * added here has to be matched BEFORE that catch-all or it silently serves the wizard —
 * the same trap that made a missing asset look like a 200 in every deploy check.
 *
 * The page holds no data. It fetches the guarded `/api/analytics` from the browser and
 * draws the reply, which means the summary is never baked into a document that could be
 * cached or shared: the numbers name customers and what each of them cost.
 *
 * The passcode is asked for here rather than inherited. `sessionStorage` is per TAB, so
 * opening this in a new one finds nothing even when the wizard is authorised next door.
 * It is stored under the wizard's own key, so the two share once they are in the same tab.
 */

import type { ServerResponse } from "node:http";

const STYLE = `
  :root{--bg:#0b0b12;--panel:#14141d;--panel2:#1c1c28;--line:#2a2a38;--txt:#e9e9f2;
        --mute:#8b8ba3;--accent:#f0338d;--good:#3ddc97;--warn:#ffb454}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);
       font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  main{max-width:1080px;margin:0 auto;padding:40px 24px 80px}
  h1{font-size:1.5rem;margin:0 0 4px;letter-spacing:-.01em}
  .sub{color:var(--mute);margin:0 0 28px;font-size:.85rem}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:28px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
  .card .k{color:var(--mute);font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}
  .card .v{font-size:1.7rem;font-weight:600;margin-top:6px;letter-spacing:-.02em}
  .card .n{color:var(--mute);font-size:.75rem;margin-top:2px}
  h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);
     margin:32px 0 12px;font-weight:600}
  .panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
  th{color:var(--mute);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
  tbody tr:last-child td{border-bottom:0}
  td.num,th.num{text-align:right}
  .empty{color:var(--mute);padding:28px;text-align:center}
  .bar{fill:var(--accent)}
  .bar.r{fill:var(--good)}
  .axis{fill:var(--mute);font-size:10px}
  .gate{max-width:340px;margin:14vh auto;text-align:center}
  .gate input{width:100%;padding:10px 12px;border-radius:9px;background:var(--panel2);
    color:var(--txt);border:1px solid var(--line);font:inherit;margin:14px 0 10px}
  .gate button{width:100%;padding:10px;border-radius:9px;border:0;background:var(--accent);
    color:#fff;font:inherit;font-weight:600;cursor:pointer}
  .err{color:var(--accent);font-size:.8rem;min-height:1.2em}
  .warn{color:var(--warn)}
`;

/**
 * The client half.
 *
 * Plain DOM, no framework: this is one page that draws three tables and a bar chart, and
 * a build pipeline for it would be more moving parts than the thing it builds.
 */
const SCRIPT = `
const KEY = "vc-passcode";
const $ = (s) => document.querySelector(s);
const fmt = new Intl.NumberFormat("en-US");
const money = (n) => n === null || n === undefined ? "—" : "$" + n.toFixed(n < 1 ? 4 : 2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const get = async (pass) => {
  const res = await fetch("/api/analytics", {
    headers: pass ? { "x-api-key": pass } : {},
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Server said " + res.status + ".");
  return res.json();
};

/** Renders over time. Inline SVG — a chart library for one bar chart is not a trade. */
const chart = (days) => {
  if (!days.length) return '<p class="empty">Nothing recorded yet.</p>';
  const W = 1000, H = 190, pad = 28, bw = Math.max(4, Math.min(38, (W - pad * 2) / days.length - 6));
  const max = Math.max(1, ...days.map((d) => Math.max(d.runs, d.renders)));
  const x = (i) => pad + i * ((W - pad * 2) / days.length) + 3;
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const bars = days.map((d, i) => {
    const half = bw / 2 - 1;
    return (
      '<rect class="bar" x="' + x(i) + '" y="' + y(d.runs) + '" width="' + half +
      '" height="' + (H - pad - y(d.runs)) + '" rx="2"><title>' + d.day + ": " + d.runs + ' runs</title></rect>' +
      '<rect class="bar r" x="' + (x(i) + half + 2) + '" y="' + y(d.renders) + '" width="' + half +
      '" height="' + (H - pad - y(d.renders)) + '" rx="2"><title>' + d.day + ": " + d.renders + ' renders</title></rect>'
    );
  }).join("");
  const ticks = days.length <= 14 ? days : days.filter((_, i) => i % Math.ceil(days.length / 14) === 0);
  const labels = ticks.map((d) => {
    const i = days.indexOf(d);
    return '<text class="axis" x="' + (x(i) + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' +
      d.day.slice(5) + "</text>";
  }).join("");
  return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto">' +
    '<text class="axis" x="4" y="' + (y(max) + 4) + '">' + max + "</text>" + bars + labels + "</svg>";
};

const draw = (s) => {
  const t = s.totals;
  const pricedNote = s.priced ? "" : '<div class="n warn">prices not set</div>';
  $("#app").innerHTML =
    '<h1>Analytics</h1><p class="sub">' + fmt.format(t.runs) + " research runs · " +
      fmt.format(t.renders) + " videos rendered</p>" +
    '<div class="cards">' +
      card("Videos rendered", fmt.format(t.renders), t.rendersFailed ? fmt.format(t.rendersFailed) + " failed" : "") +
      card("Research runs", fmt.format(t.runs), t.runsFailed ? fmt.format(t.runsFailed) + " degraded" : "") +
      card("Total cost", money(t.costUsd), pricedNote || (fmt.format(t.inputTokens + t.outputTokens) + " tokens")) +
      card("Cost per video", money(t.costPerRenderUsd), "per render that finished") +
    "</div>" +
    "<h2>Runs and renders by day</h2><div class=\\"panel\\">" + chart(s.byDay) + "</div>" +
    "<h2>By company</h2><div class=\\"panel\\">" + companies(s.companies) + "</div>";
};

const card = (k, v, n) =>
  '<div class="card"><div class="k">' + k + '</div><div class="v">' + v + "</div>" +
  (n ? (n.startsWith("<") ? n : '<div class="n">' + n + "</div>") : "") + "</div>";

const companies = (rows) => {
  if (!rows.length) return '<p class="empty">Nothing recorded yet.</p>';
  return '<table><thead><tr><th>Company</th><th class="num">Runs</th>' +
    '<th class="num">Rendered</th><th class="num">Cost</th><th>Last seen</th></tr></thead><tbody>' +
    rows.map((r) =>
      "<tr><td>" + esc(r.company) + '</td><td class="num">' + r.runs +
      '</td><td class="num">' + r.renders + '</td><td class="num">' + money(r.costUsd) +
      "</td><td>" + r.lastAt.slice(0, 16).replace("T", " ") + "</td></tr>"
    ).join("") + "</tbody></table>";
};

const gate = (message) => {
  $("#app").innerHTML =
    '<div class="gate"><h1>Analytics</h1><p class="sub">This deployment wants a passcode.</p>' +
    '<input id="p" type="password" autocomplete="current-password" placeholder="Passcode">' +
    '<button id="go">View</button><p class="err">' + (message || "") + "</p></div>";
  const submit = async () => {
    const v = $("#p").value.trim();
    if (!v) return;
    try {
      const s = await get(v);
      if (!s) return gate("That passcode was not accepted.");
      try { sessionStorage.setItem(KEY, v); } catch {}
      draw(s);
    } catch (e) { gate(e.message); }
  };
  $("#go").onclick = submit;
  $("#p").onkeydown = (e) => { if (e.key === "Enter") submit(); };
  $("#p").focus();
};

(async () => {
  let stored = "";
  try { stored = sessionStorage.getItem(KEY) || ""; } catch {}
  try {
    const s = await get(stored);
    if (s) draw(s); else gate("");
  } catch (e) {
    $("#app").innerHTML = '<div class="gate"><h1>Analytics</h1><p class="err">' + e.message + "</p></div>";
  }
})();
`;

export const analyticsPage = (res: ServerResponse): void => {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Analytics</title>
<style>${STYLE}</style>
</head><body><main id="app"></main><script>${SCRIPT}</script></body></html>`;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Never cached: it is a live read of a log that names customers.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(html);
};

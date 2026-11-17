// Dossier first (DISPLAY lane, 2026-11-16; Griffin: "When I click on a player, it should just default to their full dossier,
// and then impact by age"). The Singular hub now sends player-name clicks here (build_singular_hub.py DOSSIER_FIRST); this hook
// puts an "Impact by age" link in the player header that opens his hub page (/singular/p/<slug>/, the rating-by-age chart).
// The deployed copy already carries a "Singular page" link (pp_site_stage.py HUB_LINK): it is relabelled, not duplicated.
// Retired players' pages get the same label in mods/history.js (HX_DF). DF_ON false = the page as before.
const DF_ON = true;
// HUBTRAJ 2026-11-16 (orchestrator brief, Griffin's go: the hub chart still drew one clump of dots per season; the dossier's own
// Impact by age chart is the one he wants). DF_SELF: "Impact by age" in the header jumps to this page's own Impact by age section
// (#m-cmp, mods/compare.js; #hx-traj on a retired page without compare.js). Its href is "#p-<id>", the page already open, so a
// middle click or a page without the section stays on this player. A second link, "Season-by-season page", opens his hub page
// (/singular/p/<slug>/: season table and the same trajectory with the five-season forecast). Retired pages: history.js builds
// that header link (HX_DF); hxRetiredHTML is wrapped below and its one link swapped for the same pair. DF_SELF false = the
// DF_ON behaviour above exactly (header link to the hub page, no second link, no wrap, no click handler).
const DF_SELF = true;
// DF_HUB_LINK (with DF_SELF): the second header link, "Season-by-season page" -> /singular/p/<slug>/. Set false when Singular's
// build_singular_hub.py HUB_PLAYER_REDIRECT goes on (those pages then redirect straight back here). False = only "Impact by age".
const DF_HUB_LINK = false;  // off 2026-11-17 with HUB_PLAYER_REDIRECT (hub pages retired)
// DF_PLAYERS (HUBTRAJ scope change; Griffin: "rename the dossier so that it is just the player page"): the top bar's brand and the
// tab title read "Players" instead of "Player Dossier" (set when this file runs; the static HTML keeps the old words until
// pp_site_stage / index.html are changed). The URL stays /singular/dossier/. False = no change.
const DF_PLAYERS = true;
if (DF_PLAYERS && typeof document !== "undefined" && typeof document.querySelector === "function") {
  const br = document.querySelector(".bar .brand");
  if (br && br.textContent === "Player Dossier") br.textContent = "Players";
  if (typeof document.title === "string" && document.title.indexOf("Player Dossier") >= 0) document.title = document.title.replace("Player Dossier", "Players");
}
// DF_FIGS (HUBTRAJ scope change: what the hub player page showed and the dossier did not): the header gains "Best season ahead"
// (current players: peak_r, peak age, upside from his own summary, as the hub page printed it) and "Career, age-weighted" (current
// and retired: the hub's figure in the all-time table's opening view, its breakdown line, and his all-time rank among players with
// 3+ seasons of 1,000+ minutes; read once from Singular's /singular/assets/player_figs.json, build_singular_hub.py PLAYER_FIGS);
// season cells in "Season by season" link to the season pages /singular/season/<yyyy>/. False = none of this.
const DF_FIGS = true;
const DF_FIGS_URL = "/singular/assets/player_figs.json";
let DFF = null, DFL = false;
const DF_T_SELF = "Jump to his Impact by age chart on this page (about ten games per dot, smoothed line, forecast)";
const DF_T_HUB = "His Singular page: ratings season by season, with the same trajectory chart and the five-season forecast";
(window.WIRES = window.WIRES || []).push(function(){
  if (!DF_ON || typeof CUR === "undefined" || !CUR || !CUR.slug) return;
  const m = document.querySelector("#app header.hero .meta");
  if (!m || typeof m.querySelector !== "function") return;  // offline render harness: stub elements
  const href = "/singular/p/" + encodeURIComponent(CUR.slug) + "/";
  let a = m.querySelector(".hub-link a");
  if (!a) {
    const s = document.createElement("span"); s.className = "hub-link";
    a = document.createElement("a"); a.href = href; a.style.color = "inherit"; s.appendChild(a); m.appendChild(s);
  }
  a.textContent = "Impact by age";
  a.title = "His rating by age, game by game, with the five-season forecast (Singular page)";
  if (!DF_SELF) return;
  a.href = "#p-" + CUR.id; a.setAttribute("data-df", "cmp"); a.title = DF_T_SELF;
  if (DF_HUB_LINK && !m.querySelector(".df-hub")) {
    const s2 = document.createElement("span"); s2.className = "df-hub";
    const b = document.createElement("a"); b.href = href; b.style.color = "inherit"; b.textContent = "Season-by-season page"; b.title = DF_T_HUB;
    s2.appendChild(b);
    const sp = a.parentNode && a.parentNode !== m ? a.parentNode : a;
    m.insertBefore(s2, sp.nextSibling);
  }
});
// retired pages: swap history.js's one header link (to the hub page) for the pair; returns h unchanged when it is not there
function dfRetSwap(h, id, doc){
  if (!DF_ON || !DF_SELF || typeof HX_DF === "undefined" || !HX_DF || !doc || !doc.slug || typeof h !== "string") return h;
  const href = `/singular/p/${encodeURIComponent(doc.slug)}/`, i = h.indexOf(`<a class="hx-lk" href="${href}"`);
  const j = i < 0 ? -1 : h.indexOf("</a>", i);
  if (j < 0) return h;
  return h.slice(0, i) + `<a class="hx-lk" href="#p-${id}" data-df="cmp" title="${DF_T_SELF}">Impact by age</a>`
    + (DF_HUB_LINK ? `</span><span><a class="hx-lk" href="${href}" title="${DF_T_HUB}">Season-by-season page</a>` : "") + h.slice(j + 4);
}
function dfWrapRet(){
  if (!(DF_SELF || DF_FIGS) || window.__dfRet || typeof hxRetiredHTML !== "function") return;
  window.__dfRet = true;
  const orig = hxRetiredHTML;
  hxRetiredHTML = function(id, doc){
    if (DF_FIGS) setTimeout(dfAfter, 0);   // history.js puts this HTML into #app right after; add the figures then
    return dfRetSwap(orig.apply(this, arguments), id, doc);
  };
}
// DF_FIGS: header figures + season links on the player page now in #app (current or retired); loads player_figs.json once
function dfAfter(){
  if (!DF_FIGS || typeof document === "undefined" || typeof document.querySelector !== "function" || typeof location === "undefined") return;
  const m = /^#p-(\d+)$/.exec(location.hash || ""), figs = document.querySelector("#app header.hero .figs");
  if (!m || !figs || typeof figs.querySelectorAll !== "function") return;
  dfSeasonLinks();
  if (figs.querySelector(".df-fig")) return;
  if (!DFF) {
    if (!DFL) { DFL = true;
      fetch(DF_FIGS_URL).then(r => r.ok ? r.json() : null).then(j => { DFF = j && j.rows ? j : {rows: {}}; dfAfter(); })
        .catch(() => { DFF = {rows: {}}; dfAfter(); }); }
    return;
  }
  const id = +m[1], row = DFF.rows[id], s = typeof CUR !== "undefined" && CUR && CUR.id === id ? CUR.summary : null;
  const f1 = v => v == null ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1);
  let h = "";
  if (s && s.peak_r != null) {   // as the hub page's "Best season ahead" KPI (build_singular_hub.player_page)
    let when = s.peak_now ? "this season" : `around age ${Math.round(s.peak_age)}`;
    if (s.peak_now && ["sipm", "sipm_gap"].includes(s.r_proj_src)) when = `around age ${Math.round(s.peak_age)}; this season is likely higher`;
    h += `<div class="fig df-fig"><div class="k">Best season ahead</div><div class="v">${f1(s.peak_r)}</div><div class="s">${when}${s.upside != null ? ` · upside ${f1(s.upside)}` : ""}${s.t5_lo != null ? `<br>next five seasons, 10th to 90th: ${f1(s.t5_lo)} to ${f1(s.t5_hi)}` : ""}</div></div>`;
  }
  if (row) {
    const n = Number(DFF.n || 0).toLocaleString("en-US");
    const rk = row[2] ? `#${row[2]} of ${n} all-time (${DFF.q}+ seasons of 1,000+ minutes)` : `not ranked all-time (fewer than ${DFF.q} seasons of 1,000+ minutes)`;
    h += `<div class="fig df-fig"><div class="k">Career, prime-based</div><div class="v">${row[0]}</div><div class="s">${rk}${row[1] ? "<br>" + row[1] : ""}${String(row[0]).endsWith("*") ? "<br>* includes an estimated lineup part (the all-time table's opening view)" : ""}</div></div>`;
  }
  if (!h) return;
  const all = figs.querySelectorAll(":scope > .fig"), last = all[all.length - 1];
  if (last) last.insertAdjacentHTML("afterend", h); else figs.insertAdjacentHTML("afterbegin", h);
}
// season cells ("1997-98") in the "Season by season" table -> /singular/season/1997/ (pages exist for 1951-52 .. 2026-27)
function dfSeasonLinks(){
  const sec = [...document.querySelectorAll("#app section.mod")].find(x => { const t = x.querySelector("h2"); return t && /^Season by season/.test(t.textContent.trim()); });
  if (!sec) return;
  for (const td of sec.querySelectorAll("tbody tr > td:first-child")) {
    const mm = /^(\d{4})-\d{2}$/.exec(td.textContent.trim());
    if (!mm || td.querySelector("a") || +mm[1] < 1951 || +mm[1] > 2026) continue;
    td.innerHTML = `<a style="color:var(--cold)" href="/singular/season/${mm[1]}/" title="${mm[1]}-${String(+mm[1] + 1).slice(2)}: every player's rating that season">${td.textContent.trim()}</a>`;
  }
}
if (DF_FIGS) (window.WIRES = window.WIRES || []).push(dfAfter);
dfWrapRet();   // the page loads this file after history.js; if a page ever loads it first, wrap once the document is parsed
if (DF_SELF && typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", dfWrapRet);
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target.closest('a[data-df="cmp"]') : null;
    if (!t || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // modified click: let the browser open it
    const sec = document.getElementById("m-cmp") || document.getElementById("hx-traj");
    if (!sec) return;
    e.preventDefault();
    sec.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  });
}

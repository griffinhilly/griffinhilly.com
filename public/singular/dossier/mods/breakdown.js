// "Where his rating comes from": exact SiPM breakdown, offence and defence as waterfalls.
// Data: d.sipmbd {v, o: [[key, value]], d: [[key, value]], last?, basis?, gp} and META.sipmbd_meta {rows, groups, basis, ...},
// built by scripts/pp_sipm_breakdown.py from scripts/ov_sipm_decomp.py (parts add up to the published rating, checked in the build).
// The section is placed after the first section by a WIRES hook (the page's render list is not edited); it replaces the
// older approximate "Where the rating comes from" section (modParts, hub box map), which is removed from the page when this one shows.
const BDCSS = `
#m-sipmbd .bdcols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px 32px;margin-top:6px}
@media (max-width:760px){#m-sipmbd .bdcols{grid-template-columns:minmax(0,1fr)}}
#m-sipmbd h3{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 4px}
#m-sipmbd h3 .num{font:600 18px var(--mono);color:var(--ink)}
#m-sipmbd .bdg{font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:10px 0 2px}
#m-sipmbd .bdr{display:grid;grid-template-columns:132px minmax(0,1fr) 46px;gap:8px;align-items:center;min-height:22px;font-size:13.5px}
@media (max-width:420px){#m-sipmbd .bdr{grid-template-columns:112px minmax(0,1fr) 42px;gap:6px;font-size:13px}}
#m-sipmbd .bdl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#m-sipmbd .bdt{position:relative;height:14px}
#m-sipmbd .bdt i{position:absolute;top:0;bottom:0;border-radius:2px;min-width:1px}
#m-sipmbd .bdt b{position:absolute;top:-4px;bottom:-4px;width:1px;background:var(--mute);opacity:.6}
#m-sipmbd .bdv{font-family:var(--mono);text-align:right;font-variant-numeric:tabular-nums}
#m-sipmbd .bdr.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:6px;font-weight:600}
#m-sipmbd .bdr.tot .bdt{height:16px}
#m-sipmbd .bdsum{display:flex;flex-wrap:wrap;gap:6px 18px;margin:2px 0 12px;font-size:14px}
#m-sipmbd .bdsum span b{font-family:var(--mono);font-weight:600}
#m-sipmbd details{margin-top:14px}
#m-sipmbd summary{cursor:pointer;font-size:14px;color:var(--ink)}
#m-sipmbd dl{display:grid;grid-template-columns:150px minmax(0,1fr);gap:4px 14px;font-size:13.5px;margin:10px 0}
@media (max-width:520px){#m-sipmbd dl{grid-template-columns:minmax(0,1fr)} #m-sipmbd dd{margin:0 0 6px}}
#m-sipmbd dt{font-weight:600}
#m-sipmbd dd{margin:0;color:var(--mute)}
`;

// one-decimal display values that add up exactly to the rounded total (largest remainder), total as the header shows it
function bdTenths(vals, total){
  const T = Math.round(parseFloat(total.toFixed(1)) * 10);
  const x = vals.map(v => v * 10), f = x.map(v => Math.floor(v + 1e-9));
  let def = T - f.reduce((a, b) => a + b, 0);
  const ord = x.map((v, i) => [v - f[i], i]).sort((a, b) => b[0] - a[0]), n = f.length;
  for (let k = 0; n && def > 0; k++, def--) f[ord[k % n][1]] += 1;
  for (let k = 0; n && def < 0; k++, def++) f[ord[n - 1 - (k % n)][1]] -= 1;
  return f;
}
function bdFmt(t){ return t === 0 ? "0.0" : (t > 0 ? "+" : "\u2212") + (Math.abs(t) / 10).toFixed(1); }

function modBreakdown(d){
  const B = d.sipmbd, M = META.sipmbd_meta, s = d.summary || {};
  if (!B || !M) return "";
  const nm = String(d.name || "");
  const head = `<section class="mod" id="m-sipmbd"><style>${BDCSS}</style>
  <div class="mhead"><h2>Where his rating comes from<span class="new">new</span></h2></div>`;
  if (B.v === "none" || s.r_proj == null) {
    return head + `<p class="lede">SiPM has no rating for ${E(d.name)} yet: he has no recent NBA rating and no draft-based estimate, so there is nothing to break down.</p></section>`;
  }
  const rows = M.rows, groups = M.groups[B.v] || [];
  const side = {o: B.o || [], d: B.d || []}, pub = {o: s.r_proj_o, d: s.r_proj_d};
  const disp = {}, cum = {};
  let lo = 0, hi = 0;
  for (const k of ["o", "d"]) {
    disp[k] = bdTenths(side[k].map(x => x[1]), pub[k]);
    let c = 0; cum[k] = disp[k].map(t => { const a = c; c += t; lo = Math.min(lo, a, c); hi = Math.max(hi, a, c); return [a, c]; });
    const T = Math.round(parseFloat(pub[k].toFixed(1)) * 10); lo = Math.min(lo, T); hi = Math.max(hi, T);
  }
  const pad = Math.max(2, (hi - lo) * 0.04); lo -= pad; hi += pad;
  const X = t => (100 * (t - lo) / (hi - lo)).toFixed(2);
  const zero = `<b style="left:${X(0)}%"></b>`;
  const bar = (a, b, col) => `<i style="left:${X(Math.min(a, b))}%;width:${(100 * Math.abs(b - a) / (hi - lo)).toFixed(2)}%;background:${col}"></i>`;
  const chart = (k, title) => {
    const keys = side[k].map(x => x[0]);
    let h = `<div class="bdside"><h3>${title} <span class="num">${sgn(pub[k])}</span></h3>`;
    for (const [gk, gt, gkeys] of groups) {
      const idx = gkeys.map(key => keys.indexOf(key)).filter(i => i >= 0);
      if (!idx.length) continue;
      h += `<div class="bdg">${E(gt)}</div>`;
      for (const i of idx) {
        const [a, b] = cum[k][i], t = disp[k][i], r = rows[keys[i]] || [keys[i], ""];
        h += `<div class="bdr"><span class="bdl" title="${E(r[1])}">${E(r[0])}</span><span class="bdt">${zero}${t ? bar(a, b, t > 0 ? "var(--hot)" : "var(--cold)") : ""}</span><span class="bdv">${bdFmt(t)}</span></div>`;
      }
    }
    const T = Math.round(parseFloat(pub[k].toFixed(1)) * 10);
    h += `<div class="bdr tot"><span class="bdl">${title} rating</span><span class="bdt">${zero}${T ? bar(0, T, "var(--ink)") : ""}</span><span class="bdv">${sgn(pub[k])}</span></div></div>`;
    return h;
  };

  // plain-language summary: net by stage, rounded to add up to the header's rating
  const stageOf = key => { for (const [gk, , gkeys] of groups) if (gkeys.includes(key)) return gk; return "other"; };
  const st = {};
  for (const k of ["o", "d"]) side[k].forEach(([key, v]) => { const g = stageOf(key); st[g] = (st[g] || 0) + v; });
  const gks = groups.map(g => g[0]).filter(g => g in st), stT = bdTenths(gks.map(g => st[g]), s.r_proj);
  const stv = Object.fromEntries(gks.map((g, i) => [g, bdFmt(stT[i])]));
  const net = s.r_proj, mag = Math.abs(net).toFixed(1);
  const what = net >= 0.05 ? `about ${mag} points per 100 possessions better than an average NBA player` : net <= -0.05 ? `about ${mag} points per 100 possessions worse than an average NBA player` : "about the same as an average NBA player";
  const games = B.gp ? `his ${B.gp} game${B.gp === 1 ? "" : "s"} this season <b>${stv.season}</b>` : "no games yet this season";
  let lede, sum;
  if (B.v === "sipm") {
    lede = `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. It builds that number from three sources and then updates it with this season's games: what his stats say, how his lineups actually did, and a projection step for age and role.`;
    sum = `<span>His stats <b>${stv.stats}</b></span><span>Lineup results <b>${stv.lineups}</b></span><span>Age and role <b>${stv.proj}</b></span><span>${B.gp ? `${B.gp} game${B.gp === 1 ? "" : "s"} this season` : "This season (no games yet)"} <b>${stv.season}</b></span>`;
  } else if (B.v === "sipm_gap") {
    lede = `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. He has no 2025-26 rating (he played little or not at all last season), so SiPM starts from his rating after ${sname(B.last)} and rolls it forward to this season; ${games}.`;
    sum = `<span>Rating after ${sname(B.last)}, rolled forward <b>${stv.past}</b></span><span>This season <b>${stv.season}</b></span>`;
  } else {
    const basis = (M.basis || {})[B.basis || "none"] || "his draft slot and age";
    lede = `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. He has no NBA lineup history yet, so his rating starts from a rookie estimate based on ${E(basis)}; ${games}.`;
    sum = `<span>Rookie estimate <b>${stv.rookie}</b></span><span>This season <b>${stv.season}</b></span>`;
  }
  const used = new Set([...side.o, ...side.d].map(x => x[0]));
  const dl = groups.flatMap(g => g[2]).filter(k => used.has(k)).map(k => `<dt>${E(rows[k][0])}</dt><dd>${E(rows[k][1])}</dd>`).join("");
  const how = B.v === "sipm"
    ? `SiPM's box-score model turns his stats (per 36 minutes, adjusted for opponents), height, age and rim deterrence into a rating, using weights learned from every season since 1996-97. A lineup model starts from that rating and moves it by how his lineups actually scored and defended, carrying earlier seasons forward at three-quarters weight a year. A projection step then weighs the two by how well each predicted the next season and adds age and role. His box-score games this season move it from there. Stat parts are measured from the average player-season the model learned from. A stat can land on the "wrong" side: the weights are fitted on past players, so for example big offensive-rebound numbers count a lot on offence and a little against him on defence.`
    : B.v === "sipm_gap" ? `When a player misses a season, SiPM keeps his last rating and moves it forward with a model fitted on past players who returned after time away (it accounts for his age and the seasons missed). His box-score games this season then move it.`
    : `Rookies have no NBA lineup data, so SiPM starts them from a rookie-season estimate: past rookies' first-season level, predicted from pre-NBA stats (when on file), draft slot and age. His box-score games this season then move it.`;
  return head + `<p class="lede">${lede}</p>
  <div class="bdsum">${sum}</div>
  <p class="note"><b style="color:var(--ink)">How to read this:</b> start at 0, an average NBA player. Each bar adds (warm colour) or takes away (blue) points per 100 possessions, starting where the bar above it ended. The bottom bar is where he lands: the same rating as at the top of the page. Steps are rounded to 0.1 so that they add up.</p>
  <div class="bdcols">${chart("o", "Offence")}${chart("d", "Defence")}</div>
  <details><summary>What each step means</summary><dl>${dl}</dl><p class="note">${how}</p></details></section>`;
}

(window.WIRES = window.WIRES || []).push(function(){
  if (typeof CUR === "undefined" || !CUR || typeof modBreakdown !== "function") return;
  const app = document.querySelector("#app");
  if (!app) return;
  const html = modBreakdown(CUR);
  if (!html) return;
  if (typeof app.insertAdjacentHTML !== "function") { app.innerHTML += html; return; }  // offline render test (no DOM)
  if (document.querySelector("#m-sipmbd")) return;
  const secs = [...document.querySelectorAll("#app section.mod")];
  secs.filter(x => !x.id && ((x.querySelector("h2") || {}).textContent || "").trim().startsWith("Where the rating comes from")).forEach(x => x.remove());
  const firstSec = document.querySelector("#app section.mod"), nav = document.querySelector("#jump");
  if (firstSec) firstSec.insertAdjacentHTML("afterend", html); else if (nav) nav.insertAdjacentHTML("afterend", html); else app.insertAdjacentHTML("beforeend", html);
  if (nav) {  // rebuild the jump bar as wire() does, so it lists this section and not the removed one
    const all = [...document.querySelectorAll("section.mod")];
    nav.innerHTML = all.map((x, i) => `<button data-i="${i}">${E(((x.querySelector("h2") || {}).childNodes || [])[0] ? x.querySelector("h2").childNodes[0].textContent.trim() : "")}</button>`).join("");
    nav.onclick = e => { const b = e.target.closest("button"); if (b) all[+b.dataset.i].scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); };
  }
});

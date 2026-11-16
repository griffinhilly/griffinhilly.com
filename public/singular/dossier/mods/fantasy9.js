// "Fantasy, 9-category": what his box-score line is worth in a standard 9-category league today, and where each category
// is heading over the next seasons. Data: d.f9 and META.f9_meta, built by scripts/pp_fantasy9.py (model scripts/f9_model.py,
// walk-forward test scripts/f9_calibrate.py). Today's rank and z-scores are the #fantasy page's numbers (fantasy.json).
// The section is placed after the box-score section by a WIRES hook (the page's render list is not edited).
// f9 = {o, seasons, h, q: {cat: [[p10, p50, p90] per season]}, val, rank: [[best, median, worst]], zmed, up, dn, pplay, imp,
//       today: {rk, n, v, z, mp, g, line}, sofar: {gp, v, z, rk, line}, ref: {gp, pts, ...}}
const F9CSS = `
#m-f9 .f9top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px 36px;margin-top:4px}
@media (max-width:860px){#m-f9 .f9top{grid-template-columns:minmax(0,1fr)}}
#m-f9 .f9figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:4px 0 14px}
#m-f9 .f9figs .fig .v{font-size:26px}
@media (max-width:480px){#m-f9 .f9figs{grid-template-columns:repeat(2,minmax(0,1fr))}#m-f9 .f9figs .fig .v{font-size:22px}}
#m-f9 .f9bar{display:grid;grid-template-columns:96px minmax(0,1fr) 92px;gap:4px 10px;align-items:center;font-size:13px;min-height:24px}
#m-f9 .f9bar .lbl{color:var(--ink)}
#m-f9 .f9bar .n{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;color:var(--mute);font-size:12.5px}
#m-f9 .f9bar .n b{color:var(--ink);font-weight:600}
#m-f9 .f9bar svg{display:block;width:100%;height:18px}
#m-f9 .f9leg{display:flex;gap:4px 14px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:6px}
#m-f9 .f9leg i{display:inline-block;vertical-align:-1px;margin-right:4px}
#m-f9 .f9read{font-size:14.5px;line-height:1.5;margin:0 0 10px}
#m-f9 .f9read b{font-weight:700}
#m-f9 .f9read .up{color:var(--forest);font-weight:600} #m-f9 .f9read .dn{color:var(--brown);font-weight:600}
#m-f9 .f9grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 18px;margin-top:14px}
@media (max-width:860px){#m-f9 .f9grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:540px){#m-f9 .f9grid{grid-template-columns:minmax(0,1fr)}}
#m-f9 .f9c{border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:8px 10px 4px}
#m-f9 .f9c h4{margin:0;font:600 13.5px var(--sans);display:flex;justify-content:space-between;gap:8px}
#m-f9 .f9c h4 span{font:12px var(--mono);color:var(--mute);font-weight:400;white-space:nowrap}
#m-f9 .f9c svg{display:block;width:100%;height:auto}
#m-f9 .f9c text{font:10.5px var(--mono);fill:var(--mute)}
#m-f9 .f9tbl table{font-size:13px} #m-f9 .f9tbl td.mute{color:var(--mute)}
@media (max-width:480px){#m-f9 .f9tbl table{font-size:12px}#m-f9 .f9tbl th,#m-f9 .f9tbl td{padding:5px 4px}}
#m-f9 details{margin-top:12px;font-size:13.5px} #m-f9 details summary{cursor:pointer;color:var(--mute)}
#m-f9 .f9cal td{padding:3px 6px;font-size:12px} #m-f9 .f9cal th{font-size:11.5px;padding:3px 6px}
`;
const F9C = [["pts", "Points", 1], ["fg3m", "Threes made", 1], ["reb", "Rebounds", 1], ["ast", "Assists", 1], ["stl", "Steals", 2],
             ["blk", "Blocks", 2], ["fgp", "Field-goal %", 0], ["ftp", "Free-throw %", 0], ["tov", "Turnovers", 1]];

function f9num(v, k){ if (v == null || !isFinite(v)) return "\u2013"; return k === 0 ? (100*v).toFixed(1) + "%" : v.toFixed(k); }
function f9sg(v, k){ return v == null || !isFinite(v) ? "\u2013" : (v > 0 ? "+" : v < 0 ? "\u2212" : "") + Math.abs(v).toFixed(k ?? 2); }
function f9ss(y){ return `${String(y).slice(2)}-${String(+y+1).slice(2)}`; }
function f9list(a){ return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length-1]; }

function modFantasy9(d){
  const F = d.f9, M = META.f9_meta;
  if (!F || !M) return "";
  const T = F.today, SF = F.sofar, Q = F.q, has = !!(Q && F.seasons && F.seasons.length);
  if (!T && !SF && !has) return "";
  const ink = css("--ink"), mute = css("--mute"), grid = css("--grid"), panel = css("--panel"), line = css("--line");
  const cUp = css("--forest"), cDn = css("--brown"), cBand = css("--ochre");
  const dts = (() => { const t = new Date(M.as_of + "T12:00:00"); return isNaN(t) ? E(M.as_of) : t.toLocaleDateString("en-US", {month: "short", day: "numeric"}); })();

  // ---- worth today: rank figures + per-category z bars (projection = bar, so far = dot)
  const figs = `<div class="f9figs">
    <div class="fig"><div class="k">Fantasy rank, rest of 2026-27</div><div class="v">${T ? "#" + T.rk : "\u2013"}</div><div class="s">${T ? `of ${T.n} players \u00b7 our projection` : "not on our fantasy list"}</div></div>
    <div class="fig"><div class="k">Value per game</div><div class="v">${T ? f9sg(T.v) : "\u2013"}</div><div class="s">average of the nine category scores</div></div>
    <div class="fig"><div class="k">So far this season</div><div class="v">${SF && SF.rk ? "#" + SF.rk : "\u2013"}</div><div class="s">${SF ? `${SF.gp} game${SF.gp === 1 ? "" : "s"}${SF.rk ? ` \u00b7 among ${M.n_so_far} with 5+` : " \u00b7 under 5, no rank"}` : "no games yet"}</div></div></div>`;
  const zs = T ? T.z : (SF ? SF.z : null), zd = T && SF ? SF.z : null;
  const span = 3, X = v => 50 + 48*Math.max(-1, Math.min(1, v/span));
  const bars = zs ? F9C.map(([k, lab, dg], i) => {
    const z = zs[i], zz = zd ? zd[i] : null, ln = T ? T.line : SF.line, val = ln ? ln[k] : null;
    if (z == null) return "";
    const x0 = Math.min(50, X(z)), w = Math.abs(X(z) - 50);
    const dot = zz != null ? `<circle cx="${X(zz).toFixed(1)}%" cy="9" r="3.6" fill="${panel}" stroke="${ink}" stroke-width="1.3"/>` : "";
    const tip = `${lab}: ${f9num(val, dg)} a game, score ${f9sg(z)}${zz != null ? `; so far ${f9num(SF.line[k], dg)}, score ${f9sg(zz)}` : ""}`;
    return `<div class="f9bar" title="${E(tip)}"><span class="lbl">${lab}</span><svg aria-hidden="true"><line x1="50%" x2="50%" y1="0" y2="18" stroke="${mute}" stroke-dasharray="2 2"/>
      <rect x="${x0.toFixed(1)}%" y="4" width="${w.toFixed(1)}%" height="10" rx="2" fill="${dcol(z, 2.5)}"/>${dot}</svg><span class="n"><b>${f9num(val, dg)}</b> ${f9sg(z, 1)}</span></div>`; }).join("") : "";
  const barLeg = zs ? `<div class="f9leg"><span><i style="width:16px;height:9px;background:${dcol(1.8, 2.5)};border-radius:2px"></i>${T ? "projected, rest of season" : "so far"}</span>
    ${zd ? `<span><svg width="10" height="10" style="vertical-align:-1px;margin-right:4px"><circle cx="5" cy="5" r="3.6" fill="${panel}" stroke="${ink}" stroke-width="1.3"/></svg>so far (${SF.gp} games)</span>` : ""}
    <span>score = how far above or below an average top-${M.pool_size} player, in standard deviations; middle line = 0</span></div>` : "";

  // ---- read-out: which categories rise, which fall; drivers
  let read = "";
  if (has) {
    const K = F.seasons.length, last = K - 1, i2 = Math.min(2, last);
    const ups = [], dns = [], flat = [];
    F9C.forEach(([k, lab]) => { const a = F.zmed[k][0], b = F.zmed[k][i2]; if (a == null || b == null) return;
      const dz = b - a, nm = k === "tov" ? (dz < 0 ? "turnovers (more of them)" : "turnovers (fewer)") : lab.toLowerCase();
      (dz >= 0.15 ? ups : dz <= -0.15 ? dns : flat).push(nm); });
    const m0 = Q.mpg[0][1], m2 = Q.mpg[i2][1], imp = F.imp || [], im0 = imp[0], im2 = imp[i2];
    const r0 = F.rank[0][1], r2 = F.rank[i2][1];
    read = `<p class="f9read">From ${sname(F.seasons[0])} to ${sname(F.seasons[i2])}, the typical path${ups.length ? ` <span class="up">gains in ${f9list(ups)}</span>` : " gains in no category"}${dns.length ? `, <span class="dn">loses ground in ${f9list(dns)}</span>` : ""}${flat.length ? `, and holds about level in ${f9list(flat)}` : ""}. Median fantasy rank: <b>#${r0}</b> \u2192 <b>#${r2}</b>.</p>
      <p class="f9read" style="color:var(--mute);font-size:13.5px">Drivers: minutes ${m0 != null ? m0.toFixed(1) : "\u2013"} \u2192 ${m2 != null ? m2.toFixed(1) : "\u2013"} a game (median)${im0 && im2 ? `; Singular impact rating ${f9sg(im0[0], 1)} \u2192 ${f9sg(im2[0], 1)} (80% range ${f9sg(im2[1], 1)} to ${f9sg(im2[2], 1)} in ${sname(F.seasons[i2])})` : ""}. If his impact climbs, minutes, shots and assists climb with it, so most categories rise together; if it slips, they fall together (green and brown lines below).</p>`;
  } else {
    read = `<p class="f9read" style="color:var(--mute)">No multi-season projection yet: he has no NBA season with 15+ games and 200+ minutes in 2024-25 or 2025-26. Rookies get one after their first season.</p>`;
  }

  // ---- value / rank table by season
  let vtbl = "";
  if (has) {
    const rows = F.seasons.map((s, k) => { const rk = F.rank[k], pp = F.pplay[k], vv = F.val[k], show = M.show.value[F.h[k] - 1];
      return `<tr><td class="l">${sname(s)}${s === 2026 ? "*" : ""}</td><td><b>#${rk[1]}</b></td><td class="mute">${show ? `#${rk[0]} to #${rk[2]}` : "\u2013"}</td><td>${f9sg(vv[1])}</td><td class="mute">${pp == null ? "in season" : pp + "%"}</td></tr>`; }).join("");
    vtbl = `<div class="tbl f9tbl" style="margin-top:6px"><table><thead><tr><th class="l">Season</th><th title="Median of 1,000 simulated seasons">Rank</th><th title="80% range: 8 in 10 simulated seasons land here">80% range</th><th title="Average of the nine category scores (median)">Value</th><th title="Chance he plays 20+ games that season">Plays</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note" style="margin-top:6px">Ranks are against today's ${M.n_live}-player list, so a future rank means "where this line would rank now". Lines and ranks assume he plays (20+ games); "Plays" is the chance he does. *2026-27: rest of the season.</p>`;
  }

  // ---- small multiples: one chart per category
  let charts = "";
  if (has) {
    const K = F.seasons.length, W = 250, H = 124, L = 30, R = 6, Tm = 8, B = 20;
    const xs = ["ref", ...F.seasons], n = xs.length, step = (W - L - R)/n, Xc = i => L + step*(i + 0.5);
    charts = `<div class="f9grid">` + F9C.map(([k, lab, dg]) => {
      const q = Q[k], ref = F.ref ? F.ref[k] : null, sf = SF && SF.line ? SF.line[k] : null, up = F.up ? F.up[k] : null, dn = F.dn ? F.dn[k] : null;
      const shown = F.h.map(h => !!(M.show[k] && M.show[k][h - 1]));
      const vals = [...q.flatMap((x, i) => shown[i] ? [x[0], x[2]] : [x[1]]), ref, sf, ...(up || []), ...(dn || [])].filter(v => v != null && isFinite(v));
      let y0 = Math.min(...vals), y1 = Math.max(...vals);
      const pad = (y1 - y0)*0.08 || (k === "fgp" || k === "ftp" ? 0.02 : 0.2); y0 = Math.max(0, y0 - pad); y1 = y1 + pad;
      const Y = v => Tm + (y1 - v)/(y1 - y0)*(H - Tm - B);
      const ticks = [y0 + (y1 - y0)*0.1, (y0 + y1)/2, y1 - (y1 - y0)*0.1];
      let g = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="${grid}"/><text x="${L - 4}" y="${(Y(t) + 3.5).toFixed(1)}" text-anchor="end">${dg === 0 ? (100*t).toFixed(0) : t.toFixed(dg === 2 ? 1 : (t >= 10 ? 0 : 1))}</text>`).join("");
      g += xs.map((s, i) => `<text x="${Xc(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${s === "ref" ? "25-26" : f9ss(s)}</text>`).join("");
      const sc = (arr, col) => arr && arr.some(v => v != null) ? `<polyline points="${arr.map((v, i) => v == null ? "" : `${Xc(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).filter(Boolean).join(" ")}" fill="none" stroke="${col}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
        arr.map((v, i) => v == null ? "" : `<circle cx="${Xc(i + 1).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.2" fill="${col}"/>`).join("") : "";
      const band = q.map((x, i) => { const cx = Xc(i + 1).toFixed(1);
        const tip = `${sname(F.seasons[i])}: median ${f9num(x[1], dg)}${shown[i] ? `, 80% range ${f9num(x[0], dg)} to ${f9num(x[2], dg)}` : " (range not shown: it failed the calibration test)"}${up && up[i] != null ? `; if impact climbs ${f9num(up[i], dg)}, if it slips ${f9num(dn[i], dg)}` : ""}`;
        return `<g><title>${E(tip)}</title>${shown[i] ? `<rect x="${(+cx - 7).toFixed(1)}" y="${Y(x[2]).toFixed(1)}" width="14" height="${Math.max(1, Y(x[0]) - Y(x[2])).toFixed(1)}" rx="3" fill="${cBand}" opacity=".28"/>` : ""}
          <circle cx="${cx}" cy="${Y(x[1]).toFixed(1)}" r="4.2" fill="${ink}"/></g>`; }).join("");
      const refm = ref != null ? `<g><title>${E(`2025-26 actual: ${f9num(ref, dg)} (${F.ref.gp} games)`)}</title><circle cx="${Xc(0).toFixed(1)}" cy="${Y(ref).toFixed(1)}" r="4" fill="${panel}" stroke="${ink}" stroke-width="1.4"/></g>` : "";
      const sfm = sf != null && F.seasons[0] === 2026 ? `<g><title>${E(`2026-27 so far: ${f9num(sf, dg)} (${SF.gp} games)`)}</title><path d="M${(Xc(1) + 11).toFixed(1)} ${(Y(sf) - 4).toFixed(1)}l4 4l-4 4l-4 -4z" fill="${panel}" stroke="${ink}" stroke-width="1.2"/></g>` : "";
      const a = q[0][1], b = q[K - 1][1];
      return `<div class="f9c"><h4>${lab}<span>${f9num(a, dg)} \u2192 ${f9num(b, dg)}</span></h4><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(lab)} per game, projected by season">${g}${sc(up, cUp)}${sc(dn, cDn)}${band}${refm}${sfm}</svg></div>`; }).join("") + `</div>
      <div class="f9leg" style="margin-top:8px"><span><svg width="12" height="12" style="vertical-align:-2px;margin-right:4px"><circle cx="6" cy="6" r="4" fill="${ink}"/></svg>median</span>
        <span><i style="width:10px;height:14px;background:${cBand};opacity:.45;border-radius:2px"></i>80% range</span>
        <span><svg width="12" height="12" style="vertical-align:-2px;margin-right:4px"><circle cx="6" cy="6" r="4" fill="${panel}" stroke="${ink}" stroke-width="1.4"/></svg>2025-26 actual</span>
        ${SF && F.seasons[0] === 2026 ? `<span><svg width="12" height="12" style="vertical-align:-2px;margin-right:4px"><path d="M6 1.5l4.5 4.5l-4.5 4.5l-4.5 -4.5z" fill="${panel}" stroke="${ink}" stroke-width="1.2"/></svg>2026-27 so far</span>` : ""}
        ${F.up ? `<span><i style="width:16px;height:0;border-top:2px dashed ${cUp}"></i>if his impact climbs (top fifth of paths)</span><span><i style="width:16px;height:0;border-top:2px dashed ${cDn}"></i>if it slips (bottom fifth)</span>` : ""}</div>`;
  }

  // ---- method and test
  const C = M.calib, rng = a => { const lo = Math.min(...a), hi = Math.max(...a); return `${Math.round(100*lo)}-${Math.round(100*hi)}%`; };
  const catCov = F9C.flatMap(([k]) => C.cov[k]);
  const mr = F9C.flatMap(([k]) => C.mae_ratio[k]);
  const calRows = F9C.map(([k, lab]) => `<tr><td class="l">${lab}</td>${C.cov[k].map((v, i) => `<td${M.show[k][i] ? "" : ` style="color:var(--hot)"`}>${Math.round(100*v)}%</td>`).join("")}</tr>`).join("") +
    `<tr><td class="l"><b>9-cat value</b></td>${C.value_joint.map(v => `<td><b>${Math.round(100*v)}%</b></td>`).join("")}</tr><tr><td class="l mute">value, categories drawn separately</td>${C.value_indep.map(v => `<td class="mute">${Math.round(100*v)}%</td>`).join("")}</tr>`;
  const method = `<details><summary>How this is built, and the test</summary>
    <p>Each projection is 1,000 simulated seasons. Every simulated season draws <b>one</b> path for his impact (Singular's 5-year outlook for him: the fan on this page), and his minutes and per-minute rates follow it through how players moved together in the past, plus the surprises of one real past player of his age and minutes. Points come from shots: points = 2 \u00d7 made field goals + made threes + made free throws. Category ageing comes from history (every season since ${sname(C.first_training_season)}), not from assumed curves. Per-game value uses the same nine scores as the fantasy ranks page, against the top ${M.pool_size} players today.</p>
    <p>The test: from every season-end from ${sname(C.origins[0])} to ${sname(C.origins[1])}, using only what was known then, we projected the next 1-4 seasons of every player and checked ${C.n_rows.toLocaleString("en-US")} real outcomes (players who played 20+ games). An 80% range should hold about 8 times in 10; we publish a range only where it held 75-85%. Per category and season ahead it held <b>${rng(catCov)}</b>; the 9-category value range held <b>${rng(C.value_joint)}</b>. Drawn category by category, the value range would have held only ${rng(C.value_indep)}: the categories really do move together. The medians beat "last season plus a typical age change" by ${Math.round(100*(1 - Math.max(...mr)))}-${Math.round(100*(1 - Math.min(...mr)))}% (average miss).</p>
    <div class="tbl f9cal" style="max-width:520px"><table><thead><tr><th class="l">80% range held</th><th>1 season ahead</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody>${calRows}</tbody></table></div>
    <p class="note">What this cannot see: trades and new teammates, injuries that have not happened, and changes in how the league plays beyond its recent trend. For the top 50 players the ranges run a little wide: one season ahead, the value range held ${Math.round(100*C.top50_h1_cov.value)}% of the time. Rest-of-2026-27 starts from the fantasy ranks page's live line (minutes through ${dts}).</p></details>`;

  return `<section class="mod" id="m-f9"><style>${F9CSS}</style>
  <div class="mhead"><h2>Fantasy, 9-category<span class="new">today and ahead</span></h2><a href="#fantasy" style="font-size:13px;color:var(--mute)">All fantasy ranks \u2192</a></div>
  <p class="lede">Fantasy leagues score the box score. A standard league counts nine categories per game: points, threes, rebounds, assists, steals, blocks, field-goal %, free-throw % and turnovers. Here is what his line is worth now, and where each category is likely to go. Ranges are 80% ranges: 8 in 10 outcomes should land inside.</p>
  <div class="f9top"><div>${figs}${bars}${barLeg}</div><div><h3 style="margin-bottom:6px">Where his line is heading</h3>${read}${vtbl}</div></div>
  ${charts}${method}</section>`;
}

(window.WIRES = window.WIRES || []).push(function(){
  if (typeof CUR === "undefined" || !CUR || typeof modFantasy9 !== "function") return;
  const app = document.querySelector("#app");
  if (!app) return;
  const html = modFantasy9(CUR);
  if (!html) return;
  if (typeof app.insertAdjacentHTML !== "function") { app.innerHTML += html; return; }  // offline render test (no DOM)
  if (document.querySelector("#m-f9")) return;
  const box = document.querySelector("#m-box"), nav = document.querySelector("#jump");
  if (box) box.insertAdjacentHTML("afterend", html); else app.insertAdjacentHTML("beforeend", html);
  if (nav) {  // rebuild the jump bar as wire() does, so it lists this section
    const all = [...document.querySelectorAll("section.mod")];
    nav.innerHTML = all.map((x, i) => `<button data-i="${i}">${E(((x.querySelector("h2") || {}).childNodes || [])[0] ? x.querySelector("h2").childNodes[0].textContent.trim() : "")}</button>`).join("");
    nav.onclick = e => { const b = e.target.closest("button"); if (b) all[+b.dataset.i].scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); };
  }
});

// Shot-making module. Data: d.shotq {seasons, zones, diet} and META.shotq_meta (built by scripts/pp_shotq.py from scripts/shot_quality.py).
// seasons row: [season, fga, xpts_per_shot, pts_per_shot, making_per100, lo80, hi80, shrunk]; zones row: [fga, xfg, fg, making_per100].
const SQCSS = `
.sqfigs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 18px;margin:6px 0 16px}
@media (max-width:760px){.sqfigs{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sqfigs .fig .v{font-size:26px}
.sqfigs .fig.big .v{font-size:34px}
.sqtbl table{font-size:12.5px}
.sqtbl th,.sqtbl td{padding:4px 7px}
.sqtbl td.na{color:var(--mute)}
.sqdiet{display:grid;grid-template-columns:52px minmax(0,1fr) 48px;gap:4px 8px;align-items:center;font-size:12px}
.sqdiet .lbl{font-family:var(--mono);color:var(--mute)}
.sqdiet .n{font-family:var(--mono);color:var(--mute);text-align:right}
.sqdiet .st{display:flex;height:14px;border-radius:3px;overflow:hidden;background:var(--grid)}
.sqdiet .st i{display:block;height:100%}
.sqdiet .cur{color:var(--ink);font-weight:600}
.sqleg{display:flex;gap:4px 14px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:8px}
.sqleg .sw{display:inline-block;width:12px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
`;
const SQZ = {rim: ["Rim", "Two-pointers within 4 ft"], short_mid: ["Short mid", "Two-pointers from 4 to 14 ft"], long_mid: ["Long mid", "Two-pointers from 14 ft out"],
             corner3: ["Corner 3", "Threes from the corners"], ab3: ["Above-break 3", "Other threes, incl. 30+ ft"]};
const SQZCOL = {rim: "--brown", short_mid: "--ochre", long_mid: "--olive", corner3: "--forest", ab3: "--purple"};

function sqPct(q, v){
  if (!q || v == null || !isFinite(v)) return null;
  if (v <= q[0]) return 0; if (v >= q[10]) return 100;
  for (let i = 0; i < 10; i++) if (v < q[i+1]) return 10*(i + (q[i+1] > q[i] ? (v - q[i])/(q[i+1] - q[i]) : 0.5));
  return 100;
}
function sqOrd(p){ const n = Math.round(p), s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function sqSg(v, k){ return v == null || !isFinite(v) ? "\u2013" : (v > 0 ? "+" : v < 0 ? "\u2212" : "") + Math.abs(v).toFixed(k ?? 1); }

function modShotq(d){
  const S = d.shotq, M = META.shotq_meta;
  if (!S || !S.seasons || !S.seasons.length || !M) return "";
  const rows = S.seasons, ys = rows.map(r => String(r[0]));
  const y = ys.includes(String(SEASON)) ? String(SEASON) : ys[ys.length - 1];
  const r = rows[ys.indexOf(y)], [, fga, xp, pp, mk, lo, hi, sh] = r;
  const L = M.league[y] || {}, Q = M.q[y] || null, K = M.k_shots, T = M.test, P = M.persistence;
  const cur = +y === M.current_season, part = s => +s === M.current_season ? " (so far)" : "";
  const panel = css("--panel"), hot = css("--hot"), cold = css("--cold");
  const shade = (v, span) => { if (v == null || !isFinite(v)) return ""; const t = Math.max(-1, Math.min(1, v/span)); return Math.abs(t) < 0.1 ? "" : `background:${mix(panel, t > 0 ? hot : cold, 0.32*Math.abs(t))}`; };
  const pq = Q && fga >= Q.thr ? sqPct(Q.xpts, xp) : null, pm = Q && fga >= Q.thr ? sqPct(Q.shrunk, sh) : null;
  const popTxt = Q ? `among ${Q.n} players with ${Q.thr}+ shots in ${sname(y)}` : "";
  const R = fga/(fga + K);

  // headline figures for the selected season
  const figs = `<div class="sqfigs">
    <div class="fig"><div class="k">Shot quality</div><div class="v">${xp.toFixed(2)}</div><div class="s">expected points per shot \u00b7 league ${L.xpts != null ? L.xpts.toFixed(2) : "\u2013"}${pq != null ? ` \u00b7 ${sqOrd(pq)} percentile (100 = easiest shots)` : ""}</div></div>
    <div class="fig"><div class="k">What he scored</div><div class="v">${pp.toFixed(2)}</div><div class="s">points per shot on ${fga.toLocaleString("en-US")} shots</div></div>
    <div class="fig"><div class="k">Making, per 100 shots</div><div class="v">${sqSg(mk)}</div><div class="s">80% range ${sqSg(lo)} to ${sqSg(hi)}</div></div>
    <div class="fig big"><div class="k">Believable making</div><div class="v">${sqSg(sh)}</div><div class="s">${Math.round(100*R)}% of his number counts${pm != null ? ` \u00b7 ${sqOrd(pm)} percentile` : ""}</div></div></div>`;

  // chart: making per 100 by season, 80% range, raw (hollow) and believable (filled)
  const W = 520, H = 220, Lm = 36, Rm = 8, Tm = 12, Bm = 40, n = rows.length;
  const vals = rows.flatMap(x => [x[5], x[6], x[7]]).filter(v => v != null && isFinite(v));
  const y0 = Math.min(-10, Math.floor(Math.min(...vals)/5)*5), y1 = Math.max(10, Math.ceil(Math.max(...vals)/5)*5);
  const step = (W - Lm - Rm)/Math.max(n, 1), X = i => Lm + step*(i + 0.5), Y = v => Tm + (y1 - v)/(y1 - y0)*(H - Tm - Bm);
  const gstep = (y1 - y0) > 50 ? 20 : 10;
  let g = "";
  for (let v = Math.ceil(y0/gstep)*gstep; v <= y1; v += gstep) g += `<line x1="${Lm}" x2="${W-Rm}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="${v === 0 ? css("--mute") : css("--grid")}" ${v === 0 ? 'stroke-dasharray="3 3"' : ""}/><text x="${Lm-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end">${v > 0 ? "+" : ""}${v}</text>`;
  const marks = rows.map((x, i) => {
    const sel = String(x[0]) === y, cx = X(i).toFixed(1), col = dcol(x[7], 10);
    const tip = `${sname(x[0])}${part(x[0])}: ${x[1]} shots; making ${sqSg(x[4])} per 100 (80% range ${sqSg(x[5])} to ${sqSg(x[6])}); believable ${sqSg(x[7])}`;
    return `<g><title>${E(tip)}</title>${sel ? `<rect x="${(X(i)-step/2+2).toFixed(1)}" y="${Tm}" width="${(step-4).toFixed(1)}" height="${H-Tm-Bm}" fill="${css("--ochre")}" opacity=".10"/>` : ""}
      <line x1="${cx}" x2="${cx}" y1="${Y(x[5]).toFixed(1)}" y2="${Y(x[6]).toFixed(1)}" stroke="${css("--mute")}" stroke-width="5" stroke-linecap="round" opacity=".28"/>
      <circle cx="${cx}" cy="${Y(x[4]).toFixed(1)}" r="4" fill="${panel}" stroke="${css("--mute")}" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${Y(x[7]).toFixed(1)}" r="5.5" fill="${col}" stroke="${css("--ink")}" stroke-width=".6"/>
      <text x="${cx}" y="${H-Bm+16}" text-anchor="middle" ${sel ? `class="lab"` : ""}>${String(x[0]).slice(2)}-${String(x[0]+1).slice(2)}${+x[0] === M.current_season ? "*" : ""}</text>
      <text x="${cx}" y="${H-Bm+30}" text-anchor="middle" style="font-size:10.5px">${x[1]}</text></g>`; }).join("");
  const chart = `<div style="overflow-x:auto"><svg class="chart" style="min-width:${Math.max(360, 52*n)}px" viewBox="0 0 ${W} ${H}" role="img" aria-label="Shot-making per 100 shots by season">${g}${marks}
    <text x="${Lm-6}" y="${H-Bm+30}" text-anchor="end" style="font-size:10px">FGA</text></svg></div>
    <div class="sqleg"><span><svg width="12" height="12" style="vertical-align:-2px"><circle cx="6" cy="6" r="4.5" fill="${dcol(8, 10)}" stroke="${css("--ink")}" stroke-width=".6"/></svg> believable (shrunk)</span>
      <span><svg width="12" height="12" style="vertical-align:-2px"><circle cx="6" cy="6" r="3.5" fill="${panel}" stroke="${css("--mute")}" stroke-width="1.5"/></svg> raw</span>
      <span><svg width="10" height="14" style="vertical-align:-2px"><line x1="5" x2="5" y1="2" y2="12" stroke="${css("--mute")}" stroke-width="5" stroke-linecap="round" opacity=".28"/></svg> 80% range</span>
      ${rows.some(x => +x[0] === M.current_season) ? `<span>* ${sname(M.current_season)} so far</span>` : ""}</div>`;

  // season table
  const stbl = `<div class="tbl sqtbl"><table><thead><tr><th class="l">Season</th><th title="Field-goal attempts, regular season">FGA</th><th title="Expected points per shot: what an average shooter scores on these shots">Quality</th><th title="Actual points per shot">Pts/shot</th><th title="Actual minus expected points per 100 shots, league = 0">Making</th><th title="80% range of the raw making number, from shot-by-shot luck">80% range</th><th title="Making shrunk toward 0 by FGA / (FGA + ${K})">Believable</th></tr></thead><tbody>
    ${rows.map(x => `<tr class="${String(x[0]) === y ? "cur" : ""}"><td class="l">${sname(x[0])}${part(x[0])}</td><td>${x[1].toLocaleString("en-US")}</td><td>${x[2].toFixed(3)}</td><td>${x[3].toFixed(3)}</td>
      <td style="${shade(x[4], 15)}">${sqSg(x[4])}</td><td class="mute">${sqSg(x[5])} to ${sqSg(x[6])}</td><td style="${shade(x[7], 10)}"><b>${sqSg(x[7])}</b></td></tr>`).join("")}</tbody></table></div>`;

  // zone table for the selected season
  const zs = (S.zones || {})[y] || {}, diet = (S.diet || {})[y] || null, ord = M.diet_order;
  const zrows = ord.filter(z => zs[z]).map((z, i) => { const [zf, xfg, fg, zm] = zs[z], few = zf < 50;
    const share = diet ? diet[ord.indexOf(z)] : null;
    return `<tr><td class="l" title="${E(SQZ[z][1])}"><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:var(${SQZCOL[z]})"></i>${SQZ[z][0]}</td><td>${zf}</td><td>${share != null ? (100*share).toFixed(0) + "%" : "\u2013"}</td><td>${(100*xfg).toFixed(1)}</td><td>${(100*fg).toFixed(1)}</td>
      <td style="${few ? "" : shade(zm, 20)}" class="${few ? "na" : ""}"${few ? ` title="Under 50 shots: mostly luck"` : ""}>${sqSg(zm)}</td></tr>`; }).join("");
  const ztbl = zrows ? `<div class="tbl sqtbl"><table><thead><tr><th class="l">Zone</th><th>FGA</th><th>Share</th><th title="Expected FG% on his shots from this zone">Exp FG%</th><th>FG%</th><th title="Actual minus expected points per 100 shots in this zone, league = 0 for the zone">Making</th></tr></thead><tbody>${zrows}</tbody></table></div>
    <p class="note">Zone making is raw (not shrunk): a zone with 100 shots has an 80% range of about \u00b112 per 100. Grey = under 50 shots.</p>` : `<p class="empty">No zone split for ${sname(y)}.</p>`;

  // shot-diet strip, one row per season
  const dietRows = ys.filter(s => S.diet && S.diet[s]).map(s => { const a = S.diet[s], fg = rows[ys.indexOf(s)][1];
    return `<span class="lbl${s === y ? " cur" : ""}">${String(s).slice(2)}-${String(+s+1).slice(2)}</span><span class="st">${a.map((v, i) => v > 0 ? `<i style="width:${(100*v).toFixed(1)}%;background:var(${SQZCOL[ord[i]]})" title="${E(SQZ[ord[i]][0])}: ${(100*v).toFixed(0)}% of shots"></i>` : "").join("")}</span><span class="n">${fg}</span>`; }).join("");
  const dietLeg = `<div class="sqleg">${ord.map(z => `<span><i class="sw" style="background:var(${SQZCOL[z]})"></i>${SQZ[z][0]}</span>`).join("")}</div>`;

  const sel = `<label class="mute" style="font-size:14px">Season <select id="sqSeason">${ys.map(s => `<option value="${s}" ${s === y ? "selected" : ""}>${sname(s)}${part(s)}</option>`).join("")}</select></label>`;
  const nt = T.n_shots.toLocaleString("en-US"), ts = T.test_seasons.map(s => sname(s)).join(" and ");
  return `<section class="mod" id="m-shotq"><style>${SQCSS}</style>
  <div class="mhead"><h2>Shot-making<span class="new">new</span></h2>${sel}</div>
  <p class="lede"><b style="color:var(--ink)">Shot quality</b> is what an average NBA shooter would score on exactly the shots he took. A model reads where each shot came from, what kind it was (dunk, floater, step-back\u2026) and the game situation (shot clock, score, putback, transition), but not who took it. <b style="color:var(--ink)">Shot-making</b> is what he actually scored minus that, per 100 shots, with the league set to 0 each season. The test: on ${nt} shots from ${ts} that the model never saw, it called makes better than zone averages (log loss ${T.logloss_model.toFixed(3)} vs ${T.logloss_zone.toFixed(3)}; lower is better). Shot-making repeats from one season to the next at r ${P.shot_making_per100[0].toFixed(2)}, so it is a real skill, but one season is noisy. The <b style="color:var(--ink)">believable</b> number keeps FGA \u00f7 (FGA + ${K}) of it: at ${K} shots, half counts.</p>
  ${figs}
  <div class="cols"><div><h3>Making per 100 shots, by season</h3>${chart}<div style="margin-top:12px">${stbl}</div></div>
    <div><h3>By zone, ${sname(y)}${part(y)}</h3>${ztbl}<h3 style="margin-top:18px">Shot diet</h3><div class="sqdiet">${dietRows}</div>${dietLeg}
    <p class="note">Share of his field-goal attempts from each zone, oldest season at top; number = FGA.</p></div></div>
  <p class="note" style="margin-top:12px">${pq != null || pm != null ? `Percentiles ${popTxt}. ` : ""}${cur ? `${sname(y)} is in progress, so its range is wide and the believable value sits close to 0. ` : ""}The number is shot-making given the shot type: a big who takes tips and hooks is measured against other tips and hooks, so he can finish well overall and still read below zero (Gobert does). What this cannot see: how open the shot was. Play-by-play has no defender distance, so shot-making mixes touch with the space he creates or is given. Regular season, 2018-19 on. Model: gradient-boosted trees fit on ${sname(T.train_seasons[0])} to ${sname(T.train_seasons[T.train_seasons.length-1])}, then refit on all seasons.</p></section>`;
}

(window.WIRES = window.WIRES || []).push(function(){
  const s = document.querySelector("#sqSeason");
  if (s) s.onchange = () => { SEASON = s.value; const y = window.scrollY; render(); window.scrollTo(0, y); };
});

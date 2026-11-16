// Stat distributions (H3, 2026-11-16). Two parts:
// 1. Stat chips on "Where his rating comes from": mods/breakdown.js calls sdRowChips / sdControl / sdStrip when they exist.
//    Beside each step, the player's Basketball-Reference stat behind it and his percentile; a control switches the season
//    (2026-27 to date / 2025-26) and the percentile pool (all qualified players / his position / his role by minutes).
// 2. Stat pages, route #s-<stat>-<season start year>[-p<player id>] (e.g. #s-oreb_pct-2026-p1642270 = 2026-27 OREB%,
//    Clingan marked): definition, histogram + kernel density (+ a fitted curve when the stat file carries "fit"),
//    position filter, the marked player's value and percentiles, top 20 / bottom 10, season switch.
// Data: d.sdist + META.sdist_meta (mod_sdist.json via pp_data.py) and stats/<stat>-<year>.json (fetched per page), both
// from scripts/pp_statdist.py. Routing: route() sends every hash that is not #p- or #fantasy to renderFront(); this file
// wraps it (after history.js's wrapper) to catch #s-.
const SDS = { f: {}, pool: "all", seas: null, posf: "all", cur: null, ids: null };
const SD_POS = {G: "Guards", F: "Forwards", C: "Centers"};
const SD_COL = {G: "var(--forest)", F: "var(--ochre)", C: "var(--purple)"};
const SD_ROLE = {st: "Starter minutes", rot: "Rotation", bn: "Bench"};
const SDCSS = `
.bdst{display:flex;flex-wrap:wrap;gap:4px 6px;margin:1px 0 7px 140px}
@media (max-width:420px){.bdst{margin-left:6px}}
.sdstrip{margin-left:0}
.sdc{display:inline-flex;align-items:baseline;gap:5px;font-size:12px;line-height:1.25;padding:2px 3px 2px 8px;border:1px solid var(--line);border-radius:999px;color:var(--ink);text-decoration:none;background:var(--panel);white-space:nowrap}
.sdc:hover{border-color:var(--mute)}
.sdc .sdk{color:var(--mute)}
.sdc b{font:500 12px var(--mono);font-variant-numeric:tabular-nums}
.sdc .sdp{font:500 11px var(--mono);padding:1px 6px;border-radius:999px;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px}
.sdc.ss{border-style:dashed}
.sdc.ss b{font-style:italic}
.sdc .sdy{font-size:10.5px;color:var(--mute)}
.sdctl{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:8px 0 2px;font-size:13px;color:var(--mute)}
.sdnote{margin:4px 0 10px}
.sdh{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:16px 0 6px}
.sdnav{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-top:14px;font-size:14px;color:var(--mute)}
.sdsw{display:inline-flex;gap:4px;flex-wrap:wrap}
.sdsw a,.sdsw span{font:13px var(--sans);padding:5px 10px;border:1px solid var(--line);border-radius:999px;color:var(--ink);text-decoration:none;background:var(--panel)}
.sdsw a[aria-current="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.sdsw span{color:var(--mute);border-style:dashed}
.sdlk{color:var(--cold)}
.sddef{max-width:74ch;font-size:15px;margin:14px 0 0}
.sdkey{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin:8px 0 4px}
.sdkey i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.sdkey s{display:inline-block;width:16px;height:0;border-top:2px solid var(--ink);margin-right:4px;vertical-align:3px}
.sdchart{display:block;max-width:100%;height:auto;margin-top:4px}
.sdchart .mk{fill:var(--ink);font:600 12px var(--sans)}
.sdtbls{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px 28px;margin-top:6px}
@media (max-width:760px){.sdtbls{grid-template-columns:minmax(0,1fr)}}
.sdtbls h3{margin:0 0 6px}
.sdtbls td.l{font-family:var(--sans)}
.sdtbls td.l a{color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}
.sdtbls tr.gap td{text-align:center;color:var(--mute)}
@media (max-width:480px){.sdtbls .tm{display:none}.sdtbls th,.sdtbls td{padding:6px 5px}}
.fig .v .of{font-size:15px;color:var(--mute)}
`;

function sdMeta(){ return (typeof META !== "undefined" && META && META.sdist_meta) || null; }
function sdVal(k, v){
  if (v == null || !isFinite(v)) return "\u2013";
  if (k === "height") { const i = Math.round(v); return `${Math.floor(i / 12)}\u2032${i % 12}\u2033`; }
  if (k === "rim_det") return (v > 0.005 ? "+" : v < -0.005 ? "\u2212" : "") + Math.abs(v).toFixed(2);
  return v.toFixed(1);
}
function sdOrd(p){
  if (p == null || !isFinite(p)) return "\u2013";
  const n = Math.round(p), t = n % 100;
  return n + (t >= 11 && t <= 13 ? "th" : ({1: "st", 2: "nd", 3: "rd"}[n % 10] || "th"));
}
function sdYear(d){
  const S = (d && d.sdist) || {};
  if (SDS.seas && S[SDS.seas]) return SDS.seas;
  return S["2026"] ? "2026" : S["2025"] ? "2025" : null;
}
function sdPoolName(M, rec, y, pool){
  if (pool === "pos") return rec.pos ? (M.posnames || {})[rec.pos] || "his position" : "his position";
  if (pool === "role") return ((M.roles || {}).names || {})[rec.role] || "his role";
  return `all ${((M.seasons || {})[y] || {}).n || ""} qualified players`;
}

/* ---------- 1. chips on the breakdown ---------- */
// one chip: stat, value, percentile; season y (falls back to the other season when that stat has none, e.g. rim deterrence)
function sdChip(d, k, y0){
  const M = sdMeta(), S = (d && d.sdist) || {};
  if (!M || !M.stats[k]) return "";
  let y = String(y0), rec = S[y], v = rec && rec.s && rec.s[k], tag = "";
  if (!v) {
    const alt = Object.keys(S).filter(s => s !== y && S[s].s && S[s].s[k]).sort().pop();
    if (!alt) return "";
    y = alt; rec = S[y]; v = rec.s[k]; tag = ` <span class="sdy">${sname(+y)}</span>`;
  }
  const st = M.stats[k], pool = SDS.pool === "pos" && !rec.pos ? "all" : SDS.pool;
  const p = v[{all: 1, pos: 2, role: 3}[pool] || 1];
  const ss = rec.ss === 1, est = ss && st[4] === 1;
  const val = (est ? "~" : "") + sdVal(k, v[0]);
  const thr = ((M.seasons || {})[y] || {}).thr;
  const title = `${st[1]}, ${sname(+y)}: ${sdVal(k, v[0])}. ` + (p != null ? `${sdOrd(p)} percentile among ${sdPoolName(M, rec, y, pool)}` : "No percentile (pool too small)")
    + (st[3] ? " (lower is better, so a high percentile means a low value)" : "") + "."
    + (ss ? ` Small sample: ${rec.mp} minutes, under the ${thr}-minute bar${est ? `; his raw number is ${sdVal(k, v[4])}, pulled toward the average for his position` : ""}.` : "")
    + " Click for the league distribution.";
  const bg = p != null && typeof pcol === "function" ? ` style="background:color-mix(in srgb,${pcol(p)} 30%,transparent)"` : "";
  return `<a class="sdc${ss ? " ss" : ""}" href="#s-${k}-${y}-p${d.id}" title="${E(title)}"><span class="sdk">${E(st[0])}</span> <b>${val}</b>${tag} <span class="sdp"${bg}>${sdOrd(p)}</span></a>`;
}
function sdRowInner(d, row, side){
  const M = sdMeta(), y = sdYear(d);
  if (!M || !y) return "";
  const ks = ((M.rows || {})[row] || {})[side] || [];
  return ks.map(k => sdChip(d, k, y)).join("");
}
function sdRowChips(d, row, side){
  const inner = d && d.sdist ? sdRowInner(d, row, side) : "";
  return inner ? `<div class="bdst" data-sdrow="${E(row)}|${E(side)}">${inner}</div>` : "";
}
function sdStripInner(d){
  const M = sdMeta(), y = sdYear(d);
  if (!M || !y) return "";
  return Object.keys(M.stats).map(k => sdChip(d, k, y)).join("");
}
// for players without stat steps (rookies, returners, no rating): every stat as a strip of chips
function sdStrip(d){
  const inner = d && d.sdist ? sdStripInner(d) : "";
  return inner ? `<h3 class="sdh">His stats and where they rank</h3><div class="bdst sdstrip" data-sdstrip>${inner}</div>` : "";
}
function sdControlInner(d, strip){
  const M = sdMeta(), y = sdYear(d);
  if (!M || !y) return "";
  const rec = d.sdist[y], ys = ["2026", "2025"].filter(s => d.sdist[s]);
  const btn = (attr, val, lab, on) => `<button type="button" data-${attr}="${val}" aria-pressed="${on}">${E(lab)}</button>`;
  const seas = ys.map(s => btn("sdseas", s, sname(+s) + (s === "2026" ? " so far" : ""), s === y)).join("");
  const pool = SDS.pool === "pos" && !rec.pos ? "all" : SDS.pool;
  const pools = btn("sdpool", "all", "All players", pool === "all") + (rec.pos ? btn("sdpool", "pos", SD_POS[rec.pos] || rec.pos, pool === "pos") : "")
    + btn("sdpool", "role", SD_ROLE[rec.role] || "His role", pool === "role");
  const Ms = (M.seasons || {})[y] || {};
  const bars = !strip && d.sipmbd && d.sipmbd.v === "sipm" ? " The bars use his 2025-26 stats adjusted for opponents, so a chip and its bar can disagree." : "";
  const ss = rec.ss === 1 ? ` <b style="color:var(--ink)">Small sample:</b> his ${rec.mp} minutes in ${sname(+y)} are under the ${Ms.thr}-minute bar, so he is not in the pool and each rate shown with ~ is an estimate pulled toward the average for ${E((M.posnames || {})[rec.pos] || "his position")}.` : "";
  return `<div class="sdctl"><span>Stat chips</span><span class="seg" role="group" aria-label="Season for the stat chips">${seas}</span><span>percentile among</span><span class="seg" role="group" aria-label="Percentile among">${pools}</span></div>
  <p class="note sdnote">${strip ? "Each chip" : "Beside each step"}: his stat and his percentile among ${E(sdPoolName(M, rec, y, pool))} (${Ms.thr}+ minutes). Higher = more of it, or better for turnovers, fouls and rim deterrence. Tap a chip for the whole league.${bars}${ss}</p>`;
}
function sdControl(d, strip){
  const inner = d && d.sdist && sdMeta() ? sdControlInner(d, strip) : "";
  return inner ? `<style>${SDCSS}</style><div data-sdctl="${strip ? 1 : 0}">${inner}</div>` : "";
}
function sdRefresh(){
  const sec = document.querySelector("#m-sipmbd");
  if (!sec || typeof CUR === "undefined" || !CUR) return;
  sec.querySelectorAll("[data-sdrow]").forEach(el => { const [r, s] = el.dataset.sdrow.split("|"); el.innerHTML = sdRowInner(CUR, r, s); });
  sec.querySelectorAll("[data-sdstrip]").forEach(el => { el.innerHTML = sdStripInner(CUR); });
  sec.querySelectorAll("[data-sdctl]").forEach(el => { el.innerHTML = sdControlInner(CUR, el.dataset.sdctl === "1"); });
}

/* ---------- 2. stat pages ---------- */
function sdGet(fn){
  if (!SDS.f[fn]) SDS.f[fn] = fetch(`stats/${fn}`).then(r => { if (r.ok === false) throw new Error(`${r.status} stats/${fn}`); return r.json(); })
    .catch(e => { delete SDS.f[fn]; throw e; });
  return SDS.f[fn];
}
function sdHash(k, y, pid){ return `#s-${k}-${y}${pid != null ? `-p${pid}` : ""}`; }
function sdRoute(){
  const h = (typeof location !== "undefined" && location.hash) || "";
  const m = /^#s-([a-z0-9_]+)-(\d{4})(?:-p(\d+))?$/.exec(h);
  if (!m) return false;
  sdPage(m[1], +m[2], m[3] ? +m[3] : null);
  return true;
}
function sdIsCur(pid){
  if (!SDS.ids && typeof META !== "undefined" && META && META.players) SDS.ids = new Set(META.players.map(p => p.id));
  return !!(SDS.ids && SDS.ids.has(pid));
}
function sdNice(x){ if (!(x > 0)) return 1; const e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }
function sdQ(s, q){ if (!s.length) return NaN; const i = (s.length - 1) * q, a = Math.floor(i), b = Math.ceil(i); return s[a] + (s[b] - s[a]) * (i - a); }
// the marked player as one record: in the pool (rows) or a small sample (ss)
function sdFind(D, pid){
  if (pid == null) return null;
  const r = D.rows.find(x => x[0] === pid);
  if (r) return {pid, name: r[1], team: r[2], pos: r[3], role: r[4], g: r[5], mp: r[6], v: r[7], pa: r[8], pp: r[9], pr: r[10], rank: r[11], ss: false};
  const s = (D.ss || []).find(x => x[0] === pid);
  if (s) return {pid, name: s[1], team: s[2], pos: s[3], role: s[4], g: s[5], mp: s[6], raw: s[7], v: s[8], pa: s[9], pp: s[10], pr: s[11], rank: null, ss: true};
  return null;
}
function sdChart(k, D, H, posf, W){
  const M = sdMeta(), st = M.stats[k], hgt = k === "height";
  const allv = D.rows.map(r => r[7]).filter(v => v != null && isFinite(v));
  const R = D.rows.filter(r => r[7] != null && isFinite(r[7]) && (posf === "all" || r[3] === posf));
  const vals = R.map(r => r[7]);
  let lo = Math.min(...allv), hi = Math.max(...allv);
  if (H && H.v != null && isFinite(H.v)) { lo = Math.min(lo, H.v); hi = Math.max(hi, H.v); }
  const bw = hgt ? 1 : sdNice((hi - lo) / 26 || 1);
  const b0 = hgt ? Math.floor(lo) - 0.5 : Math.floor(lo / bw) * bw;
  const nb = Math.max(1, Math.floor((hi - b0) / bw + 1e-9) + 1);   // last bin holds the maximum
  const x1 = b0 + nb * bw;
  const keys = ["G", "F", "C", "?"], cnt = Array.from({length: nb}, () => ({G: 0, F: 0, C: 0, "?": 0}));
  for (const r of R) { const i = Math.min(nb - 1, Math.max(0, Math.floor((r[7] - b0) / bw + 1e-9))); cnt[i][keys.includes(r[3]) ? r[3] : "?"]++; }
  const tot = cnt.map(c => c.G + c.F + c.C + c["?"]);
  // kernel density (Gaussian, Silverman bandwidth, at least 0.6 bin), reflected at 0 for stats that cannot go below 0
  const n = vals.length, s = vals.slice().sort((a, b) => a - b), mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const iqr = sdQ(s, 0.75) - sdQ(s, 0.25), spread = Math.min(sd, iqr > 0 ? iqr / 1.34 : sd) || sd || bw;
  const h = Math.max(0.9 * spread * Math.pow(Math.max(n, 1), -0.2), 0.6 * bw);
  const refl = k !== "rim_det" && allv.every(v => v >= 0), xs0 = refl ? Math.max(0, b0) : b0;
  const phi = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const kde = [];
  for (let i = 0; i <= 160 && n > 1; i++) {
    const x = xs0 + (x1 - xs0) * i / 160;
    let f = 0; for (const v of vals) { f += phi((x - v) / h); if (refl) f += phi((x + v) / h); }
    kde.push([x, f / (n * h) * n * bw]);
  }
  let fit = null;
  if (posf === "all" && D.fit && D.fit.x && D.fit.pdf) fit = D.fit.x.map((x, i) => [x, D.fit.pdf[i] * allv.length * bw]).filter(p => p[0] >= b0 && p[0] <= x1 && isFinite(p[1]));
  const ymax = Math.max(1, ...tot, ...kde.map(p => p[1]), ...(fit || []).map(p => p[1])) * 1.08;
  const Hh = W < 520 ? 230 : 270, ml = 34, mr = 12, mt = 30, mb = 38, pw = W - ml - mr, ph = Hh - mt - mb;
  const X = v => ml + pw * (v - b0) / (x1 - b0), Y = c => mt + ph * (1 - c / ymax);
  let g = "";
  const ys = sdNice(ymax / 4);
  for (let c = ys; c < ymax; c += ys) g += `<line x1="${ml}" x2="${W - mr}" y1="${Y(c).toFixed(1)}" y2="${Y(c).toFixed(1)}" stroke="var(--grid)"/><text x="${ml - 5}" y="${(Y(c) + 4).toFixed(1)}" text-anchor="end">${Math.round(c)}</text>`;
  const cols = posf === "all" ? keys : [posf];
  cnt.forEach((c, i) => {
    let base = 0;
    const x = X(b0 + i * bw) + 0.5, w = Math.max(0.5, pw * bw / (x1 - b0) - 1);
    const lab = `${sdVal(k, b0 + i * bw)} to ${sdVal(k, b0 + (i + 1) * bw)}: ${tot[i]} player${tot[i] === 1 ? "" : "s"}` + (posf === "all" ? ` (${c.G} G, ${c.F} F, ${c.C} C${c["?"] ? `, ${c["?"]} other` : ""})` : "");
    let rects = "";
    for (const p of cols) {
      if (!c[p]) continue;
      rects += `<rect x="${x.toFixed(1)}" y="${Y(base + c[p]).toFixed(1)}" width="${w.toFixed(1)}" height="${(Y(base) - Y(base + c[p])).toFixed(1)}" fill="${SD_COL[p] || "var(--mid)"}" opacity=".78"/>`;
      base += c[p];
    }
    if (rects) g += `<g><title>${E(lab)}</title>${rects}</g>`;
  });
  const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  if (kde.length) g += `<path d="${path(kde)}" fill="none" stroke="var(--ink)" stroke-width="1.8"/>`;
  if (fit && fit.length > 1) g += `<path d="${path(fit)}" fill="none" stroke="var(--hot)" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  // x axis
  const xs = hgt ? 2 : sdNice((x1 - b0) / (W < 520 ? 4 : 7));
  g += `<line x1="${ml}" x2="${W - mr}" y1="${mt + ph}" y2="${mt + ph}" stroke="var(--line)"/>`;
  for (let t = Math.ceil(b0 / xs) * xs; t <= x1 + 1e-9; t += xs) {
    const tx = hgt ? sdVal(k, t) : k === "rim_det" ? sdVal(k, t) : String(+t.toFixed(3));
    g += `<line x1="${X(t).toFixed(1)}" x2="${X(t).toFixed(1)}" y1="${mt + ph}" y2="${mt + ph + 4}" stroke="var(--line)"/><text x="${X(t).toFixed(1)}" y="${mt + ph + 16}" text-anchor="middle">${tx}</text>`;
  }
  g += `<text x="${ml + pw / 2}" y="${Hh - 4}" text-anchor="middle">${E(st[0])}${st[3] ? " (lower is better)" : ""}</text><text x="4" y="${mt - 14}">players</text>`;
  if (H && H.v != null && isFinite(H.v)) {
    const hx = X(H.v), last = String(H.name || "").split(" ").slice(-1)[0], lab = `${last} ${sdVal(k, H.v)}${H.ss ? " (small sample)" : ""}`;
    const right = hx > W - 150;
    g += `<line x1="${hx.toFixed(1)}" x2="${hx.toFixed(1)}" y1="${mt - 6}" y2="${mt + ph}" stroke="var(--ink)" stroke-width="2"${H.ss ? ' stroke-dasharray="4 3"' : ""}/>`
      + `<text class="mk" x="${(right ? hx - 5 : hx + 5).toFixed(1)}" y="${mt - 2}" text-anchor="${right ? "end" : "start"}">${E(lab)}</text>`;
  }
  return `<svg class="chart sdchart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${E(`Histogram of ${st[1]} for ${R.length} qualified players`)}">${g}</svg>`;
}
function sdShape(k, D, posf){
  const R = D.rows.filter(r => r[7] != null && (posf === "all" || r[3] === posf)), v = R.map(r => r[7]).sort((a, b) => a - b), n = v.length;
  if (n < 5) return "";
  const mean = v.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const sk = sd > 0 ? v.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) / n : 0;
  const shape = Math.abs(sk) < 0.3 ? "roughly symmetric: a bell shape around the middle"
    : sk > 0 ? `skewed right (skewness ${sk.toFixed(1)}): most players bunch on the low side and a tail of high values stretches out`
    : `skewed left (skewness ${sk.toFixed(1)}): most players bunch on the high side and a tail of low values stretches out`;
  let pos = "";
  if (posf === "all") {
    const med = p => { const s = D.rows.filter(r => r[3] === p && r[7] != null).map(r => r[7]).sort((a, b) => a - b); return s.length ? sdVal(k, sdQ(s, 0.5)) : null; };
    const parts = ["G", "F", "C"].map(p => [p, med(p)]).filter(x => x[1] != null).map(([p, m]) => `${SD_POS[p].toLowerCase()} ${m}`);
    if (parts.length) pos = ` Medians by position: ${parts.join(", ")}.`;
  }
  return `<p class="note">Median ${sdVal(k, sdQ(v, 0.5))}; the middle half of these ${n} players sit between ${sdVal(k, sdQ(v, 0.25))} and ${sdVal(k, sdQ(v, 0.75))}. The shape is ${shape}.${pos}</p>`;
}
function sdTables(k, D, H, posf){
  const M = sdMeta(), st = M.stats[k], lower = st[3] === 1, pi = posf === "all" ? 8 : 9;
  const R = D.rows.filter(r => posf === "all" || r[3] === posf);
  const nameCell = r => sdIsCur(r[0]) ? `<a href="#p-${r[0]}">${E(r[1])}</a>` : E(r[1]);
  const tr = (r, i) => `<tr${H && r[0] === H.pid ? ' class="cur"' : ""}><td>${i}</td><td class="l">${nameCell(r)}</td><td class="l tm">${E(r[2] || "")}</td>${posf === "all" ? `<td class="l">${E(r[3] || "\u2013")}</td>` : ""}<td>${r[6]}</td><td><b>${sdVal(k, r[7])}</b></td><td>${sdOrd(r[pi])}</td></tr>`;
  const head = `<tr><th>#</th><th class="l">Player</th><th class="l tm">Team</th>${posf === "all" ? '<th class="l">Pos</th>' : ""}<th title="Minutes">Min</th><th>${E(st[0])}</th><th title="Percentile among ${posf === "all" ? "all qualified players" : SD_POS[posf].toLowerCase()}">Pctl</th></tr>`;
  const ncol = posf === "all" ? 7 : 6, nt = Math.min(20, R.length);
  let top = R.slice(0, nt).map((r, i) => tr(r, i + 1)).join("");
  const j = H && !H.ss ? R.findIndex(r => r[0] === H.pid) : -1;
  if (j >= nt && j < R.length - 10) top += `<tr class="gap"><td colspan="${ncol}">\u2026</td></tr>` + tr(R[j], j + 1);
  const bs = Math.max(nt, R.length - 10), bot = R.slice(bs).map((r, i) => tr(r, bs + i + 1)).join("");
  const grp = posf === "all" ? "" : ` ${SD_POS[posf].toLowerCase()}`;
  const t1 = lower ? `Best 20${grp} (lowest)` : `Top 20${grp}`, t2 = lower ? `Worst 10${grp} (highest)` : `Bottom 10${grp}`;
  return `<div class="sdtbls"><div><h3>${t1}</h3><div class="tbl"><table><thead>${head}</thead><tbody>${top}</tbody></table></div></div>`
    + (bot ? `<div><h3>${t2}</h3><div class="tbl"><table><thead>${head}</thead><tbody>${bot}</tbody></table></div></div>` : "") + `</div>`;
}
function sdDistHTML(k, D, H, posf, W){
  const M = sdMeta(), st = M.stats[k];
  const cnt = p => D.rows.filter(r => r[3] === p).length;
  const fb = (v, lab) => `<button type="button" data-sdpf="${v}" aria-pressed="${posf === v}">${E(lab)}</button>`;
  const filt = fb("all", `All (${D.rows.length})`) + ["G", "F", "C"].map(p => fb(p, `${SD_POS[p]} (${cnt(p)})`)).join("");
  const key = (posf === "all" ? ["G", "F", "C"] : [posf]).map(p => `<span><i style="background:${SD_COL[p]}"></i>${SD_POS[p]}</span>`).join("")
    + `<span><s></s>smoothed shape (kernel density)</span>`
    + (posf === "all" && D.fit && D.fit.x ? `<span><s style="border-top:2px dashed var(--hot)"></s>${E(D.fit.label)} fit</span>` : "")
    + (H && H.v != null ? `<span><s style="width:2px;height:12px;border:0;background:var(--ink);vertical-align:-1px"></s>${E(H.name)}</span>` : "");
  return `<div class="sdctl"><span>Show</span><span class="seg" role="group" aria-label="Position">${filt}</span></div>
    <div class="sdkey">${key}</div>${sdChart(k, D, H, posf, W)}${sdShape(k, D, posf)}
    <h3 class="sdh">Leaders${posf === "all" ? "" : `: ${SD_POS[posf].toLowerCase()}`}</h3>${sdTables(k, D, H, posf)}`;
}
// the whole page (pure: no fetch, no DOM), for the browser and the offline test
function sdPageHTML(k, y, pid, D, W){
  const M = sdMeta(), st = M.stats[k], Ms = (M.seasons || {})[String(y)] || {};
  const H = sdFind(D, pid), lower = st[3] === 1;
  const pmeta = pid != null && typeof META !== "undefined" ? (META.players || []).find(p => p.id === pid) : null;
  const pname = H ? H.name : pmeta ? pmeta.name : null;
  const back = pid != null && sdIsCur(pid) ? `<a class="sdlk" href="#p-${pid}">\u2190 ${E(pname || "player")}'s page</a> \u00b7 ` : "";
  const seasons = ["2026", "2025"].map(s => {
    const lab = sname(+s) + (s === "2026" ? " so far" : "");
    return M.files.includes(`${k}-${s}.json`) ? `<a href="${sdHash(k, s, pid)}" aria-current="${String(y) === s}">${lab}</a>` : `<span title="Not built for this season yet">${lab}</span>`;
  }).join("");
  const opts = Object.keys(M.stats).map(s => `<option value="${s}"${s === k ? " selected" : ""}>${E(M.stats[s][1])} (${E(M.stats[s][0])})</option>`).join("");
  let figs;
  const pn = p => (M.posnames || {})[p] || "his position", rn = r => ((M.roles || {}).names || {})[r] || "his role";
  if (H) {
    const ssNote = H.ss ? `Small sample: ${H.mp} minutes, under the ${D.thr}-minute bar, so he is not in the pool.${H.raw != null && st[4] ? ` His raw number is ${sdVal(k, H.raw)}; the ${sdVal(k, H.v)} shown is pulled toward the average for ${pn(H.pos)}.` : ""}` : `${H.g} games, ${H.mp} minutes`;
    figs = `<div class="fig big"><div class="k">${E(H.name)} \u00b7 ${E(H.team || "")}${H.pos ? ` \u00b7 ${E(H.pos)}` : ""}</div><div class="v">${H.ss && st[4] ? "~" : ""}${sdVal(k, H.v)}</div><div class="s">${E(ssNote)}</div></div>
      <div class="fig"><div class="k">Percentile, all players</div><div class="v">${sdOrd(H.pa)}</div><div class="s">${H.rank ? `rank ${H.rank} of ${D.n}` : `placed against the ${D.n} qualified players`}${lower ? "; lower is better, so a high percentile means a low number" : ""}</div></div>
      <div class="fig"><div class="k">Among ${E(pn(H.pos))}</div><div class="v">${sdOrd(H.pp)}</div><div class="s">${D.rows.filter(r => r[3] === H.pos).length} qualified ${E(pn(H.pos))}</div></div>
      <div class="fig"><div class="k">Among ${E(rn(H.role).split(" (")[0])}</div><div class="v">${sdOrd(H.pr)}</div><div class="s">${E(rn(H.role))}: ${D.rows.filter(r => r[4] === H.role).length} qualified</div></div>`;
  } else {
    const s = D.rows.map(r => r[7]).filter(v => v != null).sort((a, b) => a - b), best = D.rows[0];
    figs = `<div class="fig big"><div class="k">League median</div><div class="v">${sdVal(k, sdQ(s, 0.5))}</div><div class="s">among ${D.n} qualified players</div></div>
      <div class="fig"><div class="k">Middle half</div><div class="v">${sdVal(k, sdQ(s, 0.25))}<span class="of"> to </span>${sdVal(k, sdQ(s, 0.75))}</div><div class="s">25th to 75th percentile</div></div>
      ${best ? `<div class="fig"><div class="k">${lower ? "Best (lowest)" : "Highest"}</div><div class="v">${sdVal(k, best[7])}</div><div class="s">${E(best[1])}</div></div>` : ""}
      ${pid != null ? `<div class="fig"><div class="k">${E(pname || `Player ${pid}`)}</div><div class="v">\u2013</div><div class="s">no ${sname(y)} games yet</div></div>` : ""}`;
  }
  const fitNote = D.fit ? ` The dashed red curve is the ${E(D.fit.label)} family fitted by the distribution study (all players).` : "";
  return `<style>${SDCSS}</style>
  <header class="hero">
    <div>
      <div class="brand" style="color:var(--mute)">${back}League distribution</div>
      <h1>${E(st[1])} <span class="mute" style="font-size:.55em;white-space:nowrap">${E(st[0])}</span></h1>
      <div class="meta"><span><b>${sname(y)}</b>${String(y) === "2026" ? ` to date (games through ${E(M.data_through || "")})` : " regular season"}</span><span><b>${D.n}</b> qualified players (at least ${D.thr} minutes)</span></div>
      <div class="sdnav"><span class="sdsw">${seasons}</span><label>Stat <select id="sdStat" aria-label="Stat">${opts}</select></label></div>
      <p class="sddef">${E(st[5])} <span class="mute" style="font-size:13px">Formula: ${E(st[6])}.</span></p>
    </div>
    <div class="figs">${figs}</div>
  </header>
  <section class="mod" id="sd-dist"><div class="mhead"><h2>How the league is spread</h2><span class="note">hover a bar for its count; click a name for his page</span></div>
    <div id="sd-dist-body">${sdDistHTML(k, D, H, SDS.posf, W)}</div>
    <p class="note">Qualified = at least ${D.thr} minutes (500 over a full 82-game season, scaled to the ${Ms.maxg || ""} games played so far by the busiest player). ${(D.ss || []).length} players under that bar are left out; on their own pages their rates are estimates pulled toward their position's average and marked small sample.${fitNote} Positions: guard / forward / center from the first word of his listed position. Roles by minutes per game: starter minutes 26+, rotation 18-26, bench under 18.</p>
  </section>
  <section class="mod" id="sd-more" style="display:none"><div class="mhead"><h2>${E(pname || "")}: his other stats</h2></div><div class="bdst sdstrip" id="sd-more-chips"></div></section>
  <footer>Stats: NBA box scores, Basketball-Reference formulas${k === "rim_det" ? "; rim deterrence from Singular's lineup model" : ""}. Built ${E(M.built || "")}.</footer>`;
}
function sdWidth(){
  const app = typeof document !== "undefined" && document.querySelector ? document.querySelector("#app") : null;
  const w = app && app.clientWidth ? app.clientWidth - 32 : 0;
  return Math.round(Math.max(300, Math.min(1000, w || 720)));
}
async function sdPage(k, y, pid){
  CUR = null;
  const M = sdMeta(), h = location.hash;
  if (!M) { $("#app").innerHTML = `<p class="empty">Loading\u2026</p>`; return; }
  if (!M.stats[k]) { $("#app").innerHTML = `<p class="empty">No stat called \u201c${E(k)}\u201d. Try <a class="sdlk" href="${sdHash("oreb_pct", 2026, pid)}">offensive rebound percentage</a>.</p>`; return; }
  const fn = `${k}-${y}.json`;
  if (!M.files.includes(fn)) {
    const alt = ["2026", "2025"].find(s => M.files.includes(`${k}-${s}.json`));
    $("#app").innerHTML = `<style>${SDCSS}</style><p class="empty">${E(M.stats[k][1])} is not built for ${sname(y)}${k === "rim_det" ? " yet: Singular computes rim deterrence for 2026-27 once enough lineup data exists" : ""}.${alt ? ` <a class="sdlk" href="${sdHash(k, alt, pid)}">See ${sname(+alt)}</a>.` : ""}</p>`;
    return;
  }
  $("#app").innerHTML = `<p class="empty">Loading ${E(M.stats[k][1])}, ${sname(y)}\u2026</p>`;
  let D;
  try { D = await sdGet(fn); } catch (e) { $("#app").innerHTML = `<p class="empty">Could not load ${E(fn)} (${E(e.message)}).</p>`; return; }
  if (location.hash !== h) return;   // the reader has moved on
  if (SDS.cur && (SDS.cur.k !== k)) SDS.posf = "all";
  SDS.cur = {k, y, pid, D};
  $("#app").innerHTML = sdPageHTML(k, y, pid, D, sdWidth());
  const sel = document.querySelector("#sdStat");
  if (sel) sel.onchange = () => { const s = sel.value, yy = M.files.includes(`${s}-${y}.json`) ? y : 2025; location.hash = sdHash(s, yy, pid); };
  if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
  // his other stats (current players: from his page data)
  if (pid != null && sdIsCur(pid) && typeof shard === "function") {
    try {
      const d = await shard(pid);
      if (location.hash !== h || !d || !d.sdist) return;
      const chips = Object.keys(M.stats).filter(s => s !== k).map(s => sdChip(d, s, d.sdist[String(y)] ? y : sdYear(d))).join("");
      const box = document.querySelector("#sd-more"), cc = document.querySelector("#sd-more-chips");
      if (chips && box && cc) { cc.innerHTML = chips; box.style.display = ""; }
    } catch (e) { /* his chips are optional */ }
  }
}
function sdRedraw(){
  const c = SDS.cur, el = document.querySelector("#sd-dist-body");
  if (!c || !el || location.hash.indexOf("#s-") !== 0) return;
  el.innerHTML = sdDistHTML(c.k, c.D, sdFind(c.D, c.pid), SDS.posf, sdWidth());
}

(function(){
  if (typeof window === "undefined" || window.__sdRF) return;
  const rf = typeof renderFront === "function" ? (window.renderFront || renderFront) : null;
  window.__sdRF = rf || true;
  window.renderFront = function(){ if (sdRoute()) return; if (rf) return rf.apply(this, arguments);
    if (typeof META !== "undefined" && META && typeof show === "function") show(META.players[0].id); };
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", e => {
      const b = e.target && e.target.closest ? e.target.closest("[data-sdseas],[data-sdpool],[data-sdpf]") : null;
      if (!b) return;
      if (b.dataset.sdseas) { SDS.seas = b.dataset.sdseas; sdRefresh(); }
      else if (b.dataset.sdpool) { SDS.pool = b.dataset.sdpool; sdRefresh(); }
      else if (b.dataset.sdpf) { SDS.posf = b.dataset.sdpf; sdRedraw(); }
    });
    let t = null;
    if (window.addEventListener) window.addEventListener("resize", () => { if (t) cancelAnimationFrame(t); t = requestAnimationFrame(sdRedraw); });
  }
})();

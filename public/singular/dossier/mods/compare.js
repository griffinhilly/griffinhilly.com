// Impact by age, with comparison players, drawn DARKO-style: each player is a cloud of faint dots (about ten games each, within
// one season) with his smoothed trajectory through it. Data: d.cmp {sug, ghost, tier, posg} and META.cmp_meta (scripts/pp_compare.py);
// careers.json (every rated hub player: id, name, pos, decimal birth year, season rows [age, r, min, season]) is fetched once;
// traj/tNN.json (scripts/pp_traj.py, player id % 64) is fetched per shard when a player is drawn: l = smoothed trajectory
// [season, age, mean, sd] (ls "d" = item D's career-path model, "m" = simple minutes-weighted average), f = form dots
// [age, rating, minutes, games], po = playoff series [age, rating, minutes, games, season, opponent, round, W, L, minutes estimated],
// sug / tier = similar careers for retired players. TRAJ 2026-11-16: also drawn on retired pages (mods/history.js calls
// modCompare with a retired player, d.retired = true; CMPD = the player being drawn, CUR stays null there).
// TRAJ2 2026-11-16 (Griffin: "one dot per season" is not the line he wants): LINE_MODE "dots" = every player's bold line is the
// minutes-weighted smoother through his ~10-game dots (cmpTrend, the line drawn before TRAJ: bandwidth 0.45 years, no per-season
// markers, no band); a rated season with no game dots joins the smoother as one point at that season's age, weighted by its
// minutes (cmpFill). "d_season" = TRAJ's season-level line from item D's model with its 80% band (traj l / ls; kept, off).
const LINE_MODE = "dots";
let CMPX = "age", CMPGHOST = false, CMPCAR = null, CMPLOAD = null, CMPW = 0, CMPD = null;
const CMPST = {};  // player id -> {on: [ids shown], extra: [ids added by search]}
const CMPTJ = {};  // traj shard number -> object, or "loading"
const CMPTR = {};  // player id -> simple smoothed trend through his dots (cache; players without a trajectory line)
const CMPPAL = ["--cold", "--purple", "--forest", "--ochre", "--hot"];
const CMPCSS = `
#m-cmp{--po:#0b7d84}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #m-cmp{--po:#45b9bf}}
:root[data-theme="dark"] #m-cmp{--po:#45b9bf}
.cmpctl{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin:4px 0 8px}
.cmpchips{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.cmpchips .lbl{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-right:2px}
.cmpchips button{font:13px var(--sans);padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.cmpchips button:hover{border-color:var(--mute)}
.cmpchips button[aria-pressed="false"]{color:var(--mute)}
.cmpchips button i{width:14px;height:3px;border-radius:2px;display:inline-block;background:var(--line)}
.cmpchips.more button{font-size:12px;padding:3px 8px}
#cmpAdd{font:14px var(--sans);padding:5px 10px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);width:200px;max-width:100%}
.cmpleg{display:flex;gap:6px 16px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--mute);margin:6px 0 4px}
.cmpleg svg{vertical-align:middle;margin-right:4px}
.cmptbl{margin-top:10px}
.cmptbl td a{color:var(--cold)}
.cmptbl td.l{font-family:var(--sans)}
.cmptbl td i{display:inline-block;width:12px;height:3px;border-radius:2px;vertical-align:middle;margin-right:6px}
`;

function cmpRerender(){
  const y = window.scrollY;
  if (CUR) render();
  else if (CMPD && CMPD.retired && typeof hxRetRerender === "function") hxRetRerender(CMPD.id);
  else return;
  if (y != null) window.scrollTo(0, y);
}
function cmpLoad(){
  if (CMPCAR || CMPLOAD) return;
  CMPLOAD = fetch("careers.json").then(r => r.json()).then(a => {
    const by = {}, key = {};
    for (const p of a) { by[p[0]] = p; const r = p[4]; if (r.length) key[`${p[1]} (${r[0][3]}\u2013${r[r.length-1][3]+1})`] = p[0]; }
    CMPCAR = {by, key, list: a};
    cmpRerender();
  }).catch(e => { CMPCAR = {by: {}, key: {}, list: [], err: String(e && e.message || e)}; cmpRerender(); });
}
// a player's trajectory entry {ls, l, f, po, sug?, tier?}, or null while his shard loads (the load re-renders the page)
function cmpTraj(id){
  const k = id % 64, s = CMPTJ[k];
  if (s && s !== "loading") return s[id] || {ls: "", l: [], f: [], po: []};
  if (!s) { CMPTJ[k] = "loading";
    fetch(`traj/t${String(k).padStart(2, "0")}.json`).then(r => r.json()).then(j => { CMPTJ[k] = j; cmpRerender(); })
      .catch(() => { CMPTJ[k] = {}; cmpRerender(); }); }
  return null;
}
function cmpDots(id){ const t = cmpTraj(id); return t ? t.f || [] : null; }
// smoothed trajectory as segments of [season, age, mean, sd]; a new segment where he missed a whole season
function cmpLine(t){
  const out = []; let seg = [], prev = null;
  for (const p of (t && t.l) || []) { if (prev != null && p[0] - prev > 1) { out.push(seg); seg = []; } seg.push(p); prev = p[0]; }
  if (seg.length) out.push(seg);
  return out;
}
// players with dots but no trajectory line (2026-27 rookies): minutes-weighted Gaussian smoother through the dots
// (bandwidth half a season); breaks across gaps of a year or more
function cmpTrend(id, dots){
  if (CMPTR[id] && CMPTR[id].n === dots.length && CMPTR[id].src === dots) return CMPTR[id].t;   // same array (cmpFill makes a new one)
  const bw = 0.45, out = [];
  if (dots.length) {
    const a0 = dots[0][0], a1 = dots[dots.length-1][0];
    let seg = [];
    for (let a = a0; ; a = Math.min(a + 0.08, a1)) {
      let sw = 0, sv = 0, near = 9;
      for (const p of dots) { const z = (p[0] - a) / bw; if (z > -3 && z < 3) { const w = p[2] * Math.exp(-0.5*z*z); sw += w; sv += w * p[1]; } near = Math.min(near, Math.abs(p[0] - a)); }
      if (near > 0.5 || !sw) { if (seg.length) out.push(seg); seg = []; }
      else seg.push([a, sv / sw]);
      if (a >= a1) break;
    }
    if (seg.length) out.push(seg);
  }
  CMPTR[id] = {n: dots.length, src: dots, t: out};
  return out;
}
// LINE_MODE "dots": his ~10-game dots plus, for each rated season [age, r, min, season] with no dot within 0.6 years of that
// season's age (Feb 1), one point [age, r, min, 0]; sorted by age. Pseudo-points feed the smoother only, never the cloud.
function cmpFill(dots, rows){
  const add = (rows || []).filter(r => r[0] != null && r[1] != null && r[2] > 0 && !dots.some(p => Math.abs(p[0] - r[0]) <= 0.6)).map(r => [r[0], r[1], r[2], 0]);
  return add.length ? dots.concat(add).sort((a, b) => a[0] - b[0]) : dots;
}

function cmpState(d){
  if (!CMPST[d.id]) { const s = (d.cmp && d.cmp.sug) || [];
    if (d.retired && !d.cmpReady) return {on: [], extra: []};   // his similar careers arrive with his traj shard
    CMPST[d.id] = {on: s.slice(0, 3).map(x => x[0]), extra: []}; }
  return CMPST[d.id];
}
// age on Feb 1 of the season (the hub's convention); falls back to his age on Feb 1, 2027 minus the gap
function cmpAgeFn(d){
  const b = d.bio && d.bio.birth_date ? Date.parse(d.bio.birth_date) : NaN;
  if (!isNaN(b)) return s => (Date.UTC(s+1, 1, 1) - b) / 31557600000;
  return s => d.age == null ? null : d.age - (2026 - s);
}
function cmpPeak(rows){ // mean of best three seasons with 1,000+ minutes; rows [age, r, min, season]
  const q = rows.filter(x => x[2] >= 1000).map(x => x[1]).sort((a,b) => b-a).slice(0, 3);
  return q.length ? q.reduce((a,b) => a+b, 0) / q.length : null;
}
// round codes from pp_traj.py: 1 first round, 2 (conference / division) semifinals, 3 (conference / division) finals, 4 NBA Finals
function cmpRound(r, y){ const grp = y < 1970 ? "division" : "conference";
  return r === 1 ? "first round" : r === 2 ? `${grp} semifinals` : r === 3 ? `${grp} finals` : r === 4 ? "NBA Finals" : "playoffs"; }

function modCompare(d){
  cmpLoad();
  CMPD = d;
  const W0 = (window.innerWidth || 1400), W = W0 < 520 ? 430 : W0 < 900 ? 720 : 1000; CMPW = W;
  const small = W < 600, H = small ? 380 : 440, L = small ? 30 : 40, R = small ? 74 : 118, T = 16, B = 30;
  const ag = cmpAgeFn(d), st = cmpState(d), cm = d.cmp || {}, sug = cm.sug || [];
  const fmtA = a => a == null ? "\u2013" : a.toFixed(1);
  const head = `<div class="mhead"><h2>Impact by age<span class="new">${d.retired ? "similar careers" : "comparisons"}</span></h2>
    <div class="cmpctl"><div class="seg" id="cmpX" role="group" aria-label="Horizontal axis"><button data-m="age" aria-pressed="${CMPX==="age"}">by age</button><button data-m="season" aria-pressed="${CMPX==="season"}">by season</button></div>
    ${(cm.ghost || []).length ? `<div class="seg" id="cmpG"><button data-m="1" aria-pressed="${CMPGHOST}" title="Faint lines: what a simple model would have forecast each past summer">show past forecasts</button></div>` : ""}</div></div>`;
  const me = (d.seasons || []).filter(s => s.r != null).map(s => ({season: s.season, age: ag(s.season), r: s.r, min: s.min || 0})).filter(s => s.age != null);
  const pj = (d.proj_path || []).map(p => ({season: p.season, age: p.age, mean: p.mean, lo: p.lo, hi: p.hi})).filter(p => p.mean != null);
  if (!me.length && !pj.length) return `<section class="mod" id="m-cmp"><style>${CMPCSS}</style>${head}<p class="empty">${d.retired ? "Singular has no season rating for him (only a box-score rating, in the table below), so there is no chart." : "No NBA rating or forecast for him yet."}</p></section>`;
  const meIdx = CMPCAR && CMPCAR.by[d.id];
  // calendar position: decimal birth year + age (season mode); his own from bio, others from careers.json
  const byMe = meIdx ? meIdx[3] : (d.bio && d.bio.birth_date ? 1970 + Date.parse(d.bio.birth_date) / 31557600000 : null);
  const xsOf = by => (age, season) => CMPX === "age" ? age : (by != null ? by + age : season + 1 + 1/12);
  const xsMe = xsOf(byMe);

  const ids = [...st.on];
  const comps = CMPCAR ? ids.map(id => CMPCAR.by[id]).filter(Boolean) : [];
  const colOf = id => { const i = ids.indexOf(id); return i < 0 ? css("--line") : css(CMPPAL[i % CMPPAL.length]); };
  const dashOf = id => ids.indexOf(id) >= CMPPAL.length ? "6 3" : "";

  // series: {name, col, me, dots | null, line [segments], ls, po, trend, rows [age, r, min, season], xs}
  const mkS = (id, name, col, dash, xs, rows, isMe) => { const tj = cmpTraj(id), dt = tj ? tj.f || [] : null, ln = tj && LINE_MODE !== "dots" ? cmpLine(tj) : [];
    const fr = LINE_MODE === "dots" && CMPCAR && CMPCAR.by[id] ? CMPCAR.by[id][4] : rows;   // season rows on the dots' scale (as played)
    return {id, name, col, dash, me: isMe, xs, rows, dots: dt, line: ln, ls: tj ? tj.ls || "" : "", po: isMe && tj ? tj.po || [] : [],
            trend: !ln.length && dt && dt.length ? cmpTrend(id, LINE_MODE === "dots" ? cmpFill(dt, fr) : dt) : []}; };
  const series = comps.map(c => mkS(c[0], c[1], colOf(c[0]), dashOf(c[0]), xsOf(c[3]), c[4], false));
  const meS = mkS(d.id, d.name, css("--brown"), "", xsMe, me.map(s => [s.age, s.r, s.min, s.season]), true);
  series.push(meS);

  const sc = META.cmp_meta && META.cmp_meta.scale;
  const lede = `<p class="lede">Each faint dot is about ten games of his rating, inside one regular season${meS.line.length ? "; the bold line is his smoothed trajectory" + (meS.ls === "d" ? ", with its 80% band shaded" : "") : meS.trend.length ? "; the bold line smooths the dots" : ""}.${meS.po.length ? " Teal diamonds are his playoff series, one per series." : ""} ${d.retired ? "Similar careers" : "Comparison players"} are drawn the same way in their own colours. The rating is points per 100 possessions better than an average player, so 0 is average${sc ? `; in ${sname(sc.season)} the middle player with 1,500+ minutes rated ${sgn(sc.median)}, the 10th best ${sgn(sc.tenth)} and the best ${sgn(sc.best)}` : ""}.${pj.length ? " The dashed olive line is his forecast for the next five seasons, with its 80% range." : ""}</p>`;

  const ghosts = CMPGHOST ? (cm.ghost || []).map(g => {
    const o = me.find(s => s.season === g[0]); if (!o) return null;
    return {t: g[0], o, pts: g[1].map((m, h) => ({season: g[0]+h+1, age: ag(g[0]+h+1), m, s: g[2][h]}))};
  }).filter(Boolean) : [];

  // ranges: from trajectory lines (his band too), season rows and forecasts (dots outside the range are not drawn)
  const X = [], Yv = [];
  series.forEach(s => { s.rows.forEach(r => { X.push(s.xs(r[0], r[3])); Yv.push(r[1]); });
    (s.dots || []).forEach(p => X.push(s.xs(p[0], null)));
    s.po.forEach(p => { X.push(s.xs(p[0], null)); if (p[2] >= 50) Yv.push(p[1]); });   // series of 50+ minutes stay inside the chart
    s.line.forEach(seg => seg.forEach(p => { X.push(s.xs(p[1], p[0])); Yv.push(p[2]); if (s.me && p[3] != null) Yv.push(p[2] - 1.2816 * p[3], p[2] + 1.2816 * p[3]); }));
    s.trend.forEach(seg => seg.forEach(p => Yv.push(p[1]))); });
  pj.forEach(p => { X.push(xsMe(p.age, p.season)); Yv.push(p.lo, p.hi); });
  ghosts.forEach(g => g.pts.forEach(p => { X.push(xsMe(p.age, p.season)); Yv.push(p.m - 1.28*p.s, p.m + 1.28*p.s); }));
  const fin = v => v.filter(x => x != null && isFinite(x));
  const Xf = fin(X), Yf = fin(Yv);
  let x0 = Math.floor(Math.min(...Xf)) - 0.3, x1 = Math.ceil(Math.max(...Xf)) + 0.3;
  if (x1 - x0 < 4) { x0 -= 1; x1 += 1; }
  let y0 = Math.floor(Math.min(-2, ...Yf) - 3), y1 = Math.ceil(Math.max(4, ...Yf) + 3);
  y0 = Math.max(y0, -14); y1 = Math.min(y1, 20);
  const Xp = v => L + (v - x0) / (x1 - x0) * (W - L - R), Yp = v => T + (y1 - Math.max(y0, Math.min(y1, v))) / (y1 - y0) * (H - T - B);
  const f1 = v => v.toFixed(1);
  const path = pts => pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join("");

  let g = "";
  const ystep = (y1 - y0) > 16 ? 4 : 2;
  for (let v = Math.ceil(y0/ystep)*ystep; v <= y1; v += ystep)
    g += `<line x1="${L}" x2="${W-R}" y1="${f1(Yp(v))}" y2="${f1(Yp(v))}" stroke="${v===0?css("--mute"):css("--grid")}" ${v===0?'stroke-dasharray="3 3"':""}/><text x="${L-6}" y="${f1(Yp(v)+4)}" text-anchor="end">${v>0?"+":""}${v}</text>`;
  const span = x1 - x0, xstep = span > (small ? 12 : 22) ? 4 : span > (small ? 6 : 11) ? 2 : 1;
  for (let v = Math.ceil(x0/xstep)*xstep; v <= x1; v += xstep)
    g += `<line x1="${f1(Xp(v))}" x2="${f1(Xp(v))}" y1="${T}" y2="${H-B}" stroke="${css("--grid")}" opacity=".6"/><text x="${f1(Xp(v))}" y="${H-10}" text-anchor="middle">${v}</text>`;
  g += `<text x="${W-4}" y="${H-10}" text-anchor="end">${CMPX === "age" ? "age" : "year"}</text>`;

  const ol = css("--olive");
  let gh = "";
  ghosts.forEach(G => {
    const st0 = [Xp(xsMe(G.o.age, G.o.season)), Yp(G.o.r)];
    const up = G.pts.map(p => [Xp(xsMe(p.age, p.season)), Yp(p.m + 1.2816*p.s)]), lo = G.pts.map(p => [Xp(xsMe(p.age, p.season)), Yp(p.m - 1.2816*p.s)]).reverse();
    gh += `<path d="${path([st0, ...up, ...lo])}Z" fill="${ol}" opacity=".035"/>`;
    gh += `<path d="${path([st0, ...G.pts.map(p => [Xp(xsMe(p.age, p.season)), Yp(p.m)])])}" fill="none" stroke="${ol}" stroke-width="1.3" stroke-dasharray="3 3" opacity=".55"><title>Summer ${G.t+1} forecast (after ${sname(G.t)}): ${G.pts.map(p => `${sname(p.season)} ${sgn(p.m)}`).join(", ")}</title></path>`;
  });

  // band first, then every player's cloud, then lines on top (his last), then his playoff series
  let bands = "", clouds = "", trends = "", marks = "", labs = [];
  const ord = [...series.filter(s => !s.me), ...series.filter(s => s.me)];
  ord.forEach(s => {
    const op = s.me ? 0.42 : 0.3, rr = s.me ? 2.1 : 1.8, cls = s.me ? "fd me" : "fd";
    if (s.dots && s.dots.length) clouds += s.dots.filter(p => p[1] >= y0 && p[1] <= y1).map(p => `<circle class="${cls}" cx="${f1(Xp(s.xs(p[0], null)))}" cy="${f1(Yp(p[1]))}" r="${rr}" fill="${s.col}" opacity="${op}"><title>${E(s.name)}: age ${p[0].toFixed(1)}, ${p[3]} games, rating ${sgn(p[1])}</title></circle>`).join("");
    let last = null;
    if (s.line.length) {
      const lc = s.me ? "trj me" : "trj c", sw = s.me ? 3.4 : 2.4;
      s.line.forEach(seg => {
        const pts = seg.map(p => [Xp(s.xs(p[1], p[0])), Yp(p[2])]);
        if (s.me && seg.every(p => p[3] != null)) {
          const up = seg.map(p => [Xp(s.xs(p[1], p[0])), Yp(p[2] + 1.2816 * p[3])]), dn = seg.map(p => [Xp(s.xs(p[1], p[0])), Yp(p[2] - 1.2816 * p[3])]).reverse();
          bands += seg.length > 1 ? `<path class="trjb" d="${path([...up, ...dn])}Z" fill="${s.col}" opacity=".16"/>`
            : `<rect class="trjb" x="${f1(pts[0][0] - 7)}" y="${f1(up[0][1])}" width="14" height="${f1(Math.max(1, dn[0][1] - up[0][1]))}" rx="3" fill="${s.col}" opacity=".16"/>`;
        }
        trends += pts.length > 1 ? `<path class="${lc}" d="${path(pts)}" fill="none" stroke="${s.col}" stroke-width="${sw}" stroke-dasharray="${s.dash || ""}" stroke-linejoin="round" stroke-linecap="round"/>`
          : `<path class="${lc}" d="M${f1(pts[0][0] - 7)} ${f1(pts[0][1])}H${f1(pts[0][0] + 7)}" stroke="${s.col}" stroke-width="${sw}" stroke-linecap="round"/>`;
        if (s.me) trends += seg.map((p, i) => `<circle cx="${f1(pts[i][0])}" cy="${f1(pts[i][1])}" r="${small ? 2.4 : 2.8}" fill="${s.col}"><title>${E(sname(p[0]))} (age ${fmtA(p[1])}): smoothed ${sgn(p[2])}${p[3] != null ? `, 80% range ${sgn(p[2] - 1.2816 * p[3])} to ${sgn(p[2] + 1.2816 * p[3])}` : ""}</title></circle>`).join("");
      });
      const ls = s.line[s.line.length-1], lp = ls[ls.length-1]; last = [Xp(s.xs(lp[1], lp[0])), Yp(lp[2]), lp[2]];
    } else if (s.trend.length) {  // LINE_MODE "dots": every player; "d_season": no completed season (2026-27 rookie)
      const dl = LINE_MODE === "dots";   // the pre-TRAJ look: same weights as the season line it replaces
      s.trend.forEach(seg => { trends += `<path class="${dl ? (s.me ? "trj me" : "trj c") : s.me ? "trd me" : "trd"}" d="${path(seg.map(p => [Xp(s.xs(p[0], null)), Yp(p[1])]))}" fill="none" stroke="${s.col}" stroke-width="${dl ? (s.me ? 3.4 : 2.4) : s.me ? 3 : 2.2}" stroke-dasharray="${s.dash || ""}" stroke-linejoin="round" stroke-linecap="round"/>`; });
      const ls = s.trend[s.trend.length-1], lp = ls[ls.length-1]; last = [Xp(s.xs(lp[0], null)), Yp(lp[1]), lp[1]];
    } else if (s.rows.length) {  // no trajectory or game dots (yet): his season ratings as a line
      const pts = s.rows.map(r => [Xp(s.xs(r[0], r[3])), Yp(r[1])]);
      trends += `<path d="${path(pts)}" fill="none" stroke="${s.col}" stroke-width="${s.me ? 3.2 : 2}" stroke-dasharray="${s.dash || (s.dots === null ? "2 3" : "")}"/>`;
      last = [...pts[pts.length-1], s.rows[s.rows.length-1][1]];
    }
    if (last) labs.push({x: last[0], y: last[1], v: last[2], t: s.name.split(" ").slice(-1)[0], col: s.col, me: s.me});
  });
  const poIn = meS.po.filter(p => p[1] >= y0 && p[1] <= y1);
  marks = poIn.map(p => { const x = Xp(meS.xs(p[0], null)), y = Yp(p[1]), k = small ? 3.8 : 4.4;
    const res = p[7] != null ? `, ${p[7] > p[8] ? "won" : p[7] < p[8] ? "lost" : "tied"} ${p[7]}-${p[8]}` : "";
    return `<path class="po" d="M${f1(x)} ${f1(y - k)}L${f1(x + k)} ${f1(y)}L${f1(x)} ${f1(y + k)}L${f1(x - k)} ${f1(y)}Z" style="fill:var(--po);stroke:var(--panel)" stroke-width="1"><title>${E(sname(p[4]))} playoffs, ${cmpRound(p[6], p[4])} vs ${E(p[5])}${res}: ${p[3]} game${p[3] === 1 ? "" : "s"}, ${p[2]} minutes, rating ${sgn(p[1])}${p[9] ? " (minutes partly estimated)" : ""}</title></path>`; }).join("");

  let fan = "";
  if (pj.length) {
    const lab = labs.find(l => l.me);
    const s0 = lab ? [lab.x, lab.y] : null;
    const P0 = pj.map(p => [Xp(xsMe(p.age, p.season)), p]);
    const up = (s0 ? [s0] : []).concat(P0.map(p => [p[0], Yp(p[1].hi)])), lo = P0.map(p => [p[0], Yp(p[1].lo)]).reverse().concat(s0 ? [s0] : []);
    fan += `<path d="${path([...up, ...lo])}Z" fill="${ol}" opacity=".2"/>`;
    fan += `<path d="${path((s0 ? [s0] : []).concat(P0.map(p => [p[0], Yp(p[1].mean)])))}" fill="none" stroke="${ol}" stroke-width="2.2" stroke-dasharray="6 4"/>`;
    fan += P0.map(p => `<circle cx="${f1(p[0])}" cy="${f1(Yp(p[1].mean))}" r="3.4" fill="${ol}"><title>Forecast ${sname(p[1].season)} (age ${fmtA(p[1].age)}): ${sgn(p[1].mean)}, 80% range ${sgn(p[1].lo)} to ${sgn(p[1].hi)}</title></circle>`).join("");
  }
  labs.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i-1].y < 15 && Math.abs(labs[i].x - labs[i-1].x) < 90) labs[i].y = labs[i-1].y + 15;
  const lb = labs.map(l => `<text x="${f1(Math.min(l.x + 7, W - 4))}" y="${f1(l.y + 4)}" text-anchor="${l.x + 7 > W - R + 60 ? "end" : "start"}" style="fill:${l.col};font:${l.me ? 700 : 600} ${small ? 11 : 12}px var(--sans);paint-order:stroke;stroke:${css("--bg")};stroke-width:3px">${E(l.t)}</text>`).join("");
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(d.name)}: rating by ${CMPX}, with ${d.retired ? "similar careers" : "comparison players"}">${g}${gh}${bands}${clouds}${fan}${trends}${marks}${lb}</svg>`;

  const chip = (x, extra) => { const on = ids.includes(x[0]); const tip = extra ? "added by you" : `career-arc gap ${x[2]} points over ${x[3]} shared ages`;
    return `<button data-id="${x[0]}" aria-pressed="${on}" title="${E(x[1])}: ${E(tip)}"><i style="background:${on ? colOf(x[0]) : css("--line")}"></i>${E(x[1])}${extra ? " \u00d7" : ""}</button>`; };
  const extras = st.extra.map(id => { const c = CMPCAR && CMPCAR.by[id]; return c ? [id, c[1]] : null; }).filter(Boolean);
  const sim2 = (META.cmp_meta || {}).sim === 2;   // pp_compare.py SIM_V2 (TRAJ2): peak first, position and shares break ties
  const tierTxt = (sim2 ? {top: "He is one of the all-time top tier, so these are the other all-time greats closest to his peak (best three seasons within about 1.5 points), then closest in career shape and length; position and assist and rebound shares only break ties.",
    great: "He is in the all-time top 75 or so, so these are other greats closest to his peak (within about 1.5 points), then in career shape and length, preferring his era; position and assist and rebound shares only break ties."}
    : {top: "He is one of the all-time top tier, so these are the other all-time greats, whatever their position, closest in peak and standing.",
    great: "He is in the all-time top 75 or so, so these are players of similar impact from his era (close in age, overlapping careers), with the same position a bonus."})[cm.tier]
    || (d.retired ? "Players whose whole careers looked like his, from any era: rating at the same ages, peak, career value and length, position, assist and rebound shares, and height."
      : "Players who, at his age, were his type (position, height, assist and rebound shares, rating curve so far) and then played at least three more seasons, so you can see where those careers went. Recent players are preferred; one is always active or retired within five seasons.");
  const addBox = `<input id="cmpAdd" list="cmpList" placeholder="+ add any player" aria-label="Add any player to the chart" autocomplete="off">`;
  const chips = sug.length ? `<div class="cmpchips" id="cmpChips"><span class="lbl">${d.retired ? "Similar careers" : "Compare with"}</span>${sug.slice(0, 5).map(x => chip(x)).join("")}</div>
    <div class="cmpchips more" id="cmpMore" style="margin-top:6px"><span class="lbl">More like him</span>${sug.slice(5).map(x => chip(x)).join("")}${extras.map(x => chip(x, true)).join("")}${addBox}</div>`
    : `<div class="cmpchips" id="cmpMore"><span class="lbl">Compare with</span>${extras.map(x => chip(x, true)).join("")}${addBox}</div>`;

  const sw = (col, dash, w) => `<svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""}/></svg>`;
  const dot = col => `<svg width="12" height="10" aria-hidden="true"><circle cx="6" cy="5" r="2.4" fill="${col}" opacity=".5"/></svg>`;
  const br = css("--brown");
  const lnSw = `<svg width="22" height="12" aria-hidden="true">${meS.ls === "d" ? `<rect x="0" y="1" width="22" height="10" fill="${br}" opacity=".16"/>` : ""}<line x1="1" x2="21" y1="6" y2="6" stroke="${br}" stroke-width="3"/></svg>`;
  const dia = `<svg width="12" height="12" aria-hidden="true"><path d="M6 1.2L10.8 6L6 10.8L1.2 6Z" style="fill:var(--po)"/></svg>`;
  const loading = !CMPCAR || series.some(s => s.dots === null);
  const legend = `<div class="cmpleg"><span>${dot(br)}about ten games, regular season</span>${meS.line.length ? `<span>${lnSw}smoothed trajectory${meS.ls === "d" ? ", 80% band" : " (simple average)"}</span>` : meS.trend.length ? (LINE_MODE === "dots" ? `<span>${sw(br, "", 3.4)}smoothed line through his dots</span>` : `<span>${sw(br, "", 3)}smoothed (simple average of his dots)</span>`) : ""}${poIn.length ? `<span>${dia}playoffs, one dot per series</span>` : ""}${pj.length ? `<span>${sw(ol, "6 4", 2)}forecast and 80% range</span>` : ""}${CMPGHOST ? `<span>${sw(ol, "3 3", 1.3)}past forecasts</span>` : ""}${loading ? `<span>loading game-level careers\u2026</span>` : ""}${CMPCAR && CMPCAR.err ? `<span>comparison careers did not load (${E(CMPCAR.err)})</span>` : ""}</div>`;

  const nowA = me.length ? me[me.length-1].age : null, ak = nowA != null ? Math.floor(nowA) : null;
  const atAge = rows => { if (ak == null) return null; const r = rows.find(x => Math.floor(x[0]) === ak); return r ? r[1] : null; };
  const anyAt = comps.some(c => atAge(c[4]) != null);
  const cur = new Set(META.players.map(p => p.id));
  const linkable = id => id && id !== d.id && (cur.has(id) || !!(CMPCAR && CMPCAR.by[id]));   // current pages and retired pages
  const trow = (name, id, col, rows, pos) => { const pk = cmpPeak(rows), best = rows.length ? rows.reduce((a, b) => b[1] > a[1] && b[2] >= 500 ? b : a, rows[0]) : null;
    return `<tr><td class="l"><i style="background:${col}"></i>${linkable(id) ? `<a href="#p-${id}">${E(name)}</a>` : E(name)}</td><td class="l">${E(pos || "")}</td><td>${rows.length ? `${sname(rows[0][3]).slice(0,4)}\u2013${String(rows[rows.length-1][3]+1).slice(2)}` : "\u2013"}</td><td>${rows.length}</td><td>${anyAt ? sgn(atAge(rows)) : rows.length ? `${sgn(rows[rows.length-1][1])} <span class="mute">(${fmtA(rows[rows.length-1][0])})</span>` : "\u2013"}</td><td>${sgn(pk)}</td><td>${best ? `${sgn(best[1])} <span class="mute">(${fmtA(best[0])})</span>` : "\u2013"}</td></tr>`; };
  const tbl = (me.length && comps.length) ? `<div class="tbl cmptbl"><table><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Seasons</th><th>N</th><th>${anyAt ? `At age ${ak}` : "Last season (age)"}</th><th>Best 3 avg</th><th>Best season (age)</th></tr></thead><tbody>
    ${trow(d.name, d.id, css("--brown"), me.map(s => [s.age, s.r, s.min, s.season]), cm.posg || d.pos)}${comps.map(c => trow(c[1], c[0], colOf(c[0]), c[4], c[2])).join("")}</tbody></table><p class="note" style="margin:6px 8px">Season columns use ${(META.cmp_meta || {}).ap ? "the season ratings (as played from 1996-97 on)" : "the season SiPM ratings"}.</p></div>` : "";

  const gt = META.cmp_meta && META.cmp_meta.ghost_test, h1 = gt && gt.by_h[0], h5 = gt && gt.by_h[gt.by_h.length-1];
  const lineTxt = meS.line.length ? (meS.ls === "d"
      ? " The smoothed trajectory treats each season's rating as a noisy reading of his true level (short seasons count less, and a player's level usually changes gradually with age) and smooths the readings across his whole career; the band is the 80% range of that level. It breaks where he missed a whole season. Method: item D's career-path model (November 2026), checked on held-out seasons."
      : " He has no season of 100+ minutes, so his line is a simple minutes-weighted average of his season ratings (no band).")
    : meS.trend.length ? (LINE_MODE === "dots" ? " The bold line averages nearby dots, weighted by minutes, over about half a season either side." : " He has no completed season yet, so his line is a simple minutes-weighted average of his dots.") : "";
  const notes = `<p class="note" style="margin-top:8px">${E(tierTxt)} How the dots are made: Singular's box-score rating of every game, shifted so each season averages ${(META.cmp_meta || {}).ap ? "his as-played rating for that season (1996-97 on: that season's own rating, not SiPM's next-season projection; 2026-27: his current forecast)" : "his season SiPM rating (2026-27: his current projection)"}. Each season's games are then split, in order, into groups of about ten (a 78-game season makes eight dots: six of 10 games and two of 9); a group never crosses seasons. Playoff games get the same game rating and the same season shift, one dot per series; before 1969-70 many playoff box scores lack minutes, and those are estimated from his regular-season minutes per game. Games before 1996-97 come from the era-bridge game ratings, which are rougher (before 1973-74 no steals or blocks, and minutes are sometimes estimated), so those clouds look tighter than they really are.${lineTxt}${CMPGHOST && h1 ? ` Past forecasts: a simple model (his last three seasons weighted by minutes, his age and minutes) fitted on seasons before 2016-17, then run from each summer using only what was known then. It lags breakouts on purpose. Tested on 2016-17 to 2025-26: typical miss ${h1.rmse_model} points one season out (same-as-last-season: ${h1.rmse_same_as_last}), ${h5.rmse_model} five seasons out (same-as-last-season: ${h5.rmse_same_as_last}); its 80% bands held ${Math.round(100*h1.cover80)}\u2013${Math.round(100*h5.cover80)}% of outcomes.` : ""}</p>`;

  return `<section class="mod" id="m-cmp"><style>${CMPCSS}</style>${head}${lede}${chips}${legend}${svg}${tbl}${notes}</section>`;
}

// wiring for the chart's controls; history.js also calls it after drawing a retired page (CMPD = the player drawn)
function cmpWire(){
  const keep = f => { f(); cmpRerender(); };
  const x = document.querySelector("#cmpX"); if (x) x.onclick = e => { const b = e.target.closest("button"); if (b) keep(() => { CMPX = b.dataset.m; }); };
  const gb = document.querySelector("#cmpG"); if (gb) gb.onclick = e => { const b = e.target.closest("button"); if (b) keep(() => { CMPGHOST = !CMPGHOST; }); };
  const tog = e => { const b = e.target.closest("button[data-id]"); if (!b || !CMPD) return; const id = +b.dataset.id, st = cmpState(CMPD);
    keep(() => { const i = st.on.indexOf(id); if (i >= 0) { st.on.splice(i, 1); const j = st.extra.indexOf(id); if (j >= 0) st.extra.splice(j, 1); } else st.on.push(id); }); };
  ["#cmpChips", "#cmpMore"].forEach(s => { const el = document.querySelector(s); if (el) el.onclick = tog; });
  // the name list for "+ add any player" lives outside #app so re-renders do not rebuild it
  if (CMPCAR && CMPCAR.list.length && typeof document.getElementById === "function" && !document.getElementById("cmpList") && document.body)
    document.body.insertAdjacentHTML("beforeend", `<datalist id="cmpList">${Object.keys(CMPCAR.key).map(k => `<option value="${E(k)}"></option>`).join("")}</datalist>`);
  const add = document.querySelector("#cmpAdd");
  if (add) add.addEventListener("change", () => { const id = CMPCAR && CMPCAR.key[add.value.trim()]; if (!id || !CMPD || id === CMPD.id) return;
    const st = cmpState(CMPD); keep(() => { if (!st.on.includes(id)) st.on.push(id); if (!(CMPD.cmp && CMPD.cmp.sug || []).some(s => s[0] === id) && !st.extra.includes(id)) st.extra.push(id); }); });
  if (!window.CMPRS && window.addEventListener) { window.CMPRS = true; window.addEventListener("resize", () => {
    const w = window.innerWidth || 1400, nw = w < 520 ? 430 : w < 900 ? 720 : 1000; if ((CUR || CMPD) && CMPW && nw !== CMPW) cmpRerender(); }); }
}
(window.WIRES = window.WIRES || []).push(cmpWire);

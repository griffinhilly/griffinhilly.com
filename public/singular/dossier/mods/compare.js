// Impact by age, with comparison players, drawn DARKO-style: each player is a cloud of faint dots (one per 10 games) with a
// bold smoothed trend through it. Data: d.cmp {sug, ghost, tier, posg} and META.cmp_meta (scripts/pp_compare.py);
// careers.json (every rated hub player: id, name, pos, decimal birth year, season rows [age, r, min, season]) is fetched once;
// careers/cNN.json (10-game dots [age, rating, minutes, games], player id % 64) are fetched per shard when a player is drawn.
let CMPX = "age", CMPGHOST = false, CMPCAR = null, CMPLOAD = null, CMPW = 0;
const CMPST = {};  // player id -> {on: [ids shown], extra: [ids added by search]}
const CMPSH = {};  // shard number -> dots object, or "loading"
const CMPTR = {};  // player id -> smoothed trend (cache)
const CMPPAL = ["--cold", "--purple", "--forest", "--ochre", "--hot"];
const CMPCSS = `
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

function cmpRerender(){ if (!CUR) return; const y = window.scrollY; render(); if (y != null) window.scrollTo(0, y); }
function cmpLoad(){
  if (CMPCAR || CMPLOAD) return;
  CMPLOAD = fetch("careers.json").then(r => r.json()).then(a => {
    const by = {}, key = {};
    for (const p of a) { by[p[0]] = p; const r = p[4]; if (r.length) key[`${p[1]} (${r[0][3]}\u2013${r[r.length-1][3]+1})`] = p[0]; }
    CMPCAR = {by, key, list: a};
    cmpRerender();
  }).catch(e => { CMPCAR = {by: {}, key: {}, list: [], err: String(e && e.message || e)}; cmpRerender(); });
}
// 10-game dots for a player, or null while his shard loads (the load re-renders the page when it lands)
function cmpDots(id){
  const k = id % 64, s = CMPSH[k];
  if (s && s !== "loading") return s[id] || [];
  if (!s) { CMPSH[k] = "loading";
    fetch(`careers/c${String(k).padStart(2, "0")}.json`).then(r => r.json()).then(j => { CMPSH[k] = j; cmpRerender(); })
      .catch(() => { CMPSH[k] = {}; cmpRerender(); }); }
  return null;
}
// minutes-weighted Gaussian smoother through the dots (bandwidth half a season); breaks across gaps of a year or more
function cmpTrend(id, dots){
  if (CMPTR[id] && CMPTR[id].n === dots.length) return CMPTR[id].t;
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
  CMPTR[id] = {n: dots.length, t: out};
  return out;
}

function cmpState(d){
  if (!CMPST[d.id]) { const s = (d.cmp && d.cmp.sug) || []; CMPST[d.id] = {on: s.slice(0, 3).map(x => x[0]), extra: []}; }
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

function modCompare(d){
  cmpLoad();
  const W0 = (window.innerWidth || 1400), W = W0 < 520 ? 430 : W0 < 900 ? 720 : 1000; CMPW = W;
  const small = W < 600, H = small ? 380 : 440, L = small ? 30 : 40, R = small ? 74 : 118, T = 16, B = 30;
  const ag = cmpAgeFn(d), st = cmpState(d), cm = d.cmp || {}, sug = cm.sug || [];
  const fmtA = a => a == null ? "\u2013" : a.toFixed(1);
  const head = `<div class="mhead"><h2>Impact by age<span class="new">comparisons</span></h2>
    <div class="cmpctl"><div class="seg" id="cmpX" role="group" aria-label="Horizontal axis"><button data-m="age" aria-pressed="${CMPX==="age"}">by age</button><button data-m="season" aria-pressed="${CMPX==="season"}">by season</button></div>
    <div class="seg" id="cmpG"><button data-m="1" aria-pressed="${CMPGHOST}" title="Faint lines: what a simple model would have forecast each past summer">show past forecasts</button></div></div></div>`;
  const me = (d.seasons || []).filter(s => s.r != null).map(s => ({season: s.season, age: ag(s.season), r: s.r, min: s.min || 0})).filter(s => s.age != null);
  const pj = (d.proj_path || []).map(p => ({season: p.season, age: p.age, mean: p.mean, lo: p.lo, hi: p.hi})).filter(p => p.mean != null);
  if (!me.length && !pj.length) return `<section class="mod" id="m-cmp"><style>${CMPCSS}</style>${head}<p class="empty">No NBA rating or forecast for him yet.</p></section>`;
  const meIdx = CMPCAR && CMPCAR.by[d.id];
  // calendar position: decimal birth year + age (season mode); his own from bio, others from careers.json
  const byMe = meIdx ? meIdx[3] : (d.bio && d.bio.birth_date ? 1970 + Date.parse(d.bio.birth_date) / 31557600000 : null);
  const xsOf = by => (age, season) => CMPX === "age" ? age : (by != null ? by + age : season + 1 + 1/12);
  const xsMe = xsOf(byMe);

  const sc = META.cmp_meta && META.cmp_meta.scale;
  const lede = `<p class="lede">Each faint dot is ten games of his rating; the bold line smooths them. Comparison players are drawn the same way in their own colours. The rating is points per 100 possessions better than an average player, so 0 is average${sc ? `; in ${sname(sc.season)} the middle player with 1,500+ minutes rated ${sgn(sc.median)}, the 10th best ${sgn(sc.tenth)} and the best ${sgn(sc.best)}` : ""}.${pj.length ? " The dashed olive line is his forecast for the next five seasons, with its 80% range." : ""}</p>`;

  const ids = [...st.on];
  const comps = CMPCAR ? ids.map(id => CMPCAR.by[id]).filter(Boolean) : [];
  const colOf = id => { const i = ids.indexOf(id); return i < 0 ? css("--line") : css(CMPPAL[i % CMPPAL.length]); };
  const dashOf = id => ids.indexOf(id) >= CMPPAL.length ? "6 3" : "";

  // series: {name, col, me, dots | null, trend, seasons [age, r, min, season], xs}
  const series = [];
  comps.forEach(c => { const dt = cmpDots(c[0]); series.push({id: c[0], name: c[1], col: colOf(c[0]), dash: dashOf(c[0]), dots: dt, trend: dt && dt.length ? cmpTrend(c[0], dt) : [], rows: c[4], xs: xsOf(c[3])}); });
  const myDots = cmpDots(d.id);
  series.push({id: d.id, name: d.name, col: css("--brown"), me: true, dots: myDots, trend: myDots && myDots.length ? cmpTrend(d.id, myDots) : [],
    rows: me.map(s => [s.age, s.r, s.min, s.season]), xs: xsMe});

  const ghosts = CMPGHOST ? (cm.ghost || []).map(g => {
    const o = me.find(s => s.season === g[0]); if (!o) return null;
    return {t: g[0], o, pts: g[1].map((m, h) => ({season: g[0]+h+1, age: ag(g[0]+h+1), m, s: g[2][h]}))};
  }).filter(Boolean) : [];

  // ranges: from trends / season lines and forecasts (dots outside the range are not drawn)
  const X = [], Yv = [];
  series.forEach(s => { s.rows.forEach(r => { X.push(s.xs(r[0], r[3])); Yv.push(r[1]); });
    (s.dots || []).forEach(p => X.push(s.xs(p[0], null))); s.trend.forEach(seg => seg.forEach(p => Yv.push(p[1]))); });
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

  // clouds first (all players), then trends on top, his last
  let clouds = "", trends = "", labs = [];
  const ord = [...series.filter(s => !s.me), ...series.filter(s => s.me)];
  ord.forEach(s => {
    const op = s.me ? 0.42 : 0.3, rr = s.me ? 2.1 : 1.8;
    if (s.dots && s.dots.length) clouds += s.dots.filter(p => p[1] >= y0 && p[1] <= y1).map(p => `<circle cx="${f1(Xp(s.xs(p[0], null)))}" cy="${f1(Yp(p[1]))}" r="${rr}" fill="${s.col}" opacity="${op}"><title>${E(s.name)}: age ${p[0].toFixed(1)}, ${p[3]} games, rating ${sgn(p[1])}</title></circle>`).join("");
    let last = null;
    if (s.trend.length) {
      s.trend.forEach(seg => { trends += `<path d="${path(seg.map(p => [Xp(s.xs(p[0], null)), Yp(p[1])]))}" fill="none" stroke="${s.col}" stroke-width="${s.me ? 3.4 : 2.4}" stroke-dasharray="${s.dash || ""}" stroke-linejoin="round" stroke-linecap="round"/>`; });
      const ls = s.trend[s.trend.length-1], lp = ls[ls.length-1]; last = [Xp(s.xs(lp[0], null)), Yp(lp[1]), lp[1]];
    } else if (s.rows.length) {  // no game dots (yet): his season ratings as a line
      const pts = s.rows.map(r => [Xp(s.xs(r[0], r[3])), Yp(r[1])]);
      trends += `<path d="${path(pts)}" fill="none" stroke="${s.col}" stroke-width="${s.me ? 3.2 : 2}" stroke-dasharray="${s.dash || (s.dots === null ? "2 3" : "")}"/>`;
      last = [...pts[pts.length-1], s.rows[s.rows.length-1][1]];
    }
    if (last) labs.push({x: last[0], y: last[1], v: last[2], t: s.name.split(" ").slice(-1)[0], col: s.col, me: s.me});
  });

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
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(d.name)}: rating by ${CMPX}, with comparison players">${g}${gh}${clouds}${fan}${trends}${lb}</svg>`;

  const chip = (x, extra) => { const on = ids.includes(x[0]); const tip = extra ? "added by you" : `career-arc gap ${x[2]} points over ${x[3]} shared ages`;
    return `<button data-id="${x[0]}" aria-pressed="${on}" title="${E(x[1])}: ${E(tip)}"><i style="background:${on ? colOf(x[0]) : css("--line")}"></i>${E(x[1])}${extra ? " \u00d7" : ""}</button>`; };
  const extras = st.extra.map(id => { const c = CMPCAR && CMPCAR.by[id]; return c ? [id, c[1]] : null; }).filter(Boolean);
  const tierTxt = {top: "He is one of the all-time top tier, so these are the other all-time greats, whatever their position, closest in peak and standing.",
    great: "He is in the all-time top 75 or so, so these are players of similar impact from his era (close in age, overlapping careers), with the same position a bonus."}[cm.tier]
    || "Players who, at his age, were his type (position, height, assist and rebound shares, rating curve so far) and then played at least three more seasons, so you can see where those careers went. Recent players are preferred; one is always active or retired within five seasons.";
  const addBox = `<input id="cmpAdd" list="cmpList" placeholder="+ add any player" aria-label="Add any player to the chart" autocomplete="off">`;
  const chips = sug.length ? `<div class="cmpchips" id="cmpChips"><span class="lbl">Compare with</span>${sug.slice(0, 5).map(x => chip(x)).join("")}</div>
    <div class="cmpchips more" id="cmpMore" style="margin-top:6px"><span class="lbl">More like him</span>${sug.slice(5).map(x => chip(x)).join("")}${extras.map(x => chip(x, true)).join("")}${addBox}</div>`
    : `<div class="cmpchips" id="cmpMore"><span class="lbl">Compare with</span>${extras.map(x => chip(x, true)).join("")}${addBox}</div>`;

  const sw = (col, dash, w) => `<svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""}/></svg>`;
  const dot = col => `<svg width="12" height="10" aria-hidden="true"><circle cx="6" cy="5" r="2.4" fill="${col}" opacity=".5"/></svg>`;
  const loading = !CMPCAR || series.some(s => s.dots === null);
  const legend = `<div class="cmpleg"><span>${dot(css("--brown"))}ten games</span><span>${sw(css("--brown"), "", 3)}${E(d.name)}, smoothed</span>${pj.length ? `<span>${sw(ol, "6 4", 2)}forecast and 80% range</span>` : ""}${CMPGHOST ? `<span>${sw(ol, "3 3", 1.3)}past forecasts</span>` : ""}${loading ? `<span>loading game-level careers\u2026</span>` : ""}${CMPCAR && CMPCAR.err ? `<span>comparison careers did not load (${E(CMPCAR.err)})</span>` : ""}</div>`;

  const nowA = me.length ? me[me.length-1].age : null, ak = nowA != null ? Math.floor(nowA) : null;
  const atAge = rows => { if (ak == null) return null; const r = rows.find(x => Math.floor(x[0]) === ak); return r ? r[1] : null; };
  const anyAt = comps.some(c => atAge(c[4]) != null);
  const cur = new Set(META.players.map(p => p.id));
  const trow = (name, id, col, rows, pos) => { const pk = cmpPeak(rows), best = rows.length ? rows.reduce((a, b) => b[1] > a[1] && b[2] >= 500 ? b : a, rows[0]) : null;
    return `<tr><td class="l"><i style="background:${col}"></i>${id && cur.has(id) && id !== d.id ? `<a href="#p-${id}">${E(name)}</a>` : E(name)}</td><td class="l">${E(pos || "")}</td><td>${rows.length ? `${sname(rows[0][3]).slice(0,4)}\u2013${String(rows[rows.length-1][3]+1).slice(2)}` : "\u2013"}</td><td>${rows.length}</td><td>${anyAt ? sgn(atAge(rows)) : rows.length ? `${sgn(rows[rows.length-1][1])} <span class="mute">(${fmtA(rows[rows.length-1][0])})</span>` : "\u2013"}</td><td>${sgn(pk)}</td><td>${best ? `${sgn(best[1])} <span class="mute">(${fmtA(best[0])})</span>` : "\u2013"}</td></tr>`; };
  const tbl = (me.length && comps.length) ? `<div class="tbl cmptbl"><table><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Seasons</th><th>N</th><th>${anyAt ? `At age ${ak}` : "Last season (age)"}</th><th>Best 3 avg</th><th>Best season (age)</th></tr></thead><tbody>
    ${trow(d.name, d.id, css("--brown"), me.map(s => [s.age, s.r, s.min, s.season]), cm.posg || d.pos)}${comps.map(c => trow(c[1], c[0], colOf(c[0]), c[4], c[2])).join("")}</tbody></table><p class="note" style="margin:6px 8px">Season columns use the season SiPM ratings.</p></div>` : "";

  const gt = META.cmp_meta && META.cmp_meta.ghost_test, h1 = gt && gt.by_h[0], h5 = gt && gt.by_h[gt.by_h.length-1];
  const notes = `<p class="note" style="margin-top:8px">${E(tierTxt)} How the dots are made: Singular's box-score rating of every game, shifted so each season averages his season SiPM rating (2026-27: his current projection), then averaged over blocks of ten games. Games before 1996-97 come from the era-bridge game ratings, which are rougher (before 1973-74 no steals or blocks, and minutes are sometimes estimated), so those clouds look tighter than they really are. The smoothed line weights each dot by minutes over about half a season either side.${CMPGHOST && h1 ? ` Past forecasts: a simple model (his last three seasons weighted by minutes, his age and minutes) fitted on seasons before 2016-17, then run from each summer using only what was known then. It lags breakouts on purpose. Tested on 2016-17 to 2025-26: typical miss ${h1.rmse_model} points one season out (same-as-last-season: ${h1.rmse_same_as_last}), ${h5.rmse_model} five seasons out (same-as-last-season: ${h5.rmse_same_as_last}); its 80% bands held ${Math.round(100*h1.cover80)}\u2013${Math.round(100*h5.cover80)}% of outcomes.` : ""}</p>`;

  return `<section class="mod" id="m-cmp"><style>${CMPCSS}</style>${head}${lede}${chips}${legend}${svg}${tbl}${notes}</section>`;
}

(window.WIRES = window.WIRES || []).push(function(){
  const keep = f => { f(); cmpRerender(); };
  const x = document.querySelector("#cmpX"); if (x) x.onclick = e => { const b = e.target.closest("button"); if (b) keep(() => { CMPX = b.dataset.m; }); };
  const gb = document.querySelector("#cmpG"); if (gb) gb.onclick = e => { const b = e.target.closest("button"); if (b) keep(() => { CMPGHOST = !CMPGHOST; }); };
  const tog = e => { const b = e.target.closest("button[data-id]"); if (!b || !CUR) return; const id = +b.dataset.id, st = cmpState(CUR);
    keep(() => { const i = st.on.indexOf(id); if (i >= 0) { st.on.splice(i, 1); const j = st.extra.indexOf(id); if (j >= 0) st.extra.splice(j, 1); } else st.on.push(id); }); };
  ["#cmpChips", "#cmpMore"].forEach(s => { const el = document.querySelector(s); if (el) el.onclick = tog; });
  // the name list for "+ add any player" lives outside #app so re-renders do not rebuild it
  if (CMPCAR && CMPCAR.list.length && typeof document.getElementById === "function" && !document.getElementById("cmpList") && document.body)
    document.body.insertAdjacentHTML("beforeend", `<datalist id="cmpList">${Object.keys(CMPCAR.key).map(k => `<option value="${E(k)}"></option>`).join("")}</datalist>`);
  const add = document.querySelector("#cmpAdd");
  if (add) add.addEventListener("change", () => { const id = CMPCAR && CMPCAR.key[add.value.trim()]; if (!id || !CUR || id === CUR.id) return;
    const st = cmpState(CUR); keep(() => { if (!st.on.includes(id)) st.on.push(id); if (!(CUR.cmp && CUR.cmp.sug || []).some(s => s[0] === id) && !st.extra.includes(id)) st.extra.push(id); }); });
  if (!window.CMPRS && window.addEventListener) { window.CMPRS = true; window.addEventListener("resize", () => {
    const w = window.innerWidth || 1400, nw = w < 520 ? 430 : w < 900 ? 720 : 1000; if (CUR && CMPW && nw !== CMPW) cmpRerender(); }); }
});

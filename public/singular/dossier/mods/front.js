// Front page: league table with "surprise" heat (data: front.json, built by scripts/pp_front.py).
// Colour = how unusual a number is for a player of his impact (z of actual vs expected), or plain league percentile.
let FR = null;                       // front.json
const FS = { season: "2026", colour: "surp", exp: "pos", sortBy: "val", sort: "r", dir: -1,
             team: "", pos: "", gfrac: 0.25, mpg: 10, q: "" };
const F_STAT_DESC = {
  mpg: "Minutes per game", pts: "Points per game", reb: "Rebounds per game", ast: "Assists per game", stl: "Steals per game",
  blk: "Blocks per game", tov: "Turnovers per game", fg3m: "Threes made per game", fgp: "Field-goal %", fg3p: "Three-point %",
  ftp: "Free-throw %", ts: "True shooting %: points per shot, counting threes and free throws", usg: "Usage %: share of team possessions he ends while on the floor"};
const F_SENT = {   // this-season card sentences (progressive: what he is doing now)
  mpg: ["Playing", "more minutes a game", "fewer minutes a game"], pts: ["Scoring", "more points a game", "fewer points a game"],
  reb: ["Grabbing", "more rebounds a game", "fewer rebounds a game"], ast: ["Handing out", "more assists a game", "fewer assists a game"],
  stl: ["Getting", "more steals a game", "fewer steals a game"], blk: ["Blocking", "more shots a game", "fewer shots a game"],
  tov: ["Committing", "more turnovers a game", "fewer turnovers a game"], fg3m: ["Making", "more threes a game", "fewer threes a game"],
  fgp: ["Shooting", "points better from the field", "points worse from the field"], fg3p: ["Shooting", "points better from three", "points worse from three"],
  ftp: ["Shooting", "points better at the line", "points worse at the line"], ts: ["True shooting", "points higher", "points lower"],
  usg: ["Usage", "points higher", "points lower"]};
const F_PCTK = ["fgp", "fg3p", "ftp", "ts", "usg"];
FS.cards = "new";   // "new" = change vs his own prior seasons; "long" = long-standing outliers

function renderFront(){
  if (!FR) {
    $("#app").innerHTML = `<p class="empty">Loading the league table\u2026</p>`;
    fetch("front.json").then(r => r.json()).then(d => { FR = d; if (!/^#p-\d+$/.test(location.hash)) renderFront(); })
      .catch(e => { $("#app").innerHTML = `<p class="empty">Could not load front.json (${E(e.message)}).</p>`; });
    return;
  }
  const teams = [...new Set(FR.rows.map(r => r.team).filter(Boolean))].sort();
  const dt = new Date(FR.data_through + "T12:00:00");
  const dts = isNaN(dt) ? E(FR.data_through) : dt.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  const seg = (id, cur, opts) => `<div class="seg" id="${id}" role="group">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;
  $("#app").innerHTML = `<style>
  .fhead{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:8px 32px;padding-block:26px 14px;border-bottom:1px solid var(--line)}
  @media (max-width:860px){.fhead{grid-template-columns:minmax(0,1fr)}}
  .fhead .lede{margin:8px 0 0}
  .fctl{display:flex;flex-direction:column;gap:8px;align-self:end}
  .fctl .row{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--mute)}
  .fctl .row>span:first-child{min-width:74px}
  .fcards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:16px 0 4px}
  @media (max-width:1100px){.fcards{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (max-width:640px){.fcards{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}.fcard{flex:0 0 78%;scroll-snap-align:start}}
  .fcard{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--mid);border-radius:6px;padding:9px 11px;min-width:0}
  .fcard.hot{border-left-color:var(--hot)} .fcard.cold{border-left-color:var(--cold)}
  .fcard .who{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fcard .who a{color:inherit;text-decoration:none} .fcard .who a:hover{text-decoration:underline}
  .fcard .who span{font-weight:400;color:var(--mute);font-size:12px;margin-left:5px}
  .fcard .big{font:500 24px/1.15 var(--mono);font-variant-numeric:tabular-nums;margin-top:2px}
  .fcard .big small{font:600 12px var(--sans);color:var(--mute);margin-left:4px;letter-spacing:.04em}
  .fcard .s{font-size:13px;line-height:1.35;margin-top:3px}
  .fcard .x{font-size:12px;color:var(--mute);margin-top:3px}
  .ffil{display:flex;gap:8px 12px;align-items:center;flex-wrap:wrap;margin:14px 0 8px;font-size:13px;color:var(--mute)}
  .ffil input{font:14px var(--sans);padding:5px 9px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);width:180px}
  .ffil .cnt{margin-left:auto;font-family:var(--mono);font-size:12px}
  .flegend{display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-bottom:8px}
  .flegend .sw{display:inline-flex;gap:0;border:1px solid var(--line);border-radius:3px;overflow:hidden;vertical-align:middle}
  .flegend .sw i{width:22px;height:12px;display:block}
  .ftbl{overflow:auto;max-height:calc(100vh - 70px);border:1px solid var(--line);border-radius:6px;background:var(--panel)}
  .ftbl table{font-size:12.5px;width:100%}
  .ftbl th,.ftbl td{padding:4px 5px;border-bottom:1px solid var(--grid)}
  .ftbl thead th{z-index:2;cursor:pointer;user-select:none;font-size:12px;vertical-align:bottom;box-shadow:inset 0 -1px 0 var(--line)}
  .ftbl thead th:hover{color:var(--ink)}
  .ftbl thead th.on{color:var(--ink)} .ftbl thead th.on::after{content:attr(data-arrow);margin-left:2px;color:var(--brown)}
  .ftbl thead th.grp{border-left:1px solid var(--line)} .ftbl td.grp{border-left:1px solid var(--grid)}
  .ftbl .stk{position:sticky;background:var(--panel);z-index:1}
  .ftbl thead .stk{z-index:3}
  .ftbl .c0{left:0;width:34px;min-width:34px;color:var(--mute);text-align:right}
  .ftbl .c1{text-align:left;left:34px;min-width:150px;max-width:178px;overflow:hidden;text-overflow:ellipsis;box-shadow:inset -1px 0 0 var(--line)}
  .ftbl td.c1{font-family:var(--sans);font-size:13.5px;font-weight:600}
  .ftbl td.c1 a{color:inherit;text-decoration:none} .ftbl td.c1 a:hover{text-decoration:underline;color:var(--brown)}
  .ftbl td.tx{font-family:var(--sans);color:var(--mute);text-align:left}
  .ftbl tbody tr:hover td{box-shadow:inset 0 1px 0 var(--mute),inset 0 -1px 0 var(--mute)}
  .ftbl tbody tr:hover td.stk{background:color-mix(in srgb,var(--ochre) 14%,var(--panel))}
  .ftbl td.hz{font-weight:600}
  .ftbl td.mu{color:var(--mute)}
  .sip{display:flex;align-items:center;gap:6px;justify-content:flex-end}
  .sip b{font-weight:600;min-width:38px;text-align:right}
  .sbar{position:relative;width:76px;height:12px}
  .sbar u{position:absolute;top:-2px;bottom:-2px;width:1px;background:var(--mute);opacity:.5}
  .sbar i{position:absolute;top:3px;height:6px;border-radius:2px;background:var(--brown);opacity:.85}
  .sbar s{position:absolute;top:5px;height:2px;background:var(--ink);opacity:.35;text-decoration:none}
  .fnote{font-size:12.5px;color:var(--mute);margin-top:8px;max-width:110ch}
  @media (max-width:640px){.ffil input{width:100%}.ffil .cnt{margin-left:0}.fctl .row>span:first-child{min-width:0}}
  </style>
  <header class="fhead">
    <div>
      <h1>The league, by impact</h1>
      <p class="lede"><b style="color:var(--ink)">SiPM</b> = points per 100 possessions a player adds over an average player (offence + defence). Colour marks the numbers that are unusual <i>for a player of his impact</i>: a star scoring 30 is expected; a role player scoring 30 is news. Click any column to sort; click a name for his page. Data through ${dts}.</p>
    </div>
    <div class="fctl">
      <div class="row"><span>Season</span>${seg("fSeason", FS.season, [["2026", "2026-27 so far"], ["2025", "2025-26"]])}</div>
      <div class="row"><span>Colour</span>${seg("fColour", FS.colour, [["surp", "Surprise vs impact"], ["pct", "League percentile"], ["off", "Off"]])}</div>
      <div class="row" id="fExpRow"><span>Expected from</span>${seg("fExp", FS.exp, [["pos", "SiPM + position"], ["imp", "SiPM only"]])}</div>
      <div class="row"><span>Sort stats by</span>${seg("fSortBy", FS.sortBy, [["val", "Number"], ["z", "Colour (surprise)"]])}</div>
    </div>
  </header>
  <section style="padding-top:14px">
    <div class="mhead"><h2 style="font-size:20px" id="fCardH">New this season <span class="mute" style="font:400 14px var(--sans)" id="fCardSub"></span></h2>${seg("fCardsMode", FS.cards, [["new", "New this season"], ["long", "Long-standing outliers"]])}</div>
    <div class="fcards" id="fCards"></div>
  </section>
  <div class="ffil" id="fFil">
    <input id="fQ" type="search" placeholder="Search players" aria-label="Search players" value="${E(FS.q)}">
    <select id="fTeam" aria-label="Team"><option value="">All teams</option>${teams.map(t => `<option ${t === FS.team ? "selected" : ""}>${E(t)}</option>`).join("")}</select>
    ${seg("fPos", FS.pos, [["", "All"], ["G", "G"], ["F", "F"], ["C", "C"]])}
    <select id="fG" aria-label="Minimum games">${[[0, "Any games"], [0.25, "25%+ of games"], [0.5, "50%+ of games"], [0.75, "75%+ of games"]].map(([v, l]) => `<option value="${v}" ${v === FS.gfrac ? "selected" : ""}>${l}</option>`).join("")}</select>
    <select id="fM" aria-label="Minimum minutes per game">${[[0, "Any minutes"], [10, "10+ MPG"], [20, "20+ MPG"], [30, "30+ MPG"]].map(([v, l]) => `<option value="${v}" ${v === FS.mpg ? "selected" : ""}>${l}</option>`).join("")}</select>
    <span class="cnt" id="fCnt"></span>
  </div>
  <div class="flegend" id="fLegend"></div>
  <div class="ftbl" id="fTbl"></div>
  <p class="fnote" id="fNote"></p>`;
  frWire(); frUpdate();
}

function frWire(){
  const segOn = (id, key, num) => { const el = $("#" + id); if (!el) return; el.onclick = e => { const b = e.target.closest && e.target.closest("button"); if (!b) return;
    FS[key] = num ? +b.dataset.v : b.dataset.v; [...el.children].forEach(x => x.setAttribute("aria-pressed", String(x === b))); frUpdate(); }; };
  segOn("fSeason", "season"); segOn("fColour", "colour"); segOn("fExp", "exp"); segOn("fSortBy", "sortBy"); segOn("fPos", "pos"); segOn("fCardsMode", "cards");
  const q = $("#fQ"); if (q) q.oninput = () => { FS.q = q.value; frUpdate(); };
  const t = $("#fTeam"); if (t) t.onchange = () => { FS.team = t.value; frUpdate(); };
  const g = $("#fG"); if (g) g.onchange = () => { FS.gfrac = +g.value; frUpdate(); };
  const m = $("#fM"); if (m) m.onchange = () => { FS.mpg = +m.value; frUpdate(); };
  const tb = $("#fTbl"); if (tb) tb.onclick = e => { const th = e.target.closest && e.target.closest("th[data-k]"); if (!th) return;
    const k = th.dataset.k; if (FS.sort === k) FS.dir = -FS.dir; else { FS.sort = k; FS.dir = ["name", "team", "pos", "rank"].includes(k) ? 1 : -1; } frUpdate(); };
}

// ---- data helpers ----
const frKeys = () => FR.stats.filter(s => s.kind !== "extra").map(s => s.k);
function frRows(){
  const y = FS.season, keys = frKeys();
  const all = FR.rows.map(r => ({ r, b: r.y[y] })).filter(o => o.b && (o.b.r != null || o.b.v));
  // SiPM rank within the season (fixed, not affected by filters)
  [...all].filter(o => o.b.r != null).sort((a, b) => b.b.r - a.b.r).forEach((o, i) => o.rank = i + 1);
  return { all, keys };
}
function frFilter(all){
  const maxg = FR.seasons[FS.season].max_g, q = FS.q.trim().toLowerCase();
  return all.filter(({ r, b }) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    const team = FS.season === "2026" ? r.team : (b.t || r.team);
    if (FS.team && team !== FS.team) return false;
    if (FS.pos && !(r.pos || "").includes(FS.pos)) return false;
    if (FS.gfrac > 0 && (!b.g || b.g < FS.gfrac * maxg)) return false;
    if (FS.mpg > 0 && (!b.v || b.v[0] == null || b.v[0] < FS.mpg)) return false;
    return true;
  });
}
const frZ = b => b && (FS.exp === "pos" ? b.zp : b.z);
const frX = b => b && (FS.exp === "pos" ? b.xp : b.x);
// league percentile among pool players (minutes >= pool floor) for the season, cached
const FR_PCT = {};
function frPct(i, v){
  if (v == null) return null;
  const y = FS.season, key = y + ":" + i;
  if (!FR_PCT[key]) FR_PCT[key] = FR.rows.map(r => r.y[y]).filter(b => b && b.v && b.min >= FR.seasons[y].pool_min && b.v[i] != null).map(b => b.v[i]).sort((a, b) => a - b);
  const a = FR_PCT[key]; if (!a.length) return null;
  let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m; }
  let eq = lo; while (eq < a.length && a[eq] === v) eq++;
  return Math.max(0.5, Math.min(99.5, 100 * (lo + (eq - lo) / 2) / a.length));
}
const frProbit = p => 4.91 * (Math.pow(p, 0.14) - Math.pow(1 - p, 0.14));   // Tukey-lambda approximation
// heat: |z| < 1 near neutral (under 8% tint), about a third at 2 SD, full (55%) from 2.7 SD
function frHeat(z){
  if (z == null || isNaN(z)) return "";
  const a = Math.min(1, Math.max(0, (Math.abs(z) - 0.7) / 2.0)), pct = Math.round(55 * Math.pow(a, 1.1));
  if (pct < 2) return "";
  return `background:color-mix(in srgb,var(${z > 0 ? "--hot" : "--cold"}) ${pct}%,transparent)`;
}
const frF = (v, k) => v == null ? "\u2013" : v.toFixed(1);

function frSentence(k, d){
  const s = F_SENT[k];
  return `${s[0]} ${Math.abs(d).toFixed(1)} ${d > 0 ? s[1] : s[2]} than his impact${FS.exp === "pos" ? " and position" : ""} predict${FS.exp === "pos" ? "" : "s"}`;
}
const frSD = z => `${z > 0 ? "+" : ""}${z.toFixed(1)} SD`;

// Cards. "new": rank by this season's surprise minus his own baseline (minutes-weighted surprise over his prior 3 seasons,
// 300+ minutes each), among cells that glow now (|z| >= 1.5); players with no baseline (rookies, returners) qualify only at |z| >= 3. "long": same sign now and
// before, ranked by the smaller of the two. Only players fans follow: SiPM top 150 or 24+ MPG, half the season's games.
function frCards(rows){
  const keys = frKeys(), sm = FR.seasons[FS.season], floor = sm.pool_min / 2, cand = [], P = FS.exp === "pos" ? "p" : "";
  rows.forEach(o => { const z = frZ(o.b), x = frX(o.b), bs = o.b.base;
    if (!z || !o.b.v || (o.b.min || 0) < floor || (o.b.g || 0) < 0.5 * sm.max_g) return;
    if (!((o.rank && o.rank <= 150) || (o.b.v[0] || 0) >= 24)) return;
    keys.forEach((k, i) => { if (k === "mpg" || z[i] == null || x[i] == null || o.b.v[i] == null) return;
      const bz = bs ? bs["bz" + P][i] : null;
      let score;
      if (FS.cards === "new") score = Math.abs(z[i]) < 1.5 ? 0 : bz != null ? Math.abs(z[i] - bz) * (Math.sign(z[i] - bz) === Math.sign(z[i]) ? 1 : 0) : (Math.abs(z[i]) >= 3 ? Math.abs(z[i]) - 1.5 : 0);
      else score = bz != null && bs.bn >= 2 && Math.sign(bz) === Math.sign(z[i]) ? Math.min(Math.abs(z[i]), Math.abs(bz)) : 0;
      if (score > 0) cand.push({ o, k, i, z: z[i], v: o.b.v[i], x: x[i], bz, score,
        lz: bs ? bs["lz" + P][i] : null, lg: bs ? bs["lg" + P][i] : null, py: bs ? bs.py : null, bn: bs ? bs.bn : 0 }); }); });
  cand.sort((a, b) => b.score - a.score);
  const pick = [], seenP = new Set(), perK = {};
  const PK = ["fgp", "fg3p", "ftp", "ts"];   // percentages: at most one card each and two in all, so counting stats get room
  const take = c => { const isP = PK.includes(c.k); if (seenP.has(c.o.r.id) || (perK[c.k] || 0) >= (isP ? 1 : 2) || (isP && (perK._p || 0) >= 2)) return false;
    pick.push(c); seenP.add(c.o.r.id); perK[c.k] = (perK[c.k] || 0) + 1; if (isP) perK._p = (perK._p || 0) + 1; return true; };
  for (const c of cand) { if (pick.length >= 4) break; if (c.z > 0) take(c); }      // four "more than expected"
  for (const c of cand) { if (pick.length >= 6) break; if (c.z < 0) take(c); }      // two "less than expected"
  for (const c of cand) { if (pick.length >= 6) break; take(c); }                   // top up if one side ran short
  const lab = Object.fromEntries(FR.stats.map(s => [s.k, s.label]));
  return pick.map(c => { const team = FS.season === "2026" ? c.o.r.team : (c.o.b.t || c.o.r.team);
    const unit = F_PCTK.includes(c.k) ? " points" : "", when = c.py == null ? "" : c.py === +FS.season - 1 ? "Last season" : `In ${sname(c.py)}`;
    let then;
    if (FS.cards === "long") then = `Not new: he averaged ${frSD(c.bz)} over his last ${c.bn} seasons.`;
    else if (c.bz == null) then = `No earlier season with enough minutes to compare.`;
    else if (c.lz == null || c.lg == null) then = `His norm before this season: ${frSD(c.bz)}.`;
    else if (Math.abs(c.lz) < 0.5) then = `${when} he was right on it.`;
    else then = `${when} he was ${Math.abs(c.lg).toFixed(1)}${unit} ${c.lg > 0 ? "above" : "below"} it.`;
    return `<div class="fcard ${c.z > 0 ? "hot" : "cold"}">
      <div class="who"><a href="#p-${c.o.r.id}">${E(c.o.r.name)}</a><span>${E(team || "")}</span></div>
      <div class="big">${c.v.toFixed(1)}<small>${E(lab[c.k])}</small></div>
      <div class="s">${frSentence(c.k, c.v - c.x)}. ${then}</div>
      <div class="x">Expected ${c.x.toFixed(1)}${F_PCTK.includes(c.k) ? "" : " a game"} \u00b7 now ${frSD(c.z)}${c.bz != null ? `, ${c.bn}-season norm ${frSD(c.bz)}` : ""} \u00b7 ${c.o.b.g} games</div>
    </div>`; }).join("") || `<p class="empty">No regular in this filter qualifies yet.</p>`;
}

function frUpdate(){
  if (!FR) return;
  const { all, keys } = frRows();
  const rows = frFilter(all);
  const lab = Object.fromEntries(FR.stats.map(s => [s.k, s.label]));
  const kindOf = Object.fromEntries(FR.stats.map(s => [s.k, s.kind]));
  const xi = Object.fromEntries(FR.stats.map((s, i) => [s.k, i]));
  const sm = FR.seasons[FS.season];
  const cur = FS.season === "2026";
  // sort
  const ki = keys.indexOf(FS.sort);
  const val = o => {
    if (ki >= 0) { if (!o.b.v) return null; if (FS.sortBy === "z" && FS.colour !== "off") { if (FS.colour === "pct") return frPct(ki, o.b.v[ki]); const z = frZ(o.b); return z ? z[ki] : null; } return o.b.v[ki]; }
    switch (FS.sort) {
      case "rank": return o.rank ?? null; case "name": return o.r.name.split(" ").slice(1).join(" ") + " " + o.r.name;
      case "team": return (cur ? o.r.team : (o.b.t || o.r.team)) || null; case "pos": return o.r.pos || null; case "age": return o.r.age;
      case "r": return o.b.r; case "o": return o.b.o; case "d": return o.b.d; case "g": return o.b.g ?? null; default: return null; }
  };
  rows.sort((a, b) => { const va = val(a), vb = val(b); if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1;
    return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * FS.dir; });
  // header
  const arrow = FS.dir > 0 ? "\u25b2" : "\u25bc";
  const th = (k, label, cls = "", title = "") => `<th data-k="${k}" class="${cls}${FS.sort === k ? " on" : ""}" data-arrow="${arrow}" title="${E(title)}" ${FS.sort === k ? `aria-sort="${FS.dir > 0 ? "ascending" : "descending"}"` : ""}>${label}</th>`;
  const grpStart = new Set(["mpg", "fgp"]);
  let h = `<table><thead><tr>${th("rank", "#", "stk c0", "SiPM rank this season")}${th("name", "Player", "stk c1 l")}${th("team", "Tm", "l")}${th("pos", "Pos", "l")}${th("age", "Age", "", "Age on Feb 1, 2027")}
    ${th("r", "SiPM", "grp", cur ? "Rest-of-season SiPM projection; whisker = 80% range" : "SiPM at the end of 2025-26")}${th("o", "Off", "", "SiPM offence")}${th("d", "Def", "", "SiPM defence")}${th("g", "G", "grp", "Games played")}
    ${keys.map(k => th(k, lab[k], grpStart.has(k) && k !== "mpg" ? "grp" : "", F_STAT_DESC[k])).join("")}</tr></thead><tbody>`;
  // SiPM bar scale
  const lo = -6, hi = 14, pos = v => Math.max(0, Math.min(100, 100 * (v - lo) / (hi - lo)));
  const z0 = pos(0);
  const n = rows.length, LIMIT = 700;
  for (const o of rows.slice(0, LIMIT)) {
    const { r, b } = o, z = frZ(b), x = frX(b), team = cur ? r.team : (b.t || r.team);
    let sip = "\u2013";
    if (b.r != null) {
      const a = pos(Math.min(b.r, 0)), w = Math.abs(pos(b.r) - z0);
      const wh = b.lo != null ? `<s style="left:${pos(b.lo)}%;width:${Math.max(0.5, pos(b.hi) - pos(b.lo))}%"></s>` : "";
      sip = `<div class="sip"><b>${sgn(b.r)}</b><span class="sbar"><u style="left:${z0}%"></u>${wh}<i style="left:${b.r < 0 ? pos(b.r) : z0}%;width:${w}%;${b.r < 0 ? "background:var(--cold)" : ""}"></i></span></div>`;
    }
    const tip = b.lo != null ? `SiPM ${sgn(b.r)} (80% range ${sgn(b.lo)} to ${sgn(b.hi)}); offence ${sgn(b.o)}, defence ${sgn(b.d)}` : b.r != null ? `SiPM ${sgn(b.r)}; offence ${sgn(b.o)}, defence ${sgn(b.d)}` : "No SiPM this season";
    h += `<tr><td class="stk c0">${o.rank ?? ""}</td><td class="stk c1"><a href="#p-${r.id}">${E(r.name)}</a></td><td class="tx">${E(team || "\u2013")}</td><td class="tx">${E(r.pos || "\u2013")}</td><td>${r.age != null ? r.age.toFixed(1) : "\u2013"}</td>
      <td class="grp" title="${E(tip)}">${sip}</td><td class="mu">${sgn(b.o)}</td><td class="mu">${sgn(b.d)}</td><td class="grp">${b.g ?? "\u2013"}</td>`;
    keys.forEach((k, i) => {
      const v = b.v ? b.v[i] : null, cls = grpStart.has(k) && k !== "mpg" ? "grp" : "";
      let st = "", tt = "", strong = false;
      if (v != null && FS.colour === "surp" && z && z[i] != null) {
        st = frHeat(z[i]); strong = Math.abs(z[i]) >= 2;
        const d = v - x[i], att = kindOf[k] === "pct" && ["fgp", "fg3p", "ftp"].includes(k) ? `, on ${frF(b.v[xi[{ fgp: "fga", fg3p: "fg3a", ftp: "fta" }[k]]])} attempts a game` : "";
        tt = `${lab[k]} ${v.toFixed(1)}${att}. Expected for his impact${FS.exp === "pos" ? " and position" : ""}: ${x[i].toFixed(1)} (${d > 0 ? "+" : ""}${d.toFixed(1)}). Surprise ${z[i] > 0 ? "+" : ""}${z[i].toFixed(1)} SD over ${b.g} games.`;
      } else if (v != null && FS.colour === "surp") {
        tt = `${lab[k]} ${v.toFixed(1)}. Too few attempts or no SiPM to judge.`;
      } else if (v != null && FS.colour === "pct") {
        const p = frPct(i, v); const zz = p == null ? null : frProbit(p / 100);
        st = frHeat(zz); strong = zz != null && Math.abs(zz) >= 2;
        tt = `${lab[k]} ${v.toFixed(1)}: ${p == null ? "\u2013" : Math.round(p)}th percentile among ${FR_PCT[FS.season + ":" + i].length} players with ${sm.pool_min}+ minutes`;
      }
      h += `<td class="${cls}${strong ? " hz" : ""}" style="${st}" title="${E(tt)}">${frF(v, k)}</td>`;
    });
    h += `</tr>`;
  }
  h += `</tbody></table>`;
  $("#fTbl").innerHTML = h;
  $("#fCnt").textContent = `${n} of ${all.length} players`;
  const er = $("#fExpRow"); if (er && er.style) er.style.display = FS.colour === "surp" ? "" : "none";
  // legend
  const sw = zs => `<span class="sw">${zs.map(z => `<i style="${frHeat(z) || "background:transparent"}"></i>`).join("")}</span>`;
  $("#fLegend").innerHTML = FS.colour === "surp"
    ? `<span>Colour = how unusual this number is for a player of his impact${FS.exp === "pos" ? " and position" : ""}:</span><span>less than expected</span>${sw([-3, -2.2, -1.5, 0, 1.5, 2.2, 3])}<span>more than expected</span><span>\u00b7 pale under 1 SD, strong past 2 SD \u00b7 for TOV, red = more turnovers \u00b7 hover a cell for expected vs actual</span>`
    : FS.colour === "pct" ? `<span>Colour = league percentile among players with ${sm.pool_min}+ minutes:</span><span>low</span>${sw([-3, -2.2, -1.5, 0, 1.5, 2.2, 3])}<span>high</span><span>\u00b7 for TOV, red = more turnovers</span>` : `<span>Colour off.</span>`;
  $("#fCardH").firstChild && ($("#fCardH").firstChild.textContent = FS.cards === "new" ? "New this season " : "Long-standing outliers ");
  $("#fCardSub").textContent = `\u00b7 ${sm.label} vs his ${sname(sm.base_seasons[0])} to ${sname(sm.base_seasons[1])} norm, ${FS.exp === "pos" ? "SiPM + position" : "SiPM alone"}; regulars only${FS.team || FS.pos || FS.q ? ", within your filter" : ""}`;
  $("#fCards").innerHTML = frCards(rows);
  const fit = FS.exp === "pos" ? sm.fit_pos : sm.fit;
  $("#fNote").innerHTML = `How the colour works: for each stat, a weighted regression predicts the number from SiPM offence and defence${FS.exp === "pos" ? ", position" : ""} and minutes per game, fitted on the ${sm.pool_n} players with ${sm.pool_min}+ minutes in ${E(sm.label)}. A cell's surprise is the gap between his number and that prediction, divided by the spread expected for a player with his sample size, so a 3-game streak needs a much bigger gap than a full season to light up. Percentages are left uncoloured under ${sm.min_att.fgp} field-goal, ${sm.min_att.fg3p} three-point or ${sm.min_att.ftp} free-throw attempts. How much each stat follows impact (R\u00b2, share of player-to-player spread the prediction explains): ${keys.map(k => `${lab[k]} ${fit[k].r2 != null ? fit[k].r2.toFixed(2) : "\u2013"}`).join(", ")}. Points and usage track impact closely, so only big gaps glow there; steals and three-point % barely track it. SiPM ${cur ? "column = rest-of-season projection (whisker = 80% range)" : "column = rating at the end of 2025-26"}. Box score: NBA regular season, ${cur ? "2026-27 to date" : "2025-26"}; usage estimated game by game from team possessions.`;
}

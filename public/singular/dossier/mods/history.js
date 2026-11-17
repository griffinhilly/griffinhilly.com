// History (item G, 2026-11-16): team-season pages, a team chooser, and pages for retired players. Data: history/ (built by
// scripts/pp_history.py). Routes: #t-<CODE>-<season start year> (e.g. #t-CHI-1995 = 1995-96 Bulls); #teams, #teams-<year>;
// #p-<id> for a player without a current page renders his retired page (show() is wrapped once the page script has loaded).
// Nothing loads at start: teams.json + names.json on the first search focus or team route; t/<year>.json per season viewed;
// p/pNN.json (id % 64) per retired player; his "Impact by age" chart comes from mods/compare.js (traj/tNN.json, pp_traj.py);
// careers/cNN.json (10-game dots, from pp_compare.py) only feeds the fallback chart hxRetChart when compare.js is absent.
const HX = { t: {}, p: {}, c: {}, cd: {}, idx: null, fr: "" };
const HX_ERA = {"1951-72": "1951-52 to 1972-73", "1973-82": "1973-74 to 1982-83", "1983-95": "1983-84 to 1995-96", "1996-2006": "1996-97 to 2006-07", "2007-26": "2007-08 to 2025-26"};
const HX_NSHARD = 64;   // = pp_history.py NPSHARD
// 2026-11-16 (DISPLAY lane): HX_ASC = season tables oldest first (Griffin: "like everybody else does it"); docs with ap = 1
// (pp_history.py AS_PLAYED) show the "as played" rating from 1996-97 on and, on retired pages, the old value as "Forecast for next season".
// HX_ASC false and docs without ap = the page before this change.
const HX_ASC = true;
const HX_DF = true;  // DOSSIER_FIRST (2026-11-16): the header link to the hub page reads "Impact by age"; false = "Singular page"
// CHARTVIEW 2026-11-17 (Griffin: Robinson's all-time best five +9.4 vs his chart under +8): docs with iv = 1 (pp_history.py HX_VIEW)
// follow the all-time table's opening view. Header Best season / Best five / Career = the table's figures, "*" only where a figure
// includes the estimated lineup part (star letters b / 5 / c), with its 80% range and "best available" when that differs by 0.1+;
// season rows before 1996-97 flagged r[14] = 1 show the table's value with the best-available value r[13] beneath when it differs
// by 0.1+. HX_VIEW_MARK false, or docs without iv = the page as before.
const HX_VIEW_MARK = true;
const HX_IV_READ = "Seasons before 1996-97 (marked *) add an estimated lineup part to his box-score rating: what the box score misses, mostly defence, as the all-time table's opening view does. There is no lineup data before then.";
const HX_AP_NOTE = "As played = his rating for that season itself: that season's lineup results, shrunk toward his box-score rating (from 1996-97). Forecast for next season = his Singular SiPM at the end of that season, which projects the following season and so includes the expected change with age.";
const HXCSS = `
.hx-nav{display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;margin-top:14px;font-size:14px;color:var(--mute)}
.hx-nav a,.hx-lk{color:var(--cold)}
.hx-tl{color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}
.hx-champ{font:600 11px var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--ochre);border:1px solid color-mix(in srgb,var(--ochre) 55%,var(--line));padding:1px 6px;border-radius:4px;white-space:nowrap}
.hx-bar{position:relative;width:84px;height:9px;background:var(--grid);border-radius:3px;display:inline-block;vertical-align:middle;margin-right:7px}
.hx-bar i{position:absolute;top:0;bottom:0;border-radius:3px}
.hx-bar u{position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:var(--ink);opacity:.35}
.hx-tbl td.l a{font-family:var(--sans)}
.hx-tbl td.l{font-family:var(--sans)}
.hx-tbl tr.tot td{font-weight:600;border-top:2px solid var(--line)}
.hx-why{max-width:74ch;font-size:15px;margin:14px 0 0}
.hx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:12px}
.hx-card{display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding:8px 11px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);text-decoration:none;font-size:14px}
.hx-card:hover{border-color:var(--mute)}
.hx-card span{font:13px var(--mono);color:var(--mute);white-space:nowrap}
.hx-sel{display:flex;gap:8px 14px;flex-wrap:wrap;align-items:center;margin:16px 0 4px;font-size:14px;color:var(--mute)}
.hx-key{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:6px}
.hx-key svg{vertical-align:middle;margin-right:4px}
`;

function hxGet(u){ return fetch(u).then(r => { if (r.ok === false) throw new Error(`${r.status} ${u}`); return r.json(); }); }
function hxMemo(o, k, u){ if (!o[k]) o[k] = hxGet(u).catch(e => { delete o[k]; throw e; }); return o[k]; }
const hxTeams = () => hxMemo(HX, "teamsP", "history/teams.json");
const hxNames = () => hxMemo(HX, "namesP", "history/names.json");
const hxSeason = y => hxMemo(HX.t, y, `history/t/${y}.json`);
const hxShard = id => hxMemo(HX.p, id % HX_NSHARD, `history/p/p${String(id % HX_NSHARD).padStart(2, "0")}.json`);
const hxDots = id => hxMemo(HX.c, id % 64, `careers/c${String(id % 64).padStart(2, "0")}.json`).then(s => { HX.cd[id % 64] = s; return s[id] || []; });
const hxS = v => v == null ? "\u2013" : Math.abs(v) < 0.05 ? "0.0" : sgn(v);   // no "-0.0"
const hxF1 = v => v == null ? "\u2013" : v.toFixed(1);
const hxInt = v => v == null ? "\u2013" : Math.round(v).toLocaleString("en-US");
const hxRec = (w, l) => w == null ? "\u2013" : `${w}-${l}`;
const hxHt = h => h ? `${Math.floor(h/12)}\u2032${Math.round(h%12)}\u2033` : null;
function hxEraKey(y){ return y <= 1972 ? "1951-72" : y <= 1982 ? "1973-82" : y <= 1995 ? "1983-95" : y <= 2006 ? "1996-2006" : "2007-26"; }
function hxBar(v, span){
  if (v == null) return `<span class="hx-bar" aria-hidden="true"><u></u></span>`;
  const t = Math.max(-1, Math.min(1, v / span)), w = Math.abs(t) * 50;
  return `<span class="hx-bar" aria-hidden="true"><u></u><i style="left:${t < 0 ? 50 - w : 50}%;width:${w}%;background:${t < 0 ? "var(--cold)" : "var(--hot)"}"></i></span>`;
}
function hxTeamLinks(codes, y){
  return String(codes || "").split("/").map(c => /^[A-Z]{3}$/.test(c) ? `<a class="hx-tl" href="#t-${c}-${y}">${c}</a>` : E(c)).join(" / ") || "\u2013";
}
function hxEraNote(y){
  if (y >= 2007) return "";
  if (y >= 1996) return "1996-97 to 2006-07: full SiPM, fitted with the model's final weights (approximate).";
  return "* Before 1996-97 there is no lineup data, so these ratings (SiPM*) are an estimate: each player's box-score rating, adjusted for how his teams did in games with and without him. They are rougher than the modern number."
    + (y <= 1972 ? " Before 1973-74 steals, blocks and turnovers were not recorded, so defence is mostly invisible here: great defenders, big men above all, are understated." : "");
}

/* ---------- routing ---------- */
function hxHere(h){ return typeof location === "undefined" || location.hash.toLowerCase() === h.toLowerCase(); }
function hxRoute(){
  const h = (typeof location !== "undefined" && location.hash) || "";
  let m = /^#t-([A-Za-z]{3})-(\d{4})$/.exec(h);
  if (m) { hxTeamPage(m[1].toUpperCase(), +m[2]); return true; }
  m = /^#teams(?:-(\d{4}))?$/.exec(h);
  if (m) { hxChooserPage(m[1] ? +m[1] : null); return true; }
  return false;
}
// a player id without a current page -> his retired page (installed once the page script has defined show())
function hxInstall(){
  if (typeof window === "undefined" || window.__hxShow || typeof show !== "function") return;
  const orig = show; window.__hxShow = orig;
  window.show = async function(id){
    if (typeof META !== "undefined" && META && META.players && !META.players.some(p => p.id === id)) {
      let doc = null;
      try { doc = (await hxShard(id))[id] || null; } catch (e) { doc = null; }
      if (doc) { if (hxHere(`#p-${id}`)) hxRetiredPage(id, doc); return; }
    }
    // load his shard first, then skip the render if the reader has already moved to another page (stale render guard)
    if (typeof shard === "function") { try { await shard(id); } catch (e) { /* show() reports it */ } }
    if (typeof location !== "undefined" && location.hash.length > 1 && location.hash !== `#p-${id}`) return;
    return orig.apply(this, arguments);
  };
}

/* ---------- team season ---------- */
function hxResolve(code, y, S, T){
  if (S[code]) return code;
  const al = {PHO: "PHX", BRK: "BKN", CHO: "CHA", NOH: "NOK", NOK: "NOH"}[code];
  if (al && S[al]) return al;
  let fr = null;
  for (const rows of Object.values(T.seasons)) { const r = rows.find(r => r[0] === code); if (r) { fr = r[4]; break; } }
  if (!fr && T.fr[code]) fr = code;
  if (!fr) return null;
  return Object.keys(S).find(c => S[c].fr === fr) || null;
}
async function hxTeamPage(code, y){
  CUR = null;
  $("#app").innerHTML = `<p class="empty">Loading ${E(sname(y))}\u2026</p>`;
  let S, T;
  try { [S, T] = await Promise.all([hxSeason(y), hxTeams()]); }
  catch (e) { $("#app").innerHTML = `<style>${HXCSS}</style><p class="empty">No team data for ${E(sname(y))} (${E(e.message)}). <a class="hx-lk" href="#teams">Choose a team season</a>.</p>`; return; }
  if (!hxHere(`#t-${code}-${y}`)) return;
  const c = hxResolve(code, y, S, T);
  if (!c) { $("#app").innerHTML = hxChooserHTML(y, T, `No ${E(code)} team in ${E(sname(y))}. The teams that season:`); hxWireChooser(T); return; }
  $("#app").innerHTML = hxTeamHTML(c, y, S[c], T);
  hxWireTeam(c, y, S, T);
  window.scrollTo(0, 0);
}
function hxTeamHTML(c, y, d, T){
  const M = T.meta || {}, fit = (M.fit || {})[hxEraKey(Math.min(y, M.cur - 1))] || null;
  const pre = y < 1996, cur = y >= M.cur;
  const yrs = Object.keys(T.seasons).map(Number).sort((a, b) => a - b);
  const fs = yrs.filter(s => T.seasons[s].some(r => r[4] === d.fr));
  const i = fs.indexOf(y), prev = i > 0 ? fs[i - 1] : null, next = i >= 0 && i < fs.length - 1 ? fs[i + 1] : null;
  const codeIn = s => (T.seasons[s].find(r => r[4] === d.fr) || [c])[0];
  const pct = d.w != null && d.w + d.l ? (d.w / (d.w + d.l)).toFixed(3).replace(/^0/, "") : null;
  // rating columns first after the name, so a phone shows them without sideways scrolling
  const ths = `<tr><th class="l">Player</th><th title="Minutes for this team">Min</th><th class="l" title="${d.ap && !pre && !cur ? "As played: his rating for that season itself, points per 100 possessions above an average player" : "Singular SiPM for his season: points per 100 possessions above an average player"}">${d.ap && !cur && !pre ? "As played" : "Rating"}${pre ? "*" : ""}</th><th title="Offence part of the rating">Off</th><th title="Defence part of the rating">Def</th><th title="Rating x his share of the team's minutes (five players at a time)">Adds</th><th title="Age on Feb 1 of the season">Age</th><th title="Games played for this team">G</th><th title="Minutes per game">MPG</th><th>PTS</th><th>REB</th><th>AST</th></tr>`;
  const body = d.rows.map(r => {
    const [id, nm, age, g, mn, pts, reb, ast, rr, ro, rd, con, lk] = r;
    const name = lk ? `<a class="hx-tl" href="#p-${id}">${E(nm)}</a>` : E(nm);
    return `<tr><td class="l">${name}</td><td>${hxInt(mn)}</td><td class="l">${hxBar(rr, 6)}<b>${hxS(rr)}</b></td><td>${hxS(ro)}</td><td>${hxS(rd)}</td><td>${hxS(con)}</td>`
      + `<td>${age ?? "\u2013"}</td><td>${g}</td><td>${g ? (mn / g).toFixed(1) : "\u2013"}</td><td>${hxF1(pts)}</td><td>${hxF1(reb)}</td><td>${hxF1(ast)}</td></tr>`;
  }).join("");
  const tot = `<tr class="tot"><td class="l">Team: ratings added up</td><td>${hxInt(d.tmin)}</td><td class="l"></td><td></td><td></td><td>${hxS(d.est)}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
  const seasonOpts = yrs.slice().reverse().map(s => `<option value="${s}"${s === y ? " selected" : ""}>${sname(s)}</option>`).join("");
  const teamOpts = T.seasons[y].slice().sort((a, b) => a[1].localeCompare(b[1])).map(r => `<option value="${r[0]}"${r[0] === c ? " selected" : ""}>${E(r[1])}</option>`).join("");
  const unr = d.rated != null && d.rated < 0.995 ? ` ${Math.round(100 * (1 - d.rated))}% of the team's minutes belong to players Singular does not rate; they count as 0 (average).` : "";
  const why = fit ? `They need not match. Each rating is pulled toward average until the evidence is strong, so ratings spread less than real results; luck, injuries and how players fit together also move the real margin.${pre ? " Before 1996-97 the ratings themselves use team results with and without each player, so they are partly built from these same results." : ""} Across the ${fit.n} team seasons from ${HX_ERA[hxEraKey(Math.min(y, M.cur - 1))]}, the two agree closely (correlation ${fit.r.toFixed(2)}), but compressed: a team that really outscored its opponents by 10 points per 100 possessions adds up to about +${(10 * fit.slope).toFixed(0)} above the average team.` : "";
  return `<style>${HXCSS}</style>
  <header class="hero">
    <div>
      <div class="brand" style="color:var(--mute)">Team season \u00b7 <a class="hx-lk" href="#teams-${y}">all ${sname(y)} teams</a></div>
      <h1>${sname(y)} ${E(d.n)}</h1>
      <div class="meta"><span>Record <b>${hxRec(d.w, d.l)}</b>${pct ? ` (${pct})` : ""}${cur ? " so far" : ""}</span><span>Margin <b>${hxS(d.mov)}</b> points a game</span>${d.nrtg != null ? `<span>Net rating <b>${hxS(d.nrtg)}</b> per 100 possessions</span>` : ""}${d.champ ? `<span class="hx-champ">NBA champions</span>` : ""}</div>
      <div class="hx-nav">${prev ? `<a href="#t-${codeIn(prev)}-${prev}">\u2190 ${sname(prev)}</a>` : ""}${next ? `<a href="#t-${codeIn(next)}-${next}">${sname(next)} \u2192</a>` : ""}
        <label>Team <select id="hxTeam" aria-label="Team">${teamOpts}</select></label><label>Season <select id="hxSeason" aria-label="Season">${seasonOpts}</select></label></div>
    </div>
    <div class="figs">
      <div class="fig big"><div class="k">Player ratings added up</div><div class="v">${hxS(d.est)}</div><div class="s">each player's rating \u00d7 his share of the team's minutes (five on the floor)</div></div>
      <div class="fig"><div class="k">Average team, same sum</div><div class="v">${hxS(d.lg)}</div><div class="s">${sname(y)}: the scale's zero is an average player, and the players who get minutes rate above it</div></div>
      <div class="fig"><div class="k">This roster vs average</div><div class="v">${hxS(d.rel)}</div><div class="s">what the ratings say, per 100 possessions</div></div>
      <div class="fig"><div class="k">What really happened</div><div class="v">${hxS(d.nrtg)}</div><div class="s">net rating: points scored minus allowed per 100 possessions${cur ? ", so far" : ""}</div></div>
    </div>
  </header>
  ${why ? `<p class="hx-why">${why}</p>` : ""}
  <section class="mod" id="hx-roster"><div class="mhead"><h2>Roster and ratings</h2><span class="note">sorted by minutes; click a name for his page</span></div>
    <div class="tbl"><table class="hx-tbl"><thead>${ths}</thead><tbody>${body}${tot}</tbody></table></div>
    <p class="note" style="margin-top:8px">${d.ap && !pre && !cur ? `As played = the player's own rating for his whole season (all his teams): that season's lineup results, shrunk toward his box-score rating; not SiPM's end-of-season number, which projects the next season. Points per 100 possessions above an average player of that season; offence + defence = rating.` : "Rating = Singular SiPM for the player's whole season (all his teams), points per 100 possessions above an average player of that season; offence + defence = rating."}${cur ? ` 2026-27 is in progress: ratings are each player's current rating (Singular's rest-of-season projection); games and minutes are to date${M.data_through ? ` (through ${E(M.data_through)})` : ""}.` : ""} PTS, REB, AST per game for this team.${unr} ${hxEraNote(y)}</p>
    <p class="note">Rosters, minutes and box lines: Basketball-Reference season totals${y >= M.cur ? "; 2026-27 from NBA box scores" : ""}. Record, margin and net rating: ${d.src === "db" ? "NBA box scores (net rating = margin per 100 possessions)" : "Basketball-Reference"}.</p>
  </section>
  <footer>Ratings: Singular SiPM. History pages built ${E(M.built || "")}.</footer>`;
}
function hxWireTeam(c, y, S, T){
  const ts = document.querySelector("#hxTeam"), ss = document.querySelector("#hxSeason");
  if (ts) ts.onchange = () => { location.hash = `t-${ts.value}-${y}`; };
  if (ss) ss.onchange = () => { const s = +ss.value, fr = S[c].fr, r = (T.seasons[s] || []).find(r => r[4] === fr);
    location.hash = r ? `t-${r[0]}-${s}` : `teams-${s}`; };
}

/* ---------- chooser ---------- */
async function hxChooserPage(y){
  CUR = null;
  let T;
  try { T = await hxTeams(); } catch (e) { $("#app").innerHTML = `<p class="empty">Could not load the team list (${E(e.message)}).</p>`; return; }
  if (!/^#teams/.test(location.hash)) return;
  $("#app").innerHTML = hxChooserHTML(y, T, "");
  hxWireChooser(T);
  window.scrollTo(0, 0);
}
function hxChooserHTML(y, T, msg){
  const yrs = Object.keys(T.seasons).map(Number).sort((a, b) => b - a);
  if (!y || !T.seasons[y]) y = T.meta.cur - 1;
  const cards = T.seasons[y].map(r => `<a class="hx-card" href="#t-${r[0]}-${y}"><b>${E(r[1])}</b><span>${hxRec(r[2], r[3])}${r[5] ? " \u2605" : ""}</span></a>`).join("");
  const frs = Object.entries(T.fr).sort((a, b) => a[1].localeCompare(b[1]));
  let frList = "";
  if (HX.fr && T.fr[HX.fr]) {
    const ss = yrs.filter(s => T.seasons[s].some(r => r[4] === HX.fr));
    frList = `<div class="tbl" style="margin-top:10px;max-height:520px"><table class="hx-tbl"><thead><tr><th class="l">Season</th><th class="l">Team</th><th>Record</th><th class="l"></th></tr></thead><tbody>${ss.map(s => {
      const r = T.seasons[s].find(r => r[4] === HX.fr);
      return `<tr><td class="l"><a class="hx-tl" href="#t-${r[0]}-${s}">${sname(s)}</a></td><td class="l">${E(r[1])}</td><td>${hxRec(r[2], r[3])}</td><td class="l">${r[5] ? `<span class="hx-champ">champions</span>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  const famous = [["CHI", 1995, "1995-96 Bulls"], ["BOS", 1964, "1964-65 Celtics"], ["BOS", 1985, "1985-86 Celtics"], ["LAL", 1986, "1986-87 Lakers"], ["PHI", 1966, "1966-67 76ers"], ["MIL", 1970, "1970-71 Bucks"], ["GSW", 2016, "2016-17 Warriors"], ["SAS", 2013, "2013-14 Spurs"]]
    .filter(([c, s]) => (T.seasons[s] || []).some(r => r[0] === c)).map(([c, s, l]) => `<button data-h="t-${c}-${s}">${E(l)}</button>`).join("");
  return `<style>${HXCSS}</style>
  <header style="padding-block:28px 6px"><h1>Team seasons</h1>
    <p class="lede" style="margin-top:8px">Every NBA team since 1951-52, with each player's rating that season and how the ratings add up against what the team really did.${msg ? `<br><b style="color:var(--ink)">${msg}</b>` : ""}</p>
    <div class="quick" id="hxFamous" style="margin-top:6px">${famous}</div></header>
  <section class="mod" style="padding-top:14px"><div class="mhead"><h2>By season</h2></div>
    <div class="hx-sel"><label>Season <select id="hxCSeason" aria-label="Season">${yrs.map(s => `<option value="${s}"${s === y ? " selected" : ""}>${sname(s)}</option>`).join("")}</select></label><span>${T.seasons[y].length} teams, best record first; \u2605 = champions</span></div>
    <div class="hx-grid">${cards}</div></section>
  <section class="mod"><div class="mhead"><h2>By franchise</h2></div>
    <div class="hx-sel"><label>Franchise <select id="hxCFr" aria-label="Franchise"><option value="">Choose a franchise</option>${frs.map(([k, n]) => `<option value="${k}"${k === HX.fr ? " selected" : ""}>${E(n)}</option>`).join("")}</select></label><span>every season, including earlier cities and names</span></div>
    ${frList}</section>
  <footer>Records: Basketball-Reference to 2023-24, NBA box scores after. ${T.meta.n_team_seasons.toLocaleString("en-US")} team seasons.</footer>`;
}
function hxWireChooser(T){
  const s = document.querySelector("#hxCSeason"), f = document.querySelector("#hxCFr"), fm = document.querySelector("#hxFamous");
  if (s) s.onchange = () => { location.hash = `teams-${s.value}`; };
  if (f) f.onchange = () => { HX.fr = f.value; const y = s ? +s.value : null; $("#app").innerHTML = hxChooserHTML(y, T, ""); hxWireChooser(T);
    const sel = document.querySelector("#hxCFr"); if (sel) sel.focus(); };
  if (fm) fm.onclick = e => { const b = e.target.closest("button"); if (b) location.hash = b.dataset.h; };
}

/* ---------- retired player ---------- */
// TRAJ 2026-11-16: with mods/compare.js loaded, a retired page draws the same "Impact by age" chart as current pages (smoothed
// trajectory, ~10-game dots, playoff series, similar careers, "+ add any player"); hxRetChart stays as the fallback without it.
function hxRetiredPage(id, doc){
  CUR = null; HX.ret = {id, doc};
  const cmp = typeof modCompare === "function";
  const k = id % 64, have = cmp ? null : HX.cd[k] ? HX.cd[k][id] || [] : null;
  $("#app").innerHTML = hxRetiredHTML(id, doc, have);
  if (cmp && typeof cmpWire === "function") cmpWire();
  window.scrollTo(0, 0);
  if (!cmp && !have) hxDots(id).then(ds => {
    const el = document.querySelector("#hx-chart");
    if (el && hxHere(`#p-${id}`)) el.innerHTML = hxRetChart(doc, ds);
  }).catch(() => {});
}
// compare.js calls this when his trajectory shard or careers.json arrives, or a chart control changes
function hxRetRerender(id){
  if (!HX.ret || HX.ret.id !== id || !hxHere(`#p-${id}`)) return;
  $("#app").innerHTML = hxRetiredHTML(id, HX.ret.doc);
  if (typeof cmpWire === "function") cmpWire();
}
// a retired player in the shape modCompare reads (season rows, bio, similar careers from his traj shard)
function hxPseudo(id, doc){
  const t = cmpTraj(id), by = CMPCAR ? CMPCAR.by : {}, wait = String.fromCharCode(8230);
  const sug = t && t.sug ? t.sug.filter(x => !CMPCAR || by[x[0]]).map(x => [x[0], (by[x[0]] || [0, wait])[1], x[1], x[2]]) : [];
  return {id, name: doc.n, retired: true, cmpReady: !!t, bio: {birth_date: (doc.b || [])[0] || null}, proj_path: [],
          seasons: doc.s.filter(r => r[5] != null).map(r => ({season: r[0], r: r[5], min: r[4] || 0})),
          cmp: {sug, tier: t ? t.tier || "" : "", posg: (by[id] || [])[2] || "", ghost: [],
                 cn: t && t.cn ? t.sug.slice(0, t.cn).filter(x => !CMPCAR || by[x[0]]).length : 0}};   // COMPS 2026-11-16: hand-picked count (pp_traj "cn")
}
function hxRetChart(doc, dots){
  const app = typeof document !== "undefined" && document.querySelector ? document.querySelector("#app") : null;
  const W = Math.round(Math.max(340, Math.min(1000, (app && app.clientWidth) || 1000))), H = W < 600 ? 270 : 330;
  const L = 34, R = 12, T = 14, B = 30;
  const ss = doc.s.filter(r => r[5] != null && r[2] != null), lp = doc.lp || [];
  if (!ss.length && !lp.length) return `<p class="empty">No rated seasons.</p>`;
  const ages = ss.map(r => r[2]).concat(lp.map(r => r[1]).filter(a => a != null));
  const a0 = Math.floor(Math.min(...ages)) - 0.5, a1 = Math.ceil(Math.max(...ages)) + 0.5;
  const vals = ss.map(r => r[5]).concat(lp.flatMap(r => [r[2] + 1.2816 * r[3], r[2] - 1.2816 * r[3]]));
  const lo = Math.min(0, Math.floor(Math.min(...vals) / 2) * 2), hi = Math.max(4, Math.ceil(Math.max(...vals) / 2) * 2);
  const X = a => L + (a - a0) / (a1 - a0) * (W - L - R), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const cl = v => Math.max(lo, Math.min(hi, v));
  let g = "";
  for (let v = lo; v <= hi; v += 2) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"${v === 0 ? ' stroke="var(--mute)" stroke-opacity=".6"' : ""}/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v > 0 ? "+" : v < 0 ? "\u2212" : ""}${Math.abs(v)}</text>`;
  const step = a1 - a0 > 16 ? 4 : 2;
  for (let a = Math.ceil(a0 / step) * step; a <= a1; a += step) g += `<text x="${X(a)}" y="${H - 10}" text-anchor="middle">${a}</text>`;
  g += `<text x="${W - R}" y="${H - 10}" text-anchor="end" class="lab" style="fill:var(--mute)">age</text>`;
  if (hi >= 4) g += `<line x1="${L}" x2="${W - R}" y1="${Y(4)}" y2="${Y(4)}" stroke="var(--ochre)" stroke-dasharray="4 4" stroke-opacity=".8"/>`;
  if (dots && dots.length) g += dots.filter(p => p[0] >= a0 && p[0] <= a1 && p[1] >= lo && p[1] <= hi).map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="1.7" fill="var(--mute)" fill-opacity=".32"/>`).join("");
  if (lp.length) {
    const up = lp.map(r => `${X(r[1]).toFixed(1)},${Y(cl(r[2] + 1.2816 * r[3])).toFixed(1)}`), dn = lp.slice().reverse().map(r => `${X(r[1]).toFixed(1)},${Y(cl(r[2] - 1.2816 * r[3])).toFixed(1)}`);
    g += `<polygon points="${up.concat(dn).join(" ")}" fill="var(--purple)" fill-opacity=".14"/>`;
    g += `<polyline points="${lp.map(r => `${X(r[1]).toFixed(1)},${Y(cl(r[2])).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--purple)" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  g += ss.map(r => { const rad = 2.5 + 5.5 * Math.sqrt(Math.min(1, (r[4] || 0) / 3300));
    return `<circle cx="${X(r[2]).toFixed(1)}" cy="${Y(cl(r[5])).toFixed(1)}" r="${rad.toFixed(1)}" fill="${dcol(r[5], 6)}" stroke="var(--panel)" stroke-width="1.2"><title>${sname(r[0])}, age ${Math.round(r[2])}: ${hxS(r[5])}${r[0] < 1996 ? "*" : ""} (${hxInt(r[4])} min, ${E(r[1])})</title></circle>`; }).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(doc.n)}: rating by age">${g}</svg>
  <div class="hx-key"><span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="var(--hot)"/></svg>season rating (bigger = more minutes)</span>
  ${dots && dots.length ? `<span><svg width="14" height="14"><circle cx="7" cy="7" r="2" fill="var(--mute)" fill-opacity=".5"/></svg>10-game form (box score, shifted to the season rating)</span>` : dots ? "" : `<span>loading 10-game form\u2026</span>`}
  ${lp.length ? `<span><svg width="22" height="12"><rect x="0" y="2" width="22" height="8" fill="var(--purple)" fill-opacity=".18"/><line x1="0" x2="22" y1="6" y2="6" stroke="var(--purple)" stroke-width="2.4"/></svg>latent career path, 80% band (experimental)</span>` : ""}
  ${hi >= 4 ? `<span><svg width="22" height="12"><line x1="0" x2="22" y1="6" y2="6" stroke="var(--ochre)" stroke-dasharray="4 4"/></svg>+4</span>` : ""}</div>`;
}
// HX_VIEW_MARK: the season table's note for a doc on the all-time table's opening view (replaces hxEraNote there)
function hxIvNote(y){
  if (y >= 1996) return hxEraNote(y);
  return "* Before 1996-97 there is no lineup data. These ratings add an estimated lineup part (what the box score misses, mostly defence) to his box-score rating, as the all-time table's opening view does; \u201cbest available\u201d beneath, where it differs by 0.1 or more, is the box-score rating adjusted for how his teams did with and without him. Off and Def split the best-available rating."
    + (y <= 1972 ? " Before 1973-74 steals, blocks and turnovers were not recorded, so defence is mostly invisible in the box score: great defenders, big men above all, are understated." : "");
}
function hxRetiredHTML(id, doc, dots){
  const c = doc.c || {}, cb = doc.cb || {}, b = doc.b || [], dk = doc.dk;
  const first = c.first ?? (doc.s[0] || [])[0], last = c.last ?? (doc.s[doc.s.length - 1] || [])[0];
  const pre = doc.s.some(r => r[0] < 1996);
  const ht = hxHt(b[1]);
  const draft = b[2] ? (b[3] ? `${b[2]} \u00b7 pick ${b[3]}` : `${b[2]} \u00b7 undrafted`) : null;
  const st = pre ? "*" : "";
  // HX_VIEW_MARK: figures as the all-time table's opening view prints them (star per figure, 80% range, best available)
  const iv = HX_VIEW_MARK && !!doc.iv, cst = c.star || "", cf = doc.cf || {};
  const stF = fl => iv ? (cst.includes(fl) ? "*" : "") : st;
  const ivB = (k, fl, season) => { if (!iv) return ""; const bb = [];
    if (cst.includes(fl) && c[k + "_lo"] != null) bb.push(`80%: ${hxS(c[k + "_lo"])} to ${hxS(c[k + "_hi"])}`);
    if (c[k] != null && cf[k] != null && Math.abs(Math.round((c[k] - cf[k]) * 100) / 100) >= 0.1)
      bb.push(`best available ${hxS(cf[k])}${season && cf.best_season != null && cf.best_season !== c.best_season ? ` (${sname(cf.best_season)})` : ""}`);
    return bb.length ? "<br>" + bb.join(" \u00b7 ") : ""; };
  const fig = (k, v, s, cls = "") => `<div class="fig ${cls}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const figs = [
    fig(`Best season${stF("b")}`, hxS(c.best), c.best_season != null ? `${sname(c.best_season)}${c.best_age != null ? `, age ${Math.round(c.best_age)}` : ""}${ivB("best", "b", true)}${cb.best != null ? `<br>box score only: ${hxS(cb.best)}` : ""}` : "", "big"),
    fig(`Best five seasons${stF("5")}`, hxS(c.best5), "consecutive, 1,000+ minutes each" + ivB("best5", "5")),
    fig(`Career${stF("c")}`, hxS(c.career), `minutes-weighted, ${c.q_seasons ?? 0} season${c.q_seasons === 1 ? "" : "s"} of 1,000+ minutes${ivB("career", "c")}`),
    dk ? fig(`Sustained peak <span class="new">experimental</span>`, hxS(dk[0]), `${sname(dk[3])} to ${sname(dk[4])}; 80% range ${hxS(dk[1])} to ${hxS(dk[2])}`)
       : fig("Games", hxInt(c.gp), `${hxInt(c.min)} minutes \u00b7 ${c.seasons ?? doc.s.length} seasons`)].join("");
  const ap = !!doc.ap;
  const rows = (HX_ASC ? doc.s.slice() : doc.s.slice().reverse()).map(r => {
    const [y, tm, age, g, mn, rr, ro, rd, rb, pts, reb, ast, fc] = r;
    const ba = iv && r[14] === 1 && r[13] != null && rr != null && Math.abs(Math.round((rr - r[13]) * 100) / 100) >= 0.1   // HX_VIEW_MARK
      ? `<br><span class="mute" style="font-size:12px;margin-left:91px">best available ${hxS(r[13])}</span>` : "";
    return `<tr><td class="l">${sname(y)}</td><td class="l">${hxTeamLinks(tm, y)}</td><td class="l">${hxBar(rr, 6)}<b>${hxS(rr)}${rr != null && y < 1996 ? "*" : ""}</b>${ba}</td><td>${hxS(ro)}</td><td>${hxS(rd)}</td>${ap ? `<td>${y >= 1996 ? hxS(fc) : "–"}</td>` : ""}<td>${hxS(rb)}</td>`
      + `<td>${age != null ? Math.floor(age) : "\u2013"}</td><td>${g ?? "\u2013"}</td><td>${hxInt(mn)}</td><td>${hxF1(pts)}</td><td>${hxF1(reb)}</td><td>${hxF1(ast)}</td></tr>`;
  }).join("");
  const shape = dk ? `<section class="mod" id="hx-shape"><div class="mhead"><h2>Career shape <span class="new">experimental</span></h2></div>
    <p class="lede">A new measure (November 2026), still under review. It treats each season's rating as a noisy reading of his true level, with short seasons counting less, and smooths the readings into one path${typeof LINE_MODE !== "undefined" && LINE_MODE === "dots" ? " (not the line on the chart above, which averages his ten-game ratings)" : ": the purple line above"}. "Sustained peak" is the level he reached and held, the average of that path over his best five straight seasons.</p>
    <div class="figs" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      ${fig("Sustained peak", hxS(dk[0]), `${sname(dk[3])} to ${sname(dk[4])} \u00b7 80% range ${hxS(dk[1])} to ${hxS(dk[2])}`)}
      ${fig("Seasons at +4 or better", dk[5] ?? "\u2013", dk[5] ? `ages ${dk[6]} to ${dk[7]} (his path above +4)` : "his path never reached +4")}
      ${fig("Career score rank", dk[9] != null ? `#${dk[9]}` : "\u2013", dk[9] != null ? `of ${hxInt(dk[13])} players (current and retired) with five or more rated seasons; 80% range #${dk[10]} to #${dk[11]}. Score = sustained peak + 0.1 for each full season above +4 (${hxF1(dk[8])})` : "not ranked: fewer than five rated seasons")}
    </div></section>` : "";
  return `<style>${HXCSS}</style>
  <header class="hero">
    <div>
      <div class="brand" style="color:var(--mute)">Retired \u00b7 ${first != null ? `${sname(first)} to ${sname(last)}` : ""}</div>
      <h1>${E(doc.n)}</h1>
      <div class="meta">${ht ? `<span>Height <b>${ht}</b></span>` : ""}${draft ? `<span>Draft <b>${draft}</b></span>` : ""}<span>Games <b>${hxInt(c.gp)}</b></span><span>Minutes <b>${hxInt(c.min)}</b></span>${doc.slug ? `<span><a class="hx-lk" href="/singular/p/${encodeURIComponent(doc.slug)}/"${HX_DF ? ` title="His rating by age with the season-by-season trajectory (Singular page)"` : ""}>${HX_DF ? "Impact by age" : "Singular page"}</a></span>` : ""}</div>
      <p class="read">Ratings are points per 100 possessions above an average player of his own season. ${pre ? (iv ? HX_IV_READ : "Seasons before 1996-97 (marked *) are estimates from the box score and from how his teams did with and without him; there is no lineup data before then.") : ""}</p>
    </div>
    <div class="figs">${figs}</div>
  </header>
  ${typeof modCompare === "function" ? modCompare(hxPseudo(id, doc)) : `<section class="mod" id="hx-traj"><div class="mhead"><h2>Trajectory</h2><span class="note">rating by age</span></div>
    <div id="hx-chart">${hxRetChart(doc, dots)}</div></section>`}
  ${shape}
  <section class="mod" id="hx-seasons"><div class="mhead"><h2>Season by season</h2><span class="note">click a team for that team season</span></div>
    <div class="tbl"><table class="hx-tbl"><thead><tr><th class="l">Season</th><th class="l">Team</th><th class="l">${ap ? "As played" : "Rating"}${st}</th><th>Off</th><th>Def</th>${ap ? `<th title="His Singular SiPM at the end of that season: its projection for the following season">Forecast<br><small>next season</small></th>` : ""}<th title="Season mean of his box-score game rating, the one measure that exists in every era">Box</th><th>Age</th><th>G</th><th>Min</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note" style="margin-top:8px">Regular season, ${HX_ASC ? "oldest first" : "newest first"}. ${ap ? HX_AP_NOTE + " As played = offence + defence." : "Rating = Singular SiPM (offence + defence)."} ${(iv ? hxIvNote : hxEraNote)(Math.min(...doc.s.map(r => r[0])))} Box = his box-score rating alone, comparable across every era. PTS, REB, AST per game. Games and minutes: Basketball-Reference season totals (all his teams).</p>
  </section>
  <footer>Ratings: Singular SiPM (all-time data from 1951-52). ${typeof LINE_MODE !== "undefined" && LINE_MODE === "dots" ? "Smoothed line: a minutes-weighted average of his ten-game ratings." : "Smoothed trajectory: item D's career-path model (November 2026)."}</footer>`;
}

/* ---------- search box, Teams link, team links on current players' tables ---------- */
function hxOptions(names, T){
  if (HX.idx) return;
  const idx = {}, out = [];
  for (const [id, lab, f, l] of names) { idx[lab.toLowerCase()] = `p-${id}`; out.push(`<option value="${E(lab)}">${f}\u2013${String(l + 1).slice(2)} \u00b7 retired</option>`); }
  for (const [y, rows] of Object.entries(T.seasons)) for (const r of rows) {
    const lab = `${sname(y)} ${r[1]}`; idx[lab.toLowerCase()] = `t-${r[0]}-${y}`;
    out.push(`<option value="${E(lab)}">'${String(+y + 1).slice(2)} ${E(r[1].split(" ").slice(-1)[0])} \u00b7 ${hxRec(r[2], r[3])}${r[5] ? " \u00b7 champions" : ""}</option>`);
  }
  HX.idx = idx;
  const dl = document.querySelector("#plist"); if (dl) dl.insertAdjacentHTML("beforeend", out.join(""));
}
function hxBarInit(){
  const q = document.querySelector("#q"); if (!q || !q.dataset || q.dataset.hx) return; q.dataset.hx = "1";
  if (document.head && !document.querySelector("#hx-style")) { const st = document.createElement("style"); st.id = "hx-style";
    st.textContent = ".hx-tl{color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}"; document.head.appendChild(st); }
  q.placeholder = "Find a player or a team season (since 1951-52)";
  const fan = document.querySelector('.bar a[href="#fantasy"]');
  if (fan && !document.querySelector('.bar a[href="#teams"]')) { const a = document.createElement("a"); a.href = "#teams"; a.textContent = "Teams";
    a.setAttribute("style", fan.getAttribute("style") || ""); fan.parentNode.insertBefore(a, fan); }
  const load = () => Promise.all([hxNames(), hxTeams()]).then(([n, t]) => hxOptions(n, t)).catch(e => console.error(e));
  q.addEventListener("focus", load); q.addEventListener("input", load);
  q.addEventListener("change", () => { const h = HX.idx && HX.idx[q.value.trim().toLowerCase()]; if (h) { location.hash = h; q.value = ""; } });
}
(window.WIRES = window.WIRES || []).push(function(){
  const app = document.querySelector("#app"); if (!app || !app.querySelectorAll) return;
  for (const tr of app.querySelectorAll("table tbody tr")) {
    const tds = tr.children; let y = null, j = -1;
    for (let i = 0; i < Math.min(3, tds.length); i++) { const m = /^(\d{4})-\d{2}$/.exec(tds[i].textContent.trim()); if (m) { y = +m[1]; j = i; break; } }
    if (y == null || y < 1951) continue;
    for (let i = j + 1; i < Math.min(j + 3, tds.length); i++) { const t = tds[i].textContent.trim();
      if (/^[A-Z]{3}$/.test(t) && t !== "TOT" && !tds[i].querySelector("a")) { tds[i].innerHTML = `<a class="hx-tl" href="#t-${t}-${y}" title="${sname(y)} ${t}: team season">${t}</a>`; break; } }
  }
});
(function(){
  // route() sends every hash that is not a player page or #fantasy to renderFront(): wrap it to catch #t- and #teams
  if (typeof window === "undefined" || window.__hxRF) return;
  const rf = typeof renderFront === "function" ? renderFront : null;
  window.__hxRF = rf || true;
  window.renderFront = function(){ hxInstall(); if (hxRoute()) return; if (rf) return rf.apply(this, arguments);
    if (typeof META !== "undefined" && META && typeof show === "function") show(META.players[0].id); };
  if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("DOMContentLoaded", () => { hxInstall(); hxBarInit(); });
  if (window.addEventListener) window.addEventListener("hashchange", hxInstall);
})();

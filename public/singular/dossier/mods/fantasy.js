// Fantasy ranks view, shown at #fantasy (data: fantasy.json, built by scripts/pp_fantasy.py from su_fantasy_live.py).
// Our own 9-cat projection with live minutes. No other site's rankings appear here; the one expert number is an aggregate test score.
let FN = null;
const FNS = { q: "", team: "", pos: "", rule: "", top: 150, cell: "pg", sort: "rk", dir: 1 };
const FN_CATS = [["pts", "PTS", "Points per game"], ["fg3m", "3PM", "Threes made per game"], ["reb", "REB", "Rebounds per game"], ["ast", "AST", "Assists per game"],
  ["stl", "STL", "Steals per game"], ["blk", "BLK", "Blocks per game"], ["fgp", "FG%", "Field-goal %, weighted by attempts in the z-score"],
  ["ftp", "FT%", "Free-throw %, weighted by attempts in the z-score"], ["tov", "TOV", "Turnovers per game (fewer is better; the z-score is flipped)"]];
const FN_RULE = {"minutes model": ["", "Model"], "injured": ["inj", "Injured"], "not playing, healthy": ["out", "Out of rotation"],
  "under 5 games: blend": ["<5g", "Under 5 games"], "no minutes row": ["pre", "No games yet"]};

function renderFantasy(){
  if (!FN) {
    $("#app").innerHTML = `<p class="empty">Loading fantasy ranks\u2026</p>`;
    fetch("fantasy.json").then(r => r.json()).then(d => { FN = d; if (location.hash === "#fantasy") renderFantasy(); })
      .catch(e => { $("#app").innerHTML = `<p class="empty">Could not load fantasy.json (${E(e.message)}).</p>`; });
    return;
  }
  const M = FN.meta, T = M.tests, RA = T.rank_agreement, MT = T.minutes_test;
  const teams = [...new Set(FN.rows.map(r => r.team).filter(Boolean))].sort();
  const dt = new Date(M.as_of + "T12:00:00");
  const dts = isNaN(dt) ? E(M.as_of) : dt.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  const seg = (id, cur, opts) => `<div class="seg" id="${id}" role="group">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;
  const s0 = MT.seasons[0], s1 = MT.seasons[1], rc = M.rule_counts || {};
  const f2 = x => x.toFixed(2), f3 = x => x.toFixed(3);
  $("#app").innerHTML = `<style>
  .fnhead{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:8px 32px;padding-block:26px 16px;border-bottom:1px solid var(--line)}
  @media (max-width:900px){.fnhead{grid-template-columns:minmax(0,1fr)}}
  .fnhead .lede{margin:8px 0 0}
  .fnback{font-size:13px;color:var(--mute);text-decoration:none} .fnback:hover{color:var(--brown);text-decoration:underline}
  .fnbox{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px 14px;font-size:13.5px;line-height:1.45;align-self:start}
  .fnbox h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:0 0 6px}
  .fnbox p{margin:0 0 8px} .fnbox p:last-child{margin-bottom:0}
  .fnbox b{font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
  .fnmeth{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 22px;margin:14px 0 4px;font-size:13.5px;line-height:1.45}
  @media (max-width:900px){.fnmeth{grid-template-columns:minmax(0,1fr)}}
  .fnmeth h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:0 0 4px}
  .fnmeth p,.fnmeth ul{margin:0 0 6px} .fnmeth ul{padding-left:18px} .fnmeth li{margin-bottom:3px}
  .fnmeth .tag{font:600 10.5px var(--mono);padding:0 4px;border-radius:3px;border:1px solid var(--line);color:var(--mute)}
  .fnfil{display:flex;gap:8px 12px;align-items:center;flex-wrap:wrap;margin:16px 0 8px;font-size:13px;color:var(--mute)}
  .fnfil input{font:14px var(--sans);padding:5px 9px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);width:180px}
  .fnfil .cnt{margin-left:auto;font-family:var(--mono);font-size:12px}
  .fnleg{display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-bottom:8px}
  .fnleg .sw{display:inline-flex;border:1px solid var(--line);border-radius:3px;overflow:hidden;vertical-align:middle} .fnleg .sw i{width:20px;height:12px;display:block}
  .fntbl{overflow:auto;max-height:calc(100vh - 70px);border:1px solid var(--line);border-radius:6px;background:var(--panel)}
  .fntbl table{font-size:12.5px;width:100%}
  .fntbl th,.fntbl td{padding:4px 6px;border-bottom:1px solid var(--grid)}
  .fntbl thead th{z-index:2;cursor:pointer;user-select:none;font-size:12px;vertical-align:bottom;box-shadow:inset 0 -1px 0 var(--line)}
  .fntbl thead th:hover,.fntbl thead th.on{color:var(--ink)} .fntbl thead th.on::after{content:attr(data-arrow);margin-left:2px;color:var(--brown)}
  .fntbl .grp{border-left:1px solid var(--line)}
  .fntbl .stk{position:sticky;background:var(--panel);z-index:1} .fntbl thead .stk{z-index:3}
  .fntbl .c0{left:0;width:36px;min-width:36px;text-align:right}
  .fntbl .c1{left:36px;text-align:left;min-width:160px;max-width:190px;overflow:hidden;text-overflow:ellipsis;box-shadow:inset -1px 0 0 var(--line)}
  .fntbl td.c1{font-family:var(--sans);font-size:13.5px;font-weight:600}
  .fntbl td.c1 a{color:inherit;text-decoration:none} .fntbl td.c1 a:hover{text-decoration:underline;color:var(--brown)}
  .fntbl td.tx{font-family:var(--sans);color:var(--mute);text-align:left}
  .fntbl td.mu{color:var(--mute)}
  .fntbl td.val{font-weight:600}
  .fntbl .flag{font:600 10px var(--mono);margin-left:4px;padding:0 3px;border-radius:3px;border:1px solid var(--line);color:var(--mute);vertical-align:1px}
  .fntbl .flag.inj{color:var(--hot);border-color:color-mix(in srgb,var(--hot) 45%,var(--line))}
  .fntbl tbody tr:hover td{box-shadow:inset 0 1px 0 var(--mute),inset 0 -1px 0 var(--mute)}
  .fntbl tbody tr:hover td.stk{background:color-mix(in srgb,var(--ochre) 14%,var(--panel))}
  .fnnote{font-size:12.5px;color:var(--mute);margin-top:8px;max-width:110ch}
  @media (max-width:640px){.fnfil input{width:100%}.fnfil .cnt{margin-left:0}.fntbl .c1{min-width:128px;max-width:140px}}
  </style>
  <header class="fnhead">
    <div>
      <a class="fnback" href="#league">\u2190 League table</a>
      <h1 style="margin-top:6px">Fantasy ranks, 9-category</h1>
      <p class="lede">Our per-game fantasy value for ${E(M.season)}, ranked. Each player's projected stat line is his per-minute rates times the minutes he is likely to play from here on. Colour shows each category against the top ${M.pool_size} players (a 12-team league's rosters): hot helps a fantasy team, cold hurts. Click a column to sort; click a name for his page. Minutes and injuries through ${dts}.</p>
    </div>
    <div class="fnbox">
      <h3>Does the minutes model help? The tests</h3>
      <p><b>${s1 - s0 + 1} past seasons</b> (${sname(s0)} to ${sname(s1)}), each predicted from earlier seasons only: the model missed minutes per game by <b>${f2(MT.mpg_n10.model_mae)}</b> over the next 10 games, against <b>${f2(MT.mpg_n10.baseline_mae)}</b> for season-to-date minutes; and by <b>${f2(MT.mpg_ros.model_mae)}</b> for the rest of the season, against <b>${f2(MT.mpg_ros.baseline_mae)}</b> for the best simple rule (a blend of this season and last). It won in <b>${E(MT.mpg_n10.seasons_improved.replace("/", " of "))}</b> seasons on both.</p>
      <p><b>This season</b>, frozen at opening night: how well did each version's ranks match the 9-cat value players have actually produced (${RA.n} players with 6+ games; rank correlation, 1 = perfect)? With the minutes model <b>${f3(RA.minutes_model)}</b>, with our old minutes <b>${f3(RA.old_minutes)}</b>, the median of public expert rankings <b>${f3(RA.experts)}</b>.${RA.top150 ? ` Among the top 150 there is no gain (${f3(RA.top150.minutes_model)} vs ${f3(RA.top150.old_minutes)}; experts ${f3(RA.top150.experts)}).` : ""}</p>
      <p style="color:var(--mute)">Read: a small preseason gain, still a little behind the experts. The model earns its place in-season, when roles change.</p>
    </div>
  </header>
  <div class="fnmeth">
    <div><h3>Value</h3><p>Nine categories: points, threes, rebounds, assists, steals, blocks, FG%, FT% and turnovers. Each is a z-score against the top ${M.pool_size} players; shooting percentages count by attempts, so a 60% shooter on 3 shots helps less than on 15. Value is the average of the nine. It is per game played, so games missed to injury do not lower it.</p></div>
    <div><h3>Stat line</h3><p>Per-minute rates come from our preseason projection: his last three seasons, weighted toward the latest, aged with Singular's skill curves and pulled toward average when the sample is small. They are not yet updated for how he has played this season; only his minutes are.</p></div>
    <div><h3>Live minutes</h3><ul>
      <li><span class="tag">model</span> the minutes model's rest-of-season forecast (${rc["minutes model"] ?? 0} players).</li>
      <li><span class="tag">inj</span> on ESPN's injury list and missing games: minutes as if healthy, blended with preseason until he has 5 games (${rc["injured"] ?? 0}).</li>
      <li><span class="tag">out</span> healthy but 3+ straight games out: the model's minutes, no blend (${rc["not playing, healthy"] ?? 0}).</li>
      <li><span class="tag">&lt;5g</span> under 5 games: blended with preseason, weight games \u00f7 5 (${rc["under 5 games: blend"] ?? 0}).</li>
      <li><span class="tag">pre</span> no NBA games yet: preseason minutes (${rc["no minutes row"] ?? 0}).</li></ul></div>
  </div>
  <div class="fnfil">
    <input id="fnQ" type="search" placeholder="Search players" aria-label="Search players" value="${E(FNS.q)}">
    <select id="fnTeam" aria-label="Team"><option value="">All teams</option>${teams.map(t => `<option ${t === FNS.team ? "selected" : ""}>${E(t)}</option>`).join("")}</select>
    ${seg("fnPos", FNS.pos, [["", "All"], ["G", "G"], ["F", "F"], ["C", "C"]])}
    <select id="fnRule" aria-label="Minutes rule"><option value="">Any minutes rule</option>${Object.entries(FN_RULE).map(([k, [, l]]) => `<option value="${E(k)}" ${k === FNS.rule ? "selected" : ""}>${E(l)}</option>`).join("")}</select>
    ${seg("fnTop", FNS.top, [[150, "Top 150"], [300, "Top 300"], [0, "All"]])}
    ${seg("fnCell", FNS.cell, [["pg", "Per game"], ["z", "z-scores"]])}
    <span class="cnt" id="fnCnt"></span>
  </div>
  <div class="fnleg" id="fnLeg"></div>
  <div class="fntbl" id="fnTbl"></div>
  <p class="fnnote" id="fnNote"></p>`;
  fnWire(); fnUpdate();
}

function fnWire(){
  const segOn = (id, key, num) => { const el = $("#" + id); if (!el) return; el.onclick = e => { const b = e.target.closest && e.target.closest("button"); if (!b) return;
    FNS[key] = num ? +b.dataset.v : b.dataset.v; [...el.children].forEach(x => x.setAttribute("aria-pressed", String(x === b))); fnUpdate(); }; };
  segOn("fnPos", "pos"); segOn("fnTop", "top", true); segOn("fnCell", "cell");
  const q = $("#fnQ"); if (q) q.oninput = () => { FNS.q = q.value; fnUpdate(); };
  const t = $("#fnTeam"); if (t) t.onchange = () => { FNS.team = t.value; fnUpdate(); };
  const r = $("#fnRule"); if (r) r.onchange = () => { FNS.rule = r.value; fnUpdate(); };
  const tb = $("#fnTbl"); if (tb) tb.onclick = e => { const th = e.target.closest && e.target.closest("th[data-k]"); if (!th) return;
    const k = th.dataset.k; if (FNS.sort === k) FNS.dir = -FNS.dir; else { FNS.sort = k; FNS.dir = ["rk", "name", "team", "pos"].includes(k) ? 1 : -1; } fnUpdate(); };
}

const fnNorm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function fnHeat(z){
  if (z == null || !isFinite(z)) return "";
  const t = Math.max(-1, Math.min(1, z/2.5));
  return Math.abs(t) < 0.08 ? "" : `background:${mix(css("--panel"), t > 0 ? css("--hot") : css("--cold"), 0.42*Math.abs(t))}`;
}
function fnSortVal(r, k){
  const ci = FN_CATS.findIndex(c => c[0] === k);
  if (ci >= 0) return r.z[ci];
  if (k === "chg") return r.rk0 - r.rk;
  return r[k];
}

function fnUpdate(){
  const ql = fnNorm(FNS.q.trim());
  let rows = FN.rows.filter(r => (!FNS.top || r.rk <= FNS.top) && (!FNS.team || r.team === FNS.team) && (!FNS.pos || (r.pos || "").includes(FNS.pos))
    && (!FNS.rule || r.rule === FNS.rule) && (!ql || fnNorm(r.name).includes(ql)));
  const k = FNS.sort, dir = FNS.dir;
  rows = rows.slice().sort((a, b) => { const x = fnSortVal(a, k), y = fnSortVal(b, k);
    if (x == null && y == null) return a.rk - b.rk; if (x == null) return 1; if (y == null) return -1;
    if (typeof x === "string") return dir*x.localeCompare(y); return dir*(x - y) || a.rk - b.rk; });
  const th = (key, label, tip, cls) => `<th data-k="${key}" class="${cls || ""}${FNS.sort === key ? " on" : ""}" data-arrow="${FNS.dir > 0 ? "\u25b2" : "\u25bc"}"${tip ? ` title="${E(tip)}"` : ""}>${label}</th>`;
  const zt = FNS.cell === "z";
  const head = `<thead><tr>${th("rk", "#", "Live rank by 9-cat value", "stk c0")}${th("name", "Player", "", "stk c1")}${th("chg", "\u00b1", "Places moved since the preseason rank (up = better)")}${th("team", "Tm", "", "l")}${th("pos", "Pos", "", "l")}
    ${th("g", "G", "Games played this season", "grp")}${th("mp", "MPG", "Live minutes per game used for the projection (flag = which rule set them)")}${th("amp", "So far", "Actual minutes per game this season")}
    ${FN_CATS.map(([ck, l, tip], i) => th(ck, l, tip + (zt ? "" : ". Colour = z-score."), i === 0 ? "grp" : "")).join("")}
    ${th("v", "Value", "Average of the nine z-scores (per game played)", "grp")}${th("rk0", "Pre", "Preseason rank (same rates, preseason minutes)")}</tr></thead>`;
  const pc = v => v == null ? "\u2013" : (v >= 1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/, ""));
  const body = rows.map(r => {
    const ch = r.rk0 - r.rk, f = FN_RULE[r.rule] || ["", r.rule];
    const mtip = `Live ${r.mp ?? "\u2013"} mpg. Preseason ${r.mp0 ?? "\u2013"}; model ${r.mpm ?? "\u2013"}; so far ${r.amp ?? "\u2013"} over ${r.g ?? 0} games.${r.inj ? ` ESPN: ${r.inj}.` : ""}${r.miss ? ` Missed the last ${r.miss}.` : ""} Rule: ${(FN.meta.rules[r.rule] || r.rule)}`;
    const cells = FN_CATS.map(([ck], i) => { const z = r.z[i], v = r[ck];
      const txt = zt ? (z == null ? "\u2013" : (z > 0 ? "+" : "") + z.toFixed(1)) : ck === "fgp" || ck === "ftp" ? pc(v) : (v == null ? "\u2013" : v.toFixed(1));
      const tip = ck === "fgp" ? `${pc(v)} on ${r.fga ?? "\u2013"} FGA a game; z ${z ?? "\u2013"}` : ck === "ftp" ? `${pc(v)} on ${r.fta ?? "\u2013"} FTA a game; z ${z ?? "\u2013"}` : `${v ?? "\u2013"} a game; z ${z ?? "\u2013"}`;
      return `<td class="${i === 0 ? "grp" : ""}" style="${fnHeat(z)}" title="${E(tip)}">${txt}</td>`; }).join("");
    const nm = r.page ? `<a href="#p-${r.id}">${E(r.name)}</a>` : E(r.name);
    return `<tr><td class="stk c0">${r.rk}</td><td class="stk c1" title="${E(r.name)}">${nm}</td>
      <td class="${ch > 0 ? "" : "mu"}" style="${ch ? `color:${ch > 0 ? css("--hot") : css("--cold")}` : ""}">${ch > 0 ? "+" + ch : ch < 0 ? "\u2212" + (-ch) : "\u00b7"}</td>
      <td class="tx">${E(r.team || "\u2013")}</td><td class="tx">${E(r.pos || "\u2013")}</td>
      <td class="grp">${r.g ?? "\u2013"}</td><td title="${E(mtip)}">${r.mp != null ? r.mp.toFixed(1) : "\u2013"}${f[0] ? `<span class="flag${f[0] === "inj" ? " inj" : ""}">${E(f[0])}</span>` : ""}</td><td class="mu">${r.amp != null ? r.amp.toFixed(1) : "\u2013"}</td>
      ${cells}<td class="grp val">${r.v != null ? (r.v > 0 ? "+" : "") + r.v.toFixed(2) : "\u2013"}</td><td class="mu">${r.rk0}</td></tr>`; }).join("");
  $("#fnTbl").innerHTML = `<table>${head}<tbody>${body || `<tr><td colspan="19" class="tx" style="padding:12px">No players match.</td></tr>`}</tbody></table>`;
  $("#fnCnt").textContent = `${rows.length} of ${FN.rows.length} players`;
  const pn = css("--panel"), sw = [-1, -0.6, -0.25, 0.25, 0.6, 1].map(t => `<i style="background:${mix(pn, t > 0 ? css("--hot") : css("--cold"), 0.42*Math.abs(t))}"></i>`).join("");
  $("#fnLeg").innerHTML = `<span>Category z-score</span><span>hurts</span><span class="sw">${sw}</span><span>helps</span><span>(full colour at \u00b12.5)</span><span>Hover a cell for the number behind it; hover MPG for how minutes were set.</span>`;
  $("#fnNote").innerHTML = `Value per game played, ${E(FN.meta.season)}. Rank = live rank among ${FN.meta.n} projected players. \u00b1 = places moved since the preseason rank with the same per-minute rates. Injury status is ESPN's public list, used only to choose the minutes rule.`;
}

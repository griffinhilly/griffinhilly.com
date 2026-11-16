// Stats module (Basketball-Reference-style tables). Data: d.bx (rows, z, r) and META.bx_meta (league quantiles).
// Built by scripts/pp_boxtables.py; the row layout and derived-value formulas there must match bxv() here.
let BXTAB = "basic", BXMODE = "g", BXSCROLL = null;
const BXCSS = `
.bxs{overflow:auto;max-height:min(80vh,880px);border:1px solid var(--line);border-radius:6px;background:var(--panel);overscroll-behavior-x:contain}
.bxs table{font-size:12.5px;width:100%;line-height:1.3}
.bxs th,.bxs td{padding:3px 7px;border-bottom:1px solid var(--grid)}
.bxs thead{position:sticky;top:0;z-index:3;background:var(--panel)}
.bxs th{position:static;background:var(--panel);box-shadow:inset 0 -1px 0 var(--line)}
.bxs th.g{font:600 10.5px var(--sans);letter-spacing:.07em;text-transform:uppercase;text-align:center;color:var(--mute);padding-block:5px 2px;box-shadow:none}
.bxs th.g span{display:block;border-bottom:1px solid var(--line);padding-bottom:2px}
.bxs th:first-child,.bxs td:first-child{position:sticky;left:0;z-index:2;background:var(--panel);box-shadow:inset -1px 0 0 var(--line)}
.bxs thead th:first-child{z-index:4}
.bxs thead tr:first-child th.g:first-child{position:static;box-shadow:none}
.bxs .gs{border-left:1px solid var(--line)}
.bxs td b{font-weight:700;color:var(--ink)}
.bxs tr.sub td{color:var(--mute);font-size:11.5px}
.bxs tr.car td{font-weight:700;border-top:2px solid var(--ink);border-bottom:0}
.bxs td.na{color:var(--mute)}
.bxs tbody tr:hover td{background-image:linear-gradient(color-mix(in srgb,var(--ink) 7%,transparent),color-mix(in srgb,var(--ink) 7%,transparent))}
.bxctl{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin:4px 0 10px}
.bxctl .lbl{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.bxleg{display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:8px}
.bxleg .sw{display:inline-block;width:14px;height:12px;border-radius:2px;vertical-align:-2px;margin-right:4px;border:1px solid var(--line)}
`;

const BXI = {g:5, mp:6, fg:7, fga:8, tp:9, tpa:10, ft:11, fta:12, orb:13, drb:14, trb:15, ast:16, stl:17, blk:18, tov:19, pf:20, pts:21, pm:22,
             poss:23, usg_den:24, tm_fgm:25, orb_den:26, drb_den:27, trb_den:28, blk_den:29};
const BXCNT = new Set(["pts","trb","ast","stl","blk","tov","fg","fga","tp","tpa","ft","fta","orb","drb","pf","pm"]);
const BXZK = ["ra","pnt","mid","c3","ab"];
const BXMODES = [["g","Per game"],["36","Per 36 min"],["75","Per 75 poss"],["100","Per 100 poss"],["t","Totals"]];
const BXTABS = [["basic","Basic"],["adv","Advanced"],["shoot","Shooting"],["po","Playoffs"]];

// value of `k` for a row (array), in `mode`; z = zone array for the season or null; r = SiPM triple or null
function bxv(row, k, mode, z, r){
  const x = n => row[BXI[n]], dv = (a, b) => b > 0 ? a / b : null;
  if (BXCNT.has(k)) { const b = x(k);
    return mode === "g" ? dv(b, x("g")) : mode === "36" ? dv(36*b, x("mp")) : mode === "75" ? dv(75*b, x("poss")) : mode === "100" ? dv(100*b, x("poss")) : b; }
  switch (k) {
    case "age": return row[4]; case "gp": return x("g");
    case "mp": return mode === "g" ? dv(x("mp"), x("g")) : x("mp");
    case "fgp": return dv(x("fg"), x("fga")); case "tpp": return dv(x("tp"), x("tpa")); case "ftp": return dv(x("ft"), x("fta"));
    case "twp": return dv(x("fg") - x("tp"), x("fga") - x("tpa"));
    case "efg": return dv(x("fg") + 0.5*x("tp"), x("fga"));
    case "ts": return dv(x("pts"), 2*(x("fga") + 0.44*x("fta")));
    case "tpar": return dv(x("tpa"), x("fga")); case "ftr": return dv(x("fta"), x("fga"));
    case "usg": return dv(100*(x("fga") + 0.44*x("fta") + x("tov")), x("usg_den"));
    case "astp": return dv(100*x("ast"), x("tm_fgm") - x("fg"));
    case "tovp": return dv(100*x("tov"), x("fga") + 0.44*x("fta") + x("tov"));
    case "orbp": return dv(100*x("orb"), x("orb_den")); case "drbp": return dv(100*x("drb"), x("drb_den"));
    case "trbp": return dv(100*x("trb"), x("trb_den")); case "stlp": return dv(100*x("stl"), x("poss"));
    case "blkp": return dv(100*x("blk"), x("blk_den"));
    case "fgapg": return dv(x("fga"), x("g"));
    case "r": return r ? r[0] : null; case "ro": return r ? r[1] : null; case "rd": return r ? r[2] : null;
    case "c3s": return z ? dv(z[6], z[6] + z[8]) : null;
  }
  if (z && k.startsWith("zf_")) { const i = BXZK.indexOf(k.slice(3)); return dv(z[2*i], z[0]+z[2]+z[4]+z[6]+z[8]); }
  if (z && k.startsWith("zp_")) { const i = BXZK.indexOf(k.slice(3)); return dv(z[2*i+1], z[2*i]); }
  return null;
}

// column spec: [key, header, format, tooltip, flags]; flags: lo = lower is better (inverted shading, no best), nb = no best/shade
function bxCols(tab){
  const B = [["season","Season"],["age","Age","i","Age on Feb 1 of the season","nb"],["team","Tm"],["gp","G","i","Games played","nb"],["mp","MP","mp","Minutes (per game in per-game mode, else total)","nb"]];
  const cnt = (k, h, t, f) => [k, h, "c", t, f];
  if (tab === "basic" || tab === "po") return { groups: [["",5],["Box score",6],["Field goals",3],["Threes",3],["Free throws",3],["Efficiency",2],["Other",4]], cols: [...B,
    cnt("pts","PTS","Points"), cnt("trb","TRB","Total rebounds"), cnt("ast","AST","Assists"), cnt("stl","STL","Steals"), cnt("blk","BLK","Blocks"), cnt("tov","TOV","Turnovers","lo"),
    cnt("fg","FG","Field goals made"), cnt("fga","FGA","Field goal attempts"), ["fgp","FG%","p3","Field goal %"],
    cnt("tp","3P","Threes made"), cnt("tpa","3PA","Three-point attempts"), ["tpp","3P%","p3","Three-point %"],
    cnt("ft","FT","Free throws made"), cnt("fta","FTA","Free throw attempts"), ["ftp","FT%","p3","Free throw %"],
    ["ts","TS%","p3","True shooting %: PTS / (2 × (FGA + 0.44 × FTA))"], ["usg","USG%","p1","Usage %: share of team plays (FGA + 0.44 FTA + TOV) he used while on court"],
    cnt("orb","ORB","Offensive rebounds"), cnt("drb","DRB","Defensive rebounds"), cnt("pf","PF","Personal fouls","lo"), cnt("pm","+/-","Plus-minus: team point margin while he played")] };
  if (tab === "adv") return { groups: [["",5],["Shooting efficiency",4],["Role",3],["Rebounding",3],["Defense",2],["SiPM rating, pts/100",3]], cols: [...B,
    ["ts","TS%","p3","True shooting %: PTS / (2 × (FGA + 0.44 × FTA))"], ["efg","eFG%","p3","Effective FG %: (FG + 0.5 × 3P) / FGA"],
    ["tpar","3PAr","p3","Three-point attempt rate: 3PA / FGA"], ["ftr","FTr","p3","Free throw rate: FTA / FGA"],
    ["usg","USG%","p1","Usage %: share of team plays (FGA + 0.44 FTA + TOV) he used while on court"],
    ["astp","AST%","p1","Assist %: share of teammate field goals he assisted while on court"],
    ["tovp","TOV%","p1","Turnover %: turnovers per 100 plays (FGA + 0.44 FTA + TOV)","lo"],
    ["orbp","ORB%","p1","Offensive rebound %: share of available offensive rebounds he grabbed"], ["drbp","DRB%","p1","Defensive rebound %"], ["trbp","TRB%","p1","Total rebound %"],
    ["stlp","STL%","p1","Steal %: steals per 100 opponent possessions while on court"], ["blkp","BLK%","p1","Block %: share of opponent two-point attempts he blocked"],
    ["r","SiPM","sg","Our Singular rating: points per 100 possessions vs an average player"], ["ro","Off","sg","Offensive part of SiPM"], ["rd","Def","sg","Defensive part of SiPM"]] };
  return { groups: [["",5],["Percentages",6],["Shot diet",2],["Share of FGA by zone",5],["FG% by zone",5],["",1]], cols: [B[0],B[1],B[2],B[3],
    ["fgapg","FGA","1","Field goal attempts per game","nb"],
    ["fgp","FG%","p3","Field goal %"], ["twp","2P%","p3","Two-point %"], ["tpp","3P%","p3","Three-point %"], ["ftp","FT%","p3","Free throw %"],
    ["efg","eFG%","p3","Effective FG %: (FG + 0.5 × 3P) / FGA"], ["ts","TS%","p3","True shooting %: PTS / (2 × (FGA + 0.44 × FTA))"],
    ["tpar","3PAr","p3","Three-point attempt rate: 3PA / FGA"], ["ftr","FTr","p3","Free throw rate: FTA / FGA"],
    ["zf_ra","Rim","p3","Share of FGA in the restricted area","nb"], ["zf_pnt","Paint","p3","Share of FGA in the paint outside the restricted area","nb"],
    ["zf_mid","Mid","p3","Share of FGA from mid-range","nb"], ["zf_c3","Cor 3","p3","Share of FGA from the corners (threes)","nb"], ["zf_ab","AB 3","p3","Share of FGA from above-the-break threes (incl. 30+ ft)","nb"],
    ["zp_ra","Rim","p3","FG% in the restricted area"], ["zp_pnt","Paint","p3","FG% in the paint outside the restricted area"], ["zp_mid","Mid","p3","FG% from mid-range"],
    ["zp_c3","Cor 3","p3","FG% on corner threes"], ["zp_ab","AB 3","p3","FG% on above-the-break threes"],
    ["c3s","Cor3/3PA","p3","Corner threes as a share of all three-point attempts","nb"]] };
}

function bxFmt(v, f, mode){
  if (v == null || !isFinite(v)) return "–";
  const com = n => Math.round(n).toLocaleString("en-US");
  if (f === "c") return mode === "t" ? com(v) : v.toFixed(1);
  if (f === "mp") return mode === "g" ? v.toFixed(1) : com(v);
  if (f === "i") return String(Math.round(v));
  if (f === "p3") return v >= 1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/, "").replace(/^-0/, "-");
  if (f === "p1" || f === "1") return v.toFixed(1);
  if (f === "sg") return (v > 0 ? "+" : "") + v.toFixed(1);
  return String(v);
}
function bxPm(v, mode){ if (v == null || !isFinite(v)) return "–"; const s = mode === "t" ? Math.round(v).toLocaleString("en-US") : v.toFixed(1); return (v > 0 ? "+" : "") + s; }

// percentile of v within an 11-point quantile vector
function bxPct(q, v){
  if (!q || v == null || !isFinite(v)) return null;
  if (v <= q[0]) return 0; if (v >= q[10]) return 100;
  for (let i = 0; i < 10; i++) if (v < q[i+1]) return 10*(i + (q[i+1] > q[i] ? (v - q[i])/(q[i+1] - q[i]) : 0.5));
  return 100;
}

function modBox(d){
  const bx = d.bx, M = META.bx_meta;
  if (!bx || !bx.rows || !bx.rows.length || !M) return "";
  const tab = BXTAB, po = tab === "po", ty = po ? 1 : 0;
  const mode = (tab === "basic" || po) ? BXMODE : "g";
  const rows = bx.rows.filter(r => r[1] === ty);
  const ctl = `<div class="bxctl">
    <div class="seg" id="bx-tabs" role="group" aria-label="Table">${BXTABS.map(([k,l]) => `<button data-bxtab="${k}" aria-pressed="${k===tab}">${l}</button>`).join("")}</div>
    ${(tab === "basic" || po) ? `<div class="seg" id="bx-mode" role="group" aria-label="Stat mode">${BXMODES.map(([k,l]) => `<button data-bxmode="${k}" aria-pressed="${k===BXMODE}">${l}</button>`).join("")}</div>`
      : `<span class="note">${tab === "adv" ? "Regular season. Rates do not depend on the per-game / per-possession toggle." : "Regular season. Shot zones come from shot coordinates, 2018-19 on."}</span>`}
  </div>`;
  const head = `<div class="mhead"><h2>Stats</h2><span class="note">${E(d.name)}: every ${po ? "playoff run" : "season"}, oldest at top, career at the bottom</span></div>`;
  if (!rows.length) return `<section class="mod" id="m-box"><style>${BXCSS}</style>${head}${ctl}<p class="empty">${po ? "No playoff games yet." : "No NBA games yet."}</p></section>`;

  const {groups, cols} = bxCols(tab);
  const keys = M.keys, kix = {}; keys.forEach((k, i) => kix[k] = i);
  const panel = css("--panel"), hot = css("--hot"), cold = css("--cold");
  const qkey = k => BXCNT.has(k) ? `${k}_${mode === "75" ? "100" : mode}` : k === "mp" ? (mode === "g" ? "mp_g" : "mp_t") : k;
  const qval = (k, v) => BXCNT.has(k) && mode === "75" && v != null ? v/0.75 : v;
  const thr = s => po ? 100 : (M.thr[s] ?? 500);
  const scale = s => po ? 0.25 : thr(s)/500;
  const zfor = s => (!po && bx.z) ? bx.z[s] || null : null;
  const rfor = s => (!po && bx.r) ? bx.r[s] || null : null;
  // minimum attempts for a % to be shaded / compete for best (matches the python quantile population)
  const okAtt = (k, row, z, s) => {
    const sc = scale(s);
    if (k === "tpp") return row[BXI.tpa] >= 40*sc;
    if (k === "ftp") return row[BXI.fta] >= 40*sc;
    if (k.startsWith("zp_")) { const i = BXZK.indexOf(k.slice(3)); return z && z[2*i] >= 25*sc; }
    return true;
  };
  const main = rows.filter(r => r[3] !== 2);
  const qual = main.filter(r => r[BXI.mp] >= thr(String(r[0])));
  const maxmp = Math.max(...main.map(r => r[BXI.mp]));
  const pool = qual.length ? qual : main.filter(r => r[BXI.mp] >= 0.5*maxmp);
  // best season per column
  const best = {};
  for (const [k, , , , fl] of cols) {
    if (["season","team","age","gp","mp"].includes(k) || fl === "lo" || fl === "nb") continue;
    let bv = null;
    for (const r of pool) { const s = String(r[0]), z = zfor(s); if (!okAtt(k, r, z, s)) continue;
      const v = bxv(r, k, mode, z, rfor(s)); if (v != null && isFinite(v) && (bv == null || v > bv)) bv = v; }
    best[k] = bv;
  }
  const ord = p => { const n = Math.round(p), s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); };
  const cell = (k, f, fl, r, z, rr, s, shade, gs) => {
    let v;
    if (k === "season") return `<td class="l">${sname(r[0])}</td>`;
    if (k === "team") return `<td class="l${gs}">${E(r[2])}</td>`;
    v = bxv(r, k, mode, z, rr);
    const txt = k === "pm" ? bxPm(v, mode) : bxFmt(v, f, mode);
    if (v == null || !isFinite(v)) return `<td class="na${gs}">–</td>`;
    let st = "", tip = "";
    if (shade && fl !== "nb" && !["age","gp"].includes(k)) {
      if (k === "r" || k === "ro" || k === "rd") {
        const t = Math.max(-1, Math.min(1, v/(k === "r" ? 6 : 4)));
        if (Math.abs(t) >= 0.1) st = `background:${mix(panel, t > 0 ? hot : cold, 0.3*Math.abs(t))}`;
      } else if (okAtt(k, r, z, s)) {
        const qk = qkey(k), qs = M.q[String(ty)][s], q = qs && kix[qk] != null ? qs[kix[qk]] : null;
        let p = bxPct(q, qval(k, v));
        if (p != null) {
          tip = `${ord(p)} percentile in ${sname(s)}${fl === "lo" ? " (100 = most)" : ""}`;
          const lg = !po && M.lg[s] && M.lg[s][k] != null ? M.lg[s][k] : null;
          if (lg != null) tip += ` · league ${bxFmt(lg, "p3")}`;
          if (fl === "lo") p = 100 - p;
          const t = Math.abs(p - 50)/50;
          if (t >= 0.12) st = `background:${mix(panel, p > 50 ? hot : cold, 0.3*t)}`;
        }
      }
    }
    const isBest = best[k] != null && r[3] !== 2 && Math.abs(v - best[k]) < 1e-9 && pool.includes(r);
    return `<td class="${gs.trim()}"${st ? ` style="${st}"` : ""}${tip ? ` title="${E(tip)}"` : ""}>${isBest ? `<b>${txt}</b>` : txt}</td>`;
  };
  // group-start columns get a left rule
  const gstart = new Set(); { let c = 0; for (const [, n] of groups) { if (c > 0) gstart.add(c); c += n; } }
  const thead = `<thead><tr>${groups.map(([g, n], i) => `<th class="g" colspan="${n}">${g ? `<span>${E(g)}</span>` : ""}</th>`).join("")}</tr>
    <tr>${cols.map(([k, h, , t], i) => `<th class="${i < 3 && k !== "age" ? "l" : ""}${gstart.has(i) ? " gs" : ""}"${t ? ` title="${E(t)}"` : ""}>${E(h)}</th>`).join("")}</tr></thead>`;
  const body = rows.map(r => {
    const s = String(r[0]), z = zfor(s), rr = r[3] === 2 ? null : rfor(s), shade = r[3] !== 2 && r[BXI.mp] >= thr(s);
    return `<tr class="${r[3] === 2 ? "sub" : ""}">${cols.map(([k, , f, , fl], i) => cell(k, f, fl, r, r[3] === 2 && (k.startsWith("z") || k === "c3s") ? null : z, rr, s, shade, gstart.has(i) ? " gs" : "")).join("")}</tr>`;
  }).join("");
  // career row: sum of season rows (not the per-team rows inside traded seasons)
  const car = new Array(30).fill(0); car[0] = 0; car[2] = ""; car[3] = 0; car[4] = null;
  for (const r of main) for (let i = 5; i < 30; i++) car[i] += r[i] || 0;
  let cz = null, cr = null;
  if (!po && bx.z) { const zs = Object.entries(bx.z).filter(([s]) => main.some(r => String(r[0]) === s)); if (zs.length) { cz = new Array(10).fill(0); for (const [, a] of zs) a.forEach((x, i) => cz[i] += x); } }
  if (!po && bx.r) { let w = 0; const acc = [0,0,0];
    for (const r of main) { const t = bx.r[String(r[0])]; if (t && t[0] != null) { w += r[BXI.mp]; for (let i = 0; i < 3; i++) acc[i] += (t[i] ?? 0)*r[BXI.mp]; } }
    if (w > 0) cr = acc.map(x => x/w); }
  const carRow = `<tr class="car">${cols.map(([k, , f], i) => {
    const gs = gstart.has(i) ? "gs" : "";
    if (k === "season") return `<td class="l">Career</td>`;
    if (k === "team") return `<td class="l ${gs}">${new Set(rows.filter(r => r[3] !== 1).map(r => r[2])).size} tm</td>`;
    if (k === "age") return `<td class="${gs}"></td>`;
    const v = bxv(car, k, mode, cz, cr);
    return `<td class="${gs}">${k === "pm" ? bxPm(v, mode) : bxFmt(v, f, mode)}</td>`; }).join("")}</tr>`;
  const ml = BXMODES.find(m => m[0] === mode)[1].toLowerCase();
  const leg = `<div class="bxleg">
    <span><i class="sw" style="background:${mix(panel, cold, 0.3)}"></i>bottom of the league</span>
    <span><i class="sw" style="background:${mix(panel, hot, 0.3)}"></i>top of the league</span>
    <span>Shading = his percentile that season among players with ${po ? "100+ playoff" : "500+"} minutes${po ? "" : " (scaled for short seasons)"}; ${tab === "shoot" ? "" : "turnovers and fouls are flipped so red is always good."}${tab === "adv" ? " SiPM is shaded by its value (±6 = full colour)." : ""}</span>
    <span><b style="color:var(--ink)">Bold</b> = his best season in that column.</span>
    <span>Hover a cell for the exact percentile.</span></div>`;
  const foot = `<p class="note" style="margin-top:6px">${po ? "Playoffs" : "Regular season"}${(tab === "basic" || po) ? `, ${ml}` : ""}. Possessions: each game, the average of his team's and the opponent's FGA + 0.44 × FTA − OREB + TOV, times his share of the minutes. Per-75 points match the Singular hub within 1%. Games from 2003-04 on; ${sname(Math.max(...Object.keys(M.thr).map(Number)))} in progress. TOT = all teams in a traded season, with each team's line below it.</p>`;
  return `<section class="mod" id="m-box"><style>${BXCSS}</style>${head}${ctl}
    <div class="bxs" id="bx-scroll"><table>${thead}<tbody>${body}${carRow}</tbody></table></div>${leg}${foot}</section>`;
}

(window.WIRES = window.WIRES || []).push(function(){
  const sc = document.querySelector("#bx-scroll");
  if (sc && sc.scrollTo !== undefined) {
    if (BXSCROLL) { sc.scrollLeft = BXSCROLL[0]; sc.scrollTop = BXSCROLL[1]; }
    else sc.scrollTop = sc.scrollHeight;  // newest seasons and the career line in view
    BXSCROLL = null;
  }
  const keep = () => { const s = document.querySelector("#bx-scroll"); BXSCROLL = s ? [s.scrollLeft, s.scrollTop] : null; };
  const t = document.querySelector("#bx-tabs"), m = document.querySelector("#bx-mode");
  if (t) t.onclick = e => { const b = e.target.closest("button"); if (!b) return; BXTAB = b.dataset.bxtab; BXSCROLL = null; const y = window.scrollY; render(); window.scrollTo(0, y); };
  if (m) m.onclick = e => { const b = e.target.closest("button"); if (!b) return; keep(); BXMODE = b.dataset.bxmode; const y = window.scrollY; render(); window.scrollTo(0, y); };
});

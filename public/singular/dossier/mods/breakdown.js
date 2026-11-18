// "Where his rating comes from": exact SiPM breakdown, offence and defence as waterfalls.
// Data: d.sipmbd {v, o: [[key, value]], d: [[key, value]], last?, basis?, gp} and META.sipmbd_meta {rows: {o, d}, groups,
// cross, sub, terms, model_terms, own, basis, ...}, built by scripts/pp_sipm_breakdown.py from scripts/ov_sipm_decomp.py (parts
// add up to the published rating, checked in the build).
// Layers (R1, 2026-11-16, Griffin: "We can't use defensive stats to predict offensive impact in box score"): for each side,
// 1. "Box score: his offensive / defensive stats" (own-side stats only; rim deterrence as a labelled play-by-play sub-row on
// defence), 2. "Patterns beyond the box" (cross-side stat terms, size and experience, minutes, the model's constant; each with
// one pattern line), 3. lineup results, 4. projection, 5. this season. Each layer heading shows its subtotal.
// Credit order (R1b, 2026-11-16, Griffin: "Size should be the residual after offensive rebounds"): when META.sipmbd_meta.attribution
// is present (pp_sipm_breakdown.py SEQUENTIAL_ATTRIBUTION = True), layers 1-2 hold an ordered split of the same box rating
// (own-side stats, then cross-side stats, then minutes / height / age; method "nested" is exact, "stagewise" adds a "Model
// remainder" row) and the lede, the layer-2 note and "What each step means" say so. Without it the page reads as R1.
// The section is placed after the first section by a WIRES hook (the page's render list is not edited); it replaces the
// older approximate "Where the rating comes from" section (modParts, hub box map), which is removed from the page when this one shows.
// Stat chips (H3; R1 layout): when mods/statdist.js is loaded, each own-side stat step shows its chips (his Basketball-Reference
// stat + league percentile, linking to #s-<stat>-<year>-p<id>) to the left of its bar, stacked when a row has two; cross-side
// rows show none. A control sits above the columns; players without stat steps get a strip.
// BD_SHORT (DESIGNP 2026-11-17; Griffin: "show less by default, but let people dig in"): the short default. Layer 2 shows two
// lines per side instead of seven or eight: "Defence -> offence" (on offence: what his steals, blocks, defensive rebounds and fouls
// add beyond his offensive box score) or "Offence -> defence" (on defence: scoring, shooting, assists, offensive rebounds,
// turnovers), and "Minutes, height and age" (minutes and games, height, age, the model's starting value). Each has a (?) that
// opens the stat-by-stat detail in plain words with the sign spelled out ("Players who take more shots than their defensive
// stats suggest also tend to defend worse than their defensive box score shows. He takes more shots than his defensive stats
// suggest: -0.8"); the pattern's direction is read from the build's own pattern line, his side of it from the sign of his part.
// Height and age are split when the data carry "x" (pp_sipm_breakdown.py BD_SPLIT). The long lede and "How to read this" move
// behind a (?) next to the heading. Needs mods/gloss.js (ppQ); without it, or BD_SHORT false, the module is as before.
const BD_SHORT = true;
const BD_ACT = {stl: ["get more steals", "gets more steals", "gets fewer steals"], blk: ["block more shots", "blocks more shots", "blocks fewer shots"],
  dreb: ["grab more defensive rebounds", "grabs more defensive rebounds", "grabs fewer defensive rebounds"], fouls: ["commit more fouls", "commits more fouls", "commits fewer fouls"],
  scoring: ["take more shots", "takes more shots", "takes fewer shots"], efficiency: ["shoot more efficiently", "shoots more efficiently", "shoots less efficiently"],
  passing: ["get more assists", "gets more assists", "gets fewer assists"], oreb: ["grab more offensive rebounds", "grabs more offensive rebounds", "grabs fewer offensive rebounds"],
  turnovers: ["commit more turnovers", "commits more turnovers", "commits fewer turnovers"], minutes: ["play more minutes", "plays more minutes", "plays fewer minutes"]};
const BDCSS2 = `
#m-sipmbd .bdr .bdl .ppq{margin-left:5px}
#m-sipmbd .bdr.bdc .bdl{overflow:visible;white-space:normal;line-height:1.25}
#m-sipmbd .bdr .bdst2 .bdst{grid-area:auto;margin:0;display:flex;flex-direction:column;gap:2px}
#m-sipmbd .ppqb{margin:4px 0 10px}
#m-sipmbd .ppqb .num{font:500 13px var(--mono);white-space:nowrap}
#m-sipmbd .bdg .ppq{margin-left:6px}
#m-sipmbd .lede .ppq{vertical-align:1px}
`;
const BDCSS = `
#m-sipmbd .bdcols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px 36px;margin-top:6px}
@media (max-width:1080px){#m-sipmbd .bdcols{grid-template-columns:minmax(0,1fr)}}
#m-sipmbd h3{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 4px}
#m-sipmbd h3 .num{font:600 18px var(--mono);color:var(--ink)}
#m-sipmbd .bdg{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:14px 0 3px;padding-bottom:2px;border-bottom:1px solid var(--grid)}
#m-sipmbd .bdgt{font:600 12.5px var(--mono);letter-spacing:0;color:var(--ink);font-variant-numeric:tabular-nums}
#m-sipmbd .bdgn{font-size:12.5px;line-height:1.4;color:var(--mute);margin:2px 0 6px}
#m-sipmbd .bdsub{font-size:11.5px;color:var(--mute);font-style:italic;margin:6px 0 1px}
#m-sipmbd .bdr{display:grid;grid-template-columns:136px 168px minmax(0,1fr) 46px;grid-template-areas:"l c t v";gap:2px 8px;align-items:center;min-height:24px;font-size:13.5px;padding:1px 0}
#m-sipmbd .bdl{grid-area:l;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#m-sipmbd .bdr .bdst,#m-sipmbd .bdr .bdst0{grid-area:c;margin:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}
#m-sipmbd .bdr .sdc{font-size:11.5px;padding:1px 3px 1px 7px;max-width:100%}
#m-sipmbd .bdr .sdc b{font-size:11.5px}
#m-sipmbd .bdt{grid-area:t;position:relative;height:14px}
#m-sipmbd .bdt i{position:absolute;top:0;bottom:0;border-radius:2px;min-width:1px}
#m-sipmbd .bdt b{position:absolute;top:-4px;bottom:-4px;width:1px;background:var(--mute);opacity:.6}
#m-sipmbd .bdv{grid-area:v;font-family:var(--mono);text-align:right;font-variant-numeric:tabular-nums}
#m-sipmbd .bdp{font-size:12px;line-height:1.35;color:var(--mute);margin:0 0 5px}
#m-sipmbd .bdr.tot{border-top:1px solid var(--line);margin-top:8px;padding-top:6px;font-weight:600}
#m-sipmbd .bdr.tot .bdl{grid-column:1 / 3}
#m-sipmbd .bdr.tot .bdt{height:16px}
#m-sipmbd .bdsum{display:flex;flex-wrap:wrap;gap:6px 18px;margin:2px 0 12px;font-size:14px}
#m-sipmbd .bdsum span b{font-family:var(--mono);font-weight:600}
#m-sipmbd details{margin-top:14px}
#m-sipmbd summary{cursor:pointer;font-size:14px;color:var(--ink)}
#m-sipmbd details h4{font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:14px 0 4px}
#m-sipmbd dl{display:grid;grid-template-columns:150px minmax(0,1fr);gap:4px 14px;font-size:13.5px;margin:6px 0 10px}
#m-sipmbd details p.note{margin:4px 0 8px}
@media (max-width:520px){#m-sipmbd dl{grid-template-columns:minmax(0,1fr)} #m-sipmbd dd{margin:0 0 6px}}
#m-sipmbd dt{font-weight:600}
#m-sipmbd dd{margin:0;color:var(--mute)}
@media (max-width:560px){
  #m-sipmbd .bdr{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr) 42px;grid-template-areas:"l t v" "c t v";gap:1px 6px;font-size:13px}
  #m-sipmbd .bdr .bdst0{display:none}
  #m-sipmbd .bdr.nc{grid-template-areas:"l t v"}
  #m-sipmbd .bdr .bdst{margin:1px 0 3px}
  #m-sipmbd .bdr.tot .bdl{grid-area:l}
}
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
// group helpers: a group is [key, title (string or {o, d}), keys (array or {o, d})]
function bdGKeys(g, k){ return Array.isArray(g[2]) ? g[2] : ((g[2] || {})[k] || []); }
function bdGTitle(g, k){ return typeof g[1] === "string" ? g[1] : (g[1] || {})[k] || ""; }
function bdRowsOf(M, k){ const R = M.rows || {}; return R.o || R.d ? (R[k] || {}) : R; }

function modBreakdown(d){
  const B = d.sipmbd, M = META.sipmbd_meta, s = d.summary || {};
  if (!B || !M) return "";
  const nm = String(d.name || "");
  const head = `<section class="mod" id="m-sipmbd"><style>${BDCSS}</style>
  <div class="mhead"><h2>Where his rating comes from<span class="new">new</span></h2></div>`;
  const sdOn = typeof sdControl === "function" && typeof sdStrip === "function";
  const sdRow = (key, side) => typeof sdRowChips === "function" ? sdRowChips(d, key, side) : "";
  if (B.v === "none" || s.r_proj == null) {
    const strip = sdOn ? sdStrip(d) : "";
    return head + `<p class="lede">SiPM has no rating for ${E(d.name)} yet: he has no recent NBA rating and no draft-based estimate, so there is nothing to break down.</p>${strip ? sdControl(d, true) + strip : ""}</section>`;
  }
  const groups = M.groups[B.v] || [];
  const SHORT = BD_SHORT && typeof ppQ === "function" && B.v === "sipm";
  const side = {o: B.o || [], d: B.d || []}, pub = {o: s.r_proj_o, d: s.r_proj_d};
  const SW = {o: "offense", d: "defense"};
  const AT = M.attribution || null, ADJ = {o: "offensive", d: "defensive"};
  const remRow = !!(AT && AT.remainder && AT.remainder.row);
  // layer-2 note: R1 (joint terms) or ordered credit
  const beyondNote = k => !AT ? `What lineup data shows beyond his own ${ADJ[k]} stats. Each part is measured from the average player, so having less of a trait than average flips its sign.`
    : `Credit given after his ${ADJ[k]} stats, in this order: his ${ADJ[k === "o" ? "d" : "o"]} stats first, then his minutes, height and age. `
      + (AT.method === "nested" ? "Each gets credit only for what it adds beyond the stats before it, so a part is negative when he has less of something than his stats suggest, or when the pattern runs against him."
         : "Each part is measured from the average player. The last row is what the ordered steps leave over.");
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
  // BD_SHORT: layer 2 as two lines with (?) detail (see the note at the top of this file)
  const bdShortBeyond = (k, idx, gsum, keys, R, cross) => {
    const SW = {o: "offense", d: "defense"}[k], OWNW = {o: "offensive", d: "defensive"}[k];
    const dirOf = key => /underperform/.test((R[key] || [])[1] || "") ? -1 : 1;
    const eff = d => k === "o" ? (d > 0 ? "help the offense in ways their offensive box score misses" : "hurt the offense in ways their offensive box score misses")
      : (d > 0 ? "defend better than their defensive box score shows" : "defend worse than their defensive box score shows");
    const sent = (key, t, v, basis) => {   // the pattern, then where he sits on it, then his number
      const a = BD_ACT[key], d = dirOf(key), his = Math.sign(v) * d;
      return `Players who ${a[0]} than their ${basis} suggest${basis === "box score" ? "s" : ""} also tend to ${eff(d)}. `
        + (t === 0 ? `For him this rounds to 0.0.` : `He ${his > 0 ? a[1] : a[2]} than his ${basis} suggest${basis === "box score" ? "s" : ""}: <span class="num">${bdFmt(t)}</span>.`);
    };
    const line = (label, qid, ii, body, chips, tip) => {
      const a = cum[k][ii[0]][0], b = cum[k][ii[ii.length - 1]][1], t = ii.reduce((s, i) => s + disp[k][i], 0);
      return `<div class="bdr${chips ? "" : " nc"} bdc" data-k="${qid}"><span class="bdl" title="${E(tip || "")}">${label}${ppQ(qid, "What makes up this line")}</span>${chips ? `<span class="bdst bdst2">${chips}</span>` : '<span class="bdst0"></span>'}<span class="bdt">${zero}${t ? bar(a, b, t > 0 ? "var(--hot)" : "var(--cold)") : ""}</span><span class="bdv">${bdFmt(t)}</span></div>${ppQBody(qid, body)}`;
    };
    const vOf = key => { const i = keys.indexOf(key); return i < 0 ? null : [disp[k][i], side[k][i][1]]; };
    const ci = idx.filter(i => cross.has(keys[i])), oi = idx.filter(i => !cross.has(keys[i]));
    let h = `<div class="bdg" data-g="beyond"><span>Patterns beyond the box${ppQ(`bdq-${k}-bey`, "What patterns beyond the box are")}</span><span class="bdgt">${bdFmt(gsum)}</span></div>${ppQBody(`bdq-${k}-bey`, `<p>${beyondNote(k)}</p>`)}`;
    if (ci.length) {
      const lab = k === "o" ? "Defense → offense" : "Offense → defense";
      const intro = k === "o" ? `What his defensive stats say about his offense, beyond his offensive box score. A plus means his defensive stats go with better offense than his offensive box shows.`
        : `What his offensive stats say about his defense, beyond his defensive box score. A minus means his offensive load goes with worse defense than his defensive box shows.`;
      h += line(lab, `bdq-${k}-x`, ci, `<p>${intro}</p>` + ci.map(i => `<p><b>${E((R[keys[i]] || [keys[i]])[0])}.</b> ${sent(keys[i], disp[k][i], side[k][i][1], `${OWNW} stats`)}</p>`).join(""), "", intro);
    }
    if (oi.length) {
      const ps = [], x = (B.x || {})[k], sz = vOf("size"), mi = vOf("minutes"), co = vOf("const");
      if (sz) {
        if (x) { const tt = bdTenths(x, sz[0] / 10), dH = /are shorter/.test((R.size || [])[1] || "") ? -1 : 1, his = Math.sign(x[0]) * dH;
          ps.push(`<p><b>Height.</b> ${dH > 0 ? "Taller" : "Shorter"} players tend to do better on ${SW} than their box score shows. ${tt[0] === 0 ? "For him this rounds to 0.0." : `He is ${his > 0 ? "taller" : "shorter"} than his stats would suggest: <span class="num">${bdFmt(tt[0])}</span>.`}</p>`);
          ps.push(`<p><b>Age.</b> How players of his age, with the same box score, tend to do on ${SW}: <span class="num">${bdFmt(tt[1])}</span>.</p>`); }
        else ps.push(`<p><b>Height and age.</b> ${E((R.size || [])[1] || "")} <span class="num">${bdFmt(sz[0])}</span>.</p>`);
      }
      if (mi) ps.push(`<p><b>Minutes and games.</b> ${sent("minutes", mi[0], mi[1], "box score")}</p>`);
      if (co) ps.push(`<p><b>Starting value.</b> The model's fixed starting value, the same for every player: <span class="num">${bdFmt(co[0])}</span>.</p>`);
      const rem = vOf("remainder"); if (rem) ps.push(`<p><b>Model remainder.</b> ${E((R.remainder || [])[1] || "")} <span class="num">${bdFmt(rem[0])}</span>.</p>`);
      h += line("Minutes, height and age", `bdq-${k}-h`, oi, ps.join(""), oi.map(i => sdRow(keys[i], k)).join(""), `What his minutes, height and age add on ${SW} beyond his box score, once his stats are counted`);   // his MPG and height chips
    }
    return h;
  };
  const chart = (k, title) => {
    const keys = side[k].map(x => x[0]), R = bdRowsOf(M, k), cross = new Set((M.cross || {})[k] || []), sub = (M.sub || {})[k] || {};
    let h = `<div class="bdside" data-side="${k}"><h3>${title} <span class="num">${sgn(pub[k])}</span></h3>`;
    for (const g of groups) {
      const idx = bdGKeys(g, k).map(key => keys.indexOf(key)).filter(i => i >= 0);
      if (!idx.length) continue;
      const gsum = idx.reduce((a, i) => a + disp[k][i], 0);
      if (SHORT && g[0] === "beyond") { h += bdShortBeyond(k, idx, gsum, keys, R, cross); continue; }
      h += `<div class="bdg" data-g="${E(g[0])}"><span>${E(bdGTitle(g, k))}</span><span class="bdgt">${bdFmt(gsum)}</span></div>`;
      if (g[0] === "beyond") h += `<p class="bdgn">${beyondNote(k)}</p>`;
      for (const i of idx) {
        const key = keys[i], t = disp[k][i], r = R[key] || [key, ""];
        const [a, b] = cum[k][i];
        if (sub[key]) h += `<div class="bdsub">${E(sub[key])}</div>`;
        const chips = cross.has(key) ? "" : sdRow(key, k);
        h += `<div class="bdr${chips ? "" : " nc"}" data-k="${E(key)}"><span class="bdl" title="${E(r[1])}">${E(r[0])}</span>${chips || '<span class="bdst0"></span>'}<span class="bdt">${zero}${t ? bar(a, b, t > 0 ? "var(--hot)" : "var(--cold)") : ""}</span><span class="bdv">${bdFmt(t)}</span></div>`;
        if (g[0] === "beyond" && r[1]) h += `<p class="bdp">${E(r[1])}</p>`;
      }
    }
    const T = Math.round(parseFloat(pub[k].toFixed(1)) * 10);
    h += `<div class="bdr tot"><span class="bdl">${title} rating</span><span class="bdt">${zero}${T ? bar(0, T, "var(--ink)") : ""}</span><span class="bdv">${sgn(pub[k])}</span></div></div>`;
    return h;
  };

  // plain-language summary: net by layer (a key's layer depends on the side). Each value is the offence + defence layer
  // subtotals the columns show, so the line agrees with the columns; when those add up 0.1 away from the header's rating
  // (offence and defence rounded apart), the 0.1 goes to the layer whose exact value is furthest from its shown value.
  const stageOf = (key, k) => { for (const g of groups) if (bdGKeys(g, k).includes(key)) return g[0]; return "other"; };
  const st = {}, stD = {};
  for (const k of ["o", "d"]) side[k].forEach(([key, v], i) => { const g = stageOf(key, k); st[g] = (st[g] || 0) + v; stD[g] = (stD[g] || 0) + disp[k][i]; });
  const gks = groups.map(g => g[0]).filter(g => g in st), stT = gks.map(g => stD[g]);
  let gap = Math.round(parseFloat(s.r_proj.toFixed(1)) * 10) - stT.reduce((a, b) => a + b, 0);
  while (gap !== 0 && gks.length) {
    const dir = Math.sign(gap), res = gks.map((g, i) => [dir * (st[g] * 10 - stT[i]), i]).sort((a, b) => b[0] - a[0]);
    stT[res[0][1]] += dir; gap -= dir;
  }
  const stv = Object.fromEntries(gks.map((g, i) => [g, bdFmt(stT[i])]));
  const net = s.r_proj, mag = Math.abs(net).toFixed(1);
  const what = net >= 0.05 ? `about ${mag} points per 100 possessions better than an average NBA player` : net <= -0.05 ? `about ${mag} points per 100 possessions worse than an average NBA player` : "about the same as an average NBA player";
  const games = B.gp ? `his ${B.gp} game${B.gp === 1 ? "" : "s"} this season <b>${stv.season}</b>` : "no games yet this season";
  let lede, sum;
  if (B.v === "sipm") {
    lede = AT ? `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. It builds that number in layers, giving credit in order. First his box-score stats for each end of the floor: offensive stats toward his offense, defensive stats toward his defense. Then, only for what those leave unexplained, his stats from the other end of the floor, and then his minutes, height and age. Then how his lineups actually did, and a projection step for age and role. This season's games update it from there.`
      : `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. It builds that number in layers. First his box-score stats: offensive stats count toward his offense, defensive stats toward his defense. Then patterns that lineup data shows beyond the box score, such as height and age. Then how his lineups actually did, and a projection step for age and role. This season's games update it from there.`;
    sum = `<span>Box-score stats <b>${stv.box}</b></span><span>Patterns beyond the box <b>${stv.beyond}</b></span><span>Lineup results <b>${stv.lineups}</b></span><span>Age and role <b>${stv.proj}</b></span><span>${B.gp ? `${B.gp} game${B.gp === 1 ? "" : "s"} this season` : "This season (no games yet)"} <b>${stv.season}</b></span>`;
  } else if (B.v === "sipm_gap") {
    lede = `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. He has no 2025-26 rating (he played little or not at all last season), so SiPM starts from his rating after ${sname(B.last)} and rolls it forward to this season; ${games}.`;
    sum = `<span>Rating after ${sname(B.last)}, rolled forward <b>${stv.past}</b></span><span>This season <b>${stv.season}</b></span>`;
  } else {
    const basis = (M.basis || {})[B.basis || "none"] || "his draft slot and age";
    lede = `SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. He has no NBA lineup history yet, so his rating starts from a rookie estimate based on ${E(basis)}; ${games}.`;
    sum = `<span>Rookie estimate <b>${stv.rookie}</b></span><span>This season <b>${stv.season}</b></span>`;
  }
  // "What each step means": rows in layer order, each once (a row's text is the same wherever it shows, except layer 2)
  const used = {o: new Set(side.o.map(x => x[0])), d: new Set(side.d.map(x => x[0]))};
  const dlOf = (gkeys, seen) => {
    let h = "";
    for (const [key, k] of gkeys) {
      if (seen.has(key) || !used[k].has(key)) continue;
      seen.add(key);
      const r = bdRowsOf(M, k)[key];
      if (r) h += `<dt>${E(r[0])}</dt><dd>${E(r[1])}</dd>`;
    }
    return h ? `<dl>${h}</dl>` : "";
  };
  let how;
  if (B.v === "sipm") {
    const pick = gk => { const g = groups.find(x => x[0] === gk); return g ? ["o", "d"].flatMap(k => bdGKeys(g, k).map(key => [key, k])) : []; };
    const seen = new Set();
    const boxDl = dlOf(pick("box"), seen), restDl = dlOf(["lineups", "proj", "season"].flatMap(pick), new Set());
    const restNote = `<p class="note">A lineup model starts from the box-score rating and moves it by how his lineups actually scored and defended, carrying earlier seasons forward at three-quarters weight a year. A projection step then weighs the two by how well each predicted the next season and adds age and role. His box-score games this season move it from there. Parts are measured from the average player-season the model learned from.</p>`;
    const nfmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (AT) how = `<h4>Box score</h4>${boxDl}<p class="note">SiPM's box-score model reads his stats per 36 minutes, adjusted for opponents, from last season (2025-26), together with his minutes, height and age, and predicts how his lineups did at each end of the floor. This page splits that box-score rating by giving credit in order. Step 1: the stats for that end of the floor take all the credit they can explain on their own: scoring, shooting, assists, offensive rebounds and turnovers on offense; defensive rebounds, steals, blocks and fouls on defense. Rim deterrence is a defensive measure from play-by-play (how many fewer shots opponents take at the rim with him on the floor), so it is listed on defense but marked as not from the box score.</p>
    <h4>Patterns beyond the box</h4><p class="note">Step 2: his stats from the other end of the floor get credit only for what step 1 left unexplained${AT.method === "nested" ? ", and only for the part of each stat that his own-end stats do not already predict" : ""}. Step 3: his minutes, height and age get credit for what is still left${AT.method === "nested" ? ", again only beyond what his stats already say about them" : ""}. So a center's rebounds and blocks are credited before his height${AT.method === "nested" ? ": a tall player whose stats already look like a tall player's gets little extra for size, and a minus when his stats look like those of an even taller player" : ""}. ${remRow ? `Because his stats and traits overlap, the steps do not add up exactly: the "Model remainder" row holds the difference (about ${(+AT.remainder.sd.o).toFixed(1)} either way on offense and ${(+AT.remainder.sd.d).toFixed(1)} on defense for a typical player).` : "Nothing is left over: the steps and the starting value add up exactly to his box-score rating."} The order changes only how credit is split between these rows; his box-score rating, and so his overall rating, would be the same in any order. The split is fitted on the ${nfmt(AT.n_player_seasons)} player-seasons since ${E(AT.since)} that the model learned from, weighted by possessions. Each line under a bar says which way the pattern runs. These are patterns the fit found; the model does not say why they happen.</p>
    <h4>Lineups, projection and this season</h4>${restDl}${restNote}`;
    else how = `<h4>Box score</h4>${boxDl}<p class="note">SiPM's box-score model reads his stats per 36 minutes, adjusted for opponents, from last season (2025-26). Here each stat counts only on its own end of the floor: scoring, shooting, assists, offensive rebounds and turnovers on offense; defensive rebounds, steals, blocks and fouls on defense. Rim deterrence is a defensive measure from play-by-play (how many fewer shots opponents take at the rim with him on the floor), so it is listed on defense but marked as not from the box score.</p>
    <h4>Patterns beyond the box</h4><p class="note">The box-score model reads his whole stat line, height, age and minutes at once to predict how his lineups did at each end of the floor, with weights fitted on every season since 1996-97. Some weights cross over: once his offensive stats are counted, his blocks or defensive rebounds still say something about how his offense went in lineup data. Those cross-over parts, his size and age, his minutes, and the model's fixed starting value are not offensive or defensive stats, so they sit in this middle layer. Each line under a bar says which way the pattern runs. These are patterns the fit found; the model does not say why they happen.</p>
    <h4>Lineups, projection and this season</h4>${restDl}<p class="note">A lineup model starts from the box-score rating and moves it by how his lineups actually scored and defended, carrying earlier seasons forward at three-quarters weight a year. A projection step then weighs the two by how well each predicted the next season and adds age and role. His box-score games this season move it from there. Parts are measured from the average player-season the model learned from.</p>`;
  } else {
    const dl = dlOf(groups.flatMap(g => ["o", "d"].flatMap(k => bdGKeys(g, k).map(key => [key, k]))), new Set());
    how = dl + `<p class="note">${B.v === "sipm_gap" ? `When a player misses a season, SiPM keeps his last rating and moves it forward with a model fitted on past players who returned after time away (it accounts for his age and the seasons missed). His box-score games this season then move it.`
      : `Rookies have no NBA lineup data, so SiPM starts them from a rookie-season estimate: past rookies' first-season level, predicted from pre-NBA stats (when on file), draft slot and age. His box-score games this season then move it.`}</p>`;
  }
  const howRead = `<b style="color:var(--ink)">How to read this:</b> start at 0, an average NBA player. Each bar adds (warm colour) or takes away (blue) points per 100 possessions, starting where the bar above it ended. Each layer's heading shows what that layer adds up to. The bottom bar is where he lands: the same rating as at the top of the page. Steps are rounded to 0.1 so that they add up.`;
  if (SHORT) return head + `<style>${BDCSS2}</style><p class="lede">SiPM rates ${E(nm)} <b style="color:var(--ink)">${sgn(net)}</b>: ${what}. The bars build that number step by step from 0, an average player.${ppQ("bdq-how", "How SiPM builds the rating and how to read the bars")}</p>
  ${ppQBody("bdq-how", `<p>${lede}</p><p>${howRead}</p>`)}<div class="bdsum">${sum}</div>
  ${sdOn ? sdControl(d, false) : ""}<div class="bdcols">${chart("o", "Offense")}${chart("d", "Defense")}</div>
  <details><summary>What each step means</summary>${how}</details></section>`;
  return head + `<p class="lede">${lede}</p>
  <div class="bdsum">${sum}</div>
  <p class="note">${howRead}</p>
  ${sdOn ? (B.v === "sipm" ? sdControl(d, false) : "") : ""}<div class="bdcols">${chart("o", "Offense")}${chart("d", "Defense")}</div>
  ${sdOn && B.v !== "sipm" ? (s => s ? sdControl(d, true) + s : "")(sdStrip(d)) : ""}
  <details><summary>What each step means</summary>${how}</details></section>`;
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

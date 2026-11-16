// "As played" in the dossier's Season by season table (DISPLAY lane, 2026-11-16; Griffin's go).
// The Rating column showed Singular SiPM's end-of-season value, which is its projection for the NEXT season (age step
// included). With ASP_ON and d.bx.r carrying as-played ratings (scripts/pp_boxtables.py AS_PLAYED, META.bx_meta.ap = 1), the
// table shows each season's own rating ("As played": that season's lineup results shrunk toward his box-score rating), the old
// value as "Next-season forecast", and 2026-27 as the current forecast, labelled. Rows stay oldest first (d.box is ascending).
// ASP_ON false or no as-played data: modCareer (index.html) unchanged.
const ASP_ON = true;
function modCareerAP(d){
  const useAP = ASP_ON && (META.bx_meta || {}).ap && d.bx && d.bx.r;
  if (!useAP) return modCareer(d);
  if (!d.box.length) return "";
  const rat = Object.fromEntries((d.seasons||[]).map(s=>[s.season, s]));
  const f1 = v => v==null?"–":v.toFixed(1), fp = v => v==null?"–":(100*v).toFixed(1);
  const curS = 2026, sm = d.summary || {};
  const rows = d.box.map(b => { const r = rat[b.season] || {}, a = d.bx.r[String(b.season)];
    let rv, tag = "";
    if (b.season === curS) { rv = sm.r_proj ?? r.r_box; tag = sm.r_proj != null ? ` <span class="mute" style="font:11px var(--mono)">forecast</span>` : (rv != null ? "*" : ""); }
    else { rv = a ? a[0] : r.r_box; tag = !a && r.r_box != null ? "*" : ""; }
    const fc = b.season === curS ? null : r.r;
    return `<tr class="${b.season===curS?"cur":""}"><td>${sname(b.season)}</td><td class="l">${E(b.team)}</td><td>${b.gp}</td><td>${f1(b.mpg)}</td><td>${f1(b.ppg)}</td><td>${f1(b.rpg)}</td><td>${f1(b.apg)}</td><td>${f1(b.spg)}</td><td>${f1(b.bpg)}</td><td>${f1(b.tpg)}</td><td>${fp(b.fg)}</td><td>${fp(b.tp)}</td><td>${fp(b.ft)}</td><td>${fp(b.ts)}</td><td>${r.usg!=null?r.usg.toFixed(1):"–"}</td><td style="color:${rv==null?"":dcol(rv,6)};font-weight:500">${rv==null?"–":sgn(rv)}${tag}</td><td>${fc==null?"–":sgn(fc)}</td></tr>`; }).join("");
  return `<section class="mod"><div class="mhead"><h2>Season by season</h2></div>
  <div class="tbl"><table><thead><tr><th>Season</th><th class="l">Team</th><th>G</th><th>MPG</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TOV</th><th>FG%</th><th>3P%</th><th>FT%</th><th>TS%</th><th>USG</th><th title="His Singular rating for that season itself">As played</th><th title="His Singular SiPM at the end of that season: its projection for the following season">Next-season forecast</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="note">Regular season, oldest first. As played = his rating for that season itself: that season's lineup results, shrunk toward his box-score rating. Next-season forecast = his Singular SiPM at the end of that season, which projects the following season and so includes the expected change with age. ${sname(curS)}: the current forecast for the rest of the season. * = box-score rating only (no lineup rating yet).</p></section>`;
}

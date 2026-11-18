// (?) explainers (DESIGNP, 2026-11-17; Griffin: "show less by default, but let people dig in"; long explanations go behind a (?),
// Basketball-Reference style). Modules write ppQ(id, title) next to a heading or a row and ppQBody(id, html) where the text
// should open; one click handler opens / closes them (aria-expanded on the button, hidden on the text). Nothing here changes
// a page by itself: a module shows a (?) only when its own switch is on (breakdown.js BD_SHORT, compare.js CMP_GLOSS,
// front.js / history.js sweep switches).
// NAME_SHORT (Griffin: chart labels should say "Williams", not "III"): ppSur(name) = the surname for chart labels and legends,
// without Jr. / Sr. / II / III / IV / V ("Jaren Jackson Jr." -> "Jackson"). Used by compare.js (line-end labels), statdist.js
// (his marker), index.html (lineup / similarity labels). Full names stay in tables' name cells and tooltips.
// False = the last word of the name, exactly as those places did before.
const NAME_SHORT = true;
function ppSur(n){
  const w = String(n == null ? "" : n).split(" ");
  if (!NAME_SHORT) return w.slice(-1)[0];
  while (w.length > 1 && /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(w[w.length - 1].replace(/,$/, ""))) w.pop();
  return w[w.length - 1].replace(/,$/, "");
}
function ppQ(id, title){ return `<button class="ppq" type="button" aria-expanded="false" aria-controls="${id}" title="${title || "What this means"}" aria-label="${title || "What this means"}">?</button>`; }
function ppQBody(id, html, cls){ return `<div class="ppqb${cls ? " " + cls : ""}" id="${id}" hidden>${html}</div>`; }
const PPQ_CSS = `
.ppq{display:inline-flex;align-items:center;justify-content:center;flex:none;width:19px;height:19px;margin:0 0 0 6px;padding:0;border:1px solid var(--line);border-radius:50%;background:var(--panel);color:var(--mute);font:700 11.5px/1 var(--sans);vertical-align:2px;cursor:pointer;letter-spacing:0;text-transform:none}
.ppq:hover{border-color:var(--mute);color:var(--ink)}
.ppq[aria-expanded="true"]{background:var(--ink);border-color:var(--ink);color:var(--bg)}
@media (pointer:coarse){.ppq{width:24px;height:24px;font-size:13px}}
.ppqb{margin:6px 0 12px;padding:10px 14px;border-left:3px solid var(--line);background:var(--panel);font-size:13.5px;line-height:1.5;color:var(--ink);max-width:76ch;text-transform:none;letter-spacing:0;font-weight:400}
.ppqb[hidden]{display:none}
.ppqb p{margin:0 0 6px}
.ppqb p:last-child{margin-bottom:0}
`;
if (typeof document !== "undefined" && typeof document.addEventListener === "function" && typeof document.createElement === "function") {
  if (document.head && !document.getElementById("ppq-style")) { const st = document.createElement("style"); st.id = "ppq-style"; st.textContent = PPQ_CSS; document.head.appendChild(st); }
  document.addEventListener("click", e => {
    const b = e.target && e.target.closest ? e.target.closest("button.ppq") : null;
    if (!b) return;
    e.preventDefault();
    const t = document.getElementById(b.getAttribute("aria-controls"));
    if (!t) return;
    const open = t.hidden; t.hidden = !open; b.setAttribute("aria-expanded", String(open));
  });
}

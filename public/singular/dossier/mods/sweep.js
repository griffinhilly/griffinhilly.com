// Site sweep (DESIGNP, 2026-11-17; Griffin: "show less by default, but let people dig in"). Runs after every render (a WIRES
// hook; this file loads after the other modules, so it sees their final markup).
// SW_NOTES: a long explanatory note (p.note or the team page's p.hx-why, 240+ characters, anywhere in the page) shows its first
//   sentence and a (?) that opens the full text in place (mods/gloss.js). Short notes and the plain-language ledes stay as they are.
// SW_JUMP: the row of 20-35 section buttons under a player's header ("Impact by age", "Stats", ...) becomes one "Jump to" menu.
// Both false = the page exactly as before.
const SW_NOTES = true;
const SW_JUMP = true;
let SWN = 0;
const SW_CSS = `
.swjump{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--mute)}
.swjump select{font:15px var(--sans);padding:6px 10px;min-width:0;max-width:100%}
p.swt .ppq{vertical-align:0}
`;
function swStyle(){
  if (document.getElementById("sw-style") || !document.head) return;
  const st = document.createElement("style"); st.id = "sw-style"; st.textContent = SW_CSS; document.head.appendChild(st);
}
function swTeaser(t){   // first sentence, 30-220 characters; else the first ~150 characters at a word break
  const m = /^([\s\S]{30,220}?[.!?:])\s+(?=[A-Z0-9“"(‘'])/.exec(t);
  return m ? m[1] : t.slice(0, 150).replace(/\s+\S*$/, "") + "…";
}
function swNotes(){
  for (const p of document.querySelectorAll("#app p.note, #app p.hx-why")) {
    if (p.dataset.sw || p.closest(".ppqb")) continue;
    const t = p.textContent.replace(/\s+/g, " ").trim();
    if (t.length < 240) continue;
    const id = "swq" + (++SWN), full = p.innerHTML;
    p.dataset.sw = "1"; p.classList.add("swt");
    p.innerHTML = E(swTeaser(t)) + ppQ(id, "Read the full note");
    p.insertAdjacentHTML("afterend", ppQBody(id, `<p>${full}</p>`));
  }
}
function swJump(){
  const nav = document.getElementById("jump");
  if (!nav || nav.dataset.sw) return;
  const btns = [...nav.querySelectorAll("button")];
  if (btns.length < 6) return;
  const secs = [...document.querySelectorAll("section.mod")];
  nav.dataset.sw = "1";
  nav.innerHTML = `<label class="swjump">Jump to <select aria-label="Jump to a section"><option value="">a section…</option>${btns.map(b => `<option value="${E(b.dataset.i)}">${E(b.textContent.trim())}</option>`).join("")}</select></label>`;
  nav.onclick = null;
  const sel = nav.querySelector("select");
  sel.onchange = () => { const s = secs[+sel.value]; if (sel.value !== "" && s) s.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); sel.value = ""; };
}
(window.WIRES = window.WIRES || []).push(function(){
  if (!(SW_NOTES || SW_JUMP) || typeof document === "undefined" || typeof document.createElement !== "function" || typeof ppQ !== "function") return;
  swStyle();
  if (SW_JUMP) swJump();
  if (SW_NOTES) swNotes();
});
// pages drawn outside render() (front page, fantasy, team seasons, retired players) do not run WIRES: watch #app instead
if (typeof MutationObserver === "function" && typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");
    if (!app || !(SW_NOTES || SW_JUMP)) return;
    let q = false;
    new MutationObserver(() => { if (q) return; q = true; setTimeout(() => { q = false; if (typeof ppQ === "function") { swStyle(); if (SW_NOTES) swNotes(); } }, 0); })
      .observe(app, {childList: true, subtree: true});
  });
}

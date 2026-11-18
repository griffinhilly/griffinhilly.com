// Sticky header v2 (DESIGNP, 2026-11-17; Griffin: "show less by default, but let people dig in"; remove the always-on player
// shortcut buttons; the sticky header = a search bar + a menu button). Agreed with DESIGNH so the Singular hub pages carry the
// same header (classes .sg2-bar / .sg2-q / .sg2-menu / .sg2-panel; Singular build_singular_hub.py switch HUB_HDR):
//   [Singular -> /singular/]  [search: players, current and retired, and team seasons]  [Menu]
// The menu holds the site links (Players, All-time, Seasons, Teams, Fantasy, Method | Tests, Ratings table, Bulls report) and the
// hub's light / dark switch (same localStorage key "theme" and data-theme attribute as the hub, so the choice carries across).
// The page's own search box (#q with its name list #plist, wired by index.html and mods/history.js) is moved into the new bar, so
// both keep working; the shortcut buttons (#quick) are hidden, not removed (index.html's boot() still fills them). The links the
// page or the site copy put in the bar ("Fantasy ranks", "Teams", "Singular home") are dropped: the menu has them. On the
// /singular/ home the hub's own toolbar (.sg-top) is removed, so exactly one header shows (agreed with DESIGNH).
// Search: Enter takes the exact name, else the first name that starts with the text, else the first that contains it. A ?q=
// in the address (the hub pages' search form sends /singular/dossier/?q=...) is resolved the same way on load.
// HDR_V2 false = the header exactly as before (nothing in this file runs).
const HDR_V2 = true;
const HDR_LINKS = [["Players", "/singular/"], ["All-time", "/singular/all-time/"], ["Seasons", "/singular/season/"],
  ["Teams", "/singular/dossier/#teams"], ["Fantasy", "/singular/dossier/#fantasy"], ["Method", "/singular/method/"], null,
  ["Tests", "/singular/tests/"], ["Ratings table", "/singular/ratings/"], ["Bulls report", "/singular/report/"]];
const HDR_CSS = `
.bar.sg2-bar{padding-block:8px}
.sg2-bar .wrap{position:relative;display:flex;align-items:center;gap:14px;flex-wrap:nowrap;min-height:36px}
.sg2-brand{font:700 17px/1 var(--serif);color:var(--ink);text-decoration:none;white-space:nowrap;letter-spacing:.01em}
.sg2-brand:hover{color:var(--brown)}
.sg2-q{flex:1 1 auto;min-width:0;max-width:560px;margin:0;display:flex}
.sg2-q #q{flex:1 1 auto;width:100%;min-width:0;padding:7px 12px;font-size:16px}
.sg2-menu{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:7px;font:600 14px var(--sans);padding:7px 13px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);cursor:pointer}
.sg2-menu:hover,.sg2-menu[aria-expanded="true"]{border-color:var(--mute)}
.sg2-panel{position:absolute;right:max(16px,env(safe-area-inset-right,0px));top:calc(100% + 9px);z-index:20;min-width:220px;display:flex;flex-direction:column;padding:6px;background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.14)}
.sg2-panel[hidden]{display:none}
.sg2-panel a,.sg2-panel button{display:block;width:100%;padding:8px 12px;border:0;border-radius:6px;background:none;color:var(--ink);font:15px/1.3 var(--sans);text-align:left;text-decoration:none;cursor:pointer}
.sg2-panel a:hover,.sg2-panel button:hover,.sg2-panel a:focus-visible,.sg2-panel button:focus-visible{background:var(--grid);outline:none}
.sg2-panel a[aria-current="page"]{font-weight:700}
.sg2-panel hr{border:0;border-top:1px solid var(--line);margin:5px 8px}
.sg2-panel .sg2-theme{color:var(--mute)}
@media (max-width:480px){.sg2-menu span{display:none}.sg2-menu{padding:8px 10px}.sg2-bar .wrap{gap:10px}.sg2-brand{font-size:15px}}
`;
function hdrHere(){
  const h = typeof location !== "undefined" ? (location.hash || "") : "";
  return /^#(teams|t-)/.test(h) ? "Teams" : h === "#fantasy" ? "Fantasy" : "Players";
}
function hdrMark(){
  const cur = hdrHere();
  for (const a of document.querySelectorAll("#sg2-panel a")) {
    if (a.textContent === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
}
function hdrClose(focusBtn){
  const p = document.getElementById("sg2-panel"), b = document.querySelector(".sg2-menu");
  if (!p || p.hidden) return;
  p.hidden = true; if (b) { b.setAttribute("aria-expanded", "false"); if (focusBtn) b.focus(); }
}
// every name the search box knows: current players (index.json), then retired players and team seasons (mods/history.js)
function hdrNames(){
  const out = [];
  if (typeof META !== "undefined" && META && META.players) for (const p of META.players) out.push([p.name, "p-" + p.id]);
  if (typeof HX !== "undefined" && HX && HX.idx) for (const [k, h] of Object.entries(HX.idx)) out.push([k, h]);
  return out;
}
function hdrNorm(s){ return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase(); }   // "jokic" finds "Jokić"
function hdrFind(text){
  const t = hdrNorm(text);
  if (!t) return null;
  const all = hdrNames().map(x => [hdrNorm(x[0]), x[1]]);
  const hit = all.find(x => x[0] === t) || all.find(x => x[0].startsWith(t)) || all.find(x => x[0].split(" ").some(w => w.startsWith(t))) || all.find(x => x[0].includes(t))
    || all.find(x => t.split(/\s+/).every(w => x[0].includes(w)));   // "bulls 1995" finds "1995-96 Chicago Bulls"
  return hit ? hit[1] : null;
}
function hdrLoadAll(){   // the retired players and team seasons load lazily (history.js); the same loader its search box uses
  if (typeof hxNames !== "function" || typeof hxTeams !== "function" || typeof hxOptions !== "function") return Promise.resolve();
  return Promise.all([hxNames(), hxTeams()]).then(([n, t]) => hxOptions(n, t)).catch(() => {});
}
function hdrQuery(){   // ?q=<text> from the hub pages' search form
  let q = null;
  try { q = new URLSearchParams(location.search).get("q"); } catch (e) { q = null; }
  if (!q) return;
  const clean = () => { try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* file:// */ } };
  let tries = 0;
  const go = () => {
    if ((typeof META === "undefined" || !META) && tries++ < 100) return void setTimeout(go, 100);
    let h = hdrFind(q);
    const done = () => { clean(); if (h) location.hash = h; else { const i = document.getElementById("q"); if (i) { i.value = q; i.focus(); } } };
    if (h && /^p-/.test(h) && hdrNames().some(x => x[0].toLowerCase() === q.trim().toLowerCase())) return done();
    hdrLoadAll().then(() => { h = hdrFind(q); done(); });
  };
  go();
}
function hdrInit(){
  if (!HDR_V2 || typeof document === "undefined" || typeof document.querySelector !== "function" || typeof document.createElement !== "function") return;
  const bar = document.querySelector(".bar"), wrap = bar && bar.querySelector(".wrap"), q = document.getElementById("q");
  if (!bar || !wrap || !q || bar.classList.contains("sg2-bar")) return;
  const top = document.querySelector(".sg-top"); if (top) top.remove();   // the hub's toolbar on /singular/ (DESIGNH)
  if (!document.getElementById("sg2-style")) { const st = document.createElement("style"); st.id = "sg2-style"; st.textContent = HDR_CSS; document.head.appendChild(st); }
  bar.classList.add("sg2-bar");
  const quick = document.getElementById("quick"); if (quick) quick.style.display = "none";   // boot() still fills it; never shown
  for (const a of [...wrap.querySelectorAll("a")]) a.remove();      // "Fantasy ranks", "Singular home" (site copy)
  const brand = wrap.querySelector(".brand"); if (brand) brand.remove();
  const b = document.createElement("a"); b.className = "sg2-brand"; b.href = "/singular/"; b.textContent = "Singular";
  const f = document.createElement("form"); f.className = "sg2-q"; f.setAttribute("role", "search"); f.action = "/singular/dossier/"; f.method = "get";
  q.name = "q"; q.type = "search"; q.placeholder = "Find a player or a team season"; q.setAttribute("aria-label", "Find a player or a team season");
  f.appendChild(q);
  const m = document.createElement("button"); m.className = "sg2-menu"; m.type = "button"; m.setAttribute("aria-expanded", "false"); m.setAttribute("aria-controls", "sg2-panel");
  m.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg><span>Menu</span>`;
  m.setAttribute("aria-label", "Menu");
  const p = document.createElement("nav"); p.className = "sg2-panel"; p.id = "sg2-panel"; p.hidden = true; p.setAttribute("aria-label", "Site");
  p.innerHTML = HDR_LINKS.map(x => x ? `<a href="${x[1]}">${x[0]}</a>` : "<hr>").join("") + `<hr><button class="sg2-theme" type="button">Light / dark</button>`;
  wrap.insertBefore(b, wrap.firstChild);
  wrap.insertBefore(f, b.nextSibling);
  wrap.appendChild(m); wrap.appendChild(p);
  hdrMark();
  m.addEventListener("click", e => { e.stopPropagation(); const open = p.hidden; p.hidden = !open; m.setAttribute("aria-expanded", String(open)); if (open) hdrMark(); });
  p.addEventListener("click", e => {
    if (e.target.closest(".sg2-theme")) {   // the hub's switch: flip the current theme (set, else the system's), store it
      const r = document.documentElement, dk = r.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), n = dk === "light" ? "dark" : "light";
      r.dataset.theme = n; try { localStorage.setItem("theme", n); } catch (er) { /* private mode */ }
      if (typeof render === "function" && typeof CUR !== "undefined" && CUR) { const y = window.scrollY; render(); window.scrollTo(0, y); }   // charts read colours at render time
      return;
    }
    if (e.target.closest("a")) hdrClose(false);
  });
  document.addEventListener("click", e => { if (!p.hidden && !e.target.closest(".sg2-panel") && !e.target.closest(".sg2-menu")) hdrClose(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") hdrClose(true); });
  window.addEventListener("hashchange", () => { hdrClose(false); hdrMark(); });
  f.addEventListener("submit", e => {
    e.preventDefault();
    const v = q.value; if (!v.trim()) return;
    const h = hdrFind(v);
    if (h) { location.hash = h; q.value = ""; q.blur(); return; }
    hdrLoadAll().then(() => { const h2 = hdrFind(v); if (h2) { location.hash = h2; q.value = ""; q.blur(); } });
  });
  // history.js sets its own placeholder and adds a "Teams" link once the document is parsed: keep the agreed words, no extra link
  document.addEventListener("DOMContentLoaded", () => { q.placeholder = "Find a player or a team season"; for (const a of [...wrap.querySelectorAll(":scope > a:not(.sg2-brand)")]) a.remove(); });
  hdrQuery();
}
hdrInit();

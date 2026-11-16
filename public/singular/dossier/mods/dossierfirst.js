// Dossier first (DISPLAY lane, 2026-11-16; Griffin: "When I click on a player, it should just default to their full dossier,
// and then impact by age"). The Singular hub now sends player-name clicks here (build_singular_hub.py DOSSIER_FIRST); this hook
// puts an "Impact by age" link in the player header that opens his hub page (/singular/p/<slug>/, the rating-by-age chart).
// The deployed copy already carries a "Singular page" link (pp_site_stage.py HUB_LINK): it is relabelled, not duplicated.
// Retired players' pages get the same label in mods/history.js (HX_DF). DF_ON false = the page as before.
const DF_ON = true;
(window.WIRES = window.WIRES || []).push(function(){
  if (!DF_ON || typeof CUR === "undefined" || !CUR || !CUR.slug) return;
  const m = document.querySelector("#app header.hero .meta");
  if (!m || typeof m.querySelector !== "function") return;  // offline render harness: stub elements
  const href = "/singular/p/" + encodeURIComponent(CUR.slug) + "/";
  let a = m.querySelector(".hub-link a");
  if (!a) {
    const s = document.createElement("span"); s.className = "hub-link";
    a = document.createElement("a"); a.href = href; a.style.color = "inherit"; s.appendChild(a); m.appendChild(s);
  }
  a.textContent = "Impact by age";
  a.title = "His rating by age, game by game, with the five-season forecast (Singular page)";
});

/* Singular sortable static tables (scripts/hub_seasons.py, build_singular_hub.py RANK_COL, 2026-11-17 DESIGNH). A table with
   data-sortable: a click on a header button[data-s] sorts the rows on that column (cell data-v as a number when present, else
   the cell text; th data-t="txt" sorts A to Z first, numbers high to low first; a second click reverses); td.rk renumbers the
   visible rows 1..n after every sort and filter. data-cuts='{"500":500,...}' = the page's minutes bars: rows (data-m = minutes)
   below the active bar ([data-fset][aria-pressed=true], set by dist.js, which runs first) are hidden; [data-cnt] in the
   surrounding <details> shows the count. */
(function(){
'use strict';
function key(td){if(!td)return null;var v=td.getAttribute('data-v');if(v!=null)return v===''?null:+v;return td.textContent.trim().toLowerCase()}
function renum(t){var i=0;[].forEach.call(t.tBodies[0].rows,function(r){if(r.hidden)return;var c=r.querySelector('td.rk');if(c)c.textContent=++i})}
function cut(t){if(!t.dataset.cuts)return null;var c=JSON.parse(t.dataset.cuts),b=document.querySelector('[data-fset][aria-pressed="true"]');
 return b&&c[b.dataset.fset]!=null?c[b.dataset.fset]:c[Object.keys(c)[1]]}
function filt(t){var c=cut(t);if(c==null){renum(t);return}var n=0;
 [].forEach.call(t.tBodies[0].rows,function(r){var h=+r.dataset.m<c;r.hidden=h;if(!h)n++});
 var d=t.closest('details'),l=d&&d.querySelector('[data-cnt]');
 if(l)l.textContent=n.toLocaleString('en-US')+' with '+c.toLocaleString('en-US')+'+ minutes'+(t.dataset.so?' so far':'');renum(t)}
function sortBy(t,th){var i=[].indexOf.call(th.parentNode.children,th),cur=th.getAttribute('aria-sort'),txt=th.dataset.t==='txt';
 var dir=cur==='descending'?1:cur==='ascending'?-1:(txt?1:-1);
 [].forEach.call(th.parentNode.children,function(x){x.removeAttribute('aria-sort')});th.setAttribute('aria-sort',dir<0?'descending':'ascending');
 var tb=t.tBodies[0],rows=[].slice.call(tb.rows);
 rows.sort(function(a,b){var x=key(a.cells[i]),y=key(b.cells[i]);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return-1;
  if(typeof x==='string'||typeof y==='string')return String(x).localeCompare(String(y))*dir;return(x-y)*dir});
 rows.forEach(function(r){tb.appendChild(r)});renum(t)}
var T=[].slice.call(document.querySelectorAll('table[data-sortable]'));
T.forEach(function(t){t.tHead.addEventListener('click',function(e){var b=e.target.closest('button[data-s]');if(b)sortBy(t,b.closest('th'))});filt(t)});
document.addEventListener('click',function(e){if(e.target.closest('[data-fset]'))T.forEach(function(t){if(t.dataset.cuts)filt(t)})});
})();

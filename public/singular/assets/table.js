/* Singular player table: view switch, sort, filter, search. Data: window.HUB, columns: window.HUB_COLS (assets/players.js). */
(function(){
'use strict';
var H=window.HUB, C=window.HUB_COLS, rows=H.rows, M='−';
var st={view:'both',unit:H.has_pg?'pg':'p100',split:false,parts:false,sort:'r_proj',dir:-1,q:'',team:'',pos:'',amin:'',amax:'',rook:false};
var $=function(s){return document.querySelector(s)};
function get(r,p){if(p.indexOf('.')<0)return r[p];var a=p.split('.'),o=r[a[0]];return o==null?null:o[a[1]]}
function val(r,c){
 if(!c.st)return get(r,c.p);
 if(c.rate)return get(r,c.b+'.'+c.st);
 return get(r,c.b+'.'+c.st+(st.unit==='pg'?'':'100'))}
function fmt(v,c){if(v==null||v!==v)return'–';if(c.t==='txt')return String(v);
 var s=Math.abs(v).toFixed(c.dp);if(c.pc)return s+'%';if(+s===0)return s;return(v<0?M:(c.sg?'+':''))+s}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
rows.forEach(function(r){r._n=norm(r.name)});
var pct={};
C.forEach(function(c){if(!c.sh)return;pct[c.p]=rows.map(function(r){return get(r,c.p)}).filter(function(x){return x!=null}).sort(function(a,b){return a-b})});
function pr(a,v){var lo=0,hi=a.length;while(lo<hi){var m=(lo+hi)>>1;if(a[m]<v)lo=m+1;else hi=m}var l2=lo;hi=a.length;
 while(l2<hi){var m2=(l2+hi)>>1;if(a[m2]<=v)l2=m2+1;else hi=m2}return a.length>1?((lo+l2-1)/2)/(a.length-1):.5}
function shade(c,v){if(!c.sh||v==null)return'';var a=pct[c.p];if(!a||a.length<2)return'';var p=Math.max(0,Math.min(1,pr(a,v)));
 var d=Math.abs(p-.5)*2,w=Math.round(Math.pow(d,1.6)*40);if(w<3)return'';return' style="background-color:color-mix(in oklab,var(--'+(p>.5?'hi':'lo')+') '+w+'%,transparent)"'}
var rb=(function(){var lo=[],hi=[];rows.forEach(function(r){if(r.t5_lo!=null)lo.push(r.t5_lo);if(r.t5_hi!=null)hi.push(r.t5_hi)});
 if(!lo.length)return null;lo.sort(function(a,b){return a-b});hi.sort(function(a,b){return a-b});
 return[Math.min(lo[Math.floor(lo.length*.01)],0),Math.max(hi[Math.floor(hi.length*.99)],0)]})();
function bar(r){if(!rb||r.t5_lo==null||r.t5_hi==null)return'–';var W=96,x=function(v){return Math.max(0,Math.min(W,(v-rb[0])/(rb[1]-rb[0])*W))};
 var a=x(r.t5_lo),b=x(r.t5_hi),m=r.t5_mean==null?null:x(r.t5_mean);
 return'<span class="rbar" aria-hidden="true"><span class="z" style="left:'+x(0).toFixed(1)+'px"></span><span class="b" style="left:'+a.toFixed(1)+'px;width:'+Math.max(2,b-a).toFixed(1)+'px"></span>'+
 (m==null?'':'<span class="m" style="left:'+(m-1).toFixed(1)+'px"></span>')+'</span>'}
var hd={};
function hasData(c){if(c.ns||c.t==='txt')return true;var k=c.k+'|'+st.unit;if(!(k in hd))hd[k]=rows.some(function(r){return val(r,c)!=null});return hd[k]}
function shown(c){
 if(c.opt==='split'&&!st.split)return false;
 if(c.opt==='parts'&&!st.parts)return false;
 if(c.v.indexOf(st.view)<0)return false;
 if(st.view==='both'&&c.full)return false;
 if(st.view==='both'&&!hasData(c))return false;
 return true}
function cols(){return C.filter(shown)}
function pass(r){
 if(st.q&&r._n.indexOf(norm(st.q))<0)return false;
 if(st.team&&r.team!==st.team)return false;
 if(st.pos&&(!r.pos||r.pos.indexOf(st.pos)<0))return false;
 if(st.amin!==''&&(r.age==null||r.age<+st.amin))return false;
 if(st.amax!==''&&(r.age==null||r.age>=+st.amax+1))return false;
 if(st.rook&&!r.rookie)return false;return true}
function colByKey(k){for(var i=0;i<C.length;i++)if(C[i].k===k)return C[i];return null}
function render(){
 var cs=cols();
 if(!cs.some(function(c){return c.k===st.sort})){var d=cs.filter(function(c){return c.sh})[0];st.sort=d?d.k:'name';st.dir=d?-1:1}
 var sc=colByKey(st.sort),list=rows.filter(pass);
 list.sort(function(a,b){var x=sc.k==='bar'?a.t5_mean:val(a,sc),y=sc.k==='bar'?b.t5_mean:val(b,sc);
  if(x==null&&y==null)return a._n<b._n?-1:1;if(x==null)return 1;if(y==null)return-1;
  if(typeof x==='string')return x.localeCompare(y)*st.dir||(a._n<b._n?-1:1);
  return(x-y)*st.dir||(a._n<b._n?-1:1)});
 // group header row
 var g=[],last=null;
 cs.forEach(function(c){var gl=c.gl||'';if(last&&last.gl===gl){last.n++}else{last={gl:gl,n:1,cls:c.gc||''};g.push(last)}});
 var unitLab=st.unit==='pg'?'per game':'per 100';
 var th1='<tr class="g1">'+g.map(function(x,i){return'<th colspan="'+x.n+'" class="'+x.cls+'">'+(x.gl||'').replace('{u}',unitLab)+'</th>'}).join('')+'</tr>';
 var th2='<tr class="g2">'+cs.map(function(c){var s=c.k===st.sort?' aria-sort="'+(st.dir<0?'descending':'ascending')+'"':'';
  var lab=c.l+(c.sub?'<small>'+c.sub+'</small>':'');
  return'<th class="'+(c.cls||'')+'"'+s+' title="'+(c.d||'').replace(/"/g,'&quot;')+'">'+(c.ns?lab:'<button type="button" data-k="'+c.k+'">'+lab+'</button>')+'</th>'}).join('')+'</tr>';
 $('#t thead').innerHTML=th1+th2;
 var out=[];
 for(var i=0;i<list.length;i++){var r=list[i];out.push('<tr>');
  for(var j=0;j<cs.length;j++){var c=cs[j],cl=c.cls||'';
   if(c.k==='rk'){out.push('<td class="rk '+cl+'">'+(i+1)+'</td>');continue}
   if(c.k==='name'){out.push('<td class="nm '+cl+'"><a href="/singular/p/'+r.slug+'/">'+r.name.replace(/</g,'&lt;')+'</a></td>');continue}
   if(c.k==='bar'){out.push('<td class="'+cl+'">'+bar(r)+'</td>');continue}
   var v=val(r,c);out.push('<td class="'+cl+'"'+shade(c,v)+'>'+(c.k==='peak_age'&&r.peak_now?'now':fmt(v,c))+'</td>')}
  out.push('</tr>')}
 $('#t tbody').innerHTML=out.join('')||'<tr><td colspan="'+cs.length+'" class="empty l">No players match these filters.</td></tr>';
 $('#count').textContent=list.length+' of '+rows.length+' players';
 var noStd=!rows.some(function(r){return r.r_std!=null});
 $('#empty-note').hidden=!(noStd&&st.view!=='proj');
 $('#empty-note').textContent=st.view==='both'?'· Season-so-far columns appear once 2026-27 games are in the data.':'No 2026-27 games are in the data yet; these columns fill in after opening night.';
 document.querySelectorAll('[data-view]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.view===st.view)});
 document.querySelectorAll('[data-unit]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.unit===st.unit)});
}
document.addEventListener('DOMContentLoaded',function(){
 var teams={};rows.forEach(function(r){if(r.team)teams[r.team]=1});
 $('#f-team').insertAdjacentHTML('beforeend',Object.keys(teams).sort().map(function(t){return'<option>'+t+'</option>'}).join(''));
 var q=new URLSearchParams(location.search).get('q');if(q){st.q=q;$('#f-q').value=q}
 if(matchMedia('(max-width:640px)').matches){var md=$('details.more');if(md)md.open=false}
 if(!H.has_pg){var b=document.querySelector('[data-unit=pg]');if(b){b.disabled=true;b.title='Per-game projections are not in this build'}}
 if(!H.has_parts){var p=$('#o-parts');if(p)p.closest('label').hidden=true}
 $('#t thead').addEventListener('click',function(e){var b=e.target.closest('button[data-k]');if(!b)return;var k=b.dataset.k;
  if(st.sort===k)st.dir=-st.dir;else{st.sort=k;var c=colByKey(k);st.dir=(c.t==='txt'||k==='age'||k==='peak_age')?1:-1}render()});
 document.addEventListener('click',function(e){var b=e.target.closest('[data-view],[data-unit]');if(!b||b.disabled)return;
  if(b.dataset.view)st.view=b.dataset.view;if(b.dataset.unit)st.unit=b.dataset.unit;render()});
 $('#f-q').addEventListener('input',function(e){st.q=e.target.value;render()});
 $('#f-team').addEventListener('change',function(e){st.team=e.target.value;render()});
 $('#f-pos').addEventListener('change',function(e){st.pos=e.target.value;render()});
 $('#f-amin').addEventListener('input',function(e){st.amin=e.target.value;render()});
 $('#f-amax').addEventListener('input',function(e){st.amax=e.target.value;render()});
 $('#f-rook').addEventListener('change',function(e){st.rook=e.target.checked;render()});
 $('#o-split').addEventListener('change',function(e){st.split=e.target.checked;render()});
 var op=$('#o-parts');if(op)op.addEventListener('change',function(e){st.parts=e.target.checked;render()});
 render();
});
})();

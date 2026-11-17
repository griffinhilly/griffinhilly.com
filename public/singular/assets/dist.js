/* Singular rating distributions (scripts/hub_seasons.py; build_singular_hub.py SEASON_DIST). Each .dz element names a
   <script type="application/json"> block by id (data-d; not "data-src", which link checkers read as a URL) with precomputed bins, medians and top tens; one shared state: minutes bar f
   and weighting w. Renders SVG at the element's width; no library. */
(function(){
'use strict';
var M='−',st={f:'1000',w:'n'};
try{var s0=sessionStorage.getItem('singular_dist_f');if(s0==='500'||s0==='1000'||s0==='1500')st.f=s0}catch(e){}
function sg(v,dp){if(v==null)return'–';var s=Math.abs(v).toFixed(dp==null?1:dp);return(v<0&&+s?M:(+s?'+':''))+s}
function nf(n){return Math.round(n).toLocaleString('en-US')}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function nice(mx){if(!(mx>0))return[0,1];var p=Math.pow(10,Math.floor(Math.log10(mx/4))),st_=[1,2,2.5,5,10].map(function(k){return k*p}).find(function(k){return mx/k<=5})||10*p,t=[];for(var v=0;v<mx+st_*0.999;v+=st_)t.push(+v.toFixed(6));return t}
function data(el){if(!el._d){var s=document.getElementById(el.dataset.d);el._d=s?JSON.parse(s.textContent):null}return el._d}
function tip(el){var t=el.querySelector('.dtip');if(!t){t=document.createElement('div');t.className='dtip';t.hidden=true;el.appendChild(t)}return t}
function place(el,t,x,y){t.hidden=false;var W=el.clientWidth,w=t.offsetWidth;t.style.left=Math.max(0,Math.min(W-w,x-w/2))+'px';t.style.top=Math.max(0,y-t.offsetHeight-10)+'px'}
function hist(el){var d=data(el);if(!d)return;var S=d.sets[el.dataset.fixed?d.def_:st.f]||d.sets[d.def_],wm=!!(d.wt&&st.w==='m');
 var V=wm?S.m:S.c,W=Math.max(280,el.clientWidth),ph=W<560,lo=d.ax[0],hi=d.ax[1],bw=d.ax[2],nb=V.length;
 var pl=ph?36:46,pr=12,pb=ph?32:36,R=ph?4:8,gap=2*R+2,lab=16,pt=lab+10;
 function X(v){return pl+(Math.min(Math.max(v,lo),hi)-lo)/(hi-lo)*(W-pl-pr)}
 function bi(v){return Math.min(nb-1,Math.max(0,Math.floor((v-lo)/bw+1e-9)))}
 /* top-ten markers sit on their own bar (stacked when several share a bin); the y axis leaves room above those bars */
 var K=[],P=[];(S.top||[]).forEach(function(t){var i=bi(t[2]);K[i]=(K[i]||0)+1;P.push({i:i,l:K[i]-1,t:t,x:X(lo+(i+0.5)*bw)})});
 var tk=nice(Math.max.apply(null,V.concat([0]))),ih=ph?190:230;
 for(var g=0;g<4&&P.some(function(p){return V[p.i]/tk[tk.length-1]>0.8});g++)tk.push(+(tk[tk.length-1]+tk[1]-tk[0]).toFixed(6));
 var yt=tk[tk.length-1]||1;K.forEach(function(k,i){if(k)ih=Math.max(ih,Math.min(420,(k*gap+8)/Math.max(0.05,1-V[i]/yt)))});
 var H=pt+ih+pb,y0=H-pb;function Y(c){return y0-c/yt*(y0-pt)}
 var o=['<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" aria-hidden="true">'];
 tk.forEach(function(t){var y=Y(t).toFixed(1);o.push('<line class="gl" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'"/><text class="tk" x="'+(pl-6)+'" y="'+(+y+3.5)+'" text-anchor="end">'+(wm?(t%1?t.toFixed(1):t)+'%':nf(t))+'</text>')});
 for(var i=0;i<nb;i++){var c=V[i];if(!(c>0))continue;var x0=X(lo+i*bw)+1,x1=X(lo+(i+1)*bw)-1,w=x1-x0;if(w>24){x0+=(w-24)/2;w=24;x1=x0+w}
  var y=Y(c),h=y0-y,r=Math.min(4,w/2,h);o.push('<path class="bar" data-i="'+i+'" d="M'+x0.toFixed(1)+' '+y0+'V'+(y+r).toFixed(1)+'Q'+x0.toFixed(1)+' '+y.toFixed(1)+' '+(x0+r).toFixed(1)+' '+y.toFixed(1)+'H'+(x1-r).toFixed(1)+'Q'+x1.toFixed(1)+' '+y.toFixed(1)+' '+x1.toFixed(1)+' '+(y+r).toFixed(1)+'V'+y0+'Z"/>')}
 o.push('<line class="ax" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y0+'" y2="'+y0+'"/>');
 var step=ph?4:2;for(var v=Math.ceil(lo/step)*step;v<=hi+1e-9;v+=step)o.push('<text class="tk" x="'+X(v).toFixed(1)+'" y="'+(y0+14)+'" text-anchor="middle">'+(v===0?'0':sg(v,0))+'</text>');
 o.push('<text x="'+((pl+W-pr)/2)+'" y="'+(y0+(ph?28:31))+'" text-anchor="middle">'+(ph?'Rating per 100 possessions':'Rating, points per 100 possessions (0 = average player of the season)')+'</text>');
 var md=wm?S.wmd:S.md,p9=wm?S.wp9:S.p9;
 if(md!=null){var xm=X(md);o.push('<line class="ql" x1="'+xm.toFixed(1)+'" x2="'+xm.toFixed(1)+'" y1="'+(lab+2)+'" y2="'+y0+'"/><text x="'+(xm-5).toFixed(1)+'" y="'+lab+'" text-anchor="end">median <tspan class="ql2">'+sg(md)+'</tspan></text>')}
 if(p9!=null){var x9=X(p9);o.push('<line class="ql" x1="'+x9.toFixed(1)+'" x2="'+x9.toFixed(1)+'" y1="'+(lab+2)+'" y2="'+y0+'"/><text x="'+(x9+5).toFixed(1)+'" y="'+lab+'" text-anchor="start">90th pct <tspan class="ql2">'+sg(p9)+'</tspan></text>')}
 P.forEach(function(p){p.y=Y(V[p.i])-3-R-p.l*gap;o.push('<g class="mk"><circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+R+'"/>'+
  (ph?'':'<text x="'+p.x.toFixed(1)+'" y="'+(p.y+3.2).toFixed(1)+'"'+(p.t[0]>9?' class="two"':'')+'>'+p.t[0]+'</text>')+'</g>')});
 o.push('</svg>');el.innerHTML=o.join('');var t=tip(el),svg=el.querySelector('svg');
 function mv(e){var b=svg.getBoundingClientRect(),mx=(e.clientX-b.left)*W/b.width,my=(e.clientY-b.top)*H/b.height,hit=null;
  P.forEach(function(p){var dd=Math.hypot(p.x-mx,p.y-my);if(dd<=R+5&&(!hit||dd<hit.d))hit={d:dd,p:p}});
  svg.querySelectorAll('.bar.on').forEach(function(x){x.classList.remove('on')});
  if(hit){t.innerHTML='<b>'+hit.p.t[0]+'.</b> '+esc(hit.p.t[1])+' <b>'+sg(hit.p.t[2])+'</b>';place(el,t,hit.p.x*b.width/W,hit.p.y*b.height/H-R);return}
  var v=lo+(mx-pl)/(W-pl-pr)*(hi-lo),i=Math.floor((v-lo)/bw);if(mx<pl||mx>W-pr||my>y0+4||i<0||i>=nb||!(S.c[i]>0)){t.hidden=true;return}
  var bar=svg.querySelector('.bar[data-i="'+i+'"]');if(bar)bar.classList.add('on');var n=S.c[i],tot=S.n||1,u=d.unit;
  var rng=(i===0?'below '+sg(lo+bw):i===nb-1?sg(hi-bw)+' and above':sg(lo+i*bw)+' to '+sg(lo+(i+1)*bw));
  t.innerHTML='<b>'+rng+'</b><br>'+(wm?S.m[i].toFixed(1)+'% of minutes · '+nf(n)+' '+u:nf(n)+' '+(n===1?u.replace(/s$/,''):u)+' · '+(100*n/tot).toFixed(1)+'%');
  place(el,t,X(lo+(i+0.5)*bw)*b.width/W,Y(V[i])*b.height/H)}
 svg.onpointermove=mv;svg.onpointerdown=mv;svg.onpointerleave=function(){t.hidden=true;svg.querySelectorAll('.bar.on').forEach(function(x){x.classList.remove('on')})}}
function trend(el){var d=data(el);if(!d)return;var S=d.sets[st.f],Yr=d.y,W=Math.max(280,el.clientWidth),ph=W<560,n=Yr.length;
 var pl=ph?30:38,pr=ph?12:84,pt=22,H=ph?240:300,pb=26,y0=H-pb,a=Yr[0],z=Yr[n-1];
 var all=S.md.concat(S.p9,S.b).filter(function(v){return v!=null}),lo=Math.floor(Math.min.apply(null,all))-1,hi=Math.ceil(Math.max.apply(null,all));
 function X(y){return pl+(y-a)/(z-a)*(W-pl-pr)}function Y(v){return y0-(v-lo)/(hi-lo)*(y0-pt)}
 var o=['<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" aria-hidden="true">'];
 d.eras.forEach(function(e,k){var x0=X(Math.max(e[0],a)-0.5),x1=X(Math.min(e[1],z)+0.5);if(k%2===0)o.push('<rect class="era" x="'+x0.toFixed(1)+'" y="'+pt+'" width="'+(x1-x0).toFixed(1)+'" height="'+(y0-pt)+'"/>');
  o.push('<text x="'+((x0+x1)/2).toFixed(1)+'" y="'+(pt-7)+'" text-anchor="middle">'+esc(ph?e[3]:e[2])+'</text>')});
 for(var v=lo;v<=hi;v+=(hi-lo>10?2:1)){var y=Y(v).toFixed(1);o.push('<line class="gl" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'"/><text class="tk" x="'+(pl-5)+'" y="'+(+y+3.5)+'" text-anchor="end">'+(v===0?'0':sg(v,0))+'</text>')}
 var ys=ph?20:10;for(var yy=Math.ceil(a/ys)*ys;yy<=z;yy+=ys)o.push('<text class="tk" x="'+X(yy).toFixed(1)+'" y="'+(y0+16)+'" text-anchor="middle">'+yy+'</text>');
 function line(arr,cls){var s='';arr.forEach(function(v,i){if(v==null)return;s+=(s?'L':'M')+X(Yr[i]).toFixed(1)+' '+Y(v).toFixed(1)});return'<path class="'+cls+'" d="'+s+'"/>'}
 o.push(line(S.md,'ln1'),line(S.p9,'ln2'));S.b.forEach(function(v,i){if(v!=null)o.push('<circle class="bd" cx="'+X(Yr[i]).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="'+(ph?3:4)+'"/>')});
 if(!ph){o.push('<text x="'+(X(z)+8)+'" y="'+(Y(S.md[n-1])+4).toFixed(1)+'">median</text><text x="'+(X(z)+8)+'" y="'+(Y(S.p9[n-1])+4).toFixed(1)+'">90th pct</text>')}
 o.push('<line class="cross" x1="0" x2="0" y1="'+pt+'" y2="'+y0+'" visibility="hidden"/></svg>');el.innerHTML=o.join('');
 var t=tip(el),svg=el.querySelector('svg'),cr=svg.querySelector('.cross');
 function at(e){var b=svg.getBoundingClientRect(),mx=(e.clientX-b.left)*W/b.width;var i=Math.round((mx-pl)/(W-pl-pr)*(z-a));return{i:Math.max(0,Math.min(n-1,i)),b:b}}
 svg.onpointermove=function(e){var q=at(e),i=q.i,x=X(Yr[i]);cr.setAttribute('x1',x);cr.setAttribute('x2',x);cr.setAttribute('visibility','visible');
  t.innerHTML='<b>'+Yr[i]+'-'+String(Yr[i]+1).slice(2)+'</b> · '+nf(S.n[i])+' players<br>90th pct '+sg(S.p9[i])+' · median '+sg(S.md[i])+'<br>best: '+esc(S.bn[i])+' '+sg(S.b[i]);
  place(el,t,x*q.b.width/W,Y(S.b[i]!=null?S.b[i]:S.p9[i])*q.b.height/H)};
 svg.onpointerleave=function(){t.hidden=true;cr.setAttribute('visibility','hidden')};
 svg.onclick=function(e){var a_=document.querySelector('a[data-y="'+Yr[at(e).i]+'"]');if(a_)location.href=a_.href};svg.style.cursor='pointer'}
function render(){document.querySelectorAll('.dz').forEach(function(el){try{(el.dataset.chart==='trend'?trend:hist)(el)}catch(e){if(window.console)console.error(e)}})}
function apply(){document.querySelectorAll('[data-fset]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.fset===st.f))});
 document.querySelectorAll('[data-wset]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.wset===st.w))});
 document.querySelectorAll('[data-fv]').forEach(function(x){x.hidden=x.dataset.fv!==st.f});
 document.querySelectorAll('[data-wv]').forEach(function(x){x.hidden=x.dataset.wv!==st.w});
 document.querySelectorAll('[data-fw]').forEach(function(x){x.hidden=x.dataset.fw!==st.f+'-'+st.w});render()}
document.addEventListener('click',function(e){var b=e.target.closest('[data-fset]');if(b){st.f=b.dataset.fset;try{sessionStorage.setItem('singular_dist_f',st.f)}catch(x){}apply();return}
 var w=e.target.closest('[data-wset]');if(w){st.w=w.dataset.wset;apply()}});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(render,120)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();

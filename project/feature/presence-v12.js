/* Sparse native presence in established empty margins; all clocks are actual clip-local. */
(()=>{
 'use strict';const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 const ranges=[
  {id:'coral-user-needs',clip:'intro2',start:18.4,end:25.1,x:220,y:355,w:270,framing:'full',mood:'neutral',lookX:.5,fadeIn:.65,fadeOut:.6},
  {id:'ecology-stoppage',clip:'intro2',start:73.9,end:82.1,x:220,y:375,w:270,framing:'full',mood:'concerned',lookX:.5,fadeIn:.7,fadeOut:.6},
  {id:'sql-same-person',clip:'intro2',start:103.8,end:109.9,x:270,y:260,w:340,framing:'full',mood:'neutral',lookX:.5,lookY:.1,fadeIn:0,fadeOut:.65},
  {id:'community-voices',clip:'intro3',start:33.4,end:40,x:100,y:620,w:260,framing:'waist',mood:'concerned',lookX:.4,fadeIn:.65,fadeOut:.55},
  {id:'browser-workstation',clip:'p1c1',start:28.54480775,end:35.17530254,x:70,y:695,w:205,framing:'waist',mood:'neutral',lookX:.45,fadeIn:.6,fadeOut:.65},
  {id:'knowledge-and-creation',clip:'p1c2',start:108.295083,end:139.267541,x:1640,y:620,w:260,framing:'full',mood:'firm',lookX:-.35,fadeIn:.8,fadeOut:.8},
  {id:'productive-capacity',clip:'p1c2',start:166.183208333,end:187.325708,x:65,y:620,w:250,framing:'full',mood:'neutral',lookX:.35,fadeIn:.7,fadeOut:.75},
  {id:'capability-limits',clip:'p1c3',start:106.977083,end:113.3,x:65,y:620,w:250,framing:'full',mood:'firm',lookX:.35,fadeIn:.6,fadeOut:.6},
  {id:'open-does-not-mean-learned',clip:'p2c1',start:34.217958,end:49.977958,x:1540,y:630,w:255,framing:'full',mood:'neutral',lookX:-.4,fadeIn:.75,fadeOut:.7},
  {id:'actual-software-practice',clip:'p2c2',start:148.54749594,end:160.47995833,x:50,y:590,w:250,framing:'full',mood:'smile',lookX:.45,fadeIn:.7,fadeOut:.7}
 ];
 function active(clip,t){return ranges.filter(r=>r.clip===clip&&t>=r.start&&t<r.end)}
 window.PresenceV12={ranges,active,draw(ctx,clip,actualLocal,sceneTime,A){
  if(window.V18SuppressLegacyPresence)return false;const rows=active(clip,actualLocal);if(!rows.length)return false;
  ctx.save();ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();
  for(const r of rows){const enter=r.fadeIn?ease((actualLocal-r.start)/r.fadeIn):1,leave=ease((r.end-actualLocal)/r.fadeOut),alpha=enter*leave;
   if(alpha>.001)A.live(r.x,r.y,r.w,actualLocal,alpha,{framing:r.framing,mood:r.mood,lookX:r.lookX,lookY:r.lookY||0});
  }
  ctx.restore();return true;
 }};
})();

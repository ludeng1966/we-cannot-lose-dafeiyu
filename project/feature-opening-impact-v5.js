(()=>{
 'use strict';
 const cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,k)=>a+(b-a)*k;
 function bez(x,x1=.53,x2=.24){x=cl(x);const b=(t,a,d)=>3*(1-t)**2*t*a+3*(1-t)*t*t*d+t**3;let l=0,h=1;for(let i=0;i<16;i++){let m=(l+h)/2;if(b(m,x1,x2)<x)l=m;else h=m}return b((l+h)/2,0,1)}
 const E=(t,a,b)=>bez((t-a)/(b-a)),out=(t,a,b)=>bez((t-a)/(b-a),.16,.25);
 let c,A;
 const S=fn=>{c.save();fn();c.restore()},F=(a,fn)=>{if(a>.001)S(()=>{c.globalAlpha*=cl(a);fn()})};
 function text(s,x,y,n=50,color='#eee',align='left',face='"SimSun",serif'){c.font=n+'px '+face;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
 function line(x,y,X,Y,p=1,a=1,w=1.5){F(a,()=>{c.lineWidth=w;c.strokeStyle='#cbd8de';c.beginPath();c.moveTo(x,y);c.lineTo(mix(x,X,cl(p)),mix(y,Y,cl(p)));c.stroke()})}
 function dot(x,y,r=4,a=1){F(a,()=>{c.fillStyle='#dce5ec';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()})}
 function path(ps,p=1,a=1,w=1.5){let ls=ps.slice(1).map((q,i)=>Math.hypot(q[0]-ps[i][0],q[1]-ps[i][1])),rem=ls.reduce((a,b)=>a+b,0)*cl(p);ls.forEach((l,i)=>{let k=cl(rem/l);if(k>0)line(...ps[i],...ps[i+1],k,a,w);rem-=l})}
 function image(key,x,y,w,h,{alpha=1,crop=[0,0,1,1],cover=false}={}){const im=A.assets[key];if(!im)return;F(alpha,()=>{c.beginPath();c.rect(x,y,w,h);c.clip();const sx=im.width*crop[0],sy=im.height*crop[1],sw=im.width*crop[2],sh=im.height*crop[3],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k)})}
 function pane(key,x,y,w,h,o={}){if(legacyEvidenceGain<=.001)return;S(()=>{c.globalAlpha*=legacyEvidenceGain;c.translate(x+w/2,y+h/2);c.rotate(o.angle||0);c.transform(1,o.shear||0,o.skew||0,1,0,0);c.globalAlpha*=o.alpha??1;c.shadowColor='#000';c.shadowBlur=42;c.shadowOffsetY=22;c.fillStyle=o.back||'#11171c';c.fillRect(-w/2-5,-h/2-5,w+10,h+10);c.shadowColor='transparent';image(key,-w/2,-h/2,w,h,o);c.strokeStyle='#a9c1d259';c.lineWidth=1;c.strokeRect(-w/2-6,-h/2-6,w+12,h+12)})}
 function video(key,x,y,w,h,t,alpha=1){F(alpha,()=>A.video(key,x,y,w,h,Math.max(0,t),{cover:false}))}
 function camera(x,y,z,fn){S(()=>{c.translate(960,460);c.scale(z,z);c.translate(-x,-y);fn()})}
 function bg(){c.fillStyle='#040607';c.fillRect(0,0,1920,952)}
 const FIRST_SENTENCE_END=5.499540983606558,HANDOFF_END=FIRST_SENTENCE_END+.7;
 function cold(t){
  const handoff=E(t,FIRST_SENTENCE_END,HANDOFF_END),a=E(t,6,9.2),scale=mix(.84,1,a);
  F(handoff,()=>article(t,false,true));
  const targetX=960+scale*(240-mix(1100,960,a)),targetY=460+scale*(540-mix(510,465,a));
  A.live(mix(440,targetX,handoff),mix(-50,targetY,handoff),mix(1030,370*scale,handoff),t,mix(1,a,handoff),
   {framing:'full',framingFrom:'close',framingAt:FIRST_SENTENCE_END,framingDuration:.7,mood:'concerned',lookX:mix(0,.45,handoff)});
  F(1-E(t,FIRST_SENTENCE_END,FIRST_SENTENCE_END+.35),()=>text('关禁闭？',1460,430,74,'#fff','center'));
 }
 function article(t,fromCold=false,skipNative=false){
  const a=E(t,6,9.2),s=E(t,10.4,14.8),p=fromCold?E(t,4.8,6):1;
  F(p,()=>{
   camera(mix(1100,960,a),mix(510,465,a),mix(.84,1,a),()=>{
    pane('v4_qq_risk',mix(1180,1470,a),420,670,590,{angle:-.055,alpha:.35*(1-s*.3)});
    pane('evidence-takedown',mix(-190,-300,a),548,990,570,{angle:.045,alpha:.36});
    pane('wechat-notice',mix(160,110,a),mix(390,170,a),mix(1420,1580,a),420,{crop:[.035,.178,.93,.153],angle:mix(-.025,0,a),alpha:1});
    line(140,98,1750,98,a,.5,1.2);text('QQ 安全中心',145,64,31,'#b8c5cc');text('2026.10.27',1720,64,47,'#f0f4f7','right','Georgia,serif');
    F(s,()=>{pane('wechat-notice',mix(1120,980,s),mix(840,550,s),800,360,{crop:[.10,.355,.80,.235],alpha:s});path([[930,500],[930,720],[980,720]],s,.58,1.5)});
    if(!skipNative)A.live(mix(240,70,s),mix(540,492,s),mix(370,405,s),t,a,{framing:'full',mood:'concerned',lookX:.45});
   });
  });
 }
 function closure(t){
  const open=E(t,16,18.4),notice=E(t,21.2,23.0),returnToFace=E(t,28.5,30.7);
  // A fixed stage keeps the source documents related while their reading
  // priority changes. No extra labels are placed across the original wording.
  camera(960,460,1,()=>{
   const headerLight=.30*(1-returnToFace);
   pane('wechat-notice',82,40,880,225,{crop:[.035,.178,.93,.153],alpha:headerLight});
   const rx=mix(mix(920,1120,notice),1180,returnToFace),ry=mix(82,130,returnToFace);
   const rw=mix(mix(920,730,notice),640,returnToFace),rh=mix(mix(570,460,notice),560,returnToFace);
   pane('wechat-notice',rx,ry,rw,rh,{crop:[.10,.355,.80,.338],angle:mix(.012,-.04,returnToFace),alpha:mix(mix(1,.23,notice),.23,returnToFace)});
   const nx=mix(mix(1080,735,notice),-130,returnToFace),ny=mix(mix(610,218,notice),510,returnToFace);
   const nw=mix(mix(760,1090,notice),1050,returnToFace),nh=mix(mix(430,650,notice),490,returnToFace);
   pane('evidence-takedown',nx,ny,nw,nh,{alpha:open*mix(mix(.13,1,notice),.24,returnToFace),angle:mix(0,.04,returnToFace)});
   A.live(mix(176,500,returnToFace),mix(444,165,returnToFace),mix(320,760,returnToFace),t,open,
    {framing:'close',framingFrom:'full',framingAt:28.5,framingDuration:2.2,mood:'concerned',lookX:mix(.5,.4,returnToFace)});
  });
 }
 function reaction(t){
  const p=E(t,30.7,32.1);pane('v4_qq_risk',1180,130,640,560,{alpha:.23,angle:-.04});pane('evidence-takedown',-130,510,1050,490,{alpha:.24,angle:.04});
  A.live(mix(500,385,p),mix(165,-70,p),mix(760,1030,p),t,1,{framing:'close',mood:'concerned',lookX:0,gesture:{type:'shake',at:31.8,duration:3.1,amount:.5}});
  F(E(t,31.7,32.65),()=>{c.fillStyle='#040607c9';c.fillRect(1150,585,730,175);text('你愿意',1190,626,65);text('接受吗？',1190,708,65)});
 }
 function future(t){
  const a=E(t,35,37.6),pull=E(t,38.3,41.9),hit=E(t,40.6,42.9),leave=E(t,44.6,47.1);
  camera(960,mix(445,458,pull),mix(1.10,.86,pull),()=>{
   video('blue_terminal',85,90,1380,730,t-35,a);
   // One quiet context pane replaces the former wall of equal-weight evidence.
   pane('e14',1475,545,450,300,{alpha:a*.16,angle:.012});
   A.live(1480,45,380,t,a*(1-hit*.55),{framing:'full',mood:'firm',moodFrom:'concerned',moodAt:35.4,moodDuration:1.3,lookX:-.45});
  });
  F(hit,()=>{c.fillStyle='#020405e0';c.fillRect(0,295,1920,350);text('我们的未来',960,455,mix(98,137,hit),'#fff','center');line(410,582,1510,582,hit,.65,1.5)});
  F(leave,()=>{bg();A.live(270,30,810,t,1,{framing:'waist',mood:'neutral',lookX:.4});line(1180,175,1180,790,leave,.7,2)});
 }
 let legacyEvidenceGain=1;
 window.OpeningImpact={draw(ctx,t,api){if(t<0||t>=47.1)return false;c=ctx;A=api;legacyEvidenceGain=t>=16&&t<35?1-(window.FeatureOpeningEvidenceOpacity||0):1;S(()=>{bg();if(t<HANDOFF_END)cold(t);else if(t<16)article(t);else if(t<30.7)closure(t);else if(t<35)reaction(t);else future(t)});return true}};
})();

/* Concrete software and source documents carry the wish-to-practice sequence. */
(()=>{
 'use strict';let C,A;const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p,E=(t,a,b)=>{let x=cl((t-a)/(b-a));return x*x*(3-2*x)};
 const S=f=>{C.save();f();C.restore()},F=(a,f)=>{if(a>.001)S(()=>{C.globalAlpha*=cl(a);f()})};
 function text(s,x,y,n=50,color='#eee',weight=400){C.font=weight+' '+n+'px "SimSun",serif';C.fillStyle=color;C.textAlign='center';C.textBaseline='middle';C.fillText(s,x,y)}
 function line(x,y,X,Y,a=.5,w=1.5){F(a,()=>{C.strokeStyle='#d2d8d8';C.lineWidth=w;C.beginPath();C.moveTo(x,y);C.lineTo(X,Y);C.stroke()})}
 function circle(x,y,r){C.strokeStyle='#dce1df';C.lineWidth=2;C.beginPath();C.arc(x,y,r,0,Math.PI*2);C.stroke()}
 function image(key,x,y,w,h,crop=key==='project-native'?[0,.30,1,.70]:[0,0,1,1]){const im=A.assets[key];if(!im?.width)return;const sx=im.width*crop[0],sy=im.height*crop[1],sw=im.width*crop[2],sh=im.height*crop[3],k=Math.min(w/sw,h/sh);C.drawImage(im,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k)}
 function movie(key,x,y,w,h,t,fallback){if(A.hasVideo(key))A.video(key,x,y,w,h,Math.max(0,t),{cover:false});else if(fallback)image(fallback,x,y,w,h)}
 function chip(x,y,s=1){S(()=>{C.translate(x,y);C.scale(s,s);C.strokeStyle='#e0e5e3';C.lineWidth=2;C.strokeRect(-62,-48,124,96);C.strokeRect(-42,-28,84,56);for(let i=0;i<5;i++){let a=-42+i*21;line(a,-62,a,-48,.8,2);line(a,48,a,62,.8,2);line(-76,a*.8,-62,a*.8,.8,2);line(62,a*.8,76,a*.8,.8,2)}})}
 function heading(s){text(s,960,95,64,'#f1f1ed',700);line(110,157,1810,157,.3)}
 function knowledge(t){
  heading('已经开放');image('plugins-doc',90,205,1120,600);
  line(1290,240,1290,790,.35);
  if(t<49.977958){text('怎样使用？',1570,420,62,'#d5dcdf');F(E(t,43.577958,44.8),()=>text('怎样成为自己的工具？',1570,565,37,'#aebac0'));}
  else F(E(t,49.977958,50.9),()=>image('project-native',1360,195,455,650));
 }
 function wishes(t){
  if(t<80.855458){image('coopanion_conversation',835,65,970,790);A.live(100,175,560,t,1,{framing:'full',mood:'smile',lookX:.45});return;}
  if(t<86.175458){movie('browser_actions',105,65,1710,790,t-80.855458,'bili_pond_overview');text('dsh-browser',960,906,32,'#aab5ba');return;}
  if(t<93.552958){image('starter_settings',130,70,1660,810);return;}
  if(t<100.752958){image('plugins-doc',130,70,1660,810);return;}
  if(t<109.352958){image('project-native',850,80,800,765);A.live(130,155,560,t,1,{framing:'full',mood:'smile',lookX:.5});text('只想养一条属于自己的鱼',960,905,48,'#e7e9e5');return;}
  if(t<114.472958){movie('p1_ears_setup',110,65,1700,790,t-109.352958,'project-desktop');text('环境',960,906,42,'#b4c0c6');return;}
  if(t<118.992958){image('starter_settings',130,70,1660,790);text('API',960,906,42,'#b4c0c6');return;}
  if(t<122.472958){image('community_diy_control',130,170,1660,640);return;}
  if(t<127.952958){image('plugins-doc',105,65,1710,810);return;}
  if(t<132.272958){image('project-native',165,95,750,740);line(1020,225,1020,805,.65,2);line(1160,380,1730,380,.45);line(1160,610,1730,610,.45);C.strokeStyle='#dce1df';C.lineWidth=3;C.strokeRect(1398,435,94,78);C.beginPath();C.arc(1445,435,31,Math.PI,0);C.stroke();return;}
  if(t<137.272958){image('community_workflow',130,170,1660,640);return;}
  movie('browser_actions',110,65,1700,790,t-137.272958,'bili_pond_overview');text('dsh-browser',960,906,28,'#9da8ae');
 }
 function ecology(t){
  if(t<192.082917){image('community_codex_port',150,155,1620,645);return;}
  if(t<196.8){image('community_asset_reuse',130,155,1660,645);return;}
  image('community_macos_port',130,155,1660,645);
 }
 function framework(t){
  if(t<4.4){
   F(E(t,0,.14),()=>{chip(465,445,1.7);text('模型',465,650,44,'#adb8bd');});
   // The first stage has a short window before the information scene takes over.
   const arrival=.53;
   const progress=E(t,.18,arrival);
   if(progress>0)line(670,445,mix(670,1240,progress),445,.7,2);
   if(t>=arrival){
    line(1225,436,1240,445,.7,2);
    line(1225,454,1240,445,.7,2);
   }
   F(E(t,arrival,.79),()=>text('语言回答',1430,445,68,'#e6e9e5'));
   return;
  }
  const p=E(t,4.4,5.4);F(1-p,()=>{chip(465,445,1.7);text('语言回答',1430,445,68,'#e6e9e5');});
  F(p,()=>{chip(220,460,1.1);text('模型',220,620,36,'#aab7be');circle(590,460,95);text('DSH',590,460,48,'#f1f1ed');line(312,460,495,460,.8,2);line(687,460,855,460,.7,2);
   const data=t>=13.5025;movie(data?'data_sql':'browser_actions',910,155,900,615,data?Math.min(7.8,t-13.5025):Math.min(8,t-4.4),data?'p2_data':'bili_pond_overview');
   text(data?'dsh-data-agent':'dsh-browser',1360,825,32,'#aab7be');text(t>=18.0225?'重新组合':'框架',590,755,49,'#dce1e0');});
 }
 const ranges=[{clip:'p2c1',start:34.217958,end:57.657958,id:'knowledge-access'},{clip:'p2c1',start:75.315458,end:144.917917,id:'wish-to-running-tool'},{clip:'p2c1',start:175.717917,end:202.182916667,id:'creation-to-open-ecology'},{clip:'p2c2',start:0,end:23.7625,id:'framework-and-components'}];
 window.SecondPartSymbols={ranges,draw(ctx,clipId,t,api){const range=ranges.find(r=>r.clip===clipId&&t>=r.start&&t<r.end);if(!range)return false;C=ctx;A=api;S(()=>{C.beginPath();C.rect(0,0,W,H);C.clip();C.fillStyle='#000';C.fillRect(0,0,W,H);if(range.id==='knowledge-access')knowledge(t);else if(range.id==='wish-to-running-tool')wishes(t);else if(range.id==='creation-to-open-ecology')ecology(t);else framework(t)});return true;}};
})();
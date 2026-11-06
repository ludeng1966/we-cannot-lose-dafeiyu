(()=>{
 'use strict';let K;const D=260.6115;
 function support(t){const{E,O,mix,S,alpha,photo,live,camera,desk,link,mesh,video,path,rect,text}=K;
  if(t<2){K.heading('不只是一个接口',t,2);return}
  if(t<10.6115){photo('community_codex_port',230,155,1460,600);return}
  if(t<23.6115){photo('community_asset_reuse',235,130,1450,560);photo('p3_help_support',650,735,620,145,{a:O(t,18,19.2)});return}
  if(t<33.0){video('coopanion_motion',300,55,1320,825,Math.min(8.55,t-23.6115),{fallback:'coopanion_conversation',cover:false,edge:false});text('Coopanion · takboo',960,910,31,'#aaa','center');return}
  if(t<52.58){live(480,-10,1000,t,{framing:'close',mood:'concerned',lookX:0},O(t,33,34.2));return}
  if(t<97.32){const shift=1050*E(t,65.7,67.1)+1050*E(t,80,81.4);S(()=>{K.line(165,-220-shift,165,3200-shift,.42,1.2);[2020,2023,2026].forEach((year,i)=>{const yy=140+i*1050-shift;K.text(String(year),235,yy,102);K.line(165,yy-35,215,yy-35,.7,1.5)});photo('cqstop',550,130-shift,1230,650);photo('mirai',550,1180-shift,1230,650);photo('starter_running',550,2230-shift,1230,650)});return}
  if(t<104.56){photo('community_study_tasks',230,170,1460,580);live(1530,635,240,t,{framing:'full',mood:'concerned',lookX:-.5},O(t,102.4,103.4));return}
  if(t<130.66){if(t<118.56){video('p1_ui_continue',210,65,1500,800,Math.min(13.95,t-104.56),{fallback:'demo-after',cover:false,edge:false});return}photo('starter_settings',215,70,1490,790);text('dshgirl-starter · FlyingFreeOwl',960,910,31,'#aaa','center');return}
  if(t<153.16){const q=E(t,130.66,132.1),leave=E(t,143.1,144.5);alpha(1-q,()=>photo('starter_settings',215,70,1490,790));alpha(q,()=>photo('starter_running',215,70,1490,790,{a:1-leave*.46}));text('dshgirl-starter · FlyingFreeOwl',960,910,31,'#aaa','center');live(1240,80,620,t,{framing:'waist',mood:'concerned',lookX:-.3},leave);return}
  if(t<200.77){
   const depart=E(t,166.1,168),center=E(t,168,170.2);
   alpha(1-depart,()=>{photo('cqcode',210,65,1320,790);text('CQHTTP · Python SDK',870,910,31,'#aaa','center')});
   live(mix(1370,300,center),mix(500,-10,center),mix(330,1000,center),t,{framing:center>.01?'close':'full',mood:t<191.51?'concerned':'firm',lookX:mix(-.4,0,center)},O(t,161.2,162.4));
   alpha(O(t,182.16,183.2)*(1-E(t,186.2,187.4)),()=>text('怎样统计？',1510,400,56,'#ddd','center'));return
  }
  if(t<222.77){const q=E(t,210.77,212.2);alpha(1-q,()=>video('v3_factory_hands',210,65,1500,800,Math.min(9.95,t-200.77),{fallback:'factory',cover:false,edge:false}));live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0},q);return}
  const p=E(t,222.77,230.858889),q=E(t,240.97,247.503726);photo('p1_bili_see',mix(220,90,p),mix(110,85,p),mix(1360,1050,p),mix(730,605,p),{a:1-E(t,240.97,243.732791)});live(mix(1190,480,q),mix(10,-10,q),mix(730,1000,q),t,{framing:'close',framingFrom:'waist',framingAt:240.97,framingDuration:5.5,mood:'firm',lookX:mix(-.4,0,q)},O(t,222.77,225.803333));alpha(O(t,240.97,242)*(1-E(t,244.93,246.2)),()=>text('更早，也更远',480,230,74,'#eee','center'))
 }
 window.FullScenes=window.FullScenes||{};window.FullScenes.p3c2={duration:D,draw(ctx,t,A){K=window.P3FilmKit.use(ctx,A);K.S(()=>{ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();K.bg();support(Math.max(0,Math.min(D-.0001,t)))})}};
})();

/* Historical world, real materials, and present-day working software share one camera. */
(()=>{
 'use strict';
 const W=1920,H=952,WHITE='#f5f3ee',BLACK='#08090b';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const mix=(a,b,u)=>a+(b-a)*u;
 function bez(u,x1=.65,y1=0,x2=.25,y2=1){
  u=clamp(u);let lo=0,hi=1,s=u;
  const f=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
  for(let i=0;i<16;i++){s=(lo+hi)*.5;if(f(s,x1,x2)<u)lo=s;else hi=s;}
  return f(s,y1,y2);
 }
 const p=(t,a,b)=>bez((t-a)/(b-a));
 const fade=(t,a,b,c,d)=>p(t,a,b)*(1-p(t,c,d));
 function group(c,a,fn){if(a<.001)return;c.save();c.globalAlpha*=a;fn();c.restore();}
 function text(c,s,x,y,size=48,align='left',color=WHITE,weight=500){
  c.fillStyle=color;c.font=`${weight} ${size}px "Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
  c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);
 }
 function line(c,x1,y1,x2,y2,a=1,width=2,color=WHITE){
  c.save();c.globalAlpha*=a;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
 }
 function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
 function outline(c,x,y,w,h,width=2,color=WHITE){c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);}
 function image(c,A,key,x,y,w,h,o={}){
  const im=A.assets[key];if(!im)return false;
  const crop=o.crop||[0,0,1,1],sx=im.width*crop[0],sy=im.height*crop[1],sw=im.width*crop[2],sh=im.height*crop[3];
  const k=(o.cover?Math.max:Math.min)(w/sw,h/sh);
  c.save();c.globalAlpha*=o.alpha??1;c.translate(x+w/2,y+h/2);c.rotate(o.rot||0);
  c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();
  if(o.bg)rect(c,-w/2,-h/2,w,h,o.bg);
  c.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k);c.restore();return true;
 }
 function photo(c,A,key,x,y,w,h,o={}){
  c.save();c.translate(x+w/2,y+h/2);c.rotate(o.rot||0);c.globalAlpha*=o.alpha??1;
  // The object has a visible paper edge; it never fills over its own content.
  c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=28;c.shadowOffsetY=18;
  rect(c,-w/2-7,-h/2-7,w+14,h+14,o.edge||'#d7d7d4');c.shadowColor='transparent';
  image(c,A,key,-w/2,-h/2,w,h,{...o,rot:0,alpha:1});c.restore();
 }
 function screen(c,x,y,w,h,fn,{stand=false}={}){
  c.save();c.shadowColor='#000';c.shadowBlur=30;rect(c,x-10,y-10,w+20,h+20,'#24262a');c.shadowColor='transparent';
  fn();outline(c,x-10,y-10,w+20,h+20,2,'#8b8d91');
  if(stand){rect(c,x+w*.47,y+h+10,w*.06,48,'#686a6f');c.fillStyle='#b7b8bb';c.beginPath();c.moveTo(x+w*.35,y+h+58);c.lineTo(x+w*.65,y+h+58);c.lineTo(x+w*.7,y+h+70);c.lineTo(x+w*.3,y+h+70);c.closePath();c.fill();}
  c.restore();
 }
 function video(c,A,key,x,y,w,h,seconds,o={},fallback='desktop'){
  if(A.hasVideo?.(key)){A.video(key,x,y,w,h,Math.max(0,seconds),o);return;}
  image(c,A,fallback,x,y,w,h,o);
 }
 function cropReveal(c,u,x,y,w,h,fn){
  c.save();c.beginPath();c.rect(x,y,w*clamp(u),h);c.clip();fn();c.restore();
 }
 function desk(c,y=830,a=1){line(c,420,y,1900,y,a,3,'#aeb1b6');line(c,470,y+7,1850,y+7,a*.28,1);}
 function cable(c,x1,y1,x2,y2,u=1,a=1){
  c.save();c.globalAlpha*=a;c.strokeStyle=WHITE;c.lineWidth=2.2;
  c.beginPath();c.moveTo(x1,y1);c.bezierCurveTo(x1+(x2-x1)*.54,y1,x1+(x2-x1)*.46,y2,x2,y2);c.stroke();
  if(u<1){/* Reveal by the enclosing material mask, rather than moving a decoration along the wire. */}
  c.restore();
 }
 const cameraStops=[[-1,-1080],[10.9,-1080],[13.6,0],[34.5,0],[37.2,1080],[69.25,1080],[72.25,2160],[82.4,2160],[85.25,3240],[89.8,3240],[92.5,4320],[95.9,4320],[98.8,5400],[125.5,5400],[129.6,6480],[190,6480]];
 function camera(t){
  for(let i=1;i<cameraStops.length;i++)if(t<=cameraStops[i][0]){const a=cameraStops[i-1],b=cameraStops[i];return mix(a[1],b[1],p(t,a[0],b[0]));}
  return 6480;
 }
 const years=[[2008,0],[2017,1080],[2020,2160],[2022,3240],[2023,4320],[2026,6480]];
 function rail(c,t,cam){
  const a=p(t,7.8,9.8)*(1-fade(t,94.68,97.2,126,129.6));
  group(c,a,()=>{
   line(c,164,-1300-cam,164,9100-cam,.7,2);
   for(const[y,Y]of years){const sy=Y+138-cam;if(sy<-180||sy>H+180)continue;
    line(c,164,sy-42,218,sy-42,.95,3);text(c,String(y),242,sy,118,'left',WHITE,450);
   }
  });
 }
 function inWorld(c,Y,cam,fn){const dy=Y-cam;if(dy<-1040||dy>H+50)return;c.save();c.translate(0,dy);fn();c.restore();}

 function prologue(c,t,A){
  const d=p(t,0,3.4),away=p(t,8.28,11.3);
  A.live(mix(780,910,d),mix(-80,25,d),mix(890,680,d),t,1-away*.6,{framing:'waist',framingFrom:'close',framingAt:0,framingDuration:3.4,mood:'concerned',lookX:mix(-.1,-.55,d),lookY:.08,gesture:{type:'turn',at:.6,duration:3.2,amount:.2}});
  c.save();c.translate(0,mix(0,-160,away));
  screen(c,mix(250,390,d),mix(485,200,d),mix(890,870,d),mix(340,540,d),()=>image(c,A,'desktop',mix(250,390,d),mix(485,200,d),mix(890,870,d),mix(340,540,d),{crop:[.04,.02,.9,.9],cover:true}));
  c.restore();
  group(c,fade(t,1,2,6.8,8.28),()=>text(c,'第一次？',235,220,96,'left',WHITE,600));
  const reveal=p(t,8.28,10.6);
  cropReveal(c,reveal,1090,140,560,404,()=>photo(c,A,'coral_old_ui',1090,140,560,404,{rot:-.025}));
  line(c,164,952,164,mix(952,150,reveal),.9,2);
 }

 function coral(c,t,A){
  const u=p(t,12.24,16.0),archive=p(t,19.6,22.4),report=p(t,25.1,26.5),verdict=p(t,29.8,31.4),next=p(t,33.1,34.5);
  photo(c,A,'coral_old_ui',mix(700,580,u),mix(180,185,u),mix(670,520,u),mix(484,375,u),{rot:mix(-.035,0,u),alpha:mix(mix(1,.3,archive),.16,report)*(1-next*.6)});
  group(c,p(t,16.8,18.4),()=>photo(c,A,'coral_download_claim',mix(1900,1170,archive),195,635,401,{rot:mix(.025,-.01,archive),alpha:mix(1,.18,report)*(1-next*.6)}));
  group(c,1-report,()=>{line(c,675,630,mix(675,1740,p(t,18.4,20.3)),630,.35,1.3);text(c,'官方没有提供的功能',675,710,49,'left',WHITE,500);});
  group(c,report*(1-next*.4),()=>photo(c,A,'coral',550,mix(880,620,report),1280,225,{rot:mix(.018,0,report)}));
  group(c,verdict*(1-next),()=>A.live(250,335,300,t,.85,{framing:'full',mood:'concerned',lookX:.6,lookY:.15}));
 }

 function framework(c,t,A){
  const code=p(t,38.6,41.1),outVideo=p(t,51.1,53.2);
  if(t<54.2){
   const reposcale=mix(1,.76,code);
   c.save();c.translate(1190,390);c.scale(reposcale,reposcale);group(c,mix(1,.18,code),()=>{image(c,A,'cqrepo',-650,-285,1300,565);outline(c,-650,-285,1300,565,1,'#585b60');});c.restore();
   group(c,code*mix(1,.18,outVideo),()=>photo(c,A,'cqcode',mix(1400,850,code),mix(500,205,code),980,612,{rot:mix(.028,0,code)}));
   group(c,outVideo,()=>photo(c,A,'onebot',mix(1760,610,outVideo),110,1200,755,{rot:mix(.025,0,outVideo)}));
  }else{
   const pull=p(t,54.2,55.1),community=p(t,65.9,67.0);
   photo(c,A,'onebot',610,110,1200,755,{alpha:mix(1,.18,community)});
   desk(c,890,pull*.35);
   A.live(255,335,310,t,p(t,58.5,61.0)*(1-community*.65),{framing:'full',mood:'neutral',lookX:.62,lookY:.18,gesture:{type:'nod',at:61.8,duration:2.5,amount:.12}});
   group(c,community,()=>photo(c,A,'downstream',610,mix(860,180,community),1200,675,{rot:mix(-.018,0,community)}));
  }
 }

 function stoppage(c,t,A){
  const arrive=p(t,70.92,73.7),detail=p(t,75,77.6),down=p(t,78.2,80.9);
  const x=mix(650,560,arrive),y=mix(250,155,arrive),w=mix(1140,1250,detail);
  photo(c,A,'cqstop',x,y,w,605,{crop:[0,0,1,1],rot:mix(.018,0,arrive),alpha:mix(1,.28,down)});
  group(c,detail*(1-down*.75),()=>{
   // A reading mask moves over the original paragraph, preserving the original text.
   c.strokeStyle=WHITE;c.lineWidth=2;c.strokeRect(x+30,y+126,w-65,88);
  });
  group(c,down,()=>photo(c,A,'downstream',mix(1050,790,down),mix(900,520,down),1030,345,{crop:[0,.28,1,.59],rot:mix(-.035,-.008,down)}));
 }

 function launch(c,t,A){
  const rise=p(t,84.04,86.8),read=p(t,86.5,89.7);
  screen(c,550,mix(255,145,rise),1270,660,()=>image(c,A,'chatgpt',550,mix(255,145,rise),1270,660,{crop:[mix(0,.08,read),mix(0,.02,read),mix(1,.84,read),.98],cover:false}));
  line(c,164,810,550,810,p(t,84.04,85.7)*.75,2);
 }
 function continuation(c,t,A){
  const u=p(t,90.1,92.6),q=p(t,94.68,96.7);
  photo(c,A,'mirai',mix(550,530,q),mix(160,180,q),mix(1260,1220,q),mix(625,605,q),{rot:mix(.02,0,u)});
  group(c,q,()=>A.live(270,340,300,t,.85,{framing:'full',mood:'concerned',lookX:.55,lookY:.1}));
 }

 function possibility(c,t,A){
  const entry=p(t,96.1,99),table=p(t,99.2,103.6);
  rect(c,420,70,1440,800,WHITE);
  line(c,420,70,420,870,1,5,'#9fa1a4');
  if(t<103.6){
   const w=mix(1040,1180,table),h=mix(645,660,table);
   screen(c,mix(690,640,table),mix(150,130,table),w,h,()=>image(c,A,'community_workflow',mix(690,640,table),mix(150,130,table),w,h,{cover:false}));
   A.live(270,260,340,t,entry,{framing:'full',mood:'neutral',lookX:.5,lookY:.1});
   group(c,1-table,()=>photo(c,A,'cqcode',1060,790,640,150,{crop:[.04,.18,.92,.38],rot:-.018,alpha:.2}));
  }else if(t<112.8){
   const run=p(t,103.6,105.2),pull=p(t,109.7,112.8);
   const x=mix(540,810,pull),y=mix(125,230,pull),w=mix(1250,930,pull),h=mix(700,520,pull);
   screen(c,x,y,w,h,()=>video(c,A,'data_sql',x,y,w,h,Math.min(6.15,t-103.6),{cover:false},'demo-site'),{stand:pull>.65});
   group(c,pull,()=>photo(c,A,'demo-code',465,610,470,250,{cover:false,rot:-.025,alpha:.3}));
   line(c,420,870,mix(420,1840,run),870,.8,2,'#252629');
  }else if(t<120.0){
   const arrive=p(t,112.8,114.4),pull=p(t,117.4,120.0);
   screen(c,770,mix(305,170,arrive),1000,563,()=>video(c,A,'stock_student',770,mix(305,170,arrive),1000,563,t-112.8,{cover:true},'classroom'));
   photo(c,A,'onebot',mix(130,455,arrive),mix(480,390,arrive),610,444,{crop:[0,0,1,.86],rot:mix(-.055,-.02,arrive)});
   group(c,pull,()=>A.live(500,510,280,t,.8,{framing:'full',mood:'smile',lookX:.6,lookY:.12}));
  }else{
   const u=p(t,120,124.8),close=p(t,125.28,126.8);
   c.save();c.translate(1160,450);c.scale(mix(.8,.65,u),mix(.8,.65,u));
   photo(c,A,'chain-source',-850,-260,760,540,{cover:false,rot:-.025,alpha:mix(1,.35,u)});
   photo(c,A,'chain-modified',mix(-50,20,u),-100,760,540,{cover:false,rot:.018,alpha:mix(1,.6,u)});
   photo(c,A,'chain-result',mix(780,360,u),mix(-300,-370,u),760,540,{cover:false,rot:0});
   cable(c,-90,240,80,250,u,1);cable(c,780,250,960,-100,u,1);c.restore();
   group(c,close,()=>{rect(c,420,70,1440,800,`rgba(8,9,11,${close*.82})`);text(c,'可现实是什么？',1100,480,79,'center',WHITE,550);});
  }
 }

 function present(c,t,A){
  if(t<138.2){
   const enter=p(t,128.92,131.4),reveal=p(t,136.8,138.2);
   const x=mix(780,560,enter),y=mix(270,170,enter),w=mix(950,1260,enter),h=w*9/16;
   screen(c,x,y,w,h,()=>video(c,A,'p1_ui_continue',x,y,w,h,t-128.92,{cover:false},'demo-code'));
   group(c,reveal,()=>{
    const nx=mix(1730,575,reveal),nw=mix(80,1235,reveal);
    screen(c,nx,190,nw,660,()=>video(c,A,'p1_browser_research',nx,190,nw,660,Math.min(15.9,t-136.8),{cover:false},'desktop'));
   });
  }else if(t<149.92){
   const pull=p(t,143.3,149.92),x=mix(550,760,pull),y=mix(125,165,pull),w=mix(1280,1020,pull),h=mix(745,594,pull);
   screen(c,x,y,w,h,()=>video(c,A,'p1_browser_research',x,y,w,h,Math.min(15.9,t-136.8),{cover:false},'desktop'),{stand:pull>.7});
   group(c,pull,()=>{
    desk(c,850,pull);
    A.live(270,365,350,t,1,{framing:'full',mood:'concerned',lookX:.6,lookY:.15,gesture:{type:'turn',at:143.3,duration:3.6,amount:.13}});
    photo(c,A,'cqcode',1140,775,620,145,{crop:[0,.18,1,.37],rot:-.018,alpha:.3});
   });
  }else if(t<158.4){
   const u=p(t,149.92,153.0),pull=p(t,154.3,158.4);
   A.live(1500,140,330,t,1,{framing:'full',mood:'concerned',lookX:-.6,lookY:.12});
   c.save();c.translate(945,445);c.scale(mix(.95,.78,pull),mix(.95,.78,pull));
   photo(c,A,'cqcode',mix(-260,-430,u),-330,900,560,{cover:false,rot:-.023,alpha:mix(1,.3,u)});
   group(c,u,()=>photo(c,A,'credit',-300,mix(850,90,u),980,430,{crop:[.03,.46,.63,.45],rot:0}));
   c.restore();
  }else if(t<166.8){
   const reveal=p(t,158.4,160.3);
   const x=mix(650,570,reveal),w=mix(1000,1070,reveal),y=mix(220,120,reveal),h=713;
   screen(c,x,y,w,h,()=>video(c,A,'coopanion_motion',x,y,w,h,t-158.4,{cover:false},'desktop'));

  }else if(t<178.2){
   const arrive=p(t,166.8,167.7),handoff=p(t,171.0,173.25);
   // The complete user-supplied notice belongs to the present-day restriction,
   // while its original wording continues to identify exactly what was removed.
   group(c,arrive*(1-handoff),()=>{
    photo(c,A,'evidence-takedown',mix(620,565,arrive)-140*handoff,mix(260,90,arrive),1265,810,{rot:0});
   });
   const x=mix(1220,740,handoff),y=150,w=mix(460,1080,handoff),h=650;
   group(c,handoff,()=>{
    cropReveal(c,handoff,x,y,w,h,()=>screen(c,x,y,w,h,()=>video(c,A,'ears_voice',x,y,w,h,t-171.0,{cover:true},'desktop')));
   });
   A.live(mix(170,320,handoff),20,730,t,p(t,170.55,171.65),{framing:'waist',framingFrom:'full',framingAt:171.0,framingDuration:2.25,mood:'firm',lookX:.45,lookY:.08});
   group(c,p(t,174,175.2),()=>photo(c,A,'community_diy_control',1150,mix(930,690,p(t,174,175.2)),650,168,{rot:.013}));
  }else{
   const u=p(t,178.2,181.1),finish=p(t,182.8,185.5);
   const x=mix(740,1390,u),y=mix(150,610,u),w=mix(1080,415,u),h=mix(650,250,u);
   screen(c,x,y,w,h,()=>image(c,A,'desktop',x,y,w,h,{cover:true}));
   A.live(mix(320,445,u),mix(20,-20,u),mix(730,850,u),t,1,{framing:'close',framingFrom:'waist',framingAt:178.2,framingDuration:2.9,mood:'firm',lookX:.12,lookY:0,gesture:{type:'shake',at:178.3,duration:3,amount:.14}});
   group(c,finish,()=>{
    text(c,'整个 Agent 时代？',1055,355,72,'left',WHITE,550);
    line(c,164,900,mix(164,1815,finish),900,.8,2);
   });
  }
 }

 window.FullScenes.intro2={
  duration:185.7,
  draw(c,t,A){
   t=clamp(t,0,185.7);c.save();c.beginPath();c.rect(0,0,W,H);c.clip();rect(c,0,0,W,H,BLACK);
   const cam=camera(t);rail(c,t,cam);
   inWorld(c,-1080,cam,()=>prologue(c,t,A));
   inWorld(c,0,cam,()=>coral(c,t,A));
   inWorld(c,1080,cam,()=>framework(c,t,A));
   inWorld(c,2160,cam,()=>stoppage(c,t,A));
   inWorld(c,3240,cam,()=>launch(c,t,A));
   inWorld(c,4320,cam,()=>continuation(c,t,A));
   inWorld(c,5400,cam,()=>possibility(c,t,A));
   inWorld(c,6480,cam,()=>present(c,t,A));
   c.restore();
  }
 };
})();

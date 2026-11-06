(()=>{
 'use strict';let c,A;
 const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,u)=>a+(b-a)*u;
 function bez(x,a=.65,b=0,d=.27,e=1){x=cl(x);if(x===0||x===1)return x;const f=(u,A,B)=>3*(1-u)**2*u*A+3*(1-u)*u*u*B+u**3;let l=0,h=1;for(let i=0;i<17;i++){const m=(l+h)/2;f(m,a,d)<x?l=m:h=m;}return f((l+h)/2,b,e);}
 const E=(t,a,b)=>bez((t-a)/(b-a),b-a>5?.48:.66,0,b-a>5?.24:.25,1),O=(t,a,b)=>bez((t-a)/(b-a),.18,.65,.30,1),S=f=>{c.save();f();c.restore();};
 function alpha(a,f){if(a<.001)return;S(()=>{c.globalAlpha*=cl(a);f();});}
 function box(x,y,w,h,fill='#07090b',stroke=null){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.4;c.strokeRect(x,y,w,h);}}
 function line(x,y,X,Y,a=.6,w=1,col='#ddd'){alpha(a,()=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();});}
 function path(points,p=1,a=.6,w=1,col='#ddd'){const ls=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let left=ls.reduce((s,v)=>s+v,0)*cl(p);ls.forEach((len,i)=>{const q=cl(left/Math.max(.001,len));if(q>0)line(...points[i],mix(points[i][0],points[i+1][0],q),mix(points[i][1],points[i+1][1],q),a,w,col);left-=len;});}
 function text(s,x,y,n=44,col='#eee',align='left',face='"SimSun",serif'){c.font=n+'px '+face;c.textAlign=align;c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);}
 function image(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false}={}){const im=A.assets[key];if(!im?.width||a<.001)return false;S(()=>{c.globalAlpha*=a;c.beginPath();c.rect(x,y,w,h);c.clip();const[sx,sy,sw,sh]=[crop[0]*im.width,crop[1]*im.height,crop[2]*im.width,crop[3]*im.height],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k);});return true;}
 function footage(key,x,y,w,h,local,opts={}){if((opts.alpha??1)<.001||!A.hasVideo?.(key))return false;return A.video(key,x,y,w,h,Math.max(0,local),opts);}
 function live(x,y,w,t,a=1,opts={}){if(a>.001)A.live(x,y,w,t,a,opts);}
 function screen(x,y,w,h,draw,{a=1,stand=0,reveal=1,axis='x'}={}){alpha(a,()=>{S(()=>{c.beginPath();const ww=axis==='x'?w*reveal:w,hh=axis==='y'?h*reveal:h;c.rect(x,y,ww,hh);c.clip();box(x,y,w,h,'#0a0d10');draw();});line(x-12,y-12,x+w+12,y-12,.75,1.6);line(x-12,y-12,x-12,y+h+12,.65,1.6);line(x+w+12,y-12,x+w+12,y+h+12,.65,1.6);line(x-12,y+h+12,x+w+12,y+h+12,.75,1.6);alpha(stand,()=>{line(x+w*.5,y+h+12,x+w*.5,y+h+90,.6,6);line(x+w*.31,y+h+92,x+w*.69,y+h+92,.65,2.2);});});}
 function photo(key,x,y,w,h,{a=1,rot=0,crop=[0,0,1,1],cover=false,edge='#babbb9'}={}){alpha(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rot);c.shadowColor='#000b';c.shadowBlur=24;c.shadowOffsetY=14;box(-w/2-5,-h/2-5,w+10,h+10,'#131517',edge);c.shadowColor='transparent';image(key,-w/2,-h/2,w,h,{crop,cover});});}
 function desk(x,y,w,a=1){line(x,y,x+w,y,a*.7,2.5);line(x+35,y,x+18,y+180,a*.4,2);line(x+w-35,y,x+w-18,y+180,a*.4,2);}
 function camera(x,y,z,f){S(()=>{c.translate(960,460);c.scale(z,z);c.translate(-x,-y);f();});}
 function title(t){
  const in1=O(t,.15,1.5),in2=O(t,1.6,2.8),leave=E(t,5.9,8.06);
  alpha(in1,()=>{text('从 AI 到 Agent',960,mix(405,355,in1),112,'#eee','center');line(430,508,430+1060*in1,508,.6,1.4);});
  alpha(in2,()=>text('一场生产力的飞跃',960,585,57,'#c8c8c8','center'));
  alpha(O(t,4.6,5.8),()=>{c.translate(0,80*leave);text('从技术消费者到技术创造者',960,760,45,'#aaa','center');});
 }
 function pondWorld(t){
  const open=O(t,8.06,9.15),pull=E(t,16.2,20.4),pan=E(t,22.6,27.56);
  camera(mix(970,1220,pan),mix(420,465,pull),mix(1,.76,pull),()=>{
   screen(210,40,1140,760,()=>image('bili_pond_overview',210,40,1140,760,{crop:[.015,.03,.97,.90],cover:false}),{reveal:open,a:mix(1,.34,O(t,14,15.4))});
   photo('e01',mix(480,990,pull),mix(600,845,pull),1050,248,{a:O(t,10.3,11.4),rot:mix(0,.012,pull)});
   photo('e05',mix(1790,1705,pan),mix(80,110,pull),690,415,{a:O(t,14.0,15.4),rot:.015});
   photo('bili_pond_history',mix(-660,-40,pull),mix(120,80,pull),610,420,{a:O(t,20.36,21.3),crop:[.02,.05,.96,.92],cover:false,rot:-.02});
   path([[1350,645],[1705,645],[1705,525],[2030,525]],E(t,17.5,21.0),.52,1.6);
   path([[210,420],[130,420],[130,800],[-260,800],[-260,700]],E(t,23.4,26.7),.4,1.4);
   desk(80,1095,2370,pull);
  });
 }
 function workstations(t){
  const arrive=E(t,27.56,30.0),walk=E(t,31.16,38.8),focus=E(t,43.8,49.0),pull=E(t,54.5,60.5);
  const cam=mix(mix(850,1540,walk),2040,focus),z=mix(mix(.86,.92,focus),.70,pull);
  camera(cam,mix(440,490,pull),z,()=>{
   screen(-40,160,840,545,()=>image('desktop',-40,160,840,545,{cover:true}),{a:arrive*mix(1,.28,O(t,32.7,34)),stand:1});
   photo('e14',910,200,720,470,{a:O(t,32.7,34.0)*mix(1,.25,focus),rot:-.012});
   screen(1725,70,1110,670,()=>{
    if(t<43.8)image('bili_pond_memory',1725,70,1110,670,{crop:[.01,.04,.98,.9],cover:true});
    else if(!footage('p1_browser_research',1725,70,1110,670,Math.min(15.9,t-43.8),{cover:true}))image('demo-site',1725,70,1110,670);
   },{a:O(t,35.5,37)*mix(1,.35,O(t,52.7,54)),stand:focus});
   desk(-170,860,3180,arrive);photo('p1_bili_see',mix(2960,2630,pull),mix(170,115,pull),750,650,{a:O(t,52.7,54),rot:.012,crop:[0,0,1,.92]});
   path([[800,685],[875,685],[875,785],[1725,785],[1725,625]],E(t,38.4,42.0),.5,1.5);
   path([[2835,645],[2910,645],[2910,790],[3190,790]],E(t,56.2,60.4),.45,1.5);
  });
 }
 function firstSteps(t){
  const approach=E(t,60.52,64),pull=E(t,68.2,73.2),share=E(t,76,83.64);
  camera(mix(mix(1000,1310,pull),1590,share),mix(mix(470,500,pull),600,share),mix(mix(.98,.70,pull),.55,share),()=>{
   screen(190,25,1500,800,()=>image('p1_bili_see',190,25,1500,800,{crop:[0,0,1,.91]}),{reveal:approach,stand:pull});
   live(1705,100,450,t,O(t,68.2,70.2),{framing:'full',mood:'neutral',lookX:-.5});
   photo('community_workflow',70,mix(1020,930,pull),870,365,{a:O(t,70.88,72.0),rot:-.018});
   photo('community_macos_port',1090,mix(1270,930,share),900,345,{a:O(t,75.0,76.5),rot:.012});
   photo('community_asset_reuse',mix(2240,2180,share),mix(990,930,share),830,305,{a:O(t,79.0,80.4),rot:-.012});
   desk(70,930,2200,pull);
   path([[520,825],[520,1430],[2330,1430],[2330,1235]],E(t,73.8,82.5),.38,1.5);
  });
 }
 function access(t){
  const field=E(t,83.64,85.15),separate=E(t,92.6,99.8),into=E(t,104.88,108.2),pull=E(t,112.4,116.44);
  box(0,0,W,H,'#eeefec');
  photo('factory',mix(105,45,separate),100,mix(1120,850,separate),700,{a:field,cover:true,crop:[.08,.03,.87,.92],edge:'#777'});
  alpha(field,()=>{line(mix(1270,1010,separate),90,mix(1270,1010,separate),850,.55,1.4,'#333');});
  photo('e04',mix(1330,1120,separate),mix(320,145,separate),690,435,{a:O(t,88.8,90.3),rot:.008,edge:'#777'});
  alpha(O(t,95.5,97),()=>{text('拥有',mix(1280,690,separate),812,46,'#222','center');text('掌握',1480,812,46,'#222','center');text('≠',1000,812,64,'#333','center','Georgia,serif');});
  alpha(into,()=>{box(0,0,W,H,'#050607');const x=mix(360,410,pull),y=mix(90,110,pull),w=mix(1380,1270,pull),h=mix(780,720,pull);
   screen(x,y,w,h,()=>{if(!footage('p1_ui_continue',x,y,w,h,Math.min(13.9,t-104.88),{cover:true,crop:[40/1280,118/720,890/1280,500/720]}))image('demo-after',x,y,w,h);},{stand:pull});
   photo('factory',mix(85,30,pull),mix(780,690,pull),mix(470,430,pull),mix(245,224,pull),{a:pull,cover:true,edge:'#777'});
   desk(290,930,1510,pull);
  });
 }
 function participation(t){
  const open=E(t,116.44,118.0),pull=E(t,120.0,124.2);
  const x=mix(95,640,pull),y=mix(60,135,pull),w=mix(1730,1150,pull),h=mix(800,650,pull);
  screen(x,y,w,h,()=>{if(!footage('p1_ears_setup',x,y,w,h,Math.min(13.9,t-116.44),{cover:true}))image('starter_settings',x,y,w,h);},{reveal:open,stand:pull});
  live(mix(-600,60,pull),120,460,t,pull,{framing:'full',mood:'smile',moodFrom:'neutral',moodAt:120.5,moodDuration:1.2,lookX:.5});
  desk(580,900,1260,pull);photo('starter_running',70,650,480,257,{a:O(t,124,125.4),rot:0,crop:[0,0,1,1]});
 }
 function debate(t){
  const enter=O(t,128.48,129.7),shift=E(t,134.9,138.5),pull=E(t,142.68,147.6);
  camera(mix(900,1110,shift),mix(440,430,pull),mix(1,.8,pull),()=>{
   photo('e06',180,115,1020,600,{a:enter,rot:mix(-.012,0,shift)});
   photo('wechat-notice',mix(2000,1270,shift),mix(75,85,shift),700,760,{a:O(t,132.8,134),crop:[.10,.355,.80,.338],edge:'#707070'});
   path([[1120,670],[1180,670],[1180,890],[1660,890]],E(t,138.6,142.4),.45,1.5);
  });
 }
 function question(t){
  const open=E(t,148.2,150),reach=E(t,154.8,159.8),halt=E(t,162.6,165.2),retreat=E(t,166.2,170.2);
  alpha(mix(1,.18,E(t,170.2,173)),()=>camera(mix(970,1050,retreat),mix(440,470,retreat),mix(.98,.70,retreat),()=>{
   screen(60,100,860,550,()=>image('desktop',60,100,860,550,{cover:true}),{reveal:open,stand:1});
   photo('p1_bili_see',1100,85,800,600,{a:open,rot:0,crop:[0,0,1,.90]});
   path([[920,520],[1000,520],[1000,745],[1610,745],[1610,685]],reach,.7,1.8);
   line(1000,170,1000,mix(170,820,halt),halt*.92,3);line(1015,170,1015,mix(170,820,halt),halt*.25,1);
   desk(-50,860,2050,1);
   photo('community_workflow',220,680,640,270,{a:O(t,167,168.5),rot:-.012});
  }));
  live(mix(1530,1120,E(t,170.2,173)),mix(280,-10,E(t,170.2,173)),mix(500,920,E(t,170.2,173)),t,O(t,170.2,171.5),{framing:'close',framingFrom:'waist',framingAt:170.2,framingDuration:2.8,mood:'concerned',lookX:-.2});
  alpha(O(t,176.6,177.6),()=>{box(95,210,760,220,'#000c');text('怎样的选择？',470,320,87,'#eee','center');});
 }
 function opportunity(t){
  const enter=O(t,179.16,180.5),pull=E(t,183.5,194.5),lower=E(t,197.5,203.4);
  camera(mix(1010,1170,pull),mix(450,620,lower),mix(1,.62,pull),()=>{
   live(760,20,810,t,enter,{framing:'full',mood:'firm',lookX:mix(-.32,.3,lower)});
   photo('community_macos_release',-80,100,750,360,{a:O(t,182.2,183.6)*mix(mix(1,.4,O(t,186.5,188)),.18,O(t,194.5,195.7)),rot:-.012});
   photo('community_codex_port',1700,150,910,360,{a:O(t,186.5,188)*mix(1,.2,O(t,194.5,195.7)),rot:.014});
   screen(-120,650,960,530,()=>image('chain-modified',-120,650,960,530,{cover:false}),{a:O(t,189,190.4)*mix(1,.45,O(t,194.5,195.7)),stand:1});
   screen(1660,670,1000,562,()=>{if(!footage('blue_terminal',1660,670,1000,562,Math.min(11.93,t-194.5),{cover:false}))image('chain-result',1660,670,1000,562);},{a:O(t,194.5,195.7),stand:1});
   path([[650,450],[650,570],[360,570],[360,650]],E(t,184,188.5),.45,1.5);
   path([[1650,650],[1900,650],[1900,510],[2130,510]],E(t,191,195),.45,1.5);
   desk(-250,1390,3160,O(t,197.6,199.1));
  });
  const end=E(t,206.1,208.6);line(230,886,230+1460*end,886,end*.55,1.5);
 }
 const stages=[{a:0,b:8.06,fn:title},{a:8.06,b:27.56,fn:pondWorld},{a:27.56,b:60.52,fn:workstations},{a:60.52,b:83.64,fn:firstSteps},{a:83.64,b:116.44,fn:access},{a:116.44,b:128.48,fn:participation},{a:128.48,b:148.2,fn:debate},{a:148.2,b:179.16,fn:question},{a:179.16,b:208.6,fn:opportunity}];
 window.FullScenes.p1c1={duration:208.6,draw(ctx,time,api){c=ctx;A=api;const t=Math.max(0,Math.min(208.59999,time));S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();box(0,0,W,H,'#000');if(t>=7.296624998&&t<12.24){pondWorld(t);alpha(1-E(t,10.9,12.24),()=>{box(0,0,W,H,'#000');title(t);});return;}if(t>=128.1937916667&&t<129.7){debate(t+.2862083333);return;}const i=stages.findIndex(q=>t>=q.a&&t<q.b),s=stages[Math.max(0,i)];if(i>0&&t<s.a+.8){const u=E(t,s.a,s.a+.8);S(()=>{c.translate(0,-50*u);alpha(1-u,()=>stages[i-1].fn(stages[i-1].b-.001));});alpha(u,()=>s.fn(t));}else s.fn(t);});}};
})();

/* Knowledge, source code and a real local file tool are objects in one continuous space. */
(()=>{
 'use strict';let c,A;const W=1920,H=952,cl=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x,x1=.65,y1=0,x2=.27,y2=1){x=cl(x);if(!x||x===1)return x;const f=(u,a,b)=>3*(1-u)**2*u*a+3*(1-u)*u*u*b+u**3;let lo=0,hi=1;for(let i=0;i<17;i++){let m=(lo+hi)/2;f(m,x1,x2)<x?lo=m:hi=m;}return f((lo+hi)/2,y1,y2);}
 const E=(t,a,b)=>bez((t-a)/(b-a),b-a>5?.48:.66,0,b-a>5?.24:.25,1),O=(t,a,b)=>bez((t-a)/(b-a),.18,.65,.3,1);
 function S(fn){c.save();fn();c.restore();}
 function alpha(a,fn){if(a<.001)return;S(()=>{c.globalAlpha*=cl(a);fn();});}
 function box(x,y,w,h,fill=null,stroke=null,lw=1){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h);}}
 function line(x,y,X,Y,a=.55,w=1,col='#d8dde1'){alpha(a,()=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();});}
 function path(points,p=1,a=.6,w=1,col='#d8dde1'){const ls=points.slice(1).map((v,i)=>Math.hypot(v[0]-points[i][0],v[1]-points[i][1]));let rem=ls.reduce((s,n)=>s+n,0)*cl(p);ls.forEach((len,i)=>{const k=cl(rem/Math.max(.001,len));if(k)line(...points[i],mix(points[i][0],points[i+1][0],k),mix(points[i][1],points[i+1][1],k),a,w,col);rem-=len;});}
 function dot(x,y,r=3,a=1,col='#ddd'){alpha(a,()=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill();});}
 function text(s,x,y,n=46,col='#edf0f2',align='left',font='"SimSun",serif'){c.font=(n>=64?'700 ':'400 ')+n+'px '+font;c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);}
 function words(s,x,y,n,t,start,a=1){[...s].forEach((ch,i)=>{const p=O(t,start+i*.055,start+i*.055+.85);alpha(p*a,()=>text(ch,x+i*n,y+(1-p)*24,n));});}
 function img(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false}={}){const im=A.assets?.[key];if(!im?.width||a<.001)return false;S(()=>{c.globalAlpha*=a;c.beginPath();c.rect(x,y,w,h);c.clip();const[sx,sy,sw,sh]=[crop[0]*im.width,crop[1]*im.height,crop[2]*im.width,crop[3]*im.height],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k);});return true;}
 function film(key,x,y,w,h,t,a=1,options={}){if(a<.001||!A.hasVideo?.(key))return false;return A.video(key,x,y,w,h,Math.max(0,t),{alpha:a,cover:false,...options});}
 function frame(x,y,w,h,a=1){alpha(a,()=>box(x-2,y-2,w+4,h+4,null,'#687177',1));}
 function pane(key,x,y,w,h,{a=1,crop,cover=false}={}){if(a<.001)return;alpha(a,()=>{box(x,y,w,h,'#080e13');img(key,x,y,w,h,{crop,cover});frame(x,y,w,h);});}
 function footage(key,x,y,w,h,t,a=1,fallback='p1-report'){if(a<.001)return;box(x,y,w,h,'#080e13');if(!film(key,x,y,w,h,t,a))img(fallback,x,y,w,h,{a});frame(x,y,w,h,a);}
 function aperture(x,y,w,h,p,draw,axis='x'){if(p<.001)return;S(()=>{const ww=axis==='x'?w*p:w,hh=axis==='y'?h*p:h;c.beginPath();c.rect(x,y,ww,hh);c.clip();draw();});}
 function live(x,y,w,t,a=1,options={}){if(a>.001)A.live(x,y,w,t,a,options);}
 function camera(x,y,z,fn){S(()=>{c.translate(960,456);c.scale(z,z);c.translate(-x,-y);fn();});}
 function desk(x,y,w,a=1){line(x,y,x+w,y,a*.65,3);line(x+40,y,x+25,y+160,a*.35,2);line(x+w-40,y,x+w-25,y+160,a*.35,2);}
 function stand(x,y,w,h,a=1){line(x+w*.5,y+h+20,x+w*.5,y+h+85,a*.55,6);line(x+w*.3,y+h+88,x+w*.7,y+h+88,a*.65,2);}
 function paper(key,x,y,w,h,{a=1,tilt=0,crop}={}){alpha(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(tilt);box(-w/2+10,-h/2+12,w,h,'#1a1f23');img(key,-w/2,-h/2,w,h,{crop});box(-w/2,-h/2,w,h,null,'#9fa9b0',1);});}
 function bridge(points,t,a,b){path(points,E(t,a,b),.55,1.5);}
 function title(t){
  const enter=O(t,0,1.1),leave=E(t,5.4,8.8);
  alpha(enter*(1-leave),()=>{words('从知识获取',410,330,97,t,.2);words('到实际劳动',695,550,115,t,1.05);line(420,705,mix(420,1515,E(t,1.2,4.3)),705,.65,1.6);});
  const open=O(t,5.9,8.3);aperture(140,110,1640,735,open,()=>pane('p1-code',140,110,1640,735,{crop:[.22,.17,.77,.80]}),'y');
 }
 function history(t){
 const comparison=E(t,31.3,33.0);
 if(comparison<1){const right=E(t,23.5,24.6);alpha(1-right,()=>{if(!film('v3_factory_hands',100,76,1720,790,Math.min(11.8,t-9.12)))pane('factory',100,76,1720,790,{cover:true});});alpha(right,()=>pane('demo-code',100,76,1720,790));}
 alpha(comparison,()=>{box(0,0,W,H,'#000');if(!film('v3_factory_hands',95,165,815,555,Math.min(11.8,t-9.12)))pane('factory',95,165,815,555,{cover:true});pane('demo-code',1010,165,815,555);line(960,175,960,823,.38);text('运用',502,800,62,'#d3d8da','center');text('决定',1418,800,62,'#f1f1ed','center');});
 }
 function learning(t){
 if(t<61.96){footage('stock_student',100,65,1720,820,Math.min(6.1,t-54),1,'classroom');return;}
 if(t<77.44){const q=E(t,67.3,68.4);alpha(1-q,()=>pane('p1-input',130,72,1660,810));alpha(q,()=>pane('p1-code',130,72,1660,810,{crop:[.215,0,.785,1]}));return;}
 const p=E(t,96,97.2),x=mix(130,95,p),w=mix(1660,1320,p);footage('p1_task_debug',x,65,w,800,Math.min(17.96,t-77.44),1,'p1-error');
 live(1430,260,355,t,p,{framing:'full',mood:'neutral',moodFrom:'concerned',moodAt:95.5,moodDuration:2,lookX:-.55});
 alpha(O(t,100.48,101.5),()=>text('试错 → 修改 → 运行',755,907,43,'#dfe3e3','center'));
 }
 function answer(t){
  const enter=E(t,105.64,107.3),join=E(t,112.84,115.1),conceal=E(t,123.56,129.1);
  if(t<112.84){
   paper('p1-code',mix(-800,150,enter),130,715,620,{a:enter,crop:[.22,.18,.77,.75]});
   paper('p1-report',mix(1960,1080,enter),130,715,620,{a:enter});
   alpha(enter,()=>text('≠',960,438,115,'#d8dfe4','center'));
  }else if(t<138.62){
   const x=mix(150,185,join),y=mix(130,100,join),w=mix(715,1530,join),h=mix(620,760,join);
   pane('p1-report',x,y,w,h,{crop:[.22,0,.78,1]});
   paper('p1-code',mix(1080,1250,join),mix(130,480,join),mix(715,485,join),mix(620,330,join),{a:(1-conceal)*.88,tilt:.015,crop:[.22,.15,.78,.70]});
   line(895,300,895,mix(300,820,conceal),conceal*.6,2);
   live(mix(-650,30,E(t,130.48,132.9)),50,720,t,O(t,130.48,132.9),{framing:'waist',mood:'concerned',lookX:.45});
   bridge([[190,885],[760,885],[760,902],[1730,902]],t,134,138.62);
  }else{
   const reveal=E(t,138.62,142.0),travel=E(t,142.56,150.9);
   camera(mix(960,1780,travel),445,mix(1,.83,travel),()=>{
    pane('p1-report',150,85,1530,760,{a:1-reveal*.6,crop:[.22,0,.78,1]});
    paper('p1-code',mix(1250,1850,reveal),mix(480,80,reveal),mix(485,850,reveal),mix(330,760,reveal),{a:reveal,crop:[.22,.15,.78,.75]});
    bridge([[1680,750],[1760,750],[1760,450],[1850,450]],t,141.1,146.1);
    paper('p1-input',2850,80,980,760,{a:O(t,146,148)});
    bridge([[2700,450],[2780,450],[2780,260],[2850,260]],t,146.6,151.4);
   });
  }
 }
 function labour(t){
 if(t<164.56){footage('p1_task_run',110,60,1700,825,Math.min(21.93,t-151.56),1,'p1-input');return;}
 const p=E(t,164.56,165.7);alpha(1-p,()=>footage('p1_task_run',110,60,1700,825,Math.min(21.93,t-151.56),1,'p1-report'));
 alpha(p,()=>{footage('p1_task_run',90,205,1050,591,Math.min(21.93,t-151.56),1,'p1-report');if(!film('v3_factory_line',1230,205,600,591,Math.max(0,t-164.56),1,{cover:true}))pane('factory',1230,205,600,591,{cover:true});text('脑体对立的基础正在改变',960,100,64,'#f0f1ed','center');});
 }
 function separation(t){
 const reveal=E(t,195.52,196.8);alpha(1-reveal,()=>{pane('factory',90,65,1740,795,{cover:true});box(290,664,1340,140,'#000b');text('不只是装一个AI',960,733,82,'#fff','center');});
 alpha(reveal,()=>{pane('factory',90,155,1150,660,{cover:true});line(1310,170,1310,807,.35);['知识','管理','决策'].forEach((v,i)=>alpha(E(t,200+i*2,201+i*2),()=>text(v,1570,270+i*175,62,'#e4e6e3','center')));alpha(O(t,218.88,220),()=>text('劳动过程与劳动成果',960,905,50,'#cbd2d6','center'));});
 }
 function practice(t){
 if(t<232.1){pane('p1-input',100,65,1320,795);live(1470,230,360,t,1,{framing:'full',mood:'neutral',lookX:-.55});return;}
 if(t<240.76){pane('p1-code',130,65,1660,810,{crop:[.215,0,.785,1]});return;}
 const elapsed=t-240.76,reportTime=elapsed<6.85?elapsed:Math.min(13.93,elapsed+3.5);
 footage('p1_task_report',110,65,1700,815,reportTime,1,'p1-report');
 }
 function intention(t){
 if(t<264.88){pane('p1-report',630,115,1195,690,{crop:[.22,0,.78,1]});live(60,120,540,t,1,{framing:'full',mood:'concerned',lookX:.5});return;}
 if(t<273.28){footage('gpt_review',110,65,1700,820,Math.min(6.93,t-264.88),1,'p1-code');text('GovernLoop-DSH',960,32,32,'#b9c3c8','center');return;}
 pane('p1-report',650,92,1180,690,{crop:[.22,0,.78,1]});live(65,170,510,t,O(t,273.28,274.2),{framing:'full',mood:'smile',moodFrom:'neutral',moodAt:276,moodDuration:2,lookX:.48});
 alpha(O(t,282.48,283.6),()=>{line(650,841,1830,841,.4);text('理解运行  ·  修改结构  ·  决定连接',1240,892,37,'#d0d6d8','center');});
 }
 function distribution(t){
 text('技术创造能力的分布',960,112,74,'#f1f1ed','center');line(100,183,1820,183,.35);
 pane('p1-report',110,275,800,510,{crop:[.22,0,.78,1]});
 alpha(O(t,295.2,296.1),()=>paper('community_asset_reuse',1010,260,800,270));
 alpha(O(t,298.2,299.1),()=>paper('community_workflow',1010,585,800,270));
 }
 window.FullScenes.p1c2={duration:305.18,draw(ctx,time,api){c=ctx;A=api;const t=Math.max(0,Math.min(305.17999,time));S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();box(0,0,W,H,'#000');if(t<9.12)title(t);else if(t<54)history(t);else if(t<105.64)learning(t);else if(t<151.56)answer(t);else if(t<186.56)labour(t);else if(t<224.32)separation(t);else if(t<257.16)practice(t);else if(t<292.88)intention(t);else distribution(t);});}};
})();

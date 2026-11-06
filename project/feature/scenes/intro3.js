(()=>{
 'use strict';
 let c,A;
 const W=1920,H=952,cl=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x,x1=.68,y1=0,x2=.27,y2=1){
  x=cl(x);if(x===0||x===1)return x;
  const v=(q,a,b)=>3*(1-q)**2*q*a+3*(1-q)*q*q*b+q**3;
  let lo=0,hi=1;for(let i=0;i<17;i++){const m=(lo+hi)/2;if(v(m,x1,x2)<x)lo=m;else hi=m;}
  return v((lo+hi)/2,y1,y2);
 }
 const E=(t,a,b)=>bez((t-a)/(b-a),b-a>5?.48:.66,0,b-a>5?.24:.25,1),O=(t,a,b)=>bez((t-a)/(b-a),.18,.65,.30,1);
 function S(fn){c.save();fn();c.restore();}
 function alpha(a,fn){if(a<.001)return;S(()=>{c.globalAlpha*=cl(a);fn();});}
 function box(x,y,w,h,fill=null,stroke=null,lw=1){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h);}}
 function line(x,y,X,Y,a=.65,lw=1,col='#ddd'){alpha(a,()=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();});}
 function path(points,p=1,a=.65,lw=1.5,col='#ddd'){
  const lengths=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));
  let left=lengths.reduce((s,q)=>s+q,0)*cl(p);
  lengths.forEach((len,i)=>{const k=cl(left/Math.max(.001,len));if(k>0)line(...points[i],mix(points[i][0],points[i+1][0],k),mix(points[i][1],points[i+1][1],k),a,lw,col);left-=len;});
 }
 function dot(x,y,r=3,a=1,col='#ddd'){alpha(a,()=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();});}
 function text(s,x,y,n=52,col='#eee',align='left',face='"SimSun",serif'){
  c.fillStyle=col;c.font=n+'px '+face;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);
 }
 function glyphs(s,x,y,n,t,at,{gap=0,col='#eee',rise=34,delay=.055,spread=0}={}){
  [...s].forEach((ch,i)=>{const k=O(t,at+i*delay,at+i*delay+.72);alpha(k,()=>{c.beginPath();c.rect(x+i*(n+gap)-5,y-n*.65,n+15,n*1.35);c.clip();text(ch,x+i*(n+gap)+spread*(1-k),y+rise*(1-k),n,col);});});
 }
 function image(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false,rotation=0}={}){
  const im=A.assets?.[key];if(!im?.width||a<.001)return false;
  S(()=>{c.globalAlpha*=a;c.translate(x+w/2,y+h/2);c.rotate(rotation);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();
   const [u,v,U,V]=crop,sx=u*im.width,sy=v*im.height,sw=U*im.width,sh=V*im.height,k=(cover?Math.max:Math.min)(w/sw,h/sh);
   c.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k);
  });return true;
 }
 function live(x,y,w,t,options={},a=1){if(a>.001)A.live(x,y,w,t,a,options);}
 function video(key,x,y,w,h,local,options={}){
  if((options.alpha??1)<.001||!A.hasVideo(key))return false;
  return A.video(key,x,y,w,h,Math.max(0,local),options);
 }
 function aperture(x,y,w,h,p,draw,{axis='y',border=0}={}){
  if(p<.001)return;
  const rw=axis==='x'?Math.max(1,w*p):w,rh=axis==='y'?Math.max(1,h*p):h,xx=x+(w-rw)/2,yy=y+(h-rh)/2;
  S(()=>{c.beginPath();c.rect(xx,yy,rw,rh);c.clip();draw();});
  alpha(border,()=>{box(xx-8,yy-8,rw+16,rh+16,null,'#bbb',1.3);});
 }
 function screenFrame(x,y,w,h,a=1){alpha(a*.55,()=>{box(x-10,y-10,w+20,h+20,null,'#aaa',1.2);});}

 function desk(x,y,w,a=1){alpha(a,()=>{line(x,y,x+w,y,.75,3);line(x+28,y,x+15,y+190,.5,2);line(x+w-28,y,x+w-15,y+190,.5,2);line(x+15,y+145,x+w-15,y+145,.2,1);});}
 function stand(x,y,w,h,a=1){alpha(a,()=>{line(x+w*.5,y+h+25,x+w*.5,y+h+90,.65,6);line(x+w*.29,y+h+92,x+w*.71,y+h+92,.7,2.5);});}
 function camera(x,y,z,fn){S(()=>{c.translate(960,456);c.scale(z,z);c.translate(-x,-y);fn();});}
 function paper(x,y,w,h,{a=1,rotation=0,key=null,marks=true}={}){
  alpha(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rotation);box(-w/2+13,-h/2+16,w,h,'#1b1b1b');
   if(key){image(key,-w/2,-h/2,w,h,{cover:true});box(-w/2,-h/2,w,h,null,'#aaa',1);}
   else {box(-w/2,-h/2,w,h,'#111','#c4c4c4',1.4);if(marks){for(let i=0;i<Math.floor((h-75)/29);i++)line(-w/2+26,-h/2+42+i*29,w/2-28-(i%4)*18,-h/2+42+i*29,.28,1);}}
  });
 }
 function keyboard(x,y,w=520){path([[x,y+48],[x+62,y],[x+w-62,y],[x+w,y+48],[x,y+48]],1,.7,1.4);for(let row=0;row<3;row++)for(let col=0;col<11;col++){const xx=x+72+col*(w-144)/11;line(xx,y+11+row*11,xx+18,y+11+row*11,.35,1.1);}}
 function cable(t,start){path([[660,820],[960,820],[960,740],[1430,740],[1430,790]],E(t,start,start+1.5),.5,1.7);}

 // One official page becomes a desktop object; the second source is the real architecture.
 function official(t){
  if(t<8.9){
   const pull=E(t,2.35,4.7),x=mix(220,735,pull),y=mix(66,124,pull),w=mix(1480,1080,pull),h=mix(776,655,pull);
   line(90,880,1830,880,.23,1.2);
   aperture(x,y,w,h,O(t,0,.85),()=>image('qqtutorial',x,y,w,h,{crop:[.11,.02,.76,.96]}));
   screenFrame(x,y,w,h);stand(x,y,w,h,pull);desk(565,892,1260,pull);
   live(mix(-110,65,pull),85,620,t,{framing:'full',mood:'neutral',lookX:.48},O(t,2.4,3.6));
  }else if(t<14.46){
   const reveal=O(t,8.9,9.65),push=E(t,10.6,12.4),x=mix(435,245,push),y=mix(145,105,push),w=mix(1290,1500,push),h=mix(610,720,push);
   line(90,880,1830,880,.23,1.2);
   aperture(x,y,w,h,reveal,()=>image('architecture',x,y,w,h,{crop:[.015,.06,.97,.90]}));screenFrame(x,y,w,h);stand(x,y,w,h,1-push);
   live(mix(40,-840,E(t,8.9,9.75)),20,760,t,{framing:'full',mood:'neutral',lookX:.45},1-E(t,8.95,9.65));
   path([[x+w,y+h],[1830,y+h],[1830,880]],E(t,12.3,14.4),.65,1.5);
  }else{
   const settle=E(t,14.46,16.1),x=mix(245,230,settle),y=mix(105,255,settle),w=mix(1500,1020,settle),h=mix(720,570,settle);
   live(mix(1480,1350,settle),180,480,t,{framing:'full',mood:t<17?'neutral':'concerned',moodFrom:'neutral',moodAt:16.8,moodDuration:1.1,lookX:-.48},O(t,14.46,15.4));
   aperture(x,y,w,h,1,()=>image('native',x,y,w,h,{crop:[.04,.03,.92,.92]}));screenFrame(x,y,w,h);stand(x,y,w,h);desk(170,930,1250);
   path([[1250,825],[1450,825],[1450,750]],E(t,17.6,19.5),.55,1.5);
  }
 }

 // The logical passage distinguishes generating content from controlling its presentation.
 function arrow(x,y,X,Y,p=1,a=.7){
  path([[x,y],[X,Y]],p,a,1.8);if(p>.995){const q=Math.atan2(Y-y,X-x);line(X,Y,X-13*Math.cos(q-.45),Y-13*Math.sin(q-.45),a,1.8);line(X,Y,X-13*Math.cos(q+.45),Y-13*Math.sin(q+.45),a,1.8);}
 }
 function contentCard(x,y,w,h,{title='',lines=[],light=false,a=1,rotation=0,titleSize=42,bodySize=35}={}){
  alpha(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rotation);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();box(-w/2,-h/2,w,h,light?'#eceeec':'#11161a',light?'#bbb':'#8c9aa4',1.3);
   const col=light?'#171b1e':'#e8eced',xx=-w/2+32,top=-h/2+48;text(title,xx,top,titleSize,col);line(xx,top+38,w/2-30,top+38,.35,1,col);
   const gap=Math.min(70,(h-145)/Math.max(1,lines.length));lines.forEach((v,i)=>text(v,xx,top+105+i*gap,bodySize,col));
  });
 }
 // Original screenshot pixels remain untouched; the camera selects a readable excerpt.
 function evidenceCrop(key,region,x,y,w,{a=1,reveal=1,edge=true}={}){
  const im=A.assets?.[key];if(!im?.width||a<.001||reveal<.001)return;
  const [sx,sy,sw,sh]=region,h=w*sh/sw;
  alpha(a,()=>{
   c.beginPath();c.rect(x,y,w*cl(reveal),h);c.clip();
   c.shadowColor='#0009';c.shadowBlur=32;c.shadowOffsetY=12;
   c.fillStyle='#101112';c.fillRect(x,y,w,h);c.shadowColor='transparent';
   c.drawImage(im,sx,sy,sw,sh,x,y,w,h);
   if(edge)box(x,y,w,h,null,'#7f858644',1);
  });
 }
 function voiceSpace(t){
  const enter=O(t,19.7,20.75),gather=E(t,26.3,28.25),reply=O(t,22.5,23.65);
  // The model occupies the same space as the conversation, then the lower reply passes in front.
  live(mix(1260,1280,gather),mix(180,385,gather),mix(600,500,gather),t,
   {framing:'full',mood:'concerned',lookX:-.46},enter);
  evidenceCrop('evidence-dual-replies',[20,1990,1035,650],
   mix(95,90,gather),mix(82,64,gather),mix(1010,730,gather),{a:enter*mix(mix(1,.35,reply),.20,gather),reveal:enter});
  evidenceCrop('evidence-dual-replies',[20,3930,1000,285],
   mix(825,910,gather),mix(594,95,gather),mix(990,875,gather),{a:reply*mix(1,.45,gather),reveal:reply});
  const setup=O(t,26.5,27.7);
  evidenceCrop('evidence-dual-replies',[20,890,1000,330],
   mix(280,170,setup),mix(980,584,setup),1090,{a:setup,reveal:setup});
 }
 function expression(t){
  const enter=E(t,31.76,33.2),detail=E(t,36.56,37.95);
  if(enter<.999)S(()=>{c.translate(-1180*enter,0);alpha(1-enter,()=>voiceSpace(31.759));});
  // Both excerpts retain the QQ users and their wording. No simulated answer is substituted.
  evidenceCrop('evidence-group-discussion',[20,325,1000,500],
   mix(1960,mix(165,95,detail),enter),mix(105,62,detail),mix(1330,1010,detail),{a:enter*mix(1,.28,detail)});
  evidenceCrop('evidence-group-discussion',[20,4640,1000,460],
   mix(1940,775,detail),mix(500,445,detail),1060,{a:detail});
 }
 function knowledge(t){
  const enter=E(t,40.14,41.65),question=O(t,42.1,43.35);
  if(enter<.999)S(()=>{c.translate(0,-1000*enter);alpha(1-enter,()=>expression(40.139));});
  evidenceCrop('evidence-group-discussion',[20,6320,1000,900],
   95,mix(990,105,enter),820,{a:enter*mix(1,.38,question)});
  // A community member's question stays visibly a community member's question.
  evidenceCrop('evidence-group-discussion',[20,7930,1000,560],
   mix(1180,995,question),mix(365,288,question),850,{a:question,reveal:question});
 }
 function creatorMaterial(x,y,w,h,a=1){
  alpha(a,()=>{
   box(x,y,w,h,'#07090b');
   image('community_codex_port',x+18,y+10,w-36,h*.54,{cover:false});
   image('community_diy_control',x+18,y+h*.59,w-36,h*.36,{cover:false});
  });
 }

 function creator(t){
  const pull=E(t,49.1,51.8);
  camera(960,456,1,()=>{
   live(30,85,540,t,{framing:'full',mood:'concerned',lookX:.50},O(t,49.3,50.5));
   const x=650,y=80,w=1170,h=760;
   aperture(x,y,w,h,O(t,46.76,47.7),()=>creatorMaterial(x,y,w,h));
   screenFrame(x,y,w,h);stand(x,y,w,h,pull);desk(600,940,1250,pull);
  });
 }

 function questions(t){
  const pull=E(t,54.06,55.55),x=mix(650,1380,pull),y=mix(80,118,pull),w=mix(1170,440,pull),h=mix(760,250,pull);
  alpha(mix(1,.24,pull),()=>{creatorMaterial(x,y,w,h);screenFrame(x,y,w,h);alpha(1-pull,()=>{stand(x,y,w,h);desk(600,940,1250);});});
  live(mix(30,310,pull),mix(85,-20,pull),mix(540,1060,pull),t,{framing:'close',framingFrom:'full',framingAt:54.06,framingDuration:1.5,mood:'firm',moodFrom:'concerned',moodAt:54.06,moodDuration:1.15,lookX:0,gesture:{type:'shake',at:54.35,duration:2.7,amount:.25}});
  alpha(O(t,54.8,55.6)*(1-E(t,57,57.6)),()=>text('沉默？',245,665,76,'#ddd'));
  path([[185,812],[570,812],[570,872],[1740,872]],E(t,58.64,61.7),.35*(1-E(t,61.7,62.34)),1.3);
 }

 function slogan(t){
  const pull=E(t,62.34,64.25),x=mix(310,40,pull),w=mix(1060,650,pull),leave=1-E(t,68.25,69.14);
  alpha(mix(.24,.12,pull)*leave,()=>{creatorMaterial(1380,118,440,250);screenFrame(1380,118,440,250);});
  live(x,mix(-20,85,pull),w,t,{framing:'full',framingFrom:'close',framingAt:62.34,framingDuration:1.95,mood:'firm',lookX:mix(0,.18,pull)},leave);
  const titleIn=O(t,64.6,65.6);
  alpha(titleIn*leave,()=>{c.shadowColor='#000';c.shadowBlur=25;glyphs('不能失去',835,340,129,t,64.6,{rise:32,delay:.065});glyphs('大肥鱼',865,570,218,t,65.10,{rise:42,delay:.075});});
  path([[825,738],[1730,738],[1730,70],[185,70]],E(t,67.6,69.14),.60*leave,1.6);
 }
 function commune(t){
  const open=O(t,69.14,69.7),leave=1-E(t,71.65,72.2);
  aperture(190,60,1540,815,open*leave,()=>image('commune',190,60,1540,815,{cover:false,crop:[.025,.045,.95,.88]}),{axis:'x'});
  line(190,890,1730,890,.35*leave,1.3);
 }

 function creations(t){
  let cx=480,cy=330,z=1.48;
  if(t>=75.96&&t<80.6){const p=E(t,75.96,80.6);cx=mix(480,1100,p);z=mix(1.48,.86,p);cy=mix(330,350,p);}
  else if(t>=80.6&&t<85.6){cx=1100;cy=350;z=.86;}
  else if(t>=85.6){const p=E(t,85.6,88.1);cx=mix(1100,2760,p);cy=mix(350,360,p);z=mix(.86,1.12,p);}
  // The questions stay in their independent foreground layer. These are only
  // source-scene-time emphasis changes to the actual workstation contents.
  const firstQuestion=E(t,78.2,78.9),secondQuestion=E(t,82.2,82.9),thirdQuestion=E(t,88.3,89.0);
  const firstLight=mix(mix(1,.64,firstQuestion),.22,secondQuestion);
  const secondLight=mix(mix(1,.64,secondQuestion),.22,thirdQuestion);
  const thirdLight=mix(1,.64,thirdQuestion);
  camera(cx,cy,z,()=>{
   const plot='data_sql',plotT=Math.min(6.15,t-72.2);
   const rawCrop=plot==='ui_real_model'?[40/1280,118/720,890/1280,552/720]:undefined;
   alpha(firstLight,()=>{
    aperture(0,0,960,596,O(t,72.2,73.2),()=>{if(!video(plot,0,0,960,596,plotT,{cover:false,crop:rawCrop}))image('demo-after',0,0,960,596);});
    screenFrame(0,0,960,596);stand(0,0,960,596,O(t,75.96,77.4));desk(-80,725,1130,O(t,76.1,77.6));
   });
   path([[960,540],[1090,540],[1090,640],[1240,640],[1240,520]],E(t,78.2,80.6),.26,1.4);
   if(t>=80.6){
    const u=O(t,80.6,81.6);
    alpha(secondLight,()=>{
     aperture(1240,90,900,506,u,()=>video('v9_whale_tasks',1240,90,900,506,Math.min(8.95,t-80.6),{cover:false}));
     screenFrame(1240,90,900,506,u);stand(1240,90,900,506,u);desk(1160,725,1080,u);
    });
   }
   path([[2140,520],[2260,520],[2260,650],[2490,650],[2490,600]],E(t,83.7,85.7),.24,1.4);
   if(t>=85.6){
    const u=O(t,85.6,86.65),close=E(t,91.6,93.6),x=2390,y=0,w=1200,h=675;
    alpha(thirdLight,()=>{
     aperture(x,y,w,h,u*(1-close),()=>image('v9_loss_notice',x,y,w,h,{cover:false}),{axis:'x'});
     alpha(1-close,()=>{screenFrame(x,y,w,h);stand(x,y,w,h);});desk(2290,810,1420,u);
    });
    live(1990,55,730,t,{framing:'full',mood:t<91.6?'neutral':'concerned',moodFrom:'neutral',moodAt:91.6,moodDuration:1.1,lookX:.5},O(t,87.1,88.2));
    // The original foreground paper still occludes the lower body naturally.
    paper(2220,690,340,220,{a:u*mix(1,.38,thirdQuestion),rotation:-.025,key:'v9_loss_notice',marks:false});
    line(2990,0,2990,675,close*.35,1.4);
   }
  });
 }
 function manuscripts(t){
  const pull=E(t,96.2,98.5),share=E(t,101.3,103.5),x=mix(mix(805,1110,pull),1170,share),y=mix(mix(-65,115,pull),75,share),w=mix(mix(810,565,pull),420,share),h=w*1.415,arrive=E(t,93.82,94.62);
  live(mix(97.6,30,arrive),mix(114.4,20,arrive),mix(817.6,760,arrive),t,{framing:'full',mood:'smile',moodFrom:'concerned',moodAt:96.8,moodDuration:1.2,lookX:.45});
  alpha(1-E(t,103.6,104.42),()=>{
   const fan=E(t,97.4,99.2);
   paper(x+125*fan,y+90*fan,520*(1-.25*share),736*(1-.25*share),{a:fan*(1-.35*share),rotation:.10*fan,key:'manuscript3'});
   paper(x+58*fan,y+40*fan,545*(1-.25*share),771*(1-.25*share),{a:fan*(1-.25*share),rotation:.045*fan,key:'manuscript2'});
   aperture(x,y,w,h,O(t,93.82,94.8),()=>paper(x,y,w,h,{rotation:mix(0,-.018,pull),key:'manuscript'}),{axis:'x',border:.25});
   path([[x,y+h],[x,883],[1785,883]],E(t,98.1,100.8),.3,1.3);
   alpha(O(t,97.75,98.8),()=>{box(1025,720,800,172,'#050607e8');text('分享 · 下载 · 转载',1425,765,47,'#e5e9eb','center');});
   alpha(O(t,101.35,102.4),()=>text('欢迎自由转载',1425,842,54,'#f0f0f0','center'));
  });
 }

 function ending(t){
  const settle=E(t,104.42,105.7);
  live(30,20,760,t,{framing:'full',mood:'smile',lookX:.28,gesture:{type:'nod',at:106.0,duration:1.8,amount:.3}});
  alpha(O(t,104.6,105.6),()=>{text('往左堂',1260,380,137,'#eee','center');text('official',1260,515,58,'#ccc','center','Georgia,serif');});
  const q=E(t,104.42,106.2);line(mix(825,1090,q),666,mix(1795,1430,q),666,.7,1.7);
 }

 window.FullScenes.intro3={duration:108.94,draw(ctx,time,api){
  c=ctx;A=api;const t=Math.max(0,Math.min(108.93999,time));
  S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();box(0,0,W,H,'#000');
   if(t<19.7)official(t);
   else if(t<31.76)voiceSpace(t);
   else if(t<40.14)expression(t);
   else if(t<46.76)knowledge(t);
   else if(t<54.06)creator(t);
   else if(t<62.34)questions(t);
   else if(t<69.14)slogan(t);
   else if(t<72.2)commune(t);
   else if(t<93.82)creations(t);
   else if(t<104.42)manuscripts(t);
   else ending(t);
  });
 }};
})();


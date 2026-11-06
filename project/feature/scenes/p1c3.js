(()=>{
 'use strict';let c,A;const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x,x1=.66,y1=0,x2=.25,y2=1){x=cl(x);if(x===0||x===1)return x;let a=0,b=1;const f=(t,p,q)=>3*(1-t)**2*t*p+3*(1-t)*t*t*q+t**3;for(let i=0;i<17;i++){const m=(a+b)/2;f(m,x1,x2)<x?a=m:b=m;}return f((a+b)/2,y1,y2)}
 const E=(t,a,b)=>bez((t-a)/(b-a),b-a>5?.48:.66,0,b-a>5?.24:.25,1),O=(t,a,b)=>bez((t-a)/(b-a),.18,.65,.3,1);
 const S=f=>{c.save();f();c.restore()},alpha=(a,f)=>{if(a>.001)S(()=>{c.globalAlpha*=cl(a);f()})};
 function bg(col='#050607'){c.fillStyle=col;c.fillRect(0,0,W,H)}
 function rect(x,y,w,h,fill=null,stroke=null,lw=1){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h)}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h)}}
 function line(x,y,X,Y,a=.6,w=1,col='#ddd'){alpha(a,()=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()})}
 function path(points,p=1,a=.6,w=1,col='#ddd'){const ls=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let left=ls.reduce((v,n)=>v+n,0)*cl(p);ls.forEach((l,i)=>{let q=cl(left/Math.max(1,l));if(q>0)line(...points[i],mix(points[i][0],points[i+1][0],q),mix(points[i][1],points[i+1][1],q),a,w,col);left-=l})}
 function dot(x,y,r=4,a=1,col='#eee'){alpha(a,()=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill()})}
 function text(s,x,y,n=48,col='#eee',align='left',face='"SimSun",serif'){c.fillStyle=col;c.font=(n>=64?'700 ':'400 ')+n+'px '+face;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
 function image(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false,rot=0}={}){const im=A.assets[key];if(!im?.width)return false;S(()=>{c.globalAlpha*=a;c.translate(x+w/2,y+h/2);c.rotate(rot);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();const[sx,sy,sw,sh]=[crop[0]*im.width,crop[1]*im.height,crop[2]*im.width,crop[3]*im.height],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k)});return true}
 function video(key,x,y,w,h,t,o={}){return A.hasVideo(key)&&A.video(key,x,y,w,h,Math.max(0,t),o)}
 function live(x,y,w,t,o={},a=1){if(a>.001)A.live(x,y,w,t,a,o)}
 function camera(x,y,z,fn){S(()=>{c.translate(960,456);c.scale(z,z);c.translate(-x,-y);fn()})}
 function reveal(x,y,w,h,p,fn,axis='x'){if(p<.001)return;S(()=>{c.beginPath();c.rect(x,y,axis==='x'?w*p:w,axis==='y'?h*p:h);c.clip();fn()})}
 function panel(x,y,w,h,fn,{a=1,edge='#7b858a',rot=0}={}){alpha(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rot);rect(-w/2-8,-h/2-8,w+16,h+16,'#111416',edge,1.3);c.translate(-x-w/2,-y-h/2);fn()})}
 function photo(key,x,y,w,h,o={}){panel(x,y,w,h,()=>image(key,x,y,w,h,o),o)}
 function desk(x,y,w,a=1){line(x,y,x+w,y,a*.7,2.6);line(x+28,y,x+15,y+155,a*.4,1.4);line(x+w-28,y,x+w-15,y+155,a*.4,1.4)}
 function screen(key,x,y,w,h,t,{a=1,fallback='e04',cover=true,crop}={}){panel(x,y,w,h,()=>{if(!video(key,x,y,w,h,t,{cover,crop}))image(fallback,x,y,w,h,{cover,crop})},{a});}
 function cable(x,y,X,Y,t,a,b,col='#ddd'){path([[x,y],[mix(x,X,.48),y],[mix(x,X,.48),Y],[X,Y]],E(t,a,b),.55,1.5,col)}
 function codeSheet(x,y,w,h,{a=1,light=false}={}){alpha(a,()=>{rect(x,y,w,h,light?'#eeeae1':'#0d141b',light?'#888':'#4b606d');const col=light?'#23333e':'#b7d1df',n=25;['function points() {','  const [a, f, p] = vals();','  return Array.from({length:361}, (_, i) => {','    const x = i / 360 * Math.PI * 4;','    return [x, a * Math.sin(f * x + p)];','  });','}'].forEach((s,i)=>text(s,x+28,y+48+i*44,n,col,'left','Consolas,monospace'));line(x+25,y+380,x+w-25,y+380,.4,1,col);text('x, y',x+30,y+420,27,col,'left','Consolas,monospace');for(let i=0;i<Math.min(5,Math.floor((h-470)/33));i++){const X=i*Math.PI/90,Y=1.8*Math.sin(2*X+1.57);text(X.toFixed(5)+', '+Y.toFixed(5),x+30,y+463+i*33,24,col,'left','Consolas,monospace')}})}
 function model(x,y,s,t){S(()=>{c.translate(x,y);c.scale(s,s);const grow=E(t,6.3,15.7);for(let j=0;j<5;j++){const dx=j*38,dy=-j*29;rect(-250+dx,-185+dy,500,370,'#080d10','#536470');for(let i=0;i<6;i++)line(-210+dx,-120+dy+i*48,150+dx+80*grow,-120+dy+i*48,.25,1);dot(215+dx,140+dy,4,.75)}path([[245,-180],[465,-345],[465,230]],grow,.65,1.6)})}

 function heading(t){photo('chain-result',90,180,650,560,{a:.82});alpha(O(t,.2,1.15),()=>text('从创造能力',1260,340,80,'#c1c7c9','center'));alpha(O(t,1.15,2.2),()=>text('到思想觉醒',1260,510,96,'#f1f1ed','center'));line(860,675,mix(860,1740,E(t,2.2,3.5)),675,.4,1.2);}
 function concentrated(t){
  const pull=E(t,10.7,18.7),outer=E(t,20.7,25.7),edge=E(t,14.3,18.7);
  const w=mix(H*16/9,1200,pull),h=w*9/16,x=mix((W-H*16/9)/2,110,pull),y=mix(0,105,pull);
  // The real stage keeps moving as it becomes one window in the wider space.
  video('v3_dario_keynote',x,y,w,h,Math.max(0,Math.min(21.96,t-6.3)),{cover:false,alpha:O(t,6.3,6.85)});
  alpha(edge,()=>{rect(x-7,y-7,w+14,h+14,null,'#596468',1.3);text('Code with Claude · 2025',110,832,32,'#bfc8cd','left','"Microsoft YaHei",sans-serif')});
  line(110,888,mix(110,1835,outer),888,outer*.42,1.4);
  line(1343,160,1343,mix(160,858,outer),outer*.40,1.4);
  line(1321,442,1343,442,outer*.56,1.5);
  live(mix(1950,1360,outer),195,520,t,{framing:'full',mood:'concerned',moodFrom:'neutral',moodAt:21,moodDuration:2,lookX:-.55},outer);
 }
 function distributed(t){
 if(t<35.9){screen('c3_course',90,65,1430,800,Math.max(0,t-26.7),{fallback:'demo-site',cover:false});live(1550,350,290,t,{framing:'full',mood:'smile',lookX:-.55},O(t,28,28.8));return;}
 photo('community_multitask',160,155,1600,650,{a:O(t,35.9,36.7)});
 }
 const roleX=[0,1320,2640,3960,5280];
 function roleWorld(t){
  for(let i=0;i<5;i++){const x=roleX[i],y=100;desk(x-70,760,1230);if(i===0)screen('c3_factory',x,y,1100,619,t-44.26,{fallback:'factory'});else if(i===1)photo('farm',x,y,1100,619,{cover:true});else if(i===2)screen('c3_teacher',x,y,1100,619,t-49.7,{fallback:'classroom'});else if(i===3)screen('c3_lab',x,y,1100,619,t-53.06,{fallback:'demo-code'});else photo('demo-after',x,y,1100,619,{cover:false});
   if(i===2)photo('chain-result',x+810,y+430,360,240,{rot:.01});if(i===4)photo('p1-output',x+750,y+425,420,280,{rot:-.01});
  }
 }
 function daily(t){
 const names=['生产流程','农业信息','课程工具','技术实验','实践参与'];const starts=[44.2,47.9,51.6,55.3,59.0],i=t<47.9?0:t<51.6?1:t<55.3?2:t<59?3:4;
 if(i===0)screen('c3_factory',100,65,1720,760,t-starts[i],{fallback:'factory',cover:false});
 else if(i===1)photo('farm',100,65,1720,760,{cover:true});
 else if(i===2)screen('c3_teacher',100,65,1720,760,t-starts[i],{fallback:'classroom',cover:false});
 else if(i===3)screen('c3_lab',100,65,1720,760,t-starts[i],{fallback:'demo-code',cover:false});
 else photo('demo-after',100,65,1720,760);
 text(names[i],960,895,45,'#d3d8d8','center');
 }
 function sharing(t){
 const p=O(t,63.56,64.3);photo('chain-source',70,165,550,635,{a:p});
 photo('chain-derived',685,165,550,635,{a:O(t,65.5,66.25)});
 photo('chain-modified',1300,165,550,635,{a:O(t,68.2,68.95)});
 cable(626,470,677,470,t,65.5,66.25);cable(1240,470,1292,470,t,68.2,68.95);
 }
 const networkKeys=['community_multitask','community_study_tasks','starter_running','bili_pond_memory','deepharness_overview','coopanion_inbox','notifier_cost','pet_states'];
 function graph(t,{z=.58,cx=1900,cy=600}={}){camera(cx,cy,z,()=>{
  const nodes=[[240,20],[1380,20],[2520,20],[3660,20],[240,960],[1380,960],[2520,960],[3660,960]];
  nodes.forEach(([x,y],i)=>{photo(networkKeys[i],x,y,820,520);desk(x-35,y+590,890);if(i<4)cable(x+410,y+610,x+410,y+950,t,78.9+i*.3,83.7+i*.3);if(i%4!==3)cable(x+830,y+260,x+1135,y+260,t,75.5+i*.2,81.8+i*.2)});
  line(650,-310,650,-30,.6,1.5);text('创造',650,-410,87,'#eee','center');
 })}
 function diffusion(t){
 if(t<80.6){photo('community_multitask',150,120,1620,700);return;}
 if(t<86.3){photo('community_study_tasks',150,120,1620,700);return;}
 text('横向扩散',960,105,68,'#f1f1ed','center');
 ['community_multitask','community_study_tasks','community_diy_control','community_codex_port'].forEach((key,i)=>photo(key,100+i%2*910,235+Math.floor(i/2)*340,810,290));
 }
 function ability(t){
 const p=E(t,103.2,104.3);photo('community_multitask',140,130,1640,650);
 alpha(p,()=>{rect(0,0,W,H,'#050607');text('能力，掌握在谁手里？',960,440,92,'#f1f1ed','center');line(350,600,1570,600,.4,1.4);});
 }
 function needs(t){
 if(t<125.38){photo('community_study_tasks',130,135,1660,670);return;}
 const p=E(t,125.38,126.5);alpha(1-p,()=>photo('community_study_tasks',130,135,1660,670));
 alpha(p,()=>{rect(0,0,W,H,'#050607');photo('p1-report',90,140,1120,650);live(1310,180,500,t,{framing:'full',mood:'smile',lookX:-.45},O(t,129,130));});
 }
 function social(t){screen('c3_course',90,65,1400,785,Math.max(0,t-137.46),{fallback:'demo-site',cover:false});live(1540,350,300,t,{framing:'full',mood:'firm',lookX:-.6},O(t,140.9,141.7));alpha(O(t,152.2,153.1),()=>text('亲手改变',960,906,48,'#d4d9da','center'));}
 function awakening(t){live(130,35,650,t,{framing:'waist',mood:'firm',lookX:.18},O(t,154.58,155.4));alpha(O(t,155.1,156),()=>text('我也能创造',1290,430,90,'#f1f1ed','center'));line(970,590,mix(970,1690,E(t,157,158.1)),590,.4,1.4);}
 function contradiction(t){
 if(t<170.06){photo('chain-modified',100,95,800,745);photo('community_multitask',1010,170,810,585);return;}
 if(t<173.26){photo('evidence-takedown',130,70,1660,810,{a:O(t,170.06,170.7)});return;}
 screen('stock_keyboard',90,110,1310,737,Math.max(0,t-173.26),{fallback:'demo-code',cover:false});live(1470,235,360,t,{framing:'full',mood:'concerned',lookX:-.5});
 }
 function relations(t){photo('evidence-takedown',80,100,1300,730);live(1450,130,380,t,{framing:'full',mood:'concerned',lookX:-.5},O(t,182.18,182.9));alpha(O(t,188.2,189.1),()=>text('谁决定创造的边界？',960,910,51,'#e5e8e6','center'));}
 function control(t){if(t<202.66){screen('c3_course',100,65,1720,820,Math.max(0,t-194.18),{fallback:'demo-site',cover:false});return;}codeSheet(90,100,820,745);screen('c3_course',1010,150,820,590,Math.max(0,t-194.18),{fallback:'demo-site',cover:false});}
 function decisions(t){codeSheet(90,85,820,770);screen('c3_course',1010,110,820,500,Math.min(10.43,(t-219.28)*1.7),{fallback:'demo-site',cover:false});alpha(O(t,222.73,223.5),()=>{rect(1010,655,820,235,'#eeeee8','#a1aaad');text('函数曲线.csv',1045,690,30,'#23333e');for(let i=0;i<3;i++){const X=i*Math.PI/90,Y=1.8*Math.sin(2*X+1.57);text(X.toFixed(5)+', '+Y.toFixed(5),1045,745+i*42,25,'#23333e','left','Consolas,monospace')}});}
 function ending(t){const p=E(t,226.66,227.6);alpha(1-p,()=>decisions(226.65));alpha(p,()=>{rect(0,0,W,H,'#050607');live(100,75,620,t,{framing:'full',mood:'smile',lookX:.35});text('在亲自创造的实践中',1270,355,65,'#bcc6ca','center');text('获得现实基础',1270,520,85,'#f1f1ed','center');});}
 window.FullScenes.p1c3={duration:238.08,draw(ctx,t,api){c=ctx;A=api;t=Math.max(0,Math.min(238.0799,t));S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();bg();if(t<6.3)heading(t);else if(t<26.7)concentrated(t);else if(t<44.2)distributed(t);else if(t<63.56)daily(t);else if(t<73.56)sharing(t);else if(t<95.56)diffusion(t);else if(t<114.02)ability(t);else if(t<137.46)needs(t);else if(t<154.58)social(t);else if(t<161.54)awakening(t);else if(t<182.18)contradiction(t);else if(t<194.18)relations(t);else if(t<219.28)control(t);else if(t<226.66)decisions(t);else ending(t)})}};
})();

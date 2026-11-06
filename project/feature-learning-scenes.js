(()=>{
 'use strict';
 const cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 const ease=x=>{x=cl(x);return x*x*(3-2*x)};
 const E=(t,a,b)=>ease((t-a)/(b-a));
 let c;
 function save(fn){c.save();fn();c.restore()}
 function fade(a,fn){if(a>.001)save(()=>{c.globalAlpha*=cl(a);fn()})}
 function text(s,x,y,n=48,color='#eee',align='left'){c.font=n+'px "SimSun",serif';c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
 function line(x,y,X,Y,p=1,color='#9caaaf',w=2){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(mix(x,X,cl(p)),mix(y,Y,cl(p)));c.stroke()}
 function path(points,p=1,color='#e8edee',w=3){const lens=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let rem=lens.reduce((a,b)=>a+b,0)*cl(p);lens.forEach((len,i)=>{const q=cl(rem/len);if(q>0)line(...points[i],...points[i+1],q,color,w);rem-=len})}
 function circle(x,y,r,color='#eee',fill=false){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=color;c.fill()}else{c.strokeStyle=color;c.lineWidth=2.5;c.stroke()}}
 function movie(A,key,x,y,w,h,t,o={}){A.video(key,x,y,w,h,Math.max(0,t),{cover:false,...o})}
 function tag(s,x,y){text(s,x,y,32,'#c4ced2')}
 function arrow(x,y,X,Y,p){line(x,y,X,Y,p,'#aebfc7',2.5);if(p>.99){const a=Math.atan2(Y-y,X-x);line(X,Y,X-14*Math.cos(a-.48),Y-14*Math.sin(a-.48));line(X,Y,X-14*Math.cos(a+.48),Y-14*Math.sin(a+.48))}}
 function practice(t,A){
  if(t<228.9035||t>=239.952042)return false;
  c.fillStyle='#000';c.fillRect(0,0,1920,952);
  const p=E(t,228.9035,231.6),q=E(t,233.54,234.8);
  fade(p,()=>{
   fade(1-q,()=>{text('全部社会生活',100,190,72,'#bec7cc');text('在本质上是实践的。',100,290,72,'#edf0ef');tag('马克思 ·《关于费尔巴哈的提纲》',104,393)});
   fade(q,()=>{text('生活、实践的观点，',100,163,59,'#bdc6cc');text('应该是认识论的',100,250,59);text('首要的和基本的观点。',100,337,59);tag('列宁 ·《唯物主义和经验批判主义》',104,434)});
  });
  movie(A,'v3_china_workers',mix(100,900,p),mix(0,70,p),mix(1720,920,p),mix(912,517.5,p),t-215.9035);
  fade(p,()=>{line(900,611,1820,611);tag('共和国建设者',900,650)});
  const r=E(t,232,233.5);
  fade(r,()=>{movie(A,'v4_china_modern_line',100,mix(590,531,r),680,382.5,12+Math.max(0,t-232));line(100,928,780,928,r,'#758087',1);tag('劳动实践 · 当代工厂',100,920)});
  return true;
 }
 function workers(t,A){
  if(t<22.457958||t>=34.217958)return false;
  c.fillStyle='#000';c.fillRect(0,0,1920,952);
  const a=t-22.457958,p=E(a,0,1.25),q=E(a,.35,1.8);
  fade(p,()=>{text('技术之外',96,116,54);line(96,166,1824,166,p,'#38434a',1.5)});
  save(()=>{c.beginPath();c.rect(70,205,840*p,565);c.clip();movie(A,'worker-contrast-stone-age',mix(-20,70,p),205,840,565,146+a)});
  save(()=>{c.beginPath();c.rect(1010+840*(1-q),205,840*q,565);c.clip();movie(A,'worker-contrast-factory',mix(1940,1010,q),205,840,565,22+a)});
  line(960,237,960,808,E(a,.6,2.3),'#77868d',1.5);
  return true;
 }
 function school(t,A){
 if(t<144.917917||t>=158.917917)return false;
 const a=t-144.917917,p=E(a,0,1.05);c.fillStyle='#000';c.fillRect(0,0,1920,952);
 fade(p,()=>{movie(A,'v4_hengshui_reading',80,85,650,770,a);tag('衡水市第十三中学 · 2020',90,904)});
 fade(E(a,.5,1.4),()=>{text('自身需要',1350,160,62,'#f1f1ed','center');line(840,225,1810,225,1,'#48545b',1.3);});
 fade(E(a,5.4,6.4),()=>{const im=A.assets.community_study_tasks;if(im?.width){const w=970,h=490,k=Math.min(w/im.width,h/im.height);c.drawImage(im,840+(w-im.width*k)/2,300+(h-im.height*k)/2,im.width*k,im.height*k)}text('想要做什么？',1330,846,44,'#c5cfd4','center')});
 return true;
 }
 function companions(t,A){
  if(t<158.917917||t>=175.717917)return false;
  c.fillStyle='#000';c.fillRect(0,0,1920,952);const a=t-158.917917,p=E(a,0,1.5);
  line(100,852,1820,852,1,'#546067',1.8);
  fade(p,()=>{text('为自己的需要',1080,150,65);text('学习，创造。',1080,246,65,'#acbbc5')});
  A.live(mix(-60,15,p),-10,850,t,1,{framing:'waist',mood:'smile',lookX:.45,lookY:-.08});
  const q=E(a,.4,2.2),vt=Math.min(Math.max(0,a-.5),9.97);
  fade(q,()=>{
   if(a<10.5)movie(A,'v4_chibi_whale',1110,mix(390,330,q),600,516,vt,{crop:[.30,.12,.40,.83]});
   else{const im=A.assets.v4_chibi_whale_hold;if(im){const crop=[.30,.12,.40,.83],sw=im.width*crop[2],sh=im.height*crop[3],k=Math.min(600/sw,516/sh);c.drawImage(im,im.width*crop[0],im.height*crop[1],sw,sh,1410-sw*k/2,588-sh*k/2,sw*k,sh*k)}}
   text('自己的伙伴',1410,904,32,'#c9d4da','center');
  });
  fade(E(a,4.5,6.5),()=>{arrow(815,690,1040,690,E(a,4.5,6.5));circle(1054,690,6,'#b1c9d8',true)});
  return true;
 }
 function directory(t,A){
  if(t<23.7625||t>=35.2225)return false;
  const a=t-23.7625,p=E(a,0,1.25);c.fillStyle='#000';c.fillRect(0,0,1920,952);
  fade(p,()=>{text('一切皆插件',120,79,50);tag('社区插件目录',1530,84);line(120,127,1800,127,1,'#57656d',1.2)});
  save(()=>{c.beginPath();c.rect(120,160,1680,768*p);c.clip();movie(A,'v4_plugin_directory',120,130+mix(80,0,p),1680,810,Math.min(a,8),{crop:[0,0,2/3,.5],hold:a>=8})});
  return true;
 }
 window.LearningScenes={draw(ctx,id,t,A){c=ctx;return id==='p1c3'?practice(t,A):id==='p2c1'?(workers(t,A)||school(t,A)||companions(t,A)):id==='p2c2'?directory(t,A):false}};
})();

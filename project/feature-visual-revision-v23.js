(()=>{
 'use strict';let C,A;const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x){x=cl(x);let l=0,h=1;const b=(u,a,z)=>3*(1-u)**2*u*a+3*(1-u)*u*u*z+u**3;for(let i=0;i<16;i++){const m=(l+h)/2;b(m,.45,.23)<x?l=m:h=m}return b((l+h)/2,0,1)}
 const E=(t,a,b)=>bez((t-a)/(b-a)),S=f=>{C.save();f();C.restore()},fade=(a,f)=>{if(a>.001)S(()=>{C.globalAlpha*=cl(a);f()})};
 function text(s,x,y,n=56,col='#eee',align='center',face='"SimSun",serif'){C.font=(n>=60?'700 ':'400 ')+n+'px '+face;C.textAlign=align;C.textBaseline='middle';C.fillStyle=col;C.fillText(s,x,y)}
 function line(x,y,X,Y,a=1,w=1.8,col='#eee'){fade(a,()=>{C.strokeStyle=col;C.lineWidth=w;C.beginPath();C.moveTo(x,y);C.lineTo(X,Y);C.stroke()})}
 function path(ps,p=1,a=1,w=1.8,col='#eee'){const lens=ps.slice(1).map((q,i)=>Math.hypot(q[0]-ps[i][0],q[1]-ps[i][1]));let rest=lens.reduce((a,b)=>a+b,0)*cl(p);lens.forEach((n,i)=>{const k=cl(rest/n);if(k)line(...ps[i],mix(ps[i][0],ps[i+1][0],k),mix(ps[i][1],ps[i+1][1],k),a,w,col);rest-=n})}
 function arrow(x,y,X,p=1,a=1){const end=mix(x,X,p);line(x,y,end,y,a,2);if(p>.98){line(X-15,y-9,X,y,a,2);line(X-15,y+9,X,y,a,2)}}
 function circle(x,y,r,fill=null,stroke='#ddd',w=2){C.beginPath();C.arc(x,y,r,0,Math.PI*2);if(fill){C.fillStyle=fill;C.fill()}if(stroke){C.strokeStyle=stroke;C.lineWidth=w;C.stroke()}}
 function camera(x,y,z,f){S(()=>{C.translate(960,456);C.scale(z,z);C.translate(-x,-y);f()})}
 function rows(t,a=1){fade(a,()=>{text('使用者',330,190,34,'#a1a7aa');text('模型 / 平台',1490,190,34,'#a1a7aa');line(140,240,520,240,.45);line(1280,240,1700,240,.45);fade(E(t,113.30,114.0),()=>text('提出问题',330,360,72));fade(E(t,117.58,118.2),()=>text('提供回答',1490,360,72));arrow(660,360,1220,E(t,117.58,118.35));fade(E(t,120.54,121.1),()=>text('提出需求',330,625,72));fade(E(t,121.35,122.0),()=>text('交付结果',1490,625,72));arrow(660,625,1220,E(t,121.10,122.1))})}
 function logic(t){
  if(t<113.295083){const a=E(t,108.295083,109.25);fade(a,()=>{text('获取知识',470,420,96);text('≠',960,420,128);text('独立创造',1450,420,96)});line(220,650,mix(220,1700,E(t,109.6,112.1)),650,.5);return}
  if(t<124.015083){rows(t);return}
  if(t<139.267541){const p=E(t,124.015083,126.1);rows(123.02,1-E(t,124.015083,125.2));fade(p,()=>{text('便利',480,220,39,'#9da5aa');text('获得结果',mix(1490,480,p),mix(625,390,p),mix(72,91,p));text('≠',960,390,118);text('掌握技术',1450,390,91)});const labels=[['理解运行',127.8],['修改结构',129.4],['决定连接',131.0]];labels.forEach(([s,start],i)=>fade(E(t,start,start+.65),()=>{line(1220,570+i*83,1285,570+i*83,.65);text(s,1450,570+i*83,46)}));return}
  const p=E(t,139.267541,141.0);fade(1-p,()=>{text('获得结果',480,390,91);text('≠',960,390,118);text('掌握技术',1450,390,91)});fade(p,()=>{text('认识',480,390,91);text('实践',1450,390,91);line(760,390,1160,390,.18);arrow(760,390,1160,E(t,143.58,147.8)*.63,.8);text('尚未完成的飞跃',960,650,46,'#b0b5b9')});
 }
 function brain(x,y,s=1){S(()=>{C.translate(x,y);C.scale(s,s);C.strokeStyle='#eee';C.lineWidth=3;C.lineCap='round';C.lineJoin='round';C.beginPath();C.moveTo(0,88);C.bezierCurveTo(-35,120,-83,89,-78,55);C.bezierCurveTo(-126,44,-132,-15,-98,-42);C.bezierCurveTo(-114,-93,-62,-126,-28,-103);C.bezierCurveTo(-15,-136,28,-128,36,-101);C.bezierCurveTo(90,-111,119,-70,103,-32);C.bezierCurveTo(148,-8,129,50,92,57);C.bezierCurveTo(99,103,40,118,11,90);C.stroke();C.beginPath();C.moveTo(0,-104);C.bezierCurveTo(-13,-55,15,-13,0,88);C.moveTo(-30,-82);C.bezierCurveTo(-73,-77,-39,-33,-83,-24);C.moveTo(-86,17);C.bezierCurveTo(-33,-7,-61,60,-29,65);C.moveTo(35,-70);C.bezierCurveTo(81,-83,47,-20,91,-12);C.moveTo(79,28);C.bezierCurveTo(28,20,63,78,29,76);C.stroke()})}
 function hand(x,y,s=1){S(()=>{C.translate(x,y);C.scale(s,s);C.lineWidth=3;C.strokeStyle='#eee';C.lineJoin='round';C.lineCap='round';C.beginPath();C.moveTo(-35,105);C.lineTo(-53,65);C.lineTo(-99,0);C.bezierCurveTo(-112,-22,-93,-35,-77,-18);C.lineTo(-41,24);C.lineTo(-50,-65);C.bezierCurveTo(-52,-92,-25,-94,-21,-66);C.lineTo(-15,-9);C.lineTo(-13,-102);C.bezierCurveTo(-12,-127,16,-126,17,-100);C.lineTo(18,-10);C.lineTo(30,-88);C.bezierCurveTo(35,-112,60,-104,58,-81);C.lineTo(49,5);C.lineTo(67,-50);C.bezierCurveTo(77,-74,100,-61,92,-37);C.lineTo(75,57);C.bezierCurveTo(69,79,59,89,53,105);C.closePath();C.stroke();line(-23,63,45,63,.35,2)})}
 function chip(x,y,s=1,p=1){S(()=>{C.translate(x,y);C.scale(s,s);C.strokeStyle='#eee';C.lineWidth=2;C.strokeRect(-66,-53,132,106);C.strokeRect(-46,-33,92,66);for(let i=0;i<5;i++){const a=-44+i*22;line(a,-68,a,-53,.8,2);line(a,53,a,68,.8,2);line(-81,a*.8,-66,a*.8,.8,2);line(66,a*.8,81,a*.8,.8,2)}for(let j=0;j<3;j++)for(let i=0;i<4;i++)fade(cl(p*2-(j*4+i)/12),()=>circle(-27+i*18,-17+j*17,2.3,'#ddd',null))})}
 function face(x,y,r,mood=0,emoji=''){S(()=>{circle(x,y,r,'#101213','#dce0df',Math.max(1.5,r*.035));const ex=r*.31,ey=y-r*.13;circle(x-ex,ey,r*.05,'#dce0df',null);circle(x+ex,ey,r*.05,'#dce0df',null);C.strokeStyle='#c7cecf';C.lineWidth=Math.max(1.5,r*.045);C.lineCap='round';C.beginPath();C.moveTo(x-r*.30,y+r*.23);C.quadraticCurveTo(x,y+r*(.23+.25*mood),x+r*.30,y+r*.23);C.stroke();C.beginPath();C.moveTo(x-r*.9,y+r*2.0);C.quadraticCurveTo(x,y+r*.95,x+r*.9,y+r*2.0);C.stroke()})}
 function people(y,t,{small=false,creative=false}={}){const xs=small?[650,960,1270]:[220,430,640,850,1070,1290,1510,1730];xs.forEach((x,i)=>{const enter=E(t,187.35+i*.07,188.55+i*.07);fade(enter,()=>{face(x,y,small?83:55,creative?E(t,190+i*.13,193+i*.13):.2-.5*E(t,194.9+i*.08,196.4+i*.08),i===1?'👷':'');if(!creative){line(x,y-120,x,y-78,E(t,189.0+i*.13,191.5+i*.13),1.5);C.strokeStyle='#8b949b';C.strokeRect(x-28,y-169,56,43)}})})}
 function comparison(t){
 const cut=174.523208,consumer=187.325708;
 if(t<cut){fade(E(t,165.794833,166.7),()=>{brain(540,365,1.25);hand(1380,365,1.18);text('脑力劳动',540,595,64);text('体力劳动',1380,595,64);});fade(E(t,171.1,172.1),()=>{chip(960,365,.63);text('脑体对立的基础正在改变',960,755,43,'#b9c3c7');});return;}
 if(t<consumer){text('社会拥有先进技术',960,150,68,'#b4c0c6');chip(960,330,1.25);text('≠',960,495,100,'#e5e8e5');text('人人掌握创造能力',960,690,76,'#f1f1ed');return;}
 text('技术生产',505,126,58,'#e8ebe6');text('产品消费',1430,126,58,'#b1bcc2');line(960,230,960,790,.35);
 const pair=[['p1-code',90],['p1-report',1020]];pair.forEach(([key,x])=>{const im=A.assets[key];if(im?.width){const w=810,h=560,k=Math.min(w/im.width,h/im.height);C.drawImage(im,x+(w-im.width*k)/2,245+(h-im.height*k)/2,im.width*k,im.height*k)}});
 fade(E(t,194.925708,195.8),()=>text('多数人仍处于消费端',960,901,44,'#b8c4ca'));
 }
 function movie(key,x,y,w,h,t){C.fillStyle='#080b0d';C.fillRect(x,y,w,h);if(A.hasVideo(key))A.video(key,x,y,w,h,Math.max(0,t),{cover:true})}
 function factory(t){
 const a=t-223.493291,p=E(t,239.25,240.5),x=mix(0,80,p),y=mix(0,145,p),w=mix(1920,1220,p),h=mix(952,686,p);
 if(a<8)movie('v3_factory_wide',x,y,w,h,Math.min(7.85,a));else if(a<27)movie('v3_factory_line',x,y,w,h,a-8);else movie('v3_factory_hands',x,y,w,h,a-27);
 fade(p,()=>{line(1375,180,1375,806,.36,1.5);[['知识',244.030791],['管理',245.25],['生产决策',246.6]].forEach(([s,start],i)=>fade(E(t,start,start+.65),()=>text(s,1610,285+i*170,i===2?62:54,i===2?'#f1f1ed':'#bac5cb')));});
 }
 window.FullRevisions={p1c2(ctx,t,api){const which=t>=108.295083&&t<152.432541?logic:t>=165.794833&&t<198.598792?comparison:t>=223.493291&&t<260.808375?factory:null;if(!which)return false;C=ctx;A=api;S(()=>{C.fillStyle='#000';C.fillRect(0,0,W,H);which(t)});return true}};
 window.FullRevisions.p1c3=(ctx,t,api)=>window.SymbolComparison?.draw(ctx,t,api)||window.WorkerHistory.draw(ctx,t,api);
})();

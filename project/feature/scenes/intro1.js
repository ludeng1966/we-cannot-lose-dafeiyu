(()=>{
 let c,A;const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,k)=>a+(b-a)*k,S=f=>{c.save();f();c.restore();};
 function bez(x,x1=.66,y1=0,x2=.25,y2=1){x=clamp(x);const q=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;let a=0,b=1;for(let i=0;i<18;i++){const m=(a+b)/2;q(m,x1,x2)<x?a=m:b=m;}return q((a+b)/2,y1,y2);}
 const E=(t,a,b)=>bez((t-a)/(b-a),b-a>5?.48:.66,0,b-a>5?.24:.25,1),O=(t,a,b)=>bez((t-a)/(b-a),.18,.65,.3,1);
 function bg(col='#050607'){c.fillStyle=col;c.fillRect(0,0,1920,952);}
 function ln(x,y,X,Y,a=.7,w=1,col='#ddd'){S(()=>{c.globalAlpha*=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();});}
 function dot(x,y,r=4,a=1,col='#ddd'){S(()=>{c.globalAlpha*=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill();});}
 function rect(x,y,w,h,fill='#111',stroke=null){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h);}}
 function text(s,x,y,n=46,col='#eee',align='left',face='"SimSun",serif'){c.fillStyle=col;c.font=n+'px '+face;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);}
 function img(key,x,y,w,h,alpha=1,crop=[0,0,1,1],cover=false){const im=A.assets[key];if(!im)return;S(()=>{c.globalAlpha*=alpha;c.beginPath();c.rect(x,y,w,h);c.clip();const q=[im.width*crop[0],im.height*crop[1],im.width*crop[2],im.height*crop[3]],k=(cover?Math.max:Math.min)(w/q[2],h/q[3]);c.drawImage(im,...q,x+(w-q[2]*k)/2,y+(h-q[3]*k)/2,q[2]*k,q[3]*k);});}
 function film(key,x,y,w,h,time,alpha=1){S(()=>{c.globalAlpha*=alpha;A.video(key,x,y,w,h,time,{cover:false});});}
 function pane(key,x,y,w,h,alpha=1){S(()=>{c.globalAlpha*=alpha;c.shadowBlur=30;c.shadowColor='#000b';rect(x-9,y-9,w+18,h+18,'#121619','#667078');c.shadowColor='transparent';img(key,x,y,w,h);});}
 function trace(points,p,a=.6,w=1){const lens=points.slice(1).map((v,i)=>Math.hypot(v[0]-points[i][0],v[1]-points[i][1]));let r=clamp(p)*lens.reduce((x,y)=>x+y,0);lens.forEach((l,i)=>{const k=clamp(r/l);ln(...points[i],mix(points[i][0],points[i+1][0],k),mix(points[i][1],points[i+1][1],k),a,w);r-=l;});}
 function thumb(key,x,y,w,h,a=1){S(()=>{c.globalAlpha*=a;rect(x-1,y-1,w+2,h+2,'#111','#6c747b');img(key,x,y,w,h);});}
 function opening(t){const p=E(t,2.2,4.8),leave=E(t,4.9,6.0);S(()=>{c.translate(960,445);const k=mix(1,.74,leave);c.scale(k,k);c.globalAlpha*=1-leave;film('pet_code',-855,-290,970,540,t);A.live(200,-425,740,t,1,{framing:'waist',mood:'concerned',moodFrom:'smile',moodAt:2.1,moodDuration:1.25,lookX:-.35});
  trace([[160,-350],[160,-395],[840,-395],[840,440],[160,440],[160,-350]],p,.78,1.2);for(let i=0;i<3;i++){const x=185+i*215;ln(x,-365,x,425,p*.25,1);}ln(-780,300,mix(-700,175,p),300,.62);dot(mix(-760,175,p),300,4,1-p);});
  if(leave>0){ln(370,510,1550,510,leave*.7);S(()=>{c.globalAlpha*=leave;text('2026',690,345,154,'#f0f0f0','center','Georgia,serif');text('10.27',1175,565,112,'#ddd','center','Georgia,serif');});}}
 function date(t){const move=E(t,9.0,11.6);S(()=>{c.translate(mix(960,350,move),mix(450,155,move));const k=mix(1,.42,move);c.scale(k,k);text('2026',-270,-95,154,'#eee','center','Georgia,serif');text('10.27',215,115,112,'#eee','center','Georgia,serif');ln(-590,35,590,35,.65);});
  const reveal=E(t,9.5,11.6);S(()=>{c.globalAlpha*=reveal;img('wechat-notice',760,mix(850,300,reveal),1030,330,.88,[.035,.185,.93,.115]);});}
 function headline(t){const enter=O(t,11.6,12.1),expand=E(t,13.0,15.5);S(()=>{c.globalAlpha*=enter;
  const x=mix(190,90,expand),y=mix(195,105,expand),w=mix(1540,1080,expand),h=mix(470,350,expand);img('wechat-notice',x,y,w,h,1,[.035,.185,.93,.115]);
  S(()=>{const edge=E(t,13.1,14.8);c.beginPath();c.rect(1160,75,700,780*edge);c.clip();img('wechat-notice',1160,75,700,780,1,[.10,.355,.80,.338]);});
  A.live(290,385,520,t,expand,{framing:'full',mood:'concerned',lookX:.45});ln(x,y+h+35,x+w,y+h+35,.55);});}
 function network(t){const spread=E(t,16.0,18.3),cut=E(t,21.3,25.3),retreat=E(t,27.8,30.0);S(()=>{c.translate(960,455);const z=mix(1,.76,retreat);c.scale(z,z);film('pet_archive',-855,-275,720,475,t-16);
  const source=1-E(t,26.4,28.0);S(()=>{c.globalAlpha*=source;img('wechat-notice',130,-340,720,250,1,[.035,.185,.93,.115]);img('wechat-notice',125,-25,730,490,1,[.135,.482,.73,.188]);});
  const junction=-15;trace([[-135,-40],[junction,-40],[junction,-155],[130,-155]],spread*(1-cut*.98),.76,1.5);trace([[-135,-40],[junction,-40],[junction,340],[130,340]],spread*(1-cut*.98),.6,1.5);for(let i=0;i<3;i++)dot(mix(-115,200,(i+.8)/4),-40,4,.7*(1-cut));ln(80,-280,80,mix(-280,490,cut),cut*.9,2);ln(100,-280,100,mix(-280,490,cut),cut*.25);A.live(-450,135,430,t,spread*(1-retreat*.8),{framing:'full',mood:'concerned',lookX:.3});});
  if(retreat>0){ln(490,515,1430,515,retreat*.6);}}
 function reaction(t){const p=O(t,29.8,31.0);A.live(465,-10,990,t,p,{framing:'close',mood:'concerned',lookX:0,gesture:{type:'shake',at:31.8,duration:3.1,amount:.7}});}
 function future(t){const open=E(t,35,37.7),focus=E(t,40.6,44.5);S(()=>{const x=mix(500,160,open),y=mix(515,170,open),w=mix(940,1440,open),h=mix(2,670,open);c.beginPath();c.rect(x,y,w,h);c.clip();film('blue_terminal',160,170,1440,670,t-35);});ln(mix(490,150,open),mix(515,160,open),mix(1430,1610,open),mix(515,160,open),.6);A.live(1360,45,520,t,open*(1-focus),{framing:'full',mood:'firm',moodFrom:'concerned',moodAt:35.4,moodDuration:1.2,lookX:-.45});
  S(()=>{c.globalAlpha*=focus;rect(0,240,1920,475,'#000a');text('我们的未来',mix(1080,960,focus),425,mix(78,130,focus),'#fff','center');ln(400,555,400+1120*focus,555,.75,1.5);});
  const close=E(t,44.6,47.1);if(close>0){S(()=>{c.globalAlpha*=close;rect(0,0,1920,952,'#050607');A.live(270,30,810,t,1,{framing:'waist',mood:'neutral',lookX:.4});ln(1180,175,1180,mix(175,790,close),.7,2);});}}
 function safety(t){const p=E(t,47.1,48.6),x=mix(1180,0,p),w=mix(2,1920,p);S(()=>{c.beginPath();c.rect(x,0,w,952);c.clip();bg('#eeefed');img('rule',365,250,1460,455,1,[.215,.065,.78,.285]);text('安全',175,130,76,'#141414');ln(175,195,1745,195,.25,1,'#252525');});}

 function losses(t){const pull=E(t,56,59.4),second=O(t,55.4,56.6),third=O(t,57.1,58.4);S(()=>{c.translate(960,445);const k=mix(1,.64,pull);c.scale(k,k);c.translate(-mix(950,1160,pull),-mix(455,605,pull));
  thumb('starter-running',210,70,1180,650,mix(1,.60,second));
  thumb('notifier-cost',1510,120,880,530,second);
  thumb('bili-pond-memory',210,740,900,650,third);
  trace([[1390,560],[1450,560],[1450,650],[1900,650]],second,.26,1.1);
  trace([[1900,650],[1900,700],[1110,700],[1110,740]],third,.26,1.1);
 });
  const final=O(t,62.56,63.9);S(()=>{c.globalAlpha*=final;text('只是一条鱼吗？',1440,740,78,'#f7f7f7','center');});const rail=E(t,65,67.4);ln(166,0,166,952*rail,rail*.6,1.4);}

 window.FullScenes.intro1={duration:67.4,draw(ctx,t,api){c=ctx;A=api;bg();if(t<6)opening(t);else if(t<11.6)date(t);else if(t<16)headline(t);else if(t<30)network(t);else if(t<35)reaction(t);else if(t<47.1)future(t);else if(t<53.5)safety(t);else losses(t);}};
})();

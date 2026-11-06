(()=>{
 'use strict';let C,A;const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x,x1=.56,y1=.02,x2=.23,y2=1){x=cl(x);if(x===0||x===1)return x;let lo=0,hi=1;const f=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;for(let i=0;i<17;i++){const m=(lo+hi)/2;f(m,x1,x2)<x?lo=m:hi=m}return f((lo+hi)/2,y1,y2)}
 const E=(t,a,b)=>bez((t-a)/(b-a)),O=(t,a,b)=>bez((t-a)/(b-a),.16,.74,.25,1),L=(t,a,b)=>bez((t-a)/(b-a),.68,0,.28,1);
 const S=f=>{C.save();f();C.restore()},alpha=(a,f)=>{if(a>.001)S(()=>{C.globalAlpha*=cl(a);f()})};
 function bg(col='#050607'){C.fillStyle=col;C.fillRect(0,0,W,H)}
 function rect(x,y,w,h,fill=null,stroke=null,lw=1){if(fill){C.fillStyle=fill;C.fillRect(x,y,w,h)}if(stroke){C.strokeStyle=stroke;C.lineWidth=lw;C.strokeRect(x,y,w,h)}}
 function line(x,y,X,Y,a=.6,w=1,col='#ddd'){alpha(a,()=>{C.strokeStyle=col;C.lineWidth=w;C.beginPath();C.moveTo(x,y);C.lineTo(X,Y);C.stroke()})}
 function path(ps,p=1,a=.6,w=1,col='#ddd'){const ls=ps.slice(1).map((q,i)=>Math.hypot(q[0]-ps[i][0],q[1]-ps[i][1]));let left=ls.reduce((s,v)=>s+v,0)*cl(p);ls.forEach((l,i)=>{const q=cl(left/Math.max(1,l));if(q>0)line(...ps[i],mix(ps[i][0],ps[i+1][0],q),mix(ps[i][1],ps[i+1][1],q),a,w,col);left-=l})}
 function dot(x,y,r=4,a=1,col='#ddd'){alpha(a,()=>{C.fillStyle=col;C.beginPath();C.arc(x,y,r,0,7);C.fill()})}
 function text(s,x,y,n=48,col='#eee',align='left',face='"SimSun",serif',weight=400){C.fillStyle=col;C.font=weight+' '+n+'px '+face;C.textAlign=align;C.textBaseline='middle';C.fillText(s,x,y)}
 function img(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false,rot=0}={}){const im=A.assets[key];if(!im?.width)return false;S(()=>{C.globalAlpha*=a;C.translate(x+w/2,y+h/2);C.rotate(rot);C.beginPath();C.rect(-w/2,-h/2,w,h);C.clip();const sx=im.width*crop[0],sy=im.height*crop[1],sw=im.width*crop[2],sh=im.height*crop[3],k=(cover?Math.max:Math.min)(w/sw,h/sh);C.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k)});return true}
 function frame(x,y,w,h,{a=1,edge='#505b60',light=false,depth=3}={}){alpha(a,()=>rect(x-depth,y-depth,w+depth*2,h+depth*2,light?'#dddcd6':'#0b1013',edge,1))}
 const fullPost={community_multitask:['v11_feature_archive',[22/1257,180/627,886/1257,395/627]],community_macos_port:['v11_macos_archive',[22/1257,180/627,886/1257,389/627]],community_asset_reuse:['v11_reuse_archive',[22/1257,180/627,886/1257,382/627]],community_diy_control:['v11_control_archive',[22/1257,180/627,886/1257,382/627]]};
 function photo(key,x,y,w,h,o={}){const full=fullPost[key];if(full&&A.assets[full[0]]){key=full[0];o={...o,crop:o.crop||full[1]}}const im=A.assets[key];if(!im?.width)return false;const crop=o.crop||[0,0,1,1],sw=im.width*crop[2],sh=im.height*crop[3],k=Math.min(w/sw,h/sh),dw=o.cover?w:sw*k,dh=o.cover?h:sh*k,bx=x+(w-dw)/2,by=y+(h-dh)/2;S(()=>{C.translate(x+w/2,y+h/2);C.rotate(o.rot||0);C.translate(-x-w/2,-y-h/2);frame(bx,by,dw,dh,o);img(key,bx,by,dw,dh,{...o,rot:0})});return true}
 function video(key,x,y,w,h,t,{a=1,cover=true,crop,fallback='e04',edge=true}={}){alpha(a,()=>{if(edge)frame(x,y,w,h);if(A.hasVideo(key))A.video(key,x,y,w,h,Math.max(0,t),{cover,crop});else img(fallback,x,y,w,h,{cover,crop})})}
 function live(x,y,w,t,options={},a=1){if(a>.001)A.live(x,y,w,t,a,options)}
 function camera(x,y,z,fn){S(()=>{C.translate(960,456);C.scale(z,z);C.translate(-x,-y);fn()})}
 function mask(x,y,w,h,p,fn,axis='x'){if(p<.001)return;S(()=>{C.beginPath();C.rect(x,y,w*(axis==='x'?p:1),h*(axis==='y'?p:1));C.clip();fn()})}
 function desk(x,y,w,a=1){line(x,y,x+w,y,a*.6,2.4);line(x+30,y,x+15,y+165,a*.3,1.4);line(x+w-30,y,x+w-15,y+165,a*.3,1.4)}
 function link(x,y,X,Y,t,a,b,col='#ddd'){path([[x,y],[mix(x,X,.52),y],[mix(x,X,.52),Y],[X,Y]],E(t,a,b),.55,1.3,col)}
 const meshKeys=['p3_help_release','p3_help_docs','community_multitask','community_study_tasks','starter_running','coopanion_inbox','p1-report','p1_bili_see'];
 function mesh(t,{cx=1700,cy=670,z=.49,open=1,holes=0}={}){camera(cx,cy,z,()=>{const points=[[100,100],[1270,80],[2420,100],[3570,80],[100,1000],[1270,1050],[2420,1000],[3570,1050]];points.forEach(([x,y],i)=>{const a=cl(open-i*.055);photo(meshKeys[i],x,y,840,520,{a});if(i<4)path([[x+420,y+550],[x+420,y+770],[x+420,y+940]],cl(open*1.4-i*.08),.4*(1-holes*.8),1.6);if(i%4<3)path([[x+850,y+260],[x+1150,y+260]],cl(open*1.4-i*.1),.5*(1-holes*.8),1.6)});if(holes>0){alpha(holes,()=>{for(const[x,y]of [[4850,100],[4850,1000],[6000,520]]){rect(x,y,840,520,null,'#53616a',1.5);line(x-390,y+260,x-40,y+260,.18,1.4)}})}})}
 function heading(title,t,end=3){alpha(O(t,0,.7)*(1-E(t,end-.65,end)),()=>{text(title,960,410,93,'#eee','center');line(370,615,mix(370,1550,O(t,.6,1.7)),615,.6,1.3)})}
 window.P3FilmKit={use(ctx,api){C=ctx;A=api;return this},cl,mix,bez,E,O,L,S,alpha,bg,rect,line,path,dot,text,img,frame,photo,video,live,camera,mask,desk,link,mesh,heading};

 function first(t){const K=window.P3FilmKit;
  if(t<3){heading('失去的是什么？',t);return}
  if(t<16.826292){const p=E(t,3,7.762389);live(mix(590,435,p),mix(60,-15,p),mix(790,1050,p),t,{framing:'close',mood:'concerned',lookX:0},O(t,3,4.843506));alpha(O(t,9.298644,10.834899),()=>text('失去什么',1510,425,68,'#eee','center'));return}
  if(t<30.226292){if(t<24.2)video('p1_task_debug',210,65,1500,800,Math.min(17.9,t-16.826292),{fallback:'p1-error',cover:false,edge:false});else photo('onebot',230,75,1460,795);return}
  if(t<45.8){video('v3_dario_announcement',210,65,1500,800,Math.min(21.95,t-30.226292),{fallback:'e04',cover:false,edge:false});text('Anthropic · Code with Claude · 2025',960,910,31,'#aaa','center');return}
  if(t<50.226292){live(480,-10,1000,t,{framing:'close',mood:'concerned',lookX:0});return}
  const enter=E(t,50.226292,51.5);photo('bili_pond_memory',220,65,1480,790,{a:enter});text('dsh-bili-pond · YOYOLnFu',960,910,31,'#aaa','center');
 
 }
 window.FullScenes=window.FullScenes||{};window.FullScenes.p3c1={duration:69.352083,draw(ctx,t,api){window.P3FilmKit.use(ctx,api);S(()=>{C.beginPath();C.rect(0,0,W,H);C.clip();bg();first(Math.max(0,Math.min(69.352,t)))})}};
})();

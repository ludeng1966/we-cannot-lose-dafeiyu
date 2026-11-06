(()=>{
 'use strict';let c,A;const W=1920,H=952,cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 function bez(x,a=.58,b=.02,d=.22,e=1){x=cl(x);if(x===0||x===1)return x;const f=(q,p,r)=>3*(1-q)**2*q*p+3*(1-q)*q*q*r+q**3;let lo=0,hi=1;for(let i=0;i<17;i++){let m=(lo+hi)/2;f(m,a,d)<x?lo=m:hi=m}return f((lo+hi)/2,b,e)}
 const E=(t,a,b)=>bez((t-a)/(b-a)),O=(t,a,b)=>bez((t-a)/(b-a),.13,.68,.25,1),S=f=>{c.save();f();c.restore()};
 function F(a,f){if(a>.001)S(()=>{c.globalAlpha*=cl(a);f()})}
 function bg(col='#050607'){c.fillStyle=col;c.fillRect(0,0,W,H)}
 function box(x,y,w,h,fill=null,stroke=null,lw=1){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h)}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h)}}
 function ln(x,y,X,Y,a=.6,lw=1,col='#ddd'){F(a,()=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()})}
 function path(points,p=1,a=.6,w=1,col='#ddd'){const lens=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let left=lens.reduce((s,n)=>s+n,0)*cl(p);lens.forEach((l,i)=>{const k=cl(left/Math.max(1,l));if(k)ln(...points[i],mix(points[i][0],points[i+1][0],k),mix(points[i][1],points[i+1][1],k),a,w,col);left-=l})}
 function dot(x,y,r=4,a=1,col='#ddd'){F(a,()=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill()})}
 function text(s,x,y,n=48,col='#eee',align='left',font='"SimSun",serif'){c.fillStyle=col;c.font=n+'px '+font;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
 function img(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false,rot=0}={}){const im=A.assets[key];if(!im?.width)return false;F(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rot);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();let[sx,sy,sw,sh]=[crop[0]*im.width,crop[1]*im.height,crop[2]*im.width,crop[3]*im.height],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k)});return true}
 const fullPost={community_multitask:['v11_feature_archive',[22/1257,180/627,886/1257,395/627]],community_macos_port:['v11_macos_archive',[22/1257,180/627,886/1257,389/627]],community_asset_reuse:['v11_reuse_archive',[22/1257,180/627,886/1257,382/627]],community_diy_control:['v11_control_archive',[22/1257,180/627,886/1257,382/627]]};
 function plate(key,x,y,w,h,o={}){const full=fullPost[key];if(full&&A.assets[full[0]]){key=full[0];o={...o,crop:o.crop||full[1]}}const im=A.assets[key];if(!im?.width)return false;const crop=o.crop||[0,0,1,1],sw=im.width*crop[2],sh=im.height*crop[3],k=Math.min(w/sw,h/sh),dw=o.cover?w:sw*k,dh=o.cover?h:sh*k,bx=x+(w-dw)/2,by=y+(h-dh)/2;F(o.a??1,()=>{c.translate(x+w/2,y+h/2);c.rotate(o.rot||0);c.translate(-x-w/2,-y-h/2);box(bx-3,by-3,dw+6,dh+6,'#0b1013',o.edge||'#505b60',1);img(key,bx,by,dw,dh,{...o,a:1,rot:0})});return true}
 function vid(key,x,y,w,h,t,o={}){if(!A.hasVideo(key))return false;return A.video(key,x,y,w,h,Math.max(0,t),o)}
 function screen(key,x,y,w,h,t,{a=1,fallback='e04',cover=false,crop,stand=false}={}){F(a,()=>{box(x-11,y-11,w+22,h+22,'#10161b','#85939b',1.4);if(!vid(key,x,y,w,h,t,{cover,crop}))img(fallback,x,y,w,h,{cover,crop});if(stand){ln(x+w*.5,y+h+12,x+w*.5,y+h+78,.6,5);ln(x+w*.31,y+h+80,x+w*.69,y+h+80,.6,2)}})}
 function live(x,y,w,t,opts={},a=1){if(a>.001)A.live(x,y,w,t,a,opts)}
 function camera(x,y,z,f){S(()=>{c.translate(960,456);c.scale(z,z);c.translate(-x,-y);f()})}
 function desk(x,y,w,a=1){ln(x,y,x+w,y,.7*a,2.8);ln(x+30,y,x+15,y+160,.4*a,1.6);ln(x+w-30,y,x+w-15,y+160,.4*a,1.6)}
 function cable(x,y,X,Y,p,a=.6,col='#ddd'){path([[x,y],[mix(x,X,.5),y],[mix(x,X,.5),Y],[X,Y]],p,a,1.5,col)}
 function mask(x,y,w,h,p,f,axis='y'){if(p<.001)return;S(()=>{c.beginPath();c.rect(x,y,axis==='x'?w*p:w,axis==='y'?h*p:h);c.clip();f()})}
 function clock(x,y,r,p){c.strokeStyle='#929da3';c.lineWidth=1.8;c.beginPath();c.arc(x,y,r,0,7);c.stroke();for(let i=0;i<12;i++){let a=i/6*Math.PI;ln(x+Math.cos(a)*r*.86,y+Math.sin(a)*r*.86,x+Math.cos(a)*r*.96,y+Math.sin(a)*r*.96,.6,1.3)}let a=mix(-Math.PI*.5,Math.PI*.6,p);ln(x,y,x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72,.85,2.5);ln(x,y,x-r*.27,y-r*.3,.85,3)}
 function lineWord(s,x,y,n,t,a,b,col='#eee',align='left'){F(O(t,a,b),()=>{c.translate(0,28*(1-O(t,a,b)));text(s,x,y,n,col,align)})}
 function footerLine(t,a,b,y=888){ln(100,y,mix(100,1820,E(t,a,b)),y,.48,1.3)}

 function firstBook(t){live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0})}
 function knowledge(t){if(t<40.54)screen('c3_lab',210,65,1500,800,Math.min(9.45,t-31.04),{fallback:'classroom',cover:false});else screen('v3_factory_line',210,65,1500,800,Math.min(18.95,t-40.54),{fallback:'factory',cover:false})}
 function conditions(t){screen('v3_dario_keynote',210,65,1500,800,Math.min(21.95,t-61.48),{fallback:'e04',cover:false});text('Anthropic · Code with Claude · 2025',960,910,31,'#aaa','center')}
 function openSource(t){plate('community_codex_port',230,170,1460,590);live(1530,635,240,t,{framing:'full',mood:'firm',lookX:-.5},O(t,98.5,99.6))}
 function unfinished(t){plate('evidence-takedown',190,65,1270,810);live(1530,515,320,t,{framing:'full',mood:'concerned',lookX:-.5},O(t,115,116.3))}
 function existing(t){['新的生产力和生产关系','不是从无中发展起来的，','……','而是在现有的生产发展过程内部','和流传下来的、传统的所有制关系内部，','并且与它们相对立而发展起来的。'].forEach((s,i)=>text(s,160,210+i*87,62));text('马克思 · 《1857—1858年经济学手稿》',1740,805,30,'#aaa','right')}
 function time(t){if(t<151.3)screen('stock_keyboard',210,65,1500,800,Math.min(8.95,t-142.3),{fallback:'p2_code',cover:false});else{plate('notifier_cost',270,65,1170,810);live(1515,565,280,t,{framing:'full',mood:'concerned',lookX:-.5},O(t,155.4,156.5))}}
 function roots(t){live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0})}
 window.FullScenes.p2c3={duration:182.23,draw(ctx,t,api){c=ctx;A=api;S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();bg();if(t<31.04)firstBook(t);else if(t<61.48)knowledge(t);else if(t<88.04)conditions(t);else if(t<103.68)openSource(t);else if(t<127.74)unfinished(t);else if(t<142.3)existing(t);else if(t<162.88)time(t);else roots(t)})}};
})();

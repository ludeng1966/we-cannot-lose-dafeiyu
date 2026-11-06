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
 function text(s,x,y,n=48,col='#eee',align='left',font='"SimSun",serif'){c.fillStyle=col;c.font=(n>=64?'700 ':'400 ')+n+'px '+font;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
 function img(key,x,y,w,h,{a=1,crop=[0,0,1,1],cover=false,rot=0}={}){const im=A.assets[key];if(!im?.width)return false;F(a,()=>{c.translate(x+w/2,y+h/2);c.rotate(rot);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();let[sx,sy,sw,sh]=[crop[0]*im.width,crop[1]*im.height,crop[2]*im.width,crop[3]*im.height],k=(cover?Math.max:Math.min)(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k)});return true}
 function plate(key,x,y,w,h,o={}){F(o.a??1,()=>img(key,x,y,w,h,{...o,a:1,rot:0}));}
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

 function framework(t){let p=E(t,0,2.4),pull=E(t,8,15.5);plate('e04',mix(210,130,pull),mix(110,125,pull),mix(1500,1320,pull),mix(710,620,pull),{a:p});live(1250,120,650,t,{framing:'full',mood:'neutral',lookX:-.6},O(t,11.5,13));footerLine(t,13.42,16.4)}
 function modules(t){let p=E(t,16.4,18.2),q=E(t,21.96,25.4),pull=E(t,29.76,34.12);camera(mix(960,1080,pull),455,mix(1,.83,pull),()=>{screen('p2_plugin_config',250,110,1390,735,t-16.4,{a:p,fallback:'p2_code'});plate('plugins-doc',mix(1760,1550,q),mix(820,90,q),715,510,{a:q,rot:.01});live(1160,310,670,t,{framing:'full',mood:'smile',lookX:-.6},O(t,27,28.3));desk(150,905,2150)});F(O(t,22,23.4)*(1-E(t,28.8,30)),()=>{box(360,715,1000,135,'#050607df');text('一切皆插件',860,782,81,'#eee','center')})}
 function projects(t){
 if(t<42.6){plate('project-desktop',100,65,1720,805);return;}
 if(t<46.1){plate('e14',100,65,1720,805);return;}
 if(t<51.3){plate('e15',100,65,1720,805);return;}
 plate('e12',100,65,1720,805);
 }
 function culture(t){
 if(t<73.5){plate('pet_states',110,75,1700,790);return;}
 plate('starter_running',100,120,800,650);plate('e15',1020,120,800,650);
 F(O(t,80.4,81.3),()=>text('从使用，到亲手改造',960,902,53,'#e6e9e5','center'));
 }
 function questions(t){
 if(t<98){plate('community_study_tasks',130,150,1660,650);return;}
 if(t<104.84){plate('e12',100,65,1720,805);return;}
 screen('p2_plugin_run',95,65,1330,795,t-104.84,{fallback:'p2_data',cover:false});live(1490,250,340,t,{framing:'full',mood:'smile',lookX:-.5},O(t,106,106.8));
 F(O(t,110.22,111.1),()=>text('从被动消费，到主动创造',750,908,49,'#e6e9e5','center'));
 }
 function diffusion(t){
 if(t<130){plate('community_macos_port',130,165,1660,640);return;}
 plate('community_asset_reuse',130,165,1660,640);
 }
 function fishPractice(t){
 if(t<148.74){screen('ears_voice',100,65,1720,810,t-138.74,{fallback:'project-native',cover:false});return;}
 if(t<153.2){plate('bili_pond_memory',120,80,1680,790);return;}
 plate('starter_settings',100,65,1720,805);
 }
 function agency(t){
 if(t<169){plate('community_diy_control',130,170,1660,630);return;}
 if(t<181.74){screen('p2_plugin_config',95,65,1320,795,Math.min(15.96,8+t-159.42),{fallback:'p2_result',cover:false});live(1470,240,360,t,{framing:'full',mood:'firm',lookX:-.5});F(O(t,176.1,177),()=>text('亲手跨越',760,909,57,'#f0f1ed','center'));return;}
 plate('community_workflow_reply',120,100,1680,765,{crop:[.012,.45,.71,.54]});
 }
 window.FullScenes.p2c2={duration:194.96,draw(ctx,t,api){c=ctx;A=api;S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();bg();if(t<16.4)framework(t);else if(t<34.12)modules(t);else if(t<63.4)projects(t);else if(t<85.84)culture(t);else if(t<120.72)questions(t);else if(t<138.74)diffusion(t);else if(t<159.42)fishPractice(t);else agency(t)})}};
})();

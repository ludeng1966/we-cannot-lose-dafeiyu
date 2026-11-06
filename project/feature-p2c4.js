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
 function workflowPage(stage){box(227,117,1466,656,'#0b1013','#505b60',1);img('community_workflow',230,120,1460,221.5,{crop:[0,0,1,.36]});if(stage==='commit')img('community_workflow_reply',230,400,1460,229.1,{crop:[.015,194/627,.705,139/627]});else img('community_workflow_reply',230,368,1460,390,{crop:[.015,.54,.705,.37]})}
 function macosPage(){box(227,117,1466,704,'#0b1013','#505b60',1);img('v11_macos_archive',230,120,1460,164.8,{crop:[22/1257,180/627,886/1257,100/627]});img('community_macos_release',230,310,1460,507,{crop:[.018,.115,.705,.49]})}

 function proclaim(t){const p=E(t,0,1.4);live(240,25,760,t,{framing:'waist',mood:'smile',lookX:.25},p);F(O(t,6.49,7.6)*(1-E(t,11.5,13.2)),()=>text('一样能做好事情',1345,380,79,'#eee','center'))}
 function need(t){if(t<24.01)screen('v9_whale_tasks',300,45,1320,850,Math.min(8.95,t-14.63),{fallback:'native',cover:false});else{plate('community_workflow',230,175,1460,610);live(1530,635,240,t,{framing:'full',mood:'smile',lookX:-.5},O(t,34,35.2))}}
 function contributions(t){
  const firstOut=E(t,42.1,42.9),secondOut=E(t,49.4,50.2);
  F(1-firstOut,()=>plate('community_workflow',230,120,1460,615.2));
  F(firstOut*(1-secondOut),()=>workflowPage('commit'));
  F(secondOut,()=>workflowPage('reply'));
 }
 function community(t){
  const reveal=E(t,64.6,66),settle=E(t,78,79.4);
  F(1-reveal,()=>workflowPage('reply'));
  F(reveal,()=>{S(()=>{c.translate(960-300*reveal,456);c.scale(mix(1,.72,reveal),mix(1,.72,reveal));c.translate(-960,-456);workflowPage('reply')});img('native',1370,135,420,720,{a:reveal})});
  F(settle,()=>{box(0,0,1920,952,'#050607');screen('blue_terminal',300,55,1320,825,Math.min(11.95,t-78),{fallback:'native',cover:false});text('Blue · dsh-blue',960,910,31,'#aaa','center')});
 }
 function imperfect(t){const p=E(t,106,107.4);F(1-p,()=>plate('community_multitask',230,130,1460,650));F(p,()=>plate('rule',260,75,1200,790));live(1530,555,290,t,{framing:'full',mood:'concerned',lookX:-.5},O(t,116,117.2))}
 function reuse(t){if(t<129.3)plate('e13',230,130,1460,660);else{const answer=E(t,144.3,145.2);F(1-answer,()=>plate('community_macos_port',230,120,1460,641.1));F(answer,()=>macosPage());live(1550,655,220,t,{framing:'full',mood:'smile',lookX:-.5},O(t,157,158.2))}}
 function ownership(t){const p=E(t,180,181.4);live(mix(1530,480,p),mix(565,0,p),mix(280,1000,p),t,{framing:'close',mood:'concerned',lookX:mix(-.5,0,p)},O(t,177,178.3))}
 function manifesto(t){text('每个人的自由发展',960,340,95,'#eee','center');text('是一切人的自由发展的条件。',960,490,95,'#eee','center');text('马克思、恩格斯 · 《共产党宣言》 · 1848',1740,780,30,'#aaa','right')}
 function alternative(t){if(t<225.09){screen('data_sql',350,55,1220,825,Math.min(6.15,t-213.09),{fallback:'e04',cover:false});text('dsh-data-agent · tomowang',960,910,31,'#aaa','center')}else{plate('community_diy_control',230,170,1460,590);live(1530,635,240,t,{framing:'full',mood:'firm',lookX:-.5},O(t,236,237.2))}}
 function growth(t){if(t<253){screen('p1_browser_research',210,65,1500,800,Math.min(15.95,t-240.25),{fallback:'native',cover:false});text('dsh-browser · ROOKIE02314',960,910,31,'#aaa','center');return}const p=E(t,253,254.4);plate('coopanion_conversation',435,85,470,775,{a:p});plate('coopanion_inbox',1020,85,485,775,{a:O(t,262,263.2)});text('Coopanion · takboo',960,910,31,'#aaa','center')}
 window.FullScenes.p2c4={duration:289.43,draw(ctx,t,api){c=ctx;A=api;S(()=>{c.beginPath();c.rect(0,0,W,H);c.clip();bg();if(t<14.63)proclaim(t);else if(t<38.17)need(t);else if(t<56.49)contributions(t);else if(t<92.69)community(t);else if(t<120.13)imperfect(t);else if(t<162.93)reuse(t);else if(t<204.41)ownership(t);else if(t<213.09)manifesto(t);else if(t<240.25)alternative(t);else growth(t)})}};
})();

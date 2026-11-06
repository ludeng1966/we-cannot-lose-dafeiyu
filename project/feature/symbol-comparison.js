/* Capability comparison gives way to documented acts of adaptation and contribution. */
(()=>{
 'use strict';let C,A;const START=106.077083,END=153.997083,cl=x=>Math.max(0,Math.min(1,x)),E=(t,a,b)=>{let x=cl((t-a)/(b-a));return x*x*(3-2*x)};
 function save(f){C.save();f();C.restore()}function fade(a,f){if(a>.001)save(()=>{C.globalAlpha*=cl(a);f()})}
 function text(s,x,y,n=50,col='#eee',weight=400){C.font=weight+' '+n+'px "SimSun",serif';C.fillStyle=col;C.textAlign='center';C.textBaseline='middle';C.fillText(s,x,y)}
 function line(x,y,X,Y,a=.5,w=1.5){fade(a,()=>{C.strokeStyle='#e0e4e3';C.lineWidth=w;C.beginPath();C.moveTo(x,y);C.lineTo(X,Y);C.stroke()})}
 function image(key,x,y,w,h,crop=[0,0,1,1]){const im=A.assets[key];if(!im?.width)return;const sx=im.width*crop[0],sy=im.height*crop[1],sw=im.width*crop[2],sh=im.height*crop[3],k=Math.min(w/sw,h/sh);C.drawImage(im,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k)}
 function chip(x,y,s=1){save(()=>{C.translate(x,y);C.scale(s,s);C.strokeStyle='#edf0ed';C.lineWidth=2;C.strokeRect(-72,-58,144,116);C.strokeRect(-47,-33,94,66);for(let i=0;i<5;i++){let a=-44+i*22;line(a,-76,a,-58,.8,2);line(a,58,a,76,.8,2);line(-90,a,-72,a,.8,2);line(72,a,90,a,.8,2)}})}
 function title(s){text(s,960,104,66,'#f1f1ed',700);line(110,172,1810,172,.3)}
 function draw(t){
  if(t<113.717083){
   fade(E(t,START,START+.68),()=>{chip(560,452,2);text('模型升级',560,728,60,'#b4c0c6');});
   const arrival=START+2.16;
   const rise=E(t,START+.88,arrival);
   if(rise>0)line(1050,700,1050,700-450*rise,.8,3);
   if(t>=arrival){
    line(1035,272,1050,250,.8,3);
    line(1065,272,1050,250,.8,3);
   }
   fade(E(t,arrival,arrival+.52),()=>text('能力上限',1400,445,79,'#f1f1ed'));
   return;
  }
  if(t<124.697083){title('劳动智慧与创造需求');image('community_diy_control',130,235,1660,570);return;}
  if(t<130.2){image('community_macos_port',135,140,1650,680);return;}
  if(t<136.877083){image('community_macos_release',135,100,1650,765,[.015,.11,.71,.50]);return;}
  if(t<140.317083){chip(530,430,1.8);text('模型升级',530,720,56,'#b4c0c6');text('少数人',1390,430,78,'#f1f1ed');line(960,235,960,755,.35);return;}
  title('实际掌握技术');if(t<145.837083)image('community_workflow',120,205,1680,645);else image('community_workflow_reply',110,205,1700,710,[.012,.45,.71,.54]);
 }
 window.SymbolComparison={start:START,end:END,draw(ctx,t,api){if(t<START||t>=END)return false;C=ctx;A=api;save(()=>{C.fillStyle='#000';C.fillRect(0,0,1920,952);draw(t)});return true}};
})();
(()=>{
 'use strict';let K;const D=204.581875;
 const RETIRE=183.908020638,SMALL=190.537740059,TITLE=199.324939037;
 function closing(t){const{E,O,mix,alpha,line,text,img,photo,video,live,camera,mask,desk,link}=K;
  if(t<3){K.heading('我们不能失去大肥鱼',t,3);return}
  if(t<15.48){const p=E(t,3,5.674286),q=E(t,9.24,14.142857);live(mix(500,120,q),mix(-5,15,q),mix(1040,820,q),t,{framing:'waist',framingFrom:'close',framingAt:9.24,framingDuration:5.5,mood:'smile',lookX:mix(0,.4,q)},O(t,3,3.980571));photo('pet_family',mix(1970,1070,q),mix(500,120,q),730,610,{a:q});line(925,820,1780,820,q*.45,1.2);return}
  if(t<35.72){
   const run=E(t,22.1,23.3),leave=E(t,33.3,35.72);
   alpha(1-run,()=>photo('e19',210,115,1500,700));
   alpha(run*(1-leave),()=>{video('ears_voice',210,65,1500,800,Math.min(11.95,t-22.1),{fallback:'e19',cover:false,edge:false});text('dsh-ears · WizisCool',960,910,31,'#aaa','center')});
   live(480,-10,1000,t,{framing:'close',mood:'smile',lookX:0},leave);return
  }
  if(t<43.72){live(480,-10,1000,t,{framing:'close',mood:'smile',lookX:0});alpha(O(t,41.4,42)*(1-E(t,43.3,43.72)),()=>text('人们只是在养鱼',1510,400,56,'#eee','center'));return}
  if(t<63.78){live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0});return}
  if(t<92.8){const leave=E(t,82.4,84.2),center=E(t,84.2,86);photo('deepharness_overview',140-65*leave,65,1640,790,{a:1-leave});alpha(1-leave,()=>text('DEEPHARNESS · NANTI34',960,910,31,'#aaa','center'));live(mix(1180,480,center),-10,mix(760,1000,center),t,{framing:'close',mood:'firm',lookX:mix(-.3,0,center)},O(t,79.8,81.2));return}
  if(t<112.83){live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0});return}
  if(t<140.53){
   video('v3_workers_march',100,60,1720,800,Math.min(24.95,t-112.83),{cover:false,edge:false,fallback:'factory'});
   text('《母亲》 · 1926 · 普多夫金',960,905,31,'#bbb','center');return
  }
  if(t<145.43){const commune=E(t,142.98,143.633333);live(55,15,830,t,{framing:'full',mood:'firm',lookX:.23},1-commune);alpha(O(t,140.802222,141.156111)*(1-commune),()=>{text('我们不能失去',1285,330,94,'#eee','center');text('大肥鱼',1290,560,205,'#eee','center')});mask(190,70,1540,805,commune,()=>photo('commune',190,70,1540,805,{cover:true,crop:[.025,.045,.95,.88]}),'y');return}
  if(t<153.35){
   const p=E(t,145.43,147.1),q=E(t,150,151.3);
   photo('commune',mix(190,90,p),mix(70,170,p),mix(1540,690,p),mix(805,390,p),{a:1-p*.72,cover:true});
   photo('desktop',mix(1960,810,p),170,1000,563,{a:p});
   live(140,410,420,t,{framing:'full',mood:'concerned',lookX:.4},q);return
  }
  if(t<RETIRE){const enter=E(t,153.35,154.8),withdraw=E(t,166.2,168.2);live(mix(140,100,enter),mix(410,170,enter),mix(420,540,enter),t,{framing:'full',mood:'firm',lookX:.4});photo('desktop',mix(810,850,withdraw),170,1000,563,{a:1-withdraw});return}
  const retire=E(t,RETIRE,SMALL),title=O(t,TITLE,TITLE+.48);
  live(mix(100,400,retire),mix(170,245,retire),mix(540,420,retire),t,{framing:'full',mood:'firm',lookX:.15});
  alpha(title,()=>{text('我们不能失去',1280,360,82,'#eee','center');text('大肥鱼',1280,550,182,'#fff','center')});
 }
 window.FullScenes=window.FullScenes||{};window.FullScenes.outro={duration:D,draw(ctx,t,A){K=window.P3FilmKit.use(ctx,A);K.S(()=>{ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();K.bg();closing(Math.max(0,Math.min(D-.0001,t)))})}};
})();

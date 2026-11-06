(()=>{
 'use strict';let K;const D=185.092708;
 function quotation(lines,author,work){const size=Math.min(96,1540/Math.max(...lines.map(s=>s.length))),gap=lines.length>4?105:130,top=430-(lines.length-1)*gap/2;lines.forEach((s,i)=>K.text(s,lines.length>3?160:960,top+i*gap,size,i===lines.length-1?'#fafafa':'#dedede',lines.length>3?'left':'center','"Noto Serif SC",serif',i===lines.length-1?900:650));K.text(author,1750,805,31,'#bbb','right');K.text(work,1750,850,31,'#bbb','right')}
 function relations(t){const{E,O,mix,S,alpha,bg,rect,line,path,text,img,photo,video,live,camera,mask,desk,link,mesh}=K;
  if(t<2){K.heading('人与人之间',t,2);return}
  if(t<23){live(480,-10,1000,t,{framing:'close',mood:'firm',lookX:0},O(t,2,3.2));return}
  if(t<43){const enter=E(t,23,24.2),leave=E(t,36,37.4);photo('p3_help_docs',210,200,1440,420,{a:enter*(1-leave*.45)});live(1420,530,330,t,{framing:'full',mood:'smile',lookX:-.5},O(t,35,36));return}
  if(t<63){photo('credit',275,50,1370,810);return}
  if(t<84){quotation(['工人阶级的解放','应该由工人阶级','自己去争取；'],'马克思 · 1864','《协会临时章程》');return}
  if(t<111){if(t<98)quotation(['改造客观世界，','也改造自己的主观世界'],'毛泽东 · 1937','《实践论》');else quotation(['共产主义革命','就是同传统的所有制关系','实行最彻底的决裂；'],'马克思、恩格斯 · 1848','《共产党宣言》');return}
  if(t<132){const p=E(t,122,124);photo('pet_states',220,75,1480,795,{a:1-p});live(480,-10,1000,t,{framing:'close',mood:'smile',lookX:0},p);return}
  if(t<151){live(480,-10,1000,t,{framing:'close',mood:'concerned',lookX:0});return}
  if(t<174){quotation(['新的更高的生产关系，','在它的物质存在条件','在旧社会的胎胞里成熟以前，','是决不会出现的。'],'马克思 · 1859','《〈政治经济学批判〉序言》');return}
  quotation(['生产力和社会关系','……','但是，实际上它们是','炸毁这个基础的物质条件。'],'马克思 · 1857—1858','《1857—1858年经济学手稿》')
 }
 window.FullScenes=window.FullScenes||{};window.FullScenes.p3c3={duration:D,draw(ctx,t,A){K=window.P3FilmKit.use(ctx,A);K.S(()=>{ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();K.bg();relations(Math.max(0,Math.min(D-.0001,t)))})}};
})();

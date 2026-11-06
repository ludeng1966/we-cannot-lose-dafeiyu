// Absolute-time drawings. A seek and a playback frame produce the same state.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),out=x=>1-(1-clamp(x))**3;
const mix=(a,b,p)=>a+(b-a)*p;
const LINK_SECONDS=.48,FLOW_BEAT=.92,BRANCH_BEAT=.65;
// V23 narration seconds, before the PV and chapter-title inserts.
// Keep the reveal beats in the visible parts of these diagrams.
const PLAYBACK_STAGES={
 'creator-gate':{},
 'knowledge-control':{1:517.16},
 'answer-control':{1:598.07,2:599.53,3:600.46},
 'national-individual':{1:660.66,2:661.68},
 'decision-separation':{},
 'horizontal-diffusion':{},
 'agent-framework':{1:1187.16,2:1190.67},
 'plugin-commons':{2:1245.86,3:1248.75},
 'cooperation-roles':{2:1575.01,3:1575.93},
 'collective-concentrated':{},
 'loss-two-processes':{2:1689.41},
 'practice-to-understanding':{1:1890.63,2:1891.55,3:1892.47},
 'relations-and-conditions':{},
};

export async function createInformationScenes(manifest,options={}){
 const response=await fetch(options.dataUrl||'information-plan.json',{cache:'no-store'});if(!response.ok)throw Error('信息画面计划载入失败');const plan=await response.json();
 const playbackStages=new Map();
 if(options.audioAtVisual)for(const row of plan.scenes){
  const edits=PLAYBACK_STAGES[row.id];
  if(edits)playbackStages.set(row.id,row.stages.map(([at],i)=>edits[i]??options.audioAtVisual(at)));
 }
 const bounds=[];let ctx,time,scene,stage,detail,stamp,cues;
 const step=i=>{const index=Math.min(i,scene.stages.length-1);return cues?.[index]??scene.stages[index][0];};
 const enter=(at,d=.65)=>out((time-at)/d),show=i=>enter(step(i));
 const link=at=>{const p=clamp((time-at)/LINK_SECONDS);return p*p*(3-2*p);};
 const arrival=at=>enter(at+LINK_SECONDS,.35);
 function alpha(a,fn){if(a<=0)return;ctx.save();ctx.globalAlpha*=a;fn();ctx.restore();}
 function text(str,x,y,size=38,{width=1600,align='left',color='#eee',serif=false,weight=400}={}){
  ctx.font=`${weight} ${size}px ${serif?'"Noto Serif SC"':'"Microsoft YaHei"'},sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;
  const lines=[];for(const paragraph of String(str).split('\n')){let line='';for(const ch of paragraph){if(line&&ctx.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;}lines.push(line);}
  const h=size*1.45;lines.forEach((s,i)=>{ctx.fillText(s,x,y+(i-(lines.length-1)/2)*h);const w=ctx.measureText(s).width;bounds.push({text:s,x:align==='center'?x-w/2:align==='right'?x-w:x,y:y+(i-(lines.length-1)/2)*h-size*.65,w,h:size*1.3});});
 }
 function path(points,p=1,{color='#bcbcbc',width=2,dash=[],arrow=false}={}){
  p=clamp(p);if(!p)return;const lengths=points.slice(1).map((b,i)=>Math.hypot(b[0]-points[i][0],b[1]-points[i][1]));let remaining=lengths.reduce((a,b)=>a+b,0)*p,end=points[0],prev=end;
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(...points[0]);
  for(let i=0;i<lengths.length&&remaining>0;i++){const a=points[i],b=points[i+1],q=clamp(remaining/lengths[i]);prev=a;end=[mix(a[0],b[0],q),mix(a[1],b[1],q)];ctx.lineTo(...end);remaining-=lengths[i];}ctx.stroke();ctx.setLineDash([]);
  if(arrow&&p>.01){const angle=Math.atan2(end[1]-prev[1],end[0]-prev[0]);ctx.beginPath();ctx.moveTo(...end);ctx.lineTo(end[0]-16*Math.cos(angle-.38),end[1]-16*Math.sin(angle-.38));ctx.moveTo(...end);ctx.lineTo(end[0]-16*Math.cos(angle+.38),end[1]-16*Math.sin(angle+.38));ctx.stroke();}ctx.restore();
 }
 const line=(x1,y1,x2,y2,p=1,opts={})=>path([[x1,y1],[x2,y2]],p,opts);
 function rect(x,y,w,h,{fill='#090909',stroke='#777',radius=5}={}){ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
 function dot(x,y,r=7,color='#eee'){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 function person(x,y,s=1,color='#ddd'){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-27,15,0,Math.PI*2);ctx.moveTo(-29,38);ctx.lineTo(-23,3);ctx.quadraticCurveTo(0,-12,23,3);ctx.lineTo(29,38);ctx.moveTo(-14,18);ctx.lineTo(-14,65);ctx.moveTo(14,18);ctx.lineTo(14,65);ctx.stroke();ctx.restore();}
 function document(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-32,-44,64,88,{stroke:'#ddd',fill:'#070707'});for(let i=0;i<3;i++)line(-19,-17+i*18,19,-17+i*18,1,{color:'#aaa'});ctx.restore();}
 function transfer(a,b,at,duration=1.2){const p=clamp((time-at)/duration);if(time<at||time>at+duration+.25)return;alpha(Math.min(1,(time-at)*6,(at+duration+.25-time)*6),()=>document(mix(a[0],b[0],p),mix(a[1],b[1],p),.35));}
 function node(label,x,y,{w=270,h=86,on=1,solid=false,size=37}={}){alpha(on,()=>{rect(x-w/2,y-h/2,w,h,{stroke:solid?'#eee':'#686868',fill:solid?'#e7e7e7':'#080808'});text(label,x,y,size,{align:'center',width:w-30,color:solid?'#050505':'#eee'});});}
 function heading(){text(scene.title,108,115,58,{serif:true,weight:600,width:1700});alpha(enter(stamp,.4),()=>text(detail[1],110,214,30,{color:'#aaa',width:1680}));if(scene.id==='horizontal-diffusion')text('设想中的发展路径',1800,214,29,{align:'right',color:'#bbb'});}
 function gate(){
  const y=495,toolAt=step(0)+.3,creationAt=step(1)+.35,p=arrival(creationAt),bar=show(2);person(260,y,1.25);text('普通劳动者',260,625,36,{align:'center'});
  node('技术工具',840,y,{w:300,on:arrival(toolAt)});node('自主创造',1530,y,{w:300,on:p,solid:stage>=3});
  line(335,y,680,y,link(toolAt),{arrow:true});line(1000,y,1370,y,link(creationAt),{arrow:true,dash:bar?[9,9]:[]});
  const tokenX=mix(350,1145,p);dot(tokenX,y,10);
  alpha(bar,()=>{line(1190,340,1190,660,1,{width:4,color:'#aaa'});text('入口控制',1190,302,33,{align:'center'});text('谁决定可以创造什么？',1190,710,35,{align:'center',width:750});});
  const leftAt=step(3),rightAt=leftAt+FLOW_BEAT;
  path([[840,550],[840,665],[550,665],[550,697]],link(leftAt),{arrow:true,color:'#888'});
  alpha(arrival(leftAt),()=>text('创造能力',550,745,34,{align:'center'}));
  path([[1540,550],[1540,680]],link(rightAt),{arrow:true,color:'#888'});
  alpha(arrival(rightAt),()=>text('主体意识',1550,745,34,{align:'center'}));
 }
 function separation(){
  const a=show(1),b=show(2),c=show(3);text('社会积累的知识',330,320,40,{align:'center'});for(let i=0;i<5;i++)alpha(a,()=>document(200+i*66,465+(i%2)*12,.78));
  node('技术体系',960,470,{on:show(0),w:350,h:140,size:48});line(490,470,765,470,link(step(1)),{arrow:true});
  person(1580,465,1.45);text('劳动者',1580,612,37,{align:'center'});line(1145,470,1490,470,link(step(1)+BRANCH_BEAT),{arrow:true});
  alpha(arrival(step(1)+BRANCH_BEAT),()=>text('运用',1300,425,30,{align:'center',color:'#aaa'}));
  node('控制权',960,670,{w:350,on:b});
  line(960,615,960,548,link(step(2)+BRANCH_BEAT),{arrow:true});
  alpha(arrival(step(2)+BRANCH_BEAT),()=>text('控制技术的条件',1300,670,34,{color:'#aaa',width:490}));
  alpha(c,()=>{path([[330,570],[330,755],[1580,755],[1580,665]],c,{arrow:true,color:'#eee'});text('获得 · 理解 · 运用',430,710,34,{width:350});});
 }
 function pipeline(){
  const labels=scene.nodes||['需求','解释','代码','执行','反馈'],y=475;
  for(let i=0;i<labels.length;i++){
   const x=220+i*370,at=i===0?step(0):i===4?step(3):step(2)+(i-1)*FLOW_BEAT;
   const on=i?arrival(at):enter(at);
   if(i)line(x-255,y,x-120,y,link(at),{arrow:true});
   node(labels[i],x,y,{w:235,on,solid:i===4&&stage>=3});
   if(i>0&&i<4)alpha(on,()=>text('知识',x,610,29,{align:'center',color:'#777'}));
  }
  alpha(show(4),()=>{path([[220,550],[220,705],[1700,705],[1700,550]],show(4),{arrow:true});text('AI 辅助理解、诊断与修改',960,680,38,{align:'center'});});
 }
 function compare(){
  const learningMotive=scene.id==='learning-motive',national=scene.id==='national-individual';
  const rightStart=step(scene.stages.length-1);
  line(960,300,960,770,1,{color:'#444'});
  text(scene.id==='answer-control'?'结果的交付':learningMotive?'外部要求':'技术体系',500,320,38,{align:'center',color:'#aaa'});
  text(scene.id==='answer-control'?'工具的掌握':learningMotive?'自身需要':'人的能力',1420,320,38,{align:'center',color:'#eee'});
  for(let i=0;i<3;i++){
   const y=435+i*125,offset=i?BRANCH_BEAT+(i-1)*FLOW_BEAT:0;
   const leftAt=learningMotive?step(0)+offset:step(i),rightAt=rightStart+offset;
   if(i&&!national)line(500,y-82,500,y-48,link(leftAt),{arrow:true});
   if(i)line(1420,y-82,1420,y-48,link(rightAt),{arrow:true});
   node(scene.left[i],500,y,{w:520,h:80,on:i&&!national?arrival(leftAt):enter(leftAt),size:39});
   node(scene.right[i],1420,y,{w:520,h:80,on:i?arrival(rightAt):enter(rightAt),size:39,solid:learningMotive&&i===0});
  }
  if(national)path([[225,395],[205,395],[205,725],[225,725]],show(2),{color:'#777'});
  alpha(enter(rightStart+BRANCH_BEAT+2*FLOW_BEAT,.35),()=>text('≠',960,560,65,{align:'center',color:'#bbb'}));
 }
 function bridge(){
  const p=show(2),cross=show(3),awakening=scene.id==='practice-awareness';
  text(awakening?'亲自创造':'认识',350,380,64,{align:'center',serif:true});text(awakening?'认识社会关系':'实践',1550,380,64,{align:'center',serif:true});
  line(120,600,680,600,1,{width:3});line(1240,600,1800,600,1,{width:3});
  text(awakening?'组织知识、合作劳动':'知识 · 解释 · 答案',350,470,33,{align:'center',color:'#aaa'});text(awakening?'追问谁决定劳动与成果':'操作 · 执行 · 检验',1550,470,33,{align:'center',color:'#aaa'});
  alpha(show(1)*(1-p),()=>{line(940,510,980,550,1,{width:3});line(980,510,940,550,1,{width:3});text(awakening?'矛盾逐渐可见':'尚待跨越',960,710,34,{align:'center',color:'#aaa'});});
  line(680,600,1240,600,p,{width:4,color:'#eee'});alpha(p,()=>{text(awakening?'自主实践与现实限制':'Agent · 工具 · 反馈',960,548,33,{align:'center',width:520});line(680,630,1240,630,1,{color:'#555'});});
  const x=mix(410,1510,cross);person(x,535,1.05);alpha(cross,()=>text(awakening?'社会意识的变化':'把知识转化为劳动',960,745,42,{align:'center',serif:true}));
 }
 function ownership(){
  const separation=scene.id==='decision-separation';
  scene.rows.forEach((row,i)=>{
   const y=355+i*155,at=step(i+1);
   text(row[0],155,y,42,{serif:true});
   line(435,y,910,y,link(at),{arrow:true});
   alpha(arrival(at),()=>{text(row[1],1010,y,46,{width:570});dot(920,y,5);});
   line(150,y+72,1740,y+72,1,{color:'#333'});
  });
  alpha(show(scene.stages.length-1),()=>{line(1710,305,1710,725,1,{width:3});text(separation?'直接劳动者':'共同考察',1710,765,33,{align:'center',color:'#bbb'});});
 }
 function distribution(){
  const roles=scene.roles;
  const center=960, toolBottom=389, railY=476, roleTop=538, roleBottom=646;
  const left=272, spacing=344;
  const accent='#b98d64', muted='#817a71';
  rect(762,285,396,toolBottom-285,{fill:'#171512',stroke:accent,radius:8});
  text('开源工具',center,337,48,{align:'center',serif:true,weight:700});
  line(center,toolBottom,center,railY,enter(step(1)),{color:accent,width:2.5});
  line(center,railY,left,railY,enter(step(1)+.2),{color:accent,width:2.5});
  line(center,railY,left+spacing*(roles.length-1),railY,enter(step(1)+.2),{color:accent,width:2.5});
  roles.forEach((role,i)=>{
   const x=left+i*spacing, at=step(1)+.85+i*FLOW_BEAT;
   line(x,railY,x,roleTop-12,link(at),{color:accent,width:2.5,arrow:true});
   alpha(arrival(at),()=>{
    rect(x-122,roleTop,244,roleBottom-roleTop,{fill:'#101010',stroke:'#66605a',radius:8});
    text(role,x,(roleTop+roleBottom)/2,42,{align:'center',weight:600});
   });
  });
  const sharedAt=step(3);
  roles.forEach((_,i)=>{
   const x=left+i*spacing,at=sharedAt+i*BRANCH_BEAT;
   line(x,roleBottom,x,706,link(at),{color:muted,width:2});
   alpha(arrival(at),()=>dot(x,706,4,accent));
  });
  const railAt=sharedAt+roles.length*BRANCH_BEAT;
  line(left,706,left+spacing*(roles.length-1),706,link(railAt),{color:muted,width:2});
  alpha(arrival(railAt),()=>text('分享 · 使用 · 改进',center,762,31,{align:'center',color:'#ded1bf',weight:600}));
 }
 function learning(){
  const n=scene.id==='learning-staircase'?5:4,items=scene.id==='learning-staircase'?['环境','API','文档与代码','修改与检验','问题反思']:['共同开发','共享成果','亲身经验','社会认识'];
  for(let i=0;i<n;i++){
   const x=210+i*(1500/(n-1)),y=690-i*85,at=step(i);
   if(i)path([[x-1500/(n-1)+80,y+85],[x-150,y+85],[x-150,y],[x-85,y]],link(at),{arrow:true});
   alpha(i?arrival(at):enter(at),()=>{document(x,y,.65);text(items[i],x,y+100,34,{align:'center',width:310});});
  }
  alpha(show(scene.stages.length-1),()=>text(scene.id==='learning-staircase'?'愿望 → 学习 → 行动 → 反馈':'实践经验，成为新的认识基础',107,305,43,{serif:true,width:1690}));
 }
 function framework(){
  node('大模型',400,485,{w:370,h:150,solid:true,size:50});
  alpha(arrival(step(1)),()=>{rect(715,325,420,360,{stroke:'#aaa'});text('运行框架',925,390,43,{align:'center'});text('组织任务\n选择工具\n接收反馈',925,535,33,{align:'center'});});
  const labels=['工具','文件','实际任务'];labels.forEach((l,i)=>{const y=335+i*165,at=step(1)+(i+1)*FLOW_BEAT;path([[1135,485],[1270,485],[1270,y],[1410,y]],link(at),{arrow:true});node(l,1580,y,{on:arrival(at),w:320,h:100});});
  line(595,465,700,465,link(step(1)),{arrow:true});
  const feedbackAt=Math.max(step(2),step(1)+(labels.length+1)*FLOW_BEAT);
  line(700,520,595,520,link(feedbackAt),{arrow:true,dash:[7,7]});
 }
 function pool(){
  const p=show(1);for(let i=0;i<4;i++){const x=230+(i%2)*210,y=370+Math.floor(i/2)*240;alpha(enter(step(0)+i*BRANCH_BEAT,.42),()=>{person(x,y,.7);text(['插件','模型','框架','工具'][i],x,y+93,32,{align:'center'});});line(x+65,y,790,490,link(step(1)+i*BRANCH_BEAT),{arrow:true,color:'#777'});}
  node('共同积累',980,490,{w:360,h:220,on:p,size:48,solid:true});text('源代码与实践经验',980,660,32,{align:'center',color:'#aaa'});
  for(let i=0;i<3;i++){const y=335+i*175,at=step(2)+i*FLOW_BEAT;path([[1170,490],[1300,490],[1300,y],[1390,y]],link(at),{arrow:true});node(['新的作品','继续修改','再次分享'][i],1570,y,{w:330,on:arrival(at)});}
  path([[1560,730],[1560,770],[980,770],[980,715]],show(3),{arrow:true,dash:[8,8]});
 }
 function funnel(){
  const collective=scene.id==='collective-concentrated',left=['劳动','研究','文化','实践'];
  const gatherAt=step(1)+(left.length-1)*BRANCH_BEAT,gateAt=Math.max(step(2)+.3,gatherAt+FLOW_BEAT),personAt=gateAt+FLOW_BEAT;
  left.forEach((label,i)=>{const y=300+i*125;alpha(enter(step(0)+i*BRANCH_BEAT,.42),()=>{document(220,y,.55);text(label,295,y,35);});path([[455,y],[650,y],[780,485]],link(step(1)+i*BRANCH_BEAT),{arrow:true,color:'#888'});});
  node('社会知识',970,485,{w:350,h:180,on:arrival(gatherAt),solid:true,size:48});
  const gate=arrival(gateAt);
  node(collective?'关键生产条件':'算力 · 平台 · 入口',1515,485,{w:500,h:180,on:gate,size:40});line(1155,485,1250,485,link(gateAt),{arrow:true});alpha(gate,()=>text('经由',1203,440,26,{align:'center',color:'#aaa'}));
  alpha(gate,()=>{path([[1270,355],[1270,300],[1765,300],[1765,355]],gate,{width:3,color:'#aaa'});text('集中占有',1515,265,33,{align:'center'});});
  line(1515,585,1515,690,link(personAt),{arrow:true});
  alpha(arrival(personAt),()=>person(1515,725,.55));
  alpha(show(scene.stages.length-1),()=>{path([[220,765],[220,795],[1750,795],[1750,765]],1,{color:'#666'});text('共同创造',760,735,39,{serif:true,align:'center'});text('≠',1010,735,48,{align:'center'});text('共同支配',1260,735,39,{serif:true,align:'center'});});
 }
 function open(){
  const p=show(1),x=mix(960,265,p);text('免费',x,470,mix(112,68,p),{align:'center',serif:true});alpha(1-p,()=>text('价格',960,620,36,{align:'center',color:'#999'}));
  ['阅读源代码','修改工具','分享成果','继续发展'].forEach((l,i)=>{
   const px=620+i*350,at=step(1)+BRANCH_BEAT+(i-1)*FLOW_BEAT;
   if(i)line(px-245,435,px-65,435,link(at),{arrow:true});
   alpha(i?arrival(at):p,()=>{document(px,430,.8);text(l,px,565,34,{align:'center'});});
   if(i)transfer([px-350,430],[px,430],at,.7);
  });
  alpha(p,()=>{line(440,330,440,665,1,{color:'#555'});text('劳动组织方式',1180,710,44,{align:'center',serif:true});});
 }
 function cycle(){
  const reuse=scene.id==='tools-become-conditions',pos=[[420,360],[1440,360],[1440,665],[420,665]],labels=reuse?['第一次创造','工具被接续','产生新成果','扩大创造条件']:['提出问题','贡献与修改','使用与反馈','分享成果'];
  // The narration conform can skip the original opening stages entirely.
  const sceneElapsed=reuse?(options.elapsed?.(scene)??(time-scene.start)):0;
  const firstLink=time-sceneElapsed+.85;
  const beat=1.05,closingLink=reuse?firstLink+3*beat:step(3)+FLOW_BEAT;
  const centerOn=reuse?arrival(closingLink+.12):1;
  node(reuse?'共同生产条件':'共同需要',930,510,{w:360,h:120,on:centerOn,solid:true,size:43});
  pos.forEach(([x,y],i)=>{
   const at=step(i),next=pos[(i+1)%4];
   const incoming=reuse?firstLink+(i-1)*beat:at;
   const outgoing=reuse?firstLink+i*beat:i===3?closingLink:step(i+1);
   const on=i?arrival(incoming):reuse?enter(firstLink-.67,.38):enter(at);
   node(labels[i],x,y,{w:390,h:100,on,size:36});
   const dx=Math.sign(next[0]-x)*205,dy=Math.sign(next[1]-y)*60;
   path([[x+dx,y+dy],[next[0]-dx,next[1]-dy]],link(outgoing),{arrow:true});
  });
  const noteAt=Math.max(step(scene.stages.length-1),closingLink+FLOW_BEAT);
  line(930,575,930,730,link(noteAt),{arrow:true,dash:[7,8]});
  alpha(arrival(noteAt),()=>text(reuse?'成为下一轮创造的起点':'以共同约定决定成果用途',930,770,33,{align:'center',width:720}));
 }
 function loss(){
  const cut=show(4);text('技术性能与研究',135,340,39,{serif:true});text('人民参与的社会过程',135,610,39,{serif:true});
  ['代码','接口','已有知识'].forEach((l,i)=>node(l,850+i*365,345,{w:280,on:show(Math.min(i+1,3)),size:35}));line(700,420,1780,420,show(3),{arrow:true});alpha(show(3),()=>text('仍可能继续发展',1260,475,34,{align:'center',color:'#aaa'}));
  const labels=['接触','掌握','改造'];labels.forEach((l,i)=>{
   const x=850+i*365,at=step(1)+BRANCH_BEAT+(i-1)*FLOW_BEAT;
   if(i)line(x-225,615,x-145,615,link(at),{arrow:true});
   node(l,x,615,{w:280,on:i?arrival(at):show(1),size:38});
  });
  alpha(cut,()=>{rect(1043,550,35,125,{fill:'#000',stroke:null});line(1030,560,1090,670,1,{width:4});line(1090,560,1030,670,1,{width:4});text('入口受阻',1060,745,35,{align:'center'});});
 }
 function accumulation(){
  const left=['分享','答疑','插件'],right=['可能的新使用者','自主解题能力','继续开发'],block=show(5);
  for(let i=0;i<3;i++){const y=335+i*150,at=step(i+1);node(left[i],310,y,{on:enter(at),w:280});line(460,y,710,y,link(at+BRANCH_BEAT),{arrow:true});node(right[i],960,y,{on:arrival(at+BRANCH_BEAT),w:470});line(1210,y,1430,485,link(step(4)+i*BRANCH_BEAT),{arrow:true,color:'#777'});}
  node(block>.5?'下一轮创造\n可能受阻':'下一轮创造',1630,485,{w:370,h:160,on:arrival(step(4)),solid:block<.5,size:38});
  alpha(block,()=>{ctx.fillStyle='#030303';ctx.fillRect(1295,275,55,455);line(1320,280,1320,725,1,{width:4});text('如果入口被垄断',1320,765,33,{align:'center',width:650});});
 }
 function possibilities(){
  const p=show(1),q=show(3);text('已有成果',400,325,43,{align:'center',serif:true});text('未能发生的创造',1350,325,43,{align:'center',serif:true});line(835,310,835,760,1,{color:'#444'});
  ['用户','插件','开发者'].forEach((l,i)=>{alpha(enter(step(0)+i*BRANCH_BEAT,.42),()=>{document(210,445+i*130,.55);text(l,310,445+i*130,39);line(500,445+i*130,650,445+i*130,1,{color:'#888'});});});
  ['可能成长的新人','可能诞生的项目','可能形成的协作'].forEach((l,i)=>{alpha(enter(step(1)+i*BRANCH_BEAT,.42),()=>{rect(1020,405+i*120,650,85,{stroke:'#777'});ctx.setLineDash([5,8]);ctx.strokeStyle='#999';ctx.strokeRect(1005,390+i*120,680,115);ctx.setLineDash([]);text(l,1345,448+i*120,36,{align:'center'});});});
  alpha(q,()=>text('机会受阻，也有社会代价',960,775,39,{align:'center',serif:true}));
 }
 function relations(){
  const ys=[690,490,290],labels=['生产力与创造能力','劳动与成果的组织关系','制度与上层建筑'];
  labels.forEach((l,i)=>{
   const at=step(i);
   if(i)line(960,ys[i-1]-65,960,ys[i]+65,link(at),{arrow:true});
   alpha(i?arrival(at):enter(at),()=>{rect(340+i*110,ys[i]-58,1240-i*220,116,{stroke:'#888'});text(l,960,ys[i],43,{align:'center',serif:true});});
  });
  alpha(arrival(step(1)),()=>text('组织需要',1025,590,27,{color:'#aaa'}));alpha(arrival(step(2)),()=>text('制度要求',1025,390,27,{color:'#aaa'}));
  path([[1400,290],[1750,290],[1750,490],[1490,490]],link(step(3)),{arrow:true,color:'#bbb'});
  alpha(arrival(step(3)),()=>text('维护与限制',1750,605,31,{align:'center',width:230}));
 }
 const renderers={gate,separation,pipeline,compare,bridge,ownership,distribution,learning,framework,pool,funnel,open,cycle,loss,accumulation,possibilities,relations};
 for(const s of plan.scenes){if(!renderers[s.kind]||s.start>=s.end||s.stages.some((v,i)=>v[0]<s.start||v[0]>=s.end||(i&&v[0]<=s.stages[i-1][0])))throw Error('信息场景无效：'+s.id);}
 return{plan,active:n=>plan.scenes.find(s=>n>=s.start&&n<s.end),draw(target,n,audioTime){scene=plan.scenes.find(s=>n>=s.start&&n<s.end);if(!scene)return null;ctx=target;time=n;bounds.length=0;stage=Math.max(0,scene.stages.findLastIndex(s=>n>=s[0]));detail=scene.stages[stage];stamp=detail[0];
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.fillStyle='#030303';ctx.fillRect(0,0,1920,952);ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();
  ctx.globalAlpha=enter(scene.start,.35)*out((scene.end-n)/.35);heading();
  cues=Number.isFinite(audioTime)?playbackStages.get(scene.id):null;
  if(cues)time=audioTime;
  renderers[scene.kind]();ctx.restore();
  return{id:scene.id,kind:scene.kind,stage,start:scene.start,end:scene.end,visibleTexts:bounds.map(b=>b.text),outOfBounds:bounds.filter(b=>b.x<40||b.x+b.w>1880||b.y<20||b.y+b.h>935)};
 }};
}

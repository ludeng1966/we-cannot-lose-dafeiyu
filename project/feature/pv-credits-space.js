/* Independent transparent typography in the existing PV orbit space.
 * No cards, panel backgrounds, full-page plates, clock accumulation or beat input.
 * Each source title, credit, heading and empty slot owns one cached alpha texture.
 */
const W=1920,H=1080;
const PAPER='#eeeae1',SECONDARY='#bab8b0',RED='#c43b35';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};

export function createPVTextCredits({data={},space,fontFamily='"PV Serif",serif',sansFamily='"PV Sans",sans-serif',monoFamily='"PV Mono",monospace'}={}){
  if(typeof space?.drawPlane!=='function')throw new Error('PV text credits require the existing space.drawPlane');
  const cache=new Map(),sprites=[];
  let destroyed=false;
  const authored=data.visualPhases||{};
  const phases={
    books:{start:27.5,end:31,...authored.books},videos:{start:31,end:36.5,...authored.videos},
    credits:{start:36.5,end:41.5,...authored.credits},music:{start:41.5,end:44.5,...authored.music},
    thanks:{start:44.5,end:46.5,...authored.thanks,finalExit:true},
    ...Object.fromEntries(Object.entries(authored).filter(([key])=>key.startsWith('literature')||key==='statistics'))
  };
  const books=Array.isArray(data.references?.books)?data.references.books:[];
  const videos=Array.isArray(data.references?.videos)?data.references.videos:[];
  const credits=(Array.isArray(data.credits)?data.credits:[]).filter(row=>!/token/i.test(String(row.label)));
  const musicSlots=Array.isArray(data.musicSlots)?data.musicSlots:[];
  const songs=musicSlots.filter(row=>!row.placeholder&&row.title);
  const thanks=Array.isArray(data.thanksSlots)?data.thanksSlots:[];
  const statistics=data.statistics||[];
  const literature=data.references?.literature||[];
  const lastReference=Object.keys(phases).filter(stage=>stage.startsWith('literature')).at(-1)||'books';
  phases.referenceHeading={start:phases.books.start,end:phases[lastReference].end};

  function canvas(){return document.createElement('canvas');}
  function setFont(ctx,size,family,weight=600){ctx.font=`${weight} ${size}px ${family}`;}
  function wrap(ctx,value,maxWidth){
    const result=[];
    for(const paragraph of String(value).split('\n')){
      const chunks=paragraph.match(/[A-Za-z0-9_.]+(?:[ -][A-Za-z0-9_.]+)*|[\s\S]/gu)||[''];
      let line='';
      const append=chunk=>{
        if(!line&&/^\s+$/.test(chunk))return;
        if(line&&ctx.measureText(line+chunk).width>maxWidth&&!/^[，。！？；：、》〉）】,.!?;:)]$/.test(chunk)){
          result.push(line.trimEnd());line=chunk.trimStart();
        }else line+=chunk;
      };
      for(const chunk of chunks){
        if(ctx.measureText(chunk).width>maxWidth){for(const character of Array.from(chunk))append(character);}
        else append(chunk);
      }
      result.push(line.trimEnd());
    }
    return result.length?result:[''];
  }
  function textTexture(value,options={}){
    const o={size:60,minSize:36,maxWidth:1200,maxLines:2,family:fontFamily,weight:600,
      color:PAPER,stroke:false,strokeWidth:1.3,eyebrow:'',eyebrowColor:RED,eyebrowSize:24,...options};
    const key=JSON.stringify([String(value),o]);
    if(cache.has(key))return cache.get(key);
    const image=canvas(),ctx=image.getContext('2d');
    let size=o.size,lines=[];
    for(let attempt=0;attempt<30;attempt++){
      setFont(ctx,size,o.family,o.weight);lines=wrap(ctx,value,o.maxWidth);
      if(lines.length<=o.maxLines||size<=o.minSize)break;
      size=Math.max(o.minSize,size*.95);
    }
    // Preserve every character even if a future source needs more lines.
    const pad=Math.ceil(Math.max(18,size*.16)),leading=size*1.18;
    const lineWidth=Math.max(1,...lines.map(line=>ctx.measureText(line).width));
    setFont(ctx,o.eyebrowSize,sansFamily,500);
    const eyebrowWidth=o.eyebrow?ctx.measureText(o.eyebrow).width:0;
    const eyebrowHeight=o.eyebrow?o.eyebrowSize+17:0;
    image.width=Math.ceil(Math.max(lineWidth,eyebrowWidth)+pad*2);
    image.height=Math.ceil(pad*2+eyebrowHeight+leading*lines.length);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    if(o.eyebrow){
      setFont(ctx,o.eyebrowSize,sansFamily,500);ctx.fillStyle=o.eyebrowColor;
      ctx.fillText(o.eyebrow,pad,pad+o.eyebrowSize*.85);
    }
    setFont(ctx,size,o.family,o.weight);ctx.fillStyle=o.color;ctx.strokeStyle=o.color;
    ctx.lineWidth=o.strokeWidth;ctx.lineJoin='round';
    lines.forEach((line,index)=>{
      const y=pad+eyebrowHeight+size*.93+index*leading;
      if(o.stroke)ctx.strokeText(line,pad,y);else ctx.fillText(line,pad,y);
    });
    const result={image,width:image.width,height:image.height,text:String(value),fontSize:size,lines};
    cache.set(key,result);return result;
  }
  function emptySlotTexture(index,value=''){
    const key=`slot:${String(index)}:${String(value)}`;
    if(cache.has(key))return cache.get(key);
    const image=canvas(),ctx=image.getContext('2d');
    image.width=value?330:160;image.height=value?100:56;
    ctx.textBaseline='middle';setFont(ctx,25,monoFamily,500);ctx.fillStyle=RED;
    ctx.fillText(String(index).padStart(2,'0'),10,25);
    if(value){
      const full=String(value);let size=38;setFont(ctx,size,fontFamily,500);
      while(ctx.measureText(full).width>300&&size>20){size--;setFont(ctx,size,fontFamily,500);}
      ctx.fillStyle=PAPER;ctx.fillText(full,10,69);
    }else{
      // Only the explicitly requested short blank, with no frame or table rule.
      ctx.strokeStyle=SECONDARY;ctx.globalAlpha=.52;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(52,25);ctx.lineTo(148,25);ctx.stroke();
    }
    const result={image,width:image.width,height:image.height,text:String(value),fontSize:value?38:25,lines:value?[String(value)]:[]};
    cache.set(key,result);return result;
  }
  function add(stage,id,texture,pose={}){
    sprites.push({stage,id,texture,x:960,y:540,depth:1100,yaw:0,pitch:0,roll:0,
      opacity:1,drift:1,seed:sprites.length*.83+1,...pose});
  }
  function heading(stage,value,x,y,size=98){
    add(stage,`${stage}-heading`,textTexture(value,{size,minSize:size,maxWidth:1400,maxLines:1,weight:600}),
      {x,y,depth:1160,roll:-.022,opacity:.94,drift:.7});
  }
  function ghost(stage,value,x,y,size=500){
    add(stage,`${stage}-ghost`,textTexture(value,{size,minSize:size,maxWidth:1850,maxLines:1,weight:700,stroke:true,strokeWidth:1.5}),
      {x,y,depth:1610,yaw:-.10,pitch:.02,roll:.035,opacity:.12,drift:.55});
  }

  // The heading stays in the same space as successive rows pass beneath it.
  heading('referenceHeading','参考文献',485,147,94);
  const referenceRows=[...books,...literature];
  referenceRows.forEach((row,index)=>{
    const stage=index<books.length?'books':'literature'+(Math.floor((index-books.length)/3)+1);
    if(!phases[stage])return;
    const line=index<books.length?index:(index-books.length)%3;
    const texture=textTexture(row,{
      size:stage==='books'?62:52,minSize:44,maxWidth:1080,maxLines:2,
      eyebrow:String(index+1).padStart(2,'0'),eyebrowSize:24
    });
    const pageNumber=stage==='books'?1:Number(stage.slice('literature'.length))+1;
    if(line===0){
      add(stage,'reference-index-'+pageNumber,textTexture('ref['+String(pageNumber).padStart(2,'0')+']',{
        size:28,maxLines:1,family:monoFamily,color:RED
      }),{x:874,y:157,depth:1170,opacity:.74,drift:.25,sweep:true});
    }
    add(stage,'reference-'+(index+1),texture,{
      x:220+line*47+texture.width*.5,y:342+line*213,depth:1160,
      yaw:.035*(line-1),roll:.012*(line-1),drift:.35,sweep:true
    });
  });

  // Each B-site title keeps its own alpha texture and independently angled plane.
  ghost('videos','参考',1080,560,550);
  heading('videos','视频参考',970,105,96);
  const videoPoses=[
    {x:470,y:292,depth:1115,yaw:.09,roll:-.026},
    {x:1370,y:245,depth:1155,yaw:-.14,roll:.036},
    {x:520,y:485,depth:1055,yaw:.12,roll:.019},
    {x:1320,y:425,depth:1090,yaw:-.08,roll:-.024},
    {x:430,y:670,depth:1150,yaw:.08,roll:-.036},
    {x:1400,y:625,depth:1060,yaw:-.14,roll:.022},
    {x:530,y:875,depth:1100,yaw:.13,roll:.024},
    {x:1310,y:850,depth:1165,yaw:-.09,roll:-.025}
  ];
  videos.forEach((title,index)=>{
    const base=videoPoses[index]||{x:470+(index%2)*880,y:290+Math.floor(index/2)*180,depth:1120};
    add('videos',`video-${index+1}`,textTexture(title,{size:48,minSize:38,maxWidth:730,maxLines:3,
      eyebrow:String(index+1).padStart(2,'0'),eyebrowSize:22}),{pitch:(index%3-1)*.022,...base});
  });

  // Roles and names share a single transparent object per credit, at unequal scales.
  ghost('credits','制作',1030,540,550);
  heading('credits','制作署名',1470,140,88);
  const creditPoses=[
    {x:625,y:330,depth:1070,yaw:.09,roll:-.034,size:118,width:970},
    {x:1420,y:395,depth:1150,yaw:-.15,roll:.037,size:91,width:790},
    {x:595,y:650,depth:1130,yaw:.12,roll:.022,size:102,width:980},
    {x:1360,y:700,depth:1085,yaw:-.10,roll:-.019,size:67,width:820}
  ];
  credits.forEach((row,index)=>{
    const base=creditPoses[index]||{x:650+(index%2)*700,y:300+index*140,depth:1140,size:80,width:900};
    add('credits',`credit-${index+1}`,textTexture(String(row.value??''),{size:base.size,minSize:base.size*.85,maxWidth:base.width,maxLines:2,
      eyebrow:String(row.label??''),eyebrowColor:SECONDARY,eyebrowSize:29}),base);
  });
  if(data.review?.names?.length){
    add('credits','review',textTexture(data.review.names.join('\n'),{
      size:74,maxWidth:540,maxLines:2,eyebrow:data.review.label,eyebrowColor:SECONDARY,eyebrowSize:36
    }),{x:465,y:917,depth:1130,yaw:.035,roll:.009,drift:.55});
  }

  if(statistics.length){
    const [token,...counts]=statistics;
    add('statistics','token',textTexture(token.value,{
      size:164,minSize:145,maxWidth:1490,maxLines:1,family:monoFamily,color:RED,
      eyebrow:token.label,eyebrowColor:PAPER,eyebrowSize:48
    }),{x:960,y:396,depth:1110,drift:.35});
    counts.forEach((row,index)=>add('statistics','count-'+index,textTexture(row.value,{
      size:108,maxLines:1,family:monoFamily,eyebrow:row.label,eyebrowColor:PAPER,eyebrowSize:39
    }),{x:670+index*580,y:740,depth:1130,drift:.45}));
  }

  heading('music','使用配乐',960,125,86);
  const musicRows=Math.ceil(songs.length/2);
  const spacing=Math.min(106,700/Math.max(1,musicRows-1));
  songs.forEach((row,index)=>add('music','music-'+(index+1),textTexture(row.title,{
    size:Math.min(52,spacing*.65),minSize:34,maxWidth:660,maxLines:1
  }),{x:index<musicRows?555:1345,y:265+(index%musicRows)*spacing,depth:1140,drift:.4}));

  ghost('thanks','感谢',690,540,540);
  heading('thanks','特别鸣谢',680,327,149);
  const thanksPoses=[
    {x:225,y:655,depth:1120,roll:-.045},
    {x:620,y:590,depth:1190,roll:.025},
    {x:1050,y:655,depth:1140,roll:-.028},
    {x:1190,y:840,depth:1180,roll:.05},
    {x:825,y:955,depth:1110,roll:-.015},
    {x:435,y:905,depth:1160,roll:.037},
    {x:180,y:825,depth:1200,roll:-.025}
  ];
  thanks.forEach((slot,index)=>{
    const base=thanksPoses[index]||{x:250+index*160,y:800,depth:1150};
    add('thanks',`thanks-slot-${slot.index??index+1}`,emptySlotTexture(slot.index??index+1,slot.value||''),
      {yaw:index%2?.13:-.11,pitch:(index%3-1)*.035,opacity:.88,...base});
  });

  function phaseOpacity(sprite,t){
    const p=phases[sprite.stage];
    if(sprite.sweep){
      return smooth((t-p.start+.1)/.36)*(1-smooth((t-p.end+.24)/.34));
    }
    const incoming=smooth((t-(p.start-.25))/.5);
    // The last thanks plane leaves before the authored title, without a cut.
    const exitStart=p.finalExit?p.end-.5:p.end-.25;
    return incoming*(1-smooth((t-exitStart)/.5));
  }
  function cameraAt(t){
    const time=t-phases.books.start;
    return {x:76*Math.sin(time*.19-.3),y:27*Math.sin(time*.13+.4),
      z:92*Math.sin(time*.12-.4),yaw:.045*Math.sin(time*.11),roll:.008*Math.sin(time*.13)};
  }
  function poseAt(sprite,t,camera){
    const drift=sprite.drift,seed=sprite.seed;
    const phase=phases[sprite.stage];
    const arrival=sprite.sweep?smooth((t-phase.start+.1)/.48):smooth((t-phase.start+.45)/.95);
    const departure=sprite.sweep?smooth((t-phase.end+.46)/.58):smooth((t-phase.end+.7)/1.05);
    const slide=sprite.sweep?190*(1-arrival)-235*departure:0;
    const depth=sprite.depth+camera.z+drift*7*Math.sin(t*.12+seed)+(1-arrival)*210-departure*65;
    const dolly=sprite.depth/depth;
    return {
      x:W/2+(sprite.x-W/2)*dolly+slide+camera.x*1100/depth+drift*7*Math.sin(t*.13+seed)+(1-arrival)*Math.sin(seed)*85-departure*Math.cos(seed)*45,
      y:H/2+(sprite.y-H/2)*dolly+camera.y*1100/depth+drift*5*Math.sin(t*.11+seed*.8)+(1-arrival)*38,
      width:sprite.texture.width,height:sprite.texture.height,depth,
      yaw:sprite.yaw+camera.yaw+drift*.012*Math.sin(t*.085+seed)+(1-arrival)*.13*Math.sin(seed)-departure*.055,
      pitch:sprite.pitch+drift*.007*Math.sin(t*.073+seed*.9),
      roll:sprite.roll+camera.roll+drift*.004*Math.sin(t*.093+seed),
      opacity:sprite.opacity*phaseOpacity(sprite,t)
    };
  }
  function draw(ctx,time){
    if(destroyed)return {activeStages:[],planes:[],destroyed:true};
    const t=Number.isFinite(Number(time))?Number(time):0,camera=cameraAt(t);
    const active=sprites.map(sprite=>({sprite,pose:poseAt(sprite,t,camera)}))
      // Stable authored ordering avoids alpha-layer swaps when two shallow drifts cross.
      .filter(row=>row.pose.opacity>.001).sort((a,b)=>b.sprite.depth-a.sprite.depth);
    const entries=active.map(({sprite,pose})=>({image:sprite.texture.image,pose}));
    const batch=typeof space.drawPlanes==='function'?space.drawPlanes(ctx,entries):null;
    const planes=[];
    for(const {sprite,pose} of active){
      const result=batch||space.drawPlane(ctx,sprite.texture.image,pose);
      planes.push({id:sprite.id,stage:sprite.stage,text:sprite.texture.text,
        x:pose.x,y:pose.y,depth:pose.depth,width:pose.width,height:pose.height,
        yaw:pose.yaw,pitch:pose.pitch,roll:pose.roll,opacity:pose.opacity,
        fontSize:sprite.texture.fontSize,lines:sprite.texture.lines,mode:result?.mode||null});
    }
    return {time:t,activeStages:[...new Set(planes.map(row=>row.stage))],planeCount:planes.length,planes,
      counts:{books:books.length,videos:videos.length,credits:credits.length,
        literature:literature.length,musicActual:songs.length,musicPlaceholders:0,thanks:thanks.length},
      tokenDisplay:statistics[0]?.value,
      camera,composites:batch?.composites??active.length,
      absoluteTime:true,beatGeometry:false,cyclicWrap:false,transparentTextures:true};
  }
  function destroy(){
    if(destroyed)return;destroyed=true;
    for(const row of cache.values()){row.image.width=1;row.image.height=1;}
    cache.clear();sprites.length=0;
    // The space belongs to the caller, so its shared WebGL context remains alive.
  }
  return {draw,destroy};
}

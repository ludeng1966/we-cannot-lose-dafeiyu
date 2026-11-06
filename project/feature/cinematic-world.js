/* Cinematic environmental plates for legacy narration time n.
 * Only the 1920 x 952 body is touched. Source footage, quotations, diagrams,
 * native characters, and the original subtitle area remain caller-owned.
 * Every pose is an absolute-time function. No beat input, jitter, springs,
 * fast cyclic wraps, source-pixel filtering, or per-frame texture uploads.
 */
import {createPVSpace} from './pv-space.js';

const W=1920,H=952,TAU=Math.PI*2,BG='#080808';
const BITMAP_ANIMATION_OPACITY=.37,BITMAP_READING_OPACITY=.265;
const ENVIRONMENT_TEXTURE_FILTER='grayscale(1) contrast(1.15)';
const CODE_TOKENS=['{}','</>','[]','=>','λ','()','::','&&'];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(Number(x))?Number(x):a));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const finite=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;
const hash=n=>{const v=Math.sin(n*127.1+37.7)*43758.5453;return v-Math.floor(v);};
const THEME_IDS=['archive','workshop','knowledge','bridge','collaboration','loss','coda'];
const DEFAULT_THEMES={
  archive:{label:'档案与知识入口',asset:'assets/pv-opening/generated-archive-v1.png'},
  workshop:{label:'开放创造工坊',asset:'assets/pv-opening/generated-workshop-v1.png'},
  knowledge:{label:'知识树与操作',asset:'assets/pv-opening/generated-archive-v1.png'},
  bridge:{label:'认识与实践之桥',asset:'assets/pv-opening/generated-workshop-v1.png'},
  collaboration:{label:'共同需要与协作',asset:'assets/pv-opening/generated-workshop-v1.png'},
  loss:{label:'被切断的接口',asset:'assets/pv-opening/generated-archive-v1.png'},
  coda:{label:'公共决定与未来',asset:'assets/pv-opening/generated-workshop-v1.png'}
};
const STARTS=[0,58.32550820953869,257.26,368.14,500.265,844.9045735454545,1057.3665189873418,1250.294,1441.085,1622.65,1899.5978197094844,1959.2557865168537,2214.236674552214,2394.9700000000003];
const IDS=['archive','archive','archive','workshop','knowledge','bridge','workshop','workshop','knowledge','collaboration','loss','loss','collaboration','coda'];
const FALLBACK_CHAPTERS=STARTS.map((start,i)=>({id:`ch${String(i+1).padStart(2,'0')}`,start,end:STARTS[i+1]??2601.725,theme:IDS[i],label:DEFAULT_THEMES[IDS[i]].label}));

function makeCanvas(width=W,height=H){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function bodyClip(ctx){ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();}
function fillArea(ctx,x,y,w,h,style){ctx.fillStyle=style;ctx.beginPath();ctx.rect(x,y,w,h);ctx.fill();}
function circle3(center,radius,plane='xy',steps=48){
  return Array.from({length:steps+1},(_,i)=>{
    const a=i/steps*TAU,c=Math.cos(a)*radius,s=Math.sin(a)*radius;
    return plane==='xz'?[center[0]+c,center[1],center[2]+s]:plane==='yz'?[center[0],center[1]+c,center[2]+s]:[center[0]+c,center[1]+s,center[2]];
  });
}
function geometryFor(theme){
  const paths=[],motionData={anchors:[],flowLinks:[]};
  const add=(points,accent=false,width=1,alpha=1)=>paths.push({points,accent,width,alpha});
  const line=(a,b,accent=false,width=1,alpha=1)=>add([a,b],accent,width,alpha);
  const rect=(x,y,w,h,z,alpha=1)=>add([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z]],false,1,alpha);
  if(theme==='archive'){
    for(let depth=0;depth<7;depth++){
      const z=depth*370;
      for(const side of [-1,1]){
        const x=side*1530;
        line([x,-740,z],[x,720,z],false,1.2);
        line([x,-740,z],[side*1920,-740,z+130]);
        for(let row=0;row<6;row++){
          const y=-600+row*230;
          line([x,y,z],[side*1940,y,z+110]);
          for(let k=0;k<5;k++)line([x+side*(k*72+20),y-170,z+30],[x+side*(k*72+20),y-12,z+30],false,.8,.56);
        }
      }
    }
    rect(-540,-570,1080,1160,2700,.7);
    line([0,-570,2700],[0,590,2700],true,1.6,.8);
    add(circle3([1050,-410,1300],360,'xy',64),false,.7,.45);
    for(let i=0;i<3;i++)add(circle3([1050,-410,1300],200+i*56,'xz',48),false,.7,.3);
  }else if(theme==='workshop'){
    for(let i=0;i<9;i++){
      const z=i*340;
      add([[-1640,720,z],[-1640,-620,z],[1640,-620,z],[1640,720,z]],false,1.25,.8);
      line([-1640,-620,z],[-1440,-790,z]);line([1640,-620,z],[1440,-790,z]);
      line([-1640,500,z],[1640,500,z],false,.8,.35);
      if(i<5)for(const side of [-1,1]){
        const x=side*1150;
        add([[x-260,270,z],[x+260,270,z],[x+190,500,z+160],[x-190,500,z+160],[x-260,270,z]],false,.9,.75);
        line([x-210,290,z],[x-210,650,z]);line([x+210,290,z],[x+210,650,z]);
      }
    }
    for(let i=0;i<9;i++)line([-1800+i*450,730,-100],[-1800+i*450,730,2800],false,.7,.45);
    for(let r=0;r<3;r++)add(circle3([-1300,-90,180],180+r*34,'xy',56),false,.85,.7);
    for(let i=0;i<12;i++){const a=i/12*TAU;line([-1300+Math.cos(a)*180,-90+Math.sin(a)*180,180],[-1300+Math.cos(a)*248,-90+Math.sin(a)*248,180]);}
    line([-1750,680,90],[1750,680,1800],true,1.4,.7);
  }else if(theme==='knowledge'){
    function branch(origin,length,angle,depth,seed){
      const end=[origin[0]+Math.sin(angle)*length,origin[1]-Math.cos(angle)*length,origin[2]+(hash(seed)-.5)*length*.6];
      if(depth===3)motionData.anchors.push(end);
      line(origin,end,depth===0,depth<2?1.7:1,1-depth*.095);
      if(depth<5){branch(end,length*.73,angle-.42-hash(seed+1)*.27,depth+1,seed*2+1);branch(end,length*.71,angle+.42+hash(seed+2)*.25,depth+1,seed*2+2);}
      else add(circle3(end,11,'xy',10),false,.8,.65);
    }
    branch([0,760,500],610,0,0,3);
    for(let i=0;i<9;i++){
      const side=i%2?-1:1,x=side*(260+i*108);
      add([[0,760,500],[x*.4,890,350],[x,940+i*15,180+i*40]],false,.85,.5);
    }
    for(let i=0;i<8;i++){const z=600+i*230;line([-1500,950,z],[1500,950,z],false,.7,.24);}
  }else if(theme==='bridge'){
    for(const z of [150,460]){
      const deck=[];
      for(let i=0;i<=30;i++){const u=i/30;deck.push([-1740+3480*u,210-Math.sin(u*Math.PI)*170,z]);}
      add(deck,false,1.7,.95);add(deck.map(p=>[p[0],p[1]-135,p[2]]),false,1,.7);
      for(let i=0;i<=12;i++){
        const u=i/12,x=-1740+3480*u,y=210-Math.sin(u*Math.PI)*170;
        line([x,y,z],[x,700,z],false,1,.8);line([x,y-135,z],[x,y,z],false,.9,.7);
        if(i<12){const nu=(i+1)/12,nx=-1740+3480*nu,ny=210-Math.sin(nu*Math.PI)*170;line([x,y,z],[nx,700,z],false,.8,.5);}
      }
    }
    for(let i=0;i<13;i++){const u=i/12,x=-1740+3480*u,y=210-Math.sin(u*Math.PI)*170;line([x,y,150],[x,y,460],false,.9,.5);}
    line([-1740,76,150],[1740,76,460],true,1.2,.7);
    for(const side of [-1,1])for(let i=0;i<9;i++)line([side*(900+i*100),720,50],[side*(900+i*100),720,2000],false,.7,.45);
  }else if(theme==='collaboration'){
    const nodes=[],centers=[[-1150,-300,250],[1020,-320,900],[0,650,1700]];
    centers.forEach((center,cluster)=>{
      nodes.push(center);
      for(let i=0;i<8;i++){const a=i/8*TAU+cluster*.2,r=260+hash(i+cluster*17)*230;nodes.push([center[0]+Math.cos(a)*r,center[1]+Math.sin(a)*r*.7,center[2]+(hash(i*7+cluster)-.5)*400]);}
    });
    function arc(a,b,accent=false){const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2-100,(a[2]+b[2])/2+170];const points=[];for(let i=0;i<=10;i++){const t=i/10;points.push([0,1,2].map(k=>(1-t)*(1-t)*a[k]+2*(1-t)*t*mid[k]+t*t*b[k]));}add(points,accent,accent?1.4:.9,accent?.9:.55);if(accent)motionData.flowLinks.push({a,b,mid,points});}
    for(let c=0;c<3;c++)for(let i=1;i<=8;i++){
      arc(nodes[c*9],nodes[c*9+i]);arc(nodes[c*9+i],nodes[c*9+(i%8)+1]);
    }
    arc(nodes[0],nodes[9],true);arc(nodes[9],nodes[18],true);arc(nodes[18],nodes[0],true);
    nodes.forEach((node,i)=>add(circle3(node,i%9===0?34:12,'xy',14),i%9===0,1,.7));
  }else if(theme==='loss'){
    for(const side of [-1,1]){
      const x=side*1080;
      add([[x,-710,1700],[x+side*430,-710,1700],[x+side*430,800,1700],[x,800,1700]],false,1,.75);
      for(let i=0;i<5;i++){
        const y=-520+i*260;
        line([side*1900,y,150],[side*(390+i*45),y*.58,700],false,.85,.55);
        line([side*320,y*.58,700],[side*170,y*.58,700],true,1,.7);
      }
      for(let i=0;i<4;i++)add(circle3([side*(1180+i*140),-360+i*270,200+i*300],20,'xy',16),false,.8,.5);
    }
    line([-1900,880,120],[-350,880,850],false,.8,.5);line([350,880,850],[1900,880,120],false,.8,.5);
  }else{
    for(const r of [500,1000,1500]){
      const arc=[];for(let i=0;i<=52;i++){const a=Math.PI+i/52*Math.PI;arc.push([Math.cos(a)*r,620,1250+Math.sin(a)*r*.8]);}
      add(arc,false,1.05,.8);add(arc.map(p=>[p[0],p[1]-120,p[2]]),false,.8,.5);
    }
    for(let i=0;i<=12;i++){const a=Math.PI+i/12*Math.PI;line([Math.cos(a)*500,620,1250+Math.sin(a)*400],[Math.cos(a)*1500,620,1250+Math.sin(a)*1200],false,.8,.5);}
    for(const side of [-1,1])for(let i=0;i<5;i++)line([side*(1280+i*150),-650,i*400],[side*(1280+i*150),720,i*400],false,.9,.6);
    rect(-420,-610,840,1000,2300,.7);line([-1750,720,300],[1750,720,300],true,1.25,.65);
  }
  const grouped=new Map();
  for(const path of paths){
    const key=`${path.accent}:${path.width}:${path.alpha}`;
    if(!grouped.has(key))grouped.set(key,{accent:path.accent,width:path.width,alpha:path.alpha,paths:[]});
    grouped.get(key).paths.push(path);
  }
  return {paths,groups:[...grouped.values()],motionData};
}

function nearGeometryFor(theme){
  const paths=[],add=(points,accent=false,width=1.5)=>paths.push({points,accent,width});
  const line=(a,b,accent=false,width=1.5)=>add([a,b],accent,width);
  if(theme==='archive'){
    for(const side of [-1,1]){
      const x=side*1500;add([[x,-950,-260],[x,1100,-260],[x+side*115,1100,-260],[x+side*115,-950,-260]],false,2.3);
      for(let i=0;i<8;i++)line([x,-710+i*225,-260],[x+side*(i%2?52:100),-710+i*225,-260]);
    }
  }else if(theme==='workshop'){
    for(const side of [-1,1]){
      const x=side*1450;add([[x,-900,-220],[x+side*80,-900,-220],[x+side*80,1100,-220],[x,1100,-220]],false,2.4);
      for(let i=0;i<7;i++)line([x,160+i*120,-220],[x-side*125,70+i*120,-220],i===3,1.5);
    }
  }else if(theme==='knowledge'){
    for(const side of [-1,1]){
      const x=side*1440;add([[x,1060,-280],[x-side*40,750,-280],[x-side*155,430,-280],[x-side*190,10,-280]],false,2.1);
      for(let i=0;i<6;i++){const y=180+i*125;add([[x-side*145,y,-280],[x-side*(280+i*15),y-95,-180],[x-side*(345+i*15),y-125,-120]],false,1.25);}
    }
  }else if(theme==='bridge'){
    for(const side of [-1,1]){
      const x=side*1450;add([[x,-820,-250],[x,1000,-250],[x+side*170,1000,-250],[x+side*170,-820,-250]],false,2.3);
      line([x,620,-250],[x-side*740,430,300],true,1.8);line([x,-350,-250],[x-side*670,430,300],false,1.4);
      for(let i=0;i<5;i++)line([x,20+i*160,-250],[x+side*170,20+i*160,-250]);
    }
  }else if(theme==='collaboration'){
    const nodes=[[-1500,-380,-250],[-1380,580,-190],[1510,50,-250],[1350,920,-160]];
    nodes.forEach((node,i)=>add(circle3(node,i%2?48:85,'xy',12),i===2,1.6));
    add([nodes[0],[-1700,100,-300],nodes[1]],false,1.5);add([nodes[2],[1700,500,-300],nodes[3]],false,1.5);
  }else if(theme==='loss'){
    for(const side of [-1,1]){
      line([side*1850,760,-260],[side*570,760,-260],false,1.6);
      line([side*1650,-650,-210],[side*1650,430,-210],false,1.4);
      add(circle3([side*570,760,-260],24,'xy',8),true,1.6);
    }
  }else{
    for(const side of [-1,1]){
      const x=side*1580;add([[x,-900,-240],[x-side*80,-900,-240],[x-side*80,1050,-240],[x,1050,-240]],false,2.2);
    }
    add(circle3([0,850,450],1060,'xz',24),false,1.65);
  }
  return paths;
}

export async function createCinematicWorld(options={}){
  let plan=options.data||options.plan||null,planError=null;
  const base=options.assetsBase||document.baseURI;
  const absolute=url=>new URL(url,base).href;
  if(!plan){
    try{const response=await fetch(options.dataUrl||'research/full-film-cinematic-plan.json',{cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);plan=await response.json();}
    catch(error){planError=error.message;plan={};}
  }
  const chapters=(Array.isArray(plan.chapters)&&plan.chapters.length?plan.chapters:FALLBACK_CHAPTERS)
    .map((row,index)=>({...row,id:row.id||`chapter-${index}`,start:finite(row.start),end:finite(row.end,2601.725),theme:THEME_IDS.includes(row.theme)?row.theme:'archive'}))
    .sort((a,b)=>a.start-b.start);
  const themes=Object.fromEntries(THEME_IDS.map(id=>[id,{...DEFAULT_THEMES[id],...(plan.themes?.[id]||{}),...(options.themes?.[id]||{})}]));
  const sourceRows=new Map(),prepared=new Map(),symbolTextures=new Map();
  const background=makeCanvas(),bg=background.getContext('2d',{alpha:false});
  const ownSpace=!options.space,space=options.space||createPVSpace({width:W,height:H});
  const geometries=Object.fromEntries(THEME_IDS.map(id=>[id,geometryFor(id)]));
  const nearGeometries=Object.fromEntries(THEME_IDS.map(id=>[id,nearGeometryFor(id)]));
  const farGeometries=Object.fromEntries(THEME_IDS.map(id=>[id,geometries[id].paths.filter((_,i)=>i%5===0)
    .map(path=>({...path,points:path.points.map(p=>[p[0]*1.15,p[1]*.95,p[2]+1900])}))]));
  let destroyed=false,cacheKey='',lastFrame=null,lastAudit={ready:false},renderCount=0,cacheHits=0;
  const fallbackFor=id=>id==='archive'||id==='knowledge'||id==='loss'?'assets/pv-opening/generated-archive-v1.png':'assets/pv-opening/generated-workshop-v1.png';

  async function load(url){
    if(!url)return;
    const source=absolute(url);if(sourceRows.has(source))return;
    const row={url,absoluteUrl:source,status:'loading',width:0,height:0,error:null};sourceRows.set(source,row);
    try{
      const image=await new Promise((resolve,reject)=>{
        const img=new Image();let timer;img.decoding='async';
        const clear=()=>{clearTimeout(timer);img.onload=null;img.onerror=null;};
        img.onload=()=>{clear();resolve(img);};img.onerror=()=>{clear();reject(Error('Image load failed'));};
        timer=setTimeout(()=>{clear();reject(Error('Image load timeout'));},finite(options.imageTimeoutMs,15000));img.src=source;
      });
      row.width=image.naturalWidth;row.height=image.naturalHeight;
      if(!row.width||!row.height)throw Error('Empty image');
      // A single fixed crop is prepared once. No original asset is changed.
      const texture=makeCanvas(),tc=texture.getContext('2d');
      const targetRatio=W/H,sourceRatio=row.width/row.height;
      const sw=sourceRatio>targetRatio?row.height*targetRatio:row.width;
      const sh=sourceRatio>targetRatio?row.height:row.width/targetRatio;
      tc.filter=ENVIRONMENT_TEXTURE_FILTER;
      tc.drawImage(image,(row.width-sw)/2,(row.height-sh)/2,sw,sh,0,0,W,H);
      tc.filter='none';row.textureFilter=ENVIRONMENT_TEXTURE_FILTER;
      prepared.set(source,texture);row.status='loaded';
    }catch(error){row.status='unavailable';row.error=error.message;}
  }
  await Promise.all([...new Set(THEME_IDS.flatMap(id=>[themes[id].asset,themes[id].fallbackAsset,fallbackFor(id)]).concat(chapters.map(row=>row.asset)).filter(Boolean))].map(load));
  let prewarmedTextures=0;
  // Upload fixed environment textures once during initialization, before playback.
  if(space.available!==false)for(const image of prepared.values()){
    space.drawPlane(bg,image,{x:960,y:476,width:W,height:H,depth:1100,opacity:.0001,dynamic:false});
    prewarmedTextures++;
  }

  function imageFor(theme,chapter){
    const requested=chapter?.asset||themes[theme].asset;
    for(const candidate of [requested,themes[theme].fallbackAsset,fallbackFor(theme)]){
      if(candidate&&prepared.has(absolute(candidate)))return {image:prepared.get(absolute(candidate)),url:candidate,requestedUrl:requested,fallback:candidate!==requested};
    }
    return {image:null,url:null,requestedUrl:requested,fallback:true};
  }
  function symbolTexture(token){
    if(symbolTextures.has(token))return symbolTextures.get(token);
    const c=makeCanvas(192,80),cx=c.getContext('2d');
    cx.font=`500 42px ${options.monoFamily||'"PV Mono","Consolas",monospace'}`;
    cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle='#d4d7d2';
    cx.fillText(token,96,41);symbolTextures.set(token,c);return c;
  }
  // Only small syntax tokens are cached. No chapter words or macro type plates.
  CODE_TOKENS.forEach(symbolTexture);
  if(space.available!==false)for(const image of symbolTextures.values()){space.drawPlane(bg,image,{x:960,y:476,width:192,height:80,depth:1100,opacity:.0001,dynamic:false});prewarmedTextures++;}
  const sphereLines=[];
  for(let m=0;m<5;m++)sphereLines.push({points:Array.from({length:13},(_,i)=>{const lat=-Math.PI/2+i/12*Math.PI,lon=m/5*TAU;return [Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)];}),opacity:m%2?.48:.76});
  for(const lat of [-.55,0,.55])sphereLines.push({points:Array.from({length:17},(_,i)=>{const lon=i/16*TAU;return [Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)];}),opacity:.54});
  sphereLines.push({points:Array.from({length:25},(_,i)=>{const a=i/24*TAU;return [Math.cos(a)*1.28,Math.sin(a)*.24,Math.sin(a)*1.28];}),opacity:.82,accent:true});
  const sphereSymbols=Array.from({length:12},(_,i)=>{const lon=i/12*TAU,lat=i%3===0?.6:i%3===1?-.45:.08;return {id:`code-${i}`,token:CODE_TOKENS[i%CODE_TOKENS.length],point:[Math.cos(lat)*Math.cos(lon)*1.055,Math.sin(lat)*1.055,Math.cos(lat)*Math.sin(lon)*1.055]};});

  function cameraAt(t){
    const amount=clamp(options.motionScale??1,0,2);
    return {x:amount*(280*Math.sin(t*.032)+115*Math.sin(t*.079)),
      y:amount*(65*Math.sin(t*.027+.3)+24*Math.sin(t*.071)),
      z:amount*(300*Math.sin(t*.027-.3)+100*Math.sin(t*.061)),
      yaw:amount*(.09*Math.sin(t*.026+.2)+.035*Math.sin(t*.065)),
      pitch:amount*.027*Math.sin(t*.023+.6)};
  }
  function normaliseRects(rows){
    return (Array.isArray(rows)?rows:[]).map(row=>Array.isArray(row)?{x:row[0],y:row[1],width:row[2],height:row[3]}:row)
      .map(row=>({x:finite(row.x),y:finite(row.y),width:Math.max(0,finite(row.width??row.w)),height:Math.max(0,finite(row.height??row.h))}))
      .filter(row=>row.width>0&&row.height>0);
  }
  function frameFor(time,descriptor={}){
    const semanticT=Math.max(0,finite(time)),t=Number.isFinite(descriptor.animationTime)?Math.max(0,descriptor.animationTime):semanticT,chapter=chapters.find(row=>semanticT>=row.start&&semanticT<row.end)||chapters[chapters.length-1]||FALLBACK_CHAPTERS[0];
    const override=typeof descriptor.theme==='string'&&THEME_IDS.includes(descriptor.theme)?descriptor.theme:null;
    const theme=override||chapter.theme;
    const kind=String(descriptor.contentKind||descriptor.kind||descriptor.priority||'reading');
    const reading=descriptor.reading===true||/reading|footage|software|quote|diagram|infographic|evidence|video/i.test(kind);
    const protectedRects=normaliseRects(descriptor.protectedRects||descriptor.protectedRegions);
    const transitionSeconds=clamp(options.transitionSeconds??2,0,5),weights=[{theme,weight:1,chapter}];
    if(!override&&transitionSeconds>0){
      const index=chapters.indexOf(chapter),previous=chapters[index-1];
      const sameImage=previous&&imageFor(previous.theme,previous).url===imageFor(theme,chapter).url;
      if(previous&&(previous.theme!==theme||!sameImage)&&semanticT<chapter.start+transitionSeconds){
        const u=smooth((semanticT-chapter.start)/transitionSeconds);weights[0].weight=u;weights.unshift({theme:previous.theme,weight:1-u,chapter:previous});
      }
    }
    const visibleWeights=weights.filter(row=>row.weight>.0001),merged=new Map();
    for(const row of visibleWeights){
      if(!merged.has(row.theme))merged.set(row.theme,{theme:row.theme,weight:0,chapter:row.chapter});
      const combined=merged.get(row.theme);combined.weight+=row.weight;combined.chapter=row.chapter;
    }
    const skip=descriptor.skipWorld===true||descriptor.pv===true||/pv-opening/i.test(String(descriptor.clipKey||descriptor.clip||''));
    const camera=cameraAt(t);
    return {t,semanticT,chapter,theme,reading,kind,protectedRects,weights:visibleWeights,geometryWeights:[...merged.values()],camera,
      basis:{cy:Math.cos(camera.yaw),sy:Math.sin(camera.yaw),cp:Math.cos(camera.pitch),sp:Math.sin(camera.pitch)},layerCache:new Map(),skip};
  }
  function project(point,camera,basis=null){
    const {cy,sy,cp,sp}=basis||{cy:Math.cos(camera.yaw),sy:Math.sin(camera.yaw),cp:Math.cos(camera.pitch),sp:Math.sin(camera.pitch)};
    const rx=point[0]*cy-(point[2]-900)*sy,rz=point[0]*sy+(point[2]-900)*cy+900;
    const ry=point[1]*cp-rz*sp,z=point[1]*sp+rz*cp+1800-camera.z;
    const scale=1180/Math.max(300,z);
    return {x:W/2+(rx-camera.x)*scale,y:470+(ry-camera.y)*scale,depth:z};
  }
  function layerPose(frame,theme,layer){
    const key=`${theme}:${layer}`;if(frame.layerCache.has(key))return frame.layerCache.get(key);
    const t=frame.t,seed=THEME_IDS.indexOf(theme)*.83;
    const p=layer===0?{x:300*Math.sin(t*.047+seed)+110*Math.sin(t*.091+seed*.3),y:42*Math.sin(t*.043+seed),z:135*Math.sin(t*.035+seed),angle:.065*Math.sin(t*.033+seed),spread:1}:
      layer===1?{x:65*Math.sin(t*.025+seed),y:20*Math.sin(t*.018+seed),z:85*Math.sin(t*.023+seed),angle:.025*Math.sin(t*.027+seed),spread:1+.09*Math.sin(t*.021+seed)}:
      {x:26*Math.sin(t*.018+seed),y:10*Math.sin(t*.012+seed),z:38*Math.sin(t*.017+seed),angle:.01*Math.sin(t*.019+seed),spread:1};
    p.c=Math.cos(p.angle);p.s=Math.sin(p.angle);frame.layerCache.set(key,p);return p;
  }
  function projectLayer(point,frame,theme,layer=1){
    const p=layerPose(frame,theme,layer),pivot=layer===0?-200:700;
    const x=point[0]*p.spread,z=point[2]-pivot;
    return project([x*p.c-z*p.s+p.x,point[1]+p.y,x*p.s+z*p.c+pivot+p.z],frame.camera,frame.basis);
  }
  function geometry(ctx,frame,row){
    const groups=geometries[row.theme].groups,base=(frame.reading?.085:.462)*row.weight;
    let segments=0;
    for(const group of groups){
      ctx.beginPath();
      for(const path of group.paths){
        path.points.forEach((point,index)=>{const p=projectLayer(point,frame,row.theme,1);index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
        segments+=Math.max(0,path.points.length-1);
      }
      ctx.strokeStyle=group.accent?'#a94c40':'#b8b6ad';
      ctx.globalAlpha=base*(group.accent?1.85:1)*group.alpha;ctx.lineWidth=group.width;ctx.stroke();
    }
    ctx.globalAlpha=1;return segments;
  }
  function nearGeometry(ctx,frame,row){
    const base=(frame.reading?.105:.638)*row.weight;let segments=0;
    for(const path of nearGeometries[row.theme]){
      ctx.beginPath();path.points.forEach((point,i)=>{const p=projectLayer(point,frame,row.theme,0);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
      ctx.strokeStyle=path.accent?'#c56b53':'#d8d3c7';ctx.globalAlpha=base*(path.accent?1:.88);ctx.lineWidth=path.width;ctx.stroke();segments+=path.points.length-1;
    }
    ctx.globalAlpha=1;return segments;
  }
  function farGeometry(ctx,frame,row){
    const base=(frame.reading?.045:.264)*row.weight;let segments=0;
    ctx.strokeStyle='#a5ada4';ctx.lineWidth=.8;ctx.globalAlpha=base;
    ctx.beginPath();
    for(const path of farGeometries[row.theme]){
      path.points.forEach((point,i)=>{const p=projectLayer(point,frame,row.theme,2);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});segments+=path.points.length-1;
    }
    ctx.stroke();ctx.globalAlpha=1;return segments;
  }
  function imagePlanes(frame){
    const alpha=bitmapOpacity(frame);
    const rows=frame.weights.map(row=>{
      const asset=imageFor(row.theme,row.chapter),c=frame.camera;
      return {...asset,theme:row.theme,weight:row.weight,pose:{
        x:960+c.x*.56+(row.theme==='loss'?28:0),y:476+c.y*.28,
        width:4600,height:2280,depth:1700+c.z*.58,
        yaw:c.yaw*.65+(row.theme==='bridge'?.018:row.theme==='knowledge'?-.018:0),pitch:c.pitch*.35,
        roll:Math.sin(frame.t*.0017)*.002,
        opacity:row.weight*alpha,dynamic:false
      }};
    }).filter(row=>row.image);
    if(rows.length===2){
      // Correct source-over coefficients retain constant plate luminance in a crossfade.
      rows[0].pose.opacity=alpha*rows[0].weight/Math.max(.0001,1-alpha*rows[1].weight);
    }
    return rows;
  }
  function bitmapEnvelope(t){return .925+.075*Math.sin(t*.035-.5);}
  function bitmapOpacity(frame){return (frame.reading?BITMAP_READING_OPACITY:BITMAP_ANIMATION_OPACITY)*bitmapEnvelope(frame.t);}
  function codeSphere(frame){
    const t=frame.t,yaw=t*.065+.2*Math.sin(t*.018),pitch=.32+.12*Math.sin(t*.022),roll=.1*Math.sin(t*.013);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const center=[550+200*Math.sin(t*.016),-20+70*Math.sin(t*.019),900+80*Math.sin(t*.011)],radius=430;
    const world=point=>{const x=point[0]*cy-point[2]*sy,z=point[0]*sy+point[2]*cy,y=point[1]*cp-z*sp,zz=point[1]*sp+z*cp;return [center[0]+(x*cr-y*sr)*radius,center[1]+(x*sr+y*cr)*radius,center[2]+zz*radius];};
    const symbols=sphereSymbols.map(row=>{
      const pos=world(row.point),p=project(pos,frame.camera,frame.basis),fontPx=clamp(64*1180/p.depth,22,42),scale=fontPx/42*p.depth/1100;
      const front=clamp((center[2]+radius-pos[2])/(radius*2));
      return {id:row.id,token:row.token,image:symbolTexture(row.token),fontPx,pose:{
        x:p.x,y:p.y,width:192*scale,height:80*scale,depth:p.depth,
        yaw:-.16*Math.sin(yaw),pitch:.07*Math.cos(pitch),roll:.035*Math.sin(t*.02+row.point[0]),
        opacity:(frame.reading?.14:.44)*(.42+.58*front),dynamic:false
      }};
    });
    return {world,symbols,center,radius};
  }
  function drawCodeSphere(ctx,frame,sphere){
    let segments=0;ctx.lineWidth=.85;
    for(const line of sphereLines){
      ctx.beginPath();line.points.forEach((point,i)=>{const p=project(sphere.world(point),frame.camera,frame.basis);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
      ctx.strokeStyle=line.accent?'#b96a53':'#c4cbc5';ctx.globalAlpha=(frame.reading?.075:.27)*line.opacity;ctx.stroke();segments+=line.points.length-1;
    }
    ctx.globalAlpha=1;return segments;
  }
  function contiguousThemeRange(row){
    let i=chapters.indexOf(row.chapter);if(i<0)return {start:row.chapter.start,end:row.chapter.end};
    let a=i,b=i;while(a>0&&chapters[a-1].theme===row.theme)a--;while(b+1<chapters.length&&chapters[b+1].theme===row.theme)b++;
    return {start:chapters[a].start,end:chapters[b].end};
  }
  function dynamicGeometry(ctx,frame,row){
    const t=frame.t,base=(frame.reading?.055:.308)*row.weight;
    let segments=0,points=0;const samples=[];
    function path(world,accent=false,alpha=1,width=1){
      if(world.length<2)return;ctx.beginPath();
      world.forEach((point,i)=>{const p=projectLayer(point,frame,row.theme,1);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
      ctx.strokeStyle=accent?'#ba6550':'#ded9ca';ctx.globalAlpha=base*alpha;ctx.lineWidth=width;ctx.stroke();segments+=world.length-1;
    }
    function dot(world,radius=8,accent=false,alpha=1,id=null){
      const p=projectLayer(world,frame,row.theme,1),r=clamp(radius*1180/p.depth,1.4,8);
      ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fillStyle=accent?'#c56b53':'#e5ddc9';ctx.globalAlpha=base*alpha*1.8;ctx.fill();points++;
      if(id)samples.push({id,x:p.x,y:p.y,opacity:base*alpha*1.8});
    }
    const close=points=>points.concat([points[0]]);
    const orbit=(center,r,angle,plane='xy')=>plane==='xz'?[center[0]+Math.cos(angle)*r,center[1],center[2]+Math.sin(angle)*r]:[center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle)*r*.68,center[2]+Math.sin(angle)*r*.25];
    let motif,energy=null;
    if(row.theme==='archive'){
      motif='archive-dial-and-gate-parallax';
      const c=[1050,-410,1300];
      for(let i=0;i<12;i++){
        const a=i/12*TAU;path([[c[0]+Math.cos(a)*330,c[1]+Math.sin(a)*330,c[2]],[c[0]+Math.cos(a)*360,c[1]+Math.sin(a)*360,c[2]]],false,.8);
      }
      const needle=orbit(c,295,t*.035);path([c,needle],true,1.35,1.2);dot(needle,10,true,1,'archive-needle');
      for(const side of [-1,1]){const shift=50*Math.sin(t*.045+side*.8);path([[side*220+shift,-520,2250],[side*220+shift,565,2250]],false,.65);}
      dot(orbit(c,245,-t*.021+.7),9,false,.8,'archive-satellite');
    }else if(row.theme==='workshop'){
      motif='meshing-gears-and-closed-machine-circuit';
      const omega=.055;
      for(let gear=0;gear<2;gear++){
        const c=[-1200+gear*264,-30,180],rotation=gear?-t*omega+Math.PI/16:t*omega;
        const outline=Array.from({length:32},(_,i)=>{const a=i/32*TAU+rotation,r=[.88,1.08,1.08,.88][i%4]*122;return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r,c[2]];});
        path(close(outline),false,1,1.25);path(circle3(c,23,'xy',8),false,.9);
        for(let i=0;i<3;i++){const a=rotation+i/3*TAU;path([[c[0]+Math.cos(a)*24,c[1]+Math.sin(a)*24,c[2]],[c[0]+Math.cos(a)*98,c[1]+Math.sin(a)*98,c[2]]],false,.8);}
        const p=projectLayer(outline[0],frame,row.theme,1);samples.push({id:`workshop-gear-${gear}`,x:p.x,y:p.y,opacity:base});
      }
      const circuit=a=>[-250+920*Math.cos(a),390+165*Math.sin(a),210+65*Math.sin(a*2)];
      path(Array.from({length:13},(_,i)=>circuit(i/12*TAU)),false,.6);
      for(let i=0;i<3;i++){const a=t*.045+i/3*TAU;path([circuit(a-.035),circuit(a)],i===0,.85);dot(circuit(a),9,i===0,1,`workshop-flow-${i}`);}
    }else if(row.theme==='knowledge'){
      motif='knowledge-tree-linked-closed-node-orbits';
      const anchors=geometries.knowledge.motionData.anchors;
      for(let i=0;i<4;i++){
        const c=anchors[Math.floor(i*Math.max(1,anchors.length-1)/3)]||[i*250-375,-200,500],radius=45+i*5;
        path(Array.from({length:9},(_,j)=>orbit(c,radius,j/8*TAU)),false,.65);
        const p=orbit(c,radius,t*(.075+i*.004)+i*1.7);path([c,p],false,.8);dot(p,10,i===0,1,`knowledge-node-${i}`);
      }
    }else if(row.theme==='bridge'){
      motif='bridge-smooth-bidirectional-point-lines';
      for(let i=0;i<5;i++){
        const at=time=>{const u=.5+.5*Math.sin(time*.04+i*1.42);return [-1740+3480*u,210-Math.sin(u*Math.PI)*170,180+(i%2)*245];};
        path([at(t-1.1),at(t)],i===0,.9,1.1);dot(at(t),10,i===0,1,`bridge-flow-${i}`);
      }
    }else if(row.theme==='collaboration'){
      motif='collaboration-network-connection-flows';
      geometries.collaboration.motionData.flowLinks.forEach((link,index)=>{
        path(link.points,index===0,.42+.18*Math.sin(t*.045+index),1);
        const at=time=>{const u=.5+.5*Math.sin(time*.045+index*1.7);return [0,1,2].map(k=>(1-u)*(1-u)*link.a[k]+2*(1-u)*u*link.mid[k]+u*u*link.b[k]);};
        for(let j=0;j<2;j++){const shift=j*Math.PI/.045;path([at(t+shift-.65),at(t+shift)],index===0,.9);dot(at(t+shift),10,index===0,1,`network-flow-${index}-${j}`);}
      });
    }else if(row.theme==='loss'){
      motif='broken-connection-energy-gently-recedes';
      const range=contiguousThemeRange(row),progress=clamp((t-range.start)/Math.max(1,range.end-range.start));
      energy=.18+.72*(1-smooth(progress));
      for(let i=0;i<3;i++)for(const side of [-1,1]){
        const y=-300+i*300,u=.5+.5*Math.sin(t*.065+i*1.3+side*.35);
        path([[side*340,y,700],[side*170,y,700]],true,energy*.85);
        dot([side*(170+150*u),y,700],8,true,energy,`loss-end-${i}-${side}`);
      }
    }else{
      motif='public-hall-circular-convergence';
      const center=[0,520,900];
      for(let ring=0;ring<2;ring++){
        const radius=420+ring*390;path(circle3(center,radius,'xz',12),false,.65);
        for(let i=0;i<2;i++){
          const a=t*(ring?-.027:.045)+i*Math.PI+ring*.6,p=orbit(center,radius,a,'xz');
          path([p,[0,400,900]],ring===0,.46);dot(p,10,ring===0,1,`coda-orbit-${ring}-${i}`);
        }
      }
      path(circle3([0,400,900],35,'xy',8),true,.8);dot([0,400,900],11,true,1,'coda-common-center');
    }
    ctx.globalAlpha=1;
    return {theme:row.theme,motif,segments,points,primitives:segments+points,energy,samples};
  }
  function readingVeil(ctx,frame){
    const gradient=ctx.createRadialGradient(960,455,90,960,455,1150);
    gradient.addColorStop(0,frame.reading?'rgba(8,8,8,.91)':'rgba(8,8,8,.08)');
    gradient.addColorStop(.62,frame.reading?'rgba(8,8,8,.58)':'rgba(8,8,8,.03)');
    gradient.addColorStop(1,'rgba(8,8,8,0)');fillArea(ctx,0,0,W,H,gradient);
    for(const rect of frame.protectedRects){
      const g=ctx.createRadialGradient(rect.x+rect.width/2,rect.y+rect.height/2,Math.min(rect.width,rect.height)*.12,rect.x+rect.width/2,rect.y+rect.height/2,Math.max(rect.width,rect.height)*.72);
      g.addColorStop(0,'rgba(8,8,8,.72)');g.addColorStop(1,'rgba(8,8,8,0)');
      fillArea(ctx,rect.x-50,rect.y-50,rect.width+100,rect.height+100,g);
    }
  }
  function prepareBackground(frame,key){
    bg.save();bg.setTransform(1,0,0,1,0,0);bg.globalAlpha=1;bg.globalCompositeOperation='source-over';
    fillArea(bg,0,0,W,H,BG);
    const images=imagePlanes(frame),sphere=codeSphere(frame),planes=[...images,...sphere.symbols].sort((a,b)=>b.pose.depth-a.pose.depth);
    const gpu=planes.length?(space.drawPlanes?space.drawPlanes(bg,planes.map(row=>({image:row.image,pose:row.pose}))):{mode:planes.map(row=>space.drawPlane(bg,row.image,row.pose).mode).join('+'),planes:planes.length,composites:planes.length}):{mode:'procedural-only',planes:0,composites:0};
    let segments=0,nearSegments=0,farSegments=0;const dynamics=[];
    for(const row of frame.geometryWeights)farSegments+=farGeometry(bg,frame,row);
    for(const row of frame.geometryWeights){
      segments+=geometry(bg,frame,row);
      dynamics.push(dynamicGeometry(bg,frame,row));
    }
    for(const row of frame.geometryWeights)nearSegments+=nearGeometry(bg,frame,row);
    const codeSphereSegments=drawCodeSphere(bg,frame,sphere);
    readingVeil(bg,frame);bg.restore();
    renderCount++;cacheKey=key;
    lastAudit={ready:true,version:'vector-code-sphere-v3',clock:'semantic content with continuous animation time',time:frame.semanticT,motionTime:frame.t,chapter:frame.chapter.id,chapterLabel:frame.chapter.label,theme:frame.theme,
      themes:frame.geometryWeights.map(row=>({id:row.theme,weight:row.weight})),contentKind:frame.kind,reading:frame.reading,
      bodyRect:[0,0,W,H],subtitleTop:952,subtitlePixelsTouched:false,protectedRects:frame.protectedRects,
      camera:frame.camera,images:images.map(row=>({theme:row.theme,requested:row.requestedUrl,used:row.url,fallback:row.fallback,opacity:row.pose.opacity})),
      imagePlanes:images.length,webgl:gpu.mode,projectionFallbackReason:space.reason||null,backgroundComposites:gpu.composites,geometrySegments:segments,
      visualHierarchy:'vector-led-depth-stage',vectorLayers:3,nearGeometrySegments:nearSegments,
      farGeometrySegments:farSegments,
      vectorAlpha:{middle:frame.reading?.085:.462,near:frame.reading?.105:.638},
      backgroundColor:BG,bitmapOpacity:bitmapOpacity(frame),bitmapPeakOpacity:frame.reading?BITMAP_READING_OPACITY:BITMAP_ANIMATION_OPACITY,bitmapEnvelope:bitmapEnvelope(frame.t),
      environmentTextureFilter:ENVIRONMENT_TEXTURE_FILTER,animationVeil:{centerAlpha:.08,ringAlpha:.03},
      semanticBackgroundWords:0,keywordPlanes:[],
      codeSphere:{segments:codeSphereSegments,symbolCount:sphere.symbols.length,radiusWorld:sphere.radius,centerWorld:sphere.center,
        symbols:sphere.symbols.map(row=>({id:row.id,token:row.token,x:row.pose.x,y:row.pose.y,depth:row.pose.depth,projectedFontPx:row.fontPx,opacity:row.pose.opacity}))},
      layerMotion:frame.geometryWeights.map(row=>({theme:row.theme,near:layerPose(frame,row.theme,0),middle:layerPose(frame,row.theme,1),far:layerPose(frame,row.theme,2)})),
      nearMotionSamples:frame.geometryWeights.flatMap(row=>nearGeometries[row.theme].slice(0,3).map((path,i)=>({id:`${row.theme}-near-${i}`,theme:row.theme,...projectLayer(path.points[0],frame,row.theme,0)}))),
      dynamics:{motifs:dynamics,segments:dynamics.reduce((n,row)=>n+row.segments,0),points:dynamics.reduce((n,row)=>n+row.points,0),primitives:dynamics.reduce((n,row)=>n+row.primitives,0)},
      deterministic:true,beatGeometry:false,cyclicWrap:false,dynamicTextureUploadsPerFrame:0,staticTexturesPrewarmed:prewarmedTextures,
      assets:[...sourceRows.values()].map(row=>({...row})),planSource:options.data||options.plan?'provided-data':options.dataUrl||'research/full-film-cinematic-plan.json',planError,
      renderCount,cacheHits,foreground:{drawn:false}};
  }
  function drawBackground(ctx,time,descriptor={}){
    if(destroyed)return {...lastAudit,destroyed:true};
    const frame=frameFor(time,descriptor);lastFrame=frame;
    if(frame.skip){lastAudit={ready:true,skipped:true,reason:'caller-owned PV/skipWorld',time:frame.t,subtitlePixelsTouched:false};return lastAudit;}
    const key=JSON.stringify([frame.t,frame.theme,frame.chapter.id,frame.kind,frame.reading,frame.protectedRects,frame.weights.map(row=>[row.theme,row.weight])]);
    if(key!==cacheKey)prepareBackground(frame,key);else {cacheHits++;lastAudit={...lastAudit,cacheHits};}
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';bodyClip(ctx);
    ctx.drawImage(background,0,0,W,H);ctx.restore();return lastAudit;
  }
  function clipAway(ctx,rect){ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(rect.x,rect.y,rect.width,rect.height);ctx.clip('evenodd');}
  function drawForeground(ctx,time,descriptor={}){
    if(destroyed)return {...lastAudit,destroyed:true};
    const frame=frameFor(time,descriptor);if(frame.skip)return lastAudit;
    const sourceVideos=descriptor.sourceVideos;
    const fullyProtected=frame.protectedRects.some(rect=>rect.x<=0&&rect.y<=0&&rect.x+rect.width>=W&&rect.y+rect.height>=H);
    if(fullyProtected||Array.isArray(sourceVideos)&&sourceVideos.length){
      lastAudit={...lastAudit,foreground:{drawn:false,reason:fullyProtected?'full body protected':'original source video visible',sourceVideoCount:Array.isArray(sourceVideos)?sourceVideos.length:0}};
      return lastAudit;
    }
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';bodyClip(ctx);
    clipAway(ctx,{x:175,y:112,width:1570,height:728});
    frame.protectedRects.forEach(rect=>clipAway(ctx,rect));
    const alpha=frame.reading?.095:.209,offset=frame.camera.x*.14;
    let marks=0;
    for(const row of frame.geometryWeights){
      ctx.globalAlpha=alpha*row.weight;ctx.strokeStyle='#d0ccc0';ctx.lineWidth=.75;ctx.beginPath();
      for(const side of [-1,1]){
        const sign=side<0?1:-1,edge=(side<0?68:1852)+offset*.28;
        if(row.theme==='knowledge'){
          ctx.moveTo(edge,845);ctx.bezierCurveTo(edge+sign*(40+20*Math.sin(frame.t*.04)),610,edge+sign*16,370,edge+sign*70,130);
          for(let i=0;i<7;i++){const y=185+i*100+22*Math.sin(frame.t*.065+i*.45);ctx.moveTo(edge+sign*28,y);ctx.lineTo(edge+sign*(72+i%2*29),y-43);marks++;}
        }else if(row.theme==='bridge'||row.theme==='workshop'){
          for(let i=0;i<12;i++){const y=100+i*68+28*Math.sin(frame.t*.08+i*.4);ctx.moveTo(edge+offset,y);ctx.lineTo(edge+sign*65+offset,y-32);marks++;}
        }else if(row.theme==='loss'){
          for(let i=0;i<4;i++){const y=160+i*190+18*Math.sin(frame.t*.035+i);ctx.moveTo(edge,y);ctx.lineTo(edge+sign*33,y+26);marks++;}
        }else if(row.theme==='collaboration'||row.theme==='coda'){
          ctx.moveTo(edge,105);ctx.bezierCurveTo(edge+sign*(80+24*Math.sin(frame.t*.04)),300,edge-sign*20,650,edge+sign*55,852);
          for(let i=0;i<5;i++){const y=175+i*145+25*Math.sin(frame.t*.06+i*.7);ctx.moveTo(edge+sign*28,y);ctx.arc(edge+sign*24,y,4,0,TAU);marks++;}
        }else{
          ctx.moveTo(edge,96);ctx.lineTo(edge+sign*20*Math.sin(frame.t*.035),855);
          for(let i=0;i<12;i++){const y=110+i*62+20*Math.sin(frame.t*.07+i*.36);ctx.moveTo(edge,y);ctx.lineTo(edge+sign*(i%3===0?45:17),y);marks++;}
        }
      }
      ctx.stroke();
    }
    ctx.restore();lastAudit={...lastAudit,foreground:{drawn:true,edgeOnly:true,alpha,absoluteTimeMotion:true,centralExclusion:[175,112,1570,728],marks,protectedRects:frame.protectedRects}};
    return lastAudit;
  }
  function destroy(){
    if(destroyed)return;destroyed=true;
    if(ownSpace)space.destroy();
    for(const c of [...prepared.values(),...symbolTextures.values(),background]){c.width=1;c.height=1;}
    prepared.clear();symbolTextures.clear();sourceRows.clear();lastFrame=null;cacheKey='';
  }
  lastAudit={ready:true,clock:'legacy narration n',bodyRect:[0,0,W,H],chapters:chapters.length,themes:THEME_IDS,
    assets:[...sourceRows.values()].map(row=>({...row})),planError,subtitlePixelsTouched:false};
  return {drawBackground,drawForeground,get audit(){return lastAudit;},destroy};
}

// Selected evidence owns a continuous reading window in narration time.
// Legacy composites are rendered by the caller, preserving their native A.live.
const BODY=[0,0,1920,952];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isExtension=row=>row.kind==='provided-image-end-extension';
const isLegacy=row=>row.kind==='legacy-priority-protection';

function dimensions(source){return[source.videoWidth||source.naturalWidth||source.width,source.videoHeight||source.naturalHeight||source.height];}
function contain(ctx,source,box,crop=[0,0,1,1]){
 const[iw,ih]=dimensions(source),[x,y,w,h]=box;
 if(!(iw>0&&ih>0))throw Error('阅读素材尺寸不可用');
 const sx=iw*crop[0],sy=ih*crop[1],sw=iw*crop[2],sh=ih*crop[3],k=Math.min(w/sw,h/sh);
 ctx.drawImage(source,sx,sy,sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k);
}

export async function createMaterialHolds(options={}){
 const response=await fetch(options.dataUrl||'material-hold-plan.json',{cache:'no-store'});
 if(!response.ok)throw Error('连续素材阅读计划载入失败');
 const plan=await response.json(),rows=plan.holds||[],images=new Map(),videos=new Map(),errors=[];
 let destroyed=false,sequence=0,last=null;
 for(const row of rows){
  if(!row.id||!Number.isFinite(row.start)||!Number.isFinite(row.end)||row.end<=row.start)throw Error('连续素材阅读区间无效：'+row.id);
  if(!isLegacy(row)&&!isExtension(row)&&(!Array.isArray(row.box)||row.box.length!==4))throw Error('连续素材阅读区域缺失：'+row.id);
 }
 const getAssets=options.getAssets||(()=>window.FullStudio?.assets||{});
 const waiters=new Set();
 function waitEvent(element,event){
  return new Promise((resolve,reject)=>{
   let timer;
   const clean=()=>{clearTimeout(timer);element.removeEventListener(event,done);element.removeEventListener('error',bad);waiters.delete(cancel);};
   const done=()=>{clean();resolve();},bad=()=>{clean();reject(Error('阅读素材无法载入：'+(element.currentSrc||element.src)));};
   const cancel=()=>{clean();reject(Error('阅读素材已释放'));};
   element.addEventListener(event,done,{once:true});element.addEventListener('error',bad,{once:true});waiters.add(cancel);
   timer=setTimeout(()=>{clean();reject(Error('阅读素材定位超时：'+(element.currentSrc||element.src)));},options.timeoutMs||15000);
  });
 }
 function active(n){return!destroyed&&Number.isFinite(n)?rows.find(row=>!isExtension(row)&&n>=row.start&&n<row.end)||null:null;}
 function applyProvidedExtensions(edits){
  if(!Array.isArray(edits?.windows))throw Error('新增素材窗口未准备好');
  const applied=[];
  for(const row of rows.filter(isExtension)){
   const target=edits.windows.find(w=>w.id===row.providedId&&(!row.key||w.key===row.key));
   if(!target)throw Error('待延长的静图窗口缺失：'+row.providedId);
   target.end=row.end;
   target.materialHold={id:row.id,originalEnd:row.originalEnd,extendedEnd:row.end};
   applied.push({id:row.id,providedId:target.id,start:target.start,end:target.end});
  }
  return applied;
 }
 async function image(row){
  const key=row.assetKey||row.srcKey||row.sourceKeys?.[0],existing=getAssets()[key];
  if(existing)return{source:existing,origin:'FullStudio.assets',key};
  if(!row.sourceUrl)throw Error('阅读原图未载入：'+key);
  let cached=images.get(key);
  if(!cached){const source=new Image();source.src=row.sourceUrl;cached={source,ready:source.decode()};images.set(key,cached);}
  await cached.ready;return{source:cached.source,origin:'cached-source-image',key};
 }
 async function video(row,n){
  const key=row.key||row.sourceKeys?.[0];let cached=videos.get(key);
  if(!cached){
   const source=document.createElement('video');source.muted=true;source.defaultMuted=true;source.playsInline=true;source.loop=false;source.preload='auto';
   const ready=waitEvent(source,'loadeddata');source.src=row.sourceUrl;source.load();cached={source,ready,queue:Promise.resolve()};videos.set(key,cached);
  }
  await cached.ready;
  const source=cached.source,sourceEnd=Math.min(row.sourceEnd??Infinity,source.duration-.04),target=clamp((row.sourceStart||0)+n-row.start,row.sourceStart||0,sourceEnd);
  const seek=async()=>{
   if(destroyed)throw Error('连续素材阅读模块已释放');
   source.pause();
   if(Math.abs(source.currentTime-target)>.001||source.readyState<2){const ready=waitEvent(source,'seeked');source.currentTime=target;await ready;}
  };
  cached.queue=cached.queue.catch(()=>{}).then(seek);await cached.queue;
  return{source,key,origin:'single-play-source-video',target,sourceTime:source.currentTime,duration:source.duration};
 }
 async function draw(ctx,n){
  const ticket=++sequence,row=active(n);
  if(!row){last=null;return null;}
  const base={id:row.id,kind:row.kind,key:row.assetKey||row.key||row.sourceKeys?.[0],start:row.start,end:row.end,time:n,protectedRects:row.protectedRects||[],lockCamera:!!row.lockCamera,suppressAdditionalPresence:!!row.suppressAdditionalPresence};
  if(isLegacy(row)){last={...base,drawn:false,requiresLegacyRender:true,legacyTime:Math.min(n,row.frameClampEnd??Infinity)};return last;}
  if(row.render==='information'){last={...base,drawn:false,requiresInformationRender:true,legacyTime:row.frameN,sceneId:row.sceneId};return last;}
  const media=row.render==='video'||row.kind==='independent-reading-material'?await video(row,n):await image(row);
  if(destroyed||ticket!==sequence)return{...base,drawn:false,cancelled:true};
  ctx.save();
  try{
   ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.beginPath();ctx.rect(...BODY);ctx.clip();ctx.fillStyle='#050606';ctx.fillRect(...BODY);
   contain(ctx,media.source,row.box,row.crop);
  }finally{ctx.restore();}
  const[w,h]=dimensions(media.source);
  last={...base,drawn:true,origin:media.origin,box:row.box.slice(),crop:(row.crop||[0,0,1,1]).slice(),width:w,height:h,sourceTime:media.sourceTime??null,sourceTarget:media.target??null,sourceDuration:media.duration??null,loop:false,muted:true};
  return last;
 }
 return{
  plan,active,applyProvidedExtensions,
  async draw(ctx,n){try{return await draw(ctx,n);}catch(error){errors.push({time:n,message:error.message});throw error;}},
  get audit(){return{version:plan.version,current:last?{...last}:null,loadedImages:images.size,loadedVideos:videos.size,errors:errors.slice(-5),destroyed};},
  destroy(){destroyed=true;++sequence;for(const cancel of[...waiters])cancel();for(const item of videos.values()){item.source.pause();item.source.removeAttribute('src');item.source.load();}videos.clear();images.clear();last=null;}
 };
}

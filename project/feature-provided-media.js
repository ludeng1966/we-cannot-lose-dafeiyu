const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function eventOnce(video,type){return new Promise((resolve,reject)=>{let timer;const finish=fn=>e=>{clearTimeout(timer);video.removeEventListener(type,done);video.removeEventListener('error',bad);fn(e)};const done=finish(resolve),bad=finish(()=>reject(Error('素材载入失败：'+video.currentSrc)));video.addEventListener(type,done,{once:true});video.addEventListener('error',bad,{once:true});timer=setTimeout(finish(()=>reject(Error('素材定位超时：'+video.currentSrc))),15000)});}
function contain(ctx,source,box){const[x,y,w,h]=box,iw=source.videoWidth||source.naturalWidth,ih=source.videoHeight||source.naturalHeight,k=Math.min(w/iw,h/ih);if(!(iw>0&&ih>0))throw Error('素材尺寸不可用');ctx.drawImage(source,x+(w-iw*k)/2,y+(h-ih*k)/2,iw*k,ih*k);}
export async function createProvidedMedia(options={}){
 const [edits,catalog]=await Promise.all(['provided-edits.json','provided-sources.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('新增素材清单载入失败');return r.json()}));
 const nightStudy=edits.windows.find(row=>row.id==='lovable-partner'&&row.key==='night_study');
 if(nightStudy)nightStudy.end=1233.535594;
 const riceBowl=edits.windows.find(row=>row.id==='fan-rice-bowl');
 if(riceBowl)riceBowl.end=2410.10384615;
 const dshWindow=edits.windows.find(row=>row.id==='dsh-creative-plugin'&&row.key==='dsh_creative');
 if(dshWindow){
   const key='dsh_framework_tui';
   const title='顶级UI设计！顶级交互！DeepSeek官方产品负责人推荐的tui是什么样的？';
   catalog.sources.push({key,kind:'video',src:'/assets/tui/dsh-framework.mp4',title});
   dshWindow.key=key;
   dshWindow.sourceStart=0;
   delete dshWindow.sourceEnd;
   dshWindow.credit=title;
   dshWindow.reason='用用户提供的 DeepSeek Harness TUI 演示说明 Agent 框架的实际交互。';
 }
 const sources=new Map(catalog.sources.map(s=>[s.key,s])),loaded=new Map();let current=null,details={};
 for(const overlay of edits.overlays){const row=window.MediaV12.windows.find(r=>r.key===overlay.key);if(!row)throw Error('既有媒体窗口缺失：'+overlay.key);if(overlay.mediaBox)row.box=overlay.mediaBox.slice();}
 const inherited=edits.overlays.filter(r=>r.nativePresenceId).map(range=>{const native=window.PresenceV12.ranges.find(r=>r.id===range.nativePresenceId);if(!native)throw Error('原生人物窗口缺失：'+range.nativePresenceId);return{range,native,original:{x:native.x,y:native.y,w:native.w}}});
 function configure(n){for(const row of inherited){const active=n>=row.range.start&&n<row.range.end;const[x,y,w]=active?row.range.avatar:[row.original.x,row.original.y,row.original.w];Object.assign(row.native,{x,y,w});}}
 async function prepare(row,n){const src=sources.get(row.key);if(!src)throw Error('新增素材未编目：'+row.key);let item=loaded.get(row.key);
  if(!item){if(src.kind==='video'){const el=document.createElement('video');el.preload='auto';el.muted=true;el.playsInline=true;el.loop=false;el.src=src.src;item={el,ready:el.readyState>=1?Promise.resolve():eventOnce(el,'loadedmetadata')};}else{const el=new Image();el.src=src.src;item={el,ready:el.decode()};}loaded.set(row.key,item);}
  await item.ready;
  if(src.kind==='video'){const el=item.el,sourceStart=row.sourceStart??0,sourceEnd=Math.min(row.sourceEnd??Infinity,Math.max(0,el.duration-.04)),elapsed=options.elapsed?.(row,n)??n-row.start,target=clamp(sourceStart+elapsed,Math.min(sourceStart,sourceEnd),sourceEnd);el.pause();if(Math.abs(el.currentTime-target)>.008||el.readyState<2){const ready=eventOnce(el,'seeked');el.currentTime=target;await ready;}details={id:row.id,key:row.key,sourceTime:el.currentTime,sourceTarget:target,sourceDuration:el.duration,sourceElapsed:elapsed,sourceClock:options.elapsed?'audio-1x':'legacy-n',videoWidth:el.videoWidth,videoHeight:el.videoHeight,kind:'video'};}
  else details={id:row.id,key:row.key,kind:'image',width:item.el.naturalWidth,height:item.el.naturalHeight};
  if(current!==row.key){for(const[key,old]of loaded)if(key!==row.key&&old.el instanceof HTMLVideoElement){old.el.pause();old.el.removeAttribute('src');old.el.load();loaded.delete(key);}current=row.key;}
  return item.el;
 }
 function avatar(ctx,n,energy,range){const native=window.FullStudio?.avatar;if(!native)return false;const e=smooth((n-range.start)/.35)*smooth((range.end-n)/.35);if(e<.001)return false;const[x,y,w]=(Array.isArray(range.avatar)?range.avatar:[65,600,240]);native.draw(n,{framing:'full',energy,motionTime:window.NarrationMotionTime??n,mood:'neutral',lookX:.35});ctx.save();ctx.globalAlpha*=e;ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();ctx.drawImage(native.canvas,x,y,w,w*1100/900);ctx.restore();return true;}
 return {edits,configure,active:n=>edits.windows.find(w=>n>=w.start&&n<w.end),
  async draw(ctx,n,{energy=0,suppressAvatar=false}={}){const row=edits.windows.find(w=>n>=w.start&&n<w.end);if(!row)return false;const source=await prepare(row,n);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.fillStyle='#050606';ctx.fillRect(0,0,1920,952);contain(ctx,source,row.box);let hasAvatar=false;if(row.avatar&&!suppressAvatar)hasAvatar=avatar(ctx,n,energy,row);ctx.restore();details={...details,avatar:hasAvatar,avatarSize:row.avatarSize||null,avatarBox:row.avatar||null};return true;},
  overlay(ctx,n,{energy=0}={}){const range=edits.overlays.find(r=>n>=r.start&&n<r.end);if(!range)return false;if((window.PictureRenderAudit?.usage.live||0)>0){details={id:range.id,key:range.key,kind:'existing-presence',avatar:true,avatarSize:range.avatarSize,avatarBox:range.avatar,skippedDuplicate:true};return false;}if(range.nativePresenceId){details={id:range.id,key:range.key,kind:'existing-presence',avatar:false,avatarSize:range.avatarSize,skippedDuplicate:true};return false;}const drawn=avatar(ctx,n,energy,range);details={id:range.id,key:range.key,kind:'side-avatar',avatar:drawn,avatarSize:range.avatarSize,avatarBox:range.avatar};return drawn;},
  idle(){details={};for(const[key,item]of loaded)if(item.el instanceof HTMLVideoElement){item.el.pause();item.el.removeAttribute('src');item.el.load();loaded.delete(key);}current=null;},
  get audit(){return {...details}},
  destroy(){for(const item of loaded.values())if(item.el instanceof HTMLVideoElement){item.el.pause();item.el.removeAttribute('src');item.el.load();}loaded.clear();}
 };
}

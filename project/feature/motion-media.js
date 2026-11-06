// Export mode loads requested videos and releases inactive decoders; interactive playback keeps its original preload behavior.
window.createMotionMedia=async function(catalogs,ctx,isPlaying,onFrame,getRate=()=>1){
 const entries=catalogs.flatMap(c=>c.items||[]),records={},requests=new Map(),uses=new Map();let prepareOnly=false;
 const lazy=true;
 for(const row of entries){if(row.src&&/\.(mp4|webm)(?:[?#]|$)/i.test(row.src))records[row.key]={...row,video:null,lastTarget:-1,loading:null,loaded:false};}
 function ensureLoaded(row){
  if(row.loaded)return Promise.resolve(row.video);
  if(row.loading)return row.loading;
  row.loading=(async()=>{
   const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';row.video=video;
   await new Promise((ok,no)=>{video.onloadeddata=ok;video.onerror=()=>no(Error('无法载入 '+row.src));video.src=row.src;});
   video.onloadeddata=null;video.onerror=null;video.addEventListener('seeked',()=>onFrame?.());row.loaded=true;return video;
  })();
  return row.loading;
 }
 if(!lazy)await Promise.all(Object.values(records).map(ensureLoaded));
 function releaseRow(row){
  const video=row.video;if(!video)return;
  video.pause();video.onloadeddata=null;video.onerror=null;video.removeAttribute('src');video.load();
  row.video=null;row.loading=null;row.loaded=false;row.lastTarget=-1;
 }
 function target(row,t){const max=Math.max(0,row.video.duration-.06);return Math.max(0,Math.min(max,t));}
 function show(key,x,y,w,h,t=0,o={}){
  const row=records[key];if(!row)return false;
  requests.set(key,t);uses.set(key,(uses.get(key)||0)+1);if(prepareOnly)return true;
  // Export rendering always resolves the request pass through prepare() first.
  if(!row.loaded)return true;
  const time=target(row,t),v=row.video;
  if(isPlaying()&&!o.hold&&getRate()>.001){v.playbackRate=Math.max(.1,Math.min(4,getRate()));if(Math.abs(v.currentTime-time)>.22)v.currentTime=time;if(v.paused)v.play().catch(()=>{});}
  else{v.pause();if(Math.abs(v.currentTime-time)>.055&&row.lastTarget!==time){row.lastTarget=time;v.currentTime=time;}}
  ctx.save();ctx.globalAlpha*=o.alpha??1;ctx.translate(x+w/2,y+h/2);ctx.rotate(o.rotation??0);ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip();
  const crop=o.crop||[0,0,1,1],sx=crop[0]*v.videoWidth,sy=crop[1]*v.videoHeight,sw=crop[2]*v.videoWidth,sh=crop[3]*v.videoHeight,k=(o.cover?Math.max:Math.min)(w/sw,h/sh);
  ctx.drawImage(v,sx,sy,sw,sh,-sw*k/2,-sh*k/2,sw*k,sh*k);ctx.restore();return true;
 }
 async function seek(row,t){
  await ensureLoaded(row);
  const fps=typeof row.fps==='number'?row.fps:row.fps?.includes('/')?row.fps.split('/').reduce((a,b)=>a/b):30;
  const q=Math.min(row.video.duration-.06,(Math.floor(target(row,t)*fps)+.05)/fps);row.video.pause();
  if(Math.abs(row.video.currentTime-q)<.001){row.lastTarget=q;return;}
  await new Promise((ok,no)=>{const timeout=setTimeout(()=>{clean();no(Error('视频寻帧超时 '+row.key));},10000),done=()=>{clean();ok();},clean=()=>{clearTimeout(timeout);row.video.removeEventListener('seeked',done);};row.video.addEventListener('seeked',done);row.video.currentTime=q;});row.lastTarget=q;
 }
 return{records,uses,show,has:key=>!!records[key],get preparing(){return prepareOnly;},beginFrame(){requests.clear();},begin(){requests.clear();prepareOnly=true;},async prepare(){prepareOnly=false;await Promise.all([...requests].map(([k,t])=>seek(records[k],t)));},finish(){for(const[k,row]of Object.entries(records))if(!requests.has(k)){if(lazy)releaseRow(row);else row.video?.pause();}},pause(){Object.values(records).forEach(row=>row.video?.pause());},release(){if(lazy)Object.values(records).forEach(releaseRow);}};
};


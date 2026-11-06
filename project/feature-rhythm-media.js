const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function event(video,type){return new Promise((resolve,reject)=>{let timer;const clean=()=>{clearTimeout(timer);video.removeEventListener(type,done);video.removeEventListener('error',bad);};const done=()=>{clean();resolve();},bad=()=>{clean();reject(Error('穿插素材载入失败：'+video.currentSrc));};video.addEventListener(type,done,{once:true});video.addEventListener('error',bad,{once:true});timer=setTimeout(()=>{clean();reject(Error('穿插素材定位超时：'+video.currentSrc));},20000);});}
function decodedFrame(video,target){return new Promise(resolve=>{let id,timer,finished=false;const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);if(id!==undefined)video.cancelVideoFrameCallback?.(id);resolve();};const callback=(_,meta)=>{if(Math.abs(meta.mediaTime-target)<.12)finish();else id=video.requestVideoFrameCallback(callback);};if(video.requestVideoFrameCallback)id=video.requestVideoFrameCallback(callback);timer=setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(finish)),900);});}
function fit(ctx,video,box){const[x,y,w,h]=box,k=Math.min(w/video.videoWidth,h/video.videoHeight);const rect=[x+(w-video.videoWidth*k)/2,y+(h-video.videoHeight*k)/2,video.videoWidth*k,video.videoHeight*k];ctx.drawImage(video,...rect);return rect;}
export async function createRhythmMedia(options={}){
 const[plan,catalog]=await Promise.all(['/rhythm-cuts.json','/rhythm-sources.json'].map(async f=>{const r=await fetch(f,{cache:'no-store'});if(!r.ok)throw Error('视频穿插清单未准备好：'+f);return r.json();}));const sources=new Map(catalog.sources.map(s=>[s.key,s]));let current=null,video=null,details=null;
 for(let i=0;i<plan.cuts.length;i++){const w=plan.cuts[i],s=sources.get(w.key);if(!s||w.start>=w.end||w.sourceStart<0||w.sourceEnd>s.duration+.01||(i&&w.start<plan.cuts[i-1].end))throw Error('穿插窗口无效：'+w.id);}
 function idle(){if(video){video.pause();video.removeAttribute('src');video.load();}video=null;current=null;details=null;}
 function avatar(ctx,n,energy){const a=window.FullStudio?.avatar;if(!a)return false;a.draw(n,{framing:'full',energy,motionTime:window.NarrationMotionTime??n,mood:'neutral',lookX:.4});ctx.drawImage(a.canvas,180,495,250,250*1100/900);return true;}
 return{plan,active:n=>plan.cuts.find(w=>n>=w.start&&n<w.end),idle,
  async draw(ctx,n,{energy=0,suppressAvatar=false}={}){const w=plan.cuts.find(w=>n>=w.start&&n<w.end);if(!w)return null;const s=sources.get(w.key);
   if(current!==w.key){idle();video=document.createElement('video');video.muted=true;video.playsInline=true;video.loop=false;video.preload='auto';video.src=s.src;current=w.key;await(video.readyState>=1?Promise.resolve():event(video,'loadedmetadata'));}
   const sourceStart=w.sourceStart??0,sourceEnd=Math.min(w.sourceEnd??Infinity,Math.max(0,video.duration-.035)),elapsed=options.elapsed?.(w,n)??n-w.start,target=clamp(sourceStart+elapsed,Math.min(sourceStart,sourceEnd),sourceEnd);video.pause();if(Math.abs(video.currentTime-target)>.008||video.readyState<2){const pending=event(video,'seeked'),frame=decodedFrame(video,target);video.currentTime=target;await Promise.all([pending,frame]);}
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.fillStyle='#030303';ctx.fillRect(0,0,1920,952);ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();
   const portrait=w.kind==='portrait',box=portrait?[880,45,960,850]:[80,35,1760,855],rect=fit(ctx,video,box);
   let hasAvatar=false;if(portrait){ctx.fillStyle='#eee';ctx.font='600 64px "Noto Serif SC",serif';ctx.textAlign='left';ctx.textBaseline='middle';(w.tagline||[]).forEach((t,i)=>ctx.fillText(t,120,290+i*106));ctx.strokeStyle='#777';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(120,465);ctx.lineTo(730,465);ctx.stroke();if(w.avatar&&!suppressAvatar)hasAvatar=avatar(ctx,n,energy);}
   if(w.qualifier){ctx.font='28px "Microsoft YaHei",sans-serif';ctx.fillStyle='#bbb';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(w.qualifier,120,portrait?188:24);}
   ctx.restore();
   details={id:w.id,key:w.key,sourceTime:video.currentTime,sourceTarget:target,sourceElapsed:elapsed,sourceClock:options.elapsed?'audio-1x':'legacy-n',sourceRect:rect,credit:s.credit,avatar:hasAvatar,noAudio:true,sourceAspectPreserved:true};return details;
  },get audit(){return details},destroy:idle
 };
}

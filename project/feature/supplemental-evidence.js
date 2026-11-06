/* V21.1 additive original-pixel excerpts. Never owns the main compose branch,
 * clears a background, or changes inherited source framing. Sources support
 * url or assetKey; shots use legacy n and sourceRect pixels/normalized crop.
 */
const W=1920,H=952,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);},mix=(a,b,t)=>a+(b-a)*t;
const dims=image=>[image?.naturalWidth||image?.videoWidth||image?.width||0,image?.naturalHeight||image?.videoHeight||image?.height||0];
const rect=(value,fallback)=>Array.isArray(value)?value.slice():value?[
 value.x??value.left??0,value.y??value.top??0,value.width??value.w??0,value.height??value.h??0]:fallback;
const overlaps=(a,b,pad=12)=>a[0]<b[0]+b[2]+pad&&a[0]+a[2]>b[0]-pad&&a[1]<b[1]+b[3]+pad&&a[1]+a[3]>b[1]-pad;

export async function createSupplementalEvidence(options={}){
 let plan=options.plan;
 if(!plan){const response=await fetch(options.planUrl||'/supplemental-evidence-plan.json',{cache:'no-store'});if(!response.ok)throw Error('Supplemental screenshot plan unavailable: '+response.status);plan=await response.json();}
 const sources=new Map((plan.sources||[]).map(source=>[source.id,source]));
 const shots=(plan.shots||[]).filter(s=>s.enabled!==false).slice().sort((a,b)=>a.start-b.start);
 for(let i=0;i<shots.length;i++){const s=shots[i];if(!sources.has(s.sourceId)||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.end<=s.start||(i&&s.start<shots[i-1].end-1e-6))throw Error('Invalid screenshot shot: '+s.id);}
 const loaded=new Map();let destroyed=false,lastAudit={active:false,mode:'additive',clock:'legacy_n'};
 await Promise.all([...sources.values()].filter(s=>s.url).map(async s=>{const image=new Image();image.src=s.url;await image.decode();loaded.set(s.id,image);}));
 const scheduled=n=>!destroyed&&plan.enabled!==false&&Number.isFinite(n)?shots.find(s=>n>=s.start&&n<s.end)||null:null;
 const imageFor=s=>s.assetKey?globalThis.window?.FullStudio?.assets?.[s.assetKey]:loaded.get(s.id);
 function geometry(shot,n){
  const source=sources.get(shot.sourceId),image=imageFor(source),[iw,ih]=dims(image);
  if(!image||iw<=0||ih<=0)return {source,image,reason:'source_not_ready'};
  const base=shot.sourceRect?rect(shot.sourceRect):shot.crop?rect(shot.crop).map((v,i)=>v*(i%2?ih:iw)):[0,0,iw,ih];
  const end=shot.sourceRectEnd?rect(shot.sourceRectEnd):shot.cropEnd?rect(shot.cropEnd).map((v,i)=>v*(i%2?ih:iw)):base;
  const a=shot.start+(shot.pan?.holdStart||0),b=shot.end-(shot.pan?.holdEnd||0),u=shot.pan?.linear?clamp((n-a)/Math.max(.001,b-a)):smooth((n-a)/Math.max(.001,b-a));
  const values=base.map((v,i)=>mix(v,end[i],u)),x=clamp(values[0],0,iw-1),y=clamp(values[1],0,ih-1);
  const crop=[x,y,clamp(values[2],1,iw-x),clamp(values[3],1,ih-y)];
  const rawBox=rect(shot.box,[100,30,1720,890]),box=[clamp(rawBox[0],0,W-1),clamp(rawBox[1],0,H-1),rawBox[2],rawBox[3]];
  box[2]=clamp(box[2],1,W-box[0]);box[3]=clamp(box[3],1,H-box[1]);
  const scale=Math.min(box[2]/crop[2],box[3]/crop[3]),dw=crop[2]*scale,dh=crop[3]*scale;
  return {source,image,crop,box,scale,display:[box[0]+(box[2]-dw)/2,box[1]+(box[3]-dh)/2,dw,dh],coverage:dw*dh/(W*H)};
 }
 function blocked(shot,g,descriptor={}){
  if(g.reason)return g.reason;
  const kind=descriptor.contentKind;
  if(kind&&['quote','infographic','footage','software','evidence'].includes(kind))return 'original_protected_content';
  if(kind&&shot.allowedContentKinds&&!shot.allowedContentKinds.includes(kind))return 'content_kind_not_approved';
  if(descriptor.priority==='reading')return 'original_reading_priority';
  if(descriptor.hasForegroundPresence&&!shot.allowForegroundPresence)return 'foreground_presence';
  if(g.coverage>(shot.maxBodyCoverage??plan.maxBodyCoverage??1)+1e-8)return 'supplement_too_large';
  for(const [name,items] of [['protected_rect',(descriptor.protectedRects||[])],['foreground_rect',(descriptor.foregroundRects||[])]]){
   for(const value of items){const r=rect(value);if(r?.length===3)r.push(r[2]*1100/900);if(r?.length===4&&r.every(Number.isFinite)&&overlaps(g.display,r))return name;}
  }
  return null;
 }
 function active(n,descriptor){const shot=scheduled(n);return !shot||descriptor&&blocked(shot,geometry(shot,n),descriptor)?null:shot;}
 function draw(ctx,n,descriptor={}){
  const shot=scheduled(n);
  if(!shot){lastAudit={active:false,drawn:false,mode:'additive',clock:'legacy_n',time:n};return lastAudit;}
  const g=geometry(shot,n),reason=blocked(shot,g,descriptor),base={id:shot.id,key:g.source.assetKey||g.source.id,sourceId:g.source.id,
   sourceRect:g.crop||null,displayRect:g.display||null,start:shot.start,end:shot.end,readingSeconds:shot.readingSeconds??shot.end-shot.start,
   mode:'additive',clock:'legacy_n',time:n,originalPixels:true,subtitlePixelsTouched:false,preservesLegacyComposition:true,coverageRatio:g.coverage||0};
  if(reason){lastAudit={...base,active:false,scheduled:true,drawn:false,skipReason:reason};return lastAudit;}
  const fade=Math.max(0,shot.fade??.25),alpha=fade?smooth((n-shot.start)/fade)*smooth((shot.end-n)/fade):1;
  ctx.save();
  try{
   ctx.setTransform(1,0,0,1,0,0);ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(g.image,...g.crop,...g.display);
  }finally{ctx.restore();}
  lastAudit={...base,active:true,drawn:alpha>0,alpha,scale:g.scale};return lastAudit;
 }
 function destroy(){destroyed=true;loaded.clear();lastAudit={...lastAudit,destroyed:true};}
 return {active,draw,plan,get audit(){return lastAudit;},destroy};
}

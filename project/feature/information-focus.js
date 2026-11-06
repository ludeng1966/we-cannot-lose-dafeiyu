// A finite camera move for a settled diagram. The source scene remains the authority.
// Call after information.draw(ctx,n), before characters and subtitle compositing.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const interpolateRect=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));

export async function createInformationFocus(){
 const responses=await Promise.all(['information-focus-plan.json','information-plan.json','rhythm-cuts.json'].map(file=>fetch(file,{cache:'no-store'})));
 if(responses.some(r=>!r.ok))throw Error('图解阅读镜头计划载入失败');
 const [plan,information,rhythm]=await Promise.all(responses.map(r=>r.json()));
 const body=plan.body,view=plan.view,overview=plan.overview,timing=plan.timing;
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(1920,1080):document.createElement('canvas');
 canvas.width=1920;canvas.height=1080;const snapshot=canvas.getContext('2d',{alpha:false});
 if(!snapshot)throw Error('图解阅读镜头的离屏画布不可用');
 const inside=(rect,outer)=>rect.length===4&&rect.every(Number.isFinite)&&rect[2]>0&&rect[3]>0&&rect[0]>=outer[0]&&rect[1]>=outer[1]&&rect[0]+rect[2]<=outer[0]+outer[2]+.001&&rect[1]+rect[3]<=outer[1]+outer[3]+.001;
 function validateEntry(entry,label){for(const key of ['primary','secondary'])if(entry?.[key]&&!inside(entry[key].rect,body))throw Error('图解关注区超出正文范围：'+label+' '+key);}
 for(const [kind,row]of Object.entries(plan.kinds))row.stages.forEach((entry,i)=>validateEntry(entry,kind+'/'+i));
 for(const [id,row]of Object.entries(plan.sceneOverrides||{}))for(const [stage,entry]of Object.entries(row.stages||{}))validateEntry(entry,id+'/'+stage);

 function choose(n,arg,options={}){
  const scene=arg?.stages?arg:information.scenes.find(s=>arg?.id?s.id===arg.id:n>=s.start&&n<s.end);
  if(!scene||n<scene.start||n>=scene.end)return null;
  const stage=scene.stages.findLastIndex(s=>n>=s[0]);if(stage<0)return null;
  const stageStart=scene.stages[stage][0],stageEnd=Math.min(scene.end,scene.stages[stage+1]?.[0]??scene.end);
  const choices=plan.kinds[scene.kind]?.stages;if(!choices?.length)return null;
  const entry=plan.sceneOverrides?.[scene.id]?.stages?.[stage]||choices[Math.min(stage,choices.length-1)];
  let candidates=[{index:0,at:stageStart+timing.delay,entry:entry.primary}];
  if(entry.secondary&&stageEnd-stageStart>=timing.secondMinimumStageLength)candidates.push({index:1,at:stageStart+timing.secondAfter,entry:entry.secondary});
  // Derive the cut history from absolute time, including seeks after the runtime's
  // brief resume hint has expired. Otherwise an old primary can reappear for the
  // few remaining frames of its original window after resumeAt + 4.5.
  const priorCut=(rhythm.cuts||[]).reduce((latest,w)=>w.end<=n&&w.end>=stageStart&&w.start<stageEnd&&(!latest||w.end>latest.end)?w:latest,null);
  const hinted=options?.resumeAt;
  const resumeAt=Math.max(priorCut?.end??-Infinity,Number.isFinite(hinted)&&hinted>=stageStart&&hinted<stageEnd&&hinted<=n?hinted:-Infinity);
  if(Number.isFinite(resumeAt)){
   const at=resumeAt+.8,end=Math.min(at+timing.transition*2+timing.hold,stageEnd-timing.stageEndMargin);
   // Keep the brief return to the complete map, then make one finite reading shot.
   // An insufficient window stays on the map rather than starting an abrupt zoom.
   // A candidate whose start fell inside the return interval was consumed by
   // that return. Keep only genuinely later shots, such as a distinct secondary.
   candidates=candidates.filter(candidate=>candidate.at>=resumeAt+4.5);
   if(entry.primary&&end-at>=timing.minimumWindow)candidates.unshift({index:2,at,entry:entry.primary,resumeFromCut:true,resumeAt});
  }
  for(const candidate of candidates){
   if(!candidate.entry)continue;const end=Math.min(candidate.at+timing.transition*2+timing.hold,stageEnd-timing.stageEndMargin);
   if(end-candidate.at<timing.minimumWindow||n<candidate.at||n>=end)continue;
   const enter=smooth((n-candidate.at)/timing.transition),leave=smooth((end-n)/timing.transition),amount=Math.min(enter,leave);
   if(amount<=.00001)return null;
   return{scene,stage,stageStart,stageEnd,index:candidate.index,start:candidate.at,end,amount,entry:candidate.entry,resumeFromCut:!!candidate.resumeFromCut,resumeAt:candidate.resumeAt??null,phase:n<candidate.at+timing.transition?'enter':n>end-timing.transition?'return':'hold'};
  }
  return null;
 }

 function draw(ctx,n,scene,options={}){
  const shot=choose(n,scene,options);if(!shot)return null;
  const source=shot.entry.rect,p=shot.amount,maxScale=Math.min(plan.maxScale,shot.entry.maxScale||plan.maxScale);
  const zoom=Math.min(maxScale,view[2]/source[2],view[3]/source[3]);
  // A reading shot may enlarge a view, but it never shrinks text to fit.
  if(zoom<1)return null;
  const targetCenter=[view[0]+view[2]/2,view[1]+view[3]/2],sourceCenter=[source[0]+source[2]/2,source[1]+source[3]/2];
  const scale=lerp(1,zoom,p),tx=lerp(0,targetCenter[0]-sourceCenter[0]*zoom,p),ty=lerp(0,targetCenter[1]-sourceCenter[1]*zoom,p);
  const sourceClip=interpolateRect(body,source,p);
  snapshot.setTransform(1,0,0,1,0,0);snapshot.globalAlpha=1;snapshot.drawImage(ctx.canvas,0,0,1920,1080);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.beginPath();ctx.rect(...body);ctx.clip();
  ctx.fillStyle='#030303';ctx.fillRect(...body);
  ctx.save();ctx.setTransform(scale,0,0,scale,tx,ty);ctx.beginPath();ctx.rect(...sourceClip);ctx.clip();ctx.drawImage(canvas,...body,...body);ctx.restore();

  // The small map keeps object identity and the complete relationship visible.
  ctx.save();ctx.globalAlpha=p*p;
  const [mx,my,mw,mh]=overview;ctx.fillStyle='#030303';ctx.fillRect(mx-8,my-8,mw+16,mh+16);
  ctx.drawImage(canvas,...body,...overview);ctx.lineWidth=1;ctx.strokeStyle='#505050';ctx.strokeRect(mx-1,my-1,mw+2,mh+2);
  ctx.strokeStyle='#eee';ctx.lineWidth=1.4;
  ctx.strokeRect(mx+(source[0]-body[0])/body[2]*mw,my+(source[1]-body[1])/body[3]*mh,source[2]/body[2]*mw,source[3]/body[3]*mh);
  ctx.restore();ctx.restore();
  return{id:shot.scene.id,kind:shot.scene.kind,stage:shot.stage,index:shot.index,subject:shot.entry.subject,phase:shot.phase,start:shot.start,end:shot.end,nextStageStart:shot.stageEnd,resumeFromCut:shot.resumeFromCut,resumeAt:shot.resumeAt,rect:source.slice(),scale,maximumScale:zoom,overview:overview.slice(),preservesHeadingAndConclusion:true,preservesSubtitleBand:true};
 }
 return{plan,active:choose,draw};
}

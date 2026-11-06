// Audio, semantic staging and ambient motion have independent deterministic clocks.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const EPS=1e-7;
function interpolate(rows,t){
 if(t<=rows[0].new)return rows[0].visualN;
 if(t>=rows.at(-1).new)return rows.at(-1).visualN;
 let a=0,b=rows.length-1;while(b-a>1){const m=(a+b)>>1;if(rows[m].new<=t)a=m;else b=m;}
 const left=rows[a],right=rows[b];return left.visualN+(right.visualN-left.visualN)*(t-left.new)/(right.new-left.new);
}
const rectOverlap=(a,b)=>a.start<b.end-EPS&&a.end>b.start+EPS;
export function createNarrationDirector(conform,editorial={}){
 if(!Array.isArray(conform?.segments)||!conform.speechSegments?.length)throw Error('新配音的逐段导演时轴缺失');
 const segments=conform.segments,speech=conform.speechSegments,duration=conform.newDuration;
 const overrides=(editorial.overrides||[]).filter(r=>r.enabled!==false).slice().sort((a,b)=>a.start-b.start);
 for(let i=0;i<segments.length;i++){const r=segments[i];if(!Number.isFinite(r.start)||!Number.isFinite(r.end)||r.end<=r.start||(i&&Math.abs(r.start-segments[i-1].end)>.0001))throw Error('导演时轴存在空洞或重叠：'+r.id);}
 for(let i=0;i<overrides.length;i++){const r=overrides[i],ref=r.reference;if(!Number.isFinite(r.start)||!Number.isFinite(r.end)||r.end<=r.start||r.start<0||r.end>duration+.0001||!ref||!Number.isFinite(ref.legacyStart)||!Number.isFinite(ref.legacyEnd)||(i&&r.start<overrides[i-1].end-EPS))throw Error('语义重挂窗口无效：'+r.id);}
 function segmentAt(t){return segments.findLast(r=>t>=r.start-EPS)||segments[0];}
 const effectivePauses=new Map();
 const isPVHandoff=row=>row.kind==='pause_jump'&&conform.pvHandoff?.useNextVisualThroughoutPause&&row.beforeGroup===conform.pvHandoff.beforeGroup;
 function baseAt(t){const row=segmentAt(t),pause=effectivePauses.get(row.id)||row;return row.kind==='speech'?interpolate(row.anchors,clamp(t,row.start,row.end)):isPVHandoff(row)?pause.rightVisualN:t<row.jumpAt?pause.leftVisualN:pause.rightVisualN;}
 function overrideAt(t){return overrides.find(r=>t>=r.start&&t<r.end)||null;}
 function overrideValue(row,t){const ref=row.reference;if(ref.mode==='holdCardMid'||ref.mode==='hold')return (ref.legacyStart+ref.legacyEnd)/2;const q=clamp((t-row.start)/(row.end-row.start),0,1);return ref.legacyStart+(ref.legacyEnd-ref.legacyStart)*q;}
 function visualAt(t){t=clamp(t,0,duration);const row=overrideAt(t);return row?overrideValue(row,t):baseAt(t);}
 function speechEndpoint(t,side){
  const override=overrides.find(r=>side==='left'?r.start<t&&r.end>=t:r.start<=t&&r.end>t);if(override)return overrideValue(override,t);
  const row=side==='left'?speech.findLast(r=>r.start<t&&r.end>=t-EPS):speech.find(r=>r.start<=t+EPS&&r.end>t);return row?interpolate(row.anchors,clamp(t,row.start,row.end)):baseAt(t);
 }
 // A moved ending must continue through its pause. Raw builder endpoints may
 // still point to a removed phrase or a quote that has already appeared earlier.
 for(const row of segments.filter(r=>r.kind==='pause_jump'))effectivePauses.set(row.id,{...row,leftVisualN:speechEndpoint(row.start,'left'),rightVisualN:speechEndpoint(row.end,'right')});
 const cuts=[];
 for(const r of effectivePauses.values())if(!isPVHandoff(r)&&Math.abs(r.rightVisualN-r.leftVisualN)>1.5)cuts.push({id:r.id,at:r.jumpAt,halfWidth:Math.min(.47,(r.end-r.start)/2),kind:'paragraph-handoff',skipped:r.skippedOldGroupIds||[]});
 for(const at of new Set(overrides.flatMap(r=>[r.start,r.end]))){if(Math.abs(visualAt(clamp(at-.00001,0,duration))-visualAt(clamp(at+.00001,0,duration)))>3)cuts.push({id:'semantic-at-'+at,at,halfWidth:.22,kind:'semantic-handoff'});}
 function transitionAt(t){let best=null;for(const cut of cuts){const p=Math.abs(t-cut.at)/cut.halfWidth;if(p>=1)continue;const amount=Math.cos(p*Math.PI/2)**2;if(!best||amount>best.amount)best={...cut,amount};}return best;}
 function stateAt(t){t=clamp(t,0,duration);const segment=segmentAt(t),override=overrideAt(t);return{audioTime:t,visualN:override?overrideValue(override,t):baseAt(t),animationTime:t,groupId:override?.groupId||(segment.kind==='speech'?segment.id:segment.beforeGroup),kind:segment.kind,overrideId:override?.id||null,transition:transitionAt(t),skippedOldGroupIds:segment.skippedOldGroupIds||[]};}
 // Inverse ranges are built from the very same piecewise tracks as rendering.
 const edges=[];
 for(const s of speech)for(let i=1;i<s.anchors.length;i++){const a=s.anchors[i-1],b=s.anchors[i];edges.push({start:a.new,end:b.new,left:a.visualN,right:b.visualN,id:s.id,base:true});}
 for(const s of effectivePauses.values()){const left=isPVHandoff(s)?s.rightVisualN:s.leftVisualN;edges.push({start:s.start,end:s.jumpAt,left,right:left,id:s.id+'-left',base:true},{start:s.jumpAt,end:s.end,left:s.rightVisualN,right:s.rightVisualN,id:s.id+'-right',base:true});}
 for(const r of overrides)edges.push({start:r.start,end:r.end,left:overrideValue(r,r.start),right:overrideValue(r,r.end),id:r.id,override:r});
 const rangeCache=new Map();
 function rangesForVisual(start,end){
  const key=start+':'+end;if(rangeCache.has(key))return rangeCache.get(key);
  const ranges=[];
  for(const e of edges){
   const lo=Math.min(e.left,e.right),hi=Math.max(e.left,e.right);if(hi<start-EPS||lo>=end-EPS)continue;
   let a=e.start,b=e.end;
   if(Math.abs(e.right-e.left)>EPS){const t0=e.start+(start-e.left)/(e.right-e.left)*(e.end-e.start),t1=e.start+(end-e.left)/(e.right-e.left)*(e.end-e.start);a=Math.max(e.start,Math.min(t0,t1));b=Math.min(e.end,Math.max(t0,t1));}
   if(b-a<EPS)continue;
   let pieces=[{start:a,end:b}];
   if(e.base)for(const r of overrides){if(!rectOverlap({start:a,end:b},r))continue;pieces=pieces.flatMap(p=>!rectOverlap(p,r)?[p]:[{start:p.start,end:Math.min(p.end,r.start)},{start:Math.max(p.start,r.end),end:p.end}].filter(q=>q.end-q.start>EPS));}
   ranges.push(...pieces);
  }
  ranges.sort((a,b)=>a.start-b.start);const merged=[];for(const r of ranges){const previous=merged.at(-1);if(previous&&r.start<=previous.end+.00005)previous.end=Math.max(previous.end,r.end);else merged.push({...r});}
  let elapsed=0;for(const r of merged){r.elapsedBefore=elapsed;elapsed+=r.end-r.start;}
  rangeCache.set(key,merged);return merged;
 }
 function audioAtVisual(value,bias='first'){
  const points=[];
  for(const e of edges){if(value<Math.min(e.left,e.right)-EPS||value>Math.max(e.left,e.right)+EPS)continue;const t=Math.abs(e.right-e.left)<EPS?(bias==='last'?e.end:e.start):e.start+(value-e.left)/(e.right-e.left)*(e.end-e.start);if(e.base&&overrideAt(t))continue;points.push(t);}
  if(points.length)return bias==='last'?Math.max(...points):Math.min(...points);
  // Removed material has no invented screen time. Navigation goes to the nearest retained cue.
  const times=[...new Set(edges.flatMap(e=>[e.start,e.end]))],candidates=times.flatMap(t=>[-.00001,0,.00001].map(delta=>{const at=clamp(t+delta,0,duration);return{t:at,v:visualAt(at)};}));candidates.sort((a,b)=>Math.abs(a.v-value)-Math.abs(b.v-value)||(bias==='last'?b.t-a.t:a.t-b.t));return candidates[0]?.t??0;
 }
 function sourceElapsed(t,start,end){const ranges=rangesForVisual(start,end),row=ranges.find(r=>t>=r.start-.0001&&t<r.end+.0001)||ranges.findLast(r=>r.start<=t)||ranges[0];return row?Math.max(0,row.elapsedBefore+clamp(t-row.start,0,row.end-row.start)):0;}
 function decorateMotionPlan(plan){return{...plan,motionSegments:(plan.motionSegments||[]).map(r=>{const ranges=rangesForVisual(r.start,r.holdEnd??r.end);return{...r,audioStart:ranges[0]?.start??NaN,audioEnd:ranges.at(-1)?.end??NaN};})};}
 return{conform,editorial,duration,stateAt,visualAt,audioAtVisual,rangesForVisual,sourceElapsed,decorateMotionPlan,overrides,cuts,effectivePauses:[...effectivePauses.values()]};
}

export async function loadNarrationDirector(){
 const responses=await Promise.all(['narration-conform-v23.json','research/narration-v23-editorial-overrides.json'].map(url=>fetch(url,{cache:'no-store'})));for(const r of responses)if(!r.ok)throw Error('新配音导演数据未就绪：'+r.status);return createNarrationDirector(await responses[0].json(),await responses[1].json());
}

export function drawNarrationHandoff(ctx,state){
 const transition=state?.transition;if(!transition||transition.amount<.001)return null;
 const a=transition.amount,t=state.animationTime,W=1920,H=952;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
 ctx.fillStyle='#080909';ctx.globalAlpha=.94*a;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.25*a;ctx.strokeStyle='#d2cec3';ctx.lineWidth=1;
 ctx.translate(960,476);ctx.rotate(-.18+Math.sin(t*.04)*.06);
 for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(0,0,340+i*160,70+i*55,t*.025+i*.09,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle='#98352f';ctx.globalAlpha=.32*a;ctx.beginPath();ctx.ellipse(0,0,800,220,-.2,0,Math.PI*2);ctx.stroke();ctx.restore();
 return{id:transition.id,kind:transition.kind,amount:a,skippedOldGroupIds:transition.skipped||[],cameraShake:false,subtitleTouched:false};
}

export function drawNarrationSemanticCue(ctx,state,editorial,descriptor={}){
 const cue=editorial?.semanticCues?.find(r=>state.audioTime>=r.start&&state.audioTime<r.end);if(!cue)return null;
 const value=cue.id==='g017-future-material-basis'?cue.label+' · '+cue.secondary:cue.label;
 const protectedRects=[...(descriptor.protectedRects||[]),...(descriptor.foregroundRects||[])].map(r=>Array.isArray(r)?{x:r[0],y:r[1],width:r[2],height:r[3]}:r);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.filter='none';ctx.globalCompositeOperation='source-over';
 let place=null;
 for(const size of [34,30,26]){ctx.font=`600 ${size}px "Noto Serif SC",serif`;const width=ctx.measureText(value).width+64;if(width>1690)continue;for(const cy of [25,920]){const r={x:960-width/2,y:cy-size*.7,width,height:size*1.7};if(r.y<3||r.y+r.height>948||protectedRects.some(p=>r.x<p.x+p.width+10&&r.x+r.width>p.x-10&&r.y<p.y+p.height+10&&r.y+r.height>p.y-10))continue;place={...r,size,cx:960,cy};break;}if(place)break;}
 if(!place){ctx.restore();return{id:cue.id,drawn:false,reason:'original_content_has_priority',sourceFrameUntouched:true};}
 const fade=Math.min(1,(state.audioTime-cue.start)/.22,(cue.end-state.audioTime)/.22),u=clamp((state.audioTime-cue.start)/(cue.end-cue.start),0,1);
 ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();ctx.globalAlpha=Math.max(0,fade)*.94;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e8e4db';ctx.fillText(value,place.cx,place.cy);
 const left=place.x+32,right=place.x+place.width-32,y=place.cy+place.size*.75;ctx.strokeStyle='#9a3b35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+(right-left)*u,y);ctx.stroke();ctx.fillStyle='#c9c5b9';ctx.beginPath();ctx.arc(left+(right-left)*u,y,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
 return{id:cue.id,drawn:true,text:value,rect:place,clock:'new_audio_seconds',sourceFrameUntouched:true,cardPanel:false};
}

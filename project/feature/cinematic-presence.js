/* Generated character depth layers. Legacy narration clock n; no audio/mouth alignment.
 * Required descriptor: contentKind, protectedRects, legacyLive, presenceWindow.
 * Optional plan.presenceWindows overrides these authored semantic windows.
 */
import {createPVSpace} from './pv-space.js';
const W=1920,H=952,F=1100,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
const DEFAULT_WINDOWS=[
 ['future-window',40.8,55.8,'background','portrait','right','承接未来的损失'],
 ['ecology-memory',146,162,'background','full','left','错失的民间生态'],
 ['repeated-labour',226,243,'background','portrait','right','重新劳动与创造机会'],
 ['first-creators',390,407,'background','full','left','群众第一次创造'],
 ['thought-products',845,861,'background','blueprint','right','思想成为劳动产品'],
 ['interest-threshold',1059,1075,'background','portrait','left','兴趣进入技术门槛'],
 ['partner-desire',1131,1147,'background','reach','right','伙伴愿望与主动性'],
 ['first-creation',1235,1249,'background','full','left','第一次完成创造'],
 ['find-open-source',1332,1349,'background','blueprint','right','主动寻找开源'],
 ['play-to-practice',1410,1429,'background','portrait','left','娱乐积累技术经验'],
 ['shared-production',1873,1891,'background','full','right','群众化与共同成果'],
 ['lost-opportunity',2006,2024,'background','portrait','left','未实现的创造机会'],
 ['student-counterfactual',2059,2073,'background','blueprint','right','学生的另一种可能'],
 ['history-not-repeat',2184,2202,'background','full','left','不让历史重演'],
 ['return-to-partner',2413,2435,'background','reach','right','回到可爱的伙伴'],
 ['common-future',2467,2485,'background','blueprint','left','共同支配未来'],
 ['practice-growth',2516,2535,'background','portrait','right','实践中的成长'],
 ['ending-dignity',2564,2589,'background','full','left','结语的主体尊严'],
 ['future-side',48,56,'side','portrait','left','问题承接'],
 ['creators-side',413,423,'side','full','right','从消费者转向创造者'],
 ['products-side',852,861,'side','blueprint','left','把思想化为产品'],
 ['partner-side',1148,1159,'side','reach','left','伙伴与愿望'],
 ['creation-side',1238,1248,'side','full','right','第一次创造'],
 ['open-source-side',1341,1351,'side','blueprint','left','主动实践'],
 ['common-side',1880,1890,'side','full','left','共同成果'],
 ['counterfactual-side',2062,2072,'side','portrait','left','创造机会'],
 ['partner-return-side',2420,2432,'side','reach','left','回到伙伴'],
 ['last-future-side',2470,2483,'side','full','right','共同决定未来'],
 ['ending-native',2496,2504,'side','native','left','结语短暂原生承接']
].map((r,i)=>({id:r[0],start:r[1],end:r[2],layer:r[3],asset:r[4],edge:r[5],meaning:r[6],index:i}));
const ASSET_URLS={portrait:'/assets/pv-opening/fish-portrait-v1.png',full:'/assets/pv-opening/fish-full-v1.png',blueprint:'/assets/full-film-cinematic/fish-blueprint-v1.png',reach:'/assets/full-film-cinematic/fish-reach-v1.png'};
const normaliseRects=input=>(Array.isArray(input)?input:[]).filter(Boolean).map(r=>Array.isArray(r)?{x:r[0],y:r[1],width:r[2],height:r[3]}:
 {x:r.x??r.left??0,y:r.y??r.top??0,width:r.width??r.w??((r.right??0)-(r.x??r.left??0)),height:r.height??r.h??((r.bottom??0)-(r.y??r.top??0))})
 .filter(r=>[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0);
const intersects=(a,b,pad=20)=>a.x<b.x+b.width+pad&&a.x+a.width>b.x-pad&&a.y<b.y+b.height+pad&&a.y+a.height>b.y-pad;
const frontPresent=d=>!!(d.presenceWindow||d.hasLegacyPresence||d.legacyLive||d.legacyLive?.live);

export async function createCinematicPresence({manifest,plan}={}){
 const authored=plan?.presenceWindows||plan?.cinematicPresence?.windows||DEFAULT_WINDOWS;
 const windows=authored.filter(r=>r.start>=0&&r.end>r.start&&r.end<=(manifest?.duration||Infinity)+.05).map((r,i)=>({...r,index:r.index??i}));
 const images=new Map(),space=createPVSpace({width:W,height:H});let destroyed=false;
 let audit={version:'V20-cinematic-presence',clock:'legacy_n',background:null,side:null,windows:windows.length,loadedAssets:[]};
 await Promise.all(Object.entries({...ASSET_URLS,...(plan?.characterAssets||{})}).map(async([key,url])=>{
  const image=new Image();image.src=url;await image.decode();images.set(key,image);
 }));
 audit.loadedAssets=[...images.keys()];
 let nativeCrop=null,nativeSurface=null,nativeCtx=null;
 function imageFor(key,n){
  if(key==='native'){
   const avatar=window.FullStudio?.avatar;
   if(avatar){
    avatar.draw(n,{framing:'full',energy:0,motionTime:window.NarrationMotionTime??n,mood:'neutral',lookX:.25,lookY:0});
    if(!nativeSurface){nativeSurface=document.createElement('canvas');nativeSurface.width=avatar.canvas.width;nativeSurface.height=avatar.canvas.height;nativeCtx=nativeSurface.getContext('2d',{willReadFrequently:true});}
    nativeCtx.setTransform(1,0,0,1,0,0);nativeCtx.clearRect(0,0,nativeSurface.width,nativeSurface.height);nativeCtx.drawImage(avatar.canvas,0,0);
    if(!nativeCrop){const pixels=nativeCtx.getImageData(0,0,nativeSurface.width,nativeSurface.height).data;let x0=nativeSurface.width,y0=nativeSurface.height,x1=0,y1=0;
     for(let y=0;y<nativeSurface.height;y++)for(let x=0;x<nativeSurface.width;x++)if(pixels[(y*nativeSurface.width+x)*4+3]>12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
     const c=document.createElement('canvas');c.width=Math.max(1,x1-x0+1);c.height=Math.max(1,y1-y0+1);nativeCrop={canvas:c,ctx:c.getContext('2d'),x:x0,y:y0,width:c.width,height:c.height};}
    nativeCrop.ctx.clearRect(0,0,nativeCrop.width,nativeCrop.height);nativeCrop.ctx.drawImage(nativeSurface,nativeCrop.x,nativeCrop.y,nativeCrop.width,nativeCrop.height,0,0,nativeCrop.width,nativeCrop.height);
    return {image:nativeCrop.canvas,key:'native',dynamic:true};
   }
  }
  const actual=images.has(key)?key:key==='reach'?'portrait':'full';return {image:images.get(actual)||images.get('portrait'),key:actual,dynamic:false};
 }
 function active(n,descriptor={}){
  if(destroyed||!Number.isFinite(n)||descriptor.pv||descriptor.skipCinematicPresence||/pv-opening/.test(String(descriptor.clipKey||descriptor.clip||'')))return null;
  const rows=windows.filter(r=>n>=r.start&&n<r.end);if(!rows.length)return null;
  return {background:rows.find(r=>r.layer==='background')||null,side:frontPresent(descriptor)?null:rows.find(r=>r.layer==='side')||null,legacyTime:n};
 }
 function clipBody(ctx,rects){ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  for(const r of rects){ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(r.x-20,r.y-20,r.width+40,r.height+40);ctx.clip('evenodd');}
 }
 function frontSide(d){const box=d.presenceWindow?.box||d.presenceWindow?.safeBox||d.presenceWindow?.avatar;
  return Array.isArray(box)?box[0]+box[2]/2<W/2?'left':'right':'left';}
 function drawLayer(ctx,n,descriptor,layer){
  const selected=active(n,descriptor),row=selected?.[layer],rects=normaliseRects(descriptor.protectedRects||descriptor.protectedRegions);
  const skip=reason=>{const value={drawn:false,reason,legacyTime:n,layer};audit={...audit,[layer]:value};return value;};
  if(!row)return skip(frontPresent(descriptor)&&layer==='side'?'existing_foreground_presence':'outside_window');
  if(rects.some(r=>r.x<=20&&r.y<=20&&r.x+r.width>=W-20&&r.y+r.height>=H-20))return skip('fully_protected_content');
  const u=clamp((n-row.start)/(row.end-row.start)),q=smooth(u),fade=smooth((n-row.start)/1.5)*smooth((row.end-n)/1.5),hasFront=frontPresent(descriptor);
  const resolved=imageFor(row.asset,n),image=resolved.image;if(!image)return skip('asset_unavailable');
  let edge=row.edge||'right';if(layer==='background'&&hasFront)edge=frontSide(descriptor)==='left'?'right':'left';
  const direction=edge==='left'?1:-1,approach=row.index%3!==1;
  const depth=layer==='background'?mix(approach?2050:1350,approach?1390:2150,q):mix(1460,1190,q);
  const planeHeight=layer==='background'?1400:row.asset==='portrait'||row.asset==='reach'?465:640;
  let planeWidth=planeHeight*(image.naturalWidth||image.width)/(image.naturalHeight||image.height);
  if(layer==='side')planeWidth=Math.min(planeWidth,355*depth/F);
  const height=planeWidth*(image.naturalHeight||image.height)/(image.naturalWidth||image.width);
  let x=layer==='background'?mix(edge==='left'?290:1630,edge==='left'?470:1450,q):mix(edge==='left'?145:1775,edge==='left'?220:1700,q);
  const y=layer==='background'?mix(435,475,q):mix(485,450,q);
  const opacity=fade*(layer==='background'?(hasFront ? .085 : .155):.88);
  const pose={x,y,width:planeWidth,height,depth,yaw:direction*mix(-.24,.12,q),pitch:mix(.045,-.025,q),roll:direction*mix(-.035,.025,q),opacity,dynamic:resolved.dynamic};
  if(layer==='side'){
   let projectedWidth=pose.width*F/depth*1.2,projectedHeight=pose.height*F/depth*1.2;
   const fit=Math.min(1,(W-48)/projectedWidth,(H-48)/projectedHeight);
   pose.width*=fit;pose.height*=fit;projectedWidth*=fit;projectedHeight*=fit;
   pose.x=clamp(pose.x,24+projectedWidth/2,W-24-projectedWidth/2);
   pose.y=clamp(pose.y,24+projectedHeight/2,H-24-projectedHeight/2);
   const bounds={x:pose.x-projectedWidth/2,y:pose.y-projectedHeight/2,width:projectedWidth,height:projectedHeight};
   if(rects.some(r=>intersects(bounds,r))){
    const flipped={...bounds,x:W-bounds.x-bounds.width};
    if(rects.some(r=>intersects(flipped,r)))return skip('no_safe_side_space');
    pose.x=W-pose.x;pose.yaw=-pose.yaw;pose.roll=-pose.roll;edge=edge==='left'?'right':'left';
   }
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';clipBody(ctx,rects);
  const rendered=space.drawPlane(ctx,image,pose);ctx.restore();
  const value={drawn:rendered.planes>0,id:row.id,meaning:row.meaning,layer,legacyTime:n,asset:resolved.key,requestedAsset:row.asset,
   edge,opacity,pose,renderer:rendered.mode,composites:rendered.composites,protectedRects:rects,subtitlePixelsTouched:false,
   intentionalLowVisibilityBackdrop:layer==='background'&&hasFront,native:resolved.key==='native',mouthEnergy:0,absoluteTimeMotion:true};
  audit={...audit,[layer]:value};return value;
 }
 function destroy(){if(destroyed)return;destroyed=true;space.destroy();images.clear();if(nativeSurface){nativeSurface.width=1;nativeSurface.height=1;}if(nativeCrop){nativeCrop.canvas.width=1;nativeCrop.canvas.height=1;}audit={...audit,destroyed:true};}
 return {active,drawBackground:(ctx,n,descriptor={})=>drawLayer(ctx,n,descriptor,'background'),drawSide:(ctx,n,descriptor={})=>drawLayer(ctx,n,descriptor,'side'),get audit(){return audit;},destroy};
}

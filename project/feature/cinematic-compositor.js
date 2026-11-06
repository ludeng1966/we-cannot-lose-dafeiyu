// Replace only full-size opaque dark clears. The existing scene then paints its
// original animation, media and character directly over the new environment.
// No pixel keying, screen blend, colour filtering or media resampling is used.
import {createPVSpace} from './pv-space.js';
const W=1920,H=952;
const finite=n=>Number.isFinite(Number(n));
function darkOpaque(style){
  if(typeof style!=='string')return false;
  let s=style.trim().toLowerCase(),channels;
  if(/^#[0-9a-f]{3}$/.test(s))channels=[...s.slice(1)].map(v=>parseInt(v+v,16));
  else if(/^#[0-9a-f]{6}$/.test(s))channels=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  else if(/^#[0-9a-f]{8}$/.test(s)){if(parseInt(s.slice(7,9),16)<254)return false;channels=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));}
  else if(s==='black')channels=[0,0,0];
  else {const m=/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(s);if(!m||m[4]!==undefined&&Number(m[4])<.999)return false;channels=m.slice(1,4).map(Number);}
  return channels.every(v=>v<=38);
}
export function isReplaceableClear(ctx,x,y,w,h){
  if(![x,y,w,h].every(finite)||Math.abs(x)>.01||Math.abs(y)>.01||w<W-.01||h<H-.01)return false;
  if(ctx.globalAlpha<.999||ctx.globalCompositeOperation!=='source-over'||!darkOpaque(ctx.fillStyle))return false;
  const m=ctx.getTransform();
  return Math.abs(m.a-1)<1e-6&&Math.abs(m.d-1)<1e-6&&Math.abs(m.b)<1e-6&&Math.abs(m.c)<1e-6&&Math.abs(m.e)<.01&&Math.abs(m.f)<.01;
}
export function createCinematicCompositor(world,{createCanvas=()=>document.createElement('canvas'),motionPlan={},space:providedSpace,characterLayer=null}={}){
  const plate=createCanvas();plate.width=W;plate.height=H;const pc=plate.getContext('2d',{alpha:false});
  const content=createCanvas();content.width=W;content.height=H;const cc=content.getContext('2d');
  const edgeMask=createCanvas();edgeMask.width=W;edgeMask.height=H;const ec=edgeMask.getContext('2d');
  const vertical=ec.createLinearGradient(0,0,0,H);vertical.addColorStop(0,'rgba(255,255,255,0)');vertical.addColorStop(.025,'white');vertical.addColorStop(.958,'white');vertical.addColorStop(1,'rgba(255,255,255,0)');ec.fillStyle=vertical;ec.fillRect(0,0,W,H);
  const horizontal=ec.createLinearGradient(0,0,W,0);horizontal.addColorStop(0,'rgba(255,255,255,0)');horizontal.addColorStop(.012,'white');horizontal.addColorStop(.988,'white');horizontal.addColorStop(1,'rgba(255,255,255,0)');ec.globalCompositeOperation='destination-in';ec.fillStyle=horizontal;ec.fillRect(0,0,W,H);
  const space=providedSpace||createPVSpace({width:W,height:H});
  const attached=new Map();let enabled=true,active=false,drawing=false,time=0,descriptor={},backgroundAudit=null,foregroundAudit=null,clears=[],sceneCamera=null;
  function paint(ctx,label){
    if(!active||drawing)return;
    drawing=true;ctx.save();
    try{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.drawImage(plate,0,0,W,H);characterLayer?.drawBackground(ctx,time,descriptor);clears.push(label);}
    finally{ctx.restore();drawing=false;}
  }
  function attach(ctx,label='scene'){
    if(attached.has(ctx))return;
    const original=ctx.fillRect;
    const wrapped=function(x,y,w,h){const replace=active&&!drawing&&isReplaceableClear(this,x,y,w,h);if(replace&&label==='legacy-animation'){this.clearRect(x,y,w,h);clears.push(label);return;}original.call(this,x,y,w,h);if(replace)paint(this,label);};
    ctx.fillRect=wrapped;attached.set(ctx,{original,wrapped});
  }
  function begin(n,next={}){
    active=false;time=n;descriptor=next;clears=[];foregroundAudit=null;sceneCamera=null;
    if(!enabled){backgroundAudit=null;return;}
    pc.setTransform(1,0,0,1,0,0);pc.globalAlpha=1;pc.globalCompositeOperation='source-over';pc.filter='none';pc.fillStyle='#060606';pc.fillRect(0,0,W,H);
    backgroundAudit=world.drawBackground(pc,n,next);active=true;
  }
  function foreground(ctx){
    if(!active)return null;
    drawing=true;try{foregroundAudit=world.drawForeground(ctx,time,descriptor);characterLayer?.drawSide(ctx,time,descriptor);}finally{drawing=false;}
    return foregroundAudit;
  }
  function cameraAt(n,kind){
    if(kind!=='animation')return {scale:1,x:0,y:0,yaw:0,pitch:0,roll:0};
    const row=motionPlan.motionSegments?.find(r=>n>=r.start&&n<(r.holdEnd??r.end)),start=row?.start??Math.floor(n/55)*55,end=row?.holdEnd??row?.end??start+55;
    const directed=Number.isFinite(descriptor.audioTime)&&Number.isFinite(row?.audioStart)&&Number.isFinite(row?.audioEnd),progressTime=directed?descriptor.audioTime:n,progressStart=directed?row.audioStart:start,progressEnd=directed?row.audioEnd:end;
    const p=Math.max(0,Math.min(1,(progressTime-progressStart)/Math.max(1,progressEnd-progressStart))),smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const protectedMotion=(row?.windowsMotion||[]).filter(w=>n>=w.start-1.2&&n<w.end+.9&&w.kind!=='animation');
    const motionMultiplier=protectedMotion.length?Math.min(...protectedMotion.map(w=>1-smooth((n-w.start+1.2)/1.2)*smooth((w.end+.9-n)/.9))):1;
    const e=smooth((progressTime-progressStart)/3.2)*smooth((progressEnd-progressTime)/3.5),a=(row?.cameraIntensity??.85)*e*motionMultiplier,phase=p*Math.PI*2;
    const kindOfMove=row?.movementKind||'orbit';let x=0,y=0,yaw=0,pitch=0;
    if(kindOfMove==='corridor'){x=38*a*Math.sin(phase);y=13*a*Math.sin(phase*.5);yaw=.11*a*Math.sin(phase*.75);pitch=.025*a*Math.cos(phase);}
    else if(kindOfMove==='crane'||kindOfMove==='bloom'){x=27*a*Math.sin(phase*.65);y=-25*a*Math.sin(phase*.5);yaw=.07*a*Math.sin(phase);pitch=.055*a*Math.sin(phase*.7);}
    else if(kindOfMove==='bridge'){x=60*a*Math.sin(phase*.6);y=16*a*Math.sin(phase);yaw=-.10*a*Math.sin(phase*.6);pitch=.025*a*Math.sin(phase*.7);}
    else if(kindOfMove==='converge'){x=28*a*Math.sin(phase);y=20*a*Math.cos(phase*.7);yaw=.08*a*Math.sin(phase*.8);pitch=-.035*a*Math.sin(phase*.7);}
    else if(kindOfMove==='loss'){x=-42*a*Math.sin(phase*.5);y=12*a*Math.sin(phase*.7);yaw=.065*a*Math.sin(phase*.6);pitch=.018*a*Math.sin(phase);}
    else{x=48*a*Math.sin(phase*.7);y=22*a*Math.cos(phase*.55);yaw=.115*a*Math.sin(phase*.7);pitch=.04*a*Math.cos(phase*.6);}
    // The transparent plane remains inside the body. Its moving edges are not panels.
    const pose={scale:1-.09*a-.25*Math.abs(yaw),x,y,yaw,pitch,roll:.009*a*Math.sin(phase*.65),segment:row?.id||null,movementKind:kindOfMove,intensity:a};
    // Bound the complete rotated quad, including its perspective-near corners.
    // The inset tends to zero with the motion, so protected cuts meet identity.
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(-pose.roll),sr=Math.sin(-pose.roll),hw=W/2-8*a,hh=H/2-8*a,F=1100;
    for(const u of [-.5,.5])for(const v of [-.5,.5]){
      let px=u*W,py=-v*H,pz=0;[px,pz]=[cy*px+sy*pz,-sy*px+cy*pz];[py,pz]=[cp*py-sp*pz,sp*py+cp*pz];[px,py]=[cr*px-sr*py,sr*px+cr*py];
      for(const sign of [-1,1]){const dx=F*sign*px+hw*pz,dy=F*sign*py+hh*pz;if(dx>0)pose.scale=Math.min(pose.scale,F*(hw-sign*x)/dx);if(dy>0)pose.scale=Math.min(pose.scale,F*(hh+sign*y)/dy);}
    }
    return pose;
  }
  function drawScene(ctx,source,n,kind='animation'){
    const camera=enabled?cameraAt(n,kind):{scale:1,x:0,y:0,yaw:0,pitch:0,roll:0};sceneCamera=camera;ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    if(enabled&&kind==='animation'&&camera.intensity>.0001){
      cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,W,H);cc.drawImage(source,0,0,W,H,0,0,W,H);
      cc.save();cc.globalCompositeOperation='destination-in';cc.drawImage(edgeMask,0,0);cc.restore();
      space.drawPlane(ctx,content,{x:W/2+camera.x,y:H/2+camera.y,width:W*camera.scale,height:H*camera.scale,depth:1100,yaw:camera.yaw,pitch:camera.pitch,roll:camera.roll,opacity:1,dynamic:true});
    }else ctx.drawImage(source,0,0,W,H,0,0,W,H);
    ctx.restore();return camera;
  }
  function suspend(){active=false;}
  function destroy(){active=false;for(const[ctx,{original,wrapped}]of attached){if(ctx.fillRect===wrapped)ctx.fillRect=original;}attached.clear();plate.width=1;plate.height=1;content.width=1;content.height=1;edgeMask.width=1;edgeMask.height=1;if(!providedSpace)space.destroy();world.destroy?.();characterLayer?.destroy?.();}
  return {attach,begin,foreground,drawScene,suspend,destroy,cameraAt,setEnabled(value){enabled=!!value;if(!enabled)active=false;},
    get enabled(){return enabled;},
    get audit(){return {version:'V20',enabled,time,contentKind:descriptor.contentKind,background:backgroundAudit,foreground:foregroundAudit?.foreground||foregroundAudit,character:characterLayer?.audit||null,replacedClears:clears.length,targets:[...new Set(clears)],sourceMediaUnfiltered:true,transparentContentPlane:true,subtitleAreaUntouched:true,frameShake:false,camera:sceneCamera||{scale:1,x:0,y:0},absoluteTime:true};}};
}

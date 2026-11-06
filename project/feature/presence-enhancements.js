const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export async function createPresenceEnhancements(){
 const response=await fetch('presence-plan.json',{cache:'no-store'});if(!response.ok)throw Error('人物留白方案载入失败');const plan=await response.json(),crops=new Map();
 const buffer=document.createElement('canvas');buffer.width=900;buffer.height=1100;const pixels=buffer.getContext('2d',{willReadFrequently:true});
 function cropFor(avatar,framing){if(crops.has(framing))return crops.get(framing);avatar.draw(0,{framing,energy:0,motionTime:0,mood:'neutral',lookX:.35});pixels.clearRect(0,0,900,1100);pixels.drawImage(avatar.canvas,0,0);const data=pixels.getImageData(0,0,900,1100).data;let x0=900,y0=1100,x1=-1,y1=-1;for(let y=0;y<1100;y++)for(let x=0;x<900;x++)if(data[(y*900+x)*4+3]>8){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<x0)throw Error('原生人物画面为空');x0=Math.max(0,x0-8);y0=Math.max(0,y0-8);x1=Math.min(899,x1+8);y1=Math.min(1099,y1+8);const crop=[x0,y0,x1-x0+1,y1-y0+1];crops.set(framing,crop);return crop;}
 function active(n){return plan.windows.find(w=>n>=w.start&&n<w.end);}
 function draw(ctx,n,{window:row=active(n),focus=null,energy=0}={}){
  let cue=row;if(focus){if(focus.phase!=='hold')return null;cue={...plan.focus,id:'v18-focus-'+focus.id,subject:focus.id,group:'focus',start:focus.start+plan.focus.transition,end:focus.end-plan.focus.transition};}
  if(!cue)return null;const avatar=window.FullStudio?.avatar;if(!avatar)return null;
  const opacity=ease((n-cue.start)/cue.fade)*ease((cue.end-n)/cue.fade);if(opacity<.001)return null;
  const crop=cropFor(avatar,cue.framing),[x,y,w,h]=cue.box,k=Math.min(w/crop[2],h/crop[3]),dw=crop[2]*k,dh=crop[3]*k,rect=[x+(w-dw)/2,y+h-dh,dw,dh];
  avatar.draw(n,{framing:cue.framing,energy,motionTime:window.NarrationMotionTime??n,mood:cue.mood,lookX:cue.lookX});
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=opacity;ctx.filter='none';ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(avatar.canvas,...crop,...rect);ctx.restore();
  return{id:cue.id,subject:cue.subject,group:cue.group,framing:cue.framing,safeBox:cue.box,visibleBox:rect,sourceCrop:crop,opacity,nativeModel:true,backgroundUntouched:true};
 }
 return{plan,active,draw};
}

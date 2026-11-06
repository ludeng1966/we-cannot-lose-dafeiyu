const windows=[
 {id:'dsh-run-detail',key:'v12_dsh_cloud',start:594.05,end:598.9,cx:.60,cy:.40,zoom:1.22},
 {id:'shared-clients-detail',key:'v12_share_room',start:1698.05,end:1702.4,cx:.60,cy:.49,zoom:1.25},
 {id:'flow-graph-detail',key:'v12_langflow_build',start:2084.3,end:2088,cx:.47,cy:.47,zoom:1.20},
 {id:'flow-output-detail',key:'v12_langflow_build',start:2094.1,end:2097.8,cx:.60,cy:.47,zoom:1.22}
];
let buffer,context;const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function drawEvidenceMotion(ctx,n){const w=windows.find(r=>n>=r.start&&n<r.end);if(!w)return null;const source=window.MediaV12.windows.find(r=>r.key===w.key);if(!source)return null;
 if(!buffer){buffer=document.createElement('canvas');buffer.width=1920;buffer.height=1080;context=buffer.getContext('2d');}context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,1920,1080);context.drawImage(ctx.canvas,0,0);
 const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},p=ease((n-w.start)/.38)*ease((w.end-n)/.38),z=1+(w.zoom-1)*p,[x,y,width,height]=source.box,sw=width/z,sh=height/z;
 const cx=clamp(.5+(w.cx-.5)*p,1/(2*z),1-1/(2*z)),cy=clamp(.5+(w.cy-.5)*p,1/(2*z),1-1/(2*z));ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.drawImage(buffer,x+width*cx-sw/2,y+height*cy-sh/2,sw,sh,x,y,width,height);ctx.restore();return{id:w.id,key:w.key,zoom:z,box:source.box};
}

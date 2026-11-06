const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
// Rectangles are normalized against the visible, original-aspect source image.
// These windows were checked in qa/source-*.png; no source content is rewritten.
export const callouts=[
 {id:'dsh-request',key:'v12_dsh_cloud',start:587.7,end:589.2,size:[1280,800],rect:[.48,.105,.44,.105],label:'提出具体需求'},
 {id:'dsh-write',key:'v12_dsh_cloud',start:589.2,end:593.5,size:[1280,800],rect:[.30,.367,.19,.045],label:'工具动作：写入 primes.js'},
 {id:'dsh-output',key:'v12_dsh_cloud',start:599.6,end:603.7,size:[1280,800],rect:[.30,.17,.59,.61],label:'执行结果：输出质数序列'},
 {id:'calc-data',key:'v12_calc',start:771.3,end:774.2,size:[1600,898],rect:[.015,.17,.70,.72],label:'表格中的实际数据'},
 {id:'calc-tool',key:'v12_calc',start:774.25,end:778.35,size:[1600,898],rect:[.735,.05,.25,.87],label:'工具调用与执行记录'},
 {id:'oi-request',key:'v12_oi_pomodoro',start:1356.7,end:1357.8,size:[1920,1080],rect:[.15,.37,.76,.24],label:'自然语言提出工具需求'},
 {id:'oi-result',key:'v12_oi_pomodoro',start:1364.7,end:1366.3,size:[1920,1080],rect:[.34,.18,.33,.64],label:'运行结果：番茄钟页面'},
 {id:'share-clients',key:'v12_share_room',start:1691.0,end:1697.7,size:[1600,732],rect:[.025,.06,.955,.82],label:'同一共享会话，不同使用端'}
];
export function drawEvidenceCallout(ctx,n){
 const row=callouts.find(w=>n>=w.start&&n<w.end);if(!row)return null;const media=window.MediaV12.windows.find(w=>w.key===row.key);if(!media)return null;
 const [bx,by,bw,bh]=media.box,[iw,ih]=row.size,k=Math.min(bw/iw,bh/ih),ox=bx+(bw-iw*k)/2,oy=by+(bh-ih*k)/2;
 const [rx,ry,rw,rh]=row.rect,x=ox+rx*iw*k,y=oy+ry*ih*k,w=rw*iw*k,h=rh*ih*k,p=ease((n-row.start)/.32)*ease((row.end-n)/.24);
 const labelX=470,labelY=26,labelW=550,anchorX=labelX+labelW-30,anchorY=labelY+18,targetX=Math.max(x+12,Math.min(x+w-12,anchorX));
 ctx.save();ctx.globalAlpha=p;ctx.fillStyle='#030303';ctx.fillRect(labelX-12,4,labelW+24,43);ctx.fillStyle='#eee';ctx.font='28px "Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(row.label,labelX,labelY);
 // A dark under-stroke makes the white bracket legible on actual white UI.
 const bracket=()=>{for(const [px,py,dx,dy]of[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){ctx.moveTo(px+dx*22,py);ctx.lineTo(px,py);ctx.lineTo(px,py+dy*22);}};
 ctx.beginPath();bracket();ctx.strokeStyle='#111';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 ctx.beginPath();ctx.moveTo(anchorX,anchorY+18);ctx.lineTo(anchorX,Math.max(anchorY+24,y-15));ctx.lineTo(targetX,y);ctx.strokeStyle='#111';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#eee';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#eee';ctx.beginPath();ctx.arc(targetX,y,4,0,Math.PI*2);ctx.fill();ctx.restore();
 return{id:row.id,key:row.key,label:row.label,rect:[x,y,w,h],sourceRect:row.rect,sourceSize:row.size,creditPreserved:true};
}

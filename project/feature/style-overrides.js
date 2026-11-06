/* The adaptation is read once at full scale before returning to its wider ecology. */
(()=>{
 'use strict';const previous={...window.FullRevisions};
 const cl=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=cl(x);return x*x*(3-2*x)};
 window.FullRevisions.p2c1=(ctx,t,A)=>{
  const old=previous.p2c1?.(ctx,t,A)||false;
  if(t<180.582917||t>=192.082917)return old;
  const im=A.assets.community_codex_port;if(!im?.width)throw Error('Missing adaptation evidence');
  const a=ease((t-180.582917)/.65)*(1-ease((t-191.282917)/.8));
  ctx.save();ctx.globalAlpha*=a;ctx.fillStyle='#050607';ctx.fillRect(0,0,1920,952);
  const w=1540,h=im.height*w/im.width,x=(1920-w)/2,y=(952-h)/2;
  ctx.drawImage(im,x,y,w,h);ctx.strokeStyle='#596365';ctx.lineWidth=1;ctx.strokeRect(x-10,y-10,w+20,h+20);
  ctx.restore();return true;
 };
})();

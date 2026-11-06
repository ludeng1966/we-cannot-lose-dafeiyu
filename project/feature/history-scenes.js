(()=>{
 'use strict';const cl=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
 function E(t,a,b){const x=cl((t-a)/(b-a));return x*x*(3-2*x)}
 function label(c,s,x,y){c.font='32px "Microsoft YaHei",sans-serif';c.fillStyle='#dededb';c.textBaseline='middle';c.textAlign='left';c.fillText(s,x,Math.min(y,932))}
 function movie(c,A,key,t,{x=0,y=0,w=1920,h=952,zoom=1,alpha=1,frame=false}={}){c.save();c.globalAlpha*=alpha;c.beginPath();c.rect(x,y,w,h);c.clip();if(A.hasVideo(key))A.video(key,x-(zoom-1)*w/2,y-(zoom-1)*h/2,w*zoom,h*zoom,Math.max(0,t),{cover:false});c.restore();if(frame){c.strokeStyle='#778084';c.lineWidth=1.2;c.strokeRect(x,y,w,h)}}
 window.WorkerHistory={draw(c,t,A){
  if(t<174.095917||t>=239.952042)return false;
  c.save();c.fillStyle='#000';c.fillRect(0,0,1920,952);
  if(t<196.195917){const a=t-174.095917;movie(c,A,'v3_jack_ma_speech',a,{x:160,y:20,w:1600,h:884,zoom:mix(1,1.045,E(t,174.095917,192.8)),alpha:E(t,174.095917,174.65),frame:true});label(c,'马云 · 达沃斯 2018',160,932)}
  else if(t<215.9035){movie(c,A,'v3_workers_march',t-196.195917,{x:120,y:0,w:1680,h:912,alpha:E(t,196.195917,196.6)});const s=window.RevisionCredits?.v3_workers_march?.label;if(s)label(c,s,150,932)}
  else{movie(c,A,'v3_china_workers',t-215.9035,{x:100,y:0,w:1720,h:912,alpha:E(t,215.9035,216.4)});const s=window.RevisionCredits?.v3_china_workers?.label;if(s)label(c,s,150,932)}
  c.restore();return true;
 }};
})();

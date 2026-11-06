// Native preview handoff only. The existing feature's source clocks stay intact.
let record=null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitUntil=async(test,timeout=90000)=>{const started=performance.now();while(performance.now()-started<timeout){const result=test();if(result)return result;await delay(80);}throw Error('正片载入超时，请确认原生正片服务仍在运行。');};
function notify(error,onError){if(onError)onError(error);else console.warn(error);}
function fit(frame,host){const width=host.getBoundingClientRect().width||document.documentElement.clientWidth;frame.style.height=Math.ceil(width*9/16+84)+'px';}
export function prepareFeature({container,onReady,onError}={}){
 if(record)return record.ready;
 const host=container||document.querySelector('#feature-host');if(!host)return Promise.reject(Error('缺少正片容器。'));
 const frame=document.createElement('iframe');frame.title='我们不能失去大肥鱼 · 正片原生预览';frame.src='/feature-index-v4.html?t=0&rev=14';frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;frame.loading='eager';
 frame.style.cssText='display:block;width:100%;border:0;background:#000;visibility:hidden;pointer-events:none;';fit(frame,host);host.append(frame);
 const r=record={host,frame,started:false,ready:null,button:null,api:null};
 r.ready=(async()=>{
  await new Promise((resolve,reject)=>{frame.addEventListener('load',resolve,{once:true});frame.addEventListener('error',()=>reject(Error('正片页面读取失败。')),{once:true});});
  const api=await waitUntil(()=>frame.contentWindow?.NarrationPreview);
  await api.ready;
  await api.pause();await api.seek(0);r.api=api;
  if(!api.state.paused)throw Error('正片预载必须保持暂停。');
  frame.dataset.ready='true';frame.dataset.source='existing-native-feature';onReady?.(r);return r;
 })().catch(error=>{frame.dataset.error=error.message;notify(error,onError);throw error;});
 // Readiness failure is reported to the eventual start call; preload alone
 // must not create an unhandled rejection or begin audio early.
 r.ready.catch(()=>{});window.addEventListener('resize',()=>fit(frame,host));
 return r.ready;
}
async function attemptPlay(r){
 const play=r.api.play();
 // An AudioContext resume can wait for a user gesture. Show a clear control
 // promptly while preserving that pending native operation.
 const result=await Promise.race([Promise.resolve(play).then(()=>true),delay(1000).then(()=>false)]);
 if(!result)return false;
 await delay(120);return r.api.state.paused===false;
}
function continueButton(r,onError){
 if(r.button)return;
 const button=document.createElement('button');button.type='button';button.textContent='继续播放正片';button.style.cssText='display:block;margin:12px auto;padding:12px 24px;border:1px solid #8398b7;color:#fff;background:#23344d;cursor:pointer;font-size:15px;';
 r.host.prepend(button);r.button=button;
 button.onclick=async()=>{button.disabled=true;button.textContent='正在开始正片…';try{await r.api.play();if(r.api.state.paused)throw Error(r.api.state.error||'浏览器尚未允许播放，请点击正片下方播放。');button.remove();r.button=null;r.frame.dataset.playing='true';}catch(error){button.disabled=false;button.textContent='继续播放正片';notify(error,onError);}};
}
export async function startFeature({container,onReady,onError}={}){
 let r,loading;
 try{
  const host=container||record?.host||document.querySelector('#feature-host');
  if(host){host.hidden=false;loading=document.createElement('p');loading.textContent='正在准备正片…';loading.style.cssText='color:#dce5f1;padding:18px;background:#101318';host.prepend(loading);}
  r=await prepareFeature({container,onError});loading?.remove();r.host.hidden=false;r.frame.style.visibility='visible';r.frame.style.pointerEvents='auto';fit(r.frame,r.host);
  r.started=true;await r.api.seek(0);
  const playing=await attemptPlay(r);r.frame.dataset.playing=String(playing);if(!playing)continueButton(r,onError);onReady?.(r);return r;
 }catch(error){
  loading?.remove();
  const host=container||record?.host;if(host){host.hidden=false;const message=document.createElement('p');message.textContent='正片暂未能开始：'+error.message;message.style.cssText='color:#dce5f1;padding:18px;background:#101318';host.prepend(message);}
  notify(error,onError);throw error;
 }
}
export function pauseFeature(){const api=record?.api;if(api)return api.pause();}
export function featureState(){return record?{ready:!!record.api,started:record.started,playing:record.api?!record.api.state.paused:false,nativeState:record.api?.state||null}:null;}

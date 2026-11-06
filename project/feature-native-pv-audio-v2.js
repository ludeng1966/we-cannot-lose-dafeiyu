// Derived by scripts/build_native_pv_audio.py; source stays unchanged.
/* V24: an in-memory editorial timeline and one non-looping arranged music bed.
 * Original narration files, caption rows, anchors and their local clocks stay intact.
 * This module plays source buffers only; it does not encode or assemble audio/video.
 */
export const PV_TIME = Object.freeze({
  version:'V24', insertAt:342.32, insertDuration:92.94, insertEnd:435.26,
  musicStart:314.57, climaxSource:27.75, musicFadeOut:434.26,
  musicUrl:'/assets/pv-opening/music-extended-v24.wav', silenceUrl:'/assets/pv-opening/silence-92.94s.wav'
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const isPVTime=t=>t>=PV_TIME.insertAt&&t<PV_TIME.insertEnd;
export const toLegacyTime=t=>t<PV_TIME.insertAt?t:t<PV_TIME.insertEnd?PV_TIME.insertAt:t-PV_TIME.insertDuration;
export const toDisplayTime=t=>t<PV_TIME.insertAt?t:t+PV_TIME.insertDuration;

export function buildPVAudioManifest(original){
  if(!original||!Array.isArray(original.groups)||!Number.isFinite(original.duration))throw Error('V19 narration manifest is unavailable');
  const groups=original.groups.map(g=>{
    if(g.start<PV_TIME.insertAt&&g.end>PV_TIME.insertAt+1e-6)throw Error('V19 insertion crosses an original narration group: '+g.id);
    const shift=g.start>=PV_TIME.insertAt?PV_TIME.insertDuration:0;
    return {...g,start:g.start+shift,end:g.end+shift};
  });
  groups.push({id:'pv-opening-silence-v24',start:PV_TIME.insertAt,end:PV_TIME.insertEnd,
    sourceUrl:PV_TIME.silenceUrl,sourceOffset:0,title:'PV opening / source silence'});
  groups.sort((a,b)=>a.start-b.start);
  for(let i=1;i<groups.length;i++)if(groups[i].start<groups[i-1].end-1e-6)throw Error('V19 audio windows overlap');
  return {duration:original.duration+PV_TIME.insertDuration,groups};
}

function pvMusicGainBase(displayTime){
  const t=displayTime;
  if(t<PV_TIME.musicStart||t>=PV_TIME.insertEnd)return 0;
  if(t<PV_TIME.musicStart+1)return .15*(t-PV_TIME.musicStart)/1;
  if(t<PV_TIME.insertAt-.30)return .15;
  if(t<PV_TIME.insertAt)return .15+.55*(t-(PV_TIME.insertAt-.30))/.30;
  if(t<PV_TIME.musicFadeOut)return .70;
  return .70*(PV_TIME.insertEnd-t)/(PV_TIME.insertEnd-PV_TIME.musicFadeOut);
}

export const PV_MUSIC_BOOST_DB=2;
const PV_MUSIC_BOOST=Math.pow(10,PV_MUSIC_BOOST_DB/20);
export function pvMusicGain(displayTime){return PV_MUSIC_BOOST*pvMusicGainBase(displayTime);}

class PVBed {
  constructor(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw Error('Web Audio is unavailable for the PV music bed');
    this.ctx=new AudioContext();this.gain=this.ctx.createGain();this.gain.gain.value=0;
    this.gain.connect(this.ctx.destination);this.buffer=null;this.record=null;this.destroyed=false;
    this.controller=new AbortController();
  }
  async prepare(){
    const response=await fetch(PV_TIME.musicUrl,{signal:this.controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('PV music source unavailable: HTTP '+response.status);
    const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());
    if(this.destroyed)return;
    if(buffer.duration+0.03<PV_TIME.insertEnd-PV_TIME.musicStart)throw Error('PV music source is shorter than the declared bed');
    this.buffer=buffer;
  }
  async unlock(){if(!this.destroyed&&this.ctx.state!=='running')await this.ctx.resume();}
  stop(){
    const r=this.record;this.record=null;
    if(r){r.source.onended=null;try{r.source.stop();}catch(_){}try{r.source.disconnect();}catch(_){}}
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime);this.gain.gain.value=0;
  }
  automation(displayTime){
    const now=this.ctx.currentTime,parameter=this.gain.gain;
    parameter.cancelScheduledValues(now);parameter.setValueAtTime(pvMusicGain(displayTime),now);
    const points=[[PV_TIME.musicStart,0],[PV_TIME.musicStart+1,.15],
      [PV_TIME.insertAt-.30,.15],[PV_TIME.insertAt,.70],
      [PV_TIME.musicFadeOut,.70],[PV_TIME.insertEnd,0]];
    for(const [time,gain] of points)if(time>displayTime+1e-6)parameter.linearRampToValueAtTime(gain*PV_MUSIC_BOOST,now+time-displayTime);
  }
  sync(displayTime,playing,buffering=false){
    if(this.destroyed)return;
    const eligible=playing&&!buffering&&this.ctx.state==='running'&&this.buffer&&
      displayTime>=PV_TIME.musicStart-.12&&displayTime<PV_TIME.insertEnd;
    if(!eligible){if(this.record)this.stop();return;}
    const now=this.ctx.currentTime;
    if(this.record){
      const projected=this.record.displayStart+now-this.record.contextStart;
      if(now>=this.record.contextStart&&Math.abs(projected-displayTime)>.065)this.stop();
      else return;
    }
    const displayStart=Math.max(PV_TIME.musicStart,displayTime),when=now+Math.max(0,displayStart-displayTime);
    const offset=displayStart-PV_TIME.musicStart,length=PV_TIME.insertEnd-displayStart;
    if(length<=0)return;
    const source=this.ctx.createBufferSource();source.buffer=this.buffer;source.loop=false;
    source.connect(this.gain);const record={source,contextStart:when,displayStart};this.record=record;
    source.onended=()=>{try{source.disconnect();}catch(_){}if(this.record===record)this.record=null;};
    this.automation(displayTime);source.start(when,offset,length);
  }
  get audit(){const r=this.record;return {active:!!r,contextState:this.ctx.state,
    sourceTime:r?Math.max(0,r.displayStart+this.ctx.currentTime-r.contextStart-PV_TIME.musicStart):null,
    loop:false,sourceUrl:PV_TIME.musicUrl};}
  async destroy(){if(this.destroyed)return;this.stop();this.destroyed=true;this.controller.abort();
    try{this.gain.disconnect();}catch(_){}if(this.ctx.state!=='closed')await this.ctx.close().catch(()=>{});}
}

export async function createPVAudio(original,{onState,onError,createTimeline=(m,o)=>new window.NarrationAudioTimeline(m,o)}={}){
  const manifest=buildPVAudioManifest(original),bed=new PVBed();
  try{await bed.prepare();}catch(error){await bed.destroy();throw error;}
  let buffering=false,destroyed=false,operation=0,transport;
  const timeline=createTimeline(manifest,{
    onState(snapshot){
      buffering=!!snapshot.buffering||['seeking','loading','suspended'].includes(snapshot.state);
      bed.sync(snapshot.currentTime,!snapshot.paused,buffering);
      onState?.({...snapshot,buffering,legacyTime:toLegacyTime(snapshot.currentTime),pv:isPVTime(snapshot.currentTime)});
    },onError(error,snapshot){bed.stop();onError?.(error,snapshot);}
  });
  const sync=()=>{if(!destroyed)bed.sync(timeline.currentTime,!timeline.paused,buffering);};
  const timer=setInterval(sync,25);
  transport={
    duration:manifest.duration,manifest,
    get paused(){return timeline.paused;},get currentTime(){return timeline.currentTime;},
    get legacyTime(){return toLegacyTime(timeline.currentTime);},get energy(){return timeline.energy;},
    get audit(){const t=timeline.currentTime,music=bed.audit,group=manifest.groups.find(g=>t>=g.start&&t<g.end);return {version:PV_TIME.version,displayTime:t,legacyTime:toLegacyTime(t),groupId:group?.id||null,
      pv:isPVTime(t),musicSourceTime:clamp(t-PV_TIME.musicStart,0,PV_TIME.insertEnd-PV_TIME.musicStart),
      musicGain:pvMusicGain(t),buffering,music,musicClockError:music.active?music.sourceTime-clamp(t-PV_TIME.musicStart,0,PV_TIME.insertEnd-PV_TIME.musicStart):null};},
    async unlock(){await Promise.all([timeline.unlock(),bed.unlock()]);},
    async play(){const token=++operation;await transport.unlock();if(token!==operation||destroyed)return;
      await timeline.play();if(token===operation&&!destroyed)sync();},
    pause(){++operation;timeline.pause();bed.stop();},
    async seek(t){const token=++operation;bed.stop();await timeline.seek(clamp(Number(t),0,manifest.duration));
      if(token===operation&&!destroyed)sync();},
    async destroy(){if(destroyed)return;destroyed=true;++operation;clearInterval(timer);
      await Promise.all([timeline.destroy(),bed.destroy()]);}
  };
  return transport;
}

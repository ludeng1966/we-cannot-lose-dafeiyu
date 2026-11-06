// The native film stays read-only; this uses the checked preview-local PV derivative.
export * from '/feature-native-pv-audio-v2.js';
import {insertQuestionPause,shiftQuestionMusic} from '/feature-question-pause.js?v=2';
import {createPVAudio as createNativePVAudio,PV_TIME} from '/feature-native-pv-audio-v2.js';
import {createFeatureMusic,loadFeatureMusicConfig} from '/feature-music.js?v=9';
import {createPreviewNarrationTimeline,NARRATION_GAIN_DB} from '/feature-narration-gain.js';

export async function createPVAudio(original,options={}){
  original=insertQuestionPause(original);
  const bodyEnd=original.duration+PV_TIME.insertDuration;
  const configPromise=loadFeatureMusicConfig().then(shiftQuestionMusic);
  const endingCredits=await configPromise.then(config=>{
    const ending=config.endingCredits;
    const cue=ending&&config.cues?.find(row=>row.id===ending.cueId);
    if(!cue||cue.start!==ending.start||cue.end!==ending.end||!Number.isFinite(ending.end)||
       !(ending.start>=0&&ending.start<bodyEnd&&ending.end>bodyEnd))return null;
    return Object.freeze({...ending,bodyEnd});
  },()=>null);
  const clockManifest=endingCredits?{...original,duration:endingCredits.end-PV_TIME.insertDuration}:original;
  let base,music,initialized=false,wantPlaying=false,holding=false,destroyed=false,operation=0,waitController=null;
  const forwardState=snapshot=>{
    if(snapshot.state==='ended'||snapshot.state==='error'||snapshot.state==='destroyed')wantPlaying=false;
    const next={...snapshot,paused:initialized?!wantPlaying:snapshot.paused,
      buffering:!!snapshot.buffering||holding,featureMusicHolding:holding};
    options.onState?.(next);
  };
  base=await createNativePVAudio(clockManifest,{...options,createTimeline:createPreviewNarrationTimeline,onState:forwardState,onError:(error,snapshot)=>{
    wantPlaying=false;music?.stop();options.onError?.(error,snapshot);
  }});
  const native={unlock:base.unlock.bind(base),play:base.play.bind(base),pause:base.pause.bind(base),
    seek:base.seek.bind(base),destroy:base.destroy.bind(base),
    paused:Object.getOwnPropertyDescriptor(base,'paused').get.bind(base),
    audit:Object.getOwnPropertyDescriptor(base,'audit').get.bind(base)};
  music=await createFeatureMusic(base,{configPromise,reserved:{start:PV_TIME.musicStart,end:PV_TIME.insertEnd}});
  base.endingCredits=endingCredits;
  const state=()=>{
    const audit=native.audit();return {time:base.currentTime,paused:native.paused(),buffering:!!audit.buffering};
  };
  const notify=reason=>{
    const current=state();
    forwardState({state:holding?'loading':current.paused?'paused':'playing',currentTime:current.time,
      paused:!wantPlaying,buffering:current.buffering||holding,reason});
    music.publish(true);
  };
  const setHolding=(value,reason)=>{holding=value;music.setHolding(value,reason);};
  const nextOperation=()=>{
    ++operation;waitController?.abort();waitController=new AbortController();
    return {token:operation,signal:waitController.signal};
  };
  const valid=token=>!destroyed&&token===operation;
  const sync=()=>{
    if(destroyed)return;
    const current=state();
    music.sync(current.time,wantPlaying&&!holding&&!current.paused,current.buffering||holding,
      wantPlaying&&!holding?base.energy:0);
    // Stop just before an unready cue. Normal prefetch normally avoids this hold.
    if(wantPlaying&&!holding&&!current.paused&&!current.buffering&&music.shouldHold(current.time))
      void holdAndResume('next-cue').catch(error=>{if(!destroyed)options.onError?.(error);});
  };
  const unlock=async()=>{await Promise.all([native.unlock(),music.unlock()]);};
  async function finishPlayback(token,signal,reason){
    // Both resumes begin immediately in the play gesture; only active/nearby music is awaited.
    const resumes=unlock();
    await Promise.all([resumes,music.waitForAt(base.currentTime,{signal})]);
    if(!valid(token)||!wantPlaying)return;
    setHolding(false,null);await native.play();
    if(!valid(token)||!wantPlaying)return;
    sync();notify(reason);
  }
  async function holdAndResume(reason){
    const {token,signal}=nextOperation();setHolding(true,reason);native.pause();music.stop();notify(reason);
    try{await finishPlayback(token,signal,reason);}
    catch(error){if(valid(token)){wantPlaying=false;setHolding(false,null);native.pause();music.stop();throw error;}}
  }
  Object.defineProperties(base,{
    paused:{configurable:true,enumerable:true,get:()=>!wantPlaying},
    audit:{configurable:true,enumerable:true,get:()=>({...native.audit(),buffering:native.audit().buffering||holding,
      narrationGainDb:NARRATION_GAIN_DB,featureMusic:music.audit,endingCredits})}
  });
  base.unlock=unlock;
  base.play=async()=>{
    if(destroyed)return;
    if(wantPlaying&&!holding&&!native.paused()){sync();return;}
    wantPlaying=true;await holdAndResume('play');
  };
  base.pause=()=>{
    if(destroyed)return;
    nextOperation();wantPlaying=false;setHolding(false,null);music.stop();native.pause();notify('pause');
  };
  base.seek=async time=>{
    if(destroyed)return;
    const resume=wantPlaying,{token,signal}=nextOperation();
    setHolding(resume,'seek');music.stop();native.pause();
    try{
      await native.seek(time);if(!valid(token))return;
      music.prefetchAt(base.currentTime,true);
      if(resume&&wantPlaying)await finishPlayback(token,signal,'seek');
      else{setHolding(false,null);sync();notify('seek');}
    }catch(error){
      if(valid(token)){wantPlaying=false;setHolding(false,null);music.stop();native.pause();throw error;}
    }
  };
  base.setMusicVolume=value=>music.setVolume(value);
  const timer=setInterval(sync,25);
  base.destroy=async()=>{
    if(destroyed)return;destroyed=true;++operation;waitController?.abort();clearInterval(timer);wantPlaying=false;
    await Promise.all([native.destroy(),music.destroy()]);
  };
  initialized=true;sync();
  return base;
}

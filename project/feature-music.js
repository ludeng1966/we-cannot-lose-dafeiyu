// Preview-only music beds. This module never encodes or changes narration media.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const EPS=1e-5;
const OVERLAP_EPS=1e-4;
const CACHE_LIMIT=3;
const SCHEDULE_LEAD=.15;
const MAX_WAIT_MS=12000;

const FEATURE_MUSIC_CONFIG='/feature-music-cues.json';

export async function loadFeatureMusicConfig(url=FEATURE_MUSIC_CONFIG,signal){
  const response=await fetch(url,{cache:'no-store',signal});
  if(!response.ok)throw new Error('配乐清单 HTTP '+response.status);
  return response.json();
}

export function normalizeFeatureCues(config={}){
  if(!Array.isArray(config.cues))throw new Error('配乐清单缺少 cues 数组');
  const ids=new Set();
  const cues=config.cues.map((row,index)=>{
    const cue={...row,id:String(row.id||`music-${index+1}`),title:String(row.title||''),artist:String(row.artist||''),
      start:Number(row.start),end:Number(row.end),url:String(row.url||''),
      sourceOffset:Number(row.sourceOffset??0),trackGain:Number(row.trackGain??1),
      fadeIn:Number(row.fadeIn??config.fadeIn??1),fadeOut:Number(row.fadeOut??config.fadeOut??1)};
    if(ids.has(cue.id)||!cue.url||![cue.start,cue.end,cue.sourceOffset,cue.trackGain,cue.fadeIn,cue.fadeOut].every(Number.isFinite)||
       cue.start<0||cue.end<=cue.start||cue.sourceOffset<0||cue.trackGain<0||cue.fadeIn<0||cue.fadeOut<0)
      throw new Error('无效配乐段落：'+cue.id);
    ids.add(cue.id);return Object.freeze(cue);
  }).sort((a,b)=>a.start-b.start);
  for(let i=1;i<cues.length;i++){
    const overlapping=cues.slice(0,i).filter(cue=>cue.end>cues[i].start+OVERLAP_EPS);
    if(overlapping.length>1)throw new Error('同一时刻最多两首配乐：'+cues[i].id);
    for(const earlier of overlapping) {
      const limit=earlier.extendedOverlapWith===cues[i].id?earlier.overlapWithNext:1;
      if(Math.min(earlier.end,cues[i].end)-cues[i].start>limit+OVERLAP_EPS)
        throw new Error('配乐叠播超过设定时长：'+earlier.id+' / '+cues[i].id);
    }
  }
  return cues;
}

export function featureFadeFactor(cue,time,effectiveEnd=cue.end){
  if(time<cue.start||time>=effectiveEnd)return 0;
  const fadeIn=cue.fadeIn>0?(time-cue.start)/cue.fadeIn:1;
  const fadeOut=cue.fadeOut>0?(effectiveEnd-time)/cue.fadeOut:1;
  return clamp(Math.min(fadeIn,fadeOut),0,1);
}

export function featureCuesAt(cues,time){
  return cues.filter(cue=>time>=cue.start&&time<cue.end);
}

export function featureCueAt(cues,time){
  // The incoming cue is primary while both cues are audible.
  return featureCuesAt(cues,time).at(-1)||null;
}

class FeatureMusic {
  constructor(transport,{configUrl=FEATURE_MUSIC_CONFIG,reserved=null}={}){
    this.transport=transport;this.configUrl=configUrl;this.reserved=reserved;
    this.cues=[];this.version=null;this.duration=0;this.configError=null;this.destroyed=false;
    this.cache=new Map();this.pending=new Map();this.failures=new Map();this.waitTimeouts=new Set();
    this.records=new Map();this.allowed=new Set();this.clock=0;this.playing=false;this.buffering=false;
    this.holding=false;this.holdReason=null;this.masterVolume=1;this.manualVolume=null;
    this.duckGain=1;this.lastDuckTime=0;this.lastPublish=0;this.latestEnergy=0;
    this.configController=new AbortController();
    const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(AudioContext){
      this.ctx=new AudioContext();this.duck=this.ctx.createGain();this.master=this.ctx.createGain();
      this.duck.gain.value=1;this.master.gain.value=1;
      this.duck.connect(this.master);this.master.connect(this.ctx.destination);
    }else{this.ctx=null;this.configError='浏览器不支持 Web Audio 配乐';}
  }
  async configure(configPromise){
    try{
      const config=await (configPromise??loadFeatureMusicConfig(this.configUrl,this.configController.signal));
      if(this.destroyed)return;
      this.cues=normalizeFeatureCues(config);this.version=config.version||'feature-music-1';
      this.duration=Number(config.duration)||this.transport.duration||0;
      this.crossfadeSeconds=Number(config.crossfadeSeconds)||0;
      this.unavailable=Array.isArray(config.missing)?config.missing:[];
      this.createReviewControls(config);
      this.prefetchAt(this.transport.currentTime||0,true);
    }catch(error){
      if(error.name!=='AbortError')this.configError=error.message;
    }
    this.publish(true);return this;
  }
  createReviewControls(config){
    const host=globalThis.document?.querySelector('.controls');if(!host)return;
    const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;font-size:12px;color:#aaa';
    const select=document.createElement('select');select.id='feature-music-jump';select.setAttribute('aria-label','配乐跳转');
    select.style.cssText='max-width:380px;padding:6px;background:#191919;color:#ddd;border:1px solid #555';
    select.append(new Option('配乐跳转…',''));
    const choices=[...this.cues,...(config.missing||[]),{id:'native-pv',title:'坠入星河的帷幕',start:this.reserved?.start??314.57}].sort((a,b)=>a.start-b.start);
    for(const cue of choices){
      const time=`${Math.floor(cue.start/60).toString().padStart(2,'0')}:${Math.floor(cue.start%60).toString().padStart(2,'0')}`;
      select.append(new Option(`${time} · ${cue.title}${cue.url||cue.id==='native-pv'?'':'（待完整版）'}`,String(cue.start)));
    }
    select.addEventListener('change',()=>{
      if(select.value==='')return;
      void this.transport.seek(Number(select.value)).catch(error=>{this.configError=error.message;this.publish(true);});
    });
    const label=document.createElement('label');label.textContent='配乐音量 ';
    const volume=document.createElement('input');volume.id='feature-music-volume';volume.type='range';
    volume.min='0';volume.max='1';volume.step='.01';volume.setAttribute('aria-label','正片配乐音量');
    let initial=Number(config.defaultMusicVolume??.65);
    try{const inherited=globalThis.parent!==globalThis?parent.document.querySelector('#volume'):null;if(inherited)initial=Number(inherited.value);}catch(_){}
    volume.value=String(initial);volume.addEventListener('input',()=>this.setVolume(volume.value));label.append(volume);
    this.reviewStatus=document.createElement('span');this.reviewStatus.setAttribute('role','status');
    this.missingCount=(config.missing||[]).length;
    row.append(select,label,this.reviewStatus);host.append(row);this.reviewControls=row;
  }
  cuesAt(time){return featureCuesAt(this.cues,time);}
  cueAt(time){return featureCueAt(this.cues,time);}
  nextCue(time){return this.cues.find(cue=>cue.start>time+EPS)||null;}
  candidates(time,lookahead=SCHEDULE_LEAD){
    return this.cues.filter(cue=>(time>=cue.start&&time<cue.end)||
      (cue.start>time&&cue.start-time<=lookahead));
  }
  effectiveEnd(cue,buffer){return Math.min(cue.end,cue.start+Math.max(0,buffer.duration-cue.sourceOffset));}
  touch(url){const entry=this.cache.get(url);if(entry)entry.used=performance.now();return entry?.buffer||null;}
  trimCache(){
    const protectedUrls=new Set([...this.allowed,...[...this.records.values()].map(record=>record.cue.url)]);
    for(const [url] of [...this.cache.entries()].sort((a,b)=>a[1].used-b[1].used)){
      if(this.cache.size<=CACHE_LIMIT)break;
      if(!protectedUrls.has(url))this.cache.delete(url);
    }
    // Two crossfading cues plus the next cue fit the three-buffer cache.
  }
  load(cue){
    if(this.destroyed||!this.ctx)return Promise.resolve(null);
    const cached=this.touch(cue.url);if(cached)return Promise.resolve(cached);
    if(this.pending.has(cue.url))return this.pending.get(cue.url).promise;
    if(this.failures.has(cue.url))return Promise.resolve(null);
    const controller=new AbortController(),entry={controller,promise:null};
    entry.promise=(async()=>{
      try{
        const response=await fetch(cue.url,{signal:controller.signal,cache:'force-cache'});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const bytes=await response.arrayBuffer();
        if(controller.signal.aborted||this.destroyed)return null;
        const buffer=await this.ctx.decodeAudioData(bytes);
        if(controller.signal.aborted||this.destroyed)return null;
        if(!Number.isFinite(buffer.duration)||buffer.duration<=cue.sourceOffset)
          throw new Error('音源时长不足');
        this.cache.set(cue.url,{buffer,used:performance.now()});this.failures.delete(cue.url);
        this.trimCache();return buffer;
      }catch(error){
        if(error.name!=='AbortError'&&!controller.signal.aborted&&!this.destroyed)
          this.failures.set(cue.url,{url:cue.url,title:cue.title,error:error.message});
        return null;
      }finally{
        if(this.pending.get(cue.url)===entry)this.pending.delete(cue.url);
        this.publish(true);
      }
    })();
    this.pending.set(cue.url,entry);return entry.promise;
  }
  prefetchAt(time,cancelObsolete=false){
    if(this.destroyed)return;
    const next=this.nextCue(time),needed=[...this.cuesAt(time),...(next?[next]:[])];
    this.allowed=new Set(needed.map(cue=>cue.url));
    for(const record of this.records.values())this.allowed.add(record.cue.url);
    if(cancelObsolete)for(const [url,entry] of this.pending)if(!this.allowed.has(url)){
      entry.controller.abort();this.pending.delete(url);
    }
    for(const cue of needed)void this.load(cue);
    this.trimCache();
  }
  cuesNeedingBuffer(time,lookahead=SCHEDULE_LEAD){
    return this.candidates(time,lookahead).filter(cue=>!this.cache.has(cue.url)&&
      !this.failures.has(cue.url)&&!this.waitTimeouts.has(cue.id));
  }
  cueNeedingBuffer(time,lookahead=SCHEDULE_LEAD){return this.cuesNeedingBuffer(time,lookahead).at(-1)||null;}
  shouldHold(time){return !!this.ctx&&!!this.cueNeedingBuffer(time);}
  async waitForAt(time,{signal,timeout=MAX_WAIT_MS}={}){
    this.prefetchAt(time,true);
    const cues=this.cuesNeedingBuffer(time),ids=cues.map(cue=>cue.id),primary=ids.at(-1)||null;
    if(!cues.length||!this.ctx)return {ready:!cues.length,cue:primary,cues:ids};
    if(signal?.aborted)return {ready:false,cancelled:true,cue:primary,cues:ids};
    let timeoutId,abortListener;
    const cancelled=new Promise(resolve=>{
      abortListener=()=>resolve({kind:'cancelled'});
      signal?.addEventListener('abort',abortListener,{once:true});
      timeoutId=setTimeout(()=>resolve({kind:'timeout'}),timeout);
    });
    // A seek into a crossfade must wait for both sources, not only the incoming one.
    const result=await Promise.race([Promise.all(cues.map(cue=>this.load(cue))).then(buffers=>({kind:'loaded',buffers})),cancelled]);
    clearTimeout(timeoutId);signal?.removeEventListener('abort',abortListener);
    if(result.kind==='timeout')for(const cue of cues)if(!this.cache.has(cue.url)&&!this.failures.has(cue.url))
      this.waitTimeouts.add(cue.id);
    this.publish(true);
    return {ready:!!result.buffers?.every(Boolean),cancelled:result.kind==='cancelled',
      timedOut:result.kind==='timeout',cue:primary,cues:ids};
  }
  async unlock(){
    if(!this.ctx||this.destroyed)return;
    try{if(this.ctx.state!=='running')await this.ctx.resume();}
    catch(error){this.configError='配乐音频无法唤醒：'+error.message;}
  }
  setHolding(holding,reason=null){this.holding=holding;this.holdReason=holding?reason:null;this.publish(true);}
  setVolume(value){this.manualVolume=clamp(Number(value)||0,0,1);this.updateMaster();this.publish(true);}
  updateMaster(){
    let value=this.manualVolume;
    if(value===null){
      try{
        // The existing opener's slider is a music-level control, not a narration master.
        const local=globalThis.document?.querySelector('#feature-music-volume,#volume,#volume-main');
        const parent=globalThis.parent!==globalThis?globalThis.parent.document?.querySelector('#volume,#volume-main'):null;
        const slider=local||parent;value=slider?Number(slider.value):1;
      }catch(_){value=1;}
    }
    this.masterVolume=clamp(Number.isFinite(value)?value:1,0,1);
    if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.masterVolume,this.ctx.currentTime,.015);
  }
  updateDuck(energy){
    if(!this.ctx)return;
    const now=this.ctx.currentTime,dt=Math.max(0,now-this.lastDuckTime);this.lastDuckTime=now;
    this.latestEnergy=clamp(Number(energy)||0,0,1);
    const maxReduction=1-Math.pow(10,-3/20);
    const target=1-maxReduction*clamp(this.latestEnergy/.32,0,1);
    const tau=target<this.duckGain?.08:.5;
    this.duckGain+=(target-this.duckGain)*(1-Math.exp(-dt/tau));
    this.duck.gain.setTargetAtTime(target,now,tau);
  }
  automate(record,time){
    const {cue,effectiveEnd,gain}=record,now=this.ctx.currentTime;
    const points=[cue.start,cue.start+cue.fadeIn,effectiveEnd-cue.fadeOut,effectiveEnd];
    if(cue.fadeIn>0&&cue.fadeOut>0)
      points.push((cue.start*cue.fadeOut+effectiveEnd*cue.fadeIn)/(cue.fadeIn+cue.fadeOut));
    gain.gain.setValueAtTime(featureFadeFactor(cue,time,effectiveEnd)*cue.trackGain,now);
    for(const point of [...new Set(points)].sort((a,b)=>a-b))
      if(point>time+EPS&&point>=cue.start&&point<=effectiveEnd)
        gain.gain.linearRampToValueAtTime(featureFadeFactor(cue,point,effectiveEnd)*cue.trackGain,now+point-time);
  }
  stopRecord(id){
    const record=this.records.get(id);if(!record)return;
    this.records.delete(id);record.source.onended=null;
    try{record.source.stop();}catch(_){}
    try{record.source.disconnect();record.gain.disconnect();}catch(_){}
  }
  stop(){for(const id of [...this.records.keys()])this.stopRecord(id);this.playing=false;this.publish(true);}
  sync(time,playing,buffering=false,energy=0){
    if(this.destroyed)return;
    this.clock=time;this.playing=!!playing;this.buffering=!!buffering;
    this.updateMaster();this.updateDuck(energy);this.prefetchAt(time);
    if(!playing||buffering||this.holding||!this.ctx||this.ctx.state!=='running'){
      if(this.records.size)this.stop();this.publish();return;
    }
    const desired=this.candidates(time),desiredIds=new Set(desired.map(cue=>cue.id)),now=this.ctx.currentTime;
    for(const [id,record] of this.records){
      const projected=record.displayStart+now-record.contextStart;
      if(!desiredIds.has(id)||time>=record.effectiveEnd-EPS||Math.abs(projected-time)>.065)this.stopRecord(id);
    }
    for(const cue of desired){
      if(this.records.has(cue.id))continue;
      const buffer=this.touch(cue.url);if(!buffer)continue;
      const effectiveEnd=this.effectiveEnd(cue,buffer),displayStart=Math.max(cue.start,time);
      if(displayStart>=effectiveEnd-EPS)continue;
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
      source.buffer=buffer;source.loop=false;source.connect(gain);gain.connect(this.duck);
      const when=now+Math.max(0,cue.start-time),offset=cue.sourceOffset+Math.max(0,time-cue.start);
      const record={cue,source,gain,effectiveEnd,displayStart,contextStart:when,offset};
      this.records.set(cue.id,record);this.automate(record,time);
      source.onended=()=>{
        try{source.disconnect();gain.disconnect();}catch(_){}
        if(this.records.get(cue.id)===record)this.records.delete(cue.id);
      };
      try{source.start(when,offset,effectiveEnd-displayStart);}
      catch(error){this.failures.set(cue.url,{url:cue.url,title:cue.title,error:error.message});this.stopRecord(cue.id);}
    }
    this.publish();
  }
  cueAudit(cue,time){
    const record=cue?this.records.get(cue.id):null,buffer=cue?this.cache.get(cue.url)?.buffer:null;
    const end=cue&&buffer?this.effectiveEnd(cue,buffer):cue?.end;
    const fadeFactor=cue?featureFadeFactor(cue,time,end):0;
    const sourceTime=record?record.offset+Math.max(0,this.ctx.currentTime-record.contextStart):null;
    const expectedOffset=cue?cue.sourceOffset+Math.max(0,time-cue.start):null;
    const loaderror=this.configError||(cue?this.failures.get(cue.url)?.error||
      (!buffer&&this.waitTimeouts.has(cue.id)?'配乐载入等待已达12秒；配音继续，音源就绪后按时间接入':null):null);
    const gain=fadeFactor*(cue?.trackGain||0)*this.duckGain*this.masterVolume;
    const active=!!record&&this.ctx.currentTime>=record.contextStart-EPS;
    return {id:cue?.id||null,cueId:cue?.id||null,title:cue?.title||null,artist:cue?.artist||null,
      start:cue?.start??null,end:end??null,sourceUrl:cue?.url||null,sourceOffset:cue?.sourceOffset??null,
      playbackOffset:record?.offset??null,sourceTime,expectedOffset,
      clockError:sourceTime===null?null:sourceTime-expectedOffset,fadeIn:cue?.fadeIn??1,fadeOut:cue?.fadeOut??1,
      fadeFactor,trackGain:cue?.trackGain??0,gain,
      actualGain:active&&this.playing&&!this.buffering&&!this.holding?gain:0,
      active,scheduled:!!record,loaded:!!buffer,loaderror};
  }
  get audit(){
    const time=this.transport.currentTime||0,cue=this.cueAt(time);
    const activeCues=this.cuesAt(time).map(row=>this.cueAudit(row,time));
    const primary=this.cueAudit(cue,time);
    const pendingSource=this.unavailable?.filter(row=>time>=row.start&&time<Number(row.intendedEnd??row.end))
      .sort((a,b)=>a.start-b.start).at(-1);
    return {version:this.version,configured:!this.configError,cueCount:this.cues.length,displayTime:time,
      pendingSource:pendingSource?{id:pendingSource.id,title:pendingSource.title}:null,
      paused:this.transport.paused,playing:this.playing,buffering:this.buffering,holding:this.holding,holdReason:this.holdReason,
      ...primary,activeCues,activeSourceCount:activeCues.filter(row=>row.active).length,
      combinedGain:activeCues.reduce((sum,row)=>sum+row.actualGain,0),
      duckGain:this.duckGain,masterVolume:this.masterVolume,
      loop:false,contextState:this.ctx?.state||'unavailable',
      reservedPV:!!(this.reserved&&time>=this.reserved.start&&time<this.reserved.end),
      scheduled:[...this.records.values()].map(row=>({id:row.cue.id,start:row.cue.start,end:row.effectiveEnd,
        sourceOffset:row.offset,startsIn:Math.max(0,row.contextStart-this.ctx.currentTime)})),
      cacheCount:this.cache.size,cacheBytes:[...this.cache.values()].reduce((sum,row)=>sum+row.buffer.length*row.buffer.numberOfChannels*4,0),
      loading:[...this.pending.keys()],failures:[...this.failures.values()]};
  }
  publish(force=false){
    const now=performance.now();if(!force&&now-this.lastPublish<100)return;this.lastPublish=now;
    if(!globalThis.document)return;
    const audit=this.audit,encoded=JSON.stringify(audit);
    if(this.reviewStatus){
      const activeTitles=audit.activeCues.map(cue=>cue.title);
      const title=audit.reservedPV?['坠入星河的帷幕',...activeTitles].join(' + '):
        activeTitles.join(' → ')||(audit.pendingSource?`${audit.pendingSource.title}（待完整版）`:'留白');
      const fades=audit.activeCues.map(({fadeIn,fadeOut})=>fadeIn===fadeOut?
        `淡入/淡出各${fadeIn}秒`:`淡入${fadeIn}秒 / 淡出${fadeOut}秒`);
      const fadeLabel=[...new Set(fades)].join(' → ');
      this.reviewStatus.textContent=`${title}${fadeLabel?` · ${fadeLabel}`:''}${this.missingCount?` · ${this.missingCount}首待完整版`:''}`;
    }
    for(const target of [document.documentElement,document.querySelector('#preview')].filter(Boolean)){
      target.dataset.featureMusic=encoded;target.dataset.featureMusicCue=audit.cueId||'';
      target.dataset.featureMusicError=audit.loaderror||'';
    }
  }
  async destroy(){
    if(this.destroyed)return;this.stop();this.destroyed=true;this.configController.abort();
    for(const entry of this.pending.values())entry.controller.abort();
    this.pending.clear();this.cache.clear();
    this.reviewControls?.remove();
    if(this.ctx){try{this.duck.disconnect();this.master.disconnect();}catch(_){}
      if(this.ctx.state!=='closed')await this.ctx.close().catch(()=>{});}
  }
}

export async function createFeatureMusic(transport,{configPromise,...options}={}){
  const music=new FeatureMusic(transport,options);
  await music.configure(configPromise); // Only the small manifest gates app readiness; track decoding is lazy.
  if(typeof window!=='undefined')window.FeatureMusicRuntime=music;
  return music;
}

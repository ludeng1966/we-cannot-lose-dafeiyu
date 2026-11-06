import {drawHarnessGrowth,growthWindow} from '/feature-harness-growth.js';
import {installPluginDanmaku} from '/feature-plugin-danmaku.js';
import {installFeatureChapterMotion} from '/feature-chapter-motion.js?v=13';
import {createFeatureCharacter} from '/feature-character-v4.js?v=6';
import {drawFeatureManifesto} from '/feature-manifesto-v5.js';
import {installFeatureCommune} from '/feature-commune-v5.js?v=7';
import {createG009Edit} from '/feature-g009.js?v=10';
import {createOpeningEvidence} from '/feature-opening-evidence-v5.js';
import {createProvidedMedia} from '/feature-provided-media.js?v=14';
import {drawCreatorTitle} from '/feature-creator-title.js?v=13';
import {drawTuiPanel} from '/feature-tui-panel.js?v=12';
import {createInformationScenes} from '/feature-information-scenes.js?v=4';
import {drawEvidenceCallout} from '/feature/evidence-callouts.js';
import {createRhythmMedia} from '/feature-rhythm-media.js';
import {createInformationFocus} from '/feature/information-focus.js';
import {drawEvidenceMotion} from '/feature/evidence-motion.js';
import {createPresenceEnhancements} from '/feature/presence-enhancements.js';
import {createPVAudio,PV_TIME,toLegacyTime as pvLegacyTime,toDisplayTime as pvDisplayTime,isPVTime} from '/feature/pv-audio.js?v=11';
import {createMaterialHolds} from '/feature/material-holds.js';
import {QUESTION_PAUSE} from '/feature-question-pause.js';
// Apply the correction when glyphs are drawn, before compositing the scene.
function brightenCanvasText(context) {
 for(const method of ['fillText','strokeText']){
  const draw=context[method];
  context[method]=function(...args){
   const previous=this.filter;
   this.filter=(previous==='none'?'':previous+' ')+'brightness(1.45)';
   try{return draw.apply(this,args);}
   finally{this.filter=previous;}
  };
 }
}
const questionEnd=QUESTION_PAUSE.start+QUESTION_PAUSE.duration;
const toDisplayTime=t=>pvDisplayTime(t)+(t>=QUESTION_PAUSE.narrationTime?QUESTION_PAUSE.duration:0);
const toLegacyTime=t=>pvLegacyTime(t>=questionEnd?t-QUESTION_PAUSE.duration:t);
import {createPVOpening} from '/feature-pv-opening.js?v=12';
import {createPVEntrance} from '/feature-pv-entrance.js?v=11';
import {createCinematicWorld} from '/feature/cinematic-world.js';
import {createCinematicCompositor} from '/feature/cinematic-compositor.js';
import {createCinematicPresence} from '/feature/cinematic-presence.js';
import {createSupplementalEvidence} from '/feature/supplemental-evidence.js';
import {createNarrationDirector,loadNarrationDirector,drawNarrationHandoff,drawNarrationSemanticCue} from '/feature/narration-director.js';
import {CHAPTER_APPROACH_SECONDS,createChapterHandoff} from '/feature/pv-chapter-handoff.js';
const drawChapterHandoff=createChapterHandoff();
const drawPVEntrance=createPVEntrance();
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d',{alpha:false}),message=$('message'),play=$('play-main'),progress=$('progress');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const pixelAuditEnabled=new URLSearchParams(location.search).has('pixel-audit');
function pixelDigest(x,y,w,h){const bytes=ctx.getImageData(x,y,w,h).data;let hash=2166136261;for(let i=0;i<bytes.length;i++)hash=Math.imul(hash^bytes[i],16777619);return(hash>>>0).toString(16).padStart(8,'0');}
export function piecewise(rows,input,output,t){if(t<=rows[0][input])return rows[0][output];if(t>=rows.at(-1)[input])return rows.at(-1)[output];let a=0,b=rows.length-1;while(b-a>1){const m=(a+b)>>1;if(rows[m][input]<=t)a=m;else b=m;}const x=rows[a],y=rows[b];return x[output]+clamp((t-x[input])/(y[input]-x[input]))*(y[output]-x[output]);}
export function inverse(rows,t){if(t<=rows[0].picture)return rows[0].new;if(t>=rows.at(-1).picture)return rows.at(-1).new;let a=0,b=rows.length-1;while(b-a>1){const m=(a+b)>>1;if(rows[m].picture<t)a=m;else b=m;}const x=rows[a],y=rows[b];if(y.picture===x.picture)return x.new;return x.new+(t-x.picture)/(y.picture-x.picture)*(y.new-x.new);}
export function validateManifest(m){if(!(m.duration>0)||!Array.isArray(m.groups)||!m.groups.length||!Array.isArray(m.anchors)||m.anchors.length<2)throw Error('配音时间轴缺少时长、分组或画面锚点');for(let i=0;i<m.anchors.length;i++){const q=m.anchors[i],p=m.anchors[i-1];if(!Number.isFinite(q.new)||!Number.isFinite(q.picture)||q.new<0||q.picture<0||(p&&(q.new<=p.new||q.picture<p.picture)))throw Error('画面锚点必须按新配音时间递增且画面时间不倒退：'+i);}if(Math.abs(m.anchors[0].new)>.001||Math.abs(m.anchors.at(-1).new-m.duration)>.05)throw Error('画面锚点未覆盖完整配音');const ids=new Set();let end=0;for(const g of m.groups){if(ids.has(g.id)||!Number.isFinite(g.start)||!Number.isFinite(g.end)||g.start<end-.002||g.end<=g.start||g.end>m.duration+.05||!g.sourceUrl?.startsWith('/narration/'))throw Error('无效配音分组：'+g.id);ids.add(g.id);end=g.end;}for(const c of m.captions||[])if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>m.duration+.05||typeof c.text!=='string')throw Error('无效字幕时间或文本');return m;}
const supplementalEnabled=new URLSearchParams(location.search).get('additions')!=='0';
let featureCharacter, featureCommune, openingEvidence, g009Edit, currentCharacterShot = null;
const CREDITS_FADE_SECONDS=1.6;
let harnessCredits,endingCredits,creditsPlate;
let supplemental,currentSupplementalDescriptor=null,director,referenceManifest,currentAudioTime=0,currentDirectorState=null,handoffAudit=null,semanticCueAudit=null;
const reviewTime=n=>toDisplayTime(director.audioAtVisual(n));
let manifest,picture,audio,provided,materialHolds,information,rhythm,focus,presence,pv,cinematic,displayDuration=0,rendering=false,pending=null,renderSerial=0,lastDraw=-1,fatal=null,chapterRows=[];const waiters=[];
function fail(error){fatal=error instanceof Error?error:Error(String(error));message.textContent=fatal.message;console.error(fatal);audio?.pause();play.textContent='播放';}
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function update(){if(!audio)return;const t=audio.currentTime;canvas.dataset.time=String(t);canvas.dataset.paused=String(audio.paused);canvas.dataset.energy=String(audio.energy);canvas.dataset.pvAudio=JSON.stringify(audio.audit);progress.value=t;$('clock').textContent=format(t)+' / '+format(displayDuration);play.textContent=audio.paused?'播放':'暂停';for(const b of $('chapters').children)b.classList.toggle('active',t>=+b.dataset.start&&t<+b.dataset.end);}
function subtitle(audioTime,n,showCaptions=true){cinematic?.foreground(ctx);handoffAudit=drawNarrationHandoff(ctx,currentDirectorState);semanticCueAudit=drawNarrationSemanticCue(ctx,currentDirectorState,director.editorial,currentSupplementalDescriptor||{});canvas.dataset.handoff=JSON.stringify(handoffAudit);canvas.dataset.semanticCue=JSON.stringify(semanticCueAudit);const addition=supplementalEnabled?supplemental?.draw(ctx,n,currentSupplementalDescriptor||{}):null;canvas.dataset.supplemental=JSON.stringify(addition||null);canvas.dataset.materialHold='null';canvas.dataset.tuiPanel=JSON.stringify(drawTuiPanel(ctx,window.FeatureTuiPlate,audioTime));canvas.dataset.creatorTitle=JSON.stringify(drawCreatorTitle(ctx,audioTime,currentSupplementalDescriptor?.chapter));canvas.dataset.g009Card=JSON.stringify(g009Edit?.drawCard(ctx,audioTime)||null);ctx.fillStyle='#000';ctx.fillRect(0,952,1920,128);if(!showCaptions||!$('captions-main').checked)return;const c=manifest.captions.find(c=>audioTime>=c.start&&audioTime<c.end&&!(audioTime>=PV_TIME.insertAt&&audioTime<PV_TIME.insertAt+.05&&c.group!==currentDirectorState.groupId));if(!c)return;let font=38,lines=[];for(;font>=18;font-=2){ctx.font=`${font}px "Microsoft YaHei",sans-serif`;lines=[];let line='';for(const ch of c.text){if(ch==='\n'){lines.push(line);line='';continue;}if(ctx.measureText(line+ch).width>1660){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);if(lines.length<=3)break;}ctx.fillStyle='#eee';ctx.textAlign='center';ctx.textBaseline='middle';const spacing=font+6;lines.forEach((line,i)=>ctx.fillText(line,960,1016+(i-(lines.length-1)/2)*spacing));}
function informationPresence(n,clip,local,kind){if(currentCharacterShot)return [];const rows=window.PresenceV12.active(clip.id,local),avatar=window.FullStudio?.avatar;if(!avatar||!rows.length)return[];const audit=[],box=kind==='bridge'?[1740,590,170]:[1690,520,220];for(const r of rows){const fade=clamp((local-r.start)/(r.fadeIn||.001))*clamp((r.end-local)/(r.fadeOut||.001));avatar.draw(n,{framing:r.framing,energy:audio?.energy||0,motionTime:window.NarrationMotionTime??n,mood:r.mood,lookX:r.lookX,lookY:r.lookY||0});ctx.save();ctx.globalAlpha=fade;ctx.beginPath();ctx.rect(0,0,1920,952);ctx.clip();ctx.drawImage(avatar.canvas,box[0],box[1],box[2],box[2]*1100/900);ctx.restore();audit.push({id:r.id,box,preserved:true});}return audit;}
async function compose(displayTime,serial){
 if(endingCredits&&displayTime>=endingCredits.bodyEnd)return composeEndingCredits(displayTime,serial);
 creditsPlate=null;
 canvas.dataset.harnessCredits='null';
 canvas.dataset.pvEntrance='null';
 if(displayTime>=QUESTION_PAUSE.start&&displayTime<questionEnd){
  await composeBody(QUESTION_PAUSE.start-.001,serial,{chapterPreroll:.001});
  if(serial!==renderSerial)return;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#0b0d10';
  ctx.fillRect(0,0,1920,1080);
  ctx.fillStyle='#f0eee8';
  ctx.font='700 82px "Noto Serif SC",SimSun,serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(QUESTION_PAUSE.title,960,492);
  ctx.restore();
  const frame={...window.NarrationPreviewFrame,newTime:displayTime,clip:'question-title',title:QUESTION_PAUSE.title};
  window.NarrationPreviewFrame=frame;
  canvas.dataset.frame=JSON.stringify(frame);
  canvas.dataset.renderedTime=displayTime.toFixed(2);
  lastDraw=displayTime;
  return;
 }
 if(!isPVTime(displayTime)){
  await composeBody(displayTime,serial);
  if(serial===renderSerial&&displayTime>=g009Edit?.entranceStart&&displayTime<PV_TIME.insertAt){
   const entrance=drawPVEntrance(ctx,pv,displayTime-PV_TIME.insertAt,PV_TIME.insertAt-g009Edit.entranceStart);
   canvas.dataset.pvEntrance=JSON.stringify(entrance);
  }
  return;
 }
 const secondsRemaining=PV_TIME.insertEnd-displayTime;
 let incomingChapter=null;
 if(secondsRemaining<CHAPTER_APPROACH_SECONDS){
  await composeBody(PV_TIME.insertEnd,serial,{chapterPreroll:secondsRemaining});
  if(serial!==renderSerial)return;
  incomingChapter=window.NarrationPreviewFrame;
 }
 cinematic?.suspend();canvas.dataset.cinematic='null';canvas.dataset.characterV4='null';
 provided.idle();rhythm.idle();window.V18SuppressLegacyPresence=true;
 currentAudioTime=PV_TIME.insertAt;currentDirectorState=director.stateAt(currentAudioTime);window.NarrationTime=currentDirectorState.visualN;window.NarrationMotionTime=currentAudioTime;window.V12PictureTime=piecewise(referenceManifest.anchors,'new','picture',currentDirectorState.visualN);
 if(serial===renderSerial){
  const local=displayTime-PV_TIME.insertAt;
  const audit=incomingChapter?drawChapterHandoff(ctx,pv,local,secondsRemaining,incomingChapter):pv.draw(ctx,local);
  window.NarrationPreviewFrame={newTime:displayTime,audioTime:PV_TIME.insertAt,legacyTime:currentDirectorState.visualN,director:currentDirectorState,pictureTime:window.V12PictureTime,nativeTime:null,clip:'pv-opening-v19',local,scene:local,quote:null,pv:audit};
  for(const key of ['presence','rhythm','focus','evidenceMotion','information','provided','supplemental','materialHold','handoff','semanticCue','manifestoV5','communeV5','openingEvidenceV5','g009Card','pvEntrance','tuiPanel','creatorTitle'])canvas.dataset[key]='null';
  canvas.dataset.pv=JSON.stringify(audit);canvas.dataset.pvAudio=JSON.stringify(audio.audit);canvas.dataset.frame=JSON.stringify(window.NarrationPreviewFrame);
  canvas.dataset.renderedTime=displayTime.toFixed(2);canvas.dataset.missing=JSON.stringify(audit?.missing||[]);lastDraw=displayTime;
 }
}
async function composeEndingCredits(displayTime,serial){
 const elapsed=displayTime-endingCredits.bodyEnd,duration=endingCredits.end-endingCredits.bodyEnd;
 if(elapsed<CREDITS_FADE_SECONDS&&!creditsPlate){
  await composeBody(endingCredits.bodyEnd,serial);
  if(serial!==renderSerial)return;
  creditsPlate=document.createElement('canvas');
  creditsPlate.width=canvas.width;
  creditsPlate.height=canvas.height;
  creditsPlate.getContext('2d',{alpha:false}).drawImage(canvas,0,0);
 }
 cinematic.suspend();
 provided.idle();
 rhythm.idle();
 featureCommune?.resetAudit();
 let audit;
 ctx.save();
 try{
  audit=harnessCredits.draw(ctx,elapsed,duration);
  if(elapsed<CREDITS_FADE_SECONDS){
   const progress=elapsed/CREDITS_FADE_SECONDS;
   ctx.setTransform(1,0,0,1,0,0);
   ctx.globalAlpha=1-progress*progress*(3-2*progress);
   ctx.globalCompositeOperation='source-over';
   ctx.filter='none';
   ctx.drawImage(creditsPlate,0,0);
  }
 }finally{
  ctx.restore();
 }
 currentAudioTime=manifest.duration;
 currentDirectorState=director.stateAt(currentAudioTime);
 window.NarrationPreviewFrame={newTime:displayTime,audioTime:currentAudioTime,legacyTime:currentDirectorState.visualN,director:currentDirectorState,pictureTime:null,nativeTime:null,clip:'harness-credits',local:elapsed,scene:elapsed,quote:null,harnessCredits:audit};
 for(const key of ['pv','cinematic','characterV4','presence','rhythm','focus','evidenceMotion','information','provided','supplemental','materialHold','handoff','semanticCue','manifestoV5','communeV5','openingEvidenceV5','g009Card','pvEntrance','tuiPanel','creatorTitle'])canvas.dataset[key]='null';
 canvas.dataset.harnessCredits=JSON.stringify(audit??null);
 canvas.dataset.frame=JSON.stringify(window.NarrationPreviewFrame);
 canvas.dataset.renderedTime=displayTime.toFixed(2);
 canvas.dataset.missing='[]';
 lastDraw=displayTime;
}
async function composeBody(displayTime,serial,{chapterPreroll=0}={}){
 featureCommune?.resetAudit();
 window.FeatureTuiPlate=null;
 currentAudioTime=toLegacyTime(displayTime);currentDirectorState=director.stateAt(currentAudioTime);
 const animationTime=currentAudioTime-chapterPreroll;
 const visualTime=currentDirectorState.visualN;
 const bridge=!chapterPreroll&&materialHolds.plan.bridges.find(row=>visualTime>=row.start&&visualTime<row.end);
 const n=bridge?.frameN??visualTime,p=piecewise(referenceManifest.anchors,'new','picture',n),ot=piecewise(picture.anchors,'new','old',p),clip=picture.timing.clips.findLast(c=>ot>=c.actualOffset)||picture.timing.clips[0],local=clamp(ot-clip.actualOffset,0,clip.actualDuration-.000001),seg=clip.segments.find(s=>local>=s.audioStart&&local<s.audioEnd)||clip.segments.at(-1),scene=seg.sceneStart+clamp((local-seg.audioStart)/(seg.audioEnd-seg.audioStart))*(seg.sceneEnd-seg.sceneStart);
 window.V12PictureTime=p;window.NarrationTime=n;window.NarrationMotionTime=animationTime;window.NarrationAudioTime=currentAudioTime;provided.configure(n);window.NarrationMediaElapsed=row=>{const edit=referenceManifest.mediaEdits?.find(edit=>edit.key===row.key&&edit.kind==='video');const start=edit?.start??inverse(referenceManifest.anchors,row.globalStart),end=edit?.end??inverse(referenceManifest.anchors,row.globalEnd);const e=director.sourceElapsed(currentAudioTime,start,end);if(!edit)return e;const elapsed=edit.skipMiddleSeconds>0&&e>=edit.leadSeconds?e+edit.skipMiddleSeconds:e;return Math.min(elapsed,edit.originalWindowSeconds-.03);};
 const frame=Math.floor(p*60+1e-7),quote=picture.cards.find(q=>frame>=Math.floor((q.start+1e-7)*60)&&frame<Math.ceil((q.end-1e-7)*60));
 let informationAudit=null,rhythmAudit=null,focusAudit=null,evidenceMotionAudit=null,presenceAudit=null;const legacyMedia=window.MediaV12?.windows?.find(w=>w.clip===clip.id&&p>=w.globalStart-1e-7&&p<w.globalEnd-1e-7),avatarWindow=presence.active(n),protectedMedia=!!legacyMedia||provided.edits.overlays.some(w=>n>=w.start&&n<w.end)||referenceManifest.mediaEdits?.some(w=>n>=w.start&&n<w.end),cut=rhythm.active(n);window.V18SuppressLegacyPresence=!!avatarWindow;if(!cut||quote)rhythm.idle();
 const supplied=provided.active(n),info=information.active(n);
 const growth=!chapterPreroll&&currentAudioTime>=growthWindow.start&&currentAudioTime<growthWindow.end;
 const candidateHold=materialHolds.active(n);
 const hold=!quote&&!supplied&&!protectedMedia&&(!candidateHold?.clip||candidateHold.clip===clip.id)?candidateHold:null;
 if(hold)rhythm.idle();
 const contentKind=growth?'infographic':quote?'quote':supplied?'footage':hold?'software':cut&&!protectedMedia?'footage':info&&!protectedMedia?'infographic':legacyMedia||protectedMedia?'software':'animation';
 const protectedRects=hold?.protectedRects?.slice()||[];const box=supplied?.box||legacyMedia?.box;if(box)protectedRects.push({x:box[0],y:box[1],width:box[2],height:box[3]});
 if(contentKind==='quote'||contentKind==='infographic')protectedRects.push({x:90,y:75,width:1740,height:825});
 if(contentKind==='footage'&&!box)protectedRects.push(cut?.kind==='portrait'?{x:880,y:45,width:960,height:850}:{x:80,y:35,width:1760,height:855});
 const characterShot = cinematic.enabled ? featureCharacter.select({
  audioTime: currentAudioTime, contentKind, protectedRects, presenceWindow: avatarWindow, rhythm: cut, supplied,
 }) : null;
 currentCharacterShot = characterShot;
 if (characterShot) window.V18SuppressLegacyPresence = true;
 const artDescriptor={characterV4:characterShot,audioTime:currentAudioTime,animationTime,contentKind,chapter:clip.id,chapterTitle:clip.title,protectedRects,presenceWindow:avatarWindow||null,hasLegacyPresence:!!window.PresenceV12?.active(clip.id,local)?.length,legacyLive:0,priority:contentKind==='quote'||contentKind==='infographic'?'reading':'visual',sceneStart:clip.actualOffset,sceneEnd:clip.actualOffset+clip.actualDuration};
 currentSupplementalDescriptor={...artDescriptor,foregroundRects:avatarWindow?.box?[{x:avatarWindow.box[0],y:avatarWindow.box[1],width:avatarWindow.box[2],height:avatarWindow.box[3]}]:[]};
 try {
 window.FeatureOpeningEvidenceOpacity = openingEvidence?.opacityAt(characterShot,currentAudioTime)||0;
 featureCharacter.applyAvatar(Boolean(characterShot));
 cinematic.begin(n,artDescriptor);
 if(growth){
  provided.idle();rhythm.idle();
  if(serial===renderSerial){drawHarnessGrowth(ctx,currentAudioTime);subtitle(currentAudioTime,n);informationAudit={id:'harness-growth'};}
 }
 else if(cut&&!quote&&!protectedMedia&&!supplied&&!hold){provided.idle();const inherited=window.PresenceV12.active(clip.id,local);rhythmAudit=await rhythm.draw(ctx,n,{energy:audio?.energy||0,suppressAvatar:!!characterShot||!!avatarWindow||!!inherited.length});if(serial===renderSerial){if(inherited.length&&!avatarWindow)rhythmAudit.inheritedPresence=informationPresence(n,clip,local,'compare');presenceAudit=characterShot?null:presence.draw(ctx,n,{window:avatarWindow,energy:audio?.energy||0});subtitle(currentAudioTime,n,!chapterPreroll);}}
 else if(quote){provided.idle();if(serial===renderSerial){RevolutionQuotes.draw(ctx,quote,quote.hold?9:p-quote.start);subtitle(currentAudioTime,n,!chapterPreroll);}}
 else if(provided.active(n)){await provided.draw(ctx,n,{energy:audio?.energy||0,suppressAvatar:!!characterShot||!!avatarWindow});if(serial===renderSerial){presenceAudit=characterShot?null:presence.draw(ctx,n,{window:avatarWindow,energy:audio?.energy||0});subtitle(currentAudioTime,n,!chapterPreroll);}}
 else if(hold&&hold.render==='image'){
  provided.idle();
  const audit=await materialHolds.draw(ctx,n);
  if(serial===renderSerial){subtitle(currentAudioTime,n,!chapterPreroll);canvas.dataset.materialHold=JSON.stringify(audit);}
 }
 else if(information.active(n)&&!protectedMedia&&!hold){provided.idle();if(serial===renderSerial){const infoScene=information.active(n),resume=rhythm.plan.cuts.findLast(w=>w.end<=n&&n<w.end+4.5&&w.end>=infoScene.start&&w.start<infoScene.end);informationAudit=information.draw(ctx,n,currentAudioTime);const focusShot=focus.active(n,infoScene,{resumeAt:resume?.end}),focusRange=focusShot&&director.rangesForVisual(focusShot.start,focusShot.end).find(r=>currentAudioTime>=r.start&&currentAudioTime<r.end);focusAudit=focusRange&&focusRange.end-focusRange.start>=3.1?focus.draw(ctx,n,infoScene,{resumeAt:resume?.end}):null;presenceAudit=characterShot?null:presence.draw(ctx,n,{window:avatarWindow,focus:focusAudit,energy:audio?.energy||0});if(!presenceAudit&&!focusAudit)informationAudit.inheritedPresence=informationPresence(n,clip,local,informationAudit.kind);subtitle(currentAudioTime,n,!chapterPreroll);}}
 else{provided.idle();await fullRender(ot,{captions:false,raw:true});if(serial===renderSerial){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';artDescriptor.legacyLive=window.PictureRenderAudit?.usage.live||0;const inheritedVideo=!!window.PictureRenderAudit?.usage.videos?.some(key=>!key.startsWith('tui-first-steps'));if(inheritedVideo){artDescriptor.contentKind='software';if(!legacyMedia?.box)artDescriptor.protectedRects.push({x:0,y:0,width:1920,height:952});}cinematic.drawScene(ctx,fullCanvas,n,'native-layout');if(clip.id==='intro3')WorkstationQuestions.draw(ctx,p,scene);evidenceMotionAudit=drawEvidenceMotion(ctx,n);if(!avatarWindow&&!characterShot)provided.overlay(ctx,n,{energy:audio?.energy||0});informationAudit=drawEvidenceCallout(ctx,n);if(avatarWindow?.group!=='concept'||!window.PictureRenderAudit?.usage.live)presenceAudit=characterShot?null:presence.draw(ctx,n,{window:avatarWindow,energy:audio?.energy||0});subtitle(currentAudioTime,n,!chapterPreroll);}}
 if(hold?.render==='legacy-fullRender'&&serial===renderSerial)canvas.dataset.materialHold=JSON.stringify({id:hold.id,drawn:true,sourceKeys:hold.sourceKeys});
 if(bridge&&serial===renderSerial)canvas.dataset.materialHold=JSON.stringify({id:bridge.id,drawn:true,frameN:bridge.frameN});
 const activeBackdrop = cinematic.audit.character?.background;
 canvas.dataset.characterV4 = JSON.stringify(characterShot ? activeBackdrop : null);
 canvas.dataset.manifestoV5=JSON.stringify(!chapterPreroll&&serial===renderSerial?drawFeatureManifesto(ctx,currentAudioTime):null);
 canvas.dataset.communeV5=JSON.stringify(!chapterPreroll&&serial===renderSerial?featureCommune?.audit||null:null);
 canvas.dataset.openingEvidenceV5=JSON.stringify(!chapterPreroll&&serial===renderSerial?openingEvidence?.draw(ctx,characterShot,currentAudioTime)||null:null);
 canvas.dataset.cinematic=JSON.stringify(cinematic.audit);canvas.dataset.cinematicEnabled=String(cinematic.enabled);cinematic.suspend();
 if(pixelAuditEnabled){const rect=protectedRects.find(r=>r.width>=300&&r.height>=200),mediaRect=rect&&['footage','software'].includes(contentKind)?[Math.round(rect.x+rect.width/2-120),Math.round(rect.y+rect.height/2-90),240,180]:null;canvas.dataset.pixelAudit=JSON.stringify({time:displayTime,enabled:cinematic.enabled,subtitle:pixelDigest(0,952,1920,128),media:mediaRect?pixelDigest(...mediaRect):null,mediaPixels:mediaRect?[0,1,2,3,4].map(i=>[...ctx.getImageData(mediaRect[0]+i*37,mediaRect[1]+i*29,1,1).data]):null,background:pixelDigest(0,0,90,90)});}
 canvas.dataset.director=JSON.stringify(currentDirectorState);window.NarrationPreviewFrame={newTime:displayTime,audioTime:currentAudioTime,legacyTime:n,director:currentDirectorState,pictureTime:p,nativeTime:ot,clip:clip.id,local,scene,quote:quote?.id||null};canvas.dataset.pv='null';canvas.dataset.pvAudio=JSON.stringify(audio.audit);canvas.dataset.presence=JSON.stringify(presenceAudit);canvas.dataset.rhythm=JSON.stringify(rhythmAudit);canvas.dataset.focus=JSON.stringify(focusAudit);canvas.dataset.evidenceMotion=JSON.stringify(evidenceMotionAudit);canvas.dataset.information=JSON.stringify(informationAudit);canvas.dataset.frame=JSON.stringify(window.NarrationPreviewFrame);canvas.dataset.provided=JSON.stringify(provided.audit);canvas.dataset.renderedTime=displayTime.toFixed(2);canvas.dataset.missing=JSON.stringify(window.PictureAssetAudit?.missing||[]);lastDraw=displayTime;
 } finally {
   window.FeatureOpeningEvidenceOpacity = 0;
   featureCharacter.restoreAvatar();
   currentCharacterShot = null;
 }
}
function requestFrame(n){pending=clamp(n,0,displayDuration);renderSerial++;if(!rendering)void drain();return new Promise((resolve,reject)=>waiters.push({resolve,reject}));}
async function drain(){rendering=true;try{while(pending!==null){const t=pending,serial=renderSerial;pending=null;await compose(t,serial);}const done=waiters.splice(0);for(const w of done)w.resolve(window.NarrationPreviewFrame);}catch(error){for(const w of waiters.splice(0))w.reject(error);fail(error);}finally{rendering=false;}}
async function seek(t){if(!audio)return;await audio.seek(clamp(t,0,displayDuration));await requestFrame(audio.currentTime);update();}
function loop(){if(audio&&!fatal){update();if(!audio.paused&&!rendering&&Math.abs(audio.currentTime-lastDraw)>.015)void requestFrame(audio.currentTime).catch(fail);}requestAnimationFrame(loop);}
const ready=(async()=>{const responses=await Promise.all([fetch('/feature-narration-refresh.json',{cache:'no-store'}),fetch('picture-data.json',{cache:'no-store'}),fetch('picture-timeline-v22.json',{cache:'no-store'})]);for(const r of responses)if(!r.ok)throw Error('预览资料尚未准备好（'+r.status+'）');manifest=validateManifest(await responses[0].json());manifest.captions=(manifest.captions||[]).slice().sort((a,b)=>a.start-b.start);picture=await responses[1].json();referenceManifest=await responses[2].json();director=await loadNarrationDirector();g009Edit=createG009Edit(manifest,PV_TIME.insertAt);if(g009Edit)director=createNarrationDirector(g009Edit.conform(director.conform),director.editorial);await window.fullReady;await installPluginDanmaku();await import('/feature-p1c1-tui.js?v=14');installFeatureChapterMotion();g009Edit?.install(window.FullScenes.intro3,()=>currentAudioTime);provided=await createProvidedMedia({elapsed:row=>director.sourceElapsed(currentAudioTime,row.start,row.end)});
 const face=new FontFace('Noto Serif SC','url(/revolution-serif.ttf)',{weight:'100 900'});await face.load();document.fonts.add(face);await Promise.all([500,600,650,700,900].map(w=>document.fonts.load(w+' 100px "Noto Serif SC"')));
 const elapsed=row=>director.sourceElapsed(currentAudioTime,row.start,row.end);
 information=await createInformationScenes(referenceManifest,{
  dataUrl:'information-plan-v23.json',
  audioAtVisual:at=>director.rangesForVisual(at,at+.001)[0]?.start??director.audioAtVisual(at),
  elapsed(row){
   // Start this diagram after the archive image gives way to it.
   const holdEnd=materialHolds?.plan.holds.find(hold=>hold.id==='read-v11_macos_archive')?.end;
   const start=holdEnd>row.start&&holdEnd<row.end?holdEnd:row.start;
   return director.sourceElapsed(currentAudioTime,start,row.end);
  },
 });
 rhythm=await createRhythmMedia({elapsed});focus=await createInformationFocus();presence=await createPresenceEnhancements();pv=await createPVOpening();if(Math.abs(pv.duration-PV_TIME.insertDuration)>.001)throw Error('PV renderer duration does not match the editorial insertion');
 const originalArtPlan=await fetch('research/full-film-cinematic-plan.json').then(r=>{if(!r.ok)throw Error('全片视觉计划载入失败');return r.json();});
 const artPlan=director.decorateMotionPlan(originalArtPlan);
 const cinematicCharacter=await createCinematicPresence({manifest:referenceManifest,plan:artPlan});
 featureCharacter=await createFeatureCharacter({director,originalLayer:cinematicCharacter,avatar:window.FullStudio.avatar,narrationEnergy:()=>audio?.energy||0});
 featureCommune=installFeatureCommune({intro:window.FullScenes.intro3,outro:window.FullScenes.outro,filmKit:window.P3FilmKit,getAudioTime:()=>currentAudioTime});
 openingEvidence=await createOpeningEvidence();
 supplemental=await createSupplementalEvidence();
 materialHolds=await createMaterialHolds({dataUrl:"/feature-material-holds.json"});
 cinematic=createCinematicCompositor(await createCinematicWorld({data:artPlan}),{motionPlan:artPlan,characterLayer:featureCharacter.layer});cinematic.attach(ctx,'preview');cinematic.attach(fullCanvas.getContext('2d'),'legacy-animation');
 brightenCanvasText(ctx);
 brightenCanvasText(fullCanvas.getContext('2d'));
 audio=await createPVAudio(manifest,{onState:state=>{
  if(!fatal)message.textContent=state?.buffering?'正在载入下一段配音……':'';
  update();
  if(audio&&state?.state==='ended'&&audio.currentTime>=displayDuration-.02)requestFrame(displayDuration).catch(fail);
 },onError:fail});
 displayDuration=audio.duration;
 window.NarrationEnergy=()=>audio.energy;
 const credits=audio.endingCredits;
 if(credits&&credits.end>credits.bodyEnd){
  const {createHarnessCredits,HARNESS_CUES}=await import('/harness-credits.js?v=3');
  harnessCredits=await createHarnessCredits();
  endingCredits=credits;
  for(const [id,label,elapsed] of [
   ['harness-credits-jump','DeepSeek Harness 贡献者',0],
   ['harness-plugin-credits-jump','社区插件长卷',HARNESS_CUES.community],
   ['harness-assembly-jump','片尾收束',HARNESS_CUES.assembly],
  ]){
   const button=document.createElement('button');
   button.id=id;
   button.textContent=label;
   button.onclick=()=>seek(endingCredits.bodyEnd+elapsed).catch(fail);
   play.parentElement.append(button);
  }
 }
 chapterRows=referenceManifest.chapters.map(c=>{const ranges=director.rangesForVisual(c.start,c.end);return{...c,start:ranges[0]?.start??0,end:ranges.at(-1)?.end??0};}).filter(c=>c.end-c.start>1).map(c=>({...c,start:toDisplayTime(c.start),end:toDisplayTime(c.end)}));
 for(const chapter of chapterRows){const b=document.createElement('button');b.textContent=chapter.title;b.dataset.start=chapter.start;b.dataset.end=chapter.end;const boundaryChapter=chapter.start<PV_TIME.insertAt&&PV_TIME.insertAt-chapter.start<.5&&chapter.end>PV_TIME.insertEnd,firstBody=manifest.groups.find(g=>g.start>=PV_TIME.insertAt);b.onclick=()=>seek(boundaryChapter&&firstBody?toDisplayTime(firstBody.start):chapter.start).catch(fail);$('chapters').append(b);}
 const revisionNames={'manual-labour':'搬运劳动','factory-work':'流水线','lovable-partner':'夜景伙伴','dsh-creative-plugin':'DSH 终端演示','fan-rice-bowl':'白饭鲸鱼二创','ownership-question':'聚会对照',v12_dsh_cloud:'DSH Cloud',v12_calc:'Calc',v12_flowise_agentflow:'Flowise',v12_msg_locator:'消息定位',v12_desktop_windows:'桌面界面',v12_oi_pomodoro:'Open Interpreter',v12_share_room:'共享会话',v12_langflow_build:'Langflow',v12_lerobot_pot:'LeRobot',v12_ufo_cross_app_inputs:'UFO',v12_browser_use_form:'Browser Use',v12_openhands_vnc_browser:'OpenHands',v12_office_viewer:'文档查看'};for(const row of [...provided.edits.windows,...provided.edits.overlays]){const b=document.createElement('button');b.textContent=revisionNames[row.id]||((revisionNames[row.key]||row.key)+(row.avatarSize==='large'?' · 大人物':' · 小人物'));b.onclick=()=>seek(reviewTime(row.start+.35)).catch(fail);$('revision-cuts').append(b);}
 for(const row of information.plan.scenes){const b=document.createElement('button');b.textContent=row.title;b.onclick=()=>seek(reviewTime(row.start+1)).catch(fail);$('information-cuts').append(b);}for(const row of rhythm.plan.cuts){const b=document.createElement('button');b.textContent=format(reviewTime(row.start))+' · '+row.semantic;b.onclick=()=>seek(reviewTime(row.start+.4)).catch(fail);$('rhythm-cuts').append(b);if(row.revision==='V17'){const changed=document.createElement('button');changed.textContent=format(reviewTime(row.start))+' · '+row.replacementLabel;changed.onclick=()=>seek(reviewTime(row.start+.4)).catch(fail);$('replacement-cuts').append(changed);}}
 for(const row of presence.plan.reviewSamples){const b=document.createElement('button');b.textContent=format(reviewTime(row.time))+' · '+row.label;b.onclick=()=>seek(reviewTime(row.time)).catch(fail);$('presence-cuts').append(b);}
 const pvMarkers=[{id:'music-prelude',label:'配乐预入',displayTime:PV_TIME.musicStart},{id:'pv-entry',label:'进入PV',displayTime:PV_TIME.insertAt},...(pv.data?.sceneLandmarks||[]).filter(row=>Number(row.time??row.localTime??row.start??0)>0).map(row=>({...row,displayTime:PV_TIME.insertAt+Number(row.time??row.localTime??row.start??0)})),{label:'转入第一章',displayTime:PV_TIME.insertEnd-CHAPTER_APPROACH_SECONDS}].sort((a,b)=>a.displayTime-b.displayTime);
 for(const row of pvMarkers){const b=document.createElement('button');const label=row.label||row.title||row.id,names={questions:'问题连问',orbitBridge:'地球与代码穿行',futureQuestion:'最终问题·未来',books:'参考文献 1',literature1:'参考文献 2',literature2:'参考文献 3',literature3:'参考文献 4',literature4:'参考文献 5',statistics:'制作统计',videoRefs:'B站参考资料',credits:'制作署名',music:'配乐',thanks:'鸣谢',final:'最终标题',end:'接回正文'};b.textContent=format(row.displayTime)+' · '+(names[label]||label);b.dataset.start=row.displayTime;b.onclick=()=>seek(row.displayTime).catch(fail);$('pv-cuts').append(b);}
 const reviewRows=artPlan.reviewSamples?.length?artPlan.reviewSamples:artPlan.chapters.map(row=>({time:Math.min(row.end-1,row.start+(row.start===0?4:8)),label:row.label}));
 for(const row of reviewRows){const b=document.createElement('button');const n=Number(row.legacyTime??row.time??row.start);b.textContent=format(reviewTime(n))+' · '+row.label;b.onclick=()=>seek(reviewTime(n)).catch(fail);$('cinematic-cuts').append(b);}
 for(const row of supplemental.plan.shots||[]){const b=document.createElement('button');b.textContent=format(reviewTime(row.start))+' · '+(row.label||row.id);b.onclick=()=>seek(reviewTime(row.start+.6)).catch(fail);$('material-cuts').append(b);}
 for(const row of manifest.groups){const b=document.createElement('button');b.textContent=format(toDisplayTime(row.start))+' · '+row.id+' · '+row.section;b.onclick=()=>seek(toDisplayTime(row.start+.12)).catch(fail);$('narration-cuts').append(b);}
 progress.max=displayDuration;for(const el of[play,progress,$('restart-main')])el.disabled=false;play.onclick=async()=>{try{fatal=null;await audio.unlock();if(audio.paused){if(audio.currentTime>=displayDuration-.02)await audio.seek(0);await audio.play();}else{audio.pause();await requestFrame(audio.currentTime);}update();}catch(error){fail(error);}};
 progress.oninput=()=>seek(+progress.value).catch(fail);$('restart-main').onclick=()=>seek(0).catch(fail);$('captions-main').onchange=()=>requestFrame(audio.currentTime).catch(fail);$('fullscreen-main').onclick=()=>canvas.requestFullscreen?.();
 $('cinematic-main').onchange=()=>{cinematic.setEnabled($('cinematic-main').checked);creditsPlate=null;requestFrame(audio.currentTime).catch(fail);};
 document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();play.click();}else if(e.code==='ArrowRight'||e.code==='ArrowLeft'){e.preventDefault();seek(audio.currentTime+(e.code==='ArrowRight'?5:-5)).catch(fail);}});
 const q=new URLSearchParams(location.search);await seek(Number(q.get('t'))||0);message.textContent='';requestAnimationFrame(loop);return{duration:displayDuration,legacyDuration:manifest.duration,groups:audio.manifest.groups.length,chapters:chapterRows.length,source:'V23 latest narration / semantic animation director',pv:PV_TIME};
})();
window.NarrationPreview={ready,play:async()=>{await ready;await audio.play();},pause:()=>{if(!audio)return;audio.pause();update();return requestFrame(audio.currentTime).catch(fail);},seek:async t=>{await ready;return seek(t);},renderAt:async t=>{await ready;return seek(t);},get state(){return{time:audio?.currentTime||0,paused:audio?.paused??true,error:fatal?.message||null,frame:window.NarrationPreviewFrame,chapters:chapterRows.length,duration:displayDuration,legacyTime:audio?toLegacyTime(audio.currentTime):0,pvAudio:audio?.audit||null};},get editorial(){return PV_TIME;}};
window.AdaptationPreview=window.NarrationPreview;window.adaptationReady=ready;
ready.catch(fail);window.addEventListener('pagehide',()=>{audio?.destroy();provided?.destroy();rhythm?.destroy();cinematic?.destroy();supplemental?.destroy();materialHolds?.destroy();pv?.destroy();harnessCredits?.destroy?.();FullStudio?.avatar?.destroy();});


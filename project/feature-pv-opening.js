/* V22 / one continuous typographic space. Every state is a function of time.
 * Reference: the existing 25-page 东方红的心脏 design study, not a copied frame.
 * Native Canvas 2D; no recording, media encoding, or playback clock inside.
 */
import {createPVSpace} from '/feature/pv-space.js';
import {createPVTextCredits} from '/feature/pv-credits-space.js';
const W=1920,H=1080,TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const out=t=>1-Math.pow(1-clamp(t),3);
const enter=(t,a,b)=>smooth((t-a)/(b-a));
const windowAlpha=(t,a,b,fade=.32)=>enter(t,a-fade,a+.12)*(1-enter(t,b-.12,b+fade));
const frac=n=>n-Math.floor(n);
const hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453123);
const BG='#080909',PAPER='#eeeae1',INK='#171a1a',RED='#c43b35';
const FAMILY='"PV Serif","Noto Serif SC",serif';
const SANS='"PV Sans","Microsoft YaHei",sans-serif';
const MONO='"PV Mono","PV Sans","Consolas",monospace';

function fitted(ctx,text,size,maxWidth,family=FAMILY,weight=700){
  ctx.font=`${weight} ${size}px ${family}`;
  const measured=ctx.measureText(text).width;
  if(measured>maxWidth)size*=maxWidth/measured;
  ctx.font=`${weight} ${size}px ${family}`;
  return size;
}
function text(ctx,value,x,y,size=40,color=PAPER,align='left',family=FAMILY,weight=600){
  ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function line(ctx,x0,y0,x1,y1,color=PAPER,width=1,alpha=1){
  ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();
}
function poly(ctx,points,color,width=1,alpha=1){
  if(points.length<2)return;ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore();
}
function cross(ctx,x,y,r,color=PAPER,alpha=.5){line(ctx,x-r,y,x+r,y,color,1,alpha);line(ctx,x,y-r,x,y+r,color,1,alpha);}
function lowerBound(rows,t,key='time_s'){
  let a=0,b=rows.length;while(a<b){const m=(a+b)>>1;if(rows[m][key]<t)a=m+1;else b=m;}return a;
}
function sampleFeature(rows,t){
  const i=lowerBound(rows,t),a=rows[Math.max(0,i-1)]||{},b=rows[Math.min(rows.length-1,i)]||a;
  const u=clamp((t-a.time_s)/Math.max(.001,b.time_s-a.time_s));
  return Object.fromEntries(['energy','low','mid','high','flux'].map(k=>[k,mix(a[k]||0,b[k]||0,u)]));
}
function hitEnvelopes(events,t){
  const result={kick:0,snare:0,hat:0},start=lowerBound(events,t-.8),end=lowerBound(events,t+.00001);
  for(let i=start;i<end;i++){
    const e=events[i];if(e.confidence_score<.58||e.strength<.3)continue;
    const kind=e.type.startsWith('kick')?'kick':e.type.startsWith('snare')?'snare':'hat';
    const tau=kind==='kick'?.19:kind==='snare'?.13:.065;
    result[kind]=Math.max(result[kind],e.strength*Math.exp(-(t-e.time_s)/tau));
  }return result;
}
function splitQuestion(value,keyword){
  const i=value.indexOf(keyword);return i<0?[value,'']:[value.slice(0,i),value.slice(i+keyword.length)];
}
function makeGrain(){
  const c=document.createElement('canvas');c.width=384;c.height=216;const cx=c.getContext('2d'),d=cx.createImageData(c.width,c.height);
  for(let i=0;i<d.data.length;i+=4){const k=Math.floor(hash(i*.71)*255);d.data[i]=d.data[i+1]=d.data[i+2]=k;d.data[i+3]=30;}
  cx.putImageData(d,0,0);return c;
}

export async function createPVOpening(options={}){
  const response=await fetch('/pv-opening-data.json',{cache:'no-store'});
  if(!response.ok)throw Error('PV片头资料尚未就绪');
  const data=await response.json();
  data.credits=data.credits.map(row=>row.label==='编剧'&&row.value==='肥鱼大讲堂'
    ? {label:'校对',value:'Dn_'}
    : row);
  data.review={...data.review,names:['妙蛙蒜头a']};
  data.thanksSlots=['Dn_', '妙蛙蒜头a', 'limit', '白子酱是最好的', '科学の灯塔']
    .map((value,index)=>({index:index+1,value,placeholder:false}));
  const analysisResponse=await fetch('/'+data.music.analysisUrl,{cache:'no-store'});
  if(!analysisResponse.ok)throw Error('PV音乐分析资料尚未就绪');
  const analysis=await analysisResponse.json();
  const duration=Number(data.duration)||73.74,phases=data.visualPhases;
  const orbitPhase=phases.orbitBridge,titlePhase=phases.finalTitle,futurePhase=phases.futureQuestion;
  const faces=[new FontFace('PV Serif','url(/revolution-serif.ttf)',{weight:'100 900'}),
    new FontFace('PV Sans','url(/assets/pv-opening/simhei.ttf)'),
    new FontFace('PV Mono','url(/assets/pv-opening/bahnschrift.ttf)',{weight:'100 900'})];
  await Promise.all(faces.map(async f=>{await f.load();document.fonts.add(f);}));
  await document.fonts.ready;
  const grain=makeGrain(),questions=data.questions,events=analysis.events,features=analysis.features;
  const plateCache=new Map();
  const space=options.space||createPVSpace({width:W,height:H});
  const textCredits=createPVTextCredits({data,space,fontFamily:FAMILY,sansFamily:SANS,monoFamily:MONO});
  const loadAsset=options.loadAsset||(src=>new Promise(resolve=>{
    if(typeof Image==='undefined'){resolve(null);return;}
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;
  }));
  const [workshop,archive,fishPortrait,fishFull]=await Promise.all([
    loadAsset('/assets/pv-opening/generated-workshop-v1.png'),
    loadAsset('/assets/pv-opening/generated-archive-v1.png'),
    loadAsset('/assets/pv-opening/fish-portrait-v1.png'),
    loadAsset('/assets/pv-opening/fish-full-v1.png')]);
  const avatarCropCache=new Map(),avatarProbe=document.createElement('canvas');
  avatarProbe.width=900;avatarProbe.height=1100;
  const avatarPixels=avatarProbe.getContext('2d',{willReadFrequently:true});

  function characterCue(t){
    if(t<2.1)return {layer:'background',framing:'close',box:[1060,-120,980,1300],opacity:.17,side:'right',mood:'firm'};
    if(t<6.58)return {layer:'foreground',framing:'full',box:[35,164,440,916],opacity:.95,side:'left',mood:'firm'};
    if(t<8.08)return {layer:'foreground',framing:'waist',box:[1420,250,450,830],opacity:.96,side:'right',mood:'firm'};
    if(t<11.06)return {layer:'background',framing:'close',box:[-200,-170,1100,1370],opacity:.13,side:'left',mood:'concerned'};
    if(t<14.06)return {layer:'foreground',framing:'full',box:[1435,160,445,920],opacity:.96,side:'right',mood:'smile'};
    if(t<17.05)return {layer:'background',framing:'close',box:[890,-180,1140,1420],opacity:.15,side:'right',mood:'firm'};
    if(t<20.03)return {layer:'foreground',framing:'waist',box:[1430,200,450,880],opacity:.95,side:'right',mood:'firm'};
    if(t<24.52)return {layer:'background',framing:'close',box:[-210,-190,1120,1390],opacity:.14,side:'left',mood:'concerned'};
    if(t<orbitPhase.start)return {layer:'foreground',framing:'full',box:[1430,170,460,910],opacity:.97,side:'right',mood:'firm'};
    if(t<phases.books.start)return {layer:'background',framing:'close',box:[-200,-120,1050,1310],opacity:.13,side:'left',mood:'firm'};
    if(t<phases.credits.start)return {layer:'background',framing:'close',box:[1180,-40,820,1160],opacity:.12,side:'right',mood:'neutral'};
    if(t<phases.music.start)return {layer:'background',framing:'close',box:[1130,-80,900,1220],opacity:.14,side:'right',mood:'smile'};
    if(t<titlePhase.start)return {layer:'background',framing:'close',box:[870,-160,1120,1400],opacity:.14,side:'right',mood:'neutral'};
    if(t<futurePhase.start)return {layer:'foreground',framing:'full',box:[55,135,500,945],opacity:1,side:'left',mood:'firm'};
    return {layer:'background',framing:'close',box:[1080,-70,950,1220],opacity:.12,side:'right',mood:'concerned'};
  }
  function getAvatar(){return typeof window==='undefined'?null:window.PVNativeAvatar||window.FullStudio?.avatar||null;}
  function drawCharacter(ctx,t,layer,visibility=1){
    if(visibility<=0)return null;
    const avatar=getAvatar(),cue=characterCue(t);if(!avatar||cue.layer!==layer)return null;
    const replacement=Math.max(
      fishFull?Math.max(windowAlpha(t,orbitPhase.start+.6,33.4,.8),windowAlpha(t,phases.thanks.start,titlePhase.start-.2,.65)):0,
      fishPortrait&&layer==='background'?windowAlpha(t,17.5,phases.music.start-1.1,1.05):0);
    // Native model only; zero narration energy, so music never becomes invented lip sync.
    const modelTime=368.26+t;
    avatar.draw(modelTime,{framing:cue.framing,energy:0,motionTime:modelTime,mood:cue.mood,lookX:cue.side==='left'?.4:-.38,ears:true});
    let crop=avatarCropCache.get(cue.framing);
    if(!crop){
      avatarPixels.clearRect(0,0,900,1100);avatarPixels.drawImage(avatar.canvas,0,0,900,1100);
      const bytes=avatarPixels.getImageData(0,0,900,1100).data;let x0=900,y0=1100,x1=0,y1=0;
      for(let y=0;y<1100;y+=2)for(let x=0;x<900;x+=2)if(bytes[(y*900+x)*4+3]>10){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      crop=x1>x0?[Math.max(0,x0-6),Math.max(0,y0-6),Math.min(900-x0+6,x1-x0+12),Math.min(1100-y0+6,y1-y0+12)]:[0,0,900,1100];
      avatarCropCache.set(cue.framing,crop);
    }
    const [x,y,w,h]=cue.box,scale=Math.min(w/crop[2],h/crop[3]);
    const dw=crop[2]*scale,dh=crop[3]*scale,rect=[x+(w-dw)/2,y+h-dh,dw,dh];
    const bounds=[0,2.1,6.58,8.08,11.06,14.06,17.05,20.03,24.52,orbitPhase.start,phases.books.start,phases.credits.start,phases.music.start,titlePhase.start,futurePhase.start,duration];
    const at=t>=duration?bounds.length-2:Math.max(0,bounds.findIndex((b,i)=>i<bounds.length-1&&t>=b&&t<bounds[i+1]));
    const fade=(t<.25?1:smooth((t-bounds[at])/.22))*(t>duration-.3?1:smooth((bounds[at+1]-t)/.22));
    const opacity=cue.opacity*fade*(1-replacement)*visibility;
    ctx.save();ctx.globalAlpha*=opacity;ctx.filter=layer==='background'?'grayscale(1) brightness(.78) contrast(1.12)':'grayscale(1)';
    ctx.drawImage(avatar.canvas,...crop,...rect);ctx.restore();
    return {nativeModel:true,layer,framing:cue.framing,opacity,box:rect,lipSync:false};
  }

  function drawArt(ctx,t){
    const rows=[{image:workshop,start:9.8,end:16.8,alpha:.40,direction:1},
      {image:archive,start:19.0,end:26.1,alpha:.35,direction:-1},
      {image:archive,start:27.0,end:34.2,alpha:.32,direction:1},
      {image:workshop,start:titlePhase.start-.5,end:futurePhase.start+.2,alpha:.28,direction:1},
      {image:archive,start:futurePhase.start-.4,end:duration+.4,alpha:.22,direction:-1}];
    for(const row of rows){
      if(!row.image||t<row.start-.75||t>row.end+.75)continue;
      const age=clamp((t-row.start)/(row.end-row.start)),alpha=windowAlpha(t,row.start,row.end,.7)*row.alpha;
      const scale=1.18+.20*age,w=W*scale,h=H*scale;
      ctx.save();ctx.globalAlpha*=alpha;
      ctx.translate(960+(age-.5)*row.direction*220,540+Math.sin(age*Math.PI)*42);
      ctx.rotate((age-.5)*row.direction*.025);ctx.filter='grayscale(1) contrast(1.15)';
      ctx.drawImage(row.image,-w/2,-h/2,w,h);ctx.restore();
    }
  }

  function drawFishArt(ctx,t,layer){
    const references=windowAlpha(t,phases.books.start,phases.videos.start,.6);
    if(layer==='background'&&fishFull&&references>.001){
      const age=t-phases.books.start;
      const sweep=Math.sin(age*1.4);
      const opacity=references*(.24+.07*sweep);
      space.drawPlane(ctx,fishFull,{
        x:1650+135*sweep,y:550+76*Math.cos(age*.85),
        width:610,height:610*fishFull.height/fishFull.width,
        depth:1200-150*sweep,yaw:.12*sweep,pitch:.025,roll:.045*sweep,opacity
      });
    }
    if(layer==='background'&&fishPortrait&&t>=16.4&&t<=phases.music.start){
      const travel=clamp((t-17.5)/(phases.music.start-18.6)),opacity=windowAlpha(t,17.5,phases.music.start-1.1,1.05)*mix(.21,.095,references);
      space.drawPlane(ctx,fishPortrait,{x:1370+travel*85,y:650-travel*65,
        width:1160,height:1160*fishPortrait.height/fishPortrait.width,depth:1320-travel*140,
        yaw:-.08+travel*.13,pitch:.015,roll:-.018+travel*.03,opacity});
      return {asset:'fish-portrait-v1.png',layer:'background',opacity};
    }
    if(layer==='foreground'&&fishFull&&t>=orbitPhase.start-.2&&t<=34.3){
      const travel=clamp((t-(orbitPhase.start+.6))/(33.4-orbitPhase.start-.6)),opacity=windowAlpha(t,orbitPhase.start+.6,33.4,.8)*.91;
      space.drawPlane(ctx,fishFull,{x:1660-travel*950,y:604-Math.sin(travel*Math.PI)*34,
        width:620,height:620*fishFull.height/fishFull.width,depth:1550-Math.sin(travel*Math.PI)*660,
        yaw:-.20+travel*.48,pitch:.025*Math.sin(travel*Math.PI),roll:-.025+travel*.05,opacity});
      return {asset:'fish-full-v1.png',layer:'foreground',opacity,passage:'orbital-depth-crossing',progress:travel,y:604-Math.sin(travel*Math.PI)*34};
    }
    const bridge=phases.referenceBridge;
    if(layer==='foreground'&&fishFull&&bridge){
      const alpha=windowAlpha(t,bridge.start+.22,bridge.end-.42,.52);
      if(alpha>.001){
        const travel=smooth((t-bridge.start)/(bridge.end-bridge.start));
        const arc=Math.sin(travel*Math.PI);
        space.drawPlane(ctx,fishFull,{
          x:1530-1010*travel,y:610-55*arc,width:650,height:650*fishFull.height/fishFull.width,
          depth:1500-640*arc,yaw:.22-.44*travel,pitch:.025*arc,roll:.05-.10*travel,opacity:alpha*.94
        });
        return {asset:'fish-full-v1.png',layer:'foreground',opacity:alpha,passage:'reference-bridge',progress:travel};
      }
    }
    if(layer==='foreground'&&fishFull&&t>=phases.thanks.start-.6&&t<=titlePhase.start+.35){
      const travel=clamp((t-phases.thanks.start)/(titlePhase.start-phases.thanks.start)),opacity=windowAlpha(t,phases.music.start,titlePhase.start-.2,.65)*.97;
      space.drawPlane(ctx,fishFull,{x:1560-travel*40,y:589+travel*8,
        width:610,height:610*fishFull.height/fishFull.width,depth:1150-travel*55,
        yaw:.075-travel*.10,pitch:0,roll:.016-travel*.026,opacity});
      return {asset:'fish-full-v1.png',layer:'foreground',opacity};
    }
    return null;
  }

  function drawPresenter(ctx,t,character){
    if(character?.passage!=='orbital-depth-crossing')return;
    const travel=character.progress;
    const alpha=windowAlpha(t,orbitPhase.start+.55,orbitPhase.end-1,.55);
    const arrival=smooth(travel/.52);
    const scale=mix(.62,1.04,arrival);
    const y=character.y-70;
    ctx.save();ctx.globalAlpha*=alpha*mix(.62,1,arrival);
    ctx.shadowColor='#080909';ctx.shadowBlur=12;
    ctx.translate(mix(530,305,arrival),y);ctx.scale(scale,scale);
    text(ctx,'由',0,-94,42,PAPER,'center',FAMILY,500);
    text(ctx,'資本の路灯',0,0,80,RED,'center',FAMILY,800);
    text(ctx,'倾情巨献',0,94,42,PAPER,'center',FAMILY,500);
    ctx.restore();
    ctx.save();ctx.globalAlpha*=alpha*mix(.46,1,smooth(travel/.42));
    ctx.shadowColor='#080909';ctx.shadowBlur=12;
    ctx.translate(mix(1790,1610,arrival),mix(940,y,arrival));ctx.scale(scale,scale);
    text(ctx,'肥鱼',0,-64,96,PAPER,'center',FAMILY,700);
    text(ctx,'大讲堂',0,62,96,PAPER,'center',FAMILY,700);
    ctx.restore();
  }

  function drawTypeBurst(ctx,t,hits){
    let amp=0;
    for(const center of [.28,8.45,17.25,25.7,30.4,62.8])amp=Math.max(amp,Math.exp(-Math.pow((t-center)/.85,2)));
    if(amp<.015)return;
    const cx=1140+Math.sin(t*.31)*150,cy=525;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-t*.24);ctx.globalAlpha*=amp*.34;
    for(let i=0;i<18;i++){
      const angle=i/18*TAU,far=i%3===0,r=380+(far?270:0);
      ctx.save();ctx.rotate(angle);ctx.translate(r,0);ctx.rotate(angle>Math.PI/2&&angle<Math.PI*1.5?Math.PI:0);
      text(ctx,questions[i].keyword,0,0,far?73:43,PAPER,'left',FAMILY,600);ctx.restore();
      line(ctx,Math.cos(angle)*170,Math.sin(angle)*170,Math.cos(angle)*980,Math.sin(angle)*980,PAPER,1,.38);
    }
    ctx.restore();
  }

  function questionPlate(q){
    if(plateCache.has(q.id))return plateCache.get(q.id);
    const c=document.createElement('canvas');c.width=1780;c.height=700;const cx=c.getContext('2d');
    const [before,after]=splitQuestion(q.text,q.keyword),variant=q.index===18?3:q.index%4;
    // The large word is a second reading of the complete question, never a substitute.
    const giant=q.index===18?325:variant===1?245:variant===2?225:260;
    cx.save();cx.globalAlpha=.12;cx.strokeStyle=PAPER;cx.lineWidth=1.4;
    fitted(cx,q.keyword,440,1700,FAMILY,900);cx.textAlign='center';cx.textBaseline='middle';
    cx.strokeText(q.keyword,890,390);cx.restore();
    const left=110,anchor=variant===2?1570:variant===3?890:left;
    const align=variant===2?'right':variant===3?'center':'left';
    text(cx,String(q.index).padStart(2,'0'),left,86,24,RED,'left',MONO,500);
    line(cx,left+62,86,590,86,PAPER,1,.28);

    const prefix=before||'我们';
    fitted(cx,prefix,q.index===18?91:73,1480,FAMILY,600);cx.fillStyle=PAPER;cx.textAlign=align;cx.fillText(prefix,anchor,205);
    fitted(cx,q.keyword,giant,1510,FAMILY,900);cx.fillStyle=q.index%3===0?RED:PAPER;cx.fillText(q.keyword,anchor,385);
    if(after){fitted(cx,after,78,1460,FAMILY,600);cx.fillStyle=PAPER;cx.fillText(after,anchor,555);}
    // Whole sentence has a stable, unobscured reading pass at a second scale.
    fitted(cx,q.text,q.index===18?53:39,1430,FAMILY,500);cx.textAlign=q.index===18?'center':'left';cx.fillStyle=PAPER;cx.fillText(q.text,q.index===18?890:left,660);
    return plateCache.set(q.id,c).get(q.id);
  }
  questions.forEach(questionPlate);

  function drawOrrery(ctx,t,feature,hits){
    const questionEra=1-enter(t,orbitPhase.start,phases.books.start),finalEra=enter(t,titlePhase.start-.8,futurePhase.start);
    const voyage=windowAlpha(t,orbitPhase.start+.15,33.4,.9);
    const travel=1-enter(t,orbitPhase.start+.3,phases.books.start+1.0);
    const cx=mix(1050+Math.sin(t*.29+1.0)*490,960,1-travel),cy=540+Math.sin(t*.42)*95*travel;
    const radius=mix(mix(490+Math.sin(t*.38)*170,720+Math.sin((t-orbitPhase.start)*.31)*100,voyage),850,finalEra);
    const yaw=t*.115+Math.sin(t*.11)*.35,pitch=.38+Math.sin(t*.19)*.13;
    const roll=-.20+t*.013+Math.sin(t*.2)*.07;
    const project=(x,y,z)=>{
      let xx=x*Math.cos(yaw)-z*Math.sin(yaw),zz=x*Math.sin(yaw)+z*Math.cos(yaw);
      const yy=y*Math.cos(pitch)-zz*Math.sin(pitch);zz=y*Math.sin(pitch)+zz*Math.cos(pitch);
      const scale=1/(1+zz*.33),rx=(xx*Math.cos(roll)-yy*Math.sin(roll))*radius*scale,ry=(xx*Math.sin(roll)+yy*Math.cos(roll))*radius*scale;
      return [cx+rx,cy+ry,zz];
    };
    ctx.save();ctx.globalAlpha*=mix(mix(.76,.36,1-questionEra),.88,voyage)*(1-.25*finalEra);
    // One meridian grid is carried through every sequence, including the credits.
    for(let m=0;m<20;m++){
      const phi=m/20*TAU,points=[];
      for(let n=0;n<=80;n++){const theta=-Math.PI/2+n/80*Math.PI,p=project(Math.cos(theta)*Math.cos(phi),Math.sin(theta),Math.cos(theta)*Math.sin(phi));points.push(p);}
      poly(ctx,points.map(p=>[p[0],p[1]]),PAPER,.75,m%4===0?.36:.14);
    }
    for(let n=1;n<13;n++){
      const theta=-Math.PI/2+n/13*Math.PI,points=[];
      for(let m=0;m<=120;m++){const phi=m/120*TAU;points.push(project(Math.cos(theta)*Math.cos(phi),Math.sin(theta),Math.cos(theta)*Math.sin(phi)));}
      poly(ctx,points.map(p=>[p[0],p[1]]),PAPER,.8,n%3===0?.38:.16);
    }
    // The oblique ring is a persistent directional reference, not a particle field.
    for(let ring=0;ring<3;ring++){
      const points=[];for(let i=0;i<=180;i++){const a=i/180*TAU;points.push(project(Math.cos(a)*(1.24+ring*.09),Math.sin(a)*.18,Math.sin(a)*(1.24+ring*.09)));}
      poly(ctx,points.map(p=>[p[0],p[1]]),ring===0?RED:PAPER,ring===0?1.7:.6,ring===0?.8:.30);
    }
    for(let i=0;i<18;i++){
      const q=questions[i],a=i/18*TAU+t*.06;
      if(q.index===18&&t<futurePhase.start-1)continue;
      const p=project(Math.cos(a)*1.5,Math.sin(a)*.9,Math.sin(a)*.65);
      ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(a+Math.PI/2+roll);ctx.globalAlpha*=.35;
      text(ctx,q.keyword,0,0,20,PAPER,'center',FAMILY,500);ctx.restore();
    }
    ctx.restore();
  }

  const codeTokens=['{}','</>','[]','=>','λ','()','&&','::','01','+=','return','...'];
  const codeTextures=codeTokens.map((token,index)=>{
    const image=document.createElement('canvas');image.width=220;image.height=104;
    const cx=image.getContext('2d');text(cx,token,110,57,50,index%5===0?RED:PAPER,'center',MONO,500);
    line(cx,42,91,178,91,PAPER,1,.22);return image;
  });
  function drawCodePassage(ctx,t){
    const passage=windowAlpha(t,orbitPhase.start+.05,phases.books.start-.15,.9);
    const coda=windowAlpha(t,phases.music.start-.5,titlePhase.start+.2,.85);
    const future=enter(t,futurePhase.start-.6,futurePhase.start+1.1);
    const references=windowAlpha(t,phases.books.start,phases.videos.start,.55);
    const bridge=phases.referenceBridge;
    const bridgeEnergy=bridge?windowAlpha(t,bridge.start,bridge.end,.48):0;
    const opacity=Math.max(passage*.76,references*.43,bridgeEnergy*.73,coda*.24,future*.13);
    if(opacity<.001)return null;
    const age=t-orbitPhase.start,camYaw=age*.155-.32+references*.24*Math.sin(age*.83),camPitch=.25+Math.sin(age*.19)*.13;
    const cx=960+Math.sin(age*.21)*125,cy=525+Math.cos(age*.17)*38;
    const project=(x,y,z)=>{
      const xx=x*Math.cos(camYaw)-z*Math.sin(camYaw),zz=x*Math.sin(camYaw)+z*Math.cos(camYaw);
      const yy=y*Math.cos(camPitch)-zz*Math.sin(camPitch),depth=1370+y*Math.sin(camPitch)+zz*Math.cos(camPitch);
      return{x:cx+xx*1100/depth,y:cy+yy*1100/depth,depth};
    };
    // Three oblique closed orbits, with independently moving code planes. The
    // camera travels through their depths; no modulo reset or audio impulse.
    const orbitPoints=[];
    for(let ring=0;ring<3;ring++){
      const points=[];
      for(let i=0;i<=96;i++){
        const a=i/96*TAU,tilt=(ring-1)*.44,r=650+ring*90;
        const p=project(Math.cos(a)*r,Math.sin(a)*Math.sin(tilt)*r,Math.sin(a)*Math.cos(tilt)*r);points.push([p.x,p.y]);
      }
      poly(ctx,points,ring===1?RED:PAPER,ring===1?1.8:.8,opacity*(ring===1?.58:.30));orbitPoints.push(points.length);
    }
    const entries=codeTextures.map((image,i)=>{
      const ring=i%3,a=i/codeTextures.length*TAU+age*(.105+ring*.027),r=650+ring*90,tilt=(ring-1)*.44;
      const p=project(Math.cos(a)*r,Math.sin(a)*Math.sin(tilt)*r,Math.sin(a)*Math.cos(tilt)*r);
      const back=clamp((p.depth-700)/1700);
      return{image,pose:{x:p.x,y:p.y,width:220,height:104,depth:p.depth,yaw:Math.sin(a-camYaw)*.48,
        pitch:camPitch*.22,roll:Math.sin(a)*.075,opacity:opacity*mix(.95,.34,back)}};
    }).sort((a,b)=>b.pose.depth-a.pose.depth);
    const batch=space.drawPlanes?space.drawPlanes(ctx,entries):null;
    if(!batch)for(const entry of entries)space.drawPlane(ctx,entry.image,entry.pose);
    return{chapter:passage>.1?'orbital-passage':future>.1?'future-orbit':'credits-orbit',planes:entries.length,
      orbitLines:orbitPoints.length,opacity,cameraYaw:camYaw,cameraPitch:camPitch,
      depthRange:[Math.min(...entries.map(e=>e.pose.depth)),Math.max(...entries.map(e=>e.pose.depth))],cyclicWrap:false};
  }

  function drawRadialDepth(ctx,t,feature,hits){
    const strength=windowAlpha(t,.1,duration+.5,.7)*mix(.48,.22,enter(t,futurePhase.start-1,futurePhase.start+1));
    if(strength<.005)return;
    const cx=1190+Math.sin(t*.23)*170,cy=520+Math.cos(t*.27)*65;
    const zoom=t*120,angle=-.12-t*.045;
    ctx.save();ctx.globalAlpha*=strength;
    for(let i=0;i<9;i++){
      const z=1-frac((i*230+zoom)/2100),r=70+z*z*1650;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(angle+i*.025);ctx.scale(1,.55);
      ctx.beginPath();ctx.ellipse(0,0,r,r*.8,0,0,TAU);ctx.strokeStyle=PAPER;ctx.lineWidth=.7;ctx.globalAlpha*=.14*Math.sin(Math.PI*z)**2;ctx.stroke();ctx.restore();
    }
    for(let i=0;i<12;i++){
      const a=i/12*TAU+angle,inner=290,outer=1450;
      line(ctx,cx+Math.cos(a)*inner,cy+Math.sin(a)*inner*.6,cx+Math.cos(a)*outer,cy+Math.sin(a)*outer*.6,PAPER,.55,.10);
    }
    // Small names orbit behind their large, readable foreground versions.
    for(let i=0;i<18;i++){
      if(questions[i].index===18&&t<futurePhase.start-1)continue;
      const a=i/18*TAU+angle,z=frac(i*.37+t*.045),r=440+z*1150;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.65;
      const facing=(i>=5&&i<14)?Math.PI:0;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+facing);ctx.globalAlpha*=.15*Math.sin(Math.PI*z)**2;
      text(ctx,questions[i].text,0,0,28+z*20,PAPER,Math.cos(a)<0?'right':'left',FAMILY,500);ctx.restore();
    }
    ctx.restore();
  }

  function drawQuestions(ctx,t,hits){
    const drawn=[];
    // Separate front and rear planes. Never integrate transform state across frames.
    const active=questions.filter(q=>t>=q.start-.72&&t<=q.end+.75);
    active.sort((a,b)=>b.index-a.index);
    for(const q of active){
      const length=q.end-q.start,u=(t-q.start)/length;
      const terminal=q.id===data.finalReadableQuestionId;
      const arrival=smooth((t-(q.start-.68))/(terminal?1.15:.84)),departure=terminal?0:smooth((t-(q.end-.25))/.95);
      let alpha=smooth((t-(q.start-.55))/.55)*(1-smooth((t-(q.end-.05))/.62));
      if(q.index===1)alpha=clamp(t/.3+.60)*(1-smooth((t-(q.end-.05))/.62));
      if(terminal)alpha=smooth((t-(q.start-.55))/.85);
      const direction=q.index%2?-1:1;
      const cue=characterCue((q.start+q.end)/2),front=!!getAvatar()&&cue.layer==='foreground';
      const homeX=front?(cue.side==='left'?1140:790):960;
      const x=homeX+direction*(1-arrival)*1000-direction*departure*1150;
      const y=544+(1-arrival)*250+departure*110+Math.sin(t*.62)*(terminal?6:17);
      const scale=mix(.66,front?.81:1,arrival)*(1+departure*.48);
      const angle=direction*((1-arrival)*.25-departure*.32)+Math.sin(t*.32)*(terminal?.004:.018);
      ctx.save();ctx.globalAlpha*=alpha;
      space.drawPlane(ctx,questionPlate(q),{x,y,width:1780*scale,height:700*scale,
        depth:1100+(1-arrival)*850-departure*420,
        yaw:direction*((1-arrival)*.82-departure*.90)+Math.sin(t*.32)*(terminal?.022:.13),
        pitch:Math.cos(t*.23)*(terminal?.012:.07)+(1-arrival)*.22,roll:angle,opacity:1});
      ctx.restore();
      if(alpha>.8&&u>=0&&(u<1||terminal))drawn.push(q.id);
    }
    return drawn;
  }

  function drawFinal(ctx,t,hits){
    if(t<titlePhase.start-.5||t>titlePhase.end+.35)return false;
    const arrival=smooth((t-(titlePhase.start-.4))/1.65),glide=smooth((t-(titlePhase.start+1.25))/3.4);
    const hasAvatar=!!getAvatar();
    ctx.save();ctx.globalAlpha*=smooth((t-(titlePhase.start-.4))/.58)*(1-smooth((t-(titlePhase.end-.6))/.95));ctx.translate(hasAvatar?1170:960,540);
    ctx.rotate((1-arrival)*-.07);
    const scale=mix(.55,hasAvatar?.86:.98,arrival)*(1+glide*.035);ctx.scale(scale,scale);
    // The rim passes the camera before the final title owns the frame.
    ctx.save();ctx.globalAlpha*=.15*(1-arrival);ctx.strokeStyle=PAPER;ctx.lineWidth=3;
    for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(0,0,270+i*105,60+i*78,t*.17,0,TAU);ctx.stroke();}ctx.restore();
    text(ctx,'我们不能失去',0,-220,126,PAPER,'center',FAMILY,700);
    fitted(ctx,'大肥鱼',370,1550,FAMILY,900);ctx.fillStyle=PAPER;ctx.textAlign='center';ctx.fillText('大肥鱼',0,45);
    ctx.fillStyle=RED;ctx.fillRect(-706,239,1412*(.15+.85*arrival),8);
    text(ctx,'肥鱼大讲堂',0,331,39,PAPER,'center',FAMILY,500);
    ctx.restore();return true;
  }

  function draw(ctx,value,{preroll=0}={}){
    const t=clamp(Number(value)||0,-preroll,duration),source=t+data.music.visualSourceStart;
    const analysisEnd=features.at(-1)?.time_s??analysis.metadata?.duration_s??0,analysisAvailable=source<=analysisEnd;
    const feature=analysisAvailable?sampleFeature(features,source):{energy:0,low:0,mid:0,high:0,flux:0},hits=hitEnvelopes(events,source);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);
    // Camera motion is authored and continuous; audio transients never shake the frame.
    drawArt(ctx,t);
    const generatedBack=drawFishArt(ctx,t,'background');
    const avatarBack=drawCharacter(ctx,t,'background',smooth((t+.95)/.95));
    drawRadialDepth(ctx,t,feature,hits);drawOrrery(ctx,t,feature,hits);
    const codePassage=drawCodePassage(ctx,t);
    drawTypeBurst(ctx,t,hits);
    // Persistent framing lines travel through the typography rather than cutting scenes.
    const direction=-.23+Math.sin(t*.12)*.09;
    ctx.save();ctx.translate(960,540);ctx.rotate(direction);line(ctx,-1600,0,1600,0,PAPER,.8,.10);line(ctx,0,-1200,0,1200,PAPER,.8,.10);ctx.restore();
    const visibleQuestions=drawQuestions(ctx,t,hits);
    const creditsAudit=textCredits.draw(ctx,t);
    drawFinal(ctx,t,hits);
    const avatarFront=drawCharacter(ctx,t,'foreground');
    const generatedFront=drawFishArt(ctx,t,'foreground');
    drawPresenter(ctx,t,generatedFront);
    ctx.restore();
    // The grain is stationary in image coordinates so pause/seek are deterministic.
    ctx.save();ctx.globalAlpha=.11;ctx.globalCompositeOperation='screen';ctx.drawImage(grain,0,0,W,H);ctx.restore();
    const chapter=t<orbitPhase.start?'questions':t<phases.books.start?'orbital-passage':t<phases.literature1.start?'books':t<phases.referenceBridge.start?'literature':t<phases.videos.start?'reference-bridge':t<phases.credits.start?'video-references':t<phases.statistics.start?'credits':t<phases.music.start?'statistics':t<phases.thanks.start?'music':t<titlePhase.start?'thanks':t<futurePhase.start?'final-title':'future-question';
    const audit={version:data.version,time:t,duration,sourceMusicTime:source,musicTimeline:data.music.timeline,chapter,visibleQuestions,energy:feature.energy,
      hits,questionsTotal:questions.length,musicPlaceholders:data.musicSlots.filter(v=>v.placeholder).length,
      thanksNames:data.thanksSlots.map(slot=>slot.value),thanksPlaceholders:data.thanksSlots.filter(slot=>slot.placeholder).length,avatar:avatarFront||avatarBack,
      generatedAssets:[workshop?'workshop':null,archive?'archive':null,fishPortrait?'fish-portrait':null,fishFull?'fish-full':null].filter(Boolean),
      generatedCharacter:generatedFront||generatedBack,
      credits:creditsAudit,
      codePassage,analysisCoverage:{end:analysisEnd,available:analysisAvailable},
      finalQuestion:chapter==='future-question'?{id:data.finalReadableQuestionId,text:questions.find(q=>q.id===data.finalReadableQuestionId)?.text,heldAtEnd:t>=duration-.01}:null,
      tokenDisplay:data.statistics?.[0]?.value,
      motionPolicy:{frameShake:false,audioGeometryImpulse:false,cardPanels:false},
      deterministic:true,renderLayer:space.available?'webgl2-perspective-planes+canvas2d':'canvas2d-fallback'};
    if(ctx.canvas?.dataset)ctx.canvas.dataset.pv=JSON.stringify(audit);
    return audit;
  }
  return {duration,data,draw,destroy:()=>{textCredits.destroy();for(const texture of codeTextures){texture.width=1;texture.height=1;}for(const texture of plateCache.values()){texture.width=1;texture.height=1;}plateCache.clear();space.destroy();}};
}

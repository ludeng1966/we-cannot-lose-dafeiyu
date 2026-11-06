import {createHistoryOpening} from './history-opening.js?v=10';
import {startFeature,prepareFeature,pauseFeature} from './feature-handoff.js?v=14';
const W=1920,H=1080,START=4.5,MUSIC_END=22.5,BLACK_END=22.9,END=23.7;
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d',{alpha:false}),$=s=>document.querySelector(s),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
let renderer,safety,ready=false,playing=false,t=0,base=0,anchor=0,ac,buffer,source,gain,master,lastScene=-1,featureStarted=false;
const fmt=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${(n%60).toFixed(2).padStart(5,'0')}`;
const audioGain=mt=>mt<0||mt>=18?0:1-clamp((mt-16)/2);
function text(s,y,size,color='#eee',family='"PV Serif",SimSun,serif',weight=500,x=960){ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(s,x,y);}
function safetyCard(at){
 renderer.drawBackdrop(ctx,at);
 ctx.save();ctx.fillStyle='rgba(3,5,8,.28)';ctx.fillRect(80,30,1760,1020);
 text('声 明',105,72);text('ANNOUNCEMENT',205,79,'#e4e6e9','Georgia,"Times New Roman",serif',400);
 if(safety){ctx.globalCompositeOperation='source-over';ctx.drawImage(safety,270,220,250,255,450,275,335,342);ctx.drawImage(safety,665,235,370,230,1000,300,530,330);}
 text('我完全支持社会主义，支持中国共产党的领导，视频',727,49);
 text('并无不符合社会主义核心价值观的内容，请审核明辨。',802,49);
 text('I fully support socialism and the leadership of the CPC.There is nothing',901,35,'#bfc3ca','Georgia,"Times New Roman",serif',400);
 text('in the video that does not conform to the socialist core values.',951,35,'#bfc3ca','Georgia,"Times New Roman",serif',400);
 ctx.restore();
}
function draw(value){
 t=clamp(value,0,END);ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);let scene=0;
 if(t<START||t>=MUSIC_END)delete canvas.dataset.pv;
 if(t<2){if(renderer)safetyCard(t);}
 else if(t<START){renderer?.drawBackdrop(ctx,t);ctx.fillStyle='rgba(2,4,6,.28)';ctx.fillRect(70,120,1780,840);
  text('本视频旨在批判外国资本主义，',390,65);text('内容所指的某公司为西方垄断资本公司',505,65);text('本作宣扬社会主义内核',740,91);scene=1;
 }else if(t<MUSIC_END){const mt=t-START;renderer?.draw(ctx,mt);scene=2+Math.min(7,Math.floor(mt/2));}
 else if(t<BLACK_END){scene=10;}
 else{const a=smooth((t-BLACK_END)/.28);ctx.globalAlpha=a;text('然而',548,330,'#b0081e','"PV Serif",SimSun,serif',900);ctx.globalAlpha=1;scene=11;}
 $('#seek').value=t;$('#time').textContent=`${fmt(t)} / ${fmt(END)}`;
 if(scene!==lastScene){document.querySelectorAll('#chapters button').forEach((b,j)=>b.classList.toggle('active',j===scene));lastScene=scene;}
 Object.assign(canvas.dataset,{time:t.toFixed(4),musicTime:Math.max(0,t-START).toFixed(4),scene,playing:String(playing),audioGain:audioGain(t-START).toFixed(4),live2d:'false'});
}
function stop(){if(source){try{source.stop();}catch{}source.disconnect();source=null;}if(gain){gain.disconnect();gain=null;}}
function schedule(at){stop();if(at>=MUSIC_END)return;const now=ac.currentTime,off=Math.max(0,at-START);source=ac.createBufferSource();source.buffer=buffer;gain=ac.createGain();source.connect(gain);gain.connect(master);gain.gain.setValueAtTime(audioGain(off),now);if(at<START+16)gain.gain.setValueAtTime(1,now+START+16-at);gain.gain.linearRampToValueAtTime(0,now+Math.max(0,MUSIC_END-at));source.start(now+Math.max(0,START-at),off,18-off);}
const position=()=>playing?clamp(base+ac.currentTime-anchor,0,END):t;
function pause(){const at=position();playing=false;stop();draw(at);$('#play').textContent='继续播放';$('#play').setAttribute('aria-pressed','false');}
async function play(){if(!ready)return;if(playing){pause();return;}try{if(!ac){ac=new AudioContext();master=ac.createGain();master.gain.value=Number($('#volume').value);master.connect(ac.destination);buffer=await ac.decodeAudioData(await(await fetch('assets/music-first18.wav')).arrayBuffer());}await ac.resume();if(t>=END)t=0;base=t;anchor=ac.currentTime;schedule(t);playing=true;$('#play').textContent='暂停';$('#play').setAttribute('aria-pressed','true');}catch(e){$('#status').textContent=e.message;console.error(e);}}
function stageView(film){$('.player').hidden=film;$('#feature-host').hidden=!film;for(const selector of ['.transport','.feature-controls','#seek','#chapters','#saveFrame'])$(selector).hidden=film;$('#backToIntro').hidden=!film;}
function leaveFeature(){if(featureStarted){pauseFeature();stageView(false);featureStarted=false;}}
function seek(at){leaveFeature();const was=playing;if(was)pause();draw(at);if(was&&at<END)play();}
async function feature(){if(featureStarted)return;featureStarted=true;playing=false;stop();$('#status').textContent='正在衔接现有正片…';
 try{await startFeature({container:$('#feature-host'),onReady:()=>{stageView(true);$('#status').textContent='正片 · 原配音与字幕时序';},onError:e=>{$('#status').textContent='正片载入失败：'+String(e);}});}
 catch(e){$('#status').textContent='正片载入失败：'+e.message;featureStarted=false;}
}
function loop(){if(playing){draw(position());if(t>=END){playing=false;stop();canvas.dataset.playing='false';$('#play').textContent='重新播放';$('#play').setAttribute('aria-pressed','false');if($('#continueFeature').checked)feature();}}requestAnimationFrame(loop);}
async function init(){try{
 safety=new Image();safety.src='assets/safety-original.jpg';await safety.decode();
 renderer=await createHistoryOpening();const chapters=[['安全声明',0,'静音 2s'],['立场说明',2,'静音 2.5s'],...renderer.data.questions.map(q=>[q.name,START+q.start,q.date||'标题']),['黑幕',MUSIC_END,'静音'],['然而',BLACK_END,'正片前']];
 for(const [s,at,date] of chapters){const b=document.createElement('button');b.innerHTML=`<span>${date}</span><strong>${s}</strong>`;b.setAttribute('aria-label','跳转到'+s);b.onclick=()=>seek(at+(at>=START&&at<MUSIC_END&&!playing?.8:at===BLACK_END?.5:0));$('#chapters').append(b);}
 for(const q of renderer.data.questions){const li=document.createElement('li');li.textContent=`${q.date} · ${q.text}。画面证据：${q.evidence}`;$('#sourceList').append(li);}
 for(const source of renderer.data.growthSources){const li=document.createElement('li');li.textContent=source;$('#sourceList').append(li);}
 ready=true;$('#loading').classList.add('hidden');for(const id of ['play','restart','music'])$('#'+id).disabled=false;$('#status').textContent='2s声明 + 2.5s立场 · 音乐18s · 黑幕与“然而”后进入正片';draw(Number(new URLSearchParams(location.search).get('t'))||0);loop();prepareFeature({container:$('#feature-host')}).catch(e=>console.warn('正片可在开场结束后重试载入',e.message));
 }catch(e){$('#loading').textContent='素材载入失败：'+e.message;console.error(e);}}
$('#play').onclick=()=>{leaveFeature();play();};$('#restart').onclick=()=>{leaveFeature();pause();draw(0);play();};$('#music').onclick=()=>{leaveFeature();pause();draw(START);play();};$('#seek').oninput=e=>seek(Number(e.target.value));$('#volume').oninput=e=>{if(master)master.gain.value=Number(e.target.value);};$('#full').onclick=()=>document.querySelector('.player').requestFullscreen();$('#showSources').onclick=()=>$('#sources').showModal();$('#closeSources').onclick=()=>$('#sources').close();$('#startFeature').onclick=feature;
$('#saveFrame').onclick=async()=>{if(playing)pause();try{const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')),r=await fetch('/__save_frame',{method:'POST',headers:{'X-Frame-Time':t.toFixed(2)},body:blob});if(!r.ok)throw Error('保存失败');$('#status').textContent='画面已保存：'+await r.text();}catch(e){$('#status').textContent=e.message;}};
$('#backToIntro').onclick=()=>{leaveFeature();pause();draw(0);};
document.addEventListener('keydown',e=>{if(e.target.matches('input,button')||$('#sources').open)return;if(e.code==='Space'){e.preventDefault();play();}if(e.code==='ArrowRight')seek(position()+.5);if(e.code==='ArrowLeft')seek(position()-.5);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
window.intro={drawAt:seek,pause,play,get state(){return{time:position(),playing,ready,total:END,musicStart:START,fade:[16,18],featureStarted};}};init();

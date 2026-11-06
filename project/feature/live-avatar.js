(()=>{
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,k)=>a+(b-a)*k;
 function ease(x){x=clamp(x);return x*x*(3-2*x);}
 function track(t,keys){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(t<=b[0])return mix(a[1],b[1],ease((t-a[0])/(b[0]-a[0])));}return keys[keys.length-1][1];}
 const moods={
  neutral:{eye:1.02,form:.24,brow:.08,browAngle:0,smile:.03,inner:0,tilt:-.35},
  concerned:{eye:.96,form:-.20,brow:.22,browAngle:-.18,smile:0,inner:.12,tilt:.5},
  firm:{eye:.98,form:.10,brow:-.08,browAngle:.12,smile:0,inner:0,tilt:-.45},
  smile:{eye:.97,form:.56,brow:.14,browAngle:.025,smile:.16,inner:0,tilt:-.2}
 };
 moods.natural=moods.neutral;moods.worried=moods.concerned;moods.determined=moods.firm;moods.softSmile=moods.smile;
 const arms=['Movement1','Movement2','Movement3','Param37','Param38','Param40','Param36','Param39','Param41','Param42','Param43','Param62','Param59','Param60','Param61','LArm','LForearm','LWrist','LHand','LHand2','RArm','RForearm','RWrist','RHand','RHand2'];
 const blinkTimes=[];let blinkAt=2.43;for(let i=0;blinkAt<4000;i++){blinkTimes.push(blinkAt);if(i%11===6)blinkTimes.push(blinkAt+.34);blinkAt+=[4.6,5.4,3.9,6.1,4.8,5.7][i%6];}
 function lid(t,offset=0){t-=offset;let b=1;for(let i=0;i<blinkTimes.length;i++){let dt=t-blinkTimes[i];if(dt<-.04)break;if(dt>=0&&dt<.19)b=Math.min(b,dt<.06?1-ease(dt/.06):ease((dt-.06)/.13));}return b;}
 function emotion(t,o){const wanted=moods[o.mood]||moods.neutral;if(!o.moodFrom)return wanted;const from=moods[o.moodFrom]||moods.neutral,k=ease((t-(o.moodAt??0))/(o.moodDuration??1.1));return Object.fromEntries(Object.keys(wanted).map(key=>[key,mix(from[key],wanted[key],k)]));}
 function gesture(t,value){const g=typeof value==='string'?{type:value,at:0}:value||{},dt=t-(g.at??g.start??0),duration=g.duration??4.8,p=dt/duration,amount=clamp(g.amount??1,0,1.5);if(p<0||p>1)return{x:0,y:0,z:0};
  if(g.type==='shake')return{x:track(p,[[0,0],[.2,-4.5],[.31,-4.5],[.64,3.8],[.76,3.8],[1,0]])*amount,y:0,z:track(p,[[0,0],[.25,.38],[.68,-.28],[1,0]])*amount};
  if(g.type==='nod')return{x:0,y:track(p,[[0,0],[.4,-2.8],[.61,-2.8],[1,0]])*amount,z:0};
  if(g.type==='turn')return{x:track(p,[[0,0],[.42,g.angle??5],[.76,g.angle??5],[1,0]])*amount,y:0,z:0};
  return{x:0,y:0,z:0};
 }
 window.createLiveAvatar=async function createLiveAvatar(options={}){
  const width=Math.round(options.width??900),height=Math.round(options.height??1100);
  const app=new PIXI.Application({width,height,resolution:1,antialias:true,backgroundAlpha:0,preserveDrawingBuffer:true,autoStart:false,sharedTicker:false,clearBeforeRender:true});app.ticker.stop();
  const host=typeof options.container==='string'?document.querySelector(options.container):options.container;if(host)host.appendChild(app.view);
  const model=await PIXI.live2d.Live2DModel.from(options.modelUrl||'model/preview.model3.json',{autoInteract:false,autoUpdate:false});model.autoUpdate=false;app.stage.addChild(model);
  const im=model.internalModel,core=im.coreModel,raw=core._model,ps=raw.parameters;
  im.physics=undefined;im.pose=undefined;im.eyeBlink=undefined;im.breath=undefined;im.motionManager.stopAllMotions();im.motionManager.update=()=>false;
  if(im.motionManager.expressionManager)im.motionManager.expressionManager.update=()=>false;
  im.renderer._clippingManager.setClippingMaskBufferSize(2048);
  const parameters=ps.ids.map((id,i)=>({id,index:i,min:ps.minimumValues[i],max:ps.maximumValues[i],default:ps.defaultValues[i]}));const byId=new Map(parameters.map(p=>[p.id,p]));
  function set(id,value){const p=byId.get(id);if(p)core.setParameterValueByIndex(p.index,clamp(value,p.min,p.max));}
  const filter=new PIXI.Filter(undefined,'varying vec2 vTextureCoord;uniform sampler2D uSampler;void main(){vec4 c=texture2D(uSampler,vTextureCoord);if(c.a<.001){gl_FragColor=c;return;}vec3 s=c.rgb/c.a;vec3 d=vec3(1.0)-vec3(.17647,.28627,.55686);float t=clamp(dot(vec3(1.0)-s,d)/dot(d,d),0.0,1.0);gl_FragColor=vec4(vec3(1.0-t)*c.a,c.a);}');filter.resolution=1;model.filters=options.monochrome===false?null:[filter];model.filterArea=new PIXI.Rectangle(0,0,width,height);
  // Framing changes the native model camera, never a crop of an old sampled frame.
  const profiles={full:1,waist:3.05,close:4.1},initialFraming=options.framing||'waist';let framingValues;
  function placement(name,zoomOverride){name=Object.hasOwn(profiles,name)?name:'waist';const zoom=zoomOverride??(name===initialFraming&&options.zoom!=null?options.zoom:profiles[name]);
   if(name==='full'){const scale=Math.min(width/im.width,height/im.height)*.94*zoom;return{scale,x:(width-im.width*scale)/2,y:(height-im.height*scale)/2};}
   const focus=clamp((zoom-2.5)/1.2),scale=height/im.height*.94*zoom,point=im.localTransform.apply(im.centeringTransform.apply(new PIXI.Point(0,-(.30+.31*focus))));return{scale,x:width/2-point.x*scale,y:height*(.62-.10*focus)-point.y*scale};
  }
  function frameAt(t,o){const name=o.framing||initialFraming,to=placement(name,o.zoom);let p=to;
   // Absolute-time transitions remain identical after pause or backward seek.
   if(o.framingFrom){const from=placement(o.framingFrom,o.zoomFrom),k=ease((t-(o.framingAt??0))/(o.framingDuration??1.5));p={scale:mix(from.scale,to.scale,k),x:mix(from.x,to.x,k),y:mix(from.y,to.y,k)};}
   model.anchor.set(0);model.scale.set(p.scale);model.position.set(p.x,p.y);framingValues={name,...p};
  }
  frameAt(0,{});
  let currentTime=0,currentOptions={},lastValues={};
  function apply(){const t=currentTime,o=currentOptions,mt=o.motionTime??t,p=emotion(t,o),g=gesture(t,o.gesture),lookX=clamp(o.lookX??0,-1,1),lookY=clamp(o.lookY??0,-1,1),energy=clamp(o.energy??0),breath=.5+.5*Math.sin(mt*Math.PI*2/5.65-.35),ears=o.ears!==false?1:0;
   for(const q of parameters)core.setParameterValueByIndex(q.index,q.default);
   for(const id of arms)set(id,0);set('key2',0);set('key6',0);set('RCry',0);set('LCry',0);
   const values={ParamAngleX:lookX*5.4+g.x,ParamAngleY:lookY*2.8+g.y,ParamAngleZ:p.tilt+g.z,ParamBodyAngleX:0,ParamBodyAngleZ:0,
    ParamBreath:breath,ShoulderY:.30+1.8*breath,ParamBodyAngleY:-.30+.80*breath,
    ParamEyeBallX:lookX*.22,ParamEyeBallY:lookY*.15,ParamEyeLOpen:p.eye*.99*lid(mt),ParamEyeROpen:p.eye*lid(mt,.012),
    ParamBrowLY:p.brow,ParamBrowRY:p.brow,ParamBrowLAngle:p.browAngle,ParamBrowRAngle:p.browAngle,BrowInnerUp:p.inner,EyeSmile:p.smile,
    ParamMouthOpenY:.012+Math.pow(energy,.76)*.47,ParamMouthForm:p.form,MouthPuckerWiden:.19,MouthSmile_L:Math.max(0,p.form)*.14,MouthSmile_R:Math.max(0,p.form)*.19,
    LEar1:ears*(.10*Math.sin(mt*.92)+.017*Math.sin(mt*.43)),LEar2:ears*.035*Math.sin(mt*.92-.7),LEar3:ears*.018*Math.sin(mt*.92-1.2),
    REar1:ears*(.091*Math.sin(mt*.83+.65)+.015*Math.sin(mt*.37+1)),REar2:ears*.032*Math.sin(mt*.83-.12),REar3:ears*.016*Math.sin(mt*.83-.64)};
   for(const[id,v]of Object.entries(values))set(id,v);lastValues=values;
  }
  im.on('beforeModelUpdate',apply);
  const api={canvas:app.view,model,app,parameters,width,height,draw(t,o={}){currentTime=Number.isFinite(t)?Math.max(0,t):0;currentOptions=o;frameAt(currentTime,o);im.update(0,currentTime*1000);app.renderer.render(app.stage);return app.view;},get values(){return{...lastValues}},get framing(){return{...framingValues}},destroy(){model.destroy({children:true,texture:true,baseTexture:true});app.destroy(true,{children:true});}};
  api.draw(0);return api;
 };
})();

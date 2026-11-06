/* V19 projected image planes. One persistent WebGL2 surface, no library/network.
 * Coordinates: x/y are the projected centre in output pixels, depth is positive
 * distance along camera -Z. At depth=1100, plane width/height equal output pixels.
 * Rotations are local yaw -> pitch -> clockwise screen roll, all in radians.
 * Call far planes before near planes when their Canvas composites overlap.
 * Static image/canvas textures cache by identity; pass pose.dynamic=true after
 * changing a canvas. Fallback is affine Canvas: depth scale + roll, no yaw/pitch.
 * drawPlanes flattens entries in supplied order and composites the surface once;
 * targetCtx.globalAlpha therefore applies to the resulting group. Put individual
 * sprite opacity in each pose. drawPlane is the single-entry compatibility API.
 */
const FOCAL=1100,NEAR=10,FAR=30000;
const numeric=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,a,b)=>Math.max(a,Math.min(b,value));
const IMAGE_TAGS=new Set(['[object HTMLCanvasElement]','[object OffscreenCanvas]',
  '[object HTMLImageElement]','[object HTMLVideoElement]','[object ImageBitmap]',
  '[object SVGImageElement]','[object VideoFrame]']);
const VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
uniform vec2 uViewport;
uniform vec2 uPlaneSize;
uniform vec3 uCenter;
uniform vec3 uAngles;
uniform vec2 uClip;
out vec2 vUV;
void main(){
  vUV=aPosition+vec2(0.5);
  vec3 point=vec3(aPosition.x*uPlaneSize.x,-aPosition.y*uPlaneSize.y,0.0);
  float cy=cos(uAngles.x),sy=sin(uAngles.x);
  float cp=cos(uAngles.y),sp=sin(uAngles.y);
  float cr=cos(-uAngles.z),sr=sin(-uAngles.z);
  mat3 yaw=mat3(cy,0.0,-sy,0.0,1.0,0.0,sy,0.0,cy);
  mat3 pitch=mat3(1.0,0.0,0.0,0.0,cp,sp,0.0,-sp,cp);
  mat3 roll=mat3(cr,sr,0.0,-sr,cr,0.0,0.0,0.0,1.0);
  point=roll*pitch*yaw*point+uCenter;
  float nearClip=uClip.x,farClip=uClip.y;
  float a=-(farClip+nearClip)/(farClip-nearClip);
  float b=-2.0*farClip*nearClip/(farClip-nearClip);
  gl_Position=vec4(2.0*1100.0*point.x/uViewport.x,
                   2.0*1100.0*point.y/uViewport.y,
                   a*point.z+b,-point.z);
}`;
const FRAGMENT=`#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform float uOpacity;
in vec2 vUV;
out vec4 outColor;
void main(){
  // UNPACK_PREMULTIPLY_ALPHA_WEBGL supplies premultiplied source colour.
  outColor=texture(uTexture,vUV)*uOpacity;
}`;

export function createPVSpace({width=1920,height=1080}={}){
  width=Math.max(1,Math.round(numeric(width,1920)));height=Math.max(1,Math.round(numeric(height,1080)));
  const surface=document.createElement('canvas');surface.width=width;surface.height=height;
  let gl=null,program=null,vao=null,vertexBuffer=null,healthy=false,destroyed=false,reason='';
  const cache=new WeakMap(),textures=new Set();let uniforms,maxTextureSize=0,fallbackSurface=null,fallbackCtx=null;
  function shader(kind,source){
    const item=gl.createShader(kind);if(!item)throw Error('PV WebGL shader allocation failed');
    gl.shaderSource(item,source);gl.compileShader(item);
    if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(item);gl.deleteShader(item);throw Error('PV shader compile: '+error);}
    return item;
  }
  try{
    gl=surface.getContext('webgl2',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,
      antialias:true,depth:false,stencil:false,powerPreference:'high-performance'});
    if(!gl)throw Error('WebGL2 is unavailable');
    const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,FRAGMENT);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('PV shader link: '+gl.getProgramInfoLog(program));
    vao=gl.createVertexArray();gl.bindVertexArray(vao);vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    uniforms=Object.fromEntries(['uViewport','uPlaneSize','uCenter','uAngles','uClip','uTexture','uOpacity'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.useProgram(program);gl.uniform1i(uniforms.uTexture,0);gl.uniform2f(uniforms.uViewport,width,height);gl.uniform2f(uniforms.uClip,NEAR,FAR);
    gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.DITHER);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);healthy=true;
    surface.addEventListener('webglcontextlost',()=>{healthy=false;reason='WebGL context lost; using affine Canvas fallback';});
  }catch(error){reason=error?.message||String(error);healthy=false;}

  function dimensions(image){
    if(!image||!IMAGE_TAGS.has(Object.prototype.toString.call(image)))return [0,0];
    if(image.complete===false||(typeof image.readyState==='number'&&image.readyState<2))return [0,0];
    return [numeric(image.videoWidth||image.naturalWidth||image.displayWidth||image.codedWidth||image.width?.baseVal?.value||image.width,0),
      numeric(image.videoHeight||image.naturalHeight||image.displayHeight||image.codedHeight||image.height?.baseVal?.value||image.height,0)];
  }
  function normalise(entries){
    const rows=[];
    for(const entry of Array.isArray(entries)?entries:[]){
      const image=entry?.image,[iw,ih]=dimensions(image);if(iw<=0||ih<=0)continue;
      const pose=entry.pose||{},p={x:numeric(pose.x,width/2),y:numeric(pose.y,height/2),width:numeric(pose.width,iw),height:numeric(pose.height,ih),
        depth:numeric(pose.depth,FOCAL),yaw:numeric(pose.yaw,0),pitch:numeric(pose.pitch,0),roll:numeric(pose.roll,0),opacity:clamp(numeric(pose.opacity,1),0,1)};
      if(p.width<=0||p.height<=0||p.opacity<=0)continue;
      rows.push({image,iw,ih,p,dynamic:pose.dynamic===true});
    }
    return rows;
  }
  function fallbackBatch(targetCtx,rows,batchReason=reason){
    if(!fallbackSurface){fallbackSurface=document.createElement('canvas');fallbackSurface.width=width;fallbackSurface.height=height;fallbackCtx=fallbackSurface.getContext('2d');}
    if(!fallbackCtx)return {mode:'unavailable',planes:0,composites:0,reason:'Canvas fallback is unavailable'};
    const ctx=fallbackCtx;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,width,height);
    let planes=0;
    for(const {image,iw,ih,p} of rows){
      if(p.depth<=NEAR||p.depth>=FAR)continue;
      ctx.save();
      try{ctx.translate(p.x,p.y);ctx.rotate(p.roll);ctx.globalAlpha=p.opacity;
        ctx.scale(p.width/iw*FOCAL/p.depth,p.height/ih*FOCAL/p.depth);
        ctx.drawImage(image,-iw/2,-ih/2);planes++;
      }catch(_){/* An image that becomes invalid mid-batch is skipped. */}
      finally{ctx.restore();}
    }
    if(planes)targetCtx.drawImage(fallbackSurface,0,0,width,height);
    return {mode:'canvas-affine',fallback:true,planes,composites:planes?1:0,reason:batchReason};
  }
  function textureFor(image,iw,ih,dynamic){
    let row=cache.get(image);
    if(!row){
      const texture=gl.createTexture();if(!texture)throw Error('PV texture allocation failed');
      row={texture,width:0,height:0};cache.set(image,row);textures.add(texture);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    }else gl.bindTexture(gl.TEXTURE_2D,row.texture);
    if(row.width!==iw||row.height!==ih){
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,image);row.width=iw;row.height=ih;
    }else if(dynamic)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,image);
    return row;
  }
  function drawPlanes(targetCtx,entries){
    if(destroyed)return {mode:'destroyed',planes:0,composites:0,skipped:true};
    const rows=normalise(entries);
    if(!rows.length)return {mode:healthy?'webgl2':'canvas-affine',planes:0,composites:0,skipped:true};
    if(!healthy)return fallbackBatch(targetCtx,rows);
    if(rows.some(row=>row.iw>maxTextureSize||row.ih>maxTextureSize))return fallbackBatch(targetCtx,rows,'Texture exceeds WebGL maximum size');
    try{
      gl.useProgram(program);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for(const {image,iw,ih,p,dynamic} of rows){
        textureFor(image,iw,ih,dynamic);
        gl.uniform2f(uniforms.uPlaneSize,p.width,p.height);
        gl.uniform3f(uniforms.uCenter,(p.x-width/2)*p.depth/FOCAL,-(p.y-height/2)*p.depth/FOCAL,-p.depth);
        gl.uniform3f(uniforms.uAngles,p.yaw,p.pitch,p.roll);gl.uniform1f(uniforms.uOpacity,p.opacity);
        gl.drawArrays(gl.TRIANGLES,0,6);
      }
      // All quads are now in one transparent surface. The caller's transform,
      // alpha and composition apply once, with no target state mutation.
      targetCtx.drawImage(surface,0,0,width,height);
      return {mode:'webgl2',planes:rows.length,composites:1};
    }catch(error){healthy=false;reason=error?.message||String(error);return fallbackBatch(targetCtx,rows);}
  }
  function drawPlane(targetCtx,image,pose={}){
    const audit=drawPlanes(targetCtx,[{image,pose}]);
    return {...audit,depth:numeric(pose?.depth,FOCAL),dynamic:pose?.dynamic===true};
  }
  function destroy(){
    if(destroyed)return;destroyed=true;healthy=false;
    if(gl){for(const texture of textures)gl.deleteTexture(texture);if(vertexBuffer)gl.deleteBuffer(vertexBuffer);
      if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);}
    textures.clear();surface.width=1;surface.height=1;
    if(fallbackSurface){fallbackSurface.width=1;fallbackSurface.height=1;fallbackCtx=null;fallbackSurface=null;}
  }
  return {drawPlane,drawPlanes,get available(){return healthy&&!destroyed;},get reason(){return reason;},destroy};
}

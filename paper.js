/* Procedural paper with a spreading wet, translucent edge. No bitmap or network dependency. */
(()=>{
'use strict';
const cover=document.querySelector('#paper-cover'),canvas=document.querySelector('#paper-canvas'),enter=document.querySelector('#paper-enter');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const behind=[...document.querySelectorAll('.site-header,main,footer,.skip')];
let gl,program,uniforms={},width=0,height=0,opening=false,raf=0,startedAt=0,center=[0,0],reach=0,cycle=0;
const vertex='attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}';
const fragment=`
precision highp float;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uProgress;
uniform float uTime;
uniform float uReach;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.07+vec2(17.1,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/uResolution;
 vec2 p=gl_FragCoord.xy/uResolution.y;
 float cloud=fbm(p*3.4);
 float grain=hash(gl_FragCoord.xy);
 float fiber=noise(vec2(gl_FragCoord.x*.75,gl_FragCoord.y*.12));
 float age=pow(1.-16.*uv.x*(1.-uv.x)*uv.y*(1.-uv.y),1.3);
 vec3 paper=vec3(.919,.865,.744)+(cloud-.5)*.066+(grain-.5)*.025+(fiber-.5)*.015-age*vec3(.041,.043,.048);
 float alpha=1.;
 if(uProgress>=0.){
  vec2 delta=p-uCenter/uResolution.y;
  float angle=atan(delta.y,delta.x);
  float flow=fbm(p*5.1+vec2(uTime*.025,-uTime*.018));
  float irregular=(flow-.47)*.155+sin(angle*9.+cloud*5.)*.007;
  float radius=mix(-.16,uReach+.25,uProgress);
  float front=length(delta)+irregular-radius;
  float wet=(1.-smoothstep(.015,.16,front))*smoothstep(-.08,.015,front);
  float halo=(1.-smoothstep(.13,.23,front))*smoothstep(.02,.11,front);
  paper=mix(paper,paper*vec3(.86,.88,.91),wet*.7);
  paper+=halo*.014;
  alpha=smoothstep(-.028,.032,front);
  alpha*=1.-wet*.34;
  alpha*=1.-smoothstep(.94,1.,uProgress);
 }
 gl_FragColor=vec4(paper*alpha,alpha);
}`;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Paper shader unavailable');return s;}
function setup(){try{
 gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true});if(!gl)return false;
 const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
 program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Paper program unavailable');
 gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const attr=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
 for(const key of ['uResolution','uCenter','uProgress','uTime','uReach'])uniforms[key]=gl.getUniformLocation(program,key);
 resize();draw(-1,0);cover.classList.add('has-canvas');return true;
 }catch{gl=null;canvas.style.display='none';return false;}}
function resize(){const scale=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1600000/(innerWidth*innerHeight)));width=canvas.width=Math.round(innerWidth*scale);height=canvas.height=Math.round(innerHeight*scale);if(gl){gl.viewport(0,0,width,height);gl.uniform2f(uniforms.uResolution,width,height);if(!opening)draw(-1,0);}}
function draw(progress,time){if(!gl)return;gl.uniform2f(uniforms.uCenter,center[0],center[1]);gl.uniform1f(uniforms.uProgress,progress);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uReach,reach);gl.drawArrays(gl.TRIANGLES,0,6);}
function lock(value){behind.forEach(n=>n.inert=value);document.body.classList.toggle('paper-entered',!value);}
function finish(){cycle++;cancelAnimationFrame(raf);cover.classList.add('finished');cover.hidden=true;lock(false);opening=false;enter.disabled=false;cover.style.opacity='';cover.style.maskImage='';cover.style.webkitMaskImage='';const heading=document.querySelector('.about-panel h1');heading.tabIndex=-1;heading.focus({preventScroll:true});}
function open(event){if(opening||cover.hidden)return;opening=true;const ticket=++cycle;enter.disabled=true;cover.classList.add('is-opening');
 const hasPoint=event&&event.detail!==0;const x=hasPoint?event.clientX:innerWidth/2,y=hasPoint?event.clientY:innerHeight/2;
 center=[x*width/innerWidth,(innerHeight-y)*height/innerHeight];
 reach=Math.max(Math.hypot(center[0],center[1]),Math.hypot(width-center[0],center[1]),Math.hypot(center[0],height-center[1]),Math.hypot(width-center[0],height-center[1]))/height;
 startedAt=performance.now();const duration=reduced.matches?140:1950;
 function frame(now){const t=Math.min(1,(now-startedAt)/duration);const ease=t*t*(3.-2.*t);
  if(gl&&!reduced.matches){draw(ease,(now-startedAt)/1000);}else{
   if(reduced.matches){cover.style.opacity=String(1-t);}else{
    const r=ease*(Math.hypot(innerWidth,innerHeight)+180);
    const mask=`radial-gradient(circle at ${x}px ${y}px,transparent ${Math.max(0,r-65)}px,#000 ${r+20}px)`;
    cover.style.maskImage=mask;cover.style.webkitMaskImage=mask;if(t>.93)cover.style.opacity=String((1-t)/.07);
   }
  }
  if(t<1)raf=requestAnimationFrame(frame);else finish();
 }raf=requestAnimationFrame(frame);
 // Always restore the page even if rendering is interrupted or unavailable.
 setTimeout(()=>{if(opening&&ticket===cycle)finish();},duration+500);
}
function replay(){cycle++;cancelAnimationFrame(raf);opening=false;window.scrollTo({top:0,behavior:'instant'});cover.classList.remove('finished','is-opening');cover.hidden=false;enter.disabled=false;cover.style.opacity='';lock(true);resize();draw(-1,0);enter.focus({preventScroll:true});}
cover.hidden=false;lock(true);setup();enter.addEventListener('click',open);enter.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gl=null;cover.classList.remove('has-canvas');canvas.style.display='none';if(opening)finish();});
window.addEventListener('resize',()=>{if(opening){finish();return;}if(!cover.hidden)resize();},{passive:true});
document.querySelector('#replay-paper').addEventListener('click',replay);
})();

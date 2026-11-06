import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/GLTFLoader.js';

// Login screen layout; must match dev-render-only-src/login_plate.py.
export const PLAYER={x:740/1920,y:870/1040,width:700/1920,height:89/1040};
export const TILES=[];
export const ENTER={x:810/1920,y:610/1040,width:300/1920,height:84/1040};
export async function createSignal({renderer,screen,environment,signal}){
  const [buffer,plateBuffer,servicesBuffer]=await Promise.all(['sigz-signal.glb','login-background.webp','services-background.webp'].map(name=>fetch('/vybe/assets/'+name+'?v=ls-20261001d',{signal}).then(r=>{if(!r.ok)throw Error('Player art unavailable');return name.endsWith('.glb')?r.arrayBuffer():r.blob()})));
  const gltf=await new GLTFLoader().parseAsync(buffer,new URL('/vybe/assets/',location.href).href);
  const resources=new Set();gltf.scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material)});
  const url=URL.createObjectURL(plateBuffer);let plate;
  try{plate=await new THREE.TextureLoader().loadAsync(url)}finally{URL.revokeObjectURL(url)}
  resources.add(plate);if(signal.aborted){resources.forEach(r=>r.dispose());throw new DOMException('Aborted','AbortError')}
  plate.flipY=false;plate.colorSpace=THREE.SRGBColorSpace;plate.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const servicesUrl=URL.createObjectURL(servicesBuffer);let services;
  try{services=await new THREE.TextureLoader().loadAsync(servicesUrl)}finally{URL.revokeObjectURL(servicesUrl)}
  resources.add(services);if(signal.aborted){resources.forEach(r=>r.dispose());throw new DOMException('Aborted','AbortError')}
  services.flipY=false;services.colorSpace=THREE.SRGBColorSpace;services.anisotropy=plate.anisotropy;
  const tileAmounts=new Float32Array(5);let hoveredTile=-1,overEnter=false;const enterHover={value:0};
  gltf.scene.updateMatrixWorld(true);const fins=[];gltf.scene.traverse(o=>{if(Number.isInteger(o.userData.index))fins.push(o)});fins.sort((a,b)=>a.userData.index-b.userData.index);
  if(fins.length!==96){resources.forEach(r=>r.dispose());throw Error('Incomplete signal sculpture')}
  const scene=new THREE.Scene();scene.environment=environment;scene.environmentIntensity=.7;
  const camera=new THREE.OrthographicCamera(-3.05,3.05,1.45,-1.45,.1,30);camera.position.z=10;
  const assembly=new THREE.Group();scene.add(assembly);
  const target=new THREE.WebGLRenderTarget(1536,256,{depthBuffer:true,type:THREE.HalfFloatType});target.texture.colorSpace=THREE.LinearSRGBColorSpace;
  const clockUniform={value:0};const progressUniform={value:138/429};
  const batches=fins[0].children.filter(o=>o.isMesh).map(child=>{
    const geometry=child.geometry.clone(),material=child.material.clone();resources.add(geometry);resources.add(material);
    const heat=new THREE.InstancedBufferAttribute(new Float32Array(96),1);heat.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('signalHeat',heat);
    geometry.setAttribute('signalPhase',new THREE.InstancedBufferAttribute(Float32Array.from(fins,(_,i)=>i/95),1));
    material.envMapIntensity=.3;material.roughness=.5;material.metalness=.25;
    if(material.name.includes('Amber'))material.emissiveIntensity=.08;
    material.onBeforeCompile=shader=>{
      shader.uniforms.signalClock=clockUniform;shader.uniforms.signalProgress=progressUniform;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float signalPhase; attribute float signalHeat; varying float vSignalPhase; varying float vSignalHeat;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSignalPhase=signalPhase; vSignalHeat=signalHeat;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        uniform float signalClock; uniform float signalProgress;
        varying float vSignalPhase; varying float vSignalHeat;
        vec3 signalRainbow(float hue){
          vec3 bands=abs(fract(hue+vec3(0.,2./3.,1./3.))*6.-3.);
          return mix(vec3(.025),vec3(1.),clamp(bands-1.,0.,1.));
        }`).replace('#include <color_fragment>',`#include <color_fragment>
        float rainbowAmount=smoothstep(.015,.42,vSignalHeat);
        vec3 rainbow=signalRainbow(vSignalPhase*3.-signalClock*.12);
        vec3 restingColor=vSignalPhase<=signalProgress?vec3(.8,.30,.055):vec3(.12,.17,.21);
        diffuseColor.rgb=mix(restingColor,rainbow*.75,rainbowAmount);
      `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float d=abs(fract(vSignalPhase-signalClock*.07+.5)-.5);
        vec3 restingLight=vSignalPhase<=signalProgress?vec3(.60,.16,.015):vec3(.018,.025,.035);
        restingLight+=vec3(.9,.24,.025)*exp(-pow(d/.06,2.))*.5;
        totalEmissiveRadiance=mix(restingLight,rainbow*1.15,rainbowAmount);
      `);
    };
    material.customProgramCacheKey=()=> 'sigz-player-rainbow-v1';
    const mesh=new THREE.InstancedMesh(geometry,material,96);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;assembly.add(mesh);return {mesh,heat,childMatrix:child.matrix.clone()};
  });
  scene.add(new THREE.HemisphereLight(0xcaddec,0x211309,1));
  for(const [color,intensity,x,y,z] of [[0xffd7a7,3,-3,4,5],[0xc0dfff,2,4,1,3]]){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l)}
  const dashboard=screen.material,display=dashboard.clone();resources.add(display);display.map=plate;display.emissiveMap=plate;
  display.onBeforeCompile=shader=>{
    shader.uniforms.playerTexture={value:target.texture};
    shader.uniforms.servicesBackground={value:services};shader.uniforms.tileHover={value:tileAmounts};shader.uniforms.enterHover=enterHover;
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform sampler2D playerTexture; uniform sampler2D servicesBackground;
      uniform float tileHover[5]; uniform float enterHover;
      float tileDistance(vec2 p,vec2 halfSize){
        vec2 q=abs(p)-halfSize+14.;
        return length(max(q,0.))+min(max(q.x,q.y),0.)-14.;
      }
    `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      vec2 screenPixel=vMapUv*vec2(1920.,1040.);
      for(int i=0;i<5;i++){
        float amount=tileHover[i];
        vec2 origin=vec2(295.+float(i)*307.,125.);
        vec2 center=origin+vec2(139.5,130.5);
        vec2 region=abs(screenPixel-center);
        if(amount>.0001&&region.x<153.5&&region.y<155.5){
          vec3 underneath=texture2D(servicesBackground,(screenPixel-vec2(280.,100.))/vec2(1560.,310.)).rgb;
          vec2 liftedCenter=center-vec2(0.,12.*amount);
          vec2 size=vec2(279.,261.)*(1.+.035*amount);
          float distance=tileDistance(screenPixel-liftedCenter,size*.5);
          float shadowDistance=tileDistance(screenPixel-liftedCenter-vec2(0.,10.*amount),size*.5);
          underneath*=1.-.35*amount*exp(-max(shadowDistance,0.)/7.);
          vec2 tileUV=clamp((screenPixel-liftedCenter)/size+.5,0.,1.);
          vec3 face=texture2D(map,(origin+tileUV*vec2(279.,261.))/vec2(1920.,1040.)).rgb;
          float coverage=1.-smoothstep(-.75,.75,distance);
          vec3 tileColor=mix(underneath,face*(1.+.13*amount),coverage);
          float edge=1.-smoothstep(.5,2.8,abs(distance));
          float halo=exp(-max(distance,0.)/4.)*(1.-coverage);
          tileColor+=vec3(.8,.32,.06)*amount*(edge*.65+halo*.10);
          float transition=smoothstep(0.,.08,amount);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuse*tileColor,transition);
          totalEmissiveRadiance=mix(totalEmissiveRadiance,emissive*tileColor,transition);
        }
      }
      vec2 playerUV=(vMapUv-vec2(${PLAYER.x},${PLAYER.y}))/vec2(${PLAYER.width},${PLAYER.height});
      if(all(greaterThanEqual(playerUV,vec2(0.)))&&all(lessThanEqual(playerUV,vec2(1.)))){
        vec4 art=texture2D(playerTexture,vec2(playerUV.x,1.-playerUV.y));
        diffuseColor.rgb=mix(diffuseColor.rgb,art.rgb,art.a);
        totalEmissiveRadiance=mix(totalEmissiveRadiance,art.rgb*.85,art.a);
      }
      vec2 enterSize=vec2(${ENTER.width*1920},${ENTER.height*1040});
      vec2 enterCenter=vec2(${ENTER.x*1920},${ENTER.y*1040})+enterSize*.5;
      float enterCoverage=1.-smoothstep(-.75,.75,tileDistance(screenPixel-enterCenter,enterSize*.5));
      totalEmissiveRadiance*=1.+.5*enterHover*enterCoverage;`);
  };
  display.customProgramCacheKey=()=> 'vybe-player-tiles-v1';screen.material=display;
  const offsets=new Float32Array(96),velocities=new Float32Array(96);const p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4(),childMatrix=new THREE.Matrix4();
  let clock=0,accumulator=0,pointer=-10,hover=false,dirty=true,frames=0,maxDisplacement=0,maxBarHeight=0,activeBars=0,disposed=false,motionPaused=false;
  const pulses=[];
  function contains(uv){return Boolean(uv&&uv.x>=PLAYER.x&&uv.x<=PLAYER.x+PLAYER.width&&uv.y>=PLAYER.y-.012&&uv.y<=PLAYER.y+PLAYER.height+.012)}
  function update(dt,paused){
    motionPaused=paused;
    if(!paused){clock+=Math.min(dt,.05);clockUniform.value=clock;accumulator=Math.min(accumulator+dt,.05);
      for(let i=0;i<5;i++)tileAmounts[i]=THREE.MathUtils.damp(tileAmounts[i],i===hoveredTile?1:0,12,Math.min(dt,.05));
      enterHover.value=THREE.MathUtils.damp(enterHover.value,overEnter?1:0,14,Math.min(dt,.05));
      while(pulses.length&&clock-pulses[0].time>1.5)pulses.shift();
      while(accumulator>=1/120){
        // Coupled, damped springs carry the brush energy into adjacent bars.
        for(let i=0;i<96;i++){
          const t=i/95,weight=Math.exp(-Math.pow((t-pointer)/.075,2));
          let desired=hover?weight*.8:0;
          for(const pulse of pulses){const age=clock-pulse.time;desired+=.9*Math.exp(-age*3.5)*Math.exp(-Math.pow((Math.abs(t-pulse.origin)-age*.65)/.045,2))}
          const neighbors=offsets[Math.max(0,i-1)]+offsets[Math.min(95,i+1)]-2*offsets[i];
          velocities[i]+=(150*(desired-offsets[i])+480*neighbors-21*velocities[i])/120;
        }
        for(let i=0;i<96;i++)offsets[i]=THREE.MathUtils.clamp(offsets[i]+velocities[i]/120,-.2,1.1);
        accumulator-=1/120;
      }dirty=true}
    if(!dirty)return;maxDisplacement=0;maxBarHeight=0;activeBars=0;
    for(let i=0;i<96;i++){
      const f=fins[i],offset=offsets[i];maxDisplacement=Math.max(maxDisplacement,Math.abs(offset));
      p.copy(f.position);p.z+=offset*.15;q.copy(f.quaternion);scale.copy(f.scale);
      // Add height even to quiet bars; keep the mirrored silhouette inside the panel.
      scale.y=THREE.MathUtils.clamp(scale.y*(.94+.04*Math.sin(clock*1.5-i*.21)+offset*.55)+offset*.8,.06,2.55);
      maxBarHeight=Math.max(maxBarHeight,scale.y);if(offset>.04)activeBars++;
      matrix.compose(p,q,scale);
      for(const b of batches){childMatrix.multiplyMatrices(matrix,b.childMatrix);b.mesh.setMatrixAt(i,childMatrix);b.heat.setX(i,Math.max(0,offset))}
    }
    for(const b of batches){b.mesh.instanceMatrix.needsUpdate=true;b.heat.needsUpdate=true}
    const previous=renderer.getRenderTarget(),color=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
    try{renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.render(scene,camera)}finally{renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha)}
    dirty=false;frames++;
  }
  function enter(uv){return Boolean(uv&&uv.x>=ENTER.x&&uv.x<=ENTER.x+ENTER.width&&uv.y>=ENTER.y&&uv.y<=ENTER.y+ENTER.height)}
  return {update,contains,enter,point(uv){
      overEnter=enter(uv);hoveredTile=uv?TILES.findIndex(t=>uv.x>=t.x&&uv.x<=t.x+t.width&&uv.y>=t.y&&uv.y<=t.y+t.height):-1;
      const wasHover=hover;hover=contains(uv);
      if(hover){const next=THREE.MathUtils.clamp(((uv.x-PLAYER.x)/PLAYER.width-.053)/.894,0,1);
        if(wasHover&&!motionPaused){const speed=Math.min(1,Math.abs(next-pointer)*16);
          // Fill the swept interval so fast mouse motion leaves a continuous wake.
          for(let i=0;i<96;i++){const distance=Math.max(Math.min(pointer,next)-i/95,0,i/95-Math.max(pointer,next));velocities[i]=Math.min(8,velocities[i]+Math.exp(-Math.pow(distance/.045,2))*speed*2.8)}
        }pointer=next;
      }
    },
    pluck(paused){if(paused)return;const center=hover?pointer:.5;pulses.push({origin:center,time:clock});if(pulses.length>8)pulses.shift();for(let i=0;i<96;i++)velocities[i]+=Math.pow(Math.max(0,1-Math.abs(i/95-center)/.18),2)*6;dirty=true},
    pause(){hover=false;hoveredTile=-1;overEnter=false;accumulator=0},reset(){offsets.fill(0);velocities.fill(0);tileAmounts.fill(0);hoveredTile=-1;pulses.length=0;hover=false;dirty=true},
    stats(){return {mode:'player',clock,maxDisplacement,maxBarHeight,activeBars,tileHover:Array.from(tileAmounts),frames,instances:96,drawCalls:2,renderTarget:[1536,256],progress:progressUniform.value}},
    dispose(){if(disposed)return;disposed=true;screen.material=dashboard;target.dispose();resources.forEach(r=>r.dispose())}
  };
}

import {createMobileZoom} from './mobile-zoom.js';
import {createCableMotion} from './cables.js';
import { createSignal, PLAYER, TILES } from './signal.js?v=ls-20261001';
import { HDRLoader } from './vendor/HDRLoader.js';
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/DRACOLoader.js';
export async function createWorkspace({host,signal,onOpenChange,onPauseChange,onFailure,paused=false,opened=false,compact=false,onMonitorLayout=()=>{},onZoomChange=()=>{},onEnter=()=>{}}){
  let renderer,disposed=false,frame=0,visible=true,drag=null,progress=opened?1:0;
  let time=0,last=0;
  const abort=()=>dispose();signal.addEventListener('abort',abort,{once:true});
  const scene=new THREE.Scene();scene.background=new THREE.Color('#101519');
  let camera,model,observer,resizeObserver,environment,pmrem,signalArt,screenMesh,cableMotion,mobileZoom;
  const listeners=[],lights=[],emitters=[],rotors=[],poseParts=[],frameTimes=[];
  const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);listeners.push(()=>target.removeEventListener(event,fn,options))};
  const waitCheck=()=>{if(disposed||signal.aborted)throw new DOMException('Aborted','AbortError')};
  const fail=()=>{if(!disposed)onFailure()};
  try{
    const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Interactive Vybe workstation');canvas.setAttribute('aria-describedby','scene-instructions');canvas.tabIndex=0;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.25:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=.85;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    host.replaceChildren(canvas);
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();fail()});
    camera=new THREE.PerspectiveCamera(25,1,.1,50);camera.position.set(.95,2.42,5.85);camera.lookAt(-.36,1.40,-.06);if(compact){camera.position.set(.15,2.9,5.8);camera.lookAt(-.33,1.18,0)}
    const [buffer,poses]=await Promise.all([fetch('/vybe/assets/workstation.glb',{signal}).then(r=>{if(!r.ok)throw Error('Asset unavailable');return r.arrayBuffer()}),fetch('/vybe/assets/poses.json',{signal}).then(r=>{if(!r.ok)throw Error('Poses unavailable');return r.json()})]);waitCheck();
    const draco=new DRACOLoader().setDecoderPath('/vybe/vendor/draco/');let gltf;try{gltf=await new GLTFLoader().setDRACOLoader(draco).parseAsync(buffer,new URL('/vybe/assets/',location.href).href)}finally{draco.dispose()}waitCheck();model=gltf.scene;
    scene.add(model);
    // GLTFLoader sanitizes punctuation in object names; use the original glTF name.
    const byName=new Map();model.traverse(o=>{byName.set(o.userData.name||o.name,o);byName.set(o.name,o)});
    for(const name of Object.keys(poses.poses.closed)){
      const o=byName.get(name)||model.getObjectByName(name.replace(/\./g,''));if(!o)throw Error('Required component missing: '+name);
      const closed=poses.poses.closed[name],open=poses.poses.open[name];poseParts.push({object:o,closedPosition:new THREE.Vector3().fromArray(closed.position),openPosition:new THREE.Vector3().fromArray(open.position),closedRotation:new THREE.Quaternion().fromArray(closed.quaternion_xyzw),openRotation:new THREE.Quaternion().fromArray(open.quaternion_xyzw)});
    }
    const mats=new Set();
    model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.envMapIntensity=1;mats.add(m);if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy())}});
    for(const m of mats){if(m.name==='Light.Amber')emitters.push({material:m,base:m.emissiveIntensity});if(m.name==='Screen.Dashboard'){m.emissiveIntensity=.55;m.roughness=.27}if(m.name==='Metal.BrushedAluminium')m.roughness=1}
    for(const name of ['Rack.Fan.00.Rotor','Rack.Fan.01.Rotor']){const o=byName.get(name)||model.getObjectByName(name.replace(/\./g,''));if(o)rotors.push(o)}
    // The same licensed studio environment used for the Blender material preview.
    const hdrBuffer=await fetch('/vybe/assets/studio.hdr',{signal}).then(r=>{if(!r.ok)throw Error('Environment unavailable');return r.arrayBuffer()});waitCheck();
    const hdrData=new HDRLoader().parse(hdrBuffer);
    const hdrTexture=new THREE.DataTexture(hdrData.data,hdrData.width,hdrData.height,THREE.RGBAFormat,hdrData.type);hdrTexture.mapping=THREE.EquirectangularReflectionMapping;hdrTexture.needsUpdate=true;hdrTexture.colorSpace=THREE.LinearSRGBColorSpace;
    pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(hdrTexture);scene.environment=environment.texture;scene.environmentIntensity=.065;hdrTexture.dispose();pmrem.dispose();pmrem=null;
    screenMesh=[...byName.values()].find(o=>o.isMesh&&o.material?.name==='Screen.Dashboard');
    if(!screenMesh)throw Error('Monitor display missing');
    signalArt=await createSignal({renderer,screen:screenMesh,environment:environment.texture,signal});waitCheck();
    const hemi=new THREE.HemisphereLight(0x9bbedb,0x342119,.36);scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffc28a,2.4);key.position.set(-2.7,2.55,.7);key.target.position.set(-.4,1,0);key.castShadow=true;key.shadow.mapSize.set(compact?1024:2048,compact?1024:2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.camera.near=.5;key.shadow.camera.far=14;key.shadow.normalBias=.008;key.shadow.bias=-.0005;scene.add(key,key.target);lights.push(key);
    const fill=new THREE.DirectionalLight(0x93bde8,.60);fill.position.set(2,3,4);scene.add(fill);lights.push(fill);
    const rim=new THREE.PointLight(0xff8b32,14,7,2);rim.position.set(2.3,2.5,-.4);scene.add(rim);lights.push(rim);
    const back=new THREE.PointLight(0xff9b3e,4,4,2);back.position.set(-1,2.7,-.65);scene.add(back);lights.push(back);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x141a1e,roughness:.68,metalness:.1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
    const wallMat=new THREE.MeshStandardMaterial({color:0x14171a,roughness:.8,metalness:.18});const wall=new THREE.Mesh(new THREE.BoxGeometry(14,5,.1),wallMat);wall.position.set(0,2,-1.5);wall.receiveShadow=true;scene.add(wall);
    const flutes=new THREE.InstancedMesh(new THREE.BoxGeometry(.016,5,.035),new THREE.MeshStandardMaterial({color:0x202021,roughness:.65,metalness:.4}),70);const temp=new THREE.Object3D();for(let i=0;i<70;i++){temp.position.set((i-35)*.18,2,-1.423);temp.updateMatrix();flutes.setMatrixAt(i,temp.matrix)}flutes.receiveShadow=true;scene.add(flutes);
    const positions=screenMesh.geometry.attributes.position,uvs=screenMesh.geometry.attributes.uv;
    function uvCorner(u,v){let nearest=Infinity,result;for(let i=0;i<uvs.count;i++){const d=(uvs.getX(i)-u)**2+(uvs.getY(i)-v)**2;if(d<nearest){nearest=d;result=new THREE.Vector3().fromBufferAttribute(positions,i)}}return result}
    const corners=[uvCorner(0,0),uvCorner(1,0),uvCorner(0,1)];
    function projectUV(u,v){const p=corners[0].clone().lerp(corners[1],u).addScaledVector(corners[2].clone().sub(corners[0]),v).applyMatrix4(screenMesh.matrixWorld).project(camera);const r=canvas.getBoundingClientRect();return [(p.x+1)*r.width/2,(1-p.y)*r.height/2]}
    function resize(){if(disposed)return;const {width,height}=host.getBoundingClientRect();const aspect=width/height;camera.aspect=aspect;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(36/(2*(compact?50:51)*aspect)));
      camera.updateProjectionMatrix();renderer.setSize(width,height,false);mobileZoom?.apply();model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      const a=projectUV(PLAYER.x,PLAYER.y),b=projectUV(PLAYER.x+PLAYER.width,PLAYER.y+PLAYER.height);
      onMonitorLayout({left:Math.min(a[0],b[0]),top:Math.min(a[1],b[1]),width:Math.abs(b[0]-a[0]),height:Math.max(16,Math.abs(b[1]-a[1]))});requestFrame()}
    function applyPose(){for(const p of poseParts){p.object.position.lerpVectors(p.closedPosition,p.openPosition,progress);p.object.quaternion.slerpQuaternions(p.closedRotation,p.openRotation,progress)}}
    // Keep a fixed closed-rack volume so the opening door cannot move its own hit target.
    model.updateMatrixWorld(true);
    cableMotion=createCableMotion({model,camera,canvas});
    const rackBounds=new THREE.Box3().setFromObject(byName.get('Rack.Chassis')).expandByScalar(.025);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    function rackHover(value){if(value!==opened)onOpenChange(value)}
    function isRack(object){for(let o=object;o;o=o.parent)if((o.userData.name||o.name).startsWith('Rack.'))return true;return false}
    function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObject(model,true)[0]}
    if(compact)mobileZoom=createMobileZoom({camera,canvas,onChange:onZoomChange,requestFrame,onGesture(){drag=null;signalArt.pause();cableMotion.pause()}});
    listen(canvas,'pointerdown',event=>{if(mobileZoom?.active)return;if(event.button!==0||event.isPrimary===false)return;const h=hit(event);const onScreen=h?.object===screenMesh;drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,hit:Boolean(h),scope:onScreen?(signalArt.enter(h.uv)?'enter':signalArt.contains(h.uv)?'signal':'screen'):((isRack(h?.object)||raycaster.ray.intersectsBox(rackBounds))?'rack':'scene')};signalArt.point(onScreen?h.uv:null);canvas.setPointerCapture(event.pointerId)});
    listen(canvas,'pointermove',event=>{if(mobileZoom?.active)return;const h=hit(event);const inPlayer=h?.object===screenMesh&&signalArt.contains(h.uv);cableMotion.point(h?.object===screenMesh?null:event);signalArt.point(h?.object===screenMesh?h.uv:null);if(!compact&&event.pointerType!=='touch')rackHover(h?.object!==screenMesh&&(isRack(h?.object)||raycaster.ray.intersectsBox(rackBounds)));canvas.style.cursor=inPlayer?'crosshair':h?.object===screenMesh&&signalArt.enter(h.uv)?'pointer':'default';if(drag&&drag.id===event.pointerId&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7)drag.moved=true});
    function endDrag(event,canceled=false){if(mobileZoom?.active){drag=null;return}if(!drag||drag.id!==event.pointerId)return;const old=drag;const click=!old.moved&&!canceled&&old.hit&&Math.hypot(event.clientX-old.x,event.clientY-old.y)<=7;drag=null;if(canceled)signalArt.pause();if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(click&&old.scope==='enter'){onEnter();return}if(click&&old.scope==='signal'){signalArt.pluck(paused);requestFrame()}if(click&&old.scope==='rack'&&(compact||event.pointerType==='touch')){onOpenChange(!opened);requestFrame()}if(event.pointerType==='touch'){signalArt.point(null);cableMotion.point(null)}}
    listen(canvas,'pointerup',event=>endDrag(event));listen(canvas,'pointercancel',event=>endDrag(event,true));listen(canvas,'lostpointercapture',()=>{if(drag){drag=null;signalArt.pause();cableMotion.pause()}});
    listen(canvas,'pointerleave',()=>{signalArt.point(null);cableMotion.point(null);if(!compact)rackHover(false)});
    listen(canvas,'keydown',event=>{if(event.repeat)return;if(event.key==='Enter'){event.preventDefault();onEnter()}else if(event.key===' '){event.preventDefault();onOpenChange(!opened)}else if(event.key.toLowerCase()==='p'){event.preventDefault();onPauseChange(!paused)}});
    listen(document,'visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;drag=null;mobileZoom?.cancel();signalArt.pause();cableMotion.pause()}else requestFrame()});
    observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(!visible){cancelAnimationFrame(frame);frame=0}else requestFrame()},{threshold:0});observer.observe(host);
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
    function requestFrame(){if(!disposed&&!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick)}
    function tick(now){frame=0;if(disposed||document.hidden||!visible)return;const raw=last?(now-last)/1000:0;const dt=Math.min(raw,.05);last=now;if(!paused&&raw>0&&raw<.2){frameTimes.push(raw*1000);if(frameTimes.length>180)frameTimes.shift()}
      if(!paused){time+=dt;progress=THREE.MathUtils.damp(progress,opened?1:0,5,dt);for(const r of rotors)r.rotateZ(-dt*1.9);const pulse=.83+.25*Math.pow(.5+.5*Math.sin(time*.7),3);for(const e of emitters)e.material.emissiveIntensity=e.base*pulse;back.intensity=4+1.3*Math.sin(time*.7)}
      applyPose();try{cableMotion.update(dt,paused);signalArt.update(dt,paused);renderer.render(scene,camera)}catch{fail();return}if(!paused)requestFrame()}
    const api={zoomBy(factor){mobileZoom?.by(factor)},fitView(){mobileZoom?.reset()},setOpen(value){opened=value;if(paused)progress=opened?1:0;requestFrame()},pluckSong(){signalArt.pluck(paused);requestFrame()},setPaused(value){paused=value;signalArt.pause();cableMotion.pause();last=0;requestFrame()},reset(){opened=false;progress=0;mobileZoom?.reset();signalArt.reset();cableMotion.reset();requestFrame()},stats(){const gl=renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');return {compact,view:mobileZoom?.stats()??null,cables:cableMotion.stats(),signal:signalArt.stats(),tileCenters:TILES.map(t=>{const p=projectUV(t.x+t.width/2,t.y+t.height/2),r=canvas.getBoundingClientRect();return [p[0]+r.left,p[1]+r.top]}),rackCenter:(()=>{const v=rackBounds.getCenter(new THREE.Vector3()).project(camera),r=canvas.getBoundingClientRect();return [r.left+(v.x+1)*r.width/2,r.top+(1-v.y)*r.height/2]})(),playerCenter:(()=>{const p=projectUV(PLAYER.x+PLAYER.width/2,PLAYER.y+PLAYER.height/2),r=canvas.getBoundingClientRect();return [p[0]+r.left,p[1]+r.top]})(),screenCenter:(()=>{const v=new THREE.Box3().setFromObject(screenMesh).getCenter(new THREE.Vector3()).project(camera);const r=canvas.getBoundingClientRect();return [r.left+(v.x+1)*r.width/2,r.top+(1-v.y)*r.height/2]})(),workstationRotation:model.rotation.toArray(),deskMatrix:byName.get('Desk.Frame').matrixWorld.toArray(),hasChair:[...byName.keys()].some(name=>name.includes('Chair')),openProgress:progress,clock:time,idleEmission:emitters.map(e=>e.material.emissiveIntensity),visible,paused,drawCalls:renderer.info.render.calls+2,triangles:renderer.info.render.triangles+36096,canvasCount:host.querySelectorAll('canvas').length,averageFrameMs:frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:null,pixelRatio:renderer.getPixelRatio(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),parts:poseParts.map(p=>({name:p.object.userData.name||p.object.name,position:p.object.position.toArray(),quaternion:p.object.quaternion.toArray()}))}},dispose};
    resize();applyPose();signalArt.update(0,true);renderer.render(scene,camera);requestFrame();return api;
  }catch(e){dispose();throw e}
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;observer?.disconnect();resizeObserver?.disconnect();listeners.forEach(fn=>fn());mobileZoom?.dispose();signalArt?.dispose();signal.removeEventListener('abort',abort);const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment?.dispose();pmrem?.dispose();lights.forEach(l=>l.shadow?.dispose());renderer?.dispose();renderer?.domElement.remove()}
}

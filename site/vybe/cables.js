import * as THREE from 'three';

// Deform the exported cable tubes; connectors and the collars at both ends stay fixed.
export function createCableMotion({model,camera,canvas}){
  const cables=[];const v=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3();
  let hovered=-1,paused=false,clock=0;
  model.updateMatrixWorld(true);
  model.traverse(lead=>{
    if(!lead.userData.hover_wiggle||!Array.isArray(lead.userData.cable_points))return;
    const points=[];const values=lead.userData.cable_points;
    for(let i=0;i<values.length;i+=3)points.push(new THREE.Vector3().fromArray(values,i));
    const arc=[0];for(let i=1;i<points.length;i++)arc.push(arc[i-1]+points[i].distanceTo(points[i-1]));
    const length=arc.at(-1),meshes=[];
    for(const mesh of lead.children.filter(o=>o.isMesh)){
      const original=mesh.geometry;mesh.geometry=original.clone();original.dispose();
      const geometry=mesh.geometry,position=geometry.attributes.position,rest=position.array.slice(),t=new Float32Array(position.count);
      const inverse=new THREE.Matrix3().setFromMatrix4(mesh.matrix).invert();
      for(let i=0;i<position.count;i++){
        v.fromBufferAttribute(position,i).applyMatrix4(mesh.matrix);let closest=Infinity,best=0;
        for(let j=0;j<points.length-1;j++){
          a.subVectors(points[j+1],points[j]);b.subVectors(v,points[j]);
          const along=THREE.MathUtils.clamp(b.dot(a)/a.lengthSq(),0,1);
          const distance=delta.copy(points[j]).addScaledVector(a,along).distanceToSquared(v);
          if(distance<closest){closest=distance;best=(arc[j]+along*(arc[j+1]-arc[j]))/length}
        }t[i]=best;
      }
      position.setUsage(THREE.DynamicDrawUsage);geometry.computeBoundingSphere();geometry.boundingSphere.radius+=.025;mesh.frustumCulled=false;
      meshes.push({mesh,geometry,position,rest,t,inverse});
    }
    cables.push({lead,points,arc,length,meshes,strength:0,maxDisplacement:0,pinnedDrift:0});
  });
  function project(point,lead,rect){
    const projected=point.clone().applyMatrix4(lead.matrixWorld).project(camera);
    return new THREE.Vector3((projected.x+1)*rect.width/2+rect.left,(1-projected.y)*rect.height/2+rect.top,projected.z);
  }
  function point(event){
    if(paused)return;
    hovered=-1;if(!event)return;
    const rect=canvas.getBoundingClientRect();let best=9*9;
    cables.forEach((c,index)=>{
      const screen=c.points.map(p=>project(p,c.lead,rect));
      for(let i=0;i<screen.length-1;i++){
        const p=screen[i],q=screen[i+1],dx=q.x-p.x,dy=q.y-p.y;
        const t=THREE.MathUtils.clamp(((event.clientX-p.x)*dx+(event.clientY-p.y)*dy)/(dx*dx+dy*dy||1),0,1);
        const d=(event.clientX-p.x-t*dx)**2+(event.clientY-p.y-t*dy)**2;
        if(d<best){best=d;hovered=index}
      }
    });
  }
  function update(dt,isPaused){
    paused=isPaused;if(paused)return;dt=Math.min(dt,.05);clock+=dt;
    cables.forEach((c,index)=>{
      const old=c.strength;c.strength=THREE.MathUtils.damp(old,index===hovered?1:0,index===hovered?14:7,dt);
      if(c.strength<.0001)c.strength=0;
      if(!c.strength&&!old)return;
      c.maxDisplacement=0;c.pinnedDrift=0;
      for(const {geometry,position,rest,t,inverse} of c.meshes){
        for(let i=0;i<position.count;i++){
          // Leave the first/last 8% untouched so the tube exits the boots cleanly.
          const u=THREE.MathUtils.clamp((t[i]-.08)/.84,0,1),envelope=Math.sin(Math.PI*u)**2;
          const energy=c.strength*envelope;
          delta.set(.009*energy*Math.sin(clock*17-t[i]*8),.002*energy*Math.sin(clock*13+t[i]*7),.005*energy*Math.cos(clock*15-t[i]*9)).applyMatrix3(inverse);
          position.setXYZ(i,rest[i*3]+delta.x,rest[i*3+1]+delta.y,rest[i*3+2]+delta.z);
          const distance=Math.hypot(position.getX(i)-rest[i*3],position.getY(i)-rest[i*3+1],position.getZ(i)-rest[i*3+2]);
          c.maxDisplacement=Math.max(c.maxDisplacement,distance);
          if(t[i]<=.08||t[i]>=.92)c.pinnedDrift=Math.max(c.pinnedDrift,distance);
        }
        position.needsUpdate=true;geometry.computeVertexNormals();
      }
    });
  }
  return {point,update,pause(){hovered=-1},reset(){hovered=-1;for(const c of cables){c.strength=.00001}update(0,false)},
    stats(){const rect=canvas.getBoundingClientRect();return {count:cables.length,hovered,clock,leads:cables.map(c=>{const p=project(c.points[Math.floor(c.points.length/2)],c.lead,rect);return {name:c.lead.userData.name||c.lead.name,strength:c.strength,maxDisplacement:c.maxDisplacement,pinnedDrift:c.pinnedDrift,screenPoint:[p.x,p.y]}})}}};
}

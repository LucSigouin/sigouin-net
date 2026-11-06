// Loads Luc's sculpted, rigged model (Tripo, Mixamo skeleton) and retargets the hand-authored
// clips onto it, so the GLB itself needs no animation. Each of our bones is mapped to a Mixamo
// bone; its world rotation per frame becomes the Mixamo bone's world rotation times a constant
// bind offset, which also turns the model's A-pose rest into our arms-down rest.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { buildClips } from './animations';

const HEIGHT = 1.85;
const HIP_Y = 0.98;
const UP = new THREE.Vector3(0, 1, 0);

/** Our bone → [Mixamo bone, our parent]. */
const MAP: Record<string, [string, string | null]> = {
  hips: ['Hips', null], spine: ['Spine', 'hips'], chest: ['Spine2', 'spine'], neck: ['Neck', 'chest'], head: ['Head', 'neck'],
  upperArm_L: ['LeftArm', 'chest'], forearm_L: ['LeftForeArm', 'upperArm_L'], hand_L: ['LeftHand', 'forearm_L'],
  upperArm_R: ['RightArm', 'chest'], forearm_R: ['RightForeArm', 'upperArm_R'], hand_R: ['RightHand', 'forearm_R'],
  thigh_L: ['LeftUpLeg', 'hips'], shin_L: ['LeftLeg', 'thigh_L'], foot_L: ['LeftFoot', 'shin_L'],
  thigh_R: ['RightUpLeg', 'hips'], shin_R: ['RightLeg', 'thigh_R'], foot_R: ['RightFoot', 'shin_R'],
};
/** Limb bones whose rest direction is straightened to hang down, like our rig's rest. */
const LIMB_CHILD: Record<string, string> = {
  LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', RightArm: 'RightForeArm', RightForeArm: 'RightHand',
  LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', RightUpLeg: 'RightLeg', RightLeg: 'RightFoot',
};
const OURS = Object.keys(MAP);

const plain = (name: string) => name.replace(/^mixamorig[:_]?/, '');

export async function loadPlayerModel(url: string) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  const model = gltf.scene;
  const bones = new Map<string, THREE.Bone>();
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(plain(o.name), o as THREE.Bone);
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });
  const bone = (n: string) => {
    const b = bones.get(n);
    if (!b) throw new Error(`model is missing bone ${n}`);
    return b;
  };

  // Stand it up in our space: facing +z, feet on y = 0, 1.85 m tall.
  const wrapper = new THREE.Group();
  wrapper.name = 'player-model';
  wrapper.add(model);
  wrapper.updateMatrixWorld(true);
  const p = (b: THREE.Object3D) => b.getWorldPosition(new THREE.Vector3());
  const left = p(bone('LeftUpLeg')).sub(p(bone('RightUpLeg'))).setY(0);
  const fwd = new THREE.Vector3().crossVectors(left, UP);
  model.rotation.y = -Math.atan2(fwd.x, fwd.z);
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model, true);
  model.scale.setScalar(HEIGHT / (box.max.y - box.min.y));
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model, true);
  const c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  wrapper.updateMatrixWorld(true);

  return { root: wrapper, clips: retarget(wrapper, bone('Hips'), bone) };
}

function retarget(wrapper: THREE.Object3D, hips: THREE.Bone, bone: (n: string) => THREE.Bone) {
  const worldQ = (o: THREE.Object3D) => o.getWorldQuaternion(new THREE.Quaternion());
  const mapped = new Map<THREE.Object3D, string>();
  for (const b of OURS) mapped.set(bone(MAP[b][0]), b);
  // Bind offset per mapped bone: straighten limbs, then its rest world rotation.
  const offset = new Map<THREE.Object3D, THREE.Quaternion>();
  for (const [m] of mapped) {
    const fix = new THREE.Quaternion();
    const child = LIMB_CHILD[plain(m.name)];
    if (child) {
      const dir = bone(child).getWorldPosition(new THREE.Vector3()).sub(m.getWorldPosition(new THREE.Vector3())).normalize();
      // Legs hang with a slight outward splay, so the knees don't read as knocked together.
      const splay = /Leg$/.test(plain(m.name)) ? Math.sign(dir.x) * 0.045 : 0;
      fix.setFromUnitVectors(dir, new THREE.Vector3(Math.sin(splay), -Math.cos(splay), 0));
    }
    offset.set(m, fix.multiply(worldQ(m)));
  }
  // Hierarchy from the hips down, so every parent is solved before its children.
  const order: THREE.Object3D[] = [];
  hips.traverse((o) => { if ((o as THREE.Bone).isBone) order.push(o); });
  const hipsParentQ = worldQ(hips.parent!);
  const hipsParentInv = hips.parent!.matrixWorld.clone().invert();
  const hipsRest = hips.getWorldPosition(new THREE.Vector3());
  const hipScale = hipsRest.y / HIP_Y;

  const ours: Record<string, THREE.Quaternion> = {};
  const oursWorld: Record<string, THREE.Quaternion> = {};
  const world = new Map<THREE.Object3D, THREE.Quaternion>();
  const tmp = new THREE.Quaternion(), pos = new THREE.Vector3();
  for (const b of OURS) { ours[b] = new THREE.Quaternion(); oursWorld[b] = new THREE.Quaternion(); }

  return buildClips().map((src) => {
    const byName = new Map(src.tracks.map((t) => [t.name, t]));
    const times = byName.get('hips.quaternion')!.times;
    const out = new Map<THREE.Object3D, Float32Array>();
    for (const [m] of mapped) out.set(m, new Float32Array(times.length * 4));
    const hipPos = new Float32Array(times.length * 3);
    for (let i = 0; i < times.length; i++) {
      for (const b of OURS) {
        const v = byName.get(`${b}.quaternion`)!.values;
        ours[b].fromArray(v, i * 4);
        const parent = MAP[b][1];
        oursWorld[b].copy(parent ? oursWorld[parent] : tmp.identity()).multiply(ours[b]);
      }
      for (const m of order) {
        const pq = m === hips ? hipsParentQ : world.get(m.parent!)!;
        const b = mapped.get(m);
        const q = b ? oursWorld[b].clone().multiply(offset.get(m)!) : pq.clone().multiply(m.quaternion);
        world.set(m, q);
        if (b) out.get(m)!.set(tmp.copy(pq).invert().multiply(q).normalize().toArray(), i * 4);
      }
      const hv = byName.get('hips.position')!.values;
      pos.set(hv[i * 3], hv[i * 3 + 1] - HIP_Y, hv[i * 3 + 2]).multiplyScalar(hipScale).add(hipsRest).applyMatrix4(hipsParentInv);
      hipPos.set([pos.x, pos.y, pos.z], i * 3);
    }
    const tracks: THREE.KeyframeTrack[] = [...out].map(([m, v]) => new THREE.QuaternionKeyframeTrack(`${m.name}.quaternion`, Array.from(times), Array.from(v)));
    tracks.push(new THREE.VectorKeyframeTrack(`${hips.name}.position`, Array.from(times), Array.from(hipPos)));
    return new THREE.AnimationClip(src.name, src.duration, tracks);
  });
}

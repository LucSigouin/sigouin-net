// The player character, built from primitives on a real bone hierarchy. Every mesh is
// parented to a bone, and the hand-authored clips in animations.ts drive the bones through
// three's AnimationMixer, so clips blend like any rigged asset.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildClips, WALK, RUN } from './animations';
import { jitter, clamp, smoothstep } from '../core/util';

const M = {
  skin: new THREE.MeshStandardMaterial({ color: 0xe9bb9c, roughness: 0.62 }),
  hoodie: new THREE.MeshStandardMaterial({ color: 0x8b8f96, roughness: 0.94 }),
  hoodieDark: new THREE.MeshStandardMaterial({ color: 0x777b82, roughness: 0.96 }),
  jeans: new THREE.MeshStandardMaterial({ color: 0x2a3449, roughness: 0.88 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.55 }),
  sole: new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.7 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x4b3120, roughness: 0.72 }),
  pack: new THREE.MeshStandardMaterial({ color: 0x8a5632, roughness: 0.62 }),
  packDark: new THREE.MeshStandardMaterial({ color: 0x5e3a20, roughness: 0.7 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x2a211b, roughness: 0.3 }),
  lace: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.8 }),
};

function capsule(r: number, len: number, material: THREE.Material, y: number, rTop = r) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, len, 14, 1, true), material);
  body.position.y = y;
  const top = new THREE.Mesh(new THREE.SphereGeometry(rTop, 14, 8), material);
  top.position.y = y + len / 2;
  const bot = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8), material);
  bot.position.y = y - len / 2;
  g.add(body, top, bot);
  return g;
}

function lathe(profile: [number, number][], material: THREE.Material, zScale = 1) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  g.scale(1, 1, zScale);
  g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}

export class Character {
  root = new THREE.Group();
  bones: Record<string, THREE.Bone> = {};
  mixer: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private phase = 0;
  private gesture: THREE.AnimationAction | null = null;
  private gestureW = 0;
  private gestureEnd = 0;
  private clock = 0;

  constructor() {
    this.build();
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.mixer = new THREE.AnimationMixer(this.root);
    this.setup(buildClips());
  }

  /** Swaps the primitive body for a loaded, rigged model driven by retargeted clips. */
  useModel(model: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.root.clear();
    this.bones = {};
    this.root.add(model);
    this.mixer = new THREE.AnimationMixer(this.root);
    this.gesture = null;
    this.gestureW = 0;
    this.setup(clips);
  }

  private setup(clips: THREE.AnimationClip[]) {
    this.actions = {};
    for (const clip of clips) {
      const a = this.mixer.clipAction(clip);
      if (clip.name === 'wave' || clip.name === 'openDoor') {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      this.actions[clip.name] = a;
    }
    for (const n of ['idle', 'walk', 'run']) {
      const a = this.actions[n];
      a.play();
      a.setEffectiveWeight(n === 'idle' ? 1 : 0);
    }
    this.actions.walk.timeScale = 0;
    this.actions.run.timeScale = 0;
  }

  private bone(name: string, parent: THREE.Object3D, x: number, y: number, z: number) {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    parent.add(b);
    this.bones[name] = b;
    return b;
  }

  private build() {
    const hips = this.bone('hips', this.root, 0, 0.98, 0);
    // Pelvis (jeans) and belt line.
    hips.add(lathe([[0.001, -0.13], [0.11, -0.125], [0.15, -0.09], [0.162, -0.02], [0.158, 0.06], [0.152, 0.11], [0.001, 0.11]], M.jeans, 0.7));

    const spine = this.bone('spine', hips, 0, 0.1, 0);
    const chest = this.bone('chest', spine, 0, 0.22, 0);
    // Hoodie body: hem to neckline.
    const torso = lathe(
      [[0.001, -0.33], [0.168, -0.33], [0.175, -0.28], [0.168, -0.18], [0.172, -0.06], [0.19, 0.04], [0.206, 0.1], [0.205, 0.145], [0.17, 0.185], [0.1, 0.21], [0.062, 0.215], [0.001, 0.215]],
      M.hoodie, 0.64,
    );
    chest.add(torso);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 28), M.hoodieDark);
    hem.rotation.x = Math.PI / 2;
    hem.scale.set(1, 0.66, 1);
    hem.position.y = -0.31;
    chest.add(hem);
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.1, 0.02, 2, 0.008), M.hoodieDark);
    pocket.position.set(0, -0.21, 0.108);
    pocket.rotation.x = -0.06;
    chest.add(pocket);
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.04, 10, 20, Math.PI * 1.25), M.hoodie);
    hood.rotation.set(Math.PI / 2 - 0.25, 0, -Math.PI * 0.125 + Math.PI);
    hood.position.set(0, 0.19, -0.035);
    hood.scale.set(1.1, 1, 1);
    chest.add(hood);
    for (const s of [-1, 1]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 5), M.lace);
      cord.position.set(0.03 * s, 0.1, 0.13);
      cord.rotation.x = 0.25;
      chest.add(cord);
    }
    // Backpack with straps.
    const pack = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.37, 0.13, 3, 0.045), M.pack);
    pack.position.set(0, -0.05, -0.19);
    chest.add(pack);
    const pouch = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.14, 0.05, 2, 0.02), M.packDark);
    pouch.position.set(0, -0.13, -0.265);
    chest.add(pouch);
    const flap = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.08, 0.14, 2, 0.03), M.packDark);
    flap.position.set(0, 0.1, -0.19);
    chest.add(flap);
    for (const s of [-1, 1]) {
      const over = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.3), M.packDark);
      over.position.set(0.095 * s, 0.175, -0.02);
      over.rotation.x = 0.12;
      chest.add(over);
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.28, 0.016), M.packDark);
      front.position.set(0.1 * s, 0.03, 0.123);
      front.rotation.x = -0.1;
      chest.add(front);
    }

    const neck = this.bone('neck', chest, 0, 0.2, 0);
    neck.add(capsule(0.048, 0.07, M.skin, 0.03));
    const head = this.bone('head', neck, 0, 0.09, 0.012);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), M.skin);
    skull.scale.set(0.094, 0.118, 0.106);
    skull.position.set(0, 0.09, 0);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M.skin);
    jaw.scale.set(0.078, 0.07, 0.085);
    jaw.position.set(0, 0.04, 0.018);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), M.skin);
    nose.scale.set(0.9, 1.3, 1.1);
    nose.position.set(0, 0.075, 0.106);
    head.add(skull, jaw, nose);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), M.skin);
      ear.scale.set(0.45, 1, 0.8);
      ear.position.set(0.093 * s, 0.085, -0.005);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), M.eye);
      eye.position.set(0.034 * s, 0.1, 0.094);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.007, 0.01), M.hair);
      brow.position.set(0.035 * s, 0.122, 0.098);
      brow.rotation.z = -0.1 * s;
      head.add(ear, eye, brow);
    }
    // Short hair: a jittered cap, higher at the forehead, lower at the nape.
    const hairGeo = jitter(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.58), 0.06, 5, 9);
    const hair = new THREE.Mesh(hairGeo, M.hair);
    hair.scale.set(0.1, 0.126, 0.113);
    hair.position.set(0, 0.098, -0.006);
    hair.rotation.x = -0.32;
    head.add(hair);
    const fringe = new THREE.Mesh(jitter(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), 0.12, 2, 12), M.hair);
    fringe.scale.set(0.095, 0.09, 0.1);
    fringe.position.set(0, 0.14, 0.02);
    fringe.rotation.x = 0.35;
    head.add(fringe);

    for (const [side, s] of [['L', 1], ['R', -1]] as const) {
      const upper = this.bone(`upperArm_${side}`, chest, 0.198 * s, 0.135, -0.005);
      const delt = new THREE.Mesh(new THREE.SphereGeometry(0.066, 16, 12), M.hoodie);
      delt.position.set(0.004 * s, -0.012, 0);
      upper.add(delt);
      upper.add(capsule(0.05, 0.25, M.hoodie, -0.15, 0.058));
      const fore = this.bone(`forearm_${side}`, upper, 0, -0.31, 0);
      fore.add(capsule(0.041, 0.22, M.hoodie, -0.12, 0.048));
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.041, 0.04, 12), M.hoodieDark);
      cuff.position.y = -0.245;
      fore.add(cuff);
      const hand = this.bone(`hand_${side}`, fore, 0, -0.27, 0);
      const palm = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.095, 0.078, 2, 0.015), M.skin);
      palm.position.set(0, -0.05, 0.004);
      const fingers = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.07, 0.072, 2, 0.013), M.skin);
      fingers.position.set(-0.003 * s, -0.11, 0.008);
      fingers.rotation.x = 0.25;
      const thumb = capsule(0.012, 0.04, M.skin, -0.02);
      thumb.position.set(0.004 * s, -0.03, 0.045);
      thumb.rotation.x = 0.6;
      hand.add(palm, fingers, thumb);
    }

    for (const [side, s] of [['L', 1], ['R', -1]] as const) {
      const thigh = this.bone(`thigh_${side}`, hips, 0.092 * s, -0.04, 0);
      thigh.add(capsule(0.06, 0.36, M.jeans, -0.22, 0.078));
      const shin = this.bone(`shin_${side}`, thigh, 0, -0.45, 0);
      shin.add(capsule(0.046, 0.34, M.jeans, -0.2, 0.058));
      const hemCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.05, 14), M.jeans);
      hemCuff.position.y = -0.38;
      shin.add(hemCuff);
      const foot = this.bone(`foot_${side}`, shin, 0, -0.43, 0);
      const upperShoe = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.035), M.shoe);
      upperShoe.position.set(0, -0.022, 0.045);
      const sole = new THREE.Mesh(new RoundedBoxGeometry(0.106, 0.026, 0.272, 2, 0.012), M.sole);
      sole.position.set(0, -0.055, 0.045);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.056, 0.05, 14), M.shoe);
      collar.position.set(0, 0.01, -0.02);
      const laces = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.09), M.lace);
      laces.position.set(0, 0.018, 0.075);
      laces.rotation.x = -0.28;
      foot.add(upperShoe, sole, collar, laces);
    }
  }

  /** Blends idle/walk/run from ground speed; stride-synced so feet do not slide. */
  update(dt: number, speed: number) {
    this.clock += dt;
    const a = clamp(speed / WALK.speed);
    const b = clamp((speed - WALK.speed) / (RUN.speed - WALK.speed));
    const stride = WALK.stride + (RUN.stride - WALK.stride) * smoothstep(0, 1, b);
    this.phase = (this.phase + (dt * speed) / stride) % 1;
    this.actions.walk.time = this.phase * WALK.duration;
    this.actions.run.time = this.phase * RUN.duration;

    if (this.gesture) {
      const t = this.clock;
      const fadeIn = Math.min(1, this.gestureW + dt / 0.18);
      this.gestureW = t > this.gestureEnd - 0.22 ? Math.max(0, this.gestureW - dt / 0.22) : fadeIn;
      if (t > this.gestureEnd && this.gestureW <= 0) {
        this.gesture.stop();
        this.gesture = null;
      }
    }
    const g = this.gesture ? this.gestureW : 0;
    const locomote = 1 - g;
    this.actions.idle.setEffectiveWeight((1 - a) * locomote);
    this.actions.walk.setEffectiveWeight(a * (1 - b) * locomote);
    this.actions.run.setEffectiveWeight(a * b * locomote);
    if (this.gesture) this.gesture.setEffectiveWeight(g);
    this.mixer.update(dt);
  }

  playGesture(name: 'wave' | 'openDoor') {
    const a = this.actions[name];
    if (this.gesture && this.gesture !== a) this.gesture.stop();
    a.reset();
    a.play();
    this.gesture = a;
    this.gestureW = 0;
    this.gestureEnd = this.clock + a.getClip().duration;
  }
}

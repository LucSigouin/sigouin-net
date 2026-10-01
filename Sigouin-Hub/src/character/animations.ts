// Hand-authored animation clips. Each clip is a pose function of normalised time, sampled into
// quaternion keyframe tracks. Walk and run share a phase so they blend without foot pops;
// stride lengths below are measured from the leg swing so playback speed matches ground speed.
import * as THREE from 'three';

export const WALK = { duration: 0.95, stride: 1.38, speed: 1.45 };
export const RUN = { duration: 0.66, stride: 2.8, speed: 4.2 };

type V3 = [number, number, number];
interface Pose { rot: Record<string, V3>; hips: V3 }

const BONES = [
  'hips', 'spine', 'chest', 'neck', 'head',
  'upperArm_L', 'forearm_L', 'hand_L', 'upperArm_R', 'forearm_R', 'hand_R',
  'thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R',
];
const HIP_Y = 0.98;
const TAU = Math.PI * 2;
const sm = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function relaxed(): Pose {
  return {
    rot: {
      upperArm_L: [0.03, 0, 0.1], upperArm_R: [0.03, 0, -0.1],
      forearm_L: [-0.16, 0, 0], forearm_R: [-0.16, 0, 0],
      hand_L: [0, 0, -0.05], hand_R: [0, 0, 0.05],
    },
    hips: [0, 0, 0],
  };
}

function leg(p: Pose, side: 'L' | 'R', w: number, amp: number, bias: number, knee: number, kneeLead: number, kneeBase: number) {
  const thigh = -bias - amp * Math.sin(w);
  const shin = kneeBase + knee * Math.pow(Math.max(0, Math.cos(w + kneeLead)), 1.4);
  const swing = Math.cos(w) > 0 ? -0.12 * Math.cos(w) : 0;
  p.rot[`thigh_${side}`] = [thigh, 0, 0];
  p.rot[`shin_${side}`] = [shin, 0, 0];
  p.rot[`foot_${side}`] = [-(thigh + shin) * 0.85 + swing, 0, 0];
}

function walk(t: number): Pose {
  const w = t * TAU;
  const p = relaxed();
  leg(p, 'L', w, 0.39, 0.09, 0.78, 0.5, 0.08);
  leg(p, 'R', w + Math.PI, 0.39, 0.09, 0.78, 0.5, 0.08);
  p.hips = [0, 0.02 * Math.cos(2 * w) - 0.012, 0];
  p.rot.hips = [0.02, -0.09 * Math.sin(w), 0.025 * Math.cos(w)];
  p.rot.spine = [0.05, 0.06 * Math.sin(w), -0.015 * Math.cos(w)];
  p.rot.chest = [0.01, 0.05 * Math.sin(w), 0];
  p.rot.head = [-0.04, -0.04 * Math.sin(w), 0];
  p.rot.upperArm_L = [0.34 * Math.sin(w), 0, 0.1];
  p.rot.upperArm_R = [-0.34 * Math.sin(w), 0, -0.1];
  p.rot.forearm_L = [-(0.24 + 0.22 * Math.max(0, -Math.sin(w))), 0, 0];
  p.rot.forearm_R = [-(0.24 + 0.22 * Math.max(0, Math.sin(w))), 0, 0];
  return p;
}

function run(t: number): Pose {
  const w = t * TAU;
  const p = relaxed();
  leg(p, 'L', w, 0.62, 0.15, 1.45, 0.6, 0.22);
  leg(p, 'R', w + Math.PI, 0.62, 0.15, 1.45, 0.6, 0.22);
  p.hips = [0, -0.045 * Math.cos(2 * w) - 0.035, 0];
  p.rot.hips = [0.06, -0.14 * Math.sin(w), 0.03 * Math.cos(w)];
  p.rot.spine = [0.14, 0.1 * Math.sin(w), 0];
  p.rot.chest = [0.05, 0.08 * Math.sin(w), 0];
  p.rot.head = [-0.14, -0.06 * Math.sin(w), 0];
  p.rot.upperArm_L = [0.72 * Math.sin(w) - 0.08, 0, 0.16];
  p.rot.upperArm_R = [-0.72 * Math.sin(w) - 0.08, 0, -0.16];
  p.rot.forearm_L = [-(1.2 + 0.25 * Math.sin(w)), 0, 0];
  p.rot.forearm_R = [-(1.2 - 0.25 * Math.sin(w)), 0, 0];
  return p;
}

function idle(t: number): Pose {
  const w = t * TAU;
  const breath = Math.sin(w * 2);
  const shift = Math.sin(w);
  const p = relaxed();
  const roll = 0.028 * shift;
  p.hips = [0.014 * shift, -0.004 + 0.003 * breath, 0];
  p.rot.hips = [0, 0.03 * shift, roll];
  p.rot.spine = [0.01, -0.02 * shift, -roll * 0.7];
  p.rot.chest = [-0.015 + 0.014 * breath, 0, -roll * 0.3];
  p.rot.neck = [0, 0, 0];
  p.rot.head = [0.02 * Math.sin(w + 1.3), 0.14 * Math.sin(w * 1 + 0.4) * sm(-1, 1, Math.sin(w + 2)), 0];
  // Legs counter the pelvis roll so both feet stay planted; the unloaded knee softens.
  p.rot.thigh_L = [-0.02, 0, -roll];
  p.rot.thigh_R = [-0.02, 0, -roll];
  p.rot.shin_L = [0.05 + 0.06 * Math.max(0, -shift), 0, 0];
  p.rot.shin_R = [0.05 + 0.06 * Math.max(0, shift), 0, 0];
  p.rot.foot_L = [-0.03 - 0.06 * Math.max(0, -shift), 0, roll];
  p.rot.foot_R = [-0.03 - 0.06 * Math.max(0, shift), 0, roll];
  p.rot.upperArm_L = [0.02 * Math.sin(w + 1), 0, 0.1 + 0.012 * breath];
  p.rot.upperArm_R = [0.02 * Math.sin(w + 2), 0, -0.1 - 0.012 * breath];
  return p;
}

function wave(t: number): Pose {
  const p = idle(t * 0.25);
  const e = sm(0, 0.2, t) * (1 - sm(0.8, 1, t));
  p.rot.upperArm_R = [-0.3 * e, 0, -0.1 - 2.35 * e];
  p.rot.forearm_R = [-0.25 * e, 0, (-0.45 + 0.42 * Math.sin(t * TAU * 3.2)) * e];
  p.rot.hand_R = [0, 0, 0.05 - 0.2 * e];
  p.rot.head = [-0.05 * e, -0.25 * e, 0.05 * e];
  p.rot.chest = [-0.02, -0.08 * e, 0.04 * e];
  return p;
}

function openDoor(t: number): Pose {
  const p = idle(0.1);
  const reach = sm(0, 0.4, t) * (1 - sm(0.75, 1, t));
  const push = sm(0.35, 0.6, t) * (1 - sm(0.8, 1, t));
  p.rot.upperArm_R = [-1.25 * reach - 0.2 * push, 0, -0.1 - 0.15 * reach];
  p.rot.forearm_R = [-0.55 * reach + 0.4 * push, 0, 0];
  p.rot.hand_R = [0.5 * reach, 0, 0];
  p.rot.upperArm_L = [-0.4 * reach, 0, 0.1 + 0.1 * reach];
  p.rot.forearm_L = [-0.5 * reach, 0, 0];
  p.rot.spine = [0.06 * reach + 0.05 * push, 0.05 * reach, 0];
  p.rot.head = [0.05 * reach, 0, 0];
  return p;
}

function clip(name: string, duration: number, frames: number, fn: (t: number) => Pose, loop: boolean) {
  const times = new Float32Array(frames + 1);
  const quats: Record<string, Float32Array> = {};
  for (const b of BONES) quats[b] = new Float32Array((frames + 1) * 4);
  const hipPos = new Float32Array((frames + 1) * 3);
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (let i = 0; i <= frames; i++) {
    const t = i / frames;
    times[i] = t * duration;
    const pose = fn(loop ? t % 1 : t);
    for (const b of BONES) {
      const r = pose.rot[b] ?? [0, 0, 0];
      q.setFromEuler(e.set(r[0], r[1], r[2]));
      quats[b].set([q.x, q.y, q.z, q.w], i * 4);
    }
    hipPos.set([pose.hips[0], HIP_Y + pose.hips[1], pose.hips[2]], i * 3);
  }
  const tracks: THREE.KeyframeTrack[] = BONES.map((b) => new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times as unknown as number[], quats[b] as unknown as number[]));
  tracks.push(new THREE.VectorKeyframeTrack('hips.position', times as unknown as number[], hipPos as unknown as number[]));
  return new THREE.AnimationClip(name, duration, tracks);
}

export function buildClips() {
  return [
    clip('idle', 7.2, 96, idle, true),
    clip('walk', WALK.duration, 32, walk, true),
    clip('run', RUN.duration, 28, run, true),
    clip('wave', 1.9, 48, wave, false),
    clip('openDoor', 1.0, 30, openDoor, false),
  ];
}

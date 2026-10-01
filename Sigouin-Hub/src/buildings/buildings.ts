// The four building exteriors. Each is modelled in local space (front = +z, floor at y = 0),
// with a lit diorama behind the glass so the windows read as occupied rooms.
import * as THREE from 'three';
import { Batch, mat, rng } from '../core/util';
import { signTexture, screenTexture, type SignStyle } from '../core/textures';
import { applyNightGlow } from '../core/shaders';
import type { Mats } from '../world/materials';
import { BUILDINGS, toWorld, type BuildingSpec } from '../world/layout';
import type { Colliders } from '../core/collision';
import { DoubleDoor } from './door';
import { furnitureMats, desk, monitor, chair, grandPiano, drumKit, guitar, floorLamp, serverRack, plant, curvedDesk, screenMaterial, studioMonitor, lightPanel } from './furniture';
import { HoloBrain } from './brain';
import { buildIvy } from '../world/vegetation';
import type { BuildingId } from '../content/types';

export interface BuildingInstance {
  spec: BuildingSpec;
  name: string;
  group: THREE.Group;
  door: DoubleDoor;
  /** World-space point the "Enter" prompt floats at. */
  anchor: THREE.Vector3;
  /** Where the player stands facing the door (world XZ + heading). */
  stand: { x: number; z: number; heading: number };
  brain?: HoloBrain;
  update(dt: number, t: number): void;
}

export const NAMES: Record<BuildingId, string> = {
  'computer-lab': 'Computer Lab', 'music-studio': 'Music Studio', office: 'Office', 'ai-workspace': 'AI Workspace',
};

function litMat(color: number, strength: number, night = 1.6) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  m.emissive.set(color).multiplyScalar(strength);
  return applyNightGlow(m, 1, night);
}

function sign(text: string, style: SignStyle, w: number, h: number) {
  const map = signTexture(text, style, w / h);
  const material = style === 'backlit'
    ? screenMaterial(map, 1.6)
    : new THREE.MeshStandardMaterial({ map, roughness: style === 'wood' ? 0.7 : 0.85 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.name = `sign-${text}`;
  return m;
}

function rectHole(x0: number, y0: number, x1: number, y1: number) {
  const p = new THREE.Path();
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0);
  return p;
}
function archHole(x0: number, x1: number, y0: number, spring: number) {
  const p = new THREE.Path();
  const r = (x1 - x0) / 2, cx = (x0 + x1) / 2;
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, spring);
  p.absarc(cx, spring, r, 0, Math.PI, false);
  p.lineTo(x0, y0);
  return p;
}
/** A wall panel in the XY plane (x centred, y from 0) with openings, extruded towards -z. */
function wallWithHoles(width: number, height: number, depth: number, holes: THREE.Path[]) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(width / 2, height); s.lineTo(-width / 2, height); s.lineTo(-width / 2, 0);
  s.holes.push(...holes);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -depth);
  return g;
}

/** Vertical and horizontal glazing bars plus glass panes across an opening. */
function glazing(b: Batch, M: Mats, glassGroup: THREE.Group, x0: number, x1: number, y0: number, y1: number, z: number, cols: number, bar: THREE.Material, transom?: number) {
  const w = (x1 - x0) / cols;
  for (let i = 0; i <= cols; i++) b.box(bar, 0.07, y1 - y0, 0.09, x0 + i * w, (y0 + y1) / 2, z);
  b.box(bar, x1 - x0 + 0.07, 0.08, 0.1, (x0 + x1) / 2, y0, z);
  b.box(bar, x1 - x0 + 0.07, 0.08, 0.1, (x0 + x1) / 2, y1, z);
  if (transom) b.box(bar, x1 - x0, 0.06, 0.09, (x0 + x1) / 2, transom, z);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), M.glass);
  pane.position.set((x0 + x1) / 2, (y0 + y1) / 2, z + 0.01);
  pane.renderOrder = 1;
  glassGroup.add(pane);
}

interface Local { group: THREE.Group; door: DoubleDoor; doorZ: number; brain?: HoloBrain; tick?: (dt: number, t: number) => void }

function computerLab(s: BuildingSpec, M: Mats): Local {
  const { width: W, depth: D } = s, H = 4.4;
  const F = furnitureMats(true);
  const b = new Batch(), glass = new THREE.Group(), g = new THREE.Group();
  const zf = D / 2;
  b.box(M.stoneSmooth, W + 0.3, 0.2, D + 0.3, 0, 0.1, 0);
  b.box(M.stone, W, H, 0.35, 0, H / 2, -zf + 0.175);
  for (const sx of [-1, 1]) {
    b.box(M.stone, 0.35, H, D, sx * (W / 2 - 0.175), H / 2, 0);
    b.box(M.stone, 0.95, H, 0.55, sx * (W / 2 - 0.475), H / 2, zf - 0.275);
    b.box(M.stoneSmooth, 1.05, 0.25, 0.62, sx * (W / 2 - 0.475), 0.125, zf - 0.27);
  }
  b.box(M.stone, W, 1.3, 0.55, 0, H - 0.65, zf - 0.275);
  b.box(M.stoneSmooth, W + 0.55, 0.26, D + 0.55, 0, H + 0.13, 0);
  b.box(M.stoneSmooth, W + 0.2, 0.12, 0.12, 0, H - 1.32, zf + 0.02);
  b.box(M.stone, W + 0.3, 0.5, 0.35, 0, H + 0.5, zf + 0.08);
  b.box(M.frame, W - 0.3, 0.08, D - 0.3, 0, H + 0.3, 0);
  b.box(M.steel, 2.2, 0.9, 1.4, -3, H + 0.75, -1.5);
  b.box(M.steel, 1.2, 0.6, 1.2, 3.4, H + 0.6, -2.2);
  const x0 = -(W / 2 - 0.95), x1 = W / 2 - 0.95, gz = zf - 0.32, top = H - 1.3;
  glazing(b, M, glass, x0, -1.1, 0.25, top, gz, 3, M.frame, 0.7);
  glazing(b, M, glass, 1.1, x1, 0.25, top, gz, 3, M.frame, 0.7);
  b.box(M.frame, 2.35, 0.1, 0.12, 0, 2.85, gz);
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(2.2, top - 2.9), M.glass);
  tp.position.set(0, (top + 2.9) / 2, gz + 0.01);
  glass.add(tp);
  const sg = sign('Computer Lab', 'stone', 5.8, 1.0);
  sg.position.set(0, H - 0.64, zf + 0.004);
  g.add(sg);

  // Diorama: rows of desks with glowing monitors, a projector screen at the back.
  const floor = litMat(0x6d7784, 0.21), wall = litMat(0xe8ecf0, 0.33), ceil = litMat(0xf2f4f6, 0.36);
  b.box(floor, W - 0.7, 0.04, D - 0.7, 0, 0.21, 0);
  b.box(wall, W - 0.7, H - 1.3, 0.05, 0, (H - 1.3) / 2 + 0.2, -zf + 0.4);
  for (const sx of [-1, 1]) b.box(wall, 0.05, H - 1.3, D - 0.8, sx * (W / 2 - 0.37), (H - 1.3) / 2 + 0.2, 0);
  b.box(ceil, W - 0.7, 0.05, D - 0.7, 0, top + 0.05, 0);
  for (let i = -2; i <= 2; i++) lightPanel(b, F, mat(i * 2.3, top, 0.5), 1.2, 0.3);
  const scr = screenMaterial(screenTexture({ title: 'Coming soon', subtitle: 'Gaming projects', theme: 'blue' }), 1.5);
  for (const rz of [2.1, 0.1, -1.9]) {
    for (const rx of [-3.9, -1.3, 1.3, 3.9]) {
      const base = mat(rx, 0.2, rz);
      desk(b, F, base, 1.6, 0.7);
      g.add(monitor(b, F, base, scr, 0.62, 0.38));
      chair(b, F, mat(rx, 0.2, rz + 0.7, 0, 0.15 * Math.sin(rx * 3 + rz)));
    }
  }
  const proj = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), screenMaterial(screenTexture({ title: 'Coming soon', subtitle: 'Computer Lab', theme: 'blue', w: 1024, h: 576 }), 1.4));
  proj.position.set(0, 2.2, -zf + 0.44);
  g.add(proj);
  plant(b, F, mat(-W / 2 + 1.0, 0.2, zf - 1.0));
  plant(b, F, mat(W / 2 - 1.0, 0.2, zf - 1.0));

  const door = new DoubleDoor(2.2, 2.6, M.frame, M.glass, M.iron);
  door.group.position.set(0, 0.22, gz);
  g.add(b.build({ name: 'computer-lab' }), glass, door.group);
  return { group: g, door, doorZ: zf };
}

function musicStudio(s: BuildingSpec, M: Mats): Local {
  const { width: W, depth: D } = s, H = 3.5, peak = 2.7;
  const F = furnitureMats(true);
  const b = new Batch(), glass = new THREE.Group(), g = new THREE.Group();
  const zf = D / 2, t = 0.3;
  b.box(M.stone, W + 0.4, 0.34, D + 0.4, 0, 0.17, 0);
  b.box(M.timber, W, H, t, 0, H / 2 + 0.3, -zf + t / 2);
  for (const sx of [-1, 1]) b.box(M.timber, t, H, D, sx * (W / 2 - t / 2), H / 2 + 0.3, 0);
  const front = wallWithHoles(W, H, t, [rectHole(-1.15, 0.03, 1.15, 2.75), rectHole(-4.9, 0.55, -1.75, 2.85), rectHole(1.75, 0.55, 4.9, 2.85)]);
  b.add(front, M.timber, mat(0, 0.3, zf));
  // Gables.
  const tri = new THREE.Shape();
  tri.moveTo(-W / 2 - 0.05, 0); tri.lineTo(W / 2 + 0.05, 0); tri.lineTo(0, peak); tri.lineTo(-W / 2 - 0.05, 0);
  const gable = new THREE.ExtrudeGeometry(tri, { depth: t, bevelEnabled: false });
  b.add(gable, M.timber, mat(0, H + 0.3, zf - t));
  b.add(gable, M.timber, mat(0, H + 0.3, -zf));
  // Roof slabs with a deep porch overhang at the front.
  const theta = Math.atan2(peak, W / 2), L = Math.hypot(W / 2, peak) + 0.75;
  const roofD = D + 2.3, roofZ = 0.8;
  for (const sx of [-1, 1]) {
    const cx = sx * Math.cos(theta) * (L / 2) + sx * Math.sin(theta) * 0.12;
    const cy = H + 0.3 + peak + 0.14 - Math.sin(theta) * (L / 2) + Math.cos(theta) * 0.12;
    b.box(M.roof, L, 0.2, roofD, cx, cy, roofZ, 0, 0, -sx * theta);
    b.box(M.darkWood, 0.12, 0.3, roofD, sx * Math.cos(theta) * L, H + 0.3 + peak + 0.1 - Math.sin(theta) * L, roofZ, 0, 0, -sx * theta);
  }
  b.box(M.darkWood, 0.26, 0.3, roofD + 0.1, 0, H + 0.3 + peak + 0.14, roofZ);
  // Porch: posts, header beam, knee braces.
  const pz = zf + 1.45;
  for (const sx of [-1, 1]) {
    b.box(M.darkWood, 0.24, H, 0.24, sx * 2.35, H / 2 + 0.3, pz);
    b.box(M.stone, 0.42, 0.3, 0.42, sx * 2.35, 0.15, pz);
    b.box(M.darkWood, 0.14, 0.9, 0.14, sx * 1.95, H - 0.05, pz, 0, 0, sx * 0.78);
  }
  b.box(M.darkWood, 5.3, 0.3, 0.26, 0, H + 0.2, pz);
  for (let i = -3; i <= 3; i++) b.box(M.darkWood, 0.1, 0.18, 1.6, i * 0.85, H + 0.4, zf + 0.75);
  const sg = sign('Music Studio', 'wood', 4.6, 1.05);
  sg.position.set(0, H + 1.1, zf + 0.012);
  g.add(sg);
  // Window and door glazing in dark timber.
  glazing(b, M, glass, -4.9, -1.75, 0.85, 3.15, zf - 0.15, 3, M.darkWood, 2.35);
  glazing(b, M, glass, 1.75, 4.9, 0.85, 3.15, zf - 0.15, 3, M.darkWood, 2.35);
  b.box(M.darkWood, 2.45, 0.12, 0.34, 0, 3.08, zf - 0.15);

  // Diorama: warm studio.
  const floor = litMat(0x8a5a38, 0.27), wall = litMat(0xe9c9a0, 0.3, 1.8);
  b.box(floor, W - 0.7, 0.04, D - 0.7, 0, 0.36, 0);
  b.box(wall, W - 0.7, H, 0.05, 0, H / 2 + 0.3, -zf + 0.35);
  for (const sx of [-1, 1]) b.box(wall, 0.05, H, D - 0.7, sx * (W / 2 - 0.34), H / 2 + 0.3, 0);
  b.box(litMat(0x7a5236, 0.24), W - 0.6, 0.06, D - 0.6, 0, H + 0.25, 0);
  grandPiano(b, F, mat(-3.3, 0.36, 0.6, 0, 0.5));
  drumKit(b, F, mat(3.3, 0.36, 1.2, 0, -0.4));
  guitar(b, F, mat(-1.2, 1.9, -zf + 0.45), 'acoustic');
  guitar(b, F, mat(0, 1.9, -zf + 0.45), 'electric');
  guitar(b, F, mat(1.2, 1.9, -zf + 0.45), 'bass');
  floorLamp(b, F, mat(-1.4, 0.36, 2.9));
  floorLamp(b, F, mat(4.6, 0.36, -1.0));
  studioMonitor(b, F, mat(-0.8, 1.1, -2.6));
  studioMonitor(b, F, mat(0.8, 1.1, -2.6));
  const door = new DoubleDoor(2.3, 2.7, M.darkWood, M.glass, M.iron);
  door.group.position.set(0, 0.34, zf - 0.15);
  // Flowering vines up the porch posts.
  const vine: THREE.Vector3[] = [], vineN: THREE.Vector3[] = [];
  const r = rng(3);
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 150; k++) {
      const y = 0.3 + r() * (H - 0.2);
      const a = y * 3.2 + r() * 1.5;
      vine.push(new THREE.Vector3(sx * 2.35 + Math.cos(a) * 0.16, y, pz + Math.sin(a) * 0.16));
      vineN.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    for (let k = 0; k < 70; k++) {
      vine.push(new THREE.Vector3(sx * (2.35 - r() * 2.2), H + 0.05 + r() * 0.3, pz + (r() - 0.5) * 0.35));
      vineN.push(new THREE.Vector3(0, 1, 0));
    }
  }
  g.add(buildIvy(vine, 9, vineN));
  g.add(b.build({ name: 'music-studio' }), glass, door.group);
  return { group: g, door, doorZ: zf };
}

function office(s: BuildingSpec, M: Mats): Local {
  const { width: W, depth: D } = s, H = 5.0;
  const F = furnitureMats(true);
  const b = new Batch(), glass = new THREE.Group(), g = new THREE.Group();
  const zf = D / 2, t = 0.45;
  b.box(M.stoneSmooth, W + 0.3, 0.2, D + 0.3, 0, 0.1, 0);
  b.box(M.stoneWarm, W, H, 0.35, 0, H / 2, -zf + 0.175);
  for (const sx of [-1, 1]) b.box(M.stoneWarm, 0.35, H, D, sx * (W / 2 - 0.175), H / 2, 0);
  const front = wallWithHoles(W, H, t, [archHole(-1.25, 1.25, 0.2, 2.55), archHole(-4.35, -2.45, 0.95, 2.75), archHole(2.45, 4.35, 0.95, 2.75)]);
  b.add(front, M.stoneWarm, mat(0, 0, zf));
  for (const sx of [-1, 1]) {
    b.box(M.stoneSmooth, 0.6, H, 0.16, sx * (W / 2 - 0.3), H / 2, zf + 0.08);
    b.box(M.stoneSmooth, 2.2, 0.14, 0.24, sx * 3.4, 0.9, zf + 0.1);
  }
  b.box(M.stoneSmooth, W + 0.5, 0.32, D + 0.5, 0, H + 0.16, 0);
  b.box(M.stoneWarm, W + 0.3, 0.55, 0.35, 0, H + 0.58, zf + 0.08);
  b.box(M.stoneSmooth, 0.36, 0.5, 0.2, 0, 3.72, zf + 0.06);
  b.box(M.frame, W - 0.3, 0.08, D - 0.3, 0, H + 0.36, 0);
  // Arch door glazing and fanlight.
  const fan = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32, 0, Math.PI), M.glass);
  fan.position.set(0, 2.55, zf - 0.25);
  glass.add(fan);
  for (let i = 1; i < 5; i++) {
    const a = (i / 5) * Math.PI;
    b.box(M.iron, 0.04, 1.2, 0.04, Math.cos(a) * 0.6, 2.55 + Math.sin(a) * 0.6, zf - 0.25, 0, 0, a - Math.PI / 2);
  }
  b.box(M.iron, 2.5, 0.07, 0.08, 0, 2.55, zf - 0.25);
  for (const [cx] of [[-3.4], [3.4]]) {
    glazing(b, M, glass, cx - 0.95, cx + 0.95, 0.95, 2.75, zf - 0.25, 2, M.iron, 1.9);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24, 0, Math.PI), M.glass);
    top.position.set(cx, 2.75, zf - 0.25);
    glass.add(top);
  }
  const sg = sign('Office', 'stone', 3.6, 0.9);
  sg.position.set(0, 4.38, zf + 0.004);
  g.add(sg);
  // Wall sconces either side of the arch.
  for (const sx of [-1, 1]) {
    b.box(M.iron, 0.06, 0.06, 0.3, sx * 1.85, 2.9, zf + 0.15);
    b.add(new THREE.CylinderGeometry(0.1, 0.08, 0.32, 6), M.lantern, mat(sx * 1.85, 2.72, zf + 0.3));
    b.add(new THREE.ConeGeometry(0.15, 0.14, 6), M.iron, mat(sx * 1.85, 2.95, zf + 0.3));
  }
  // Diorama: warm office with dual monitors.
  const floor = litMat(0x9c8468, 0.24), wall = litMat(0xf1e6d2, 0.3, 1.7);
  b.box(floor, W - 0.7, 0.04, D - 0.7, 0, 0.21, 0);
  b.box(wall, W - 0.7, H - 0.4, 0.05, 0, (H - 0.4) / 2 + 0.2, -zf + 0.36);
  for (const sx of [-1, 1]) b.box(wall, 0.05, H - 0.4, D - 0.7, sx * (W / 2 - 0.36), (H - 0.4) / 2 + 0.2, 0);
  b.box(litMat(0xf6efe4, 0.33), W - 0.7, 0.05, D - 0.7, 0, 3.9, 0);
  const scr = screenMaterial(screenTexture({ title: 'All systems normal', subtitle: '3 hosts · 42 services', theme: 'dark' }), 1.4);
  for (const [dx, dz, yaw] of [[-3.4, 1.4, 0], [3.4, 1.4, 0], [-1.6, -1.6, 0.3], [1.9, -1.8, -0.2]] as const) {
    const base = mat(dx, 0.2, dz, 0, yaw);
    desk(b, F, base, 1.7, 0.75);
    g.add(monitor(b, F, base.clone().multiply(mat(-0.34, 0, 0)), scr, 0.55, 0.33, 0.12));
    g.add(monitor(b, F, base.clone().multiply(mat(0.34, 0, 0)), scr, 0.55, 0.33, -0.12));
    chair(b, F, base.clone().multiply(mat(0, 0, 0.7)));
  }
  for (const x of [-4.2, -3.5]) serverRack(b, F, mat(x, 0.2, -zf + 1.0));
  plant(b, F, mat(4.5, 0.2, -zf + 1.0), 1.3);
  const door = new DoubleDoor(2.3, 2.35, M.iron, M.glass, M.iron);
  door.group.position.set(0, 0.2, zf - 0.25);
  g.add(b.build({ name: 'office' }), glass, door.group);
  return { group: g, door, doorZ: zf };
}

function aiWorkspace(s: BuildingSpec, M: Mats): Local {
  const { width: W, depth: D } = s, H = 4.6;
  const F = furnitureMats(true);
  const b = new Batch(), glass = new THREE.Group(), g = new THREE.Group();
  const zf = D / 2;
  const panel = new THREE.MeshStandardMaterial({ color: 0x33373e, roughness: 0.55, metalness: 0.5 });
  b.box(new THREE.MeshStandardMaterial({ color: 0x8d8c88, roughness: 0.85 }), W + 0.4, 0.22, D + 0.4, 0, 0.11, 0);
  b.box(panel, W, H, 0.3, 0, H / 2, -zf + 0.15);
  b.box(panel, 0.3, H, D, -W / 2 + 0.15, H / 2, 0);
  const cols = 5;
  for (let i = 0; i <= cols; i++) {
    const x = -W / 2 + 0.15 + (i * (W - 0.3)) / cols;
    b.box(M.steel, 0.3, H, 0.34, x, H / 2, zf - 0.17);
  }
  for (let i = 0; i <= 3; i++) b.box(M.steel, 0.34, H, 0.3, W / 2 - 0.17, H / 2, -zf + 0.15 + (i * (D - 0.3)) / 3);
  b.box(M.steel, W + 0.1, 1.2, 0.4, 0, H - 0.6, zf - 0.2);
  b.box(M.steel, W + 0.7, 0.36, D + 0.7, 0, H + 0.18, 0);
  b.box(M.frame, W + 0.72, 0.08, D + 0.72, 0, H + 0.4, 0);
  // Roof vents and plant.
  for (const [x, z] of [[-4, -2], [-2.4, -2.6], [4.5, 2]]) {
    b.add(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 16), M.steel, mat(x, H + 0.8, z));
    b.add(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16), M.frame, mat(x, H + 1.24, z));
  }
  b.box(M.steel, 2.6, 1.0, 1.6, 1.2, H + 0.9, -2.2);
  for (let i = 0; i < 8; i++) b.box(M.frame, 0.04, 0.8, 1.5, 0.05 + i * 0.3, H + 0.9, -1.38);
  // Curtain wall glazing, front and right side.
  const top = H - 1.2;
  glazing(b, M, glass, -W / 2 + 0.3, -1.2, 0.22, top, zf - 0.2, 3, M.frame, 3.0);
  glazing(b, M, glass, 1.2, W / 2 - 0.3, 0.22, top, zf - 0.2, 3, M.frame, 3.0);
  b.box(M.frame, 2.5, 0.12, 0.12, 0, 2.95, zf - 0.2);
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, top - 3.0), M.glass);
  tp.position.set(0, (top + 3.0) / 2, zf - 0.19);
  glass.add(tp);
  const side = new THREE.Group();
  const sb = new Batch();
  glazing(sb, M, side, -D / 2 + 0.3, D / 2 - 0.4, 0.22, top, 0, 3, M.frame, 3.0);
  const sideG = sb.build();
  sideG.add(side);
  sideG.rotation.y = Math.PI / 2;
  sideG.position.set(W / 2 - 0.2, 0, 0);
  g.add(sideG);
  const sg = new THREE.Group();
  b.box(new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.4 }), 6.3, 1.1, 0.2, 0, H - 0.6, zf + 0.1);
  const face = sign('AI Workspace', 'backlit', 6.1, 0.95);
  face.position.set(0, H - 0.6, zf + 0.205);
  sg.add(face);
  g.add(sg);
  // Diorama: cool lab with the hologram visible through the glass.
  const floor = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.25, metalness: 0.2 });
  const wall = litMat(0x27344a, 0.3, 1.4);
  b.box(floor, W - 0.6, 0.04, D - 0.6, 0, 0.23, 0);
  b.box(wall, W - 0.6, H - 0.6, 0.05, 0, (H - 0.6) / 2 + 0.2, -zf + 0.33);
  b.box(wall, 0.05, H - 0.6, D - 0.6, -W / 2 + 0.33, (H - 0.6) / 2 + 0.2, 0);
  b.box(litMat(0x1d2536, 0.24), W - 0.6, 0.05, D - 0.6, 0, top + 0.1, 0);
  for (const z of [-3, 0, 3]) b.box(F.accentBlue, W - 1, 0.04, 0.06, 0, top + 0.05, z);
  const term = screenMaterial(screenTexture({ title: '$ agent run --verify', subtitle: 'all checks passed', theme: 'cyan' }), 1.5);
  curvedDesk(b, F, mat(2.8, 0.22, -0.6), 1.8, 1.9);
  for (const a of [-0.55, 0, 0.55]) {
    const base = mat(2.8 + Math.sin(a) * 1.8, 0.22, -0.6 + Math.cos(a) * 1.8, 0, a);
    g.add(monitor(b, F, base, term, 0.6, 0.36));
  }
  const brain = new HoloBrain(4200, 0.9);
  brain.group.position.set(-2.4, 1.75, 0.9);
  b.add(new THREE.CylinderGeometry(0.62, 0.72, 0.8, 32), M.steel, mat(-2.4, 0.62, 0.9));
  const door = new DoubleDoor(2.3, 2.7, M.frame, M.glass, M.chrome);
  door.group.position.set(0, 0.22, zf - 0.2);
  g.add(b.build({ name: 'ai-workspace' }), glass, door.group, brain.group);
  return { group: g, door, doorZ: zf - 0.2, brain, tick: (_dt, t) => brain.update(t) };
}

export function buildBuildings(M: Mats, colliders: Colliders): BuildingInstance[] {
  const makers: Record<BuildingId, (s: BuildingSpec, M: Mats) => Local> = {
    'computer-lab': computerLab, 'music-studio': musicStudio, office, 'ai-workspace': aiWorkspace,
  };
  return BUILDINGS.map((spec) => {
    const local = makers[spec.id](spec, M);
    local.group.position.set(spec.x, 0, spec.z);
    local.group.rotation.y = spec.yaw;
    local.group.name = spec.id;
    local.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && !(mesh.material as THREE.Material).transparent) { mesh.castShadow = true; mesh.receiveShadow = true; }
    });
    colliders.box(spec.x, spec.z, spec.width / 2, spec.depth / 2, spec.yaw, 7);
    if (spec.id === 'music-studio') {
      for (const sx of [-1, 1]) {
        const [px, pz] = toWorld(spec, sx * 2.35, spec.depth / 2 + 1.45);
        colliders.circle(px, pz, 0.28, 4);
      }
    }
    const [ax, az] = toWorld(spec, 0, spec.depth / 2 + 0.6);
    const [sx, sz] = toWorld(spec, 0, spec.depth / 2 + 1.5);
    return {
      spec,
      name: NAMES[spec.id],
      group: local.group,
      door: local.door,
      anchor: new THREE.Vector3(ax, 2.2, az),
      stand: { x: sx, z: sz, heading: spec.yaw + Math.PI },
      brain: local.brain,
      update(dt: number, t: number) {
        local.door.update(dt);
        local.tick?.(dt, t);
      },
    };
  });
}

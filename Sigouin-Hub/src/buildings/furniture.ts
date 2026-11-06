// Furniture and equipment shared by the storefront dioramas (seen through the windows) and the
// full interiors. Static parts go into a Batch; screens come back as separate meshes so each can
// carry its own texture.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Batch, mat, boxM } from '../core/util';
import { applyNightGlow } from '../core/shaders';

export interface FMats {
  oak: THREE.MeshStandardMaterial;
  walnut: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  fabric: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  pianoBlack: THREE.MeshStandardMaterial;
  ivory: THREE.MeshStandardMaterial;
  drumRed: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  foam: THREE.MeshStandardMaterial;
  foamAccent: THREE.MeshStandardMaterial;
  rack: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  pot: THREE.MeshStandardMaterial;
  sunburst: THREE.MeshStandardMaterial;
  guitarRed: THREE.MeshStandardMaterial;
  lampShade: THREE.MeshStandardMaterial;
  accentBlue: THREE.MeshStandardMaterial;
}

function std(color: number, roughness: number, metalness = 0, lit = false) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  if (lit) {
    // Storefront dioramas have no lights of their own: a soft self-glow stands in for them.
    m.emissive.set(color).multiplyScalar(0.4);
    applyNightGlow(m, 0.9, 1.3);
  }
  return m;
}

const cache = new Map<boolean, FMats>();
export function furnitureMats(lit: boolean): FMats {
  const hit = cache.get(lit);
  if (hit) return hit;
  const shade = applyNightGlow(new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffc98a, emissiveIntensity: 1.6, roughness: 0.8 }), 1, 1.6);
  const blue = applyNightGlow(new THREE.MeshStandardMaterial({ color: 0x0a1830, emissive: 0x3d8bff, emissiveIntensity: 2.2, roughness: 0.5 }), 1, 1.3);
  const m: FMats = {
    oak: std(0xb48a5e, 0.55, 0, lit),
    walnut: std(0x6a4128, 0.5, 0, lit),
    white: std(0xeeeae4, 0.45, 0, lit),
    black: std(0x1b1c1f, 0.45, 0.2, lit),
    plastic: std(0x2c2f35, 0.5, 0, lit),
    fabric: std(0x39414f, 0.92, 0, lit),
    chrome: std(0xc9cdd2, 0.22, 0.9, lit),
    pianoBlack: std(0x0c0c0e, 0.12, 0.1, lit),
    ivory: std(0xf5f0e4, 0.35, 0, lit),
    drumRed: std(0x8e1f26, 0.3, 0.2, lit),
    brass: std(0xc9a24a, 0.3, 0.9, lit),
    foam: std(0x2e2f36, 0.98, 0, lit),
    foamAccent: std(0x5b2a3a, 0.98, 0, lit),
    rack: std(0x15171b, 0.5, 0.5, lit),
    leaf: std(0x3f6e2f, 0.8, 0, lit),
    pot: std(0xcfc3b0, 0.8, 0, lit),
    sunburst: std(0xb4642a, 0.3, 0, lit),
    guitarRed: std(0xa3252d, 0.25, 0.1, lit),
    lampShade: shade,
    accentBlue: blue,
  };
  cache.set(lit, m);
  return m;
}

type T = THREE.Matrix4;
const at = (base: T, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s = 1) => base.clone().multiply(mat(x, y, z, rx, ry, rz, s));

export function screenMaterial(map: THREE.Texture, boost = 1.35) {
  const m = new THREE.MeshBasicMaterial({ map, toneMapped: true });
  m.color.setScalar(boost);
  return m;
}

export function desk(b: Batch, f: FMats, base: T, w = 1.5, d = 0.72) {
  b.add(boxM(w, 0.035, d), f.oak, at(base, 0, 0.74, 0));
  for (const sx of [-1, 1]) b.add(boxM(0.04, 0.72, d - 0.08), f.white, at(base, sx * (w / 2 - 0.05), 0.36, 0));
  b.add(boxM(w - 0.1, 0.35, 0.02), f.white, at(base, 0, 0.5, -d / 2 + 0.05));
}

/** Monitor on a stand. Returns the screen mesh (caller assigns material). */
export function monitor(b: Batch, f: FMats, base: T, screenMat: THREE.Material, w = 0.6, h = 0.36, yaw = 0) {
  const m = at(base, 0, 0, 0, 0, yaw);
  b.add(boxM(0.22, 0.015, 0.16), f.plastic, at(m, 0, 0.765, -0.05));
  b.add(boxM(0.04, 0.26, 0.03), f.plastic, at(m, 0, 0.89, -0.08));
  b.add(boxM(w + 0.03, h + 0.03, 0.03), f.black, at(m, 0, 1.03, -0.05));
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat);
  s.applyMatrix4(at(m, 0, 1.03, -0.033));
  return s;
}

export function chair(b: Batch, f: FMats, base: T) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    b.add(boxM(0.3, 0.03, 0.04), f.plastic, at(base, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, 0, -a));
    b.add(new THREE.SphereGeometry(0.03, 6, 4), f.black, at(base, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29));
  }
  b.add(new THREE.CylinderGeometry(0.025, 0.03, 0.36, 8), f.chrome, at(base, 0, 0.26, 0));
  b.add(new RoundedBoxGeometry(0.5, 0.08, 0.48, 2, 0.03), f.fabric, at(base, 0, 0.47, 0));
  b.add(new RoundedBoxGeometry(0.46, 0.56, 0.07, 2, 0.03), f.fabric, at(base, 0, 0.82, 0.24, 0.12));
  b.add(boxM(0.04, 0.34, 0.04), f.plastic, at(base, 0, 0.62, 0.23, 0.1));
  for (const sx of [-1, 1]) b.add(boxM(0.05, 0.03, 0.26), f.plastic, at(base, sx * 0.26, 0.66, 0.02));
}

export function plant(b: Batch, f: FMats, base: T, s = 1) {
  const pot = new THREE.CylinderGeometry(0.2, 0.15, 0.4, 14);
  b.add(pot, f.pot, at(base, 0, 0.2 * s, 0, 0, 0, 0, s));
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, rr = 0.1 + (i % 3) * 0.06;
    b.add(new THREE.IcosahedronGeometry(0.16, 1), f.leaf, at(base, Math.cos(a) * rr * s, (0.5 + (i % 4) * 0.14) * s, Math.sin(a) * rr * s, a, a, 0, s));
  }
}

export function grandPiano(b: Batch, f: FMats, base: T) {
  // Classic grand outline: straight bass side, curved treble tail.
  const sh = new THREE.Shape();
  sh.moveTo(-0.75, 0);
  sh.lineTo(0.75, 0);
  sh.lineTo(0.75, 0.55);
  sh.bezierCurveTo(0.7, 1.1, 0.25, 1.05, 0.12, 1.45);
  sh.bezierCurveTo(0.0, 1.85, -0.2, 1.95, -0.45, 1.9);
  sh.bezierCurveTo(-0.7, 1.85, -0.75, 1.6, -0.75, 1.3);
  sh.lineTo(-0.75, 0);
  const body = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 });
  body.rotateX(Math.PI / 2);
  b.add(body, f.pianoBlack, at(base, 0, 1.0, 0));
  const lid = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false, curveSegments: 24 });
  lid.rotateX(Math.PI / 2);
  // Lid hinged on the straight side, propped open over the curved side.
  b.add(lid, f.pianoBlack, at(base, -0.75, 1.02, 0, 0, 0, 0.62).multiply(mat(0.75, 0, 0)));
  b.add(boxM(0.015, 0.75, 0.015), f.pianoBlack, at(base, 0.45, 1.33, 0.75, 0, 0, 0.35));
  for (const [x, z] of [[-0.65, 0.15], [0.65, 0.15], [-0.35, 1.7]]) {
    b.add(new THREE.CylinderGeometry(0.05, 0.04, 0.7, 10), f.pianoBlack, at(base, x, 0.35, z));
    b.add(new THREE.SphereGeometry(0.045, 8, 6), f.brass, at(base, x, 0.02, z));
  }
  // Keyboard.
  b.add(boxM(1.5, 0.05, 0.28), f.pianoBlack, at(base, 0, 0.72, -0.12));
  b.add(boxM(1.4, 0.03, 0.16), f.ivory, at(base, 0, 0.76, -0.14));
  for (let i = 0; i < 36; i++) {
    const k = i % 7;
    if (k === 2 || k === 6) continue;
    b.add(boxM(0.014, 0.025, 0.09), f.pianoBlack, at(base, -0.68 + i * 0.0385 + 0.02, 0.785, -0.1));
  }
  b.add(boxM(1.4, 0.2, 0.03), f.pianoBlack, at(base, 0, 0.9, -0.02));
  // Bench.
  b.add(new RoundedBoxGeometry(0.8, 0.08, 0.36, 2, 0.02), f.fabric, at(base, 0, 0.5, -0.65));
  for (const sx of [-1, 1]) b.add(boxM(0.05, 0.46, 0.3), f.pianoBlack, at(base, sx * 0.34, 0.23, -0.65));
}

function guitarBody(scale: number) {
  const sh = new THREE.Shape();
  const lower = 0.19 * scale, upper = 0.14 * scale, waist = 0.11 * scale;
  sh.moveTo(0, -0.24 * scale);
  sh.bezierCurveTo(lower * 1.35, -0.24 * scale, lower * 1.2, 0.02 * scale, waist, 0.06 * scale);
  sh.bezierCurveTo(upper * 1.2, 0.1 * scale, upper * 1.2, 0.3 * scale, 0, 0.3 * scale);
  sh.bezierCurveTo(-upper * 1.2, 0.3 * scale, -upper * 1.2, 0.1 * scale, -waist, 0.06 * scale);
  sh.bezierCurveTo(-lower * 1.2, 0.02 * scale, -lower * 1.35, -0.24 * scale, 0, -0.24 * scale);
  return sh;
}

export function guitar(b: Batch, f: FMats, base: T, kind: 'acoustic' | 'electric' | 'bass') {
  const scale = kind === 'acoustic' ? 1.15 : 0.9;
  const depth = kind === 'acoustic' ? 0.1 : 0.045;
  const body = new THREE.ExtrudeGeometry(guitarBody(scale), { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 18 });
  const bm = kind === 'acoustic' ? f.sunburst : kind === 'electric' ? f.guitarRed : f.black;
  b.add(body, bm, at(base, 0, 0, -depth));
  if (kind === 'acoustic') b.add(new THREE.CircleGeometry(0.05, 18), f.black, at(base, 0, 0.08, 0.003));
  else b.add(boxM(0.1, 0.12, 0.004), f.white, at(base, 0.04, -0.05, 0.004));
  const nl = kind === 'bass' ? 0.72 : 0.5;
  b.add(boxM(0.05, nl, 0.025), f.walnut, at(base, 0, 0.3 * scale + nl / 2 - 0.02, -0.01));
  b.add(boxM(0.08, 0.16, 0.02), f.walnut, at(base, 0, 0.3 * scale + nl + 0.06, -0.012));
  b.add(boxM(0.02, 0.05, 0.03), f.chrome, at(base, 0, 0.3 * scale + nl + 0.2, -0.02));
}

export function drumKit(b: Batch, f: FMats, base: T) {
  const drum = (r: number, h: number, x: number, y: number, z: number, rx = 0, rz = 0) => {
    b.add(new THREE.CylinderGeometry(r, r, h, 24), f.drumRed, at(base, x, y, z, rx, 0, rz));
    for (const s of [-1, 1]) {
      const head = new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.012, 24);
      b.add(head, f.ivory, at(base, x, y, z, rx, 0, rz).multiply(mat(0, (s * h) / 2, 0)));
    }
  };
  drum(0.28, 0.4, 0, 0.3, 0, Math.PI / 2);
  drum(0.17, 0.14, 0.45, 0.58, 0.25, 0.1);
  drum(0.13, 0.13, -0.18, 0.78, 0.05, 0.3);
  drum(0.13, 0.13, 0.18, 0.78, 0.05, 0.3);
  drum(0.2, 0.38, -0.55, 0.3, 0.3);
  for (const [x, z, y, r] of [[0.65, -0.1, 1.05, 0.22], [-0.55, -0.2, 1.3, 0.26], [0.35, -0.35, 1.35, 0.28]]) {
    b.add(new THREE.CylinderGeometry(0.008, 0.01, y, 6), f.chrome, at(base, x, y / 2, z));
    b.add(new THREE.ConeGeometry(r, 0.03, 24, 1, true), f.brass, at(base, x, y + 0.01, z));
  }
  b.add(new RoundedBoxGeometry(0.34, 0.08, 0.34, 2, 0.03), f.fabric, at(base, 0.05, 0.5, 0.75));
  b.add(new THREE.CylinderGeometry(0.02, 0.03, 0.46, 6), f.chrome, at(base, 0.05, 0.23, 0.75));
}

export function studioMonitor(b: Batch, f: FMats, base: T) {
  b.add(new RoundedBoxGeometry(0.22, 0.34, 0.26, 2, 0.02), f.black, at(base, 0, 0.17, 0));
  b.add(new THREE.CircleGeometry(0.08, 18), f.plastic, at(base, 0, 0.12, 0.131));
  b.add(new THREE.CircleGeometry(0.03, 12), f.chrome, at(base, 0, 0.26, 0.131));
}

export function mixingDesk(b: Batch, f: FMats, base: T) {
  b.add(boxM(2.2, 0.75, 0.9), f.walnut, at(base, 0, 0.375, 0));
  b.add(boxM(1.9, 0.08, 0.72), f.black, at(base, 0, 0.8, 0.04, 0.2));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 20; c++) {
    b.add(boxM(0.035, 0.02, 0.05), c % 5 === 0 ? f.ivory : f.chrome, at(base, -0.85 + c * 0.09, 0.85 + r * 0.035, 0.28 - r * 0.2, 0.2));
  }
}

export function keyboardStand(b: Batch, f: FMats, base: T) {
  b.add(boxM(1.2, 0.08, 0.32), f.black, at(base, 0, 0.9, 0));
  b.add(boxM(1.1, 0.02, 0.14), f.ivory, at(base, 0, 0.945, 0.06));
  for (let i = 0; i < 28; i++) if (i % 7 !== 2 && i % 7 !== 6) b.add(boxM(0.012, 0.02, 0.08), f.black, at(base, -0.52 + i * 0.038, 0.96, 0.03));
  for (const s of [-1, 1]) b.add(boxM(0.04, 0.9, 0.04), f.chrome, at(base, s * 0.35, 0.45, 0, 0, 0, s * 0.35));
}

export function floorLamp(b: Batch, f: FMats, base: T) {
  b.add(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 16), f.black, at(base, 0, 0.015, 0));
  b.add(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 8), f.brass, at(base, 0, 0.76, 0));
  b.add(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 20, 1, true), f.lampShade, at(base, 0, 1.58, 0));
}

export function foamWall(b: Batch, f: FMats, base: T, cols: number, rows: number, size = 0.5) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const accent = (r + c * 3) % 7 === 0;
    const g = new THREE.ConeGeometry(size * 0.7, 0.08, 4);
    g.rotateY(Math.PI / 4);
    g.rotateX(Math.PI / 2);
    b.add(g, accent ? f.foamAccent : f.foam, at(base, (c - (cols - 1) / 2) * size, r * size, 0.04));
  }
}

export function serverRack(b: Batch, f: FMats, base: T) {
  b.add(boxM(0.62, 2.1, 1.0), f.rack, at(base, 0, 1.05, 0));
  for (let u = 0; u < 12; u++) b.add(boxM(0.54, 0.12, 0.02), u % 3 === 0 ? f.plastic : f.black, at(base, 0, 0.2 + u * 0.15, 0.505));
}

export function whiteboard(b: Batch, f: FMats, base: T, w = 2.4, h = 1.2) {
  b.add(boxM(w + 0.06, h + 0.06, 0.03), f.chrome, at(base, 0, 0, 0));
  b.add(boxM(w, 0.04, 0.08), f.chrome, at(base, 0, -h / 2 - 0.02, 0.05));
}

export function curvedDesk(b: Batch, f: FMats, base: T, radius: number, arc: number) {
  const top = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 40, 1, -arc / 2 - Math.PI / 2, arc);
  top.rotateX(-Math.PI / 2);
  b.add(top, f.white, at(base, 0, 0.75, 0));
  const skirt = new THREE.CylinderGeometry(radius + 0.35, radius + 0.35, 0.7, 40, 1, true, -arc / 2, arc);
  b.add(skirt, f.plastic, at(base, 0, 0.37, 0));
}

export function lightPanel(b: Batch, f: FMats, base: T, w: number, d: number) {
  b.add(boxM(w, 0.03, d), f.lampShade, at(base, 0, 0, 0));
}

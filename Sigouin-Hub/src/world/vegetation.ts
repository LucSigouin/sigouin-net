// Grass, flower beds, clipped shrubs, ivy and urn planting. Leaves and petals are alpha-cut cards
// textured from the painted foliage atlas; grass is instanced blade geometry. Every plant
// material sways through the shared wind uniform.
import * as THREE from 'three';
import { applyWind } from '../core/shaders';
import { rng, fbm } from '../core/util';
import { surfaceAt, boundarySDF, FOUNTAIN } from './layout';
import { GROUND } from './ground';
import { CELL, foliageMaterial } from './foliage';
import { Cards, fromCentre, perpendicular } from './plantGeo';

export { buildTrees } from './trees';

const UP = new THREE.Vector3(0, 1, 0);
const dummy = new THREE.Object3D();
const tmpC = new THREE.Color();

/** Seven thin, curved blades; darker and cooler at the root, warmer at the tip. */
function grassTuft() {
  const r = rng(8);
  const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [];
  const root = new THREE.Color(), tip = new THREE.Color(), c = new THREE.Color();
  for (let b = 0; b < 7; b++) {
    const h = 0.08 + r() * 0.13, w = 0.007 + r() * 0.006;
    const a = r() * Math.PI * 2, lean = 0.02 + r() * 0.09;
    const ox = (r() - 0.5) * 0.16, oz = (r() - 0.5) * 0.16;
    const wx = Math.cos(a), wz = Math.sin(a), lx = -wz, lz = wx;
    const dry = r() < 0.12;
    root.setHSL(0.26, 0.45, 0.14, THREE.SRGBColorSpace);
    tip.setHSL(dry ? 0.16 : 0.22 + r() * 0.04, dry ? 0.35 : 0.5, dry ? 0.5 : 0.36 + r() * 0.1, THREE.SRGBColorSpace);
    const start = pos.length / 3;
    const ts = [0, 0.4, 0.75];
    for (const t of ts) {
      const ww = w * (1 - t * 0.65), bend = lean * t * t;
      for (const s of [-1, 1]) {
        pos.push(ox + wx * ww * s + lx * bend, h * t, oz + wz * ww * s + lz * bend);
        nor.push(lx * 0.35, 1, lz * 0.35);
        c.copy(root).lerp(tip, t);
        col.push(c.r, c.g, c.b);
      }
    }
    pos.push(ox + lx * lean, h, oz + lz * lean);
    nor.push(lx * 0.35, 1, lz * 0.35);
    col.push(tip.r, tip.g, tip.b);
    for (let k = 0; k < ts.length - 1; k++) {
      const a0 = start + k * 2;
      idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
    }
    const last = start + (ts.length - 1) * 2;
    idx.push(last, last + 1, last + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor.map((v, i, arr) => {
    const k = i - (i % 3), l = Math.hypot(arr[k], arr[k + 1], arr[k + 2]);
    return v / l;
  }), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/** A flower head lying roughly face-up at p, diameter d. */
function bloom(cards: Cards, r: () => number, p: THREE.Vector3, d: number, cell: number, color: THREE.Color, outward: THREE.Vector3) {
  const face = new THREE.Vector3((r() - 0.5) * 0.9, 1, (r() - 0.5) * 0.9).addScaledVector(outward, 0.4).normalize();
  const right = perpendicular(face).applyAxisAngle(face, r() * Math.PI * 2);
  const up = new THREE.Vector3().crossVectors(face, right);
  const base = p.clone().addScaledVector(up, -d / 2);
  cards.quad(base, up, right, d, d, cell, color, (o, _q, f) => o.copy(f).multiplyScalar(Math.sign(f.y) || 1).lerp(UP, 0.35));
}

/** Two or three crossed vertical cards through p: spikes and mopheads read from any side. */
function crossed(cards: Cards, r: () => number, base: THREE.Vector3, w: number, h: number, cell: number, color: THREE.Color, planes: number, centre?: THREE.Vector3) {
  const a0 = r() * Math.PI;
  const up = new THREE.Vector3((r() - 0.5) * 0.15, 1, (r() - 0.5) * 0.15).normalize();
  const nfn = centre ? fromCentre(centre, 0.1) : (o: THREE.Vector3, _q: THREE.Vector3, f: THREE.Vector3) => o.copy(f).lerp(UP, 0.6);
  for (let k = 0; k < planes; k++) {
    const a = a0 + (k / planes) * Math.PI;
    cards.quad(base, up, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), w, h, cell, color, nfn);
  }
}

const FLOWER_CELLS = [CELL.cosmos, CELL.daisy, CELL.rose, CELL.aster, CELL.zinnia, CELL.forgetMeNot, CELL.cosmos, CELL.daisy];
const FLOWER_SIZE: Record<number, number> = {
  [CELL.cosmos]: 0.1, [CELL.daisy]: 0.085, [CELL.rose]: 0.09, [CELL.aster]: 0.07, [CELL.zinnia]: 0.095, [CELL.forgetMeNot]: 0.15,
};
const SPIKE_TINTS = [new THREE.Color(1, 1, 1), new THREE.Color(0.72, 0.55, 1), new THREE.Color(0.55, 0.62, 1)];
const HYD_TINTS = [new THREE.Color(0.97, 0.97, 0.95), new THREE.Color(1, 0.72, 0.86), new THREE.Color(0.68, 0.78, 1)];

/**
 * One planted clump: a mound of leaf cards with flower heads on top. Returns its top height.
 * `flowerCell` picks the flower; beds use drifts so neighbours match, like real planting.
 */
function clump(foliage: Cards, blooms: Cards, r: () => number, c: THREE.Vector3, s: number, leafCell: number, flowerCell: number, flowers: number, light: number) {
  const n = 9 + Math.floor(r() * 5);
  const nfn = fromCentre(c.clone().add(new THREE.Vector3(0, -s * 0.9, 0)), 0.2);
  const green = new THREE.Color();
  const warm = (r() - 0.5) * 0.1;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + r() * 0.6, tilt = 0.2 + r() * 0.8;
    const up = new THREE.Vector3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a));
    const right = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).applyAxisAngle(up, (r() - 0.5) * 0.8);
    const h = s * (1.2 + r() * 0.6);
    const base = c.clone().add(new THREE.Vector3(Math.cos(a) * s * 0.15, -0.03, Math.sin(a) * s * 0.15));
    const k0 = light * (0.8 + r() * 0.25);
    green.setRGB(k0 * (1 + warm), k0, k0 * (1 - warm));
    foliage.quad(base, up, right, h * 0.9, h, leafCell, green, nfn);
  }
  const top = s * 1.05;
  const white = new THREE.Color();
  const size = FLOWER_SIZE[flowerCell] ?? 0.09;
  for (let k = 0; k < flowers; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * 0.95;
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const p = c.clone().add(new THREE.Vector3(out.x * d, top * (0.8 + r() * 0.3) - d * 0.35, out.z * d));
    const v = 0.9 + r() * 0.15;
    bloom(blooms, r, p, size * (0.8 + r() * 0.4), flowerCell, white.setRGB(v, v, v), out.multiplyScalar(d / s));
  }
  return top;
}

export interface Vegetation {
  group: THREE.Group;
  grass: THREE.InstancedMesh;
  flowerMeshes: THREE.Mesh[];
  bedSpots: [number, number][];
  setDensity(grass: number, flowers: number): void;
}

export function buildVegetation(): Vegetation {
  const group = new THREE.Group();
  group.name = 'vegetation';
  const r = rng(31);

  // ---- Grass tufts on the lawns (placed once at full density; tiers draw a prefix).
  const MAX_GRASS = 48000;
  const grassMat = applyWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }), 0.24, 0.045, 1.9);
  const grass = new THREE.InstancedMesh(grassTuft(), grassMat, MAX_GRASS);
  grass.name = 'grass';
  grass.receiveShadow = true;
  let gi = 0, tries = 0;
  while (gi < MAX_GRASS && tries++ < MAX_GRASS * 6) {
    const x = GROUND.x0 + 1 + r() * (GROUND.x1 - GROUND.x0 - 2), z = GROUND.z0 + 1 + r() * (GROUND.z1 - GROUND.z0 - 2);
    if (boundarySDF(x, z) > 6) continue;
    if (surfaceAt(x, z, fbm(x * 0.35, z * 0.35, 2)) !== 'lawn') continue;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, r() * Math.PI * 2, 0);
    const s = 0.75 + r() * 0.6;
    dummy.scale.set(s, s * (0.75 + r() * 0.6), s);
    dummy.updateMatrix();
    grass.setMatrixAt(gi, dummy.matrix);
    // Patchy lawn: broad lighter and darker areas, like real turf.
    const patch = fbm(x * 0.12 + 4, z * 0.12 + 1, 3);
    const v = 0.78 + patch * 0.4 + (r() - 0.5) * 0.08;
    grass.setColorAt(gi++, tmpC.setRGB(v * (1 + (patch - 0.5) * 0.12), v, v * (0.95 - (patch - 0.5) * 0.1)));
  }
  grass.count = gi;
  const grassMax = gi;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.computeBoundingSphere();
  group.add(grass);

  // ---- Flower beds: leafy clumps always drawn, flowers thinned per tier.
  type P = [number, number];
  const beds: P[] = [];
  for (let z = GROUND.z0; z < GROUND.z1; z += 0.55) {
    for (let x = GROUND.x0; x < GROUND.x1; x += 0.55) {
      const jx = x + (r() - 0.5) * 0.45, jz = z + (r() - 0.5) * 0.45;
      if (surfaceAt(jx, jz, fbm(jx * 0.35, jz * 0.35, 2)) === 'bed') beds.push([jx, jz]);
    }
  }
  // Random order, so a lower tier drawing only a prefix still thins every bed evenly.
  for (let i = beds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [beds[i], beds[j]] = [beds[j], beds[i]];
  }
  const foliage = new Cards(), blooms = new Cards();
  const marks: number[] = [];
  for (const [x, z] of beds) {
    const inRing = Math.hypot(x, z) < FOUNTAIN.bedOuter + 0.05;
    const s = 0.27 + r() * 0.15;
    const c = new THREE.Vector3(x, 0, z);
    const kind = fbm(x * 0.3 + 1, z * 0.3 + 9, 2);
    const patch = fbm(x * 0.45 + 7, z * 0.45 + 3, 2);
    const flowerCell = FLOWER_CELLS[Math.floor(patch * FLOWER_CELLS.length * 1.6) % FLOWER_CELLS.length];
    const leafCell = kind > 0.62 ? CELL.box : r() < 0.08 ? CELL.fern : CELL.perennial;
    const hydrangea = kind > 0.7 && r() < 0.5 && !inRing;
    const top = clump(foliage, blooms, r, c, s, leafCell, flowerCell, hydrangea ? 3 : 9 + Math.floor(r() * 7), 0.85 + r() * 0.2);
    if (hydrangea) {
      const d = 0.24 + r() * 0.1;
      const ctr = new THREE.Vector3(x, top + d * 0.2, z);
      const tint = r() < 0.5 ? HYD_TINTS[0] : HYD_TINTS[1 + Math.floor(patch * 7) % 2];
      crossed(blooms, r, ctr.clone().add(new THREE.Vector3(0, -d / 2, 0)), d, d, CELL.hydrangea, tint, 3, ctr.clone().add(new THREE.Vector3(0, -d * 0.4, 0)));
    }
    if (kind < 0.42 || (inRing && r() < 0.45)) {
      const tint = SPIKE_TINTS[r() < 0.5 ? 0 : 1 + Math.floor(r() * 2)];
      const ns = 1 + Math.floor(r() * 3);
      for (let k = 0; k < ns; k++) {
        const h = 0.38 + r() * 0.3;
        crossed(blooms, r, new THREE.Vector3(x + (r() - 0.5) * 0.3, top * 0.3, z + (r() - 0.5) * 0.3), h * 0.3, h, CELL.spike, tint, 2);
      }
    }
    marks.push(blooms.indexCount);
  }
  const foliageMesh = new THREE.Mesh(foliage.build(), foliageMaterial(0.5, 0.015, 1.4, { translucency: 0.45 }));
  const bloomMesh = new THREE.Mesh(blooms.build(), foliageMaterial(0.5, 0.02, 1.7, { translucency: 0.35, roughness: 0.6 }));
  foliageMesh.name = 'bed-foliage';
  bloomMesh.name = 'bed-blooms';
  foliageMesh.castShadow = true;
  for (const m of [foliageMesh, bloomMesh]) {
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    group.add(m);
  }

  // ---- Clipped shrubs: a ring around the fountain bed. Leaf cards lie flat on a sphere, so
  // the silhouette stays trimmed while the surface reads as thousands of small leaves.
  const shrubCards = new Cards();
  const sr = rng(9);
  const ctr = new THREE.Vector3(0, -0.25, 0);
  const nfn = fromCentre(ctr, 0.1);
  for (let i = 0; i < 110; i++) {
    const y = 1 - (i / 109) * 1.35, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996;
    const n = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).normalize();
    const face = n.clone().add(new THREE.Vector3((sr() - 0.5) * 0.5, (sr() - 0.5) * 0.5, (sr() - 0.5) * 0.5)).normalize();
    const right = perpendicular(face).applyAxisAngle(face, sr() * Math.PI * 2);
    const up = new THREE.Vector3().crossVectors(face, right);
    const sz = 0.55 + sr() * 0.2;
    const k = 0.75 + 0.3 * Math.max(0, n.y);
    shrubCards.quad(n.clone().multiplyScalar(0.9).addScaledVector(up, -sz / 2), up, right, sz, sz, CELL.box, tmpC.setRGB(k, k, k * 0.95), nfn);
  }
  const shrubs = new THREE.InstancedMesh(shrubCards.build(), foliageMaterial(2, 0.01, 1.2, { translucency: 0.2, roughness: 0.7 }), 12);
  shrubs.name = 'shrubs';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    dummy.position.set(Math.sin(a) * 4.6, 0.3, Math.cos(a) * 4.6);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(0.44, 0.38, 0.44);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
    const v = 0.9 + r() * 0.15;
    shrubs.setColorAt(i, tmpC.setRGB(v, v, v));
  }
  shrubs.castShadow = shrubs.receiveShadow = true;
  if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
  shrubs.computeBoundingSphere();
  group.add(shrubs);

  return {
    group,
    grass,
    flowerMeshes: [foliageMesh, bloomMesh],
    bedSpots: beds.filter((_, i) => i % 7 === 0),
    setDensity(g: number, f: number) {
      grass.count = Math.round(grassMax * g);
      // Flowers thin out on low tiers; the leafy clumps always stay so beds never look bald.
      const n = Math.round(marks.length * f);
      bloomMesh.geometry.setDrawRange(0, n > 0 ? marks[n - 1] : 0);
    },
  };
}

/** Ivy: leaf-cluster cards lying on the surface they grow over (normals[i]), a few in flower. */
export function buildIvy(points: THREE.Vector3[], seed: number, normals: THREE.Vector3[]) {
  const r = rng(seed);
  const cards = new Cards();
  const tint = new THREE.Color();
  points.forEach((p, i) => {
    const n = normals[i];
    const face = n.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.6)).normalize();
    // Vines climb: keep the card's up axis near vertical on walls, random on flat tops.
    const ref = Math.abs(n.y) > 0.7 ? new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize() : UP;
    const up = ref.clone().addScaledVector(face, -ref.dot(face)).normalize().applyAxisAngle(face, (r() - 0.5) * 1.2);
    const right = new THREE.Vector3().crossVectors(up, face);
    const at = p.clone().addScaledVector(n, 0.015 + r() * 0.04);
    if (r() < 0.1) {
      const d = 0.07 + r() * 0.04;
      cards.quad(at.addScaledVector(up, -d / 2), up, right, d, d, r() < 0.5 ? CELL.rose : CELL.cosmos, tint.setRGB(1, 1, 1), (o, _q, f) => o.copy(f).multiplyScalar(Math.sign(f.dot(n)) || 1));
      return;
    }
    const sz = 0.2 + r() * 0.16, k = 0.72 + r() * 0.32;
    cards.quad(at.addScaledVector(up, -sz / 2), up, right, sz, sz, CELL.ivy, tint.setRGB(k, k, k), (o, _q, f) => o.copy(f).multiplyScalar(Math.sign(f.dot(n)) || 1).lerp(UP, 0.2));
  });
  const m = new THREE.Mesh(cards.build(), foliageMaterial(3, 0.004, 2, { translucency: 0.3, roughness: 0.55 }));
  m.name = 'ivy';
  m.castShadow = false;
  m.receiveShadow = true;
  return m;
}

/** Flowers spilling out of the stone urns. */
export function buildPotFlowers(tops: THREE.Vector3[]) {
  const r = rng(71);
  const foliage = new Cards(), blooms = new Cards();
  const cells = [CELL.zinnia, CELL.cosmos, CELL.daisy, CELL.rose];
  tops.forEach((p, k) => {
    const cell = cells[k % cells.length];
    clump(foliage, blooms, r, p.clone().add(new THREE.Vector3(0, -0.02, 0)), 0.28, k % 2 ? CELL.box : CELL.perennial, cell, 30, 0.95);
  });
  const group = new THREE.Group();
  const leaves = new THREE.Mesh(foliage.build(), foliageMaterial(1, 0.012, 1.5, { translucency: 0.45 }));
  const heads = new THREE.Mesh(blooms.build(), foliageMaterial(1, 0.015, 1.8, { translucency: 0.35, roughness: 0.6 }));
  leaves.castShadow = true;
  for (const m of [leaves, heads]) {
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

// Benches, lampposts, stone urns, gate pillars, ivy walls, the lake balustrade and boulders.
import * as THREE from 'three';
import { Batch, mat, colorAttr, rng, boxM } from '../core/util';
import { radialSprite } from '../core/textures';
import type { Colliders } from '../core/collision';
import type { Mats } from './materials';
import { BENCHES, LAMPS, URNS, GATE, WALLS, BALUSTRADE, ROCKS } from './layout';
import { buildIvy } from './vegetation';
import { rockGeometry } from './surroundings';

const lathe = (pts: [number, number][], seg = 20) => {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.computeVertexNormals();
  return g;
};

export const URN_PROFILE: [number, number][] = [[0.001, 0], [0.22, 0], [0.24, 0.06], [0.16, 0.12], [0.12, 0.28], [0.2, 0.42], [0.32, 0.56], [0.36, 0.65], [0.31, 0.68], [0.001, 0.63]];

export function benchInto(b: Batch, m: Mats, x: number, z: number, yaw: number, y = 0) {
  const base = mat(x, y, z, 0, yaw, 0);
  const put = (g: THREE.BufferGeometry, material: THREE.Material, lx: number, ly: number, lz: number, rx = 0) => {
    b.add(g, material, base.clone().multiply(mat(lx, ly, lz, rx)));
  };
  for (const sx of [-0.8, 0.8]) {
    put(boxM(0.05, 0.46, 0.05), m.iron, sx, 0.23, 0.2);
    put(boxM(0.05, 0.88, 0.05), m.iron, sx, 0.44, -0.2, -0.12);
    put(boxM(0.05, 0.04, 0.5), m.iron, sx, 0.43, 0);
    put(boxM(0.05, 0.035, 0.46), m.iron, sx, 0.66, 0.02);
    put(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), m.iron, sx, 0.55, 0.23);
  }
  for (let i = 0; i < 4; i++) put(boxM(1.78, 0.035, 0.095), m.wood, 0, 0.465, -0.17 + i * 0.12);
  for (let i = 0; i < 3; i++) put(boxM(1.78, 0.085, 0.03), m.wood, 0, 0.6 + i * 0.12, -0.235 - i * 0.015, -0.12);
}

export function lampInto(b: Batch, m: Mats, x: number, z: number) {
  b.add(lathe([[0.001, 0], [0.17, 0], [0.17, 0.08], [0.12, 0.14], [0.1, 0.34], [0.07, 0.4], [0.001, 0.4]], 16), m.iron, mat(x, 0, z));
  b.add(new THREE.CylinderGeometry(0.045, 0.06, 2.6, 10), m.iron, mat(x, 1.7, z));
  b.add(new THREE.TorusGeometry(0.07, 0.02, 6, 14), m.iron, mat(x, 2.5, z, Math.PI / 2));
  b.add(lathe([[0.001, 0], [0.12, 0], [0.16, 0.06], [0.001, 0.08]], 8), m.iron, mat(x, 3.0, z));
  b.add(new THREE.CylinderGeometry(0.13, 0.1, 0.36, 6), m.lantern, mat(x, 3.26, z));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    b.add(boxM(0.016, 0.38, 0.016), m.iron, mat(x + Math.cos(a) * 0.125, 3.26, z + Math.sin(a) * 0.125));
  }
  b.add(new THREE.ConeGeometry(0.2, 0.2, 6), m.iron, mat(x, 3.54, z));
  b.add(new THREE.SphereGeometry(0.04, 8, 6), m.iron, mat(x, 3.67, z));
}

export function urnInto(b: Batch, m: Mats, x: number, z: number, y = 0, s = 1) {
  b.add(lathe(URN_PROFILE, 24), m.stoneSmooth, mat(x, y, z, 0, 0, 0, s));
}

export interface Props {
  group: THREE.Group;
  lightPools: THREE.MeshBasicMaterial;
  urnTops: THREE.Vector3[];
}

export function buildProps(m: Mats, colliders: Colliders): Props {
  const group = new THREE.Group();
  group.name = 'props';
  const b = new Batch();
  for (const bench of BENCHES) {
    benchInto(b, m, bench.x, bench.z, bench.yaw);
    colliders.box(bench.x, bench.z, 0.92, 0.3, bench.yaw, 0.9);
  }
  for (const [x, z] of LAMPS) {
    lampInto(b, m, x, z);
    colliders.circle(x, z, 0.2, 3.6);
  }
  const urnTops: THREE.Vector3[] = [];
  for (const [x, z] of URNS) {
    urnInto(b, m, x, z);
    colliders.circle(x, z, 0.38, 0.7);
    urnTops.push(new THREE.Vector3(x, 0.64, z));
  }
  // Gate pillars with urns on top.
  for (const s of [-1, 1]) {
    const x = s * GATE.pillarX, h = GATE.height;
    b.add(boxM(GATE.size, h, GATE.size), m.stone, mat(x, h / 2, GATE.z));
    b.add(boxM(GATE.size + 0.16, 0.12, GATE.size + 0.16), m.stoneSmooth, mat(x, h + 0.06, GATE.z));
    b.add(boxM(GATE.size + 0.1, 0.14, GATE.size + 0.1), m.stoneSmooth, mat(x, 0.07, GATE.z));
    urnInto(b, m, x, GATE.z, h + 0.12, 0.95);
    urnTops.push(new THREE.Vector3(x, h + 0.12 + 0.61, GATE.z));
    colliders.box(x, GATE.z, GATE.size / 2, GATE.size / 2, 0, 2.4);
  }
  // Low walls with coping, covered in ivy.
  const ivy: THREE.Vector3[] = [], ivyN: THREE.Vector3[] = [];
  const r = rng(17);
  for (const line of WALLS) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const yaw = Math.atan2(-(bz - az), bx - ax);
      const cx = (ax + bx) / 2, cz = (az + bz) / 2;
      b.add(boxM(len + 0.5, 0.82, 0.5), m.stone, mat(cx, 0.41, cz, 0, yaw));
      b.add(boxM(len + 0.62, 0.09, 0.62), m.stoneSmooth, mat(cx, 0.86, cz, 0, yaw));
      colliders.segment(ax, az, bx, bz, 0.6, 0.95);
      const nx = -(bz - az) / len, nz = (bx - ax) / len;
      const count = Math.round(len * 38);
      for (let k = 0; k < count; k++) {
        const t = r();
        const side = r() < 0.5 ? -1 : 1;
        const clump = Math.sin(t * len * 1.7 + i) > -0.2;
        if (!clump) continue;
        const y = r() < 0.3 ? 0.9 : r() * 0.85;
        const off = y > 0.88 ? (r() - 0.5) * 0.5 : side * (0.27 + r() * 0.03);
        ivy.push(new THREE.Vector3(ax + (bx - ax) * t + nx * off, y, az + (bz - az) * t + nz * off));
        ivyN.push(y > 0.88 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(nx * side, 0, nz * side));
      }
    }
  }
  for (const s of [-1, 1]) {
    for (let k = 0; k < 90; k++) {
      const face = Math.floor(r() * 4);
      const u = (r() - 0.5) * GATE.size;
      const y = r() * GATE.height * 0.8;
      const hx = GATE.size / 2 + 0.02;
      const p = face === 0 ? [hx, u] : face === 1 ? [-hx, u] : face === 2 ? [u, hx] : [u, -hx];
      ivy.push(new THREE.Vector3(s * GATE.pillarX + p[0], y, GATE.z + p[1]));
      ivyN.push(new THREE.Vector3(face === 0 ? 1 : face === 1 ? -1 : 0, 0, face === 2 ? 1 : face === 3 ? -1 : 0));
    }
  }
  group.add(buildIvy(ivy, 4, ivyN));

  // Balustrade at the lake overlook.
  const { x0, x1, z } = BALUSTRADE;
  const bl = x1 - x0, bcx = (x0 + x1) / 2;
  b.add(boxM(bl, 0.18, 0.5), m.stone, mat(bcx, 0.09, z));
  b.add(boxM(bl + 0.1, 0.12, 0.42), m.stoneSmooth, mat(bcx, 1.0, z));
  const baluster = lathe([[0.001, 0], [0.09, 0], [0.09, 0.06], [0.05, 0.12], [0.1, 0.34], [0.06, 0.58], [0.05, 0.66], [0.09, 0.74], [0.001, 0.76]], 12);
  for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.3) b.add(baluster, m.stoneSmooth, mat(x, 0.18, z));
  for (const px of [x0, x1]) b.add(boxM(0.36, 1.1, 0.46), m.stone, mat(px, 0.55, z));
  colliders.segment(x0 - 0.2, z, x1 + 0.2, z, 0.5, 1.1);

  // Boulders.
  const rockC = [new THREE.Color(0x9a948a), new THREE.Color(0x857f76), new THREE.Color(0xa8a196)];
  ROCKS.forEach(([x, rz, s], i) => {
    const g = rockGeometry(i * 3.7 + 11);
    const c = new THREE.Color();
    colorAttr(g, (_x, y) => c.copy(rockC[i % 3]).lerp(rockC[(i + 1) % 3], 0.3).multiplyScalar(0.8 + Math.max(0, y) * 0.25).clone());
    b.add(g, m.rock, mat(x, 0.1 * s, rz, r(), r() * 6, r() * 0.3, 0.75 * s, 0.5 * s, 0.62 * s));
    colliders.circle(x, rz, 0.6 * s, 0.6 * s);
  });

  group.add(b.build({ name: 'props-batch' }));

  // Warm pools of lamplight on the pavers; faded in at dusk.
  const poolMat = new THREE.MeshBasicMaterial({
    map: radialSprite('rgba(255,196,120,0.9)', 'rgba(255,170,90,0)'), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, fog: false,
  });
  const poolGeo = new THREE.PlaneGeometry(6.5, 6.5);
  poolGeo.rotateX(-Math.PI / 2);
  for (const [x, z] of LAMPS) {
    const p = new THREE.Mesh(poolGeo, poolMat);
    p.position.set(x, 0.03, z);
    p.renderOrder = 2;
    group.add(p);
  }
  return { group, lightPools: poolMat, urnTops };
}

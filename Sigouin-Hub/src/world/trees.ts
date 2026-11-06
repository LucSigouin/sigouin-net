// Trees grown from a branching skeleton: a flared trunk, limbs, secondary branches and twigs as
// tapered bark tubes, with leaf-spray cards clustered on the twigs. Each species has a full and a
// lite (distant hillside) variant; every placement is one instance of a variant.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '../core/util';
import { CELL, foliageMaterial, barkTextures } from './foliage';
import { Cards, tube, perpendicular, fromCentre } from './plantGeo';

const UP = new THREE.Vector3(0, 1, 0);
const dummy = new THREE.Object3D();

interface TreeGeo { bark: THREE.BufferGeometry; leaf: THREE.BufferGeometry }

function tint(k: number, warm: number) {
  return new THREE.Color(k * (1 + warm), k, k * (1 - warm * 1.4));
}

function deciduous(seed: number, lite: boolean, cell: number): TreeGeo {
  const r = rng(seed);
  const bark: THREE.BufferGeometry[] = [];
  const tips: { p: THREE.Vector3; d: THREE.Vector3; depth: number }[] = [];
  const H = 2.9 + r() * 0.6;
  const lean = new THREE.Vector3((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
  const trunkAt = (t: number) => new THREE.Vector3(lean.x * t * t, t * H, lean.z * t * t);
  const tp: THREE.Vector3[] = [], tr: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    tp.push(trunkAt(t).add(new THREE.Vector3((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.04)));
    tr.push(0.3 * (1 - 0.42 * t) + Math.max(0, 0.14 - t) * 1.5);
  }
  bark.push(tube(tp, tr, lite ? 6 : 12, 0.45, 2));

  const branch = (start: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, depth: number) => {
    const segs = depth === 0 ? 7 : depth === 1 ? 5 : 3;
    const pts: THREE.Vector3[] = [], radii: number[] = [];
    const p = start.clone(), d = dir.clone();
    const path: THREE.Vector3[] = [], dirs: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      pts.push(p.clone());
      radii.push(Math.max(0.008, r0 * (1 - 0.72 * (i / segs))));
      path.push(p.clone());
      dirs.push(d.clone());
      d.y += depth === 0 ? 0.05 : -0.03;
      d.x += (r() - 0.5) * 0.22;
      d.z += (r() - 0.5) * 0.22;
      d.normalize();
      p.addScaledVector(d, len / segs);
    }
    if (!(lite && depth === 2)) bark.push(tube(pts, radii, depth === 0 ? 8 : depth === 1 ? 5 : 4, 0.6));
    if (depth < 2) {
      const n = depth === 0 ? 4 : 3;
      for (let c = 0; c < n; c++) {
        const t = 0.3 + (c / n) * 0.62 + r() * 0.08;
        const i = Math.min(segs, Math.round(t * segs));
        const out = new THREE.Vector3(path[i].x, 0, path[i].z).normalize();
        const axis = perpendicular(dirs[i]).applyAxisAngle(dirs[i], r() * Math.PI * 2);
        const cd = dirs[i].clone().applyAxisAngle(axis, 0.6 + r() * 0.5).addScaledVector(out, 0.35).normalize();
        branch(path[i], cd, len * (0.48 + r() * 0.14), radii[i] * 0.62, depth + 1);
      }
    }
    if (depth >= 1) {
      for (let i = 1; i <= segs; i++) if (depth === 2 || i >= segs - 1) tips.push({ p: path[i], d: dirs[i], depth });
    }
  };

  const limbs = lite ? 4 : 5;
  for (let k = 0; k < limbs; k++) {
    const az = (k / limbs) * Math.PI * 2 + r() * 0.7, tilt = 0.5 + r() * 0.35;
    const start = trunkAt(0.7 + r() * 0.3);
    const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(az), Math.cos(tilt), Math.sin(tilt) * Math.sin(az));
    branch(start, dir, 2.5 + r() * 0.9, 0.15, 0);
  }
  branch(trunkAt(1), new THREE.Vector3((r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.3).normalize(), 2.3, 0.13, 0);

  const centre = tips.reduce((a, t) => a.add(t.p), new THREE.Vector3()).divideScalar(tips.length);
  const reach = Math.max(...tips.map((t) => t.p.distanceTo(centre)));
  const shade = centre.clone().add(new THREE.Vector3(0, -0.8, 0));
  const cards = new Cards();
  const nfn = fromCentre(shade, 0.15);
  const up = new THREE.Vector3(), right = new THREE.Vector3(), base = new THREE.Vector3(), out = new THREE.Vector3();
  const per = lite ? 1 : 2;
  for (const tip of tips) {
    for (let k = 0; k < per; k++) {
      out.subVectors(tip.p, centre).normalize();
      up.copy(tip.d).multiplyScalar(0.55).addScaledVector(out, 0.45).addScaledVector(UP, 0.25);
      up.x += (r() - 0.5) * 0.5; up.z += (r() - 0.5) * 0.5;
      up.normalize();
      perpendicular(up, right).applyAxisAngle(up, r() * Math.PI * 2);
      const h = lite ? 2.1 + r() * 0.6 : 0.95 + r() * 0.45;
      base.copy(tip.p).addScaledVector(up, -h * 0.25);
      const f = Math.min(1, tip.p.distanceTo(centre) / reach);
      // Outer and upper leaves catch the light; the underside of the crown sits in its own shade.
      const below = Math.max(0, (centre.y - tip.p.y) / reach);
      const light = (0.55 + 0.35 * f + 0.15 * Math.max(0, (tip.p.y - centre.y) / reach)) * (1 - 0.45 * below);
      cards.quad(base, up, right, h, h, lite ? CELL.far : cell, tint(light * (0.92 + r() * 0.14), (r() - 0.5) * 0.08), nfn);
    }
  }
  return { bark: mergeGeometries(bark)!, leaf: cards.build() };
}

function cypress(seed: number, lite: boolean): TreeGeo {
  const r = rng(seed);
  const H = 9;
  const trunk = tube([0, 0.5, 1, 1.6, 4].map((y) => new THREE.Vector3(0, y, 0)), [0.17, 0.14, 0.12, 0.1, 0.06], 7, 0.5, 2);
  const profile = (t: number) => 1.05 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06)), 0.75) * (1 - 0.45 * t) + 0.02;
  const cards = new Cards();
  const up = new THREE.Vector3(), right = new THREE.Vector3(), base = new THREE.Vector3(), out = new THREE.Vector3(), p = new THREE.Vector3();
  const n = lite ? 110 : 560;
  const nfn = (o: THREE.Vector3, q: THREE.Vector3, face: THREE.Vector3) => {
    o.set(q.x, 0.35, q.z).normalize().multiplyScalar(0.85).addScaledVector(face, 0.15 * Math.sign(face.dot(o) || 1));
  };
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, (i + r()) / n);
    const R = profile(t), a = r() * Math.PI * 2, rho = R * (0.35 + 0.65 * Math.sqrt(r()));
    out.set(Math.cos(a), 0, Math.sin(a));
    p.set(out.x * rho, 0.7 + t * H, out.z * rho);
    up.copy(out).multiplyScalar(0.28 + r() * 0.2).add(UP);
    up.x += (r() - 0.5) * 0.2; up.z += (r() - 0.5) * 0.2;
    up.normalize();
    right.crossVectors(up, out).normalize().applyAxisAngle(up, (r() - 0.5) * 1.4);
    const h = lite ? 2.2 + r() * 0.5 : 0.9 + r() * 0.5;
    base.copy(p).addScaledVector(up, -h * 0.45);
    const f = rho / R;
    const light = 0.5 + 0.42 * f + 0.1 * t;
    cards.quad(base, up, right, h * 0.8, h, CELL.cypress, tint(light * (0.9 + r() * 0.15), (r() - 0.5) * 0.06), nfn);
  }
  return { bark: trunk, leaf: cards.build() };
}

export function buildTrees(deciduousSpots: [number, number, number][], cypressSpots: [number, number, number][], hill: [number, number, number, number][], hillFraction: number, near: [number, number, number, number][] = []) {
  const group = new THREE.Group();
  group.name = 'trees';
  const { map, bump } = barkTextures();
  const barkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map, bumpMap: bump, bumpScale: 2.2, roughness: 0.95 });
  const decMat = foliageMaterial(7, 0.08, 1.1, { translucency: 0.55 });
  const cypMat = foliageMaterial(10, 0.1, 0.9, { translucency: 0.3, roughness: 0.85 });
  const r = rng(12);

  const place = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, s: number, rot: number, sy: number) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(s, s * sy, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  const addSet = (geo: TreeGeo, mat: THREE.Material, spots: [number, number, number, number][], shadows: boolean, name: string) => {
    if (!spots.length) return;
    const b = new THREE.InstancedMesh(geo.bark, barkMat, spots.length);
    const l = new THREE.InstancedMesh(geo.leaf, mat, spots.length);
    b.name = `${name}-bark`;
    l.name = `${name}-leaf`;
    spots.forEach(([x, y, z, s], i) => {
      const rot = r() * 6.28, sy = 0.95 + r() * 0.15;
      place(b, i, x, y, z, s, rot, sy);
      place(l, i, x, y, z, s, rot, sy);
    });
    for (const m of [b, l]) {
      m.castShadow = shadows;
      m.receiveShadow = shadows;
      m.computeBoundingSphere();
      group.add(m);
    }
  };
  const dec = [...deciduousSpots.map(([x, z, s]) => [x, 0, z, s] as [number, number, number, number]), ...near.filter((_, i) => i % 4 !== 0)];
  addSet(deciduous(3, false, CELL.oak), decMat, dec.filter((_, i) => i % 2 === 0), true, 'oak-a');
  addSet(deciduous(8, false, CELL.linden), decMat, dec.filter((_, i) => i % 2 === 1), true, 'oak-b');
  addSet(cypress(5, false), cypMat, [...cypressSpots.map(([x, z, s]) => [x, 0, z, s] as [number, number, number, number]), ...near.filter((_, i) => i % 4 === 0)], true, 'cypress');
  const n = Math.round(hill.length * hillFraction);
  addSet(cypress(6, true), cypMat, hill.slice(0, n).filter((_, i) => i % 3 !== 0), false, 'hill-cypress');
  addSet(deciduous(11, true, CELL.far), decMat, hill.slice(0, n).filter((_, i) => i % 3 === 0), false, 'hill-oak');
  return group;
}

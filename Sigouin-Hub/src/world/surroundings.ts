// The land just outside the garden: long meadow grass and wildflowers past the mown lawn, big
// bushes, a worn dirt track from the entrance towards the village, rocks, and spots for groves
// of full-detail trees. Everything is placed on the real ground height and thins with distance.
import * as THREE from 'three';
import { rng, fbm } from '../core/util';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { canvas, tex, rockTextures } from '../core/textures';
import { boundarySDF } from './layout';
import { GROUND } from './ground';
import { terrainHeight, fieldAt, LAKE_Y } from './backdrop';
import { CELL, foliageMaterial } from './foliage';
import { Cards, fromCentre, perpendicular } from './plantGeo';

const UP = new THREE.Vector3(0, 1, 0);

/** Ground height anywhere: the flat painted courtyard floor, or the terrain around it. */
export function groundY(x: number, z: number) {
  return x > GROUND.x0 && x < GROUND.x1 && z > GROUND.z0 && z < GROUND.z1 ? 0 : terrainHeight(x, z);
}

/** The track leaves the entrance and winds down to the village. */
const TRACK = new THREE.CatmullRomCurve3([
  [0, 25], [0.5, 36], [-6, 58], [-24, 96], [-58, 142], [-96, 190], [-128, 226], [-146, 244],
].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const TRACK_PTS = TRACK.getSpacedPoints(260);

function trackDistance(x: number, z: number) {
  let best = Infinity;
  for (let i = 0; i < TRACK_PTS.length - 1; i++) {
    const a = TRACK_PTS[i], b = TRACK_PTS[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}

/** Packed dirt with wheel ruts and a grassy crown; ragged alpha edges blend into the meadow. */
function dirtTexture() {
  const W = 256, H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rng(23);
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, n = fbm(x * 0.05, y * 0.05, 4), fine = fbm(x * 0.4, y * 0.4, 2);
      const edge = Math.min(u, 1 - u) * 2;
      const ragged = edge - (fbm(y * 0.03, u * 3, 3) - 0.5) * 0.45;
      const rut = Math.exp(-(((u - 0.3) / 0.06) ** 2)) + Math.exp(-(((u - 0.7) / 0.06) ** 2));
      const crown = Math.exp(-(((u - 0.5) / 0.07) ** 2)) * (0.5 + n);
      let rr = 118 + n * 50 + fine * 25 - rut * 22, gg = 96 + n * 40 + fine * 20 - rut * 18, bb = 70 + n * 28 + fine * 14 - rut * 12;
      if (crown > 0.55) { rr = 88 + n * 30; gg = 108 + n * 36; bb = 58 + n * 20; }
      const k = (y * W + x) * 4;
      img.data[k] = rr; img.data[k + 1] = gg; img.data[k + 2] = bb;
      img.data[k + 3] = ragged > 0.22 ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Pebbles.
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `hsla(35,12%,${50 + r() * 25}%,0.8)`;
    ctx.beginPath();
    ctx.arc(W * (0.2 + r() * 0.6), r() * H, 0.8 + r() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = tex(c);
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function track() {
  const pts = TRACK.getSpacedPoints(420);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const W = 2.6;
  let v = 0;
  pts.forEach((p, i) => {
    const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    const dir = new THREE.Vector3().subVectors(q, o).setY(0).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    if (i > 0) v += p.distanceTo(pts[i - 1]) / 5;
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s * W / 2, z = p.z + side.z * s * W / 2;
      pos.push(x, groundY(x, z) + 0.035, z);
      uv.push(s < 0 ? 0 : 1, v);
    }
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
    map: dirtTexture(), alphaTest: 0.5, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  m.name = 'track';
  m.receiveShadow = true;
  return m;
}

/** Craggy boulder: two octaves of displacement on a finer sphere, flattened where it meets the soil. */
export function rockGeometry(seed: number) {
  // Weld the faces first (keeping UVs), so the displaced surface shades smoothly, not faceted.
  const src = new THREE.IcosahedronGeometry(1, 4);
  src.deleteAttribute('normal');
  const g = mergeVertices(src, 1e-4);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.3 + seed, v.y * 1.3 + v.z * 0.7, 3) - 0.5, m = fbm(v.x * 5 + seed * 2, v.z * 5 + v.y * 3, 2) - 0.5;
    v.multiplyScalar(1 + n * 0.55 + m * 0.12);
    if (v.y < -0.2) v.y = -0.2 + (v.y + 0.2) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function buildSurroundings() {
  const group = new THREE.Group();
  group.name = 'surroundings';
  const r = rng(57);
  const open = (x: number, z: number) => {
    const d = boundarySDF(x, z);
    if (d < 3.5 || groundY(x, z) < LAKE_Y + 0.8) return -1;
    const f = fieldAt(x, z);
    if (f.farm > 0.45 && f.type !== 0) return -1;
    return d;
  };

  // ---- Long meadow grass and wildflowers, densest at the garden edge. Instanced crossed cards,
  // so each tuft sways from its own root whatever the ground height.
  const dummy = new THREE.Object3D();
  const tuftCells = [CELL.meadow, CELL.wildMeadow, CELL.dryGrass];
  const grassMat = foliageMaterial(1, 0.05, 1.6, { translucency: 0.3 });
  const tuftGeos = tuftCells.map((cell) => {
    const cards = new Cards();
    const white = new THREE.Color(1, 1, 1);
    for (let q = 0; q < 2; q++) {
      const a = q * Math.PI / 2;
      cards.quad(new THREE.Vector3(0, -0.04, 0), UP, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 1, 1, cell, white, (o, _p, f) => o.copy(f).lerp(UP, 0.7));
    }
    return cards.build();
  });
  // One instanced mesh per 40 m chunk and tuft kind, so grass behind the camera is culled.
  const chunks = new Map<string, THREE.InstancedMesh>();
  const chunk = (x: number, z: number, kind: number) => {
    const key = `${Math.floor(x / 40)},${Math.floor(z / 40)},${kind}`;
    let m = chunks.get(key);
    if (!m) {
      m = new THREE.InstancedMesh(tuftGeos[kind], grassMat, 3000);
      m.name = 'meadow';
      m.receiveShadow = true;
      m.count = 0;
      chunks.set(key, m);
    }
    return m;
  };
  const tint = new THREE.Color();
  for (let tries = 0, placed = 0; placed < 14000 && tries < 200000; tries++) {
    const x = (r() - 0.5) * 240, z = -60 + r() * 220;
    const d = open(x, z);
    if (d < 0 || r() > Math.exp(-(d - 3.5) / 40) || trackDistance(x, z) < 1.6) continue;
    const pick = r();
    const m = chunk(x, z, pick < 0.7 ? 0 : pick < 0.93 ? 1 : 2);
    if (m.count >= 3000) continue;
    const h = 0.5 + r() * 0.5, w = h * (0.9 + r() * 0.4);
    dummy.position.set(x, groundY(x, z), z);
    dummy.rotation.set((r() - 0.5) * 0.2, r() * Math.PI, (r() - 0.5) * 0.2);
    dummy.scale.set(w, h, w);
    dummy.updateMatrix();
    m.setMatrixAt(m.count, dummy.matrix);
    const patch = fbm(x * 0.05 + 3, z * 0.05, 3);
    const k = 0.5 + patch * 0.32 + (r() - 0.5) * 0.08;
    m.setColorAt(m.count++, tint.setRGB(k * (0.9 + (patch - 0.5) * 0.15), k, k * 0.72));
    placed++;
  }
  const tufts = [...chunks.values()];
  for (const m of tufts) {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }

  // ---- Bushes: laurel and box mounds in loose groups outside the walls.
  const bushes = new Cards();
  let placed = 0;
  for (let tries = 0; placed < 170 && tries < 40000; tries++) {
    const x = (r() - 0.5) * 200, z = -50 + r() * 190;
    const d = open(x, z);
    if (d < 0 || d > 70 || fbm(x * 0.04 + 9, z * 0.04, 3) < 0.52 || trackDistance(x, z) < 3) continue;
    const s = 0.7 + r() * 0.9;
    const c = new THREE.Vector3(x, groundY(x, z), z);
    const nfn = fromCentre(c.clone().add(new THREE.Vector3(0, -s * 0.3, 0)), 0.15);
    const cell = r() < 0.65 ? CELL.laurel : CELL.box;
    const n = 26 + Math.floor(r() * 12);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 1.2, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996 + r();
      const dir = new THREE.Vector3(Math.cos(th) * rad, Math.max(y, -0.15), Math.sin(th) * rad).normalize();
      const face = dir.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.7)).normalize();
      const right = perpendicular(face).applyAxisAngle(face, r() * Math.PI * 2);
      const up = new THREE.Vector3().crossVectors(face, right);
      const sz = s * (0.9 + r() * 0.5);
      const at = c.clone().add(new THREE.Vector3(dir.x * s * 0.7, s * 0.55 + dir.y * s * 0.6, dir.z * s * 0.7)).addScaledVector(up, -sz / 2);
      const k = (0.62 + 0.4 * Math.max(0, dir.y)) * (0.9 + r() * 0.2);
      bushes.quad(at, up, right, sz, sz, cell, new THREE.Color(k, k, k * 0.95), nfn);
    }
    placed++;
  }
  const bushMesh = new THREE.Mesh(bushes.build(), foliageMaterial(2.5, 0.02, 1.2, { translucency: 0.35 }));
  bushMesh.name = 'bushes';
  bushMesh.castShadow = bushMesh.receiveShadow = true;

  // ---- Rocks, half sunk into the meadow.
  const { map, bump } = rockTextures();
  const rockMat = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 3, roughness: 0.93, vertexColors: true });
  const rockGeos = [0, 1, 2, 3].map((k) => rockGeometry(k * 3.7 + 1));
  for (const g of rockGeos) {
    const c = new Float32Array(g.attributes.position.count * 3).fill(1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      // Moss on the upper faces, soil stain at the base.
      const y = p.getY(i), moss = Math.max(0, y - 0.3) * (fbm(p.getX(i) * 3, p.getZ(i) * 3, 2) > 0.5 ? 1 : 0);
      c[i * 3] = 1 - moss * 0.35 - Math.max(0, -y) * 0.3;
      c[i * 3 + 1] = 1 - moss * 0.1 - Math.max(0, -y) * 0.3;
      c[i * 3 + 2] = 1 - moss * 0.45 - Math.max(0, -y) * 0.35;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }
  const rocks = rockGeos.map((g) => new THREE.InstancedMesh(g, rockMat, 30));
  const counts = [0, 0, 0, 0];
  for (let tries = 0; counts.reduce((a, b) => a + b) < 110 && tries < 20000; tries++) {
    const x = (r() - 0.5) * 220, z = -50 + r() * 200;
    const d = open(x, z);
    if (d < 0 || d > 90 || r() > Math.exp(-(d - 3.5) / 45) || trackDistance(x, z) < 2) continue;
    const k = Math.floor(r() * 4);
    if (counts[k] >= 30) continue;
    const s = (0.25 + r() ** 2 * 1.2) * (r() < 0.1 ? 2 : 1);
    dummy.position.set(x, groundY(x, z) - s * 0.15, z);
    dummy.rotation.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3);
    dummy.scale.set(s * (0.9 + r() * 0.5), s * (0.5 + r() * 0.4), s * (0.8 + r() * 0.4));
    dummy.updateMatrix();
    rocks[k].setMatrixAt(counts[k]++, dummy.matrix);
  }
  rocks.forEach((m, k) => {
    m.count = counts[k];
    m.castShadow = m.receiveShadow = true;
    m.computeBoundingSphere();
    m.name = 'rocks';
  });

  group.add(track(), ...tufts, bushMesh, ...rocks);
  return group;
}

/** Groves of full-detail trees just outside the walls, kept off the track and the lake view. */
export function nearTreeSpots(count: number) {
  const r = rng(61);
  const out: [number, number, number, number][] = [];
  for (let tries = 0; out.length < count && tries < 20000; tries++) {
    const x = (r() - 0.5) * 220, z = -45 + r() * 190;
    const d = boundarySDF(x, z);
    if (d < 7 || d > 85 || fbm(x * 0.03 + 2, z * 0.03 + 5, 3) < 0.5) continue;
    if (z < -25 && Math.abs(x) < 30) continue;
    if (trackDistance(x, z) < 6 || fieldAt(x, z).farm > 0.45) continue;
    if (out.some(([ox, , oz]) => Math.hypot(ox - x, oz - z) < 7)) continue;
    const y = groundY(x, z);
    if (y < LAKE_Y + 1) continue;
    out.push([x, y, z, 0.95 + r() * 0.45]);
  }
  return out;
}

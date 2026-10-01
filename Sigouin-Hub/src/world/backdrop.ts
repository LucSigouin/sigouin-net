// Everything beyond the courtyard: rolling hills patched with farmland, a village and windmills,
// the lake, islands, a ring of mountains and a castle on the far shore. Built as a few large
// meshes with vertex colours; fog adds the haze.
import * as THREE from 'three';
import { fbm, smoothstep, lerp, Batch, mat, jitter, colorAttr, rng } from '../core/util';
import { waterMaterial, applyNightGlow, globalUniforms } from '../core/shaders';
import { groundDetail } from '../core/textures';

export const LAKE_Y = -5.5;
const CASTLE = { x: 265, z: -640, scale: 0.55 };

function plateau(x: number, z: number) {
  const qx = Math.abs(x) - 30, qz = Math.abs(z + 1) - 28;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
}

/** Ground height outside the courtyard (the courtyard itself is a flat plane at y = 0). */
export function terrainHeight(x: number, z: number) {
  const d = plateau(x, z);
  const north = smoothstep(-37, -60, z);
  const lateral = smoothstep(10, 170, d);
  let h = -0.12 + lateral * (fbm(x * 0.0075 + 3.1, z * 0.0075 + 1.7, 4) * 34 + 2) * (1 - north * 0.9);
  h -= north * 11;
  const side = smoothstep(150, 330, Math.abs(x)) * north;
  h += side * (fbm(x * 0.006, z * 0.006 + 9, 4) * 70 + 10);
  // A headland on the right for the castle.
  const hx = x - CASTLE.x, hz = z - CASTLE.z;
  h += Math.max(0, 1 - Math.hypot(hx / 80, hz / 60)) ** 1.5 * 40;
  // Stay under the painted courtyard floor (x ±38, z ±36) so the two never z-fight.
  if (Math.abs(x) < 38.5 && z > -36.5 && z < 36.5) h = Math.min(h, -0.15);
  return h;
}

/**
 * Farmland patchwork south of and beside the courtyard. `farm` is how much a point is farmland,
 * `type` which crop its field grows, `edge` its distance to the field boundary (0 = hedgerow).
 */
export function fieldAt(x: number, z: number) {
  const d = plateau(x, z);
  const farm = smoothstep(45, 85, d) * (1 - smoothstep(340, 440, d)) * smoothstep(-70, -10, z);
  const u = (x * 0.94 + z * 0.34) / 36, v = (z * 0.94 - x * 0.34) / 30;
  const cu = Math.floor(u), cv = Math.floor(v);
  const h = Math.sin(cu * 127.1 + cv * 311.7) * 43758.5453;
  return { farm, type: Math.floor((h - Math.floor(h)) * 6), edge: Math.min(u - cu, 1 - u + cu, v - cv, 1 - v + cv) };
}
const CROPS = [0x6f9444, 0xc8a452, 0x7b5b3e, 0x8f7fbf, 0x86a64a, 0xb4ad5f].map((c) => new THREE.Color(c));

const COL = {
  grass: new THREE.Color(0x6f9444), meadow: new THREE.Color(0x8aa650), forest: new THREE.Color(0x3d5d2f),
  rock: new THREE.Color(0x8b8676), sand: new THREE.Color(0xcdbf98), under: new THREE.Color(0x3d5f58),
  snow: new THREE.Color(0xf4f6fa), mRock: new THREE.Color(0x7c8499), mForest: new THREE.Color(0x3b5a63),
};

const tmpC = new THREE.Color();

function terrain() {
  const g = new THREE.PlaneGeometry(1400, 1400, 280, 280);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -150);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, terrainHeight(x, z));
  }
  g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  const c = new THREE.Color();
  colorAttr(g, (x, y, z, i) => {
    const slope = 1 - n.getY(i);
    const f = fbm(x * 0.03, z * 0.03, 3);
    c.copy(COL.grass).lerp(COL.meadow, smoothstep(0.45, 0.7, f));
    c.lerp(COL.forest, smoothstep(0.5, 0.75, fbm(x * 0.012 + 5, z * 0.012, 3)) * smoothstep(2, 20, y) * 0.8);
    const field = fieldAt(x, z);
    if (field.farm > 0) {
      const crop = field.edge < 0.05 ? COL.forest : CROPS[field.type];
      c.lerp(tmpC.copy(crop).offsetHSL(0, 0, (f - 0.5) * 0.06), field.farm * (1 - smoothstep(0.12, 0.3, slope)));
    }
    c.lerp(COL.rock, smoothstep(0.25, 0.5, slope));
    c.lerp(COL.sand, 1 - smoothstep(0.4, 1.6, Math.abs(y - LAKE_Y - 0.5)));
    if (y < LAKE_Y - 0.6) c.copy(COL.under);
    return c.clone();
  });
  const detail = groundDetail();
  detail.repeat.set(1400 / 6, 1400 / 6);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: detail, bumpMap: detail, bumpScale: 1.5, color: new THREE.Color(1.28, 1.28, 1.28) }));
  m.receiveShadow = true;
  m.name = 'terrain';
  return m;
}

function mountains() {
  // A full ring: tall and snowy behind the lake, lower blue ranges to the south.
  const segA = 340, segR = 48;
  const a0 = -Math.PI, a1 = Math.PI, r0 = 560, r1 = 1750;
  const pos: number[] = [], idx: number[] = [];
  for (let j = 0; j <= segR; j++) {
    for (let i = 0; i <= segA; i++) {
      const a = lerp(a0, a1, i / segA);
      const t = j / segR;
      const r = lerp(r0, r1, Math.pow(t, 0.8));
      const x = Math.sin(a) * r, z = -Math.cos(a) * r;
      const ridge = 1 - Math.abs(fbm(x * 0.0022 + 11, z * 0.0022 + 4, 5) * 2 - 1);
      const env = smoothstep(r0, r0 + 260, r) * (150 + 420 * smoothstep(700, 1500, r)) * (0.6 + 0.4 * Math.cos(a * 0.8));
      const y = -14 + Math.pow(ridge, 2.2) * env + fbm(x * 0.01, z * 0.01, 3) * 30 * smoothstep(r0, r0 + 200, r);
      pos.push(x, y, z);
    }
  }
  const w = segA + 1;
  for (let j = 0; j < segR; j++) for (let i = 0; i < segA; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  const c = new THREE.Color();
  let maxY = 0;
  for (let i = 1; i < pos.length; i += 3) maxY = Math.max(maxY, pos[i]);
  colorAttr(g, (x, y, z, i) => {
    const slope = 1 - n.getY(i);
    c.copy(COL.mForest).lerp(COL.mRock, smoothstep(40, 160, y) * 0.9 + smoothstep(0.35, 0.6, slope) * 0.3);
    const snowLine = maxY * (0.56 + fbm(x * 0.01, z * 0.01, 2) * 0.12);
    c.lerp(COL.snow, smoothstep(snowLine, snowLine + 50, y) * (1 - smoothstep(0.55, 0.8, slope)));
    return c.clone();
  });
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  m.name = 'mountains';
  return m;
}

function islands() {
  const b = new Batch();
  const mat0 = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const spots: [number, number, number, number][] = [[-95, -250, 42, 14], [-30, -330, 28, 9], [70, -290, 34, 12], [-180, -390, 55, 18], [130, -470, 40, 10]];
  const c = new THREE.Color();
  spots.forEach(([x, z, r, h], k) => {
    const g = jitter(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.35, k + 3, 1.6);
    colorAttr(g, (_x, y) => c.copy(COL.forest).lerp(COL.sand, 1 - smoothstep(0.02, 0.18, y)).clone());
    b.add(g, mat0, mat(x, LAKE_Y - 1.5, z, 0, k, 0, r, h, r * 0.8));
  });
  return b.build({ castShadow: false, name: 'islands' });
}

function castle() {
  const b = new Batch();
  const stone = new THREE.MeshStandardMaterial({ color: 0xdcc9a6, roughness: 0.9 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x7a5d58, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.9 });
  const cx = 0, cz = 0, y0 = 0;
  b.box(stone, 26, 16, 18, cx, y0 + 8, cz);
  b.add(new THREE.ConeGeometry(15, 10, 4), roof, mat(cx, y0 + 21, cz, 0, Math.PI / 4, 0, 1.2, 1, 0.85));
  for (const [dx, dz, h, r] of [[-15, -8, 30, 4.2], [15, -8, 26, 3.8], [-14, 10, 22, 3.6], [14, 10, 24, 3.6], [2, -2, 40, 5]] as const) {
    b.add(new THREE.CylinderGeometry(r, r * 1.05, h, 14), stone, mat(cx + dx, y0 + h / 2, cz + dz));
    b.add(new THREE.ConeGeometry(r * 1.25, r * 2.6, 14), roof, mat(cx + dx, y0 + h + r * 1.3, cz + dz));
    for (let k = 0; k < 3; k++) b.box(dark, 1, 1.8, 0.3, cx + dx, y0 + h * (0.45 + k * 0.17), cz + dz + r + 0.05);
  }
  b.box(stone, 44, 7, 1.6, cx, y0 + 3.5, cz + 16);
  for (let k = -3; k <= 3; k++) b.box(dark, 1.2, 2.2, 0.3, cx + k * 3.4, y0 + 10, cz + 9.05);
  const g = b.build({ castShadow: false, name: 'castle' });
  g.position.set(CASTLE.x, terrainHeight(CASTLE.x, CASTLE.z) - 1.5, CASTLE.z);
  g.scale.setScalar(CASTLE.scale);
  g.rotation.y = -0.5;
  return g;
}

/** Triangular roof prism: ridge along x, width w, depth d, apex height h. */
function roof(w: number, d: number, h: number) {
  const x = w / 2, z = d / 2;
  const v = [[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z], [-x, h, 0], [x, h, 0]];
  const tris = [[0, 4, 5], [0, 5, 1], [3, 2, 5], [3, 5, 4], [0, 3, 4], [1, 5, 2], [0, 1, 2], [0, 2, 3]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat().flatMap((i) => v[i]), 3));
  g.computeVertexNormals();
  return g;
}

/** A village with a church, farmhouses across the fields and two windmills. Windows glow at night. */
function countryside() {
  const b = new Batch();
  const walls = [0xe8dcc4, 0xdcc6a0, 0xcdbb9a, 0xeee4d2].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  const tiles = new THREE.MeshStandardMaterial({ color: 0xa4553a, roughness: 0.85 });
  const slate = new THREE.MeshStandardMaterial({ color: 0x5b5550, roughness: 0.85 });
  const win = applyNightGlow(new THREE.MeshStandardMaterial({ color: 0x2b2622, emissive: 0xffb25e, emissiveIntensity: 1, roughness: 0.6 }), 0, 2.4);
  const r = rng(41);
  const ground = (x: number, z: number) => terrainHeight(x, z) - 0.3;
  const house = (x: number, z: number, rot: number, s: number, big = false) => {
    const y = ground(x, z), w = (big ? 13 : 8) * s, d = (big ? 8 : 6) * s, h = (big ? 6 : 4.6) * s;
    const m = (lx: number, ly: number, lz: number) => {
      const c = Math.cos(rot), sn = Math.sin(rot);
      return [x + lx * c + lz * sn, y + ly, z - lx * sn + lz * c] as const;
    };
    const [cx, cy, cz] = m(0, h / 2, 0);
    b.box(walls[Math.floor(r() * walls.length)], w, h, d, cx, cy, cz, 0, rot);
    const [rx, ry, rz] = m(0, h, 0);
    b.add(roof(w + 0.8 * s, d + 1.2 * s, d * 0.42), r() < 0.8 ? tiles : slate, mat(rx, ry, rz, 0, rot));
    for (const side of [-1, 1]) {
      for (let k = 0; k < (big ? 3 : 2); k++) {
        const [wx, wy, wz] = m((k - (big ? 1 : 0.5)) * w * 0.3, h * 0.55, side * (d / 2 + 0.05));
        b.box(win, 1.1 * s, 1.3 * s, 0.2, wx, wy, wz, 0, rot);
      }
    }
    const [kx, ky, kz] = m(w * 0.3, h + d * 0.3, d * 0.12);
    b.box(slate, 0.9 * s, 2.2 * s, 0.9 * s, kx, ky, kz, 0, rot);
  };
  // Village on the south-west slope, gathered round its church.
  const V = { x: -150, z: 250 };
  const vy = ground(V.x, V.z);
  b.box(walls[3], 14, 8, 8, V.x, vy + 4, V.z, 0, 0.3);
  b.add(roof(14.8, 9.2, 4), tiles, mat(V.x, vy + 8, V.z, 0, 0.3));
  b.box(walls[2], 4.4, 18, 4.4, V.x - 8 * Math.cos(0.3), vy + 9, V.z + 8 * Math.sin(0.3), 0, 0.3);
  b.add(new THREE.ConeGeometry(3.4, 9, 4), slate, mat(V.x - 8 * Math.cos(0.3), vy + 22.5, V.z + 8 * Math.sin(0.3), 0, 0.3 + Math.PI / 4));
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = 16 + Math.sqrt(r()) * 46;
    house(V.x + Math.cos(a) * d, V.z + Math.sin(a) * d * 0.8, a + (r() - 0.5) * 0.4, 0.9 + r() * 0.3);
  }
  // Farmsteads out in the fields: a house and a barn.
  let placed = 0;
  for (let tries = 0; placed < 22 && tries < 3000; tries++) {
    const x = (r() - 0.5) * 900, z = -40 + r() * 520;
    const f = fieldAt(x, z);
    if (f.farm < 0.8 || f.type !== 0 || Math.hypot(x - V.x, z - V.z) < 90) continue;
    const e = 4, y = terrainHeight(x, z);
    if (Math.abs(terrainHeight(x + e, z) - y) + Math.abs(terrainHeight(x, z + e) - y) > 2.5) continue;
    const rot = 0.34 + (r() < 0.5 ? 0 : Math.PI / 2);
    house(x, z, rot, 1);
    house(x + Math.cos(rot) * 16, z - Math.sin(rot) * 16, rot, 1, true);
    placed++;
  }
  const group = b.build({ castShadow: false, name: 'countryside' });
  // Windmills on two crests, sails turning slowly.
  const white = walls[3], sailMat = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.9 });
  for (const [x, z, face] of [[210, 190, -2.4], [-300, 60, 1.9]] as const) {
    const y = ground(x, z);
    const mill = new THREE.Group();
    mill.position.set(x, y, z);
    mill.rotation.y = face;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 13, 12), white);
    tower.position.y = 6.5;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3, 3.4, 12), slate);
    cap.position.y = 14.6;
    const sails = new THREE.Group();
    sails.position.set(0, 12.6, 2.9);
    for (let k = 0; k < 4; k++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9.5, 0.15), sailMat);
      arm.position.y = 5.3;
      const pivot = new THREE.Group();
      pivot.rotation.z = (k * Math.PI) / 2;
      pivot.add(arm);
      sails.add(pivot);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), slate);
    sails.add(hub);
    // World time, not the wall clock, so the sails stop with everything else (the probe's frozen mode).
    hub.onBeforeRender = () => { sails.rotation.z = globalUniforms.uTime.value * -0.45; sails.updateMatrixWorld(); };
    mill.add(tower, cap, sails);
    group.add(mill);
  }
  return group;
}

export function buildBackdrop() {
  const group = new THREE.Group();
  group.name = 'backdrop';
  group.add(terrain(), mountains(), islands(), castle(), countryside());
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), waterMaterial('lake'));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, LAKE_Y, -1700);
  lake.receiveShadow = true;
  lake.name = 'lake';
  group.add(lake);
  return group;
}

/** Scatter points on the hills for distant trees: woods on open ground, rows along hedgerows. */
export function hillTreeSpots(count: number, seed = 5) {
  const r = rng(seed);
  const out: [number, number, number, number][] = [];
  let tries = 0;
  while (out.length < count && tries++ < count * 30) {
    const x = (r() - 0.5) * 1250, z = -380 + r() * 900;
    const d = plateau(x, z);
    if (d < 9 || d > 520) continue;
    const field = fieldAt(x, z);
    if (field.farm > 0.4 && field.edge > 0.04) continue;
    const y = terrainHeight(x, z);
    if (y < LAKE_Y + 1.2) continue;
    const e = 3;
    const slope = Math.abs(terrainHeight(x + e, z) - y) + Math.abs(terrainHeight(x, z + e) - y);
    if (slope > 4.5) continue;
    if (field.farm <= 0.4 && fbm(x * 0.02, z * 0.02, 2) < 0.42 && d > 30) continue;
    out.push([x, y, z, (0.8 + r() * 0.7) * (1 + d / 400)]);
  }
  return out;
}

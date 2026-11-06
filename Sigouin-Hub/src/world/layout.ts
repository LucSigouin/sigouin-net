// Single source of truth for where everything sits in the courtyard. Metres; +x east,
// -z north (towards the buildings and the lake), fountain at the origin.
import type { BuildingId } from '../content/types';

export const FOUNTAIN = {
  rimInner: 3.0,
  basinR: 3.4,
  bedInner: 3.5,
  bedOuter: 5.3,
  ringInner: 5.3,
  ringOuter: 8.6,
};

export interface BuildingSpec {
  id: BuildingId;
  x: number;
  z: number;
  yaw: number;
  width: number;
  depth: number;
}

export const BUILDINGS: BuildingSpec[] = [
  { id: 'computer-lab', x: -19.5, z: -12.5, yaw: 0.5, width: 13, depth: 9 },
  { id: 'music-studio', x: -6.2, z: -23.5, yaw: 0.13, width: 11.5, depth: 9.5 },
  { id: 'office', x: 8.8, z: -23.2, yaw: -0.18, width: 11, depth: 9 },
  { id: 'ai-workspace', x: 21.5, z: -7.5, yaw: -1.15, width: 13.5, depth: 10 },
];

/** Local (building space, front = +z) to world XZ. */
export function toWorld(b: { x: number; z: number; yaw: number }, lx: number, lz: number): [number, number] {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  return [b.x + lx * c + lz * s, b.z - lx * s + lz * c];
}
export function doorOf(b: BuildingSpec, out = 0): [number, number] {
  return toWorld(b, 0, b.depth / 2 + out);
}

export interface Segment { ax: number; az: number; bx: number; bz: number; w: number }

/** Straight paved paths: spokes to each door, the main approach, and the lake overlook. */
export const SEGMENTS: Segment[] = (() => {
  const s: Segment[] = [{ ax: 0, az: 7, bx: 0, bz: 34, w: 4.6 }];
  for (const b of BUILDINGS) {
    const [dx, dz] = doorOf(b, 1.2);
    const len = Math.hypot(dx, dz);
    s.push({ ax: (dx / len) * 7, az: (dz / len) * 7, bx: dx, bz: dz, w: 3.2 });
  }
  s.push({ ax: -4.5, az: -17.0, bx: 7, bz: -17.0, w: 2.4 });
  s.push({ ax: 1.35, az: -16.5, bx: 1.35, bz: -31.5, w: 2.2 });
  return s;
})();

/** Paved aprons in front of each building, as oriented rectangles. */
export const APRONS = BUILDINGS.map((b) => {
  const [cx, cz] = toWorld(b, 0, b.depth / 2 + 1.35);
  return { x: cx, z: cz, yaw: b.yaw, hw: b.width / 2 - 0.3, hd: 1.35 };
});

export const GATE = { pillarX: 2.95, z: 17.6, size: 0.95, height: 1.75 };

/** Low stone walls either side of the gate (polylines, mirrored in x). */
export const WALLS: [number, number][][] = [
  [[-3.45, 17.6], [-8.4, 18.2], [-12.4, 19.9], [-15.0, 22.6]],
  [[3.45, 17.6], [8.4, 18.2], [12.4, 19.9], [15.0, 22.6]],
];
export const BALUSTRADE = { x0: -3.2, x1: 6.2, z: -32.2 };

export const LAMPS: [number, number][] = (() => {
  const out: [number, number][] = [[-3.15, 13.5], [3.15, 13.5]];
  for (const a of [0.42, -0.42, 1.55, 3.085, -1.7, -2.62]) out.push([Math.sin(a) * 9.25, Math.cos(a) * 9.25]);
  return out;
})();

/** Benches: position + yaw (benches face the fountain). */
export const BENCHES: { x: number; z: number; yaw: number }[] = (() => {
  const out: { x: number; z: number; yaw: number }[] = [];
  for (const a of [0.9, 1.24, 2.31, -2.3, -0.92, -1.27]) {
    const x = Math.sin(a) * 10.4, z = Math.cos(a) * 10.4;
    out.push({ x, z, yaw: Math.atan2(-x, -z) });
  }
  out.push({ x: -5.4, z: 12.6, yaw: Math.atan2(5.4, -7) });
  out.push({ x: 5.4, z: 12.6, yaw: Math.atan2(-5.4, -7) });
  return out;
})();

export const URNS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (const a of [0.32, -0.32, Math.PI - 0.5, Math.PI + 0.5, 1.2, -1.2]) out.push([Math.sin(a) * 5.75, Math.cos(a) * 5.75]);
  for (const b of BUILDINGS) {
    out.push(toWorld(b, -1.75, b.depth / 2 + 0.55));
    out.push(toWorld(b, 1.75, b.depth / 2 + 0.55));
  }
  return out;
})();

export const ROCKS: [number, number, number][] = [
  [-23.5, 12.5, 1.3], [-21.8, 14.2, 0.8], [23.2, 13.2, 1.2], [21.6, 15.4, 0.7], [-16.5, 4.5, 0.9],
  [16.8, 6.2, 1.0], [-25.5, -2.5, 1.1], [25.8, 3.8, 0.9], [-9.5, 21.8, 0.9], [10.2, 22.2, 1.0],
  [-27, 17.5, 1.4], [27.2, 18, 1.2],
];

export const DECIDUOUS: [number, number, number][] = [
  [-25.5, 22.5, 1.25], [26, 22, 1.2], [-28.5, 4, 1.1], [29, 9.5, 1.15], [-18, 25.5, 1.0], [18.5, 25.8, 1.05],
  [-30, -8, 1.1], [30.5, -20, 1.0],
];

export const CYPRESS: [number, number, number][] = [
  // Behind the back buildings, gap left open for the lake view.
  [-12.5, -30.2, 1.05], [-9.8, -30.9, 1.15], [-7.1, -31.2, 1.0], [-4.3, -30.9, 1.1],
  [7.2, -30.7, 1.1], [10.1, -30.9, 1.0], [13.1, -30.3, 1.15],
  // Between buildings.
  [-13.6, -19.6, 0.95], [-14.3, -16.7, 0.8], [15.9, -18.3, 0.95], [17.6, -15.9, 0.8],
  // Flanks.
  [-27.5, -19.5, 1.2], [-25.2, -22.8, 1.0], [-22.1, -25.2, 1.1], [28.6, -15.8, 1.1], [27.2, -19.4, 0.95],
  [24.4, -22.6, 1.15], [-30.5, 13, 1.0], [30.8, 15.5, 1.05],
];

/** Walkable region: rounded box. Positive outside. */
export function boundarySDF(x: number, z: number) {
  const cx = 0.75, cz = -2.75, hx = 27.4, hz = 28.6, r = 7;
  const qx = Math.abs(x - cx) - (hx - r), qz = Math.abs(z - cz) - (hz - r);
  const ox = Math.max(qx, 0), oz = Math.max(qz, 0);
  return Math.hypot(ox, oz) + Math.min(Math.max(qx, qz), 0) - r;
}

function segSDF(s: Segment, x: number, z: number) {
  const dx = s.bx - s.ax, dz = s.bz - s.az;
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const px = x - s.ax, pz = z - s.az;
  const along = px * ux + pz * uz;
  const across = Math.abs(-px * uz + pz * ux);
  const da = Math.max(-along, along - len);
  const dc = across - s.w / 2;
  const ox = Math.max(da, 0), oz = Math.max(dc, 0);
  return Math.hypot(ox, oz) + Math.min(Math.max(da, dc), 0);
}
function rectSDF(r: { x: number; z: number; yaw: number; hw: number; hd: number }, x: number, z: number) {
  const c = Math.cos(r.yaw), s = Math.sin(r.yaw);
  const dx = x - r.x, dz = z - r.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const qx = Math.abs(lx) - r.hw, qz = Math.abs(lz) - r.hd;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
}
export function buildingSDF(x: number, z: number, pad = 0) {
  let d = Infinity;
  for (const b of BUILDINGS) d = Math.min(d, rectSDF({ x: b.x, z: b.z, yaw: b.yaw, hw: b.width / 2 + pad, hd: b.depth / 2 + pad }, x, z));
  return d;
}
/** Signed distance to the nearest paved surface (negative = on pavers). */
export function pathSDF(x: number, z: number) {
  const r = Math.hypot(x, z);
  let d = Math.max(r - FOUNTAIN.ringOuter, FOUNTAIN.ringInner - r);
  for (const s of SEGMENTS) d = Math.min(d, segSDF(s, x, z));
  for (const a of APRONS) d = Math.min(d, rectSDF(a, x, z));
  return d;
}
function wallDist(x: number, z: number) {
  let d = Infinity;
  for (const line of WALLS) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1];
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
    }
  }
  return d;
}
export type Surface = 'path' | 'bed' | 'lawn' | 'blocked';
export function surfaceAt(x: number, z: number, n: number): Surface {
  const r = Math.hypot(x, z);
  if (r < FOUNTAIN.basinR) return 'blocked';
  if (r < FOUNTAIN.bedOuter) return 'bed';
  if (buildingSDF(x, z, 0.1) < 0) return 'blocked';
  const p = pathSDF(x, z);
  if (p < 0) return 'path';
  const wd = wallDist(x, z);
  if (wd < 0.35) return 'blocked';
  if (wd < 1.5 && boundarySDF(x, z) < 2) return 'bed';
  if (buildingSDF(x, z, 0) < 1.1) return 'bed';
  if (p < 1.05 + n * 0.5 && n > 0.22 && boundarySDF(x, z) < 1) return 'bed';
  return 'lawn';
}

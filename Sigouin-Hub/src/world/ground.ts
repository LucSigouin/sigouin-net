// Paints the courtyard floor (lawn, soil, every paver, baked contact shadows) into one large
// canvas texture plus a matching bump map. One draw call for the whole floor.
import * as THREE from 'three';
import { canvas, tex, sharedNoise } from '../core/textures';
import { rng, fbm } from '../core/util';
import {
  FOUNTAIN, SEGMENTS, APRONS, BUILDINGS, WALLS, BENCHES, LAMPS, URNS, ROCKS, DECIDUOUS, CYPRESS, GATE, BALUSTRADE, surfaceAt,
} from './layout';

export const GROUND = { x0: -38, x1: 38, z0: -36, z1: 36 };

const STONES = ['#dccbb0', '#d2bf9f', '#e4d6bd', '#cbb592', '#d8c3a2', '#e0cfb2', '#c8b08c'];
const EDGE = ['#bba583', '#b39c79', '#c2ab88'];

export function paintGround(size: number) {
  const W = GROUND.x1 - GROUND.x0, H = GROUND.z1 - GROUND.z0;
  const px = size / W;
  const cw = size, ch = Math.round(H * px);
  const col = canvas(cw, ch), bump = canvas(cw, ch);
  const X = (x: number) => (x - GROUND.x0) * px;
  const Z = (z: number) => (z - GROUND.z0) * px;

  // Lawn.
  col.ctx.fillStyle = '#5a8a36';
  col.ctx.fillRect(0, 0, cw, ch);
  const pat = col.ctx.createPattern(sharedNoise(), 'repeat')!;
  for (const [scale, alpha] of [[px * 0.9, 0.35], [px * 0.12, 0.25]] as const) {
    pat.setTransform(new DOMMatrix().scale(scale / 32, scale / 32));
    col.ctx.globalAlpha = alpha;
    col.ctx.globalCompositeOperation = 'multiply';
    col.ctx.fillStyle = pat;
    col.ctx.fillRect(0, 0, cw, ch);
  }
  col.ctx.globalAlpha = 1;
  col.ctx.globalCompositeOperation = 'source-over';
  bump.ctx.fillStyle = '#707070';
  bump.ctx.fillRect(0, 0, cw, ch);

  // Soil under flower beds.
  const r0 = rng(21);
  const step = 0.3;
  for (let z = GROUND.z0; z < GROUND.z1; z += step) {
    for (let x = GROUND.x0; x < GROUND.x1; x += step) {
      const n = fbm(x * 0.35, z * 0.35, 2);
      if (surfaceAt(x, z, n) !== 'bed') continue;
      col.ctx.fillStyle = r0() < 0.5 ? '#4a3b2a' : '#3f3324';
      col.ctx.beginPath();
      col.ctx.arc(X(x + (r0() - 0.5) * 0.1), Z(z + (r0() - 0.5) * 0.1), step * px * 0.85, 0, Math.PI * 2);
      col.ctx.fill();
    }
  }

  // Baked contact shadows (light ambient occlusion) under everything that stands on the floor.
  const ao = (draw: (ctx: CanvasRenderingContext2D) => void, blur: number, alpha: number) => {
    const ctx = col.ctx;
    ctx.save();
    const off = cw * 2;
    ctx.shadowColor = `rgba(20,18,10,${alpha})`;
    ctx.shadowBlur = blur * px;
    ctx.shadowOffsetX = off;
    ctx.translate(-off, 0);
    ctx.fillStyle = '#000';
    draw(ctx);
    ctx.restore();
  };

  paintPaths(col.ctx, 'color', px, X, Z);
  paintPaths(bump.ctx, 'bump', px, X, Z);

  for (const b of BUILDINGS) {
    ao((ctx) => {
      ctx.save();
      ctx.translate(X(b.x), Z(b.z));
      ctx.rotate(-b.yaw);
      ctx.fillRect((-b.width / 2 + 0.1) * px, (-b.depth / 2 + 0.1) * px, (b.width - 0.2) * px, (b.depth - 0.2) * px);
      ctx.restore();
    }, 1.2, 0.75);
  }
  ao((ctx) => { ctx.beginPath(); ctx.arc(X(0), Z(0), FOUNTAIN.basinR * px, 0, Math.PI * 2); ctx.fill(); }, 0.5, 0.6);
  for (const line of WALLS) {
    ao((ctx) => {
      ctx.lineWidth = 0.5 * px;
      ctx.lineCap = 'round';
      ctx.beginPath();
      line.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
      ctx.stroke();
    }, 0.6, 0.55);
  }
  ao((ctx) => { ctx.fillRect(X(BALUSTRADE.x0), Z(BALUSTRADE.z - 0.2), (BALUSTRADE.x1 - BALUSTRADE.x0) * px, 0.4 * px); }, 0.4, 0.45);
  for (const s of [-1, 1]) ao((ctx) => ctx.fillRect(X(s * GATE.pillarX - 0.48), Z(GATE.z - 0.48), 0.96 * px, 0.96 * px), 0.5, 0.6);
  for (const b of BENCHES) {
    ao((ctx) => {
      ctx.save();
      ctx.translate(X(b.x), Z(b.z));
      ctx.rotate(-b.yaw);
      ctx.fillRect(-0.85 * px, -0.25 * px, 1.7 * px, 0.5 * px);
      ctx.restore();
    }, 0.35, 0.5);
  }
  const blob = (x: number, z: number, r: number, blur: number, a: number) =>
    ao((ctx) => { ctx.beginPath(); ctx.arc(X(x), Z(z), r * px, 0, Math.PI * 2); ctx.fill(); }, blur, a);
  for (const [x, z] of LAMPS) blob(x, z, 0.18, 0.25, 0.5);
  for (const [x, z] of URNS) blob(x, z, 0.36, 0.3, 0.55);
  for (const [x, z, s] of ROCKS) blob(x, z, 0.5 * s, 0.5, 0.5);
  for (const [x, z, s] of DECIDUOUS) blob(x, z, 1.8 * s, 2.2, 0.35);
  for (const [x, z, s] of CYPRESS) blob(x, z, 0.8 * s, 0.9, 0.45);

  const map = tex(col.c);
  const bumpMap = tex(bump.c, { srgb: false });
  return { map, bumpMap };
}

type Mode = 'color' | 'bump';

function paintPaths(ctx: CanvasRenderingContext2D, mode: Mode, px: number, X: (x: number) => number, Z: (z: number) => number) {
  const r = rng(99);
  const grout = mode === 'color' ? '#9d8d74' : '#1c1c1c';
  // Both passes must draw identical stones, so the RNG is consumed the same way in each.
  const pick = (list: string[]) => {
    const c = list[Math.floor(r() * list.length)];
    const v = (175 + r() * 70) | 0;
    return mode === 'bump' ? `rgb(${v},${v},${v})` : c;
  };
  const gap = 0.032 * px;
  const stone = (x: number, y: number, w: number, h: number, list = STONES) => {
    ctx.fillStyle = pick(list);
    ctx.beginPath();
    ctx.roundRect(x + gap / 2, y + gap / 2, Math.max(1, w - gap), Math.max(1, h - gap), 0.05 * px);
    ctx.fill();
  };

  const rectPaving = (cx: number, cz: number, angle: number, len: number, width: number, originAtStart: boolean) => {
    ctx.save();
    ctx.translate(X(cx), Z(cz));
    ctx.rotate(angle);
    const x0 = originAtStart ? 0 : -len / 2;
    ctx.beginPath();
    ctx.rect(x0 * px, (-width / 2) * px, len * px, width * px);
    ctx.clip();
    ctx.fillStyle = grout;
    ctx.fillRect(x0 * px, (-width / 2) * px, len * px, width * px);
    const rowD = 0.46;
    for (let a = x0; a < x0 + len; a += rowD) {
      let b = -width / 2 + 0.18 - r() * 0.4;
      while (b < width / 2) {
        const w = 0.42 + r() * 0.36;
        stone(a * px, b * px, rowD * px, w * px);
        b += w;
      }
    }
    // Curb stones along both edges.
    for (const side of [-1, 1]) {
      const y = side < 0 ? -width / 2 : width / 2 - 0.2;
      for (let a = x0; a < x0 + len; ) {
        const l = 0.6 + r() * 0.4;
        stone(a * px, y * px, l * px, 0.2 * px, EDGE);
        a += l;
      }
    }
    ctx.restore();
  };

  for (const s of SEGMENTS) {
    const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
    rectPaving(s.ax, s.az, Math.atan2(s.bz - s.az, s.bx - s.ax), len, s.w, true);
  }
  for (const a of APRONS) rectPaving(a.x, a.z, -a.yaw, a.hw * 2, a.hd * 2, false);

  // Circular walkway: concentric courses of wedge-cut stones.
  const cx = X(0), cz = Z(0);
  ctx.fillStyle = grout;
  ctx.beginPath();
  ctx.arc(cx, cz, FOUNTAIN.ringOuter * px, 0, Math.PI * 2);
  ctx.arc(cx, cz, FOUNTAIN.ringInner * px, 0, Math.PI * 2, true);
  ctx.fill();
  const courses = Math.round((FOUNTAIN.ringOuter - FOUNTAIN.ringInner) / 0.42);
  const cd = (FOUNTAIN.ringOuter - FOUNTAIN.ringInner) / courses;
  for (let k = 0; k < courses; k++) {
    const ri = FOUNTAIN.ringInner + k * cd, ro = ri + cd;
    const edge = k === 0 || k === courses - 1;
    const rc = (ri + ro) / 2;
    const n = Math.round((Math.PI * 2 * rc) / (edge ? 0.8 : 0.55));
    const off = r() * 6.28;
    const ga = (0.034 / rc) * 0.5;
    for (let i = 0; i < n; i++) {
      const a0 = off + (i / n) * Math.PI * 2 + ga, a1 = off + ((i + 1) / n) * Math.PI * 2 - ga;
      ctx.fillStyle = pick(edge ? EDGE : STONES);
      ctx.beginPath();
      ctx.arc(cx, cz, (ro - 0.017) * px, a0, a1);
      ctx.arc(cx, cz, (ri + 0.017) * px, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Weathering: soft noise over the stones so no two look freshly cut.
  if (mode === 'color') {
    const pat = ctx.createPattern(sharedNoise(), 'repeat')!;
    pat.setTransform(new DOMMatrix().scale(px / 40, px / 40));
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
}

export function buildGround(size: number) {
  const { map, bumpMap } = paintGround(size);
  const W = GROUND.x1 - GROUND.x0, H = GROUND.z1 - GROUND.z0;
  const g = new THREE.PlaneGeometry(W, H);
  g.rotateX(-Math.PI / 2);
  g.translate((GROUND.x0 + GROUND.x1) / 2, 0, (GROUND.z0 + GROUND.z1) / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 1.4, roughness: 0.9 }));
  m.receiveShadow = true;
  m.name = 'ground';
  return m;
}

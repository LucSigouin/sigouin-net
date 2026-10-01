// The foliage atlas: every leaf, petal and floret in the courtyard is painted on canvas at load
// time, one plant per 512 px cell (5 × 5 grid). It becomes a DataTexture with hand-built mipmaps that bleed
// colour into transparent texels (no dark fringes) and lift alpha on smaller levels, so trees
// keep their density in the distance instead of thinning out.
import * as THREE from 'three';
import { canvas, tex } from '../core/textures';
import { rng } from '../core/util';
import { applyWind } from '../core/shaders';

export const CELL = {
  oak: 0, linden: 1, cypress: 2, box: 3, perennial: 4, ivy: 5,
  cosmos: 6, daisy: 7, rose: 8, aster: 9, zinnia: 10, forgetMeNot: 11,
  spike: 12, hydrangea: 13, fern: 14, far: 15,
  meadow: 16, wildMeadow: 17, laurel: 18, dryGrass: 19,
} as const;
const GRID = 5, CS = 512, S = GRID * CS;

/** UV for a point on a card: s runs left to right, t bottom to top. */
export function cellUV(cell: number, s: number, t: number): [number, number] {
  const col = cell % GRID, row = Math.floor(cell / GRID);
  return [(col + s) / GRID, (row + 1 - t) / GRID];
}

type Ctx = CanvasRenderingContext2D;
type R = () => number;
const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** Ovate leaf with a shaded half, midrib and side veins. a = 0 points up. */
function leaf(ctx: Ctx, x: number, y: number, a: number, len: number, wid: number, h: number, s: number, l: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wid * 0.95, -len * 0.12, wid * 0.75, -len * 0.78, 0, -len);
  ctx.bezierCurveTo(-wid * 0.75, -len * 0.78, -wid * 0.95, -len * 0.12, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, -len);
  g.addColorStop(0, hsl(h - 3, s, l * 0.78));
  g.addColorStop(0.55, hsl(h, s, l));
  g.addColorStop(1, hsl(h + 5, s * 0.95, Math.min(90, l * 1.1)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(8,22,4,0.2)';
  ctx.fillRect(0, -len, wid, len);
  ctx.restore();
  if (len > 14) {
    ctx.strokeStyle = hsl(h + 10, s * 0.55, Math.min(85, l * 1.5), 0.45);
    ctx.lineWidth = Math.max(0.7, wid * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wid * 0.06, -len * 0.5, 0, -len * 0.94);
    ctx.stroke();
    if (len > 30) {
      ctx.lineWidth *= 0.55;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let k = 1; k < 5; k++) {
        const t = k / 5.5, yy = -len * t;
        for (const sd of [-1, 1]) {
          ctx.moveTo(0, yy);
          ctx.lineTo(sd * wid * 0.62 * (1 - t * 0.55), yy - len * 0.13);
        }
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Leafy spray for tree canopies: a fan of forking twigs, trimmed to a round outline. */
function spray(ctx: Ctx, r: R, o: { h: number; s: number; l: number; len: number; wid: number; density: number }) {
  const leaves: [number, number, number, number][] = [];
  const cx = 256, cy = 250, R2 = 236 * 236;
  const twig = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const steps = 6;
    let px = x, py = y;
    for (let i = 1; i <= steps; i++) {
      a += (r() - 0.5) * 0.3;
      const nx = px + Math.sin(a) * (len / steps), ny = py - Math.cos(a) * (len / steps);
      ctx.strokeStyle = depth === 0 ? '#4b3a29' : '#5a5030';
      ctx.lineCap = 'round';
      ctx.lineWidth = w * (1 - (i / steps) * 0.6);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      px = nx; py = ny;
      if (i >= 2 || depth > 0) {
        for (const sd of [-1, 1]) if (r() < o.density) leaves.push([px, py, a + sd * (0.5 + r() * 0.7), 0.75 + r() * 0.45]);
      }
      if (depth < 2 && i % 2 === 0 && r() < 0.8) twig(px, py, a + (r() < 0.5 ? -1 : 1) * (0.45 + r() * 0.5), len * 0.55, w * 0.6, depth + 1);
    }
    leaves.push([px, py, a, 1]);
  };
  const n = 5;
  for (let k = 0; k < n; k++) twig(256 + (r() - 0.5) * 20, 500, (k / (n - 1) - 0.5) * 1.7 + (r() - 0.5) * 0.2, 300 + r() * 110, 9, 0);
  for (let i = leaves.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [leaves[i], leaves[j]] = [leaves[j], leaves[i]];
  }
  leaves.forEach(([x, y, a, sc], i) => {
    if ((x - cx) ** 2 + (y - cy) ** 2 > R2) return;
    const lift = (1 - y / CS) * 9 + (i / leaves.length) * 8;
    leaf(ctx, x, y, a, o.len * sc, o.wid * sc, o.h + (r() - 0.5) * 10, o.s + (r() - 0.5) * 12, o.l - 5 + lift + (r() - 0.5) * 6);
  });
}

/** Italian cypress: dense upright sprigs of scale leaves. */
function cypress(ctx: Ctx, r: R) {
  const n = 520;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = 256 + Math.cos(a) * d * 205, y = 262 + Math.sin(a) * d * 236;
    const ang = (r() - 0.5) * 0.9, len = 26 + r() * 40;
    const l = 13 + t * 16 + (1 - y / CS) * 6;
    ctx.strokeStyle = hsl(98 + r() * 14, 32 + r() * 12, l);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6 + r() * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const ex = x + Math.sin(ang) * len, ey = y - Math.cos(ang) * len;
    ctx.lineTo(ex, ey);
    for (let k = 1; k < 4; k++) {
      const f = k / 4, bx = x + (ex - x) * f, by = y + (ey - y) * f;
      for (const sd of [-1, 1]) {
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.sin(ang + sd * 0.8) * len * 0.35, by - Math.cos(ang + sd * 0.8) * len * 0.35);
      }
    }
    ctx.stroke();
    if (r() < 0.35) {
      ctx.fillStyle = hsl(90, 30, l + 14, 0.5);
      ctx.fillRect(ex - 2, ey - 2, 3, 3);
    }
  }
}

/** Boxwood: hundreds of tiny glossy leaves in a round cluster, lit from above. */
function box(ctx: Ctx, r: R) {
  const n = 760;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 232;
    const x = 256 + Math.cos(a) * d, y = 256 + Math.sin(a) * d;
    const l = 14 + (i / n) * 18 + (1 - y / CS) * 8;
    leaf(ctx, x, y, r() * Math.PI * 2, 18 + r() * 12, 7 + r() * 4, 92 + r() * 16, 42 + r() * 12, l);
  }
}

/** Perennial foliage seen side-on: slim arching blades over a skirt of broad lower leaves. */
function perennial(ctx: Ctx, r: R) {
  for (let i = 0; i < 12; i++) {
    const a = (r() - 0.5) * 2.6;
    leaf(ctx, 256 + (r() - 0.5) * 120, 508, a, 120 + r() * 90, 44 + r() * 20, 88 + r() * 14, 30 + r() * 10, 20 + r() * 6);
  }
  const n = 30;
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * 2.2, len = 200 + r() * 240;
    leaf(ctx, 256 + (r() - 0.5) * 50, 508, a, len * (1 - Math.abs(a) * 0.25), 16 + r() * 12, 84 + r() * 18, 30 + r() * 12, 24 + (i / n) * 14);
  }
}

/** Ivy: a meandering vine carrying five-lobed leaves with pale veins. */
function ivy(ctx: Ctx, r: R) {
  ctx.strokeStyle = '#4c4630';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const pts: [number, number][] = [];
  ctx.beginPath();
  let x = 256, y = 500;
  ctx.moveTo(x, y);
  for (let i = 0; i < 14; i++) {
    x += (r() - 0.5) * 70;
    y -= 32;
    x = Math.min(400, Math.max(110, x));
    ctx.lineTo(x, y);
    pts.push([x, y]);
  }
  ctx.stroke();
  pts.forEach(([px, py], i) => {
    for (const sd of [-1, 1]) {
      if (r() < 0.25) continue;
      const R0 = 44 + r() * 30, cx = px + sd * R0 * 0.9, cy = py - 6;
      const rot = sd * 0.6 + (r() - 0.5) * 0.6;
      const l = 16 + r() * 8 + (i / pts.length) * 6;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const th = (k / 60) * Math.PI * 2;
        const lobe = 0.58 + 0.42 * Math.pow(Math.abs(Math.cos(th * 2.5)), 0.6);
        const rr = R0 * lobe * (th > Math.PI * 0.8 && th < Math.PI * 1.2 ? 0.8 : 1);
        const lx = Math.sin(th + rot) * rr, ly = -Math.cos(th + rot) * rr;
        if (k === 0) ctx.moveTo(cx + lx, cy + ly); else ctx.lineTo(cx + lx, cy + ly);
      }
      const g = ctx.createRadialGradient(cx, cy + R0 * 0.3, 2, cx, cy, R0);
      g.addColorStop(0, hsl(105, 38, l * 0.8));
      g.addColorStop(1, hsl(98, 42, l * 1.25));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hsl(80, 25, 58, 0.45);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const th = (k / 5) * Math.PI * 2 + rot;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(th) * R0 * 0.8, cy - Math.cos(th) * R0 * 0.8);
      }
      ctx.stroke();
    }
  });
}

/** Petal-shaped path from radius r0 to r1, width w; `notch` adds a toothed tip. */
function petalPath(ctx: Ctx, r0: number, r1: number, w: number, notch = 0) {
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, -r0);
  ctx.bezierCurveTo(-w * 0.55, -(r0 + (r1 - r0) * 0.35), -w * 0.62, -(r0 + (r1 - r0) * 0.8), -w * 0.4, -r1);
  if (notch) {
    for (let k = 1; k <= 4; k++) ctx.lineTo(-w * 0.4 + (w * 0.8 * k) / 4, -r1 - (k % 2 ? notch : 0));
  } else {
    ctx.quadraticCurveTo(0, -r1 - w * 0.35, w * 0.4, -r1);
  }
  ctx.bezierCurveTo(w * 0.62, -(r0 + (r1 - r0) * 0.8), w * 0.55, -(r0 + (r1 - r0) * 0.35), w * 0.12, -r0);
  ctx.closePath();
}

function ringOfPetals(ctx: Ctx, r: R, n: number, r0: number, r1: number, w: number, inner: string, outer: string, notch = 0, veins = true) {
  const off = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(off + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.14);
    const len = r1 * (0.92 + r() * 0.12);
    petalPath(ctx, r0, len, w * (0.9 + r() * 0.2), notch);
    const g = ctx.createLinearGradient(0, -r0, 0, -len);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,40,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (veins) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -2; k <= 2; k++) {
        ctx.moveTo(k * w * 0.05, -r0 - 4);
        ctx.lineTo(k * w * 0.14, -len * 0.92);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

function disc(ctx: Ctx, r: R, rad: number, a: string, b: string, dots: string) {
  const g = ctx.createRadialGradient(248, 246, rad * 0.1, 256, 256, rad);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 256, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dots;
  for (let i = 0; i < rad * 3; i++) {
    const t = Math.sqrt(r()) * rad * 0.92, th = r() * Math.PI * 2;
    ctx.fillRect(256 + Math.cos(th) * t, 256 + Math.sin(th) * t, 2.5, 2.5);
  }
}

/** Soft shadow under a flower head so it separates from the leaves behind it. */
function contact(ctx: Ctx, rad: number) {
  const g = ctx.createRadialGradient(256, 262, rad * 0.6, 256, 262, rad);
  g.addColorStop(0, 'rgba(20,30,10,0.35)');
  g.addColorStop(1, 'rgba(20,30,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 262, rad, 0, Math.PI * 2);
  ctx.fill();
}

const FLOWERS: Record<number, (ctx: Ctx, r: R) => void> = {
  [CELL.cosmos]: (ctx, r) => {
    ringOfPetals(ctx, r, 8, 30, 236, 118, hsl(332, 62, 52), hsl(335, 78, 80), 12);
    disc(ctx, r, 44, '#f6d34a', '#c98a17', 'rgba(120,70,10,0.6)');
  },
  [CELL.daisy]: (ctx, r) => {
    ringOfPetals(ctx, r, 22, 40, 232, 36, hsl(50, 18, 80), hsl(45, 30, 97), 0, false);
    ringOfPetals(ctx, r, 18, 40, 200, 34, hsl(50, 15, 76), hsl(45, 25, 95), 0, false);
    disc(ctx, r, 62, '#ffd84a', '#d99a10', 'rgba(150,90,0,0.55)');
  },
  [CELL.rose]: (ctx, r) => {
    contact(ctx, 250);
    for (let k = 0; k < 6; k++) {
      const R1 = 236 * (1 - k * 0.15), n = 5 + (k % 2);
      ringOfPetals(ctx, r, n, R1 * 0.2, R1, R1 * 0.95, hsl(346, 62, 30 + k * 2), hsl(342, 72, 62 - k * 4), 0, false);
    }
    ctx.strokeStyle = 'rgba(70,5,20,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) ctx.lineTo(256 + Math.cos(a) * a * 5, 256 + Math.sin(a) * a * 5);
    ctx.stroke();
  },
  [CELL.aster]: (ctx, r) => {
    ringOfPetals(ctx, r, 34, 36, 230, 22, hsl(268, 42, 62), hsl(272, 60, 82), 0, false);
    disc(ctx, r, 48, '#f7cf3e', '#d08a18', 'rgba(130,70,0,0.55)');
  },
  [CELL.zinnia]: (ctx, r) => {
    ringOfPetals(ctx, r, 14, 40, 236, 96, hsl(6, 72, 52), hsl(14, 90, 70), 0);
    ringOfPetals(ctx, r, 13, 36, 180, 80, hsl(4, 70, 48), hsl(12, 86, 64), 0);
    ringOfPetals(ctx, r, 11, 30, 125, 64, hsl(0, 68, 42), hsl(10, 80, 58), 0);
    disc(ctx, r, 40, '#7a1c16', '#3f0c08', 'rgba(255,210,60,0.9)');
  },
  [CELL.forgetMeNot]: (ctx, r) => {
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 170;
      const x = 256 + Math.cos(a) * d, y = 256 + Math.sin(a) * d, R0 = 38 + r() * 22;
      ctx.save();
      ctx.translate(x - 256, y - 256);
      ringOfPetals(ctx, r, 5, 4, R0, R0 * 1.25, hsl(214, 60, 58), hsl(210, 72, 76), 0, false);
      ctx.fillStyle = '#fff6c4';
      ctx.beginPath();
      ctx.arc(256, 256, R0 * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b52c';
      ctx.beginPath();
      ctx.arc(256, 256, R0 * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
};

/** Lavender / salvia spike, side-on. Painted pale so instance colour sets the hue. */
function spike(ctx: Ctx, r: R) {
  ctx.strokeStyle = '#5d7a45';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 510);
  ctx.quadraticCurveTo(262, 260, 252, 18);
  ctx.stroke();
  for (const sd of [-1, 1]) leaf(ctx, 256, 505, sd * (0.25 + r() * 0.2), 160 + r() * 60, 20, 100, 30, 34);
  for (let y = 330; y > 24; y -= 17) {
    const f = (y - 24) / 306, spread = 14 + f * 30;
    for (let k = 0; k < 6; k++) {
      const x = 256 + (r() - 0.5) * 2 * spread, yy = y + (r() - 0.5) * 12;
      ctx.fillStyle = hsl(262 + r() * 16, 30 + r() * 20, 64 + r() * 20);
      ctx.beginPath();
      ctx.ellipse(x, yy, 8 + f * 6, 11 + f * 6, (x - 256) * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,30,80,0.25)';
      ctx.beginPath();
      ctx.ellipse(x, yy + 4, 5 + f * 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Mophead hydrangea: a dome of four-petal florets, darker underneath. Painted near white. */
function hydrangea(ctx: Ctx, r: R) {
  const n = 300;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 212;
    const x = 256 + Math.cos(a) * d, y = 256 + Math.sin(a) * d;
    const l = 70 + (1 - y / CS) * 22 + (i / n) * 6, R0 = 14 + r() * 10, rot = r();
    for (let k = 0; k < 4; k++) {
      const th = rot + (k / 4) * Math.PI * 2;
      ctx.fillStyle = hsl(40, 12, Math.min(98, l + (r() - 0.5) * 6));
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(th) * R0 * 0.55, y + Math.sin(th) * R0 * 0.55, R0 * 0.55, R0 * 0.42, th, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(90,90,60,0.5)';
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
}

/** Fern-like frond fan, used under trees and at bed edges. */
function fern(ctx: Ctx, r: R) {
  for (let f = 0; f < 7; f++) {
    const a = (f / 6 - 0.5) * 2.2 + (r() - 0.5) * 0.2, len = 330 + r() * 130;
    ctx.strokeStyle = '#56703a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(256, 508);
    const tx = 256 + Math.sin(a) * len, ty = 508 - Math.cos(a) * len;
    ctx.lineTo(tx, ty);
    ctx.stroke();
    for (let k = 1; k < 22; k++) {
      const t = k / 22, px = 256 + (tx - 256) * t, py = 508 + (ty - 508) * t;
      const pl = 60 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (1 - t * 0.3);
      for (const sd of [-1, 1]) leaf(ctx, px, py, a + sd * 1.25, pl, 11, 95, 45, 26 + t * 10);
    }
  }
}

/** A tuft of long meadow grass: arching blades from one crown, some carrying seed heads. */
function meadow(ctx: Ctx, r: R, o: { h: number; s: number; l: number; dry: number; blades: number }) {
  for (let i = 0; i < o.blades; i++) {
    const x0 = 256 + (r() - 0.5) * 150, a = (r() - 0.5) * 1.1, len = 250 + r() * 240;
    const bend = (r() - 0.5) * 140 + Math.sin(a) * 60;
    const tx = x0 + Math.sin(a) * len + bend, ty = 508 - Math.cos(a) * len;
    const dry = r() < o.dry;
    const l = o.l + (i / o.blades) * 12 + (r() - 0.5) * 6;
    ctx.strokeStyle = dry ? hsl(44 + r() * 8, 35 + r() * 15, 55 + r() * 12) : hsl(o.h + (r() - 0.5) * 16, o.s + (r() - 0.5) * 12, l);
    ctx.lineWidth = 3 + r() * 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, 510);
    ctx.quadraticCurveTo(x0 + Math.sin(a) * len * 0.5, 508 - Math.cos(a) * len * 0.6, tx, ty);
    ctx.stroke();
    if (r() < 0.22) {
      ctx.fillStyle = hsl(40 + r() * 10, 30, 60 + r() * 15);
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.ellipse(tx - Math.sin(a) * k * 7, ty + k * 7, 3.5, 7, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** Meadow grass with wildflowers on thin stems: poppies, buttercups, cornflowers, yarrow. */
function wildMeadow(ctx: Ctx, r: R) {
  meadow(ctx, r, { h: 95, s: 42, l: 24, dry: 0.08, blades: 70 });
  const kinds = [[4, 82, 52], [52, 95, 58], [218, 72, 58], [45, 15, 94]] as const;
  for (let i = 0; i < 16; i++) {
    const [h, sat, l] = kinds[Math.floor(r() * kinds.length)];
    const x0 = 256 + (r() - 0.5) * 180, tx = x0 + (r() - 0.5) * 120, ty = 60 + r() * 220;
    ctx.strokeStyle = '#5f7a3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, 510);
    ctx.quadraticCurveTo((x0 + tx) / 2 + (r() - 0.5) * 40, (510 + ty) / 2, tx, ty);
    ctx.stroke();
    const R0 = 14 + r() * 10;
    if (l > 90) {
      // Yarrow: a flat umbel of tiny white florets.
      for (let k = 0; k < 22; k++) {
        ctx.fillStyle = hsl(h, sat, l - r() * 8);
        ctx.beginPath();
        ctx.arc(tx + (r() - 0.5) * R0 * 2.4, ty + (r() - 0.5) * R0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    for (let k = 0; k < 5; k++) {
      const th = (k / 5) * Math.PI * 2 + r();
      ctx.fillStyle = hsl(h, sat, l + (r() - 0.5) * 8);
      ctx.beginPath();
      ctx.ellipse(tx + Math.cos(th) * R0 * 0.55, ty + Math.sin(th) * R0 * 0.45, R0 * 0.62, R0 * 0.42, th, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = h < 10 ? '#1d1410' : '#e3b934';
    ctx.beginPath();
    ctx.arc(tx, ty, R0 * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintCells() {
  const { c, ctx } = canvas(S, S);
  if (new URLSearchParams(location.search).has('atlas')) (window as unknown as { __atlas: HTMLCanvasElement }).__atlas = c;
  const r = rng(77);
  const paint: [number, (ctx: Ctx, r: R) => void][] = [
    [CELL.oak, (x, rr) => spray(x, rr, { h: 96, s: 44, l: 26, len: 60, wid: 22, density: 0.85 })],
    [CELL.linden, (x, rr) => spray(x, rr, { h: 88, s: 48, l: 32, len: 52, wid: 28, density: 0.8 })],
    [CELL.cypress, cypress],
    [CELL.box, box],
    [CELL.perennial, perennial],
    [CELL.ivy, ivy],
    [CELL.spike, spike],
    [CELL.hydrangea, hydrangea],
    [CELL.fern, fern],
    [CELL.far, (x, rr) => spray(x, rr, { h: 94, s: 40, l: 27, len: 80, wid: 34, density: 1 })],
    [CELL.meadow, (x, rr) => meadow(x, rr, { h: 92, s: 44, l: 23, dry: 0.06, blades: 110 })],
    [CELL.wildMeadow, wildMeadow],
    [CELL.laurel, (x, rr) => spray(x, rr, { h: 100, s: 38, l: 22, len: 88, wid: 34, density: 0.95 })],
    [CELL.dryGrass, (x, rr) => meadow(x, rr, { h: 60, s: 38, l: 45, dry: 0.55, blades: 100 })],
    ...Object.entries(FLOWERS).map(([k, fn]) => [Number(k), fn] as [number, (ctx: Ctx, r: R) => void]),
  ];
  for (const [cell, fn] of paint) {
    ctx.save();
    ctx.translate((cell % GRID) * CS, Math.floor(cell / GRID) * CS);
    ctx.beginPath();
    ctx.rect(4, 4, CS - 8, CS - 8);
    ctx.clip();
    fn(ctx, r);
    ctx.restore();
  }
  return ctx.getImageData(0, 0, S, S).data;
}

/** Fills fully transparent texels with the cell's mean colour, so filtering never pulls in black. */
function bleed(d: Uint8ClampedArray) {
  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      let rs = 0, gs = 0, bs = 0, n = 0;
      for (let y = cy * CS; y < (cy + 1) * CS; y += 2) {
        for (let x = cx * CS; x < (cx + 1) * CS; x += 2) {
          const k = (y * S + x) * 4;
          if (d[k + 3] > 200) { rs += d[k]; gs += d[k + 1]; bs += d[k + 2]; n++; }
        }
      }
      if (!n) continue;
      const mr = rs / n, mg = gs / n, mb = bs / n;
      for (let y = cy * CS; y < (cy + 1) * CS; y++) {
        for (let x = cx * CS; x < (cx + 1) * CS; x++) {
          const k = (y * S + x) * 4;
          if (d[k + 3] === 0) { d[k] = mr; d[k + 1] = mg; d[k + 2] = mb; }
        }
      }
    }
  }
}

/** Alpha-weighted box-filter mip chain; alpha is lifted a little per level to keep coverage. */
function mipChain(base: Uint8Array) {
  const levels: { data: Uint8Array; width: number; height: number }[] = [{ data: base, width: S, height: S }];
  let src = base, n = S;
  while (n > 1) {
    const m = n >> 1, dst = new Uint8Array(m * m * 4);
    for (let y = 0; y < m; y++) {
      for (let x = 0; x < m; x++) {
        let r = 0, g = 0, b = 0, a = 0, pr = 0, pg = 0, pb = 0;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const k = ((y * 2 + dy) * n + x * 2 + dx) * 4, al = src[k + 3];
          r += src[k] * al; g += src[k + 1] * al; b += src[k + 2] * al; a += al;
          pr += src[k]; pg += src[k + 1]; pb += src[k + 2];
        }
        const k = (y * m + x) * 4;
        if (a > 0) { dst[k] = r / a; dst[k + 1] = g / a; dst[k + 2] = b / a; } else { dst[k] = pr / 4; dst[k + 1] = pg / 4; dst[k + 2] = pb / 4; }
        dst[k + 3] = Math.min(255, (a / 4) * 1.16);
      }
    }
    levels.push({ data: dst, width: m, height: m });
    src = dst;
    n = m;
  }
  return levels;
}

let atlas: THREE.DataTexture | null = null;
export function foliageAtlas() {
  if (atlas) return atlas;
  const px = paintCells();
  bleed(px);
  const base = new Uint8Array(px.buffer, px.byteOffset, px.byteLength);
  const t = new THREE.DataTexture(base, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.mipmaps = mipChain(base) as unknown as THREE.CompressedTextureMipmap[];
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return (atlas = t);
}

let coverage = true;
/** Alpha-to-coverage gives soft leaf edges, but only when the frame is multisampled. */
export function setFoliageCoverage(on: boolean) { coverage = on; }

/** Alpha-cut, double-sided, wind-swayed leaf material lit with the sun behind it. */
export function foliageMaterial(bendH: number, amp: number, freq: number, opts: { roughness?: number; translucency?: number } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: foliageAtlas(),
    vertexColors: true,
    roughness: opts.roughness ?? 0.78,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    alphaToCoverage: coverage,
  });
  return applyWind(m, bendH, amp, freq, opts.translucency ?? 0.5);
}

/** Tileable bark: vertical furrows and ridges, plus a matching bump map. */
export function barkTextures() {
  const W = 512, H = 1024;
  const col = canvas(W, H), bump = canvas(W, H);
  const r = rng(19);
  col.ctx.fillStyle = '#6b5643';
  col.ctx.fillRect(0, 0, W, H);
  bump.ctx.fillStyle = '#606060';
  bump.ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 180; i++) {
    const x0 = r() * W, w = 6 + r() * 22, l = 22 + r() * 18, dark = r() < 0.45;
    const seg = 16 + r() * 40;
    for (const off of [0, -W, W]) {
      for (const [ctx, style] of [[col.ctx, dark ? `hsla(26,22%,${l * 0.55}%,0.8)` : `hsla(32,${14 + r() * 10}%,${l + 12}%,0.7)`], [bump.ctx, dark ? 'rgba(10,10,10,0.8)' : 'rgba(230,230,230,0.6)']] as const) {
        ctx.strokeStyle = style;
        ctx.lineWidth = dark ? w * 0.4 : w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let x = x0 + off;
        ctx.moveTo(x, -20);
        for (let y = 0; y <= H + 20; y += seg) {
          x += (r() - 0.5) * 10;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  // Lichen and moss flecks.
  for (let i = 0; i < 160; i++) {
    col.ctx.fillStyle = r() < 0.6 ? `hsla(80,22%,${40 + r() * 15}%,0.25)` : `hsla(40,10%,${55 + r() * 15}%,0.2)`;
    col.ctx.beginPath();
    col.ctx.arc(r() * W, r() * H, 1 + r() * 3, 0, Math.PI * 2);
    col.ctx.fill();
  }
  const map = tex(col.c);
  const b = tex(bump.c, { srgb: false });
  for (const t of [map, b]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return { map, bump: b };
}

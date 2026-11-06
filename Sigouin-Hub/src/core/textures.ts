// Procedural textures painted on canvas at load time. Nothing here is downloaded, which keeps
// the initial payload tiny and lets the boot bar track real work.
import * as THREE from 'three';
import { rng, fbm } from './util';

export const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
export const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const MONO = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

let maxAniso = 8;
export function setMaxAnisotropy(a: number) { maxAniso = a; }

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: false })!;
  return { c, ctx };
}

export function tex(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: number; aniso?: boolean } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat, opts.repeat);
  }
  t.anisotropy = opts.aniso === false ? 1 : maxAniso;
  t.needsUpdate = true;
  return t;
}

/** Tileable grey value noise, used as a multiply layer for stone and grass. */
export function noiseCanvas(size = 256, period = 16, seed = 3, octaves = 4) {
  const { c, ctx } = canvas(size, size);
  const img = ctx.createImageData(size, size);
  const r = rng(seed);
  const grids: Float32Array[] = [];
  for (let o = 0; o < octaves; o++) {
    const p = period << o;
    const g = new Float32Array(p * p);
    for (let i = 0; i < g.length; i++) g[i] = r();
    grids.push(g);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0, amp = 0.5, tot = 0;
      for (let o = 0; o < octaves; o++) {
        const p = period << o;
        const fx = (x / size) * p, fy = (y / size) * p;
        const xi = Math.floor(fx), yi = Math.floor(fy);
        const tx = fx - xi, ty = fy - yi;
        const u = tx * tx * (3 - 2 * tx), w = ty * ty * (3 - 2 * ty);
        const g = grids[o];
        const a = g[(yi % p) * p + (xi % p)], b = g[(yi % p) * p + ((xi + 1) % p)];
        const cc = g[((yi + 1) % p) * p + (xi % p)], d = g[((yi + 1) % p) * p + ((xi + 1) % p)];
        v += amp * (a + (b - a) * u + (cc - a) * w + (a - b - cc + d) * u * w);
        tot += amp;
        amp *= 0.5;
      }
      const n = Math.round((v / tot) * 255);
      const k = (y * size + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = n;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

let _noise: HTMLCanvasElement | null = null;
export function sharedNoise() { return (_noise ??= noiseCanvas(256, 8, 11, 5)); }

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, scale = 1) {
  const n = sharedNoise();
  const pat = ctx.createPattern(n, 'repeat')!;
  pat.setTransform(new DOMMatrix().scale(scale, scale));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Pale limestone ashlar. UVs are in metres; one tile = 2.4 m. */
export function limestone(seed = 1, tint = '#e8ddc8') {
  const S = 1024, M = 2.4, px = S / M;
  const col = canvas(S, S), bump = canvas(S, S);
  const r = rng(seed);
  col.ctx.fillStyle = '#cfc2aa';
  col.ctx.fillRect(0, 0, S, S);
  bump.ctx.fillStyle = '#303030';
  bump.ctx.fillRect(0, 0, S, S);
  const rowH = 0.4 * px, gap = 0.014 * px;
  const base = new THREE.Color(tint);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  for (let row = 0; row < 6; row++) {
    let x = r() * S;
    const y = row * rowH;
    const start = x;
    while (x < start + S) {
      const len = (0.55 + r() * 0.75) * px;
      const c = new THREE.Color().setHSL(hsl.h + (r() - 0.5) * 0.02, hsl.s * (0.8 + r() * 0.4), hsl.l + (r() - 0.5) * 0.07);
      for (const off of [0, -S]) {
        const bx = x + off;
        col.ctx.fillStyle = `#${c.getHexString()}`;
        col.ctx.fillRect(bx + gap / 2, y + gap / 2, len - gap, rowH - gap);
        const g = col.ctx.createLinearGradient(0, y, 0, y + rowH);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(60,40,20,0.10)');
        col.ctx.fillStyle = g;
        col.ctx.fillRect(bx + gap / 2, y + gap / 2, len - gap, rowH - gap);
        bump.ctx.fillStyle = `rgb(${200 + r() * 30},${200 + r() * 30},${200 + r() * 30})`;
        bump.ctx.fillRect(bx + gap, y + gap, len - gap * 2, rowH - gap * 2);
      }
      x += len;
    }
  }
  speckle(col.ctx, S, S, 0.28, 2);
  speckle(bump.ctx, S, S, 0.5, 1);
  return { map: tex(col.c, { repeat: 1 / M }), bump: tex(bump.c, { repeat: 1 / M, srgb: false }) };
}

/** Warm timber boards (vertical). One tile = 2 m. */
export function planks(seed = 2) {
  const S = 1024, M = 2, px = S / M;
  const col = canvas(S, S), bump = canvas(S, S);
  const r = rng(seed);
  const w = 0.19 * px;
  for (let x = 0, i = 0; x < S; x += w, i++) {
    const l = 0.3 + r() * 0.08;
    const c = new THREE.Color().setHSL(0.075 + r() * 0.012, 0.52 + r() * 0.1, l);
    col.ctx.fillStyle = `#${c.getHexString()}`;
    col.ctx.fillRect(x, 0, w, S);
    for (let k = 0; k < 26; k++) {
      const gx = x + r() * w;
      col.ctx.strokeStyle = `rgba(${40 + r() * 30},${20 + r() * 15},8,${0.12 + r() * 0.18})`;
      col.ctx.lineWidth = 0.6 + r() * 1.6;
      col.ctx.beginPath();
      col.ctx.moveTo(gx, 0);
      for (let y = 0; y <= S; y += 64) col.ctx.lineTo(gx + Math.sin(y * 0.01 + k + i) * 2.5, y);
      col.ctx.stroke();
    }
    col.ctx.fillStyle = 'rgba(30,15,5,0.85)';
    col.ctx.fillRect(x, 0, 3, S);
    bump.ctx.fillStyle = '#d0d0d0';
    bump.ctx.fillRect(x + 4, 0, w - 6, S);
    bump.ctx.fillStyle = '#202020';
    bump.ctx.fillRect(x, 0, 4, S);
  }
  speckle(col.ctx, S, S, 0.2, 3);
  return { map: tex(col.c, { repeat: 1 / M }), bump: tex(bump.c, { repeat: 1 / M, srgb: false }) };
}

/** Slate shingles for pitched roofs. One tile = 2 m. */
export function shingles(seed = 4) {
  const S = 512, M = 2, px = S / M;
  const { c, ctx } = canvas(S, S);
  const r = rng(seed);
  ctx.fillStyle = '#3d4046';
  ctx.fillRect(0, 0, S, S);
  const rowH = 0.2 * px, w = 0.3 * px;
  for (let row = 0; row < S / rowH; row++) {
    const off = (row % 2) * w * 0.5;
    for (let x = -w; x < S + w; x += w) {
      const l = 0.22 + r() * 0.08;
      ctx.fillStyle = `#${new THREE.Color().setHSL(0.6, 0.08, l).getHexString()}`;
      ctx.fillRect(x + off + 1, row * rowH + 1, w - 2, rowH - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + off, row * rowH + rowH - 4, w, 4);
    }
  }
  speckle(ctx, S, S, 0.2, 2);
  return tex(c, { repeat: 1 / M });
}

export type SignStyle = 'stone' | 'wood' | 'backlit' | 'engraved';
/** Sign faces. Canvas aspect matches the physical sign so letters are never stretched. */
export function signTexture(text: string, style: SignStyle, aspect: number) {
  const W = 2048, H = Math.round(W / aspect);
  const { c, ctx } = canvas(W, H);
  const pad = H * 0.08;
  if (style === 'backlit') {
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(140,170,220,0.35)';
    ctx.lineWidth = H * 0.025;
    ctx.strokeRect(pad * 0.6, pad * 0.6, W - pad * 1.2, H - pad * 1.2);
  } else if (style === 'wood') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f3e6c8');
    g.addColorStop(1, '#e4d2ac');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 0.12, 4);
    ctx.strokeStyle = '#6b4424';
    ctx.lineWidth = H * 0.06;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, style === 'engraved' ? '#ece2cf' : '#f0e7d6');
    g.addColorStop(1, style === 'engraved' ? '#dccfb6' : '#e2d6c0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 0.18, 3);
    ctx.strokeStyle = 'rgba(90,70,45,0.35)';
    ctx.lineWidth = H * 0.018;
    ctx.strokeRect(pad * 0.5, pad * 0.5, W - pad, H - pad);
  }
  let size = H * 0.6;
  ctx.font = `${style === 'backlit' ? 500 : 600} ${size}px ${SERIF}`;
  const maxW = W - pad * 4;
  const m = ctx.measureText(text).width;
  if (m > maxW) {
    size *= maxW / m;
    ctx.font = `${style === 'backlit' ? 500 : 600} ${size}px ${SERIF}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = H * 0.54;
  if (style === 'backlit') {
    ctx.shadowColor = 'rgba(200,225,255,0.9)';
    ctx.shadowBlur = H * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, W / 2, y);
    ctx.shadowBlur = 0;
    ctx.fillText(text, W / 2, y);
  } else {
    ctx.fillStyle = 'rgba(255,250,240,0.55)';
    ctx.fillText(text, W / 2, y + H * 0.012);
    ctx.fillStyle = style === 'wood' ? '#2e1a0c' : '#231f1a';
    ctx.fillText(text, W / 2, y);
  }
  return tex(c);
}

export interface ScreenOpts { title: string; subtitle?: string; theme?: 'blue' | 'warm' | 'dark' | 'cyan'; w?: number; h?: number }
/** Monitor faces. Bright colours; the material makes them emissive so they bloom slightly. */
export function screenTexture(o: ScreenOpts) {
  const W = o.w ?? 512, H = o.h ?? 320;
  const { c, ctx } = canvas(W, H);
  const themes = {
    blue: ['#0b2c6b', '#1f62c9', '#e8f1ff'],
    warm: ['#3a2414', '#9a5a2a', '#fff2e0'],
    dark: ['#10151c', '#23303e', '#e6edf5'],
    cyan: ['#04162b', '#0b4f7a', '#d9f6ff'],
  } as const;
  const [a, b, fg] = themes[o.theme ?? 'blue'];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.6);
  rg.addColorStop(0, 'rgba(255,255,255,0.18)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 0, W, H * 0.07);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = H * 0.16;
  ctx.font = `600 ${size}px ${SANS}`;
  const mw = ctx.measureText(o.title).width;
  if (mw > W * 0.86) { size *= (W * 0.86) / mw; ctx.font = `600 ${size}px ${SANS}`; }
  ctx.fillText(o.title, W / 2, o.subtitle ? H * 0.45 : H * 0.52);
  if (o.subtitle) {
    ctx.globalAlpha = 0.75;
    ctx.font = `400 ${H * 0.075}px ${SANS}`;
    ctx.fillText(o.subtitle, W / 2, H * 0.64);
    ctx.globalAlpha = 1;
  }
  return tex(c);
}

/** Soft cumulus card. */
export function cloudTexture(seed: number) {
  const W = 512, H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rng(seed);
  const puffs: [number, number, number][] = [];
  const n = 26 + Math.floor(r() * 10);
  for (let i = 0; i < n; i++) {
    const t = r();
    const x = W * (0.12 + t * 0.76);
    const dome = Math.sin(t * Math.PI);
    const y = H * (0.72 - dome * (0.25 + r() * 0.22));
    const rad = H * (0.1 + dome * 0.16 + r() * 0.07);
    puffs.push([x, y, rad]);
  }
  for (const [x, y, rad] of puffs) {
    const g = ctx.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(250,250,255,0.75)');
    g.addColorStop(1, 'rgba(240,240,250,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shade the underside so the cloud reads as a volume lit from above.
  ctx.globalCompositeOperation = 'source-atop';
  const sh = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.8);
  sh.addColorStop(0, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(150,150,185,0.55)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  const fade = ctx.createLinearGradient(0, H * 0.74, 0, H * 0.84);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  const t = tex(c, { aniso: false });
  return t;
}

export function radialSprite(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const { c, ctx } = canvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return tex(c, { aniso: false });
}

/** Granite with lichen: colour and bump maps for the boulders and scattered rocks. */
export function rockTextures() {
  const S = 512;
  const col = canvas(S, S), bump = canvas(S, S);
  const r = rng(29);
  const img = col.ctx.createImageData(S, S), bimg = bump.ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n = fbm(x * 0.02, y * 0.02, 5), f = fbm(x * 0.15, y * 0.15, 2);
      const crack = Math.abs(fbm(x * 0.012 + 7, y * 0.012, 4) - 0.5) < 0.008 ? 0.8 : 1;
      const v = (95 + n * 70 + f * 30) * crack;
      const k = (y * S + x) * 4;
      img.data[k] = v * 1.02; img.data[k + 1] = v * 0.99; img.data[k + 2] = v * 0.93; img.data[k + 3] = 255;
      const b = (70 + n * 120 + f * 60) * crack;
      bimg.data[k] = bimg.data[k + 1] = bimg.data[k + 2] = b; bimg.data[k + 3] = 255;
    }
  }
  col.ctx.putImageData(img, 0, 0);
  bump.ctx.putImageData(bimg, 0, 0);
  for (let i = 0; i < 90; i++) {
    col.ctx.fillStyle = r() < 0.6 ? `hsla(75,30%,${45 + r() * 15}%,0.55)` : `hsla(48,25%,${70 + r() * 10}%,0.45)`;
    col.ctx.beginPath();
    col.ctx.arc(r() * S, r() * S, 3 + r() * 14, 0, Math.PI * 2);
    col.ctx.fill();
  }
  const map = tex(col.c), b = tex(bump.c, { srgb: false });
  for (const t of [map, b]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return { map, bump: b };
}

/** Meadow ground detail, 6 m per tile: grass strokes, clover and bare patches around mid-grey,
 * multiplied onto the terrain's vertex colours so fields and hills keep their own hue. */
export function groundDetail() {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  const r = rng(37);
  ctx.fillStyle = '#c9cdb8';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, rad = 30 + r() * 110;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < 0.5 ? 'rgba(150,140,100,0.25)' : 'rgba(235,240,215,0.22)';
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 26000; i++) {
    const x = r() * S, y = r() * S, len = 5 + r() * 12, a = -Math.PI / 2 + (r() - 0.5) * 1.2;
    const l = 55 + r() * 45;
    ctx.strokeStyle = `hsla(${70 + r() * 30},${10 + r() * 25}%,${l}%,0.55)`;
    ctx.lineWidth = 1 + r() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  const t = tex(c, { repeat: 1 });
  return t;
}

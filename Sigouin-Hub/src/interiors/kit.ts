// Interior-only helpers: floor textures, live terminal screens, blinking rack LEDs,
// the whiteboard diagram, and a few soft furnishings.
import * as THREE from 'three';
import { canvas, tex, sharedNoise, SANS, MONO } from '../core/textures';
import { Batch, mat, boxM, rng } from '../core/util';
import { globalUniforms } from '../core/shaders';
import type { FMats } from '../buildings/furniture';

export function floorTexture(kind: 'carpet' | 'oak' | 'concrete' | 'dark', metres: number) {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  const r = rng(kind.length * 13);
  if (kind === 'carpet') {
    const n = 8;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#3c4552' : '#454f5d';
      ctx.fillRect((x * S) / n, (y * S) / n, S / n, S / n);
    }
  } else if (kind === 'oak') {
    const bw = S / 8;
    for (let x = 0; x < 8; x++) {
      let y = -r() * 400;
      while (y < S) {
        const len = 300 + r() * 500;
        const l = 0.5 + r() * 0.1;
        ctx.fillStyle = `#${new THREE.Color().setHSL(0.08, 0.45, l).getHexString()}`;
        ctx.fillRect(x * bw + 1, y + 1, bw - 2, len - 2);
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = `rgba(90,50,20,${0.05 + r() * 0.08})`;
          ctx.fillRect(x * bw + r() * bw, y, 1 + r() * 2, len);
        }
        y += len;
      }
    }
  } else {
    ctx.fillStyle = kind === 'dark' ? '#171b24' : '#9a948b';
    ctx.fillRect(0, 0, S, S);
  }
  const pat = ctx.createPattern(sharedNoise(), 'repeat')!;
  ctx.globalCompositeOperation = kind === 'dark' ? 'overlay' : 'multiply';
  ctx.globalAlpha = kind === 'carpet' ? 0.5 : kind === 'dark' ? 0.25 : 0.3;
  pat.setTransform(new DOMMatrix().scale(kind === 'carpet' ? 0.5 : 2, kind === 'carpet' ? 0.5 : 2));
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, S, S);
  if (kind === 'concrete' || kind === 'dark') {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = kind === 'dark' ? 'rgba(90,140,220,0.18)' : 'rgba(40,35,30,0.25)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo((i * S) / 4, 0); ctx.lineTo((i * S) / 4, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i * S) / 4); ctx.lineTo(S, (i * S) / 4); ctx.stroke();
    }
  }
  return tex(c, { repeat: 1 / metres });
}

const LINES = [
  '$ git pull --rebase', 'Already up to date.', '$ npm run build', 'vite v8 building for production...', '✓ 214 modules transformed.',
  '$ agent spawn --count 3', 'worker-1 ready', 'worker-2 ready', 'worker-3 ready', 'plan: 6 steps', 'step 1/6 ok', 'step 2/6 ok',
  'tests: 48 passed, 0 failed', 'verify: live matches local', 'embedding 1,024 chunks', 'loss 0.0421  lr 3e-4', 'eval acc 0.912',
  'tokens/s 184', 'cache hit 97%', 'deploy: done in 41s', '$ tail -f agent.log', 'waiting for review...', 'review: 2 notes, fixed',
];

/** A monitor that scrolls believable terminal output. */
export class Terminal {
  texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private lines: string[] = [];
  private acc = 0;
  private r = rng(7);
  constructor(public title: string, seed = 1) {
    const { c, ctx } = canvas(512, 320);
    this.ctx = ctx;
    this.r = rng(seed);
    for (let i = 0; i < 12; i++) this.lines.push(LINES[Math.floor(this.r() * LINES.length)]);
    this.texture = tex(c, { aniso: false });
    this.draw();
  }
  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#06101c';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#0f2a44';
    ctx.fillRect(0, 0, 512, 34);
    ctx.fillStyle = '#9fdcff';
    ctx.font = `600 18px ${SANS}`;
    ctx.fillText(this.title, 14, 23);
    ctx.font = `15px ${MONO}`;
    this.lines.slice(-14).forEach((l, i) => {
      ctx.fillStyle = l.startsWith('$') ? '#e8f4ff' : l.startsWith('✓') || l.includes('ok') || l.includes('passed') ? '#7ef2a8' : '#6fb6e8';
      ctx.fillText(l, 14, 58 + i * 19);
    });
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(14, 58 + Math.min(13, this.lines.length) * 19 - 13, 9, 15);
    this.texture.needsUpdate = true;
  }
  setTitle(t: string) { this.title = t; this.draw(); }
  update(dt: number) {
    this.acc += dt;
    if (this.acc < 0.35) return;
    this.acc = 0;
    this.lines.push(LINES[Math.floor(this.r() * LINES.length)]);
    if (this.lines.length > 40) this.lines.splice(0, 20);
    this.draw();
  }
}

const LED_V = /* glsl */ `
attribute vec3 aLed;
uniform float uTime;
varying vec3 vC;
varying float vOn;
void main() {
  vec3 c = aLed.z < 0.5 ? vec3(0.25, 1.0, 0.45) : aLed.z < 1.5 ? vec3(0.35, 0.65, 1.0) : vec3(1.0, 0.72, 0.25);
  float on = step(0.35, fract(uTime * aLed.x + aLed.y));
  float flick = step(0.9, fract(uTime * aLed.x * 6.3 + aLed.y * 3.1));
  vOn = mix(0.12, 1.0, max(on * 0.75, flick));
  vC = c;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const LED_F = /* glsl */ `
varying vec3 vC;
varying float vOn;
void main() {
  gl_FragColor = vec4(vC * vOn * 3.2, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Blinking status LEDs across a set of rack fronts. */
export function rackLeds(fronts: THREE.Matrix4[], perRack = 36) {
  const r = rng(3);
  const n = fronts.length * perRack;
  const geo = new THREE.BoxGeometry(0.018, 0.012, 0.01);
  const m = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ uniforms: { uTime: globalUniforms.uTime }, vertexShader: LED_V, fragmentShader: LED_F }), n);
  const data = new Float32Array(n * 3);
  let i = 0;
  const local = new THREE.Matrix4();
  for (const f of fronts) {
    for (let k = 0; k < perRack; k++, i++) {
      const u = k % 12, col = Math.floor(k / 12);
      local.makeTranslation(-0.22 + col * 0.03, 0.2 + u * 0.15, 0.52);
      m.setMatrixAt(i, f.clone().multiply(local));
      data.set([0.4 + r() * 2.5, r(), Math.floor(r() * 3)], i * 3);
    }
  }
  geo.setAttribute('aLed', new THREE.InstancedBufferAttribute(data, 3));
  m.frustumCulled = false;
  return m;
}

export function whiteboardTexture(title: string) {
  const W = 1024, H = 512;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pen = (color: string, w = 5) => { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; };
  pen('#1f3f8a');
  ctx.font = `600 44px "Marker Felt", "Comic Sans MS", ${SANS}`;
  ctx.fillText(title, 40, 70);
  pen('#1f3f8a', 3);
  ctx.beginPath(); ctx.moveTo(40, 88); ctx.lineTo(40 + ctx.measureText(title).width, 92); ctx.stroke();
  const box = (x: number, y: number, label: string, color: string) => {
    pen(color, 4);
    ctx.beginPath();
    ctx.roundRect(x, y, 190, 80, 12);
    ctx.stroke();
    ctx.font = `30px "Marker Felt", "Comic Sans MS", ${SANS}`;
    ctx.fillText(label, x + 22, y + 51);
  };
  box(60, 170, 'source', '#2f6b3a');
  box(420, 170, 'rsync', '#1f3f8a');
  box(780, 170, 'NAS', '#8a2f3a');
  box(420, 360, 'schedule', '#1f3f8a');
  pen('#333', 4);
  const arrow = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 18 * Math.cos(a - 0.4), y1 - 18 * Math.sin(a - 0.4));
    ctx.moveTo(x1, y1); ctx.lineTo(x1 - 18 * Math.cos(a + 0.4), y1 - 18 * Math.sin(a + 0.4)); ctx.stroke();
  };
  arrow(252, 210, 414, 210);
  arrow(612, 210, 774, 210);
  arrow(515, 356, 515, 256);
  pen('#8a2f3a', 3);
  ctx.font = `26px "Marker Felt", "Comic Sans MS", ${SANS}`;
  ctx.fillText('nightly · keep 30', 640, 420);
  return tex(c);
}

export function sofa(b: Batch, f: FMats, base: THREE.Matrix4) {
  const at = (x: number, y: number, z: number) => base.clone().multiply(mat(x, y, z));
  b.add(boxM(2.2, 0.42, 0.9), f.fabric, at(0, 0.21, 0));
  b.add(boxM(2.2, 0.55, 0.22), f.fabric, at(0, 0.62, -0.34));
  for (const s of [-1, 1]) b.add(boxM(0.22, 0.62, 0.9), f.fabric, at(s * 1.0, 0.31, 0));
  for (const s of [-0.5, 0.5]) b.add(boxM(0.95, 0.14, 0.7), f.fabric, at(s, 0.49, 0.06));
}

export function bookshelf(b: Batch, f: FMats, base: THREE.Matrix4, w = 2, h = 2.2) {
  const at = (x: number, y: number, z: number) => base.clone().multiply(mat(x, y, z));
  b.add(boxM(w, h, 0.03), f.walnut, at(0, h / 2, -0.155));
  for (const s of [-1, 1]) b.add(boxM(0.04, h, 0.34), f.walnut, at(s * (w / 2 - 0.02), h / 2, 0));
  b.add(boxM(w, 0.04, 0.34), f.walnut, at(0, h - 0.02, 0));
  const r = rng(5);
  const books = [f.guitarRed, f.accentBlue, f.ivory, f.fabric, f.oak, f.drumRed, f.white];
  for (let s = 0; s < 5; s++) {
    const y = 0.12 + s * (h / 5);
    b.add(boxM(w - 0.06, 0.025, 0.3), f.oak, at(0, y, 0.02));
    let x = -w / 2 + 0.08;
    while (x < w / 2 - 0.12) {
      const bw = 0.03 + r() * 0.04, bh = 0.2 + r() * 0.14;
      if (r() < 0.9) b.add(boxM(bw, bh, 0.22), books[Math.floor(r() * books.length)], at(x + bw / 2, y + bh / 2 + 0.013, 0.04));
      x += bw + 0.004;
    }
  }
}

export function rug(b: Batch, material: THREE.Material, base: THREE.Matrix4, w: number, d: number, round = false) {
  const g = round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  b.add(g, material, base.clone().multiply(mat(0, 0.012, 0)));
}

export function pendant(b: Batch, f: FMats, x: number, z: number, ceiling: number, drop = 1.2) {
  b.add(new THREE.CylinderGeometry(0.006, 0.006, drop, 4), f.black, mat(x, ceiling - drop / 2, z));
  b.add(new THREE.CylinderGeometry(0.1, 0.28, 0.28, 20, 1, true), f.black, mat(x, ceiling - drop - 0.1, z));
  b.add(new THREE.SphereGeometry(0.09, 12, 8), f.lampShade, mat(x, ceiling - drop - 0.16, z));
}

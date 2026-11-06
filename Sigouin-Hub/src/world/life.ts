// Ambient life: butterflies over the beds, birds crossing the sky, dust motes in the sunlight.
import * as THREE from 'three';
import { canvas, tex } from '../core/textures';
import { rng } from '../core/util';
import { globalUniforms } from '../core/shaders';

function wingTexture() {
  const { c, ctx } = canvas(128, 128);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(70, 44, 52, 36, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(56, 92, 34, 26, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(20,15,10,0.8)';
  ctx.beginPath();
  ctx.ellipse(70, 44, 50, 34, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(96, 30, 7, 0, Math.PI * 2);
  ctx.fill();
  return tex(c, { aniso: false });
}

const DUST_V = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime, uScale;
varying float vA;
void main() {
  vec3 p = position;
  float t = uTime * (0.05 + aSeed.x * 0.06);
  p.x += sin(t * 3.0 + aSeed.y * 20.0) * 0.8;
  p.z += cos(t * 2.3 + aSeed.z * 20.0) * 0.8;
  p.y = mod(p.y + t * 1.5, 5.0) + 0.3;
  vA = smoothstep(0.3, 1.0, p.y) * (1.0 - smoothstep(4.0, 5.3, p.y)) * (0.4 + 0.6 * sin(uTime * (1.0 + aSeed.w) + aSeed.y * 30.0) * 0.5 + 0.3);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uScale * 0.012 / -mv.z;
}`;
const DUST_F = /* glsl */ `
uniform float uDay;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vec3(1.0, 0.9, 0.7) * 1.6, (1.0 - d * 2.0) * vA * uDay * 0.6);
}`;

export class Life {
  group = new THREE.Group();
  private wings: THREE.InstancedMesh;
  private birds: THREE.InstancedMesh;
  private flies: { cx: number; cz: number; r: number; ph: number; sp: number; h: number }[] = [];
  private flock: { r: number; ph: number; sp: number; y: number; off: THREE.Vector3; flap: number }[] = [];
  private dust: THREE.ShaderMaterial;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();

  constructor(bedSpots: [number, number][], amount: number) {
    const r = rng(55);
    const nFly = Math.max(4, Math.round(14 * amount));
    const wingGeo = new THREE.PlaneGeometry(0.075, 0.075);
    wingGeo.translate(0.0375, 0, 0);
    wingGeo.rotateX(-Math.PI / 2);
    this.wings = new THREE.InstancedMesh(wingGeo, new THREE.MeshStandardMaterial({ map: wingTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), nFly * 2);
    const cols = [0xf29a38, 0xfaf6ea, 0x6aa8ff, 0xf5d547, 0xe98bd0];
    for (let i = 0; i < nFly; i++) {
      const [cx, cz] = bedSpots[Math.floor(r() * bedSpots.length)] ?? [0, 0];
      this.flies.push({ cx, cz, r: 0.6 + r() * 1.4, ph: r() * 10, sp: 0.4 + r() * 0.5, h: 0.5 + r() * 0.6 });
      const c = new THREE.Color(cols[i % cols.length]);
      this.wings.setColorAt(i * 2, c);
      this.wings.setColorAt(i * 2 + 1, c);
    }
    this.wings.frustumCulled = false;
    this.group.add(this.wings);

    const nBird = 9;
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.18, 0, 0, 0.14, 0.62, 0.02, 0.02], 3));
    bg.computeVertexNormals();
    this.birds = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0x2b2a30, side: THREE.DoubleSide }), nBird * 2);
    for (let i = 0; i < nBird; i++) {
      this.flock.push({ r: 70 + r() * 10, ph: r() * 0.5, sp: 0.07, y: 34 + r() * 8, off: new THREE.Vector3((r() - 0.5) * 14, (r() - 0.5) * 4, (r() - 0.5) * 14), flap: r() * 6 });
    }
    this.birds.frustumCulled = false;
    this.group.add(this.birds);

    const n = Math.round(420 * amount);
    const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * 50, r() * 5, (r() - 0.5) * 50 - 2], i * 3);
      seed.set([r(), r(), r(), r()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.dust = new THREE.ShaderMaterial({
      uniforms: { uTime: globalUniforms.uTime, uScale: { value: 800 }, uDay: { value: 1 } },
      vertexShader: DUST_V, fragmentShader: DUST_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, this.dust);
    pts.frustumCulled = false;
    this.group.add(pts);
  }

  setViewport(h: number, fov: number) { this.dust.uniforms.uScale.value = h / (2 * Math.tan((fov * Math.PI) / 360)); }

  update(t: number, day: number, motion: boolean) {
    this.dust.uniforms.uDay.value = day;
    const tt = motion ? t : 0;
    this.flies.forEach((f, i) => {
      const a = tt * f.sp + f.ph;
      const x = f.cx + Math.sin(a) * f.r + Math.sin(a * 2.7) * 0.25;
      const z = f.cz + Math.cos(a * 0.8) * f.r;
      const y = f.h + Math.sin(a * 3.1) * 0.25 + Math.max(0, Math.sin(a * 0.37)) * 0.6;
      const dx = Math.cos(a) * f.r, dz = -Math.sin(a * 0.8) * f.r * 0.8;
      const heading = Math.atan2(dx, dz);
      const flap = Math.sin(tt * 22 + f.ph * 7) * 1.05;
      for (const side of [1, -1]) {
        this.q.setFromEuler(this.e.set(0, heading, side * flap, 'YXZ'));
        this.m.compose(this.v.set(x, y, z), this.q, this.s.set(side, 1, 1));
        this.wings.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), this.m);
      }
    });
    this.wings.instanceMatrix.needsUpdate = true;
    this.flock.forEach((b, i) => {
      const a = tt * b.sp + b.ph;
      const cx = -30, cz = -140;
      const x = cx + Math.sin(a) * b.r * 1.6 + b.off.x, z = cz + Math.cos(a) * b.r + b.off.z;
      const y = b.y + Math.sin(a * 3) * 3 + b.off.y;
      const heading = Math.atan2(Math.cos(a) * 1.6, -Math.sin(a));
      const flap = Math.sin(tt * 7 + b.flap) * 0.7;
      for (const side of [1, -1]) {
        this.q.setFromEuler(this.e.set(0, heading, side * flap, 'YXZ'));
        this.m.compose(this.v.set(x, y, z), this.q, this.s.set(side * 1.3, 1.3, 1.3));
        this.birds.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), this.m);
      }
    });
    this.birds.instanceMatrix.needsUpdate = true;
  }
}

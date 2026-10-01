// Three-tier stone fountain: lathed stone, refracting water surfaces with ripple rings, falling
// water sheets, and GPU particle streams (every droplet's arc is computed in the vertex shader).
import * as THREE from 'three';
import { waterMaterial, globalUniforms } from '../core/shaders';
import { Batch } from '../core/util';

const lathe = (pts: [number, number][], seg = 64) => {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.computeVertexNormals();
  return g;
};

const DROP_V = /* glsl */ `
attribute vec4 aData;
uniform float uTime, uScale;
varying float vAlpha;
void main() {
  float s = aData.x, rnd = aData.z;
  float ang = aData.y * 6.2831853;
  vec3 o, v;
  float yL;
  if (s < 0.5) {
    float sp = 0.18 + rnd * 0.32;
    o = vec3(0.0, 2.8, 0.0);
    v = vec3(cos(ang) * sp, 2.2 + rnd * 0.45, sin(ang) * sp);
    yL = 2.27;
  } else if (s < 1.5) {
    o = vec3(cos(ang) * 0.99, 2.28, sin(ang) * 0.99);
    v = vec3(cos(ang), 0.0, sin(ang)) * (0.3 + rnd * 0.22);
    v.y = -0.05;
    yL = 1.37;
  } else if (s < 2.5) {
    o = vec3(cos(ang) * 1.74, 1.39, sin(ang) * 1.74);
    v = vec3(cos(ang), 0.0, sin(ang)) * (0.36 + rnd * 0.3);
    v.y = -0.05;
    yL = 0.46;
  } else {
    float k = floor(aData.y * 6.0);
    float ja = k / 6.0 * 6.2831853 + 0.5235988;
    vec3 dir = -vec3(cos(ja), 0.0, sin(ja));
    o = vec3(cos(ja) * 3.0, 0.66, sin(ja) * 3.0);
    v = dir * (2.18 + (rnd - 0.5) * 0.14) + vec3(0.0, 2.05 + (rnd - 0.5) * 0.12, 0.0);
    v.xz += vec2(-dir.z, dir.x) * (fract(aData.y * 6.0) - 0.5) * 0.1;
    yL = 0.46;
  }
  float g = 9.8;
  float tEnd = (v.y + sqrt(v.y * v.y + 2.0 * g * max(o.y - yL, 0.01))) / g;
  float a = fract(uTime / tEnd + aData.w);
  float t = a * tEnd;
  vec3 p = o + v * t;
  p.y -= 0.5 * g * t * t;
  vAlpha = smoothstep(0.0, 0.06, a) * (1.0 - smoothstep(0.88, 1.0, a));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uScale * (0.03 + rnd * 0.022) / -mv.z;
}`;
const DROP_F = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = (1.0 - d * 2.0);
  gl_FragColor = vec4(uColor * (0.9 + 0.3 * (1.0 - d * 2.0)), a * vAlpha * 0.75);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const SHEET_V = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHEET_F = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float x = vUv.x * 220.0;
  float strand = 0.5 + 0.5 * sin(x + sin(vUv.x * 41.0) * 3.0);
  float flow = 0.5 + 0.5 * sin(vUv.y * 26.0 + uTime * 11.0 + sin(x * 0.37) * 2.0);
  float a = (0.1 + 0.34 * pow(strand, 4.0)) * (0.55 + 0.45 * flow);
  a *= smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  gl_FragColor = vec4(uColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Falling sheet following the same ballistic arc as the drip particles. */
function sheet(r0: number, y0: number, yL: number, vh: number) {
  const pts: [number, number][] = [];
  const tEnd = Math.sqrt((2 * (y0 - yL)) / 9.8);
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * tEnd;
    pts.push([r0 + vh * t, y0 - 4.9 * t * t]);
  }
  pts.reverse();
  return lathe(pts, 72);
}

export class Fountain {
  group = new THREE.Group();
  private dropMat: THREE.ShaderMaterial;
  private sheetMat: THREE.ShaderMaterial;
  private drops: THREE.Points;

  constructor(stone: THREE.Material, particleScale: number) {
    const b = new Batch();
    // Outer rim. Traced outside-in so the faces point out of the stone (the probe's normals
    // layer caught it the other way round: the whole wall was inside-out).
    b.add(lathe([[3.5, 0.0], [3.5, 0.06], [3.43, 0.12], [3.43, 0.53], [3.36, 0.61], [3.2, 0.65], [3.04, 0.6], [2.99, 0.5], [2.97, 0.1]]), stone);
    b.add(lathe([[0.001, 0.3], [0.9, 0.3], [0.9, 0.42], [0.72, 0.5], [0.5, 0.6], [0.4, 0.75], [0.36, 0.95], [0.5, 1.02], [0.001, 1.02]], 40), stone);
    b.add(lathe([[0.3, 0.98], [0.8, 1.04], [1.3, 1.16], [1.64, 1.3], [1.75, 1.39], [1.71, 1.44], [1.6, 1.4], [0.25, 1.33]]), stone);
    b.add(lathe([[0.001, 1.3], [0.3, 1.32], [0.22, 1.45], [0.15, 1.65], [0.14, 1.8], [0.22, 1.98], [0.001, 2.0]], 32), stone);
    b.add(lathe([[0.18, 1.96], [0.5, 2.0], [0.82, 2.1], [0.98, 2.22], [1.01, 2.29], [0.94, 2.32], [0.1, 2.24]]), stone);
    b.add(lathe([[0.001, 2.2], [0.16, 2.23], [0.1, 2.36], [0.075, 2.5], [0.15, 2.58], [0.12, 2.67], [0.05, 2.76], [0.001, 2.81]], 32), stone);
    // Six small jet nozzles on the rim.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const g = new THREE.CylinderGeometry(0.05, 0.07, 0.12, 10);
      b.add(g, stone, new THREE.Matrix4().makeTranslation(Math.cos(a) * 3.0, 0.66, Math.sin(a) * 3.0));
    }
    this.group.add(b.build({ name: 'fountain-stone' }));

    const water = waterMaterial('fountain');
    for (const [r, y] of [[2.99, 0.46], [1.62, 1.38], [0.95, 2.27]]) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 72), water);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = y;
      disc.receiveShadow = true;
      this.group.add(disc);
    }

    this.sheetMat = new THREE.ShaderMaterial({
      uniforms: { uTime: globalUniforms.uTime, uColor: { value: new THREE.Color(0xeaf6ff) } },
      vertexShader: SHEET_V, fragmentShader: SHEET_F, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.group.add(new THREE.Mesh(sheet(1.01, 2.29, 1.38, 0.42), this.sheetMat), new THREE.Mesh(sheet(1.75, 1.41, 0.46, 0.5), this.sheetMat));

    const counts = [300, 420, 720, 720].map((c) => Math.round(c * Math.max(0.35, particleScale)));
    const total = counts.reduce((a, c) => a + c, 0);
    const data = new Float32Array(total * 4);
    let k = 0;
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // Interleave streams so a partial draw range (low quality) thins every stream evenly.
    const order: number[] = [];
    counts.forEach((c, s) => { for (let i = 0; i < c; i++) order.push(s); });
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const s of order) data.set([s, rnd(), rnd(), rnd()], k++ * 4);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), 4);
    this.dropMat = new THREE.ShaderMaterial({
      uniforms: { uTime: globalUniforms.uTime, uScale: { value: 800 }, uColor: { value: new THREE.Color(0xf2f9ff) } },
      vertexShader: DROP_V, fragmentShader: DROP_F, transparent: true, depthWrite: false,
    });
    this.drops = new THREE.Points(geo, this.dropMat);
    this.group.add(this.drops);
  }

  setViewport(heightPx: number, fov: number) {
    this.dropMat.uniforms.uScale.value = heightPx / (2 * Math.tan((fov * Math.PI) / 360));
  }
  /** Water tints with the light so droplets do not glow at night. */
  setLight(c: THREE.Color, k: number) {
    (this.dropMat.uniforms.uColor.value as THREE.Color).copy(c).multiplyScalar(k);
    (this.sheetMat.uniforms.uColor.value as THREE.Color).copy(c).multiplyScalar(k);
  }
  setParticleFraction(f: number) {
    const total = this.drops.geometry.attributes.aData.count;
    this.drops.geometry.setDrawRange(0, Math.round(total * f));
  }
}

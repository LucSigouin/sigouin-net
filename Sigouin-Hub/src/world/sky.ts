// Sky dome, clouds, stars and the ~6 minute day cycle that drives every light in the courtyard.
import * as THREE from 'three';
import { cloudTexture } from '../core/textures';
import { rng, lerp, clamp } from '../core/util';

const V = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const F = /* glsl */ `
uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor;
uniform float uGlow, uDisc;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
  col = mix(col, uGround, smoothstep(0.0, -0.12, h));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSunColor * (pow(s, 6.0) * 0.28 * uGlow + pow(s, 48.0) * 0.5 * uGlow);
  col += uSunColor * smoothstep(0.99955, 0.9998, s) * uDisc;
  col += uHorizon * exp(-abs(h) * 18.0) * 0.12;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

interface Key {
  at: number; el: number; az: number; sun: string; si: number; zen: string; hor: string; glow: number;
  hs: string; hg: string; hi: number; fog: string; env: number; night: number; cloud: string;
}
// Phase 0 is the golden-hour look of the reference image.
const KEYS: Key[] = [
  { at: 0.0, el: 27, az: 150, sun: '#ffd6a0', si: 3.7, zen: '#4a84d4', hor: '#dfe6ea', glow: 0.5, hs: '#b9d0ec', hg: '#6e5c3e', hi: 0.72, fog: '#bcd0e2', env: 0.85, night: 0, cloud: '#ffffff' },
  { at: 0.18, el: 12, az: 165, sun: '#ffbd80', si: 2.6, zen: '#4a70b8', hor: '#f3c49a', glow: 0.9, hs: '#b1bfdc', hg: '#6c5540', hi: 0.9, fog: '#dcc4ae', env: 0.85, night: 0.08, cloud: '#ffe6d2' },
  { at: 0.28, el: 2, az: 178, sun: '#ff8d56', si: 1.2, zen: '#2e3d7c', hor: '#ea9c7e', glow: 1.25, hs: '#7a86bb', hg: '#3f3441', hi: 0.62, fog: '#98849a', env: 0.5, night: 0.6, cloud: '#f2a898' },
  { at: 0.38, el: -8, az: 182, sun: '#9fb2ea', si: 0.38, zen: '#161f4a', hor: '#4d4c7d', glow: 0.25, hs: '#3f4f88', hg: '#1d1b28', hi: 0.48, fog: '#2f3457', env: 0.28, night: 1, cloud: '#56608c' },
  { at: 0.54, el: -10, az: 100, sun: '#9fb2ea', si: 0.34, zen: '#10173a', hor: '#393c66', glow: 0.2, hs: '#36457c', hg: '#1a1824', hi: 0.44, fog: '#262a49', env: 0.25, night: 1, cloud: '#474f78' },
  { at: 0.64, el: 3, az: 92, sun: '#ffa676', si: 1.3, zen: '#3a4f95', hor: '#f1ae94', glow: 1.1, hs: '#8e9ccb', hg: '#4a3f42', hi: 0.68, fog: '#b9a2aa', env: 0.55, night: 0.5, cloud: '#f7c0ae' },
  { at: 0.76, el: 30, az: 118, sun: '#fff0dc', si: 3.8, zen: '#3f7fd6', hor: '#d4e3ee', glow: 0.3, hs: '#c0d9f2', hg: '#716a4e', hi: 0.8, fog: '#cfdde8', env: 1.05, night: 0, cloud: '#ffffff' },
  { at: 0.9, el: 36, az: 138, sun: '#fff3e2', si: 3.8, zen: '#4382d4', hor: '#dce4e8', glow: 0.35, hs: '#c4d9ef', hg: '#786b4c', hi: 0.78, fog: '#d0dbe3', env: 1.02, night: 0, cloud: '#ffffff' },
  { at: 1.0, el: 27, az: 150, sun: '#ffd6a0', si: 3.7, zen: '#4a84d4', hor: '#dfe6ea', glow: 0.5, hs: '#b9d0ec', hg: '#6e5c3e', hi: 0.72, fog: '#bcd0e2', env: 0.85, night: 0, cloud: '#ffffff' },
];
const C = (s: string) => new THREE.Color(s);
const PARSED = KEYS.map((k) => ({ ...k, sunC: C(k.sun), zenC: C(k.zen), horC: C(k.hor), hsC: C(k.hs), hgC: C(k.hg), fogC: C(k.fog), cloudC: C(k.cloud) }));

export interface SkyState {
  sunDir: THREE.Vector3; lightDir: THREE.Vector3; sunColor: THREE.Color; sunIntensity: number;
  hemiSky: THREE.Color; hemiGround: THREE.Color; hemiIntensity: number; fog: THREE.Color; env: number; night: number;
}

export function dirFrom(elDeg: number, azDeg: number, out = new THREE.Vector3()) {
  const el = (elDeg * Math.PI) / 180, az = (azDeg * Math.PI) / 180;
  // Azimuth measured from north (-z) towards east (+x).
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}

export class Sky {
  group = new THREE.Group();
  material: THREE.ShaderMaterial;
  state: SkyState;
  /** az0 is the starting angle, so the probe's frozen mode can put every cloud back. */
  clouds: { s: THREE.Sprite; az: number; az0: number; dist: number; y: number; speed: number }[] = [];
  private stars: THREE.Points;
  cycleSeconds = 360;

  constructor(cloudCount: number) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color(0x5b5a44) },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }, uGlow: { value: 1 }, uDisc: { value: 6 },
      },
      vertexShader: V,
      fragmentShader: F,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), this.material);
    dome.renderOrder = -10;
    dome.frustumCulled = false;
    this.group.add(dome);

    const r = rng(77);
    const cloudTex = [cloudTexture(1), cloudTexture(2), cloudTexture(3), cloudTexture(4)];
    const n = Math.round(14 * cloudCount);
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: cloudTex[i % 4], transparent: true, depthWrite: false, fog: false, opacity: 0.95 });
      const s = new THREE.Sprite(m);
      const dist = 900 + r() * 500;
      const w = 260 + r() * 300;
      s.scale.set(w, w * 0.5, 1);
      s.renderOrder = -9;
      const az = (i / n) * Math.PI * 1.3 - Math.PI * 0.65 + (r() - 0.5) * 0.25;
      this.clouds.push({ s, az, az0: az, dist, y: 140 + r() * 260, speed: 0.0012 + r() * 0.0015 });
      this.group.add(s);
    }

    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2;
      const y = Math.abs(u) * 0.9 + 0.05;
      const rr = Math.sqrt(1 - y * y);
      sp.set([Math.cos(th) * rr * 1800, y * 1800, Math.sin(th) * rr * 1800], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8ecff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.stars.renderOrder = -9;
    this.stars.frustumCulled = false;
    this.group.add(this.stars);

    this.state = {
      sunDir: new THREE.Vector3(), lightDir: new THREE.Vector3(), sunColor: new THREE.Color(), sunIntensity: 3,
      hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), hemiIntensity: 1, fog: new THREE.Color(), env: 1, night: 0,
    };
    this.setPhase(0);
  }

  setPhase(phase: number) {
    const p = ((phase % 1) + 1) % 1;
    let i = 0;
    while (i < PARSED.length - 2 && PARSED[i + 1].at <= p) i++;
    const a = PARSED[i], b = PARSED[i + 1];
    const t = clamp((p - a.at) / (b.at - a.at));
    const s = t * t * (3 - 2 * t);
    const st = this.state;
    const el = lerp(a.el, b.el, s), az = lerp(a.az, b.az, s);
    dirFrom(el, az, st.sunDir);
    dirFrom(Math.max(el, 14), az, st.lightDir);
    st.sunColor.lerpColors(a.sunC, b.sunC, s);
    st.sunIntensity = lerp(a.si, b.si, s);
    st.hemiSky.lerpColors(a.hsC, b.hsC, s);
    st.hemiGround.lerpColors(a.hgC, b.hgC, s);
    st.hemiIntensity = lerp(a.hi, b.hi, s);
    st.fog.lerpColors(a.fogC, b.fogC, s);
    st.env = lerp(a.env, b.env, s);
    st.night = lerp(a.night, b.night, s);
    const u = this.material.uniforms;
    (u.uZenith.value as THREE.Color).lerpColors(a.zenC, b.zenC, s);
    (u.uHorizon.value as THREE.Color).lerpColors(a.horC, b.horC, s);
    (u.uSunDir.value as THREE.Vector3).copy(st.sunDir);
    (u.uSunColor.value as THREE.Color).copy(st.sunColor);
    u.uGlow.value = lerp(a.glow, b.glow, s);
    u.uDisc.value = el > -2 ? 7 : 0;
    const cc = new THREE.Color().lerpColors(a.cloudC, b.cloudC, s);
    for (const c of this.clouds) (c.s.material as THREE.SpriteMaterial).color.copy(cc);
    (this.stars.material as THREE.PointsMaterial).opacity = clamp((st.night - 0.5) * 2) * 0.85;
  }

  update(elapsed: number, dt: number, camera: THREE.Camera) {
    this.setPhase(elapsed / this.cycleSeconds);
    for (const c of this.clouds) {
      c.az += c.speed * dt;
      c.s.position.set(camera.position.x + Math.sin(c.az) * c.dist, c.y, camera.position.z - Math.cos(c.az) * c.dist);
    }
    this.group.children[0].position.copy(camera.position);
    this.stars.position.copy(camera.position);
  }
}

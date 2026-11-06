// The holographic brain: a point cloud on a folded two-hemisphere surface, with travelling
// pulses and faint synapse lines, over a glowing projector ring.
import * as THREE from 'three';
import { rng } from '../core/util';
import { globalUniforms } from '../core/shaders';

const V = /* glsl */ `
attribute float aSeed;
uniform float uTime, uScale;
varying float vGlow;
varying vec3 vCol;
void main() {
  vec3 p = position;
  float wave = sin(dot(p, vec3(2.2, 3.1, 4.0)) * 2.0 - uTime * 2.4);
  float wave2 = sin(length(p - vec3(0.3, 0.2, -0.4)) * 9.0 - uTime * 3.3);
  float spark = step(0.985, fract(aSeed * 91.7 + uTime * 0.35 * (0.5 + aSeed)));
  vGlow = 0.45 + 0.7 * pow(max(wave, 0.0), 3.0) + 0.5 * pow(max(wave2, 0.0), 6.0) + spark * 1.6;
  vCol = mix(vec3(0.33, 0.85, 1.0), vec3(0.52, 0.52, 1.0), smoothstep(-0.8, 0.9, p.z + p.y * 0.4));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uScale * (0.018 + aSeed * 0.012) / -mv.z;
}`;
const F = /* glsl */ `
uniform float uAlpha;
varying float vGlow;
varying vec3 vCol;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(max(1.0 - d * 2.0, 0.0), 1.6);
  gl_FragColor = vec4(vCol * vGlow * 1.7, a * uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function gyri(x: number, y: number, z: number) {
  return Math.sin(11 * x + 6 * Math.sin(8 * z)) * Math.sin(9 * y + 4 * z) * 0.5 + Math.sin(17 * z + 3 * y) * 0.25;
}

export class HoloBrain {
  group = new THREE.Group();
  private spin = new THREE.Group();
  private mat: THREE.ShaderMaterial;

  constructor(count = 7000, scale = 1) {
    const r = rng(42);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number;
      const part = r();
      const u = r() * 2 - 1, th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(th), dy = u, dz = s * Math.sin(th);
      if (part < 0.86) {
        const side = r() < 0.5 ? -1 : 1;
        const g = 1 + 0.07 * gyri(dx, dy, dz) + (r() - 0.5) * 0.02;
        x = side * 0.34 + dx * 0.4 * g;
        y = dy * 0.52 * g * (dy < 0 ? 0.72 : 1);
        z = dz * 0.8 * g;
        if (Math.abs(x) < 0.06) x = side * 0.06;
      } else if (part < 0.96) {
        x = dx * 0.34; y = -0.36 + dy * 0.16; z = -0.52 + dz * 0.22;
      } else {
        const t = r();
        x = (r() - 0.5) * 0.12; y = -0.35 - t * 0.35; z = -0.25 + (r() - 0.5) * 0.12;
      }
      pos.set([x * scale, y * scale, z * scale], i * 3);
      seed[i] = r();
      if (i % 9 === 0) pts.push(new THREE.Vector3(x, y, z).multiplyScalar(scale));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: globalUniforms.uTime, uScale: { value: 800 }, uAlpha: { value: 0.9 } },
      vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const cloud = new THREE.Points(g, this.mat);
    this.spin.add(cloud);

    // Synapses: short links between nearby surface points.
    const lines: number[] = [];
    for (let i = 0; i < pts.length && lines.length < 2400 * 3; i++) {
      for (let j = i + 1; j < Math.min(pts.length, i + 40); j++) {
        if (pts[i].distanceTo(pts[j]) < 0.18 * scale && r() < 0.35) lines.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    const lm = new THREE.LineBasicMaterial({ color: new THREE.Color(0x4aa8ff).multiplyScalar(0.9), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    this.spin.add(new THREE.LineSegments(lg, lm));
    this.group.add(this.spin);

    // Projector base and light cone.
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x69d6ff).multiplyScalar(2.2) });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55 * scale, 0.025 * scale, 8, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.95 * scale;
    const coneMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ float a = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.5) * 0.28; gl_FragColor = vec4(vec3(0.35,0.75,1.0)*1.4, a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.85 * scale, 0.5 * scale, 1.1 * scale, 32, 1, true), coneMat);
    cone.position.y = -0.4 * scale;
    this.group.add(ring, cone);
  }

  setViewport(heightPx: number, fov: number) {
    this.mat.uniforms.uScale.value = heightPx / (2 * Math.tan((fov * Math.PI) / 360));
  }

  update(t: number) {
    this.spin.rotation.y = t * 0.25;
    this.spin.position.y = Math.sin(t * 0.8) * 0.03;
  }
}

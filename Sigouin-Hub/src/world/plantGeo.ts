// Geometry builders for plants: textured leaf cards with authored normals, and tapered tubes
// for trunks and branches.
import * as THREE from 'three';
import { cellUV } from './foliage';

const _a = new THREE.Vector3(), _n = new THREE.Vector3(), _f = new THREE.Vector3();

/** Accumulates alpha-cut quads into one geometry. */
export class Cards {
  private p: number[] = [];
  private n: number[] = [];
  private uv: number[] = [];
  private c: number[] = [];
  private idx: number[] = [];
  /** Index count so far; lets callers draw a prefix (quality tiers). */
  get indexCount() { return this.idx.length; }

  /**
   * One quad with its bottom-centre at `base`, spanning `up` * h and `right` * w.
   * `normal` gets each corner's position and the face normal and writes the shading normal.
   */
  quad(base: THREE.Vector3, up: THREE.Vector3, right: THREE.Vector3, w: number, h: number, cell: number, color: THREE.Color,
    normal: (out: THREE.Vector3, p: THREE.Vector3, face: THREE.Vector3) => void) {
    const start = this.p.length / 3;
    _f.crossVectors(right, up).normalize();
    for (const [s, t] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      _a.copy(base).addScaledVector(right, (s - 0.5) * w).addScaledVector(up, t * h);
      normal(_n, _a, _f);
      _n.normalize();
      const [u, v] = cellUV(cell, s, t);
      this.p.push(_a.x, _a.y, _a.z);
      this.n.push(_n.x, _n.y, _n.z);
      this.uv.push(u, v);
      // Darken the stem end slightly: cheap occlusion where cards meet the plant.
      const k = 0.82 + 0.18 * t;
      this.c.push(color.r * k, color.g * k, color.b * k);
    }
    this.idx.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

/** Normal pointing away from a centre point: makes a whole crown shade as one volume. */
export const fromCentre = (c: THREE.Vector3, faceMix = 0.2) => (out: THREE.Vector3, p: THREE.Vector3, face: THREE.Vector3) =>
  out.subVectors(p, c).normalize().multiplyScalar(1 - faceMix).addScaledVector(face, faceMix * Math.sign(face.dot(out) || 1));

/** Any unit vector perpendicular to v. */
export function perpendicular(v: THREE.Vector3, out = new THREE.Vector3()) {
  return (Math.abs(v.y) < 0.9 ? out.set(0, 1, 0) : out.set(1, 0, 0)).cross(v).normalize();
}

/** Tapered tube along a polyline, framed by parallel transport so it never twists. UVs in metres. */
export function tube(pts: THREE.Vector3[], radii: number[], sides: number, vScale = 0.6, uRepeat = 1) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const t = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(), d = new THREE.Vector3();
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i < pts.length - 1) t.subVectors(pts[i + 1], pts[i]).normalize();
    if (i === 0) perpendicular(t, nrm);
    nrm.addScaledVector(t, -nrm.dot(t)).normalize();
    bin.crossVectors(t, nrm);
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      d.copy(nrm).multiplyScalar(Math.cos(a)).addScaledVector(bin, Math.sin(a));
      pos.push(pts[i].x + d.x * radii[i], pts[i].y + d.y * radii[i], pts[i].z + d.z * radii[i]);
      nor.push(d.x, d.y, d.z);
      uv.push((j / sides) * uRepeat, len * vScale);
    }
  }
  const row = sides + 1;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Hand-rolled 2D collision on the ground plane: circles and oriented boxes, each with a
// height so the camera can decide what it must not pass through.

export interface Circle { type: 'circle'; x: number; z: number; r: number; h: number }
export interface Box { type: 'box'; x: number; z: number; hx: number; hz: number; c: number; s: number; h: number }
export type Collider = Circle | Box;

export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number; ceiling: number }

export class Colliders {
  list: Collider[] = [];
  /** Signed distance to the walkable region (positive = outside); soft nudge back in. */
  boundary: ((x: number, z: number) => number) | null = null;
  /** Hard rectangular room bounds (interiors). */
  room: Bounds | null = null;

  circle(x: number, z: number, r: number, h = 1) {
    this.list.push({ type: 'circle', x, z, r, h });
    return this;
  }
  box(x: number, z: number, hx: number, hz: number, yaw = 0, h = 1) {
    this.list.push({ type: 'box', x, z, hx, hz, c: Math.cos(yaw), s: Math.sin(yaw), h });
    return this;
  }
  /** A wall segment of given thickness. */
  segment(ax: number, az: number, bx: number, bz: number, thick: number, h = 1) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    // yaw such that local +x runs along the segment
    const yaw = Math.atan2(-dz, dx);
    return this.box((ax + bx) / 2, (az + bz) / 2, len / 2, thick / 2, yaw, h);
  }

  /** Pushes a circle at p out of every collider. */
  resolve(p: { x: number; z: number }, radius: number) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const c of this.list) {
        if (c.type === 'circle') {
          const dx = p.x - c.x, dz = p.z - c.z;
          const min = c.r + radius;
          const d2 = dx * dx + dz * dz;
          if (d2 < min * min) {
            const d = Math.sqrt(d2) || 1e-4;
            p.x = c.x + (dx / d) * min;
            p.z = c.z + (dz / d) * min;
            moved = true;
          }
        } else {
          const dx = p.x - c.x, dz = p.z - c.z;
          const lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c;
          const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz));
          let ox = lx - qx, oz = lz - qz;
          const d2 = ox * ox + oz * oz;
          let nx: number, nz: number;
          if (d2 > 1e-10) {
            if (d2 >= radius * radius) continue;
            const d = Math.sqrt(d2);
            nx = qx + (ox / d) * radius;
            nz = qz + (oz / d) * radius;
          } else {
            // Centre inside the box: leave by the nearest face.
            const px = c.hx - Math.abs(lx), pz = c.hz - Math.abs(lz);
            if (px < pz) { nx = Math.sign(lx || 1) * (c.hx + radius); nz = lz; }
            else { nx = lx; nz = Math.sign(lz || 1) * (c.hz + radius); }
          }
          ox = nx; oz = nz;
          p.x = c.x + ox * c.c + oz * c.s;
          p.z = c.z - ox * c.s + oz * c.c;
          moved = true;
        }
      }
      if (!moved) break;
    }
    if (this.room) {
      const r = this.room;
      p.x = Math.max(r.minX + radius, Math.min(r.maxX - radius, p.x));
      p.z = Math.max(r.minZ + radius, Math.min(r.maxZ - radius, p.z));
    }
  }

  /**
   * Fraction t in [0,1] along the camera ray (from target to camera) where it first hits
   * something taller than the ray at that point. Keeps the camera out of walls.
   */
  cameraClip(tx: number, ty: number, tz: number, cx: number, cy: number, cz: number, pad = 0.3) {
    let best = 1;
    const dx = cx - tx, dz = cz - tz, dy = cy - ty;
    for (const c of this.list) {
      if (c.h < 1.2) continue;
      let t = Infinity;
      if (c.type === 'circle') {
        const fx = tx - c.x, fz = tz - c.z;
        const r = c.r + pad;
        const a = dx * dx + dz * dz, b = 2 * (fx * dx + fz * dz), cc = fx * fx + fz * fz - r * r;
        if (cc < 0) continue;
        const disc = b * b - 4 * a * cc;
        if (disc < 0 || a < 1e-8) continue;
        const t0 = (-b - Math.sqrt(disc)) / (2 * a);
        if (t0 >= 0 && t0 < 1) t = t0;
      } else {
        const ox = tx - c.x, oz = tz - c.z;
        const lx = ox * c.c - oz * c.s, lz = ox * c.s + oz * c.c;
        const ldx = dx * c.c - dz * c.s, ldz = dx * c.s + dz * c.c;
        const hx = c.hx + pad, hz = c.hz + pad;
        if (Math.abs(lx) < hx && Math.abs(lz) < hz) continue;
        let tmin = -Infinity, tmax = Infinity;
        for (const [o, d, h] of [[lx, ldx, hx], [lz, ldz, hz]] as const) {
          if (Math.abs(d) < 1e-8) {
            if (Math.abs(o) > h) { tmin = Infinity; break; }
          } else {
            const t1 = (-h - o) / d, t2 = (h - o) / d;
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
          }
        }
        if (tmin <= tmax && tmin >= 0 && tmin < 1) t = tmin;
      }
      if (t < best && ty + dy * t < c.h) best = t;
    }
    if (this.room) {
      const r = this.room, m = 0.25;
      const lim = (o: number, d: number, lo: number, hi: number) => {
        if (d > 1e-6) return (hi - m - o) / d;
        if (d < -1e-6) return (lo + m - o) / d;
        return Infinity;
      };
      best = Math.min(best, lim(tx, dx, r.minX, r.maxX), lim(tz, dz, r.minZ, r.maxZ), lim(ty, dy, -10, r.ceiling));
    }
    return Math.max(0, best);
  }
}

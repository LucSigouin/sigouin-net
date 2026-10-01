import * as THREE from 'three';
import { Character } from './character';
import { WALK, RUN } from './animations';
import type { Colliders } from '../core/collision';
import type { Input } from '../core/input';
import { angleDiff, clamp, damp } from '../core/util';

export const STEP = 1 / 60;

/** Fixed-step character movement with interpolated rendering (no jitter at any frame rate). */
export class Player {
  character = new Character();
  pos = new THREE.Vector3();
  prev = new THREE.Vector3();
  velX = 0;
  velZ = 0;
  heading = Math.PI;
  prevHeading = Math.PI;
  radius = 0.32;
  colliders!: Colliders;
  locked = false;
  /** When set, the player walks this way on their own (leaving the garden). */
  autopilot: { x: number; z: number } | null = null;
  private acc = 0;

  get speed() { return Math.hypot(this.velX, this.velZ); }

  teleport(x: number, z: number, heading: number) {
    this.pos.set(x, 0, z);
    this.prev.copy(this.pos);
    this.velX = this.velZ = 0;
    this.heading = this.prevHeading = heading;
    this.sync(1);
  }

  update(dt: number, input: Input, camYaw: number) {
    this.acc = Math.min(this.acc + dt, 0.25);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.prev.copy(this.pos);
      this.prevHeading = this.heading;
      this.fixed(input, camYaw);
    }
    const alpha = this.acc / STEP;
    this.sync(alpha);
    this.character.update(dt, this.speed);
  }

  private fixed(input: Input, camYaw: number) {
    const dt = STEP;
    let mx = this.locked ? 0 : input.moveX, my = this.locked ? 0 : input.moveY;
    const mag = Math.min(1, Math.hypot(mx, my));
    // Camera-relative: forward is away from the camera.
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    let dx = rx * mx + fx * my, dz = rz * mx + fz * my;
    const dl = Math.hypot(dx, dz);
    if (dl > 1e-4) { dx /= dl; dz /= dl; }
    let target = (input.run && !this.locked ? RUN.speed : WALK.speed) * mag;
    if (this.autopilot) {
      dx = this.autopilot.x;
      dz = this.autopilot.z;
      target = WALK.speed;
    }
    const tx = dx * target, tz = dz * target;
    const k = damp(target > this.speed ? 7 : 10, dt);
    this.velX += (tx - this.velX) * k;
    this.velZ += (tz - this.velZ) * k;
    if (this.speed > 0.05) {
      const want = Math.atan2(this.velX, this.velZ);
      this.heading += angleDiff(this.heading, want) * damp(11, dt);
    }
    const p = { x: this.pos.x + this.velX * dt, z: this.pos.z + this.velZ * dt };
    const b = this.colliders.boundary;
    if (b && !this.autopilot) {
      // Soft nudge: past the edge, velocity bends back inwards; far past it, a hard stop.
      const d = b(p.x, p.z);
      if (d > 0) {
        const e = 0.05;
        const gx = (b(p.x + e, p.z) - b(p.x - e, p.z)) / (2 * e), gz = (b(p.x, p.z + e) - b(p.x, p.z - e)) / (2 * e);
        const push = clamp(d / 0.8) * 3.4;
        p.x -= gx * push * dt;
        p.z -= gz * push * dt;
        if (d > 0.8) { p.x -= gx * (d - 0.8); p.z -= gz * (d - 0.8); }
      }
    }
    this.colliders.resolve(p, this.radius);
    // Keep velocity honest after collisions so animation speed matches actual motion.
    const ax = (p.x - this.pos.x) / dt, az = (p.z - this.pos.z) / dt;
    this.velX = ax;
    this.velZ = az;
    this.pos.x = p.x;
    this.pos.z = p.z;
  }

  private sync(alpha: number) {
    const r = this.character.root;
    r.position.lerpVectors(this.prev, this.pos, alpha);
    r.rotation.y = this.prevHeading + angleDiff(this.prevHeading, this.heading) * alpha;
  }
}

export interface CamLimits { minDist: number; maxDist: number; defDist: number; minPitch: number; maxPitch: number; defPitch: number }
export const OUTDOOR: CamLimits = { minDist: 2.6, maxDist: 12, defDist: 6.4, minPitch: -0.08, maxPitch: 1.15, defPitch: 0.3 };
export const INDOOR: CamLimits = { minDist: 1.8, maxDist: 5.5, defDist: 3.9, minPitch: -0.05, maxPitch: 0.95, defPitch: 0.36 };

export class CameraRig {
  yaw = 0;
  pitch = OUTDOOR.defPitch;
  dist = OUTDOOR.defDist;
  private yawT = 0;
  private pitchT = OUTDOOR.defPitch;
  private distT = OUTDOOR.defDist;
  private clipDist = OUTDOOR.defDist;
  target = new THREE.Vector3();
  limits = OUTDOOR;
  reducedMotion = false;

  constructor(public camera: THREE.PerspectiveCamera) {}

  reset(player: Player, limits: CamLimits, yaw = player.heading + Math.PI) {
    this.limits = limits;
    this.yaw = this.yawT = yaw;
    this.pitch = this.pitchT = limits.defPitch;
    this.dist = this.distT = this.clipDist = limits.defDist;
    this.target.copy(player.character.root.position).setY(1.45);
  }

  update(dt: number, player: Player, input: Input, colliders: Colliders) {
    const [lx, ly, zoom] = input.takeLook();
    const L = this.limits;
    this.yawT -= lx * 0.0055;
    this.pitchT = clamp(this.pitchT + ly * 0.0042, L.minPitch, L.maxPitch);
    this.distT = clamp(this.distT + zoom * 0.9, L.minDist, L.maxDist);

    // Gentle auto-recentre while walking forward and not steering the camera.
    const idleLook = performance.now() - input.lastLookAt > 1500;
    if (idleLook && player.speed > 0.6 && input.moveY > 0.3 && Math.abs(input.moveX) < 0.6) {
      const behind = player.heading + Math.PI;
      this.yawT += angleDiff(this.yawT, behind) * damp(0.9 * (player.speed / RUN.speed + 0.3), dt);
    }
    const rm = this.reducedMotion;
    this.yaw += (this.yawT - this.yaw) * (rm ? 1 : damp(14, dt));
    this.pitch += (this.pitchT - this.pitch) * (rm ? 1 : damp(12, dt));
    this.dist += (this.distT - this.dist) * (rm ? 1 : damp(8, dt));

    const root = player.character.root.position;
    const want = new THREE.Vector3(root.x, 1.45, root.z);
    if (rm) this.target.copy(want);
    else this.target.lerp(want, damp(9, dt));

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dx = Math.sin(this.yaw) * cp, dy = sp, dz = Math.cos(this.yaw) * cp;
    const t = this.target;
    const t01 = colliders.cameraClip(t.x, t.y, t.z, t.x + dx * this.dist, t.y + dy * this.dist, t.z + dz * this.dist);
    const allowed = Math.max(L.minDist * 0.5, this.dist * t01 - 0.05);
    // Snap in fast (never see through a wall), ease back out slowly.
    this.clipDist = allowed < this.clipDist ? allowed : this.clipDist + (allowed - this.clipDist) * damp(3, dt);
    const d = this.clipDist;
    this.camera.position.set(t.x + dx * d, Math.max(0.35, t.y + dy * d), t.z + dz * d);
    this.camera.lookAt(t.x, t.y + 0.1, t.z);
  }
}

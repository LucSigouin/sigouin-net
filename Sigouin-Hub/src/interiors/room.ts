// Shared scaffolding for the four interiors: the room shell, lighting, exit door, exhibit
// markers, and wiring project entries from projects.json onto named exhibits.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Colliders } from '../core/collision';
import { Batch, boxM, mat } from '../core/util';
import { globalUniforms } from '../core/shaders';
import type { Interactable, Level } from '../core/level';
import { INDOOR } from '../character/controller';
import { DoubleDoor } from '../buildings/door';
import { materials, type Mats } from '../world/materials';
import { furnitureMats, type FMats } from '../buildings/furniture';
import type { BuildingContent, BuildingId, Entry } from '../content/types';

export interface InteriorHooks {
  exit(): void;
  openCard(building: BuildingId, entry: Entry): void;
  dive(entry: Entry, screen: DiveScreen): void;
}

/** A monitor the camera can dive into: its centre, facing, size, and the material to flare. */
export interface DiveScreen {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  height: number;
  mat: THREE.MeshBasicMaterial;
}

export interface Exhibit {
  name: string;
  /** Prompt position. */
  anchor: THREE.Vector3;
  /** Stand point (player position when using it) and facing. */
  stand: { x: number; z: number; heading: number };
  targets: THREE.Object3D[];
  /** Paint the entry onto the object (screen text, poster...). */
  show?: (entry: Entry) => void;
  /** Set on computers: entries with a url dive into this screen. */
  screen?: DiveScreen;
}

export interface RoomOpts {
  w: number; d: number; h: number;
  floor: THREE.Material; wall: THREE.Material; ceiling: THREE.Material;
  outside: number;
}

let envTex: THREE.Texture | null = null;

export class Interior implements Level {
  scene = new THREE.Scene();
  colliders = new Colliders();
  interactables: Interactable[] = [];
  cam = INDOOR;
  spawn: { x: number; z: number; heading: number };
  M: Mats = materials();
  F: FMats = furnitureMats(false);
  b = new Batch();
  exhibits: Exhibit[] = [];
  door: DoubleDoor;
  private tickers: ((dt: number, t: number) => void)[] = [];
  private viewport: ((h: number, fov: number) => void)[] = [];
  private markers: THREE.Mesh[] = [];
  private markerMat: THREE.MeshBasicMaterial;

  constructor(public id: BuildingId, public content: BuildingContent, public opts: RoomOpts, renderer: THREE.WebGLRenderer, private hooks: InteriorHooks) {
    const { w, d, h } = opts;
    this.spawn = { x: 0, z: d / 2 - 3.6, heading: Math.PI };
    if (!envTex) {
      const pm = new THREE.PMREMGenerator(renderer);
      envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.55;
    this.scene.background = new THREE.Color(0x14120f);
    this.colliders.room = { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2, ceiling: h };

    const b = this.b;
    b.box(opts.floor, w, 0.1, d, 0, -0.05, 0);
    b.box(opts.ceiling, w, 0.1, d, 0, h + 0.05, 0);
    b.box(opts.wall, w, h, 0.2, 0, h / 2, -d / 2 - 0.1);
    b.box(opts.wall, 0.2, h, d, -w / 2 - 0.1, h / 2, 0);
    b.box(opts.wall, 0.2, h, d, w / 2 + 0.1, h / 2, 0);
    // Front wall with the exit doorway.
    const dw = 2.4, dh = 2.8;
    b.box(opts.wall, (w - dw) / 2, h, 0.2, -(w + dw) / 4, h / 2, d / 2 + 0.1);
    b.box(opts.wall, (w - dw) / 2, h, 0.2, (w + dw) / 4, h / 2, d / 2 + 0.1);
    b.box(opts.wall, dw, h - dh, 0.2, 0, dh + (h - dh) / 2, d / 2 + 0.1);
    const trim = this.F.walnut;
    for (const [x, len] of [[-(w + dw) / 4, (w - dw) / 2], [(w + dw) / 4, (w - dw) / 2]] as const) b.box(trim, len, 0.12, 0.03, x, 0.06, d / 2 - 0.01);
    b.box(trim, w, 0.12, 0.03, 0, 0.06, -d / 2 + 0.01);
    b.box(trim, 0.03, 0.12, d, -w / 2 + 0.01, 0.06, 0);
    b.box(trim, 0.03, 0.12, d, w / 2 - 0.01, 0.06, 0);
    b.box(this.M.frame, dw + 0.2, 0.12, 0.26, 0, dh + 0.06, d / 2 + 0.1);
    for (const s of [-1, 1]) b.box(this.M.frame, 0.1, dh, 0.26, s * (dw / 2 + 0.05), dh / 2, d / 2 + 0.1);
    // Daylight beyond the exit door.
    const out = new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.outside).multiplyScalar(1.3), fog: false });
    const outside = new THREE.Mesh(new THREE.PlaneGeometry(dw + 0.4, dh + 0.3), out);
    outside.position.set(0, dh / 2, d / 2 + 0.5);
    outside.rotation.y = Math.PI;
    this.scene.add(outside);
    this.door = new DoubleDoor(dw - 0.1, dh - 0.05, this.M.frame, this.M.glass, this.M.chrome);
    this.door.group.position.set(0, 0, d / 2 + 0.1);
    this.scene.add(this.door.group);

    this.markerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9b6f2).multiplyScalar(1.2), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });

    const hemi = new THREE.HemisphereLight(0xfff6ea, 0x3a3128, 0.8);
    const key = new THREE.DirectionalLight(0xfff2e0, 1.2);
    key.position.set(3, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -w / 2 - 1; sc.right = w / 2 + 1; sc.top = d / 2 + 1; sc.bottom = -d / 2 - 1; sc.near = 1; sc.far = 25;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.03;
    this.scene.add(hemi, key);

    this.interactables.push({
      id: `${id}:exit`, kind: 'exit', label: 'Back to the courtyard',
      anchor: new THREE.Vector3(0, 2.1, d / 2 - 0.2), reach: new THREE.Vector2(0, d / 2 - 1.0), radius: 2.1,
      targets: [this.door.group, outside], stand: { x: 0, z: d / 2 - 1.0, heading: 0 },
      action: () => this.hooks.exit(),
    });
  }

  light(color: number, intensity: number, x: number, y: number, z: number, distance = 14) {
    const l = new THREE.PointLight(color, intensity, distance, 1.6);
    l.position.set(x, y, z);
    this.scene.add(l);
    return l;
  }

  onTick(fn: (dt: number, t: number) => void) { this.tickers.push(fn); }
  onViewport(fn: (h: number, fov: number) => void) { this.viewport.push(fn); }
  exhibit(e: Exhibit) { this.exhibits.push(e); }

  /** Called by each room once geometry is in: merges statics and wires entries to exhibits. */
  finish() {
    this.scene.add(this.b.build({ name: `${this.id}-statics` }));
    const used = new Set<string>();
    const byName = new Map(this.exhibits.map((e) => [e.name, e]));
    const ringGeo = new THREE.RingGeometry(0.45, 0.6, 40);
    ringGeo.rotateX(-Math.PI / 2);
    this.content.entries.forEach((entry, i) => {
      let ex = byName.get(entry.exhibit);
      if (!ex || used.has(ex.name)) {
        ex = this.exhibits.find((e) => !used.has(e.name));
        if (!ex) return;
        console.warn(`[hub] ${this.id}: exhibit "${entry.exhibit}" not found or taken; showing "${entry.title}" on "${ex.name}"`);
      }
      used.add(ex.name);
      ex.show?.(entry);
      const marker = new THREE.Mesh(ringGeo, this.markerMat);
      marker.position.set(ex.stand.x, 0.02, ex.stand.z);
      marker.renderOrder = 3;
      this.scene.add(marker);
      this.markers.push(marker);
      const target = ex;
      const screen = entry.url ? target.screen : undefined;
      this.interactables.push({
        id: `${this.id}:${i}`, kind: screen ? 'screen' : 'exhibit', label: entry.title,
        anchor: target.anchor, reach: new THREE.Vector2(target.stand.x, target.stand.z), radius: 1.9,
        targets: target.targets, stand: target.stand,
        action: screen ? () => this.hooks.dive(entry, screen) : () => this.hooks.openCard(this.id, entry),
      });
    });
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !(m.material as THREE.Material).transparent && !(m as THREE.Object3D & { noShadow?: boolean }).noShadow) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    for (const mk of this.markers) mk.castShadow = mk.receiveShadow = false;
  }

  setViewport(h: number, fov: number) { for (const f of this.viewport) f(h, fov); }

  update(dt: number, t: number) {
    this.door.update(dt);
    this.markerMat.opacity = 0.32 + 0.18 * Math.sin(t * 2.4);
    globalUniforms.uNight.value = 0;
    for (const f of this.tickers) f(dt, t);
  }
}

/** Wall-mounted frame helper for posters and boards. */
export function framed(b: Batch, frame: THREE.Material, w: number, h: number, x: number, y: number, z: number, ry = 0) {
  b.add(boxM(w + 0.08, h + 0.08, 0.04), frame, mat(x, y, z, 0, ry));
}

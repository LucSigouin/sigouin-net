// Hub probe: the self-test layer (probe/PLAN.md). Loaded only with ?probe, in its own chunk.
// window.__probe gives: frozen pictures, the scene as data, any camera, see-through layers,
// per-part GPU cost, and scripted play.
import * as THREE from 'three';
import type { App } from '../core/app';
import type { Interior } from '../interiors/room';
import { LAYERS, renderLayer, measureCost, type Layer, type CostResult } from './layers';
import { run, grid, type Step } from './play';

export type V3 = [number, number, number];
export interface View { from: V3; lookAt: V3; fov?: number }
export interface ShotOpts { view?: string; from?: V3; lookAt?: V3; fov?: number; layer?: Layer; size?: [number, number]; far?: number }
export interface Shot { png: string; layer: Layer; view: string | null; from: V3; lookAt: V3; fov: number; size: [number, number]; ms: number; legend?: unknown }

export interface Item {
  id: number;
  path: string;
  name: string;
  type: string;
  part: string;
  group: string;
  position: V3;
  box: { min: V3; max: V3 } | null;
  triangles: number;
  instances?: number;
  draws: number;
  castShadow: boolean;
  materials: string[];
  visible: boolean;
  shown: boolean;
}

/** World time while frozen, in seconds. Any fixed value works; this one has water mid-arc. */
const T0 = 10;

interface CharacterInternals {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  gesture: THREE.AnimationAction | null;
  gestureW: number;
  phase: number;
  clock: number;
  update(dt: number, speed: number): void;
}

/**
 * Runs before the app is created: seeds Math.random so nothing random differs between runs.
 * Frozen mode also paints 2D canvases on the CPU: Chrome may paint them on the GPU or not
 * depending on load, and that gave sign textures off-by-one pixels between two runs.
 * `&gpucanvas` turns this off (to show the problem).
 */
export function early(params: URLSearchParams) {
  if (params.has('freeze') && !params.has('gpucanvas')) {
    const get = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, type: string, o?: object) => RenderingContext | null;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, o?: object) {
      return get.call(this, type, type === '2d' ? { ...o, willReadFrequently: true } : o);
    } as typeof HTMLCanvasElement.prototype.getContext;
  }
  let s = Number(params.get('seed') ?? 1) >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r3 = (v: THREE.Vector3): V3 => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export class Probe {
  frozen = false;
  phase = 0;
  lastCost: CostResult | null = null;
  private wind: number;

  constructor(public app: App) { this.wind = app.uniforms.uWind.value; }

  // ---- Phase A: frozen mode ----

  /** Puts every moving thing back to one fixed state: time, wind, clouds, doors, the player's pose. */
  pin() {
    const app = this.app;
    const u = app.uniforms;
    app.time = T0;
    u.uTime.value = T0;
    u.uWind.value = 0;
    const cy = app.courtyard;
    cy.dayRunning = false;
    cy.dayClock = this.phase * cy.sky.cycleSeconds;
    for (const c of cy.sky.clouds) c.az = c.az0;
    for (const b of cy.buildings) b.door.open = b.door.target;
    for (const i of app.interiors.values()) i.door.open = i.door.target;
    const p = app.player;
    const ch = p.character as unknown as CharacterInternals;
    ch.gesture?.stop();
    ch.gesture = null;
    ch.gestureW = ch.phase = ch.clock = 0;
    p.velX = p.velZ = 0;
    (p as unknown as { acc: number }).acc = 0;
    p.prev.copy(p.pos);
    p.prevHeading = p.heading;
    ch.root.position.copy(p.pos);
    ch.root.rotation.y = p.heading;
    ch.mixer.setTime(0);
    ch.update(0, 0);
    app.level.update(0, T0, app.camera);
  }

  /** Frozen: world time stops, wind is off, pixel ratio 1, fixed canvas size. */
  freeze(on = true, o: { phase?: number; size?: [number, number] } = {}) {
    if (o.phase !== undefined) this.phase = o.phase;
    const app = this.app;
    if (on) {
      if (!this.frozen) this.wind = app.uniforms.uWind.value;
      this.frozen = true;
      app.probeDt = () => 0;
      this.pin();
      this.setSize(o.size ?? [innerWidth, innerHeight]);
    } else if (this.frozen) {
      this.frozen = false;
      app.probeDt = null;
      app.uniforms.uWind.value = this.wind;
    }
    return this.info();
  }

  setSize([w, h]: [number, number]) {
    const app = this.app, r = app.renderer;
    r.setPixelRatio(1);
    r.setSize(w, h, false);
    app.post?.setSize(w, h);
    app.camera.aspect = w / h;
    app.camera.updateProjectionMatrix();
    app.courtyard.setViewport(h, app.camera.fov);
    for (const i of app.interiors.values()) i.setViewport(h, app.camera.fov);
  }

  size(): [number, number] {
    const v = this.app.renderer.getDrawingBufferSize(new THREE.Vector2());
    return [v.x, v.y];
  }

  info() {
    const app = this.app, gl = app.renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      frozen: this.frozen, phase: this.phase, time: app.time, level: app.level.id, state: app.state, tier: app.q.tier,
      size: this.size(), pixelRatio: app.renderer.getPixelRatio(), post: !!app.post,
      gpu: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'unknown',
      timerQuery: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
      layers: LAYERS,
    };
  }

  // ---- Phase B: the scene as data ----

  manifest() {
    const app = this.app, scene = app.level.scene;
    scene.updateMatrixWorld(true);
    const playerRoot = app.player.character.root;
    const items: Item[] = [];
    const box = new THREE.Box3(), pos = new THREE.Vector3();
    const walk = (o: THREE.Object3D, path: string, group: string, part: string, shown: boolean, inPlayer: boolean) => {
      const seg = o.name || `${o.type}#${o.parent ? o.parent.children.indexOf(o) : 0}`;
      const here = path ? `${path}/${seg}` : seg;
      const player = inPlayer || o === playerRoot;
      const isScene = o === scene;
      const g = isScene ? '' : group || (o.name ? o.name : seg);
      const pt = player ? 'player' : o.name && o.name !== 'batch' && !isScene ? o.name : part;
      const vis = shown && o.visible;
      if (!isScene) {
        const m = o as THREE.Mesh;
        const geo = m.geometry as THREE.BufferGeometry | undefined;
        const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
        const inst = (o as THREE.InstancedMesh).isInstancedMesh ? (o as THREE.InstancedMesh).count : undefined;
        let tris = 0, draws = 0;
        if (geo && (m.isMesh || (o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite)) {
          const n = geo.index ? geo.index.count : geo.attributes.position?.count ?? 0;
          const range = Math.min(n, geo.drawRange.count);
          tris = m.isMesh ? Math.floor(range / 3) * (inst ?? 1) : 0;
          draws = Array.isArray(m.material) ? Math.max(1, geo.groups.length) : 1;
          if ((o as THREE.Sprite).isSprite) tris = 2;
        }
        let bb: Item['box'] = null;
        if (draws || o.children.length) {
          box.setFromObject(o);
          if (!box.isEmpty()) bb = { min: r3(box.min), max: r3(box.max) };
        }
        o.getWorldPosition(pos);
        items.push({
          id: items.length, path: here, name: o.name, type: o.type, part: pt || g || seg, group: g,
          position: r3(pos), box: bb, triangles: tris, ...(inst !== undefined ? { instances: inst } : {}), draws,
          castShadow: o.castShadow, materials: mats.map((x) => x.name || x.type), visible: o.visible, shown: vis,
        });
      }
      for (const c of o.children) walk(c, isScene ? '' : here, g, pt, vis, player);
    };
    walk(scene, '', '', '', true, false);
    const drawn = items.filter((i) => i.draws && i.shown);
    const byType: Record<string, number> = {};
    for (const i of items) byType[i.type] = (byType[i.type] ?? 0) + 1;
    return {
      level: app.level.id,
      counts: { objects: items.length, renderables: items.filter((i) => i.draws).length, shown: drawn.length, byType },
      totals: { triangles: drawn.reduce((a, i) => a + i.triangles, 0), draws: drawn.reduce((a, i) => a + i.draws, 0), shadowCasters: drawn.filter((i) => i.castShadow).length },
      parts: [...new Set(drawn.map((i) => i.part))].sort(),
      rendererInfo: this.frameInfo(),
      items,
    };
  }

  /** Draw calls and triangles for one whole frame (shadows and post passes included). */
  frameInfo() {
    const r = this.app.renderer;
    r.info.autoReset = false;
    r.info.reset();
    this.draw();
    const out = { calls: r.info.render.calls, triangles: r.info.render.triangles, programs: r.info.programs?.length ?? 0, textures: r.info.memory.textures, geometries: r.info.memory.geometries };
    r.info.autoReset = true;
    return out;
  }

  /** Objects whose path matches: plain text (any case) or "/regex/flags". */
  find(query: string) {
    const m = /^\/(.+)\/([a-z]*)$/.exec(query);
    const test = m ? ((re) => (s: string) => re.test(s))(new RegExp(m[1], m[2])) : (s: string) => s.toLowerCase().includes(query.toLowerCase());
    return this.manifest().items.filter((i) => test(i.path));
  }

  /** Fingerprint (FNV-1a of the pixels) of every canvas-painted texture in the level. */
  textures() {
    const users = new Map<THREE.Texture, string[]>();
    const add = (t: unknown, who: string) => {
      if (!(t as THREE.Texture)?.isTexture) return;
      const list = users.get(t as THREE.Texture) ?? [];
      if (list.length < 3 && !list.includes(who)) list.push(who);
      users.set(t as THREE.Texture, list);
    };
    this.app.level.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      for (const mat of m ? (Array.isArray(m) ? m : [m]) : []) {
        for (const v of Object.values(mat)) add(v, o.name || o.type);
        const u = (mat as THREE.ShaderMaterial).uniforms;
        if (u) for (const k in u) add(u[k].value, o.name || o.type);
      }
    });
    const out: { name: string; size: [number, number]; users: string[]; hash: string }[] = [];
    for (const [t, who] of users) {
      const img = t.image as HTMLCanvasElement;
      if (!(img instanceof HTMLCanvasElement)) continue;
      const d = img.getContext('2d')?.getImageData(0, 0, img.width, img.height).data;
      if (!d) continue;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619);
      out.push({ name: t.name || t.uuid.slice(0, 8), size: [img.width, img.height], users: who, hash: (h >>> 0).toString(16) });
    }
    return out; // scene order, which is the same every run, so two runs compare index by index
  }

  // ---- Phase C: cameras and shots ----

  /** Named viewpoints for the current level. */
  views(): Record<string, View> {
    const app = this.app, L = app.level;
    const behind = (s: { x: number; z: number; heading: number }, lim: { defDist: number; defPitch: number }): View => {
      const yaw = s.heading + Math.PI, cp = Math.cos(lim.defPitch), sp = Math.sin(lim.defPitch);
      return { from: [s.x + Math.sin(yaw) * cp * lim.defDist, 1.45 + sp * lim.defDist, s.z + Math.cos(yaw) * cp * lim.defDist], lookAt: [s.x, 1.55, s.z] };
    };
    const v: Record<string, View> = { spawn: behind(L.spawn, L.cam) };
    if (L === app.courtyard) {
      v.fountain = { from: [7.5, 4.2, 8.5], lookAt: [0, 1.4, 0] };
      v.aerial = { from: [0, 40, 45], lookAt: [0, 0, -5] };
      const cx = 0.75, cz = -2.75;
      for (const [n, sx, sz] of [['nw', -1, -1], ['ne', 1, -1], ['sw', -1, 1], ['se', 1, 1]] as const) {
        v[`corner-${n}`] = { from: [cx + sx * 30, 16, cz + sz * 31], lookAt: [cx, 0.5, cz] };
      }
      for (const b of app.courtyard.buildings) {
        const out = b.group.localToWorld(new THREE.Vector3(0, 2.4, b.spec.depth / 2 + 8));
        v[`door-${b.spec.id}`] = { from: r3(out), lookAt: [b.anchor.x, 1.9, b.anchor.z] };
      }
    } else {
      const I = L as Interior, { w, d, h } = I.opts;
      v.overview = { from: [w / 2 - 0.6, h - 0.4, d / 2 - 0.6], lookAt: [0, 0.8, -d / 6] };
      for (const it of L.interactables) {
        const dx = it.stand.x - it.anchor.x, dz = it.stand.z - it.anchor.z, len = Math.hypot(dx, dz) || 1;
        v[it.id.replace(`${L.id}:`, '')] = { from: [it.stand.x + (dx / len) * 1.8, 2.1, it.stand.z + (dz / len) * 1.8], lookAt: r3(it.anchor) };
      }
    }
    return v;
  }

  /** Renders one frame from any camera, through any layer, and returns it as a PNG data URL. */
  shot(o: ShotOpts = {}): Shot {
    const t0 = performance.now();
    const app = this.app, cam = app.camera;
    const layer: Layer = o.layer ?? 'beauty';
    if (!LAYERS.includes(layer)) throw new Error(`unknown layer "${layer}" (have: ${LAYERS.join(', ')})`);
    const saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, aspect: cam.aspect };
    let view: View;
    if (o.view) {
      const all = this.views();
      if (!all[o.view]) throw new Error(`no view "${o.view}" in ${app.level.id} (have: ${Object.keys(all).join(', ')})`);
      view = all[o.view];
    } else if (o.from) view = { from: o.from, lookAt: o.lookAt ?? [0, 0, 0] };
    else view = { from: r3(cam.position), lookAt: r3(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(10).add(cam.position)) };
    const before = this.size();
    const size = o.size ?? before;
    const resized = size[0] !== before[0] || size[1] !== before[1] || app.renderer.getPixelRatio() !== 1;
    const savedRatio = app.renderer.getPixelRatio(), css = app.renderer.getSize(new THREE.Vector2());
    try {
      if (resized) this.setSize(size);
      if (this.frozen) this.pin();
      cam.fov = o.fov ?? view.fov ?? saved.fov;
      cam.aspect = size[0] / size[1];
      cam.updateProjectionMatrix();
      cam.position.set(...view.from);
      cam.lookAt(...view.lookAt);
      cam.updateMatrixWorld();
      app.level.update(0, app.time, cam);
      const out = renderLayer(this, layer, size, o);
      return { png: out.png, layer, view: o.view ?? null, from: view.from, lookAt: view.lookAt, fov: cam.fov, size, ms: Math.round(performance.now() - t0), ...(out.legend ? { legend: out.legend } : {}) };
    } finally {
      cam.position.copy(saved.p);
      cam.quaternion.copy(saved.q);
      cam.fov = saved.fov;
      cam.aspect = saved.aspect;
      cam.updateProjectionMatrix();
      if (resized) {
        app.renderer.setPixelRatio(savedRatio);
        app.renderer.setSize(css.x, css.y, false);
        app.post?.setSize(css.x, css.y);
      }
    }
  }

  /** The normal picture: through the post chain when the tier has one. */
  draw() {
    const app = this.app;
    if (app.post) app.post.draw(0);
    else app.renderer.render(app.level.scene, app.camera);
  }

  /** Every angle of one object: `angles` around it at each height. */
  orbit(target: string | V3, o: { angles?: number; heights?: (number | 'low' | 'eye' | 'high')[]; layer?: Layer; size?: [number, number]; dist?: number } = {}) {
    const app = this.app;
    let c = new THREE.Vector3(), radius = 1.5, label = String(target);
    if (Array.isArray(target)) c.set(...target);
    else {
      const it = app.level.interactables.find((i) => i.id === target);
      if (it) { c.copy(it.anchor).setY(it.anchor.y * 0.6); radius = 2.2; }
      else {
        const hit = this.find(target).find((i) => i.box && i.shown);
        if (!hit?.box) throw new Error(`orbit: nothing called "${target}" in ${app.level.id}`);
        const b = new THREE.Box3(new THREE.Vector3(...hit.box.min), new THREE.Vector3(...hit.box.max));
        b.getCenter(c);
        radius = Math.max(0.5, b.getSize(new THREE.Vector3()).length() / 2);
        label = hit.path;
      }
    }
    const fov = THREE.MathUtils.degToRad(app.camera.fov);
    const dist = o.dist ?? THREE.MathUtils.clamp((radius / Math.tan(fov / 2)) * 1.15, 2.5, 90);
    const n = o.angles ?? 8;
    const heights = o.heights ?? ['low', 'eye', 'high'];
    const shots: (Shot & { angle: number; height: string | number })[] = [];
    for (const hgt of heights) {
      const y = hgt === 'low' ? Math.max(0.35, c.y - radius * 0.4) : hgt === 'eye' ? 1.7 : hgt === 'high' ? c.y + radius + dist * 0.6 : hgt;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = this.shot({ from: [c.x + Math.sin(a) * dist, y, c.z + Math.cos(a) * dist], lookAt: r3(c), layer: o.layer, size: o.size });
        shots.push({ ...s, angle: Math.round((a * 180) / Math.PI), height: hgt });
      }
    }
    return { target: label, center: r3(c), radius: +radius.toFixed(2), dist: +dist.toFixed(2), shots };
  }

  // ---- Phase D: cost ----

  async cost(o: { frames?: number; rounds?: number; by?: 'part' | 'group'; view?: string } = {}) {
    this.lastCost = await measureCost(this, o);
    return this.lastCost;
  }

  // ---- Phase E: scripted play ----

  run(steps: Step[], o: { stopOnFail?: boolean } = {}) { return run(this, steps, o); }

  grid() {
    const g = grid(this.app);
    let walk = 0, blocked = 0;
    for (const c of g.cells) { if (c === 1) walk++; else if (c === 2) blocked++; }
    return { level: g.level, step: g.step, nx: g.nx, nz: g.nz, walkable: walk, blocked, walkableM2: +(walk * g.step * g.step).toFixed(1) };
  }

  async ready() {
    while (this.app.state !== 'play') await nextFrame();
    return this.info();
  }
}

declare global {
  interface Window { __probe: Probe }
}

export function install(app: App, params: URLSearchParams) {
  const probe = new Probe(app);
  window.__probe = probe;
  if (params.has('freeze')) {
    const size = params.get('size')?.split('x').map(Number) as [number, number] | undefined;
    const phase = params.has('phase') ? Number(params.get('phase')) : 0;
    void probe.ready().then(() => probe.freeze(true, { phase, size: size?.length === 2 ? size : undefined }));
  }
}

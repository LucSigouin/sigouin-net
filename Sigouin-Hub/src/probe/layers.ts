// See-through layers for the probe: flat object ids, depth, normals, wireframe, walkable ground,
// trigger zones, and a per-part GPU cost heatmap. Each renders one frame and returns a PNG.
import * as THREE from 'three';
import type { Probe, ShotOpts, V3 } from './probe';
import { grid } from './play';
import type { Collider } from '../core/collision';

export const LAYERS = ['beauty', 'id', 'depth', 'normals', 'wireframe', 'walkable', 'triggers', 'cost'] as const;
export type Layer = (typeof LAYERS)[number];

const V = /* glsl */ `
#include <common>
#include <batching_pars_vertex>
#include <skinning_pars_vertex>
uniform mat3 uMapTx;
varying vec2 vUv;
varying vec3 vN;
varying float vDist;
void main() {
  vUv = (uMapTx * vec3(uv, 1.0)).xy;
  #include <batching_vertex>
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vN = transformedNormal;
  vDist = -mvPosition.z;
}`;

// Modes: 0 flat colour (id, wireframe, cost), 1 depth, 2 normals.
// Normals: back faces of one-sided materials show magenta (flipped), missing normals yellow.
const F = /* glsl */ `
uniform int uMode;
uniform vec3 uColor;
uniform float uFar;
uniform sampler2D uMap;
uniform float uCut;
uniform int uChan;
uniform int uSide;
varying vec2 vUv;
varying vec3 vN;
varying float vDist;
void main() {
  if (uCut >= 0.0) {
    vec4 t = texture2D(uMap, vUv);
    if ((uChan == 1 ? t.g : t.a) < uCut) discard;
  }
  if (uMode == 0) { gl_FragColor = vec4(uColor, 1.0); return; }
  if (uMode == 1) { gl_FragColor = vec4(vec3(1.0 - clamp(vDist / uFar, 0.0, 1.0)), 1.0); return; }
  float len = length(vN);
  if (!(len > 1e-4)) { gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); return; }
  if ((uSide == 0 && !gl_FrontFacing) || (uSide == 1 && gl_FrontFacing)) { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); return; }
  gl_FragColor = vec4(vN / len * (gl_FrontFacing ? 0.5 : -0.5) + 0.5, 1.0);
}`;

type AnyMat = THREE.Material & { map?: THREE.Texture | null; alphaMap?: THREE.Texture | null };
const matCache = new Map<string, THREE.ShaderMaterial>();

function probeMat(mode: 0 | 1 | 2, orig: AnyMat, color: number, far: number, o: { wire?: boolean; double?: boolean } = {}) {
  const wire = !!o.wire, double = mode === 2 || !!o.double;
  const key = `${mode}|${orig.uuid}|${color}|${wire}|${double}`;
  let m = matCache.get(key);
  if (!m) {
    const tex = orig.alphaMap ?? (orig.alphaTest > 0 ? orig.map : null) ?? null;
    m = new THREE.ShaderMaterial({
      vertexShader: V,
      fragmentShader: F,
      side: double ? THREE.DoubleSide : orig.side,
      wireframe: wire,
      uniforms: {
        uMode: { value: mode }, uColor: { value: new THREE.Color().setHex(color, THREE.LinearSRGBColorSpace) }, uFar: { value: far },
        uMap: { value: tex }, uCut: { value: tex ? Math.max(orig.alphaTest, 0.01) : -1 }, uChan: { value: orig.alphaMap ? 1 : 3 },
        uSide: { value: orig.side === THREE.FrontSide ? 0 : orig.side === THREE.BackSide ? 1 : 2 },
        uMapTx: { value: new THREE.Matrix3() },
      },
    });
    matCache.set(key, m);
  }
  const tex = m.uniforms.uMap.value as THREE.Texture | null;
  if (tex) { tex.updateMatrix(); m.uniforms.uMapTx.value.copy(tex.matrix); }
  m.uniforms.uFar.value = far;
  return m;
}

/** Unique, well spread colour per object id: (id+1) times an odd number, mod 2^24. */
export const idColor = (id: number) => Math.imul(id + 1, 0x9e3779b1) & 0xffffff;
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

const isRenderable = (o: THREE.Object3D) => (o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite;

/** Same pre-order walk as the manifest, so ids match manifest item ids. */
function indexed(scene: THREE.Scene) {
  const out: { o: THREE.Object3D; id: number }[] = [];
  let n = -1;
  scene.traverse((o) => { if (n >= 0 && isRenderable(o)) out.push({ o, id: n }); n++; });
  return out;
}

/** Swaps each mesh's material (points, lines and sprites are hidden). Returns the undo. */
function swap(scene: THREE.Scene, pick: (o: THREE.Mesh, id: number, m: AnyMat) => THREE.Material) {
  const undo: (() => void)[] = [];
  for (const { o, id } of indexed(scene)) {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) {
      if (o.visible) { o.visible = false; undo.push(() => { o.visible = true; }); }
      continue;
    }
    const orig = mesh.material;
    const list = (Array.isArray(orig) ? orig : [orig]) as AnyMat[];
    if (list.every((m) => !m.visible)) continue;
    mesh.material = Array.isArray(orig) ? list.map((m) => pick(mesh, id, m)) : pick(mesh, id, list[0]);
    undo.push(() => { mesh.material = orig; });
  }
  return () => undo.forEach((f) => f());
}

let rt: THREE.WebGLRenderTarget | null = null;

/** Renders to an 8-bit target with no tone mapping, fog, background or anti-aliasing: exact colours. */
function renderExact(p: Probe, [w, h]: [number, number]) {
  const r = p.app.renderer, scene = p.app.level.scene;
  if (!rt || rt.width !== w || rt.height !== h) { rt?.dispose(); rt = new THREE.WebGLRenderTarget(w, h); }
  const prev = { auto: r.shadowMap.autoUpdate, clear: r.getClearColor(new THREE.Color()), alpha: r.getClearAlpha(), bg: scene.background, fog: scene.fog };
  r.shadowMap.autoUpdate = false;
  scene.background = null;
  scene.fog = null;
  r.setRenderTarget(rt);
  r.setClearColor(0x000000, 1);
  r.clear();
  r.render(scene, p.app.camera);
  const buf = new Uint8Array(w * h * 4);
  r.readRenderTargetPixels(rt, 0, 0, w, h, buf);
  r.setRenderTarget(null);
  r.setClearColor(prev.clear, prev.alpha);
  r.shadowMap.autoUpdate = prev.auto;
  scene.background = prev.bg;
  scene.fog = prev.fog;
  return buf;
}

/** Bottom-up RGBA rows (GL order) to a PNG data URL. */
function toPng(buf: Uint8Array, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

function tally(buf: Uint8Array) {
  const counts = new Map<number, number>();
  for (let i = 0; i < buf.length; i += 4) {
    const c = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2];
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return counts;
}

function idPass(p: Probe, size: [number, number], double = false) {
  const scene = p.app.level.scene;
  const undo = swap(scene, (_o, id, m) => probeMat(0, m, idColor(id), 1, { double }));
  try { return renderExact(p, size); } finally { undo(); }
}

const LOW_PLANTS = ['grass', 'bed-foliage', 'bed-blooms'];

function hideLowPlants(scene: THREE.Scene) {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => { if (LOW_PLANTS.includes(o.name) && o.visible) { o.visible = false; hidden.push(o); } });
  return () => hidden.forEach((o) => { o.visible = true; });
}

/** Turbo colour map, 0..1 → blue..red (polynomial fit by Google). */
function turbo(t: number) {
  const c = (a: number[]) => Math.max(0, Math.min(1, a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * (a[4] + t * a[5]))))));
  const r = c([0.13572138, 4.6153926, -42.66032258, 132.13108234, -152.94239396, 59.28637943]);
  const g = c([0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604]);
  const b = c([0.1066733, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973]);
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

function partColor(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return new THREE.Color().setHSL(((h >>> 0) % 360) / 360, 0.75, 0.6).getHex();
}


// ---- overlays for walkable and triggers ----

function walkableOverlay(p: Probe) {
  const app = p.app, g = grid(app), group = new THREE.Group();
  const data = new Uint8Array(g.nx * g.nz * 4);
  for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) {
    const c = g.cells[j * g.nx + i], o = ((g.nz - 1 - j) * g.nx + i) * 4;
    if (c === 1) data.set([70, 225, 120, 120], o);
    else if (c === 2) data.set([240, 70, 60, 150], o);
  }
  const tex = new THREE.DataTexture(data, g.nx, g.nz);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(g.nx * g.step, g.nz * g.step).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  plane.position.set(g.minX + (g.nx * g.step) / 2, 0.15, g.minZ + (g.nz * g.step) / 2);
  group.add(plane);
  const fill = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const edge = new THREE.LineBasicMaterial({ color: 0xff8a7a, fog: false, toneMapped: false });
  const segs: number[] = [];
  const walls: { type: string; x: number; z: number; h: number }[] = [];
  for (const c of app.level.colliders.list) {
    const H = Math.min(c.h, 3);
    const geo = c.type === 'circle' ? new THREE.CylinderGeometry(c.r, c.r, H, 20, 1, true) : new THREE.BoxGeometry(c.hx * 2, H, c.hz * 2);
    const m = new THREE.Mesh(geo, fill);
    m.position.set(c.x, H / 2, c.z);
    if (c.type === 'box') m.rotation.y = Math.atan2(c.s, c.c);
    group.add(m);
    outline(segs, c, H);
    walls.push({ type: c.type, x: +c.x.toFixed(2), z: +c.z.toFixed(2), h: c.h });
  }
  group.add(lines(segs, edge));
  const room = app.level.colliders.room;
  if (room) {
    const c = [[room.minX, room.minZ], [room.maxX, room.minZ], [room.maxX, room.maxZ], [room.minX, room.maxZ]];
    const rs = c.flatMap(([x, z], i) => [x, 0.2, z, c[(i + 1) % 4][0], 0.2, c[(i + 1) % 4][1]]);
    group.add(lines(rs, new THREE.LineBasicMaterial({ color: 0xffd60a })));
  }
  return { group, legend: { key: { walkable: 'green', blocked: 'red cells, red walls (drawn up to 3 m)', room: room ? 'yellow line' : undefined }, grid: p.grid(), colliders: walls.length, walls } };
}

const lines = (xyz: number[], m: THREE.LineBasicMaterial) => new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3)), m);

/** Wall outline as line pairs: box edges, or rim circles plus four posts for a circle. */
function outline(out: number[], c: Collider, H: number) {
  if (c.type === 'circle') {
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2, b = ((k + 1) / 20) * Math.PI * 2;
      for (const y of [0.02, H]) out.push(c.x + Math.cos(a) * c.r, y, c.z + Math.sin(a) * c.r, c.x + Math.cos(b) * c.r, y, c.z + Math.sin(b) * c.r);
      if (k % 5 === 0) out.push(c.x + Math.cos(a) * c.r, 0.02, c.z + Math.sin(a) * c.r, c.x + Math.cos(a) * c.r, H, c.z + Math.sin(a) * c.r);
    }
    return;
  }
  // Local (lx, lz) to world, as Colliders.resolve does it.
  const w = (lx: number, lz: number): [number, number] => [c.x + lx * c.c + lz * c.s, c.z - lx * c.s + lz * c.c];
  const k = [w(-c.hx, -c.hz), w(c.hx, -c.hz), w(c.hx, c.hz), w(-c.hx, c.hz)];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = k[i], [bx, bz] = k[(i + 1) % 4];
    out.push(ax, 0.02, az, bx, 0.02, bz, ax, H, az, bx, H, bz, ax, 0.02, az, ax, H, az);
  }
}

const KIND_COLOR = { door: 0xffd60a, exhibit: 0x64d2ff, screen: 0x30d158, exit: 0xbf5af2 } as const;

function triggersOverlay(p: Probe) {
  const app = p.app, group = new THREE.Group();
  const mk = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const zones: unknown[] = [];
  for (const it of app.level.interactables) {
    const col = KIND_COLOR[it.kind];
    const disc = new THREE.Mesh(new THREE.CircleGeometry(it.radius, 48).rotateX(-Math.PI / 2), mk(col, 0.3));
    disc.position.set(it.reach.x, 0.18, it.reach.y);
    const ring = new THREE.Mesh(new THREE.RingGeometry(it.radius - 0.07, it.radius, 64).rotateX(-Math.PI / 2), mk(col, 0.95));
    ring.position.copy(disc.position);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 8), mk(col, 1));
    dot.position.copy(it.anchor);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.18, 0.5, 12).rotateX(Math.PI / 2), mk(0xffffff, 0.9));
    stand.position.set(it.stand.x, 0.3, it.stand.z);
    stand.rotation.y = it.stand.heading;
    const line = lines([it.reach.x, 0.18, it.reach.y, it.anchor.x, it.anchor.y, it.anchor.z], new THREE.LineBasicMaterial({ color: col }));
    group.add(disc, ring, dot, stand, line);
    zones.push({ id: it.id, kind: it.kind, label: it.label, reach: [it.reach.x, it.reach.y].map((v) => +v.toFixed(2)), radius: it.radius, anchor: it.anchor.toArray().map((v) => +v.toFixed(2)), stand: it.stand });
  }
  if (app.level === app.courtyard) {
    // app.checkLeave: z > 24.3 and |x| < 3.6 while walking outwards leaves for the landing page.
    const leave = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.2).rotateX(-Math.PI / 2), mk(0xff9f0a, 0.45));
    leave.position.set(0, 0.2, 24.3 + 1.6);
    group.add(leave);
    zones.push({ id: 'leave', kind: 'leave', label: 'Walk out to the landing page', box: { minX: -3.6, maxX: 3.6, minZ: 24.3 } });
  }
  return { group, legend: { key: { door: 'yellow', exhibit: 'blue', exit: 'purple', leave: 'orange', stand: 'white arrow' }, zones } };
}

function disposeGroup(g: THREE.Group) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
    for (const x of mats) { (x as AnyMat).map?.dispose(); x.dispose(); }
  });
}

export function renderLayer(p: Probe, layer: Layer, size: [number, number], o: ShotOpts): { png: string; legend?: unknown } {
  const app = p.app, r = app.renderer, scene = app.level.scene, [w, h] = size;
  if (layer === 'beauty') {
    p.draw();
    return { png: r.domElement.toDataURL('image/png') };
  }
  if (layer === 'walkable' || layer === 'triggers') {
    const ov = layer === 'walkable' ? walkableOverlay(p) : triggersOverlay(p);
    const show = hideLowPlants(scene);
    scene.add(ov.group);
    try {
      r.render(scene, app.camera);
      return { png: r.domElement.toDataURL('image/png'), legend: ov.legend };
    } finally {
      scene.remove(ov.group);
      show();
      disposeGroup(ov.group);
    }
  }
  if (layer === 'id') {
    const buf = idPass(p, size);
    const byId = new Map(p.manifest().items.map((i) => [idColor(i.id), i]));
    const objects = [...tally(buf)].filter(([c]) => c !== 0).map(([c, n]) => {
      const it = byId.get(c);
      return { color: hex(c), id: it?.id ?? -1, path: it?.path ?? 'unknown colour', part: it?.part, pixels: n, share: +((n / (w * h)) * 100).toFixed(2) };
    }).sort((a, b) => b.pixels - a.pixels);
    return { png: toPng(buf, w, h), legend: { background: '#000000', note: 'colour = (id+1) x 0x9e3779b1 mod 2^24; id = manifest item id', objects } };
  }
  if (layer === 'depth') {
    const far = o.far ?? (app.level === app.courtyard ? 120 : 20);
    const undo = swap(scene, (_m, _id, m) => probeMat(1, m, 0, far));
    try { return { png: toPng(renderExact(p, size), w, h), legend: { near: 'white', far: `black at ${far} m and beyond`, farMetres: far } }; } finally { undo(); }
  }
  if (layer === 'normals') {
    const undo = swap(scene, (_m, _id, m) => probeMat(2, m, 0, 1));
    let buf: Uint8Array;
    try { buf = renderExact(p, size); } finally { undo(); }
    const ids = idPass(p, size, true);
    const byId = new Map(p.manifest().items.map((i) => [idColor(i.id), i.path]));
    const bad = new Map<number, { flipped: number; noNormal: number }>();
    let flipped = 0, noNormal = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const f = buf[i] === 255 && buf[i + 1] === 0 && buf[i + 2] === 255, nn = buf[i] === 255 && buf[i + 1] === 255 && buf[i + 2] === 0;
      if (!f && !nn) continue;
      const id = (ids[i] << 16) | (ids[i + 1] << 8) | ids[i + 2];
      const e = bad.get(id) ?? { flipped: 0, noNormal: 0 };
      if (f) { e.flipped++; flipped++; } else { e.noNormal++; noNormal++; }
      bad.set(id, e);
    }
    const objects = [...bad].map(([c, e]) => ({ path: byId.get(c) ?? 'unknown', ...e })).sort((a, b) => b.flipped + b.noNormal - a.flipped - a.noNormal).slice(0, 20);
    return { png: toPng(buf, w, h), legend: { key: 'view-space normal as RGB; magenta = back of a one-sided face (flipped or seen from inside); yellow = no normal', flipped, noNormal, objects } };
  }
  const items = new Map(p.manifest().items.map((i) => [i.id, i]));
  if (layer === 'wireframe') {
    const undo = swap(scene, (_m, id, m) => probeMat(0, m, partColor(items.get(id)?.part ?? ''), 1, { wire: true }));
    try { return { png: toPng(renderExact(p, size), w, h), legend: { key: 'one colour per part' } }; } finally { undo(); }
  }
  // cost
  const cost = p.lastCost;
  if (!cost || cost.level !== app.level.id) throw new Error('cost layer: run await __probe.cost() in this level first');
  const ms = new Map(cost.parts.map((x) => [x.key, x]));
  const max = Math.max(0.05, ...cost.parts.map((x) => x.ms));
  const undo = swap(scene, (_m, id, m) => {
    const e = ms.get(items.get(id)?.[cost.by] ?? '');
    const t = e && e.ms > Math.max(e.noise, 0.02) ? e.ms / max : 0;
    return probeMat(0, m, e ? turbo(0.08 + t * 0.92) : 0x333333, 1);
  });
  try {
    return { png: toPng(renderExact(p, size), w, h), legend: { key: 'turbo colour map: dark blue = cheap or within noise, red = most GPU time', maxMs: +max.toFixed(3), method: cost.method, top: cost.parts.slice(0, 12).map((x) => `${x.key}: ${x.ms} ms`) } };
  } finally { undo(); }
}

// ---- cost measurement ----

export interface CostPart { key: string; objects: number; triangles: number; draws: number; ms: number; noise: number }
export interface CostResult { level: string; by: 'part' | 'group'; method: string; frames: number; rounds: number; view: string; baseMs: number; baseCpuMs: number; sumOfParts: number; parts: CostPart[]; tookMs: number }

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Hides one part at a time and times the whole frame (A/B/A: shown, hidden, shown again).
 * GPU timer queries when the browser has them, otherwise wall time with a forced GPU sync.
 */
export async function measureCost(p: Probe, o: { frames?: number; rounds?: number; by?: 'part' | 'group'; view?: string }): Promise<CostResult> {
  const t0 = performance.now();
  const app = p.app, cam = app.camera, gl = app.renderer.getContext() as WebGL2RenderingContext;
  const frames = o.frames ?? 8, rounds = o.rounds ?? 3, by = o.by ?? 'part';
  const view = o.view ? p.views()[o.view] : null;
  if (o.view && !view) throw new Error(`no view "${o.view}"`);
  const setCam = () => { if (view) { cam.position.set(...(view.from as V3)); cam.lookAt(...(view.lookAt as V3)); cam.updateMatrixWorld(); app.level.update(0, app.time, cam); } };
  const m = p.manifest();
  const objs = new Map<number, THREE.Object3D>(indexed(app.level.scene).map(({ o, id }) => [id, o]));
  const groups = new Map<string, { list: THREE.Object3D[]; triangles: number; draws: number }>();
  for (const it of m.items) {
    if (!it.draws || !it.shown) continue;
    const key = by === 'part' ? it.part : it.group;
    const g = groups.get(key) ?? { list: [], triangles: 0, draws: 0 };
    const ob = objs.get(it.id);
    if (ob) g.list.push(ob);
    g.triangles += it.triangles;
    g.draws += it.draws;
    groups.set(key, g);
  }
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const px = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const cpu = () => {
    setCam();
    if (p.frozen) p.pin();
    p.draw(); sync(); p.draw(); sync();
    const ts: number[] = [];
    for (let i = 0; i < frames; i++) { const t = performance.now(); p.draw(); sync(); ts.push(performance.now() - t); }
    return median(ts);
  };
  const gpu = async () => {
    if (!timer) return null;
    setCam();
    p.draw(); sync();
    const qs: WebGLQuery[] = [];
    for (let i = 0; i < frames; i++) {
      const q = gl.createQuery()!;
      gl.beginQuery(timer.TIME_ELAPSED_EXT, q);
      p.draw();
      gl.endQuery(timer.TIME_ELAPSED_EXT);
      qs.push(q);
    }
    for (let k = 0; k < 120 && !gl.getQueryParameter(qs[qs.length - 1], gl.QUERY_RESULT_AVAILABLE); k++) await nextFrame();
    const ok = gl.getQueryParameter(qs[qs.length - 1], gl.QUERY_RESULT_AVAILABLE) && !gl.getParameter(timer.GPU_DISJOINT_EXT);
    const ms = ok ? qs.map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6) : [];
    qs.forEach((q) => gl.deleteQuery(q));
    return ok ? median(ms) : null;
  };
  const measure = async () => {
    const g = await gpu();
    const c = g === null ? cpu() : null;
    await nextFrame();
    return { ms: g ?? c!, gpu: g };
  };
  const saved = { p: cam.position.clone(), q: cam.quaternion.clone() };
  // Warm up first: the GPU clocks up over the first few dozen frames.
  setCam();
  for (let i = 0; i < 40; i++) { p.draw(); sync(); }
  const baseCpu = cpu();
  const base = await measure();
  const parts: CostPart[] = [];
  let usedTimer = base.gpu !== null;
  try {
    for (const [key, g] of groups) {
      const was = g.list.map((x) => x.visible);
      // A B A B A B A: each B is compared with the A on either side of it.
      const seq: number[] = [];
      for (let k = 0; k < rounds * 2 + 1; k++) {
        const hide = k % 2 === 1;
        g.list.forEach((x, i) => { x.visible = hide ? false : was[i]; });
        const r = await measure();
        usedTimer &&= r.gpu !== null;
        seq.push(r.ms);
      }
      g.list.forEach((x, i) => { x.visible = was[i]; });
      const est = Array.from({ length: rounds }, (_, k) => (seq[k * 2] + seq[k * 2 + 2]) / 2 - seq[k * 2 + 1]);
      parts.push({ key, objects: g.list.length, triangles: g.triangles, draws: g.draws, ms: +median(est).toFixed(3), noise: +((Math.max(...est) - Math.min(...est)) / 2).toFixed(3) });
    }
  } finally {
    cam.position.copy(saved.p);
    cam.quaternion.copy(saved.q);
  }
  parts.sort((x, y) => y.ms - x.ms);
  return {
    level: app.level.id, by, method: usedTimer ? 'EXT_disjoint_timer_query_webgl2 (GPU time)' : 'wall time per frame with a forced GPU sync (1x1 readPixels)',
    frames, rounds, view: o.view ?? 'current camera', baseMs: +base.ms.toFixed(3), baseCpuMs: +baseCpu.toFixed(3), sumOfParts: +parts.reduce((a, x) => a + x.ms, 0).toFixed(3), parts, tookMs: Math.round(performance.now() - t0),
  };
}

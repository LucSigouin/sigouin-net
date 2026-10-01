// The running experience: renderer, loop, level switching (courtyard ↔ interiors), UI wiring.
import * as THREE from 'three';
import { loadPlayerModel } from '../character/model';
import content from '../content/projects.json';
import type { BuildingId, Content, Entry } from '../content/types';
import { Courtyard, SPAWN } from '../world/courtyard';
import { Player, CameraRig, OUTDOOR } from '../character/controller';
import { Input } from './input';
import { Ambience } from './audio';
import { Post } from './post';
import { settingsFor, isMobile, pickTier, type Quality } from './quality';
import { setMaxAnisotropy } from './textures';
import { globalUniforms } from './shaders';
import { nextFrame, damp, angleDiff } from './util';
import type { Interactable, Level } from './level';
import type { Interior, InteriorHooks, DiveScreen } from '../interiors/room';
import { NAMES } from '../buildings/buildings';
import { toWorld } from '../world/layout';
import { Prompt, Card, Hints, Fade, Boot } from '../ui/overlays';
import { Hud } from '../ui/hud';
import { TouchSticks } from '../ui/touch';
import type { Links } from '../ui/links';

const CONTENT = content as unknown as Content;

type Builder = { build: (c: Content['buildings'][BuildingId], r: THREE.WebGLRenderer, h: InteriorHooks) => Interior };
const INTERIORS: Record<BuildingId, () => Promise<Builder>> = {
  'computer-lab': () => import('../interiors/computerLab'),
  'music-studio': () => import('../interiors/musicStudio'),
  office: () => import('../interiors/office'),
  'ai-workspace': () => import('../interiors/aiWorkspace'),
};

export interface AppOptions {
  onProgress(f: number): void;
  reducedMotion: boolean;
  links: Links;
}

type State = 'loading' | 'waiting' | 'intro' | 'play' | 'transition' | 'links';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const smooth = (a: number, b: number, t: number) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Where "leaving the garden" goes: the landing page one level up, when the hub is served under it. */
const LANDING = import.meta.env.BASE_URL === '/' ? null : new URL('..', new URL(import.meta.env.BASE_URL, location.origin)).pathname;


export class App {
  canvas = document.getElementById('world') as HTMLCanvasElement;
  ui = document.getElementById('ui') as HTMLElement;
  renderer!: THREE.WebGLRenderer;
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 4500);
  input = new Input(this.canvas);
  audio = new Ambience();
  player = new Player();
  rig = new CameraRig(this.camera);
  courtyard!: Courtyard;
  level!: Level;
  post: Post | null = null;
  q!: Quality;
  state: State = 'loading';
  mobile = isMobile();
  touch = matchMedia('(pointer: coarse)').matches;
  prompt: Prompt;
  card: Card;
  hints: Hints;
  fade = new Fade();
  boot: Boot;
  hud: Hud;
  sticks: TouchSticks;
  interiors = new Map<BuildingId, Interior>();
  current: BuildingId | null = null;
  nearest: Interactable | null = null;
  time = 0;
  private last = performance.now();
  private skipped = 0;
  private frame = 0;
  private intro = { t: 0, from: new THREE.Vector3(0, 17, 46), look: new THREE.Vector3(0, 1.5, -8) };
  private faceHeading: number | null = null;
  private raycaster = new THREE.Raycaster();
  private prevState: State = 'play';
  private debugCam: { p: THREE.Vector3; l: THREE.Vector3 } | null = null;
  /** Camera dive into a lab monitor: t runs 0..1 over DIVE_S, then the CRT loading screen. */
  private dive: { entry: Entry; s: DiveScreen; t: number; p0: THREE.Vector3; q0: THREE.Quaternion; p1: THREE.Vector3; q1: THREE.Quaternion; fov0: number; glow0: number; shown: boolean } | null = null;
  /** Test hook: stops the dive at this progress so a frame can be captured mid-flight. */
  private diveHold: number | null = null;
  private m4 = new THREE.Matrix4();
  uniforms = globalUniforms;
  /** Probe hook (?probe only): rewrites each frame's dt; 0 freezes the world. */
  probeDt: ((dt: number) => number) | null = null;

  constructor(private o: AppOptions) {
    this.prompt = new Prompt(this.ui, this.touch);
    this.card = new Card(this.ui);
    this.hints = new Hints(this.ui);
    this.boot = new Boot(this.ui);
    this.hud = new Hud(this.ui, {
      toggleMap: () => { this.hud.mapPanel.hidden = !this.hud.mapPanel.hidden; },
      toggleMute: () => { this.audio.unlock(); this.audio.toggleMute(); },
      skip: () => this.showLinks(),
      travel: (id) => void this.travel(id),
    });
    this.hud.setMuted(this.audio.muted);
    this.audio.onChange = () => this.hud.setMuted(this.audio.muted);
    this.sticks = new TouchSticks(this.ui, this.input, (x, y) => this.tap(x, y));
    this.sticks.setVisible(this.touch);
    document.body.classList.toggle('touch', this.touch);
    this.input.onTap = (x, y) => this.tap(x, y);
    this.prompt.onClick = () => this.nearest && this.state === 'play' && this.nearest.action();
    this.card.onClose = () => { this.input.enabled = true; };
    this.rig.reducedMotion = o.reducedMotion;
    if (o.reducedMotion) globalUniforms.uWind.value = 0;
    const tier = pickTier();
    this.input.enabled = false;
    this.q = settingsFor(tier, this.mobile);
    const unlock = () => {
      this.audio.unlock();
      removeEventListener('pointerdown', unlock);
      removeEventListener('keydown', unlock);
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
    addEventListener('touchstart', () => {
      if (!this.touch) {
        this.touch = true;
        this.sticks.setVisible(true);
        this.prompt.setTouch(true);
        document.body.classList.add('touch');
      }
    }, { passive: true });
  }

  async init() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.q.post, powerPreference: 'high-performance', stencil: false });
    this.renderer = r;
    r.setPixelRatio(this.q.pixelRatio);
    r.setSize(innerWidth, innerHeight, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    setMaxAnisotropy(Math.min(8, r.capabilities.getMaxAnisotropy()));

    // Luc's sculpted model loads alongside the world; on any failure the primitive body stays.
    const model = loadPlayerModel(`${import.meta.env.BASE_URL}models/luc.glb`).catch((e) => { console.warn('player model unavailable:', e); return null; });
    this.courtyard = new Courtyard(r, this.q, (id) => void this.enter(id));
    await this.courtyard.build((f) => this.o.onProgress(f * 0.84));
    const m = await model;
    if (m) this.player.character.useModel(m.root, m.clips);
    this.courtyard.scene.add(this.player.character.root);
    this.player.colliders = this.courtyard.colliders;
    this.player.teleport(SPAWN.x, SPAWN.z, SPAWN.heading);
    this.level = this.courtyard;
    this.rig.reset(this.player, OUTDOOR);
    if (this.q.post) {
      this.post = new Post(r, this.courtyard.scene, this.camera, this.q);
      this.post.setScene(this.courtyard.scene, this.camera);
    }
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('pageshow', (e) => {
      if (e.persisted && this.leaving) location.reload();
      else if (e.persisted && this.dive) this.undive();
    });
    this.o.onProgress(0.88);
    await nextFrame();
    this.placeIntroCamera(0);
    await r.compileAsync(this.courtyard.scene, this.camera);
    this.o.onProgress(0.96);
    await nextFrame();
    // Warm-up frame: uploads every texture and fills the shadow map before the reveal.
    this.courtyard.update(0, 0, this.camera);
    this.draw(0);
    this.o.onProgress(1);
    this.state = 'waiting';
    requestAnimationFrame(this.tick);
  }

  /** Called when the boot flash peaks: the world is on screen from here. */
  reveal() {
    if (this.audio.running) this.audio.chime();
    this.state = 'intro';
    this.intro.t = this.o.reducedMotion ? 1 : 0;
  }

  private placeIntroCamera(k: number) {
    const e = ease(k);
    const rigPos = this.camera.position.clone();
    const rigQ = this.camera.quaternion.clone();
    this.camera.position.copy(this.intro.from);
    this.camera.lookAt(this.intro.look);
    if (k > 0) {
      this.camera.position.lerp(rigPos, e);
      this.camera.quaternion.slerp(rigQ, e);
    }
  }

  private resize() {
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 62 : 50;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.post?.setSize(w, h);
    const px = h * this.renderer.getPixelRatio();
    this.courtyard.setViewport(px, this.camera.fov);
    for (const i of this.interiors.values()) i.setViewport(px, this.camera.fov);
  }

  private draw(dt: number) {
    if (this.post) this.post.draw(dt);
    else this.renderer.render(this.level.scene, this.camera);
  }

  private tick = (now: number) => {
    requestAnimationFrame(this.tick);
    let dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (this.state === 'links' || document.hidden) return;
    if (this.probeDt) dt = this.probeDt(dt);
    if (this.card.isOpen) {
      // Keep the world alive behind the card, at a third of the frame rate.
      this.skipped += dt;
      if (++this.frame % 3 !== 0) return;
      dt = Math.min(0.2, this.skipped);
    }
    this.skipped = 0;
    this.time += dt;
    globalUniforms.uTime.value = this.time;
    this.input.poll(dt);
    if (this.faceHeading !== null) {
      const p = this.player;
      p.heading += angleDiff(p.heading, this.faceHeading) * damp(10, dt);
      p.prevHeading = p.heading;
    }
    this.player.update(dt, this.input, this.rig.yaw);
    this.checkLeave();
    if (!this.leaving) this.rig.update(dt, this.player, this.input, this.level.colliders);
    else {
      // Camera holds its place and rises a little, watching the player walk off down the path.
      const r = this.player.character.root.position;
      this.camera.position.y += dt * 0.45;
      this.camera.lookAt(r.x, 1.1, r.z);
    }
    if (this.state === 'intro' || this.state === 'waiting') {
      if (this.state === 'intro') this.intro.t = Math.min(1, this.intro.t + dt / 2.8);
      this.placeIntroCamera(this.state === 'waiting' ? 0 : this.intro.t);
      if (this.state === 'intro' && this.intro.t >= 1) this.startPlay();
    }
    if (this.dive) this.placeDive(dt);
    if (this.debugCam) { this.camera.position.copy(this.debugCam.p); this.camera.lookAt(this.debugCam.l); }
    this.level.update(dt, this.time, this.camera);
    // Nearest interactable first, so a key press acts on where the player is now.
    this.updatePrompt();
    this.keys();
    const daylight = this.level === this.courtyard ? 1 - this.courtyard.sky.state.night : 0;
    this.audio.update(this.camera, daylight);
    this.hud.updateMap(this.player.pos.x, this.player.pos.z, this.player.heading, this.level === this.courtyard);
    this.draw(dt);
  };

  leaving = false;

  /** Walking out past the end of the entrance path leaves for the landing page. */
  private checkLeave() {
    if (!LANDING || this.leaving || this.state !== 'play' || this.level !== this.courtyard) return;
    const p = this.player;
    if (p.pos.z > 24.3 && Math.abs(p.pos.x) < 3.6 && p.velZ > 0.3) void this.leave(LANDING);
  }

  private async leave(to: string) {
    this.leaving = true;
    this.state = 'transition';
    this.input.enabled = false;
    this.player.autopilot = { x: 0, z: 1 };
    await wait(this.o.reducedMotion ? 200 : 1400);
    await this.fade.to(true, this.o.reducedMotion ? 150 : 900);
    location.href = `${to}#from-hub`;
  }

  private startPlay() {
    this.state = 'play';
    this.input.enabled = true;
    this.player.character.playGesture('wave');
    this.hints.show(this.touch, 3);
  }

  private keys() {
    const inp = this.input;
    if (inp.consume('escape')) {
      if (this.card.isOpen) this.card.close();
      else if (!this.hud.mapPanel.hidden) this.hud.mapPanel.hidden = true;
    }
    if (inp.consume('e') || inp.consume('enter') || inp.consume('f')) {
      if (this.state === 'play' && !this.card.isOpen && this.nearest) this.nearest.action();
    }
    if (inp.consume('m') && this.state === 'play') this.hud.mapPanel.hidden = !this.hud.mapPanel.hidden;
    inp.clearPresses();
  }

  private updatePrompt() {
    let best: Interactable | null = null;
    if (this.state === 'play' && !this.card.isOpen) {
      let bd = Infinity;
      const p = this.player.pos;
      for (const it of this.level.interactables) {
        const d = Math.hypot(p.x - it.reach.x, p.z - it.reach.y);
        if (d < it.radius && d < bd) { bd = d; best = it; }
      }
    }
    this.nearest = best;
    if (!best) { this.prompt.hide(); return; }
    const v = best.anchor.clone().project(this.camera);
    if (v.z > 1) { this.prompt.hide(); return; }
    const label = best.kind === 'exhibit' ? `View ${best.label}` : best.kind === 'screen' ? `Jump into ${best.label}` : best.label;
    this.prompt.show(label, ((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight, best.kind === 'screen' ? 'F' : 'E');
  }

  private tap(x: number, y: number) {
    if (this.state !== 'play' || this.card.isOpen) return;
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = this.player.pos;
    for (const it of this.level.interactables) {
      if (!it.targets.length) continue;
      if (this.raycaster.intersectObjects(it.targets, true).length === 0) continue;
      if (Math.hypot(p.x - it.reach.x, p.z - it.reach.y) < it.radius * 1.6) { it.action(); return; }
    }
  }

  private async loadInterior(id: BuildingId) {
    const hit = this.interiors.get(id);
    if (hit) return hit;
    const mod = await INTERIORS[id]();
    const interior = mod.build(CONTENT.buildings[id], this.renderer, {
      exit: () => void this.exit(),
      openCard: (b, e) => this.openCard(b, e),
      dive: (e, s) => this.startDive(e, s),
    });
    interior.setViewport(innerHeight * this.renderer.getPixelRatio(), this.camera.fov);
    await this.renderer.compileAsync(interior.scene, this.camera);
    this.interiors.set(id, interior);
    return interior;
  }

  private switchLevel(level: Level) {
    const root = this.player.character.root;
    root.removeFromParent();
    level.scene.add(root);
    this.level = level;
    this.player.colliders = level.colliders;
    this.post?.setScene(level.scene, this.camera);
    this.post?.setDof(level === this.courtyard);
  }

  private async enter(id: BuildingId) {
    if (this.state !== 'play') return;
    this.state = 'transition';
    this.input.enabled = false;
    this.player.locked = true;
    this.prompt.hide();
    this.hud.mapPanel.hidden = true;
    const b = this.courtyard.building(id);
    this.faceHeading = b.stand.heading;
    this.player.character.playGesture('openDoor');
    b.door.target = 1;
    const rm = this.o.reducedMotion;
    const load = this.loadInterior(id);
    await wait(rm ? 150 : 700);
    await this.fade.to(true, rm ? 120 : 380);
    let interior: Interior;
    try {
      interior = await load;
    } catch (err) {
      console.error(err);
      b.door.target = 0;
      this.faceHeading = null;
      await this.fade.to(false, 200);
      this.state = 'play';
      this.input.enabled = true;
      this.player.locked = false;
      return;
    }
    this.faceHeading = null;
    this.switchLevel(interior);
    this.current = id;
    this.player.teleport(interior.spawn.x, interior.spawn.z, interior.spawn.heading);
    this.rig.reset(this.player, interior.cam);
    b.door.target = 0;
    b.door.open = 0;
    interior.door.open = 1;
    interior.door.target = 0;
    this.audio.setIndoor(true);
    await nextFrame();
    await this.fade.to(false, rm ? 120 : 450);
    this.player.locked = false;
    this.input.enabled = true;
    this.state = 'play';
  }

  private async exit() {
    if (this.state !== 'play' || !this.current) return;
    const id = this.current;
    const interior = this.interiors.get(id)!;
    this.state = 'transition';
    this.input.enabled = false;
    this.player.locked = true;
    this.prompt.hide();
    this.faceHeading = 0;
    this.player.character.playGesture('openDoor');
    interior.door.target = 1;
    const rm = this.o.reducedMotion;
    await wait(rm ? 120 : 550);
    await this.fade.to(true, rm ? 120 : 350);
    this.faceHeading = null;
    this.switchLevel(this.courtyard);
    const b = this.courtyard.building(id);
    const [ox, oz] = toWorld(b.spec, 0, b.spec.depth / 2 + 3.4);
    this.player.teleport(ox, oz, b.spec.yaw);
    this.rig.reset(this.player, OUTDOOR);
    interior.door.open = 0;
    interior.door.target = 0;
    b.door.open = 1;
    b.door.target = 0;
    this.current = null;
    this.audio.setIndoor(false);
    await nextFrame();
    await this.fade.to(false, rm ? 120 : 450);
    this.player.locked = false;
    this.input.enabled = true;
    this.state = 'play';
  }

  private openCard(id: BuildingId, entry: Entry) {
    if (this.card.isOpen) return;
    this.input.enabled = false;
    this.prompt.hide();
    this.card.open(NAMES[id], entry);
  }

  /** F at a lab computer: the camera flies into the monitor, the glass flares, a CRT loading screen, then the link. */
  private startDive(entry: Entry, s: DiveScreen) {
    if (this.state !== 'play' || this.card.isOpen || !entry.url) return;
    this.state = 'transition';
    this.input.enabled = false;
    this.player.locked = true;
    this.prompt.hide();
    this.hud.mapPanel.hidden = true;
    const endFov = this.camera.fov - 10;
    // Close enough that the glass overfills the frame: the last frames are all screen.
    const p1 = s.center.clone().addScaledVector(s.normal, (s.height / 2 / Math.tan(THREE.MathUtils.degToRad(endFov / 2))) * 0.3);
    this.dive = {
      entry, s, t: this.o.reducedMotion ? 1 : 0, p0: this.camera.position.clone(), q0: this.camera.quaternion.clone(), p1, q1: new THREE.Quaternion(),
      fov0: this.camera.fov, glow0: s.mat.color.r, shown: false,
    };
  }

  private placeDive(dt: number) {
    const d = this.dive!;
    d.t = Math.min(this.diveHold ?? 1, d.t + dt / 1.2);
    const k = d.t;
    // A small pull back, then the rush into the glass, aiming at the screen all the way.
    this.camera.position.lerpVectors(d.p0, d.p1, k < 0.15 ? -0.05 * Math.sin((k / 0.15) * Math.PI) : ease((k - 0.15) / 0.85));
    d.q1.setFromRotationMatrix(this.m4.lookAt(this.camera.position, d.s.center, this.camera.up));
    this.camera.quaternion.slerpQuaternions(d.q0, d.q1, ease(Math.min(1, k * 2.2)));
    this.camera.fov = d.fov0 - 10 * smooth(0.1, 1, k);
    this.camera.updateProjectionMatrix();
    this.player.character.root.visible = k < 0.35;
    d.s.mat.color.setScalar(d.glow0 * (1 + 5 * smooth(0.45, 1, k)));
    this.boot.flash(smooth(0.8, 1, k));
    if (k >= 1 && !d.shown) {
      d.shown = true;
      this.boot.show(d.entry);
      const url = d.entry.url!;
      setTimeout(() => { if (this.dive) location.href = url; }, this.o.reducedMotion ? 400 : 1450);
    }
  }

  /** Back from the linked site through the bfcache: put the lab back the way it was. */
  private undive() {
    const d = this.dive!;
    this.dive = null;
    this.boot.hide();
    d.s.mat.color.setScalar(d.glow0);
    this.camera.fov = d.fov0;
    this.camera.updateProjectionMatrix();
    this.player.character.root.visible = true;
    this.player.locked = false;
    this.rig.reset(this.player, this.level.cam);
    this.input.enabled = true;
    this.state = 'play';
  }

  async travel(id: BuildingId) {
    if (this.state !== 'play') return;
    this.hud.mapPanel.hidden = true;
    if (this.current) await this.exit();
    const b = this.courtyard.building(id);
    this.player.teleport(b.stand.x, b.stand.z, b.stand.heading);
    this.rig.reset(this.player, OUTDOOR);
  }

  showLinks() {
    if (this.state === 'links') return;
    this.prevState = this.state === 'transition' ? 'play' : this.state;
    this.state = 'links';
    this.card.close();
    this.input.enabled = false;
    this.o.links.show({ canReturn: true, onBack: () => this.hideLinks() });
  }
  private hideLinks() {
    this.o.links.hide();
    this.state = this.prevState === 'waiting' ? 'play' : this.prevState;
    this.input.enabled = this.state === 'play';
    this.last = performance.now();
  }

  /** Test and debugging hooks (window.__hub). */
  hooks() {
    return {
      state: () => this.state,
      level: () => this.level.id,
      tier: () => this.q.tier,
      interactables: () => this.level.interactables.map((i) => ({ id: i.id, kind: i.kind, label: i.label })),
      teleport: (id: string) => {
        const it = this.level.interactables.find((i) => i.id === id);
        if (!it) return false;
        this.player.teleport(it.stand.x, it.stand.z, it.stand.heading);
        this.rig.reset(this.player, this.level.cam);
        return true;
      },
      nearest: () => this.nearest?.id ?? null,
      debug: () => {
        const info = this.renderer.info;
        const out: Record<string, unknown> = { calls: info.render.calls, triangles: info.render.triangles, programs: info.programs?.length, textures: info.memory.textures, post: !!this.post, player: this.player.character.root.getObjectByName('player-model') ? 'model' : 'primitive' };
        if (this.post) {
          const rt = this.post.composer.readBuffer;
          const px = new Uint16Array(4);
          this.renderer.readRenderTargetPixels(rt, rt.width >> 1, rt.height >> 1, 1, 1, px);
          out.rtSize = [rt.width, rt.height];
          out.center = Array.from(px);
          out.passes = this.post.composer.passes.map((p) => `${p.constructor.name}:${p.enabled}`);
          const all = new Uint16Array(rt.width * rt.height * 4);
          this.renderer.readRenderTargetPixels(rt, 0, 0, rt.width, rt.height, all);
          const bad: number[][] = [];
          let nan = 0, inf = 0;
          for (let i = 0; i < all.length; i++) {
            const v = all[i];
            if ((v & 0x7c00) === 0x7c00) {
              if (v & 0x03ff) nan++; else inf++;
              if (bad.length < 12) { const p = i >> 2; bad.push([p % rt.width, rt.height - 1 - Math.floor(p / rt.width), i & 3]); }
            }
          }
          out.nan = nan; out.inf = inf; out.bad = bad;
        }
        return out;
      },
      cardOpen: () => this.card.isOpen,
      /** Dive progress (0..1) into a lab computer, or null. */
      dive: () => this.dive?.t ?? null,
      diveHold: (k: number | null) => { this.diveHold = k; },
      /** Perf probing: show or hide every courtyard object with this name. Returns how many. */
      setVisible: (name: string, on: boolean) => {
        let n = 0;
        this.courtyard.scene.traverse((o) => { if (o.name === name) { o.visible = on; n++; } });
        return n;
      },
      view: (p: number[] | null, l?: number[]) => { this.debugCam = p && l ? { p: new THREE.Vector3(...p), l: new THREE.Vector3(...l) } : null; },
      pauseDay: (phase?: number) => {
        this.courtyard.dayRunning = false;
        if (phase !== undefined) this.courtyard.dayClock = phase * this.courtyard.sky.cycleSeconds;
      },
    };
  }
}

export async function createApp(o: AppOptions) {
  const app = new App(o);
  await app.init();
  return app;
}

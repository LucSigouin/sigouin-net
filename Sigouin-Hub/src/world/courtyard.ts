// Assembles the courtyard level and runs its lighting through the day cycle.
import * as THREE from 'three';
import { Colliders } from '../core/collision';
import { globalUniforms } from '../core/shaders';
import type { Quality } from '../core/quality';
import type { Interactable, Level } from '../core/level';
import { OUTDOOR } from '../character/controller';
import { nextFrame, clamp } from '../core/util';
import { materials, type Mats } from './materials';
import { buildGround } from './ground';
import { Sky } from './sky';
import { buildBackdrop, hillTreeSpots } from './backdrop';
import { Fountain } from './fountain';
import { buildProps, type Props } from './props';
import { buildVegetation, buildTrees, buildPotFlowers, type Vegetation } from './vegetation';
import { buildSurroundings, nearTreeSpots } from './surroundings';
import { Life } from './life';
import { setFoliageCoverage } from './foliage';
import { buildBuildings, type BuildingInstance } from '../buildings/buildings';
import { boundarySDF, FOUNTAIN, DECIDUOUS, CYPRESS } from './layout';
import type { BuildingId } from '../content/types';

export const SPAWN = { x: 0, z: 22.5, heading: Math.PI };

export class Courtyard implements Level {
  id = 'courtyard';
  scene = new THREE.Scene();
  colliders = new Colliders();
  interactables: Interactable[] = [];
  cam = OUTDOOR;
  spawn = SPAWN;
  sky!: Sky;
  sun = new THREE.DirectionalLight(0xffffff, 3);
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  fountain!: Fountain;
  props!: Props;
  veg!: Vegetation;
  life!: Life;
  buildings: BuildingInstance[] = [];
  M!: Mats;
  /** Seconds into the day cycle (0 = golden hour, like the reference image). */
  dayClock = 0;
  dayRunning = true;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private fog = new THREE.FogExp2(0xc4d6e6, 0.00068);

  constructor(private renderer: THREE.WebGLRenderer, private q: Quality, private onEnter: (id: BuildingId) => void) {}

  async build(progress: (f: number) => void) {
    const steps: [number, () => void][] = [
      [3, () => {
        this.M = materials();
        setFoliageCoverage(this.q.msaa > 0 || !this.q.post);
      }],
      [4, () => this.scene.add(buildGround(this.q.tier === 'low' ? 2048 : 4096))],
      [2, () => this.buildSky()],
      [3, () => this.scene.add(buildBackdrop())],
      [1, () => {
        this.fountain = new Fountain(this.M.fountainStone, this.q.particles);
        this.scene.add(this.fountain.group);
        this.colliders.circle(0, 0, FOUNTAIN.bedOuter - 0.05, 3);
      }],
      [3, () => this.buildBuildings()],
      [2, () => {
        this.props = buildProps(this.M, this.colliders);
        this.scene.add(this.props.group, buildPotFlowers(this.props.urnTops));
      }],
      [4, () => {
        this.veg = buildVegetation();
        this.veg.setDensity(this.q.grass, this.q.flowers);
        this.scene.add(this.veg.group);
      }],
      [2, () => {
        this.scene.add(buildTrees(DECIDUOUS, CYPRESS, hillTreeSpots(1000), this.q.tier === 'low' ? 0.45 : 1, nearTreeSpots(46)));
        this.scene.add(buildSurroundings());
        for (const [x, z, s] of DECIDUOUS) this.colliders.circle(x, z, 0.45 * s, 6);
        for (const [x, z, s] of CYPRESS) this.colliders.circle(x, z, 0.75 * s, 8);
      }],
      [1, () => {
        this.life = new Life(this.veg.bedSpots, this.q.life);
        this.scene.add(this.life.group);
      }],
    ];
    const total = steps.reduce((a, [w]) => a + w, 0);
    let done = 0;
    for (const [w, fn] of steps) {
      fn();
      done += w;
      progress(done / total);
      await nextFrame();
    }
    this.colliders.boundary = boundarySDF;
    this.scene.fog = this.fog;
    this.update(0, 0);
  }

  private buildSky() {
    this.sky = new Sky(this.q.clouds);
    this.scene.add(this.sky.group);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(this.q.shadowMap, this.q.shadowMap);
    const cam = s.camera as THREE.OrthographicCamera;
    cam.left = -40; cam.right = 40; cam.top = 40; cam.bottom = -40; cam.near = 1; cam.far = 220;
    s.bias = -0.0004;
    s.normalBias = 0.035;
    this.sun.target.position.set(0, 0, -4);
    this.scene.add(this.sun, this.sun.target, this.hemi);
    // Reflections come from the golden-hour sky; intensity follows the day cycle.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const envSky = new Sky(0);
    envSky.setPhase(0);
    envScene.add(envSky.group);
    this.envRT = pmrem.fromScene(envScene, 0.02, 1, 5000);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();
  }

  private buildBuildings() {
    this.buildings = buildBuildings(this.M, this.colliders);
    for (const b of this.buildings) {
      this.scene.add(b.group);
      const targets: THREE.Object3D[] = [b.door.group];
      this.interactables.push({
        id: b.spec.id,
        kind: 'door',
        label: `Enter ${b.name}`,
        anchor: b.anchor,
        reach: new THREE.Vector2(b.stand.x, b.stand.z),
        radius: 2.8,
        targets,
        stand: b.stand,
        action: () => this.onEnter(b.spec.id),
      });
    }
  }

  building(id: BuildingId) {
    return this.buildings.find((b) => b.spec.id === id)!;
  }

  setViewport(h: number, fov: number) {
    this.fountain.setViewport(h, fov);
    this.life.setViewport(h, fov);
    for (const b of this.buildings) b.brain?.setViewport(h, fov);
  }

  applyQuality(q: Quality) {
    this.q = q;
    this.veg.setDensity(q.grass, q.flowers);
    this.fountain.setParticleFraction(q.particles);
    if (this.sun.shadow.mapSize.x !== q.shadowMap) {
      this.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
  }

  update(dt: number, t: number, camera?: THREE.PerspectiveCamera) {
    if (this.dayRunning) this.dayClock += dt;
    const sky = this.sky;
    const cam = camera ?? ({ position: new THREE.Vector3() } as THREE.PerspectiveCamera);
    sky.update(this.dayClock, dt, cam);
    const st = sky.state;
    this.sun.color.copy(st.sunColor);
    this.sun.intensity = st.sunIntensity;
    this.sun.position.copy(this.sun.target.position).addScaledVector(st.lightDir, 90);
    globalUniforms.uSunDir.value.copy(st.lightDir);
    globalUniforms.uSunColor.value.copy(st.sunColor).multiplyScalar(st.sunIntensity);
    this.hemi.color.copy(st.hemiSky);
    this.hemi.groundColor.copy(st.hemiGround);
    this.hemi.intensity = st.hemiIntensity;
    this.fog.color.copy(st.fog);
    this.scene.environmentIntensity = st.env;
    globalUniforms.uNight.value = st.night;
    this.props.lightPools.opacity = clamp(st.night * 1.1) * 0.85;
    const light = new THREE.Color().copy(st.hemiSky).lerp(st.sunColor, 0.5);
    this.fountain.setLight(light, 0.55 + 0.6 * (1 - st.night));
    this.life.update(t, 1 - st.night, globalUniforms.uWind.value > 0);
    for (const b of this.buildings) b.update(dt, t);
  }
}

import * as THREE from 'three';
import { Interior, type InteriorHooks } from './room';
import { floorTexture, rug, sofa, pendant } from './kit';
import { grandPiano, drumKit, guitar, keyboardStand, mixingDesk, studioMonitor, foamWall, floorLamp, monitor, screenMaterial } from '../buildings/furniture';
import { screenTexture } from '../core/textures';
import { mat, boxM } from '../core/util';
import type { BuildingContent, Entry } from '../content/types';

export function build(content: BuildingContent, renderer: THREE.WebGLRenderer, hooks: InteriorHooks) {
  const floor = new THREE.MeshStandardMaterial({ map: floorTexture('oak', 3.2), roughness: 0.55 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xe6d3b8, roughness: 0.92 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0x6d4a31, roughness: 0.9 });
  const I = new Interior('music-studio', content, { w: 16, d: 12, h: 4.4, floor, wall, ceiling, outside: 0xf3e2c4 }, renderer, hooks);
  const { b, F } = I;
  I.scene.environmentIntensity = 0.45;
  for (let x = -7.5; x <= 7.5; x += 1.5) b.box(F.walnut, 0.14, 0.24, 12, x, 4.28, 0);

  foamWall(b, F, mat(0, 0.9, -6.0), 15, 6, 0.52);
  foamWall(b, F, mat(-8.0, 0.9, 2.4, 0, Math.PI / 2), 8, 5, 0.52);
  for (let i = 0; i < 18; i++) b.box(F.oak, 0.12, 2.4, 0.12 + (i % 3) * 0.06, 7.95 - 0.06, 2.1, -4.5 + i * 0.28);
  const red = new THREE.MeshStandardMaterial({ color: 0x7a2f2a, roughness: 1 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2c3a55, roughness: 1 });
  rug(b, red, mat(-3.8, 0, 2.2), 4.2, 4.2, true);
  rug(b, blue, mat(1.2, 0, -1.4), 5.2, 3.6);

  // Mixing desk at the back: the SiGz exhibit.
  const daw = screenMaterial(screenTexture({ title: 'Recording', subtitle: 'Session 04', theme: 'warm' }), 1.3);
  mixingDesk(b, F, mat(0, 0, -3.9));
  const screen = monitor(b, F, mat(0, 0.12, -4.25), daw, 0.9, 0.5);
  I.scene.add(screen);
  studioMonitor(b, F, mat(-1.3, 0.9, -4.1, 0, 0.25));
  studioMonitor(b, F, mat(1.3, 0.9, -4.1, 0, -0.25));
  I.colliders.box(0, -3.9, 1.2, 0.55, 0, 1.2);
  I.exhibit({
    name: 'mixing-desk', anchor: new THREE.Vector3(0, 1.95, -3.9), stand: { x: 0, z: -2.3, heading: Math.PI }, targets: [screen],
    show: (e: Entry) => { daw.map = screenTexture({ title: e.title, subtitle: e.url ? e.url.replace(/^https?:\/\//, '') : 'Mix in progress', theme: 'warm' }); daw.needsUpdate = true; },
  });

  // Grand piano on the round rug.
  grandPiano(b, F, mat(-3.8, 0, 2.5, 0, Math.PI + 0.35));
  I.colliders.box(-3.8, 1.9, 0.95, 1.25, 0.35, 1.2);
  I.exhibit({ name: 'piano', anchor: new THREE.Vector3(-3.6, 1.7, 2.6), stand: { x: -3.2, z: 4.2, heading: Math.PI - 0.35 }, targets: [] });

  // Guitars on wall hooks.
  const kinds = ['acoustic', 'electric', 'bass', 'electric', 'acoustic'] as const;
  kinds.forEach((k, i) => {
    const z = -4.6 + i * 1.0;
    guitar(b, F, mat(-7.84, 1.75, z, 0, Math.PI / 2), k);
    b.box(F.chrome, 0.12, 0.03, 0.03, -7.94, 2.4 + (k === 'bass' ? 0.25 : 0.1), z);
  });
  I.exhibit({ name: 'guitar-wall', anchor: new THREE.Vector3(-7.5, 2.9, -2.6), stand: { x: -6.2, z: -2.6, heading: -Math.PI / 2 }, targets: [] });

  // Drum kit on a riser, facing the room.
  b.box(F.walnut, 3.2, 0.14, 3.0, 4.6, 0.07, -3.6);
  drumKit(b, F, mat(4.6, 0.14, -3.5, 0, Math.PI));
  I.colliders.box(4.6, -3.6, 1.6, 1.5, 0, 1.4);
  I.exhibit({ name: 'drums', anchor: new THREE.Vector3(4.6, 1.9, -3.4), stand: { x: 4.6, z: -1.5, heading: Math.PI }, targets: [] });

  keyboardStand(b, F, mat(3.0, 0, 1.6, 0, -0.5));
  I.colliders.box(3.0, 1.6, 0.7, 0.3, -0.5, 1.2);
  I.exhibit({ name: 'keyboard', anchor: new THREE.Vector3(3.0, 1.5, 1.6), stand: { x: 2.4, z: 2.7, heading: Math.PI - 0.5 }, targets: [] });

  sofa(b, F, mat(6.4, 0, 3.2, 0, -Math.PI / 2));
  I.colliders.box(6.4, 3.2, 0.5, 1.15, 0, 1);
  b.box(F.walnut, 1.1, 0.4, 0.6, 4.9, 0.2, 3.2);
  I.colliders.box(4.9, 3.2, 0.6, 0.35, 0, 0.6);
  for (const [x, z] of [[-6.8, 4.9], [6.9, -5.3], [-1.9, -5.3]]) {
    floorLamp(b, F, mat(x, 0, z));
    I.colliders.circle(x, z, 0.25, 1.6);
  }
  for (const [x, z] of [[-3.8, 2.4], [0, -1.2], [4, 0.5]]) pendant(b, F, x, z, 4.4, 1.3);
  b.add(boxM(1.6, 0.9, 0.04), F.black, mat(4.2, 2.3, -5.97));
  I.light(0xffc58a, 9, -3.8, 3.0, 2.4);
  I.light(0xffc58a, 8, 0, 3.0, -1.4);
  I.light(0xffb070, 7, 4.2, 3.0, -2.4);
  I.light(0xffd9a8, 4, -6.5, 1.8, 4.6, 7);
  I.finish();
  return I;
}

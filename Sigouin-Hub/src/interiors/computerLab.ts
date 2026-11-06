import * as THREE from 'three';
import { Interior, type InteriorHooks } from './room';
import { floorTexture } from './kit';
import { desk, monitor, chair, plant, screenMaterial, lightPanel } from '../buildings/furniture';
import { screenTexture } from '../core/textures';
import { mat, boxM } from '../core/util';
import type { BuildingContent, Entry } from '../content/types';

export function build(content: BuildingContent, renderer: THREE.WebGLRenderer, hooks: InteriorHooks) {
  const floor = new THREE.MeshStandardMaterial({ map: floorTexture('carpet', 4.8), roughness: 0.95 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.9 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0xf6f7f8, roughness: 0.95 });
  const I = new Interior('computer-lab', content, { w: 16, d: 12, h: 4.2, floor, wall, ceiling, outside: 0xd8ecf7 }, renderer, hooks);
  const { b, F } = I;
  const stripe = new THREE.MeshStandardMaterial({ color: 0x2f5fb3, roughness: 0.6 });
  b.box(stripe, 16, 0.08, 0.02, 0, 1.1, -5.99);
  for (const s of [-1, 1]) b.box(stripe, 0.02, 0.08, 12, s * 7.99, 1.1, 0);
  for (let x = -5; x <= 5; x += 2.5) for (const z of [-3.5, 0, 3.5]) lightPanel(b, F, mat(x, 4.17, z), 1.3, 0.5);

  const soon = screenMaterial(screenTexture({ title: 'Coming soon', subtitle: 'Gaming projects', theme: 'blue' }), 1.4);
  const rows = [-1.0, -3.6];
  const cols = [-4.5, -2.1, 2.1, 4.5];
  let n = 0;
  for (const z of rows) {
    for (const x of cols) {
      n++;
      const base = mat(x, 0, z);
      desk(b, F, base, 1.6, 0.72);
      const mat0 = soon.clone();
      const screen = monitor(b, F, base, mat0, 0.66, 0.4);
      I.scene.add(screen);
      chair(b, F, mat(x, 0, z + 0.72, 0, 0.2 * Math.sin(n * 2.1)));
      b.add(boxM(0.46, 0.02, 0.16), F.black, mat(x, 0.76, z + 0.14));
      b.add(boxM(0.07, 0.02, 0.11), F.black, mat(x + 0.38, 0.76, z + 0.14));
      I.colliders.box(x, z + 0.25, 0.85, 0.72, 0, 1.2);
      const name = `monitor-${n}`;
      I.exhibit({
        name, anchor: new THREE.Vector3(x, 1.55, z - 0.05), stand: { x, z: z + 1.45, heading: Math.PI }, targets: [screen],
        screen: { center: new THREE.Vector3(x, 1.03, z - 0.033), normal: new THREE.Vector3(0, 0, 1), height: 0.4, mat: mat0 },
        show: (e: Entry) => { mat0.map = screenTexture({ title: e.title, subtitle: e.url ? `${e.tag ?? 'Open project'} · press F` : 'Gaming project', theme: 'blue' }); mat0.needsUpdate = true; },
      });
    }
  }
  // Projector and screen on the back wall.
  const projMat = screenMaterial(screenTexture({ title: 'Computer Lab', subtitle: 'Gaming projects', theme: 'blue', w: 1024, h: 576 }), 1.25);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.0), projMat);
  screen.position.set(0, 2.45, -5.97);
  I.scene.add(screen);
  b.box(F.black, 5.6, 0.1, 0.12, 0, 4.0, -5.93);
  b.box(F.white, 0.5, 0.18, 0.4, 0, 3.92, -1.6);
  b.box(F.black, 0.05, 0.3, 0.05, 0, 4.1, -1.6);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 1.6, 4.3, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9cc4ff, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  );
  beam.rotation.x = Math.PI / 2 + 0.36;
  beam.position.set(0, 3.2, -3.75);
  I.scene.add(beam);
  I.exhibit({
    name: 'projector', anchor: new THREE.Vector3(0, 4.1, -5.8), stand: { x: 0, z: -3.3, heading: Math.PI }, targets: [screen],
    show: (e: Entry) => { projMat.map = screenTexture({ title: e.title, subtitle: 'Computer Lab · gaming projects', theme: 'blue', w: 1024, h: 576 }); projMat.needsUpdate = true; },
  });
  for (const [x, z] of [[-7.3, -5.3], [7.3, -5.3], [-7.3, 5.2], [7.3, 5.2]]) {
    plant(b, F, mat(x, 0, z), 1.2);
    I.colliders.circle(x, z, 0.35, 1.5);
  }
  for (const s of [-1, 1]) {
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), screenMaterial(screenTexture({ title: 'Next up', subtitle: 'New games on the way', theme: 'dark', w: 360, h: 480 }), 0.95));
    poster.position.set(s * 7.98, 2.2, -1.5);
    poster.rotation.y = -s * Math.PI / 2;
    I.scene.add(poster);
  }
  I.light(0xeef4ff, 6, -4, 3.8, 1);
  I.light(0xeef4ff, 6, 4, 3.8, 1);
  I.light(0x9cc4ff, 4, 0, 3.4, -4);
  I.finish();
  return I;
}

import * as THREE from 'three';
import { Interior, type InteriorHooks } from './room';
import { floorTexture, rackLeds, whiteboardTexture, bookshelf } from './kit';
import { desk, monitor, chair, plant, serverRack, whiteboard, screenMaterial, lightPanel } from '../buildings/furniture';
import { screenTexture } from '../core/textures';
import { mat } from '../core/util';
import type { BuildingContent, Entry } from '../content/types';

export function build(content: BuildingContent, renderer: THREE.WebGLRenderer, hooks: InteriorHooks) {
  const floor = new THREE.MeshStandardMaterial({ map: floorTexture('oak', 3.0), roughness: 0.5 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xf1e9dc, roughness: 0.92 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0xf7f3ec, roughness: 0.95 });
  const I = new Interior('office', content, { w: 16, d: 12, h: 4.2, floor, wall, ceiling, outside: 0xf1e6d0 }, renderer, hooks);
  const { b, F } = I;
  for (let x = -4.5; x <= 4.5; x += 3) for (const z of [-3, 1.5]) lightPanel(b, F, mat(x, 4.17, z), 1.6, 0.4);

  // Dual-monitor desks.
  const desks: [number, number][] = [[-2.4, -0.4], [2.4, -0.4], [-2.4, -3.2], [2.4, -3.2]];
  desks.forEach(([x, z], i) => {
    const base = mat(x, 0, z);
    desk(b, F, base, 1.8, 0.8);
    const sm = screenMaterial(screenTexture({ title: 'Dashboard', subtitle: 'all green', theme: 'dark' }), 1.3);
    const sm2 = screenMaterial(screenTexture({ title: 'Terminal', subtitle: 'ssh gardens', theme: 'cyan' }), 1.3);
    const a = monitor(b, F, base.clone().multiply(mat(-0.36, 0, 0)), sm, 0.6, 0.36, 0.14);
    const c = monitor(b, F, base.clone().multiply(mat(0.36, 0, 0)), sm2, 0.6, 0.36, -0.14);
    I.scene.add(a, c);
    chair(b, F, mat(x, 0, z + 0.78, 0, 0.3 * Math.sin(i * 2)));
    I.colliders.box(x, z + 0.25, 0.95, 0.78, 0, 1.2);
    I.exhibit({
      name: `desk-${i + 1}`, anchor: new THREE.Vector3(x, 1.65, z - 0.05), stand: { x, z: z + 1.55, heading: Math.PI }, targets: [a, c],
      show: (e: Entry) => { sm.map = screenTexture({ title: e.title, subtitle: e.url ? e.url.replace(/^https?:\/\//, '') : 'In progress', theme: 'dark' }); sm.needsUpdate = true; },
    });
  });

  // Server racks along the right wall.
  const fronts: THREE.Matrix4[] = [];
  for (let i = 0; i < 5; i++) {
    const m = mat(7.4, 0, -4.4 + i * 0.66, 0, -Math.PI / 2);
    serverRack(b, F, m);
    fronts.push(m);
  }
  I.scene.add(rackLeds(fronts));
  I.colliders.box(7.4, -3.1, 0.55, 1.75, 0, 2.2);
  I.exhibit({ name: 'server-rack', anchor: new THREE.Vector3(6.8, 2.5, -3.1), stand: { x: 5.6, z: -3.1, heading: Math.PI / 2 }, targets: [] });

  // Whiteboard on the left wall.
  const wbMat = new THREE.MeshStandardMaterial({ map: whiteboardTexture('Backups'), roughness: 0.35 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), wbMat);
  board.position.set(-7.96, 1.75, -1.2);
  board.rotation.y = Math.PI / 2;
  I.scene.add(board);
  whiteboard(b, F, mat(-7.97, 1.75, -1.2, 0, Math.PI / 2), 3.2, 1.6);
  I.exhibit({
    name: 'whiteboard', anchor: new THREE.Vector3(-7.7, 2.8, -1.2), stand: { x: -6.3, z: -1.2, heading: -Math.PI / 2 }, targets: [board],
    show: (e: Entry) => { wbMat.map = whiteboardTexture(e.title); wbMat.needsUpdate = true; },
  });

  bookshelf(b, F, mat(-4.2, 0, -5.8), 2.4, 2.3);
  bookshelf(b, F, mat(-1.4, 0, -5.8), 2.4, 2.3);
  I.colliders.box(-2.8, -5.8, 2.6, 0.3, 0, 2.3);
  for (const [x, z, s] of [[-7.2, 5.1, 1.4], [7.2, 5.1, 1.4], [3.2, -5.4, 1.6], [-7.2, -5.2, 1.2]] as const) {
    plant(b, F, mat(x, 0, z), s);
    I.colliders.circle(x, z, 0.35 * s, 1.5);
  }
  I.light(0xfff1dd, 7, -3, 3.8, -1);
  I.light(0xfff1dd, 7, 3, 3.8, -1);
  I.light(0xfff1dd, 4, 0, 3.8, 3.5);
  I.onTick(() => void 0);
  I.finish();
  return I;
}

import * as THREE from 'three';
import { Interior, type InteriorHooks } from './room';
import { floorTexture, Terminal } from './kit';
import { curvedDesk, monitor, chair, plant, screenMaterial } from '../buildings/furniture';
import { HoloBrain } from '../buildings/brain';
import { screenTexture } from '../core/textures';
import { mat } from '../core/util';
import type { BuildingContent, Entry } from '../content/types';

export function build(content: BuildingContent, renderer: THREE.WebGLRenderer, hooks: InteriorHooks) {
  const floor = new THREE.MeshStandardMaterial({ map: floorTexture('dark', 4), roughness: 0.2, metalness: 0.35 });
  const wall = new THREE.MeshStandardMaterial({ color: 0x1f2636, roughness: 0.75 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.9 });
  const I = new Interior('ai-workspace', content, { w: 16, d: 12, h: 4.4, floor, wall, ceiling, outside: 0xd6e6f2 }, renderer, hooks);
  const { b, F } = I;
  I.scene.environmentIntensity = 0.4;
  I.scene.background = new THREE.Color(0x0a0d14);
  // Blue light strips along floor and ceiling edges.
  for (const y of [0.05, 4.33]) {
    b.box(F.accentBlue, 16, 0.04, 0.05, 0, y, -5.97);
    for (const s of [-1, 1]) b.box(F.accentBlue, 0.05, 0.04, 12, s * 7.97, y, 0);
  }
  for (let z = -4; z <= 4; z += 2) b.box(F.accentBlue, 10, 0.03, 0.08, 0, 4.36, z);

  // Hologram centrepiece.
  const brain = new HoloBrain(9000, 1.15);
  brain.group.position.set(0, 2.25, -1.4);
  I.scene.add(brain.group);
  b.add(new THREE.CylinderGeometry(0.8, 0.95, 1.0, 40), I.M.steel, mat(0, 0.5, -1.4));
  b.add(new THREE.CylinderGeometry(0.72, 0.72, 0.03, 40), F.accentBlue, mat(0, 1.01, -1.4));
  I.colliders.circle(0, -1.4, 1.05, 3);
  I.onTick((_dt, t) => brain.update(t));
  I.onViewport((h, fov) => brain.setViewport(h, fov));
  const glow = I.light(0x5ab4ff, 6, 0, 2.2, -1.4, 9);
  I.onTick((_dt, t) => { glow.intensity = 5 + Math.sin(t * 1.7) * 1.2; });
  I.exhibit({ name: 'brain', anchor: new THREE.Vector3(0, 3.5, -1.4), stand: { x: 0, z: 0.9, heading: Math.PI }, targets: [brain.group] });

  // Two curved desks around the hologram, screens facing out to the operators.
  const terms: Terminal[] = [];
  const sides = [{ cx: -0.4, yaw: -1.4, name: 'terminal-1' }, { cx: 0.4, yaw: 1.4, name: 'terminal-2' }];
  sides.forEach((s, si) => {
    const center = mat(s.cx, 0, -1.4, 0, s.yaw);
    curvedDesk(b, F, center, 3.5, 1.2);
    [-0.35, 0, 0.35].forEach((a, k) => {
      const term = new Terminal(k === 1 ? 'agent.log' : 'train.log', si * 3 + k + 1);
      terms.push(term);
      const m = screenMaterial(term.texture, 1.4);
      const place = center.clone().multiply(mat(Math.sin(a) * 3.5, 0, Math.cos(a) * 3.5, 0, a));
      const scr = monitor(b, F, place, m, 0.64, 0.4);
      I.scene.add(scr);
      chair(b, F, place.clone().multiply(mat(0, 0, 0.8, 0, 0.2 * (k - 1))));
      const wp = new THREE.Vector3().setFromMatrixPosition(place);
      I.colliders.circle(wp.x, wp.z, 0.75, 1.2);
      if (k === 1) {
        const out = new THREE.Vector3(0, 0, 1.7).applyMatrix4(place);
        I.exhibit({
          name: s.name, anchor: new THREE.Vector3(wp.x, 1.6, wp.z), stand: { x: out.x, z: out.z, heading: Math.atan2(wp.x - out.x, wp.z - out.z) }, targets: [scr],
          show: (e: Entry) => term.setTitle(e.title),
        });
      }
      if (k === 2 && si === 0) {
        const out = new THREE.Vector3(0, 0, 1.7).applyMatrix4(place);
        I.exhibit({ name: 'curved-desk', anchor: new THREE.Vector3(wp.x, 1.6, wp.z), stand: { x: out.x, z: out.z, heading: Math.atan2(wp.x - out.x, wp.z - out.z) }, targets: [scr], show: (e: Entry) => term.setTitle(e.title) });
      }
    });
  });
  I.onTick((dt) => terms.forEach((t) => t.update(dt)));

  // Wall display.
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.2), screenMaterial(screenTexture({ title: 'AI Workspace', subtitle: 'models doing the heavy lifting', theme: 'cyan', w: 1024, h: 470 }), 1.2));
  wallScreen.position.set(0, 2.6, -5.97);
  I.scene.add(wallScreen);
  for (const [x, z] of [[-7.2, 5.1], [7.2, 5.1], [-7.2, -5.2], [7.2, -5.2]]) {
    plant(b, F, mat(x, 0, z), 1.3);
    I.colliders.circle(x, z, 0.45, 1.5);
  }
  I.light(0x6fa8ff, 5, -5, 3.6, 2);
  I.light(0x6fa8ff, 5, 5, 3.6, 2);
  I.light(0xdfe8ff, 3, 0, 3.8, 4);
  I.finish();
  return I;
}

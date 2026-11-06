import * as THREE from 'three';
import { boxM } from '../core/util';
import { damp } from '../core/util';

/** Double glass doors that swing inwards around their outer hinges. */
export class DoubleDoor {
  group = new THREE.Group();
  private leaves: THREE.Group[] = [];
  open = 0;
  target = 0;

  constructor(width: number, height: number, frame: THREE.Material, glass: THREE.Material, handle: THREE.Material) {
    const lw = width / 2;
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.x = side * lw;
      const leaf = new THREE.Group();
      const s = -side;
      const bar = 0.06;
      const parts: [number, number, number, number, number][] = [
        [bar, height, (s * bar) / 2, height / 2, 0],
        [bar, height, s * (lw - bar / 2), height / 2, 0],
        [lw, bar, (s * lw) / 2, bar / 2 + 0.04, 0],
        [lw, bar, (s * lw) / 2, height - bar / 2, 0],
        [lw, 0.16, (s * lw) / 2, 0.12, 0],
      ];
      for (const [w, h, x, y] of parts) {
        const m = new THREE.Mesh(boxM(w, h, 0.05), frame);
        m.position.set(x, y, 0);
        m.castShadow = true;
        leaf.add(m);
      }
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(lw - bar * 2, height - bar - 0.2), glass);
      pane.position.set((s * lw) / 2, (height - bar - 0.2) / 2 + 0.2, 0);
      leaf.add(pane);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.7, 8), handle);
      h.position.set(s * (lw - 0.13), 1.05, 0.06);
      leaf.add(h);
      const h2 = h.clone();
      h2.position.z = -0.06;
      leaf.add(h2);
      pivot.add(leaf);
      this.group.add(pivot);
      this.leaves.push(pivot);
    }
  }

  update(dt: number) {
    this.open += (this.target - this.open) * damp(5, dt);
    const a = this.open * 1.3;
    this.leaves[0].rotation.y = a;
    this.leaves[1].rotation.y = -a;
  }
}

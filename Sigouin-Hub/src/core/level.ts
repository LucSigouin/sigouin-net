import type * as THREE from 'three';
import type { Colliders } from './collision';
import type { CamLimits } from '../character/controller';

export interface Interactable {
  id: string;
  /** 'screen' = a Computer Lab monitor with a link: F dives into it instead of opening a card. */
  kind: 'door' | 'exhibit' | 'exit' | 'screen';
  label: string;
  /** Where the prompt floats (world). */
  anchor: THREE.Vector3;
  /** Player must be within this distance of `reach` (XZ). */
  reach: THREE.Vector2;
  radius: number;
  /** Meshes a click or tap can hit to trigger this. */
  targets: THREE.Object3D[];
  /** Where to stand when teleporting next to it (tests, map). */
  stand: { x: number; z: number; heading: number };
  action: () => void;
}

export interface Level {
  id: string;
  scene: THREE.Scene;
  colliders: Colliders;
  interactables: Interactable[];
  cam: CamLimits;
  spawn: { x: number; z: number; heading: number };
  update(dt: number, t: number, camera: THREE.PerspectiveCamera): void;
  setViewport(heightPx: number, fov: number): void;
}

// Shared PBR materials for the courtyard and interiors, built once from procedural textures.
import * as THREE from 'three';
import { limestone, planks, shingles, rockTextures } from '../core/textures';
import { applyNightGlow } from '../core/shaders';

export interface Mats {
  stone: THREE.MeshStandardMaterial;
  stoneWarm: THREE.MeshStandardMaterial;
  stoneSmooth: THREE.MeshStandardMaterial;
  fountainStone: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  darkWood: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  lantern: THREE.MeshStandardMaterial;
  windowWarm: THREE.MeshStandardMaterial;
  windowCool: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
}

let cached: Mats | null = null;

export function materials(): Mats {
  if (cached) return cached;
  const ls = limestone(1, '#ebe0cb');
  const lsWarm = limestone(7, '#e6d6ba');
  const pl = planks(2);
  const fountainMap = ls.map.clone();
  fountainMap.repeat.set(9, 1.2);
  const fountainBump = ls.bump.clone();
  fountainBump.repeat.set(9, 1.2);
  const smoothMap = ls.map.clone();
  smoothMap.repeat.set(0.18, 0.18);
  cached = {
    stone: new THREE.MeshStandardMaterial({ map: ls.map, bumpMap: ls.bump, bumpScale: 1.2, roughness: 0.88 }),
    stoneWarm: new THREE.MeshStandardMaterial({ map: lsWarm.map, bumpMap: lsWarm.bump, bumpScale: 1.2, roughness: 0.88 }),
    stoneSmooth: new THREE.MeshStandardMaterial({ map: smoothMap, color: 0xf2eadb, roughness: 0.8 }),
    fountainStone: new THREE.MeshStandardMaterial({ map: fountainMap, bumpMap: fountainBump, bumpScale: 0.8, roughness: 0.8, color: 0xf6f0e4 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x9a6a42, roughness: 0.68 }),
    timber: new THREE.MeshStandardMaterial({ map: pl.map, bumpMap: pl.bump, bumpScale: 1.5, roughness: 0.78 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.7 }),
    roof: new THREE.MeshStandardMaterial({ map: shingles(4), roughness: 0.75, color: 0xd8dde6 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: 0.45, metalness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.38, metalness: 0.75 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: 0.2, metalness: 0.95 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.4, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fb8c4, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.18, envMapIntensity: 1.4, depthWrite: false }),
    lantern: applyNightGlow(new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc27a, emissiveIntensity: 1, roughness: 0.3 }), 0.35, 5.5),
    windowWarm: applyNightGlow(new THREE.MeshStandardMaterial({ color: 0x302418, emissive: 0xffd9a8, emissiveIntensity: 1, roughness: 0.9 }), 0.45, 1.5),
    windowCool: applyNightGlow(new THREE.MeshStandardMaterial({ color: 0x0c1830, emissive: 0x9cc8ff, emissiveIntensity: 1, roughness: 0.9 }), 0.5, 1.5),
    plaster: new THREE.MeshStandardMaterial({ color: 0xf1e9dc, roughness: 0.95 }),
    rock: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, ...(({ map, bump }) => ({ map, bumpMap: bump, bumpScale: 3 }))(rockTextures()) }),
    soil: new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 }),
  };
  return cached;
}

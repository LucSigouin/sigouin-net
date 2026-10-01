// Top-right HUD (map, sound, fullscreen, graphics quality, skip to links) and the courtyard map.
import { el } from './overlays';
import { BUILDINGS, SEGMENTS, FOUNTAIN, toWorld } from '../world/layout';
import { NAMES } from '../buildings/buildings';
import type { BuildingId } from '../content/types';
import { pickTier, switchTier } from '../core/quality';

const ICON = {
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  exitFull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
};

export interface HudHandlers {
  toggleMap(): void;
  toggleMute(): void;
  skip(): void;
  travel(id: BuildingId): void;
}

export class Hud {
  root = el('div', 'hud');
  private mute: HTMLButtonElement;
  private full: HTMLButtonElement;
  mapPanel: HTMLDivElement;
  private dot!: SVGCircleElement;
  private facing!: SVGPathElement;

  constructor(parent: HTMLElement, private h: HudHandlers) {
    const btn = (label: string, html: string, cls = 'hud-btn') => {
      const b = el('button', cls, html) as HTMLButtonElement;
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.title = label;
      this.root.append(b);
      return b;
    };
    const map = btn('Map of the courtyard', ICON.map);
    map.addEventListener('click', () => h.toggleMap());
    this.mute = btn('Mute sound', ICON.sound);
    this.mute.addEventListener('click', () => h.toggleMute());
    this.full = btn('Full screen', ICON.full);
    this.full.addEventListener('click', () => this.toggleFullscreen());
    if (!document.fullscreenEnabled) this.full.hidden = true;
    document.addEventListener('fullscreenchange', () => {
      const on = !!document.fullscreenElement;
      this.full.innerHTML = on ? ICON.exitFull : ICON.full;
      this.full.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    });
    const tier = pickTier();
    const next = tier === 'high' ? 'medium' : 'high';
    const quality = btn(`Graphics quality: ${tier}. Click for ${next} (reloads the page)`, tier === 'high' ? 'High' : tier === 'medium' ? 'Medium' : 'Low', 'hud-btn hud-quality');
    quality.addEventListener('click', () => switchTier(next));
    const skip = btn('Skip to links', '<span>Skip</span><span class="long">&nbsp;to links</span>', 'hud-btn hud-skip');
    skip.addEventListener('click', () => h.skip());
    parent.append(this.root);
    this.mapPanel = this.buildMap(parent);
  }

  private toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => { /* refused: stay windowed */ });
  }

  setMuted(m: boolean) {
    this.mute.innerHTML = m ? ICON.mute : ICON.sound;
    this.mute.setAttribute('aria-label', m ? 'Turn sound on' : 'Mute sound');
    this.mute.title = m ? 'Sound off' : 'Sound on';
  }

  private buildMap(parent: HTMLElement) {
    const p = el('div', 'map-panel') as HTMLDivElement;
    p.hidden = true;
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Courtyard map');
    // World x -30..30, z -32..27 → SVG 0..300.
    const S = 300 / 62, X = (x: number) => ((x + 31) * S).toFixed(1), Z = (z: number) => ((z + 33) * S).toFixed(1);
    let svg = `<svg viewBox="0 0 300 300" role="img" aria-label="Map: Computer Lab back left, Music Studio back centre, Office back right, AI Workspace front right, fountain in the middle.">`;
    svg += `<rect x="0" y="0" width="300" height="300" rx="12" fill="#cfdcb7"/>`;
    for (const s of SEGMENTS) svg += `<line x1="${X(s.ax)}" y1="${Z(s.az)}" x2="${X(s.bx)}" y2="${Z(s.bz)}" stroke="#e6d8bd" stroke-width="${(s.w * S).toFixed(1)}" stroke-linecap="round"/>`;
    svg += `<circle cx="${X(0)}" cy="${Z(0)}" r="${((FOUNTAIN.ringOuter + FOUNTAIN.ringInner) / 2 * S).toFixed(1)}" fill="none" stroke="#e6d8bd" stroke-width="${((FOUNTAIN.ringOuter - FOUNTAIN.ringInner) * S).toFixed(1)}"/>`;
    svg += `<circle cx="${X(0)}" cy="${Z(0)}" r="${(FOUNTAIN.basinR * S).toFixed(1)}" fill="#8cc7dc" stroke="#c9b99b" stroke-width="2"/>`;
    for (const b of BUILDINGS) {
      const deg = (-b.yaw * 180) / Math.PI;
      const [lx, lz] = toWorld(b, 0, b.depth / 2 + 3.2);
      svg += `<g class="bld" data-id="${b.id}" tabindex="0" role="button" aria-label="Go to ${NAMES[b.id]}">
        <rect x="${(-b.width / 2) * S}" y="${(-b.depth / 2) * S}" width="${b.width * S}" height="${b.depth * S}" rx="3" fill="#e9dfcc" stroke="#6b5a42" stroke-width="1.2" transform="translate(${X(b.x)} ${Z(b.z)}) rotate(${deg})"/>
        <text x="${X(lx)}" y="${Z(lz)}" font-family="-apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#1d1a16" text-anchor="middle">${NAMES[b.id]}</text></g>`;
    }
    svg += `<path id="map-facing" d="M0 -9 L5 2 L-5 2 Z" fill="#2f4a37"/><circle id="map-dot" r="4.5" fill="#a595d3" stroke="#fff" stroke-width="2"/></svg>`;
    p.innerHTML = `<h2>The courtyard</h2>${svg}<p>Click a building to walk to its door.</p>`;
    this.dot = p.querySelector('#map-dot')!;
    this.facing = p.querySelector('#map-facing')!;
    p.querySelectorAll<SVGGElement>('.bld').forEach((g) => {
      const go = () => this.h.travel(g.dataset.id as BuildingId);
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    parent.append(p);
    return p;
  }

  updateMap(x: number, z: number, heading: number, outdoors: boolean) {
    if (this.mapPanel.hidden) return;
    const S = 300 / 62;
    const px = (x + 31) * S, pz = (z + 33) * S;
    this.dot.setAttribute('cx', px.toFixed(1));
    this.dot.setAttribute('cy', pz.toFixed(1));
    this.dot.style.opacity = outdoors ? '1' : '0';
    this.facing.setAttribute('transform', `translate(${px.toFixed(1)} ${pz.toFixed(1)}) rotate(${(180 - (heading * 180) / Math.PI).toFixed(0)}) translate(0 -6)`);
    this.facing.style.opacity = outdoors ? '1' : '0';
  }
}

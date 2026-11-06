// Top-right gear and the settings panel it opens (also Esc): map, sound, full screen, graphics
// quality, skip to links. Plus the courtyard map.
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
  quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  exitFull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
};

export interface HudHandlers {
  toggleMap(): void;
  toggleMute(): void;
  skip(): void;
  travel(id: BuildingId): void;
  /** Settings opened or closed: the game pauses walking while it is open. */
  paused(open: boolean): void;
}

export class Hud {
  root = el('div', 'hud');
  settings = el('div', 'settings') as HTMLDivElement;
  private gear: HTMLButtonElement;
  private mute: HTMLButtonElement;
  private full: HTMLButtonElement;
  mapPanel: HTMLDivElement;
  private dot!: SVGCircleElement;
  private facing!: SVGPathElement;

  constructor(parent: HTMLElement, private h: HudHandlers) {
    const btn = (into: HTMLElement, label: string, html: string, cls: string) => {
      const b = el('button', cls, html) as HTMLButtonElement;
      b.type = 'button';
      b.setAttribute('aria-label', label);
      into.append(b);
      return b;
    };
    this.gear = btn(this.root, 'Settings (Esc)', ICON.gear, 'hud-btn');
    this.gear.title = 'Settings (Esc)';
    this.gear.addEventListener('click', () => this.setSettings(true));

    this.settings.hidden = true;
    this.settings.innerHTML = '<div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title"><h2 id="settings-title">Settings</h2><div class="settings-list"></div><p class="settings-foot"><kbd>Esc</kbd> to close</p></div>';
    this.settings.addEventListener('click', (e) => { if (e.target === this.settings) this.setSettings(false); });
    const list = this.settings.querySelector('.settings-list') as HTMLElement;
    const row = (label: string, icon: string, value = '') => btn(list, label, `${icon}<span class="row-label">${label}</span><span class="row-value">${value}</span>`, 'settings-row');
    const map = row('Map of the courtyard', ICON.map, '<kbd>M</kbd>');
    map.addEventListener('click', () => { this.setSettings(false); h.toggleMap(); });
    this.mute = row('Sound', ICON.sound, 'On');
    this.mute.addEventListener('click', () => h.toggleMute());
    this.full = row('Full screen', ICON.full, 'Off');
    this.full.addEventListener('click', () => this.toggleFullscreen());
    if (!document.fullscreenEnabled) this.full.hidden = true;
    document.addEventListener('fullscreenchange', () => {
      const on = !!document.fullscreenElement;
      this.full.querySelector('svg')!.outerHTML = on ? ICON.exitFull : ICON.full;
      this.full.querySelector('.row-value')!.textContent = on ? 'On' : 'Off';
    });
    const tier = pickTier();
    const next = tier === 'high' ? 'medium' : 'high';
    const name = (t: string) => t[0].toUpperCase() + t.slice(1);
    const quality = row('Graphics quality', ICON.quality, name(tier));
    quality.setAttribute('aria-label', `Graphics quality: ${tier}. Switch to ${next} (reloads the page)`);
    quality.title = `Switch to ${next} (reloads the page)`;
    quality.addEventListener('click', () => switchTier(next));
    const skip = btn(list, 'Skip to links', 'Skip to links', 'settings-skip');
    skip.addEventListener('click', () => { this.setSettings(false); h.skip(); });
    parent.append(this.root, this.settings);
    this.mapPanel = this.buildMap(parent);
  }

  get settingsOpen() { return !this.settings.hidden; }

  setSettings(open: boolean) {
    if (open === this.settingsOpen) return;
    this.settings.hidden = !open;
    if (open) {
      this.mapPanel.hidden = true;
      this.settings.querySelector<HTMLButtonElement>('.settings-row')?.focus({ preventScroll: true });
    } else if (this.settings.contains(document.activeElement)) this.gear.focus({ preventScroll: true });
    this.h.paused(open);
  }

  private toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => { /* refused: stay windowed */ });
  }

  setMuted(m: boolean) {
    this.mute.querySelector('svg')!.outerHTML = m ? ICON.mute : ICON.sound;
    this.mute.querySelector('.row-value')!.textContent = m ? 'Off' : 'On';
    this.mute.setAttribute('aria-label', m ? 'Sound: off. Turn sound on' : 'Sound: on. Mute sound');
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

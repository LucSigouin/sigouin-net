// Two virtual thumbsticks: left walks (push to the edge to run), right looks. A short tap
// anywhere is passed on so doors and exhibits can be tapped.
import { el } from './overlays';
import type { Input } from '../core/input';

export class TouchSticks {
  private zones: HTMLDivElement[] = [];
  private sticks: HTMLDivElement[] = [];
  private active = false;

  constructor(parent: HTMLElement, private input: Input, private onTap: (x: number, y: number) => void) {
    for (const side of ['left', 'right'] as const) {
      const zone = el('div', `stick-zone ${side}`) as HTMLDivElement;
      const stick = el('div', 'stick idle', '<i></i>') as HTMLDivElement;
      zone.append(stick);
      this.place(stick, side, null);
      this.wire(zone, stick, side);
      parent.append(zone);
      this.zones.push(zone);
      this.sticks.push(stick);
    }
    this.setVisible(false);
  }

  setVisible(v: boolean) {
    this.active = v;
    for (const z of this.zones) z.hidden = !v;
  }
  get visible() { return this.active; }

  private place(stick: HTMLDivElement, side: 'left' | 'right', at: { x: number; y: number } | null) {
    if (at) {
      stick.style.left = `${at.x}px`;
      stick.style.top = `${at.y}px`;
    } else {
      stick.style.left = side === 'left' ? '96px' : 'calc(100% - 96px)';
      stick.style.top = 'calc(100% - 110px - env(safe-area-inset-bottom, 0px))';
    }
  }

  private wire(zone: HTMLDivElement, stick: HTMLDivElement, side: 'left' | 'right') {
    const knob = stick.querySelector('i') as HTMLElement;
    let id = -1, ox = 0, oy = 0, t0 = 0, travel = 0;
    const R = 50;
    zone.addEventListener('pointerdown', (e) => {
      if (id !== -1) return;
      id = e.pointerId;
      zone.setPointerCapture(id);
      const r = zone.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      t0 = performance.now();
      travel = 0;
      this.place(stick, side, { x: ox, y: oy });
      stick.classList.remove('idle');
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const r = zone.getBoundingClientRect();
      let dx = e.clientX - r.left - ox, dy = e.clientY - r.top - oy;
      travel = Math.max(travel, Math.hypot(dx, dy));
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / R, ny = dy / R;
      if (side === 'left') {
        this.input.stickMoveX = nx;
        this.input.stickMoveY = -ny;
        this.input.stickRun = len > R * 1.35 || Math.hypot(nx, ny) > 0.97;
      } else {
        this.input.stickLookX = nx;
        this.input.stickLookY = ny;
      }
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      knob.style.transform = '';
      stick.classList.add('idle');
      this.place(stick, side, null);
      if (side === 'left') { this.input.stickMoveX = this.input.stickMoveY = 0; this.input.stickRun = false; }
      else { this.input.stickLookX = this.input.stickLookY = 0; }
      if (travel < 10 && performance.now() - t0 < 350) this.onTap(e.clientX, e.clientY);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }
}

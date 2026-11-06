// Unifies keyboard, mouse, touch thumbsticks and gamepad into one small state object.
export class Input {
  /** Camera-relative move: x = right, y = forward, length 0..1. */
  moveX = 0;
  moveY = 0;
  run = false;
  lookX = 0;
  lookY = 0;
  zoom = 0;
  lastLookAt = -1e9;
  enabled = true;
  /** Thumbstick deflection, -1..1 (look is rate-based, scaled by dt in poll). */
  stickLookX = 0;
  stickLookY = 0;
  stickMoveX = 0;
  stickMoveY = 0;
  stickRun = false;

  private keys = new Set<string>();
  private dragging = -1;
  private lastX = 0;
  private lastY = 0;
  private pressed = new Set<string>();
  private padInteract = false;
  private padBack = false;
  onTap: ((x: number, y: number) => void) | null = null;
  private downAt = 0;
  private downX = 0;
  private downY = 0;
  private moved = 0;

  constructor(el: HTMLElement) {
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      // Space and Enter on a focused button or link belong to that control, not the game.
      if ((k === ' ' || k === 'enter') && e.target instanceof Element && e.target.closest('button, a[href], select, summary, [role="button"]')) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
      if (e.shiftKey) this.keys.add('shift');
    });
    addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'shift') this.keys.delete('shift');
      if (!e.shiftKey) this.keys.delete('shift');
    });
    addEventListener('blur', () => this.keys.clear());
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      this.dragging = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.downAt = performance.now();
      this.downX = e.clientX;
      this.downY = e.clientY;
      this.moved = 0;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.look(dx, dy);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.dragging) return;
      this.dragging = -1;
      if (this.moved < 6 && performance.now() - this.downAt < 400) this.onTap?.(this.downX, this.downY);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom += Math.sign(e.deltaY) * Math.min(1.5, Math.abs(e.deltaY) / 100);
    }, { passive: false });
  }

  look(dx: number, dy: number) {
    this.lookX += dx;
    this.lookY += dy;
    this.lastLookAt = performance.now();
  }

  /** True once per key press. */
  consume(key: string) {
    const had = this.pressed.has(key);
    this.pressed.delete(key);
    return had;
  }
  clearPresses() { this.pressed.clear(); }

  poll(dt = 1 / 60) {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has('w') || k.has('arrowup')) y += 1;
    if (k.has('s') || k.has('arrowdown')) y -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    let run = k.has('shift');
    x += this.stickMoveX;
    y += this.stickMoveY;
    run ||= this.stickRun;
    // Gamepad: left stick moves, right stick looks, A interacts, B backs out.
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const dz = (v: number) => (Math.abs(v) < 0.15 ? 0 : v);
      const lx = dz(pad.axes[0] ?? 0), ly = dz(pad.axes[1] ?? 0);
      x += lx;
      y -= ly;
      if (Math.hypot(lx, ly) > 0.92 || pad.buttons[10]?.pressed || pad.buttons[7]?.pressed) run = true;
      const rx = dz(pad.axes[2] ?? 0), ry = dz(pad.axes[3] ?? 0);
      if (rx || ry) this.look(rx * 820 * dt, ry * 520 * dt);
      const a = !!pad.buttons[0]?.pressed, b = !!pad.buttons[1]?.pressed;
      if (a && !this.padInteract) this.pressed.add('e');
      if (b && !this.padBack) this.pressed.add('escape');
      this.padInteract = a;
      this.padBack = b;
      break;
    }
    if (this.stickLookX || this.stickLookY) this.look(this.stickLookX * 560 * dt, this.stickLookY * 320 * dt);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    if (!this.enabled) { x = 0; y = 0; run = false; }
    this.moveX = x;
    this.moveY = y;
    this.run = run;
  }

  takeLook() {
    const r = [this.lookX, this.lookY, this.zoom] as const;
    this.lookX = this.lookY = this.zoom = 0;
    return r;
  }
}

// Prompt, project card, hints and the fade used for door transitions.
import type { Entry } from '../content/types';

export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export class Prompt {
  root = el('button', 'prompt');
  private text = el('span');
  private key = el('span', 'key', 'E');
  current = '';
  onClick: (() => void) | null = null;
  constructor(parent: HTMLElement, touch: boolean) {
    this.root.type = 'button';
    this.root.append(this.key, this.text);
    this.root.hidden = true;
    if (touch) this.root.classList.add('touch');
    this.root.addEventListener('click', (e) => { e.stopPropagation(); this.onClick?.(); });
    parent.append(this.root);
  }
  setTouch(t: boolean) { this.root.classList.toggle('touch', t); }
  show(label: string, x: number, y: number, key = 'E') {
    if (label !== this.current) {
      this.current = label;
      this.key.textContent = key;
      this.text.textContent = this.root.classList.contains('touch') ? `Tap: ${label}` : label;
      this.root.setAttribute('aria-label', `${label} (press ${key})`);
    }
    this.root.hidden = false;
    const w = this.root.offsetWidth / 2 + 10;
    const cx = Math.min(innerWidth - w, Math.max(w, x));
    const cy = Math.min(innerHeight - 20, Math.max(70, y));
    this.root.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`;
  }
  hide() {
    if (!this.root.hidden) this.root.hidden = true;
    this.current = '';
  }
}

export class Card {
  root = el('div', 'card-backdrop');
  private card = el('div', 'card');
  isOpen = false;
  onClose: (() => void) | null = null;
  private lastFocus: Element | null = null;
  constructor(parent: HTMLElement) {
    this.root.hidden = true;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'card-title');
    this.root.append(this.card);
    this.root.addEventListener('pointerdown', (e) => { if (e.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = [...this.card.querySelectorAll<HTMLElement>('a[href], button')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    parent.append(this.root);
  }
  open(building: string, entry: Entry) {
    this.lastFocus = document.activeElement;
    const media = entry.image
      ? `<img src="${esc(entry.image.startsWith('/') ? import.meta.env.BASE_URL + entry.image.slice(1) : entry.image)}" alt="Screenshot of ${esc(entry.title)}" loading="lazy">`
      : `<div class="ph"><div><b>${esc(entry.title)}</b>Screenshot coming soon</div></div>`;
    const cta = entry.url
      ? `<a class="btn btn-primary" href="${esc(entry.url)}" target="_blank" rel="noopener">Open project <span aria-hidden="true">↗</span></a>`
      : `<span class="btn btn-soon">Link coming soon</span>`;
    this.card.innerHTML = `
      <button class="card-close" type="button" aria-label="Close">×</button>
      <div class="card-media">${media}</div>
      <div class="card-body">
        <p class="card-kicker">${esc(building)}</p>
        <h2 id="card-title">${esc(entry.title)}</h2>
        <p class="blurb">${esc(entry.blurb)}</p>
        <div class="card-actions">${cta}<button class="btn btn-quiet" type="button" data-close>Back to the room</button></div>
      </div>`;
    this.card.querySelectorAll('.card-close, [data-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    this.root.hidden = false;
    this.isOpen = true;
    (this.card.querySelector('a.btn-primary') as HTMLElement ?? this.card.querySelector('.card-close') as HTMLElement).focus({ preventScroll: true });
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.hidden = true;
    (this.lastFocus as HTMLElement | null)?.focus?.({ preventScroll: true });
    this.onClose?.();
  }
}

export class Hints {
  root = el('div', 'hints is-out');
  constructor(parent: HTMLElement) { parent.append(this.root); this.root.setAttribute('role', 'status'); }
  show(touch: boolean, seconds = 3) {
    this.root.innerHTML = touch
      ? 'Left thumb to walk · right thumb to look · tap a door to enter'
      : '<kbd>WASD</kbd> / arrows to walk · drag to look · <kbd>E</kbd> to enter · <kbd>Esc</kbd> settings';
    requestAnimationFrame(() => this.root.classList.remove('is-out'));
    setTimeout(() => this.root.classList.add('is-out'), seconds * 1000);
  }
}

/** Full-screen CRT loading screen shown after diving into a lab computer, held until the page unloads. */
export class Boot {
  root = el('div', 'crt');
  constructor(parent: HTMLElement) {
    this.root.hidden = true;
    this.root.setAttribute('role', 'status');
    parent.append(this.root);
  }
  /** Flash (0..1) is the white-out as the camera hits the glass; the screen itself comes in at show(). */
  flash(k: number) { this.root.hidden = k <= 0 && !this.root.classList.contains('is-on'); this.root.style.setProperty('--flash', k.toFixed(3)); }
  show(entry: Entry) {
    const host = entry.url ? new URL(entry.url).host : '';
    this.root.innerHTML = `
      <div class="crt-screen">
        <p class="crt-kicker">Computer Lab · connecting</p>
        <h2>${esc(entry.title)}</h2>
        ${entry.tag ? `<p class="crt-tag">${esc(entry.tag)}</p>` : ''}
        <div class="crt-bar" aria-hidden="true"><i></i></div>
        <p class="crt-host">&gt; ${esc(host)}<span class="crt-cursor">_</span></p>
      </div>`;
    this.root.setAttribute('aria-label', `Loading ${entry.title}`);
    this.root.hidden = false;
    this.root.classList.add('is-on');
  }
  hide() { this.root.classList.remove('is-on'); this.root.style.setProperty('--flash', '0'); this.root.hidden = true; }
}

export class Fade {
  root = document.createElement('div');
  constructor() {
    this.root.id = 'fade';
    document.body.append(this.root);
  }
  to(on: boolean, ms = 350) {
    this.root.style.transitionDuration = `${ms}ms`;
    this.root.classList.toggle('is-on', on);
    return new Promise<void>((r) => setTimeout(r, ms + 20));
  }
}

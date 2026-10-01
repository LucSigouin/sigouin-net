// The plain-HTML version of the hub. It is always in the DOM (visually hidden) for search
// engines and screen readers, and becomes the whole page for "Skip to links" or no WebGL 2.
export interface LinksShow { canReturn: boolean; onBack?: () => void; note?: string }

export class Links {
  root = document.getElementById('links') as HTMLElement;
  private back = document.getElementById('links-back') as HTMLButtonElement | null;
  private onBack: (() => void) | null = null;
  private keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape' && this.onBack) this.onBack(); };

  constructor() {
    this.back?.addEventListener('click', () => this.onBack?.());
  }

  show(o: LinksShow) {
    this.onBack = o.canReturn ? o.onBack ?? null : null;
    if (this.back) this.back.hidden = !o.canReturn;
    this.root.querySelector('.links-note')?.remove();
    if (o.note) {
      const p = document.createElement('p');
      p.className = 'links-note';
      p.textContent = o.note;
      this.root.prepend(p);
    }
    this.root.classList.remove('is-hidden');
    this.root.classList.add('is-open');
    this.root.scrollTop = 0;
    addEventListener('keydown', this.keyHandler);
    (this.root.querySelector('h1') as HTMLElement | null)?.setAttribute('tabindex', '-1');
    (this.root.querySelector('h1') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  hide() {
    this.root.classList.add('is-hidden');
    this.root.classList.remove('is-open');
    removeEventListener('keydown', this.keyHandler);
  }
}

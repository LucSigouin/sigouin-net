// Boot: the courtyard inks itself in as real loading work lands (paths, then one building per
// stretch), each building lighting its windows when drawn. A minimum hold keeps it readable on
// fast connections, then a soft white flash dissolves into the courtyard.
const STEPS = ['Laying the paths', 'Raising the Computer Lab', 'Tuning the Music Studio', 'Opening the Office', 'Powering the AI Workspace'];
const ENDS = [0.1, 0.325, 0.55, 0.775, 1]; // progress at which each step's drawing is complete

export class Boot {
  private root = document.getElementById('boot') as HTMLElement;
  private yard = this.root.querySelector('.boot-yard') as SVGSVGElement;
  private ink = [...this.root.querySelectorAll<SVGUseElement>('.yard-ink use')];
  private glow = [...this.root.querySelectorAll<SVGPathElement>('.yard-glow path')];
  private step = this.root.querySelector('.boot-step') as HTMLElement;
  private pct = this.root.querySelector('.boot-pct') as HTMLElement;
  private flash = document.getElementById('flash') as HTMLElement;
  private start = performance.now();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private shown = 0; // drawn progress; trails max so buildings ink in one by one on fast loads
  private raf = 0;
  private drawn: (() => void) | null = null;
  max = 0;
  onProgress: ((p: number) => void) | null = null;

  setProgress(p: number) {
    const v = Math.max(this.max, Math.min(1, p));
    if (v === this.max) return;
    this.max = v;
    this.yard.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    this.onProgress?.(v);
    if (!this.raf) {
      let last = performance.now();
      const tick = (now: number) => {
        // 0.7 per second: a full courtyard takes ~1.4 s, inside the 1.8 s minimum hold.
        this.shown = this.reduced ? this.max : Math.min(this.max, this.shown + ((now - last) / 1000) * 0.7);
        last = now;
        this.draw(this.shown);
        this.raf = this.shown < this.max ? requestAnimationFrame(tick) : 0;
        if (this.shown === 1) this.drawn?.();
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  private draw(v: number) {
    let current = STEPS.length - 1;
    ENDS.forEach((end, i) => {
      const begin = i ? ENDS[i - 1] : 0;
      const local = Math.min(1, Math.max(0, (v - begin) / (end - begin)));
      this.ink[i].style.strokeDashoffset = (1 - local).toFixed(4);
      if (local === 1) this.glow.find((g) => g.dataset.step === String(i))?.classList.add('is-lit');
      if (local < 1 && current === STEPS.length - 1) current = i;
    });
    this.step.textContent = v === 1 ? 'Welcome in' : STEPS[current];
    this.pct.textContent = `${Math.round(v * 100)}%`;
  }

  /** Resolves once the flash has peaked (world fully covered), then fades the flash out. */
  async finish(minMs: number, onPeak: () => void) {
    this.setProgress(1);
    const left = minMs - (performance.now() - this.start);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    // Let the last building finish inking and start to glow before the flash.
    if (this.shown < 1) await new Promise<void>((r) => { this.drawn = r; });
    await new Promise((r) => setTimeout(r, minMs > 0 ? 650 : 0));
    const quick = minMs === 0;
    await this.flash.animate([{ opacity: 0 }, { opacity: 0.88 }], { duration: quick ? 80 : 220, easing: 'ease-in', fill: 'forwards' }).finished;
    this.root.hidden = true;
    onPeak();
    await this.flash.animate([{ opacity: 0.88 }, { opacity: 0 }], { duration: quick ? 200 : 1100, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'forwards' }).finished;
  }

  abort() {
    this.root.hidden = true;
  }
}

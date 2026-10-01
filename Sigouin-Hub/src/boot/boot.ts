// macOS-style boot: the bar tracks real loading work; a minimum hold keeps the animation
// readable on fast connections, then a soft white flash dissolves into the courtyard.
export class Boot {
  private root = document.getElementById('boot') as HTMLElement;
  private bar = this.root.querySelector('.boot-bar') as HTMLElement;
  private fill = this.root.querySelector('.boot-fill') as HTMLElement;
  private flash = document.getElementById('flash') as HTMLElement;
  private start = performance.now();
  max = 0;
  onProgress: ((p: number) => void) | null = null;

  setProgress(p: number) {
    const v = Math.max(this.max, Math.min(1, p));
    if (v === this.max) return;
    this.max = v;
    this.fill.style.transform = `scaleX(${v.toFixed(4)})`;
    this.bar.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    this.onProgress?.(v);
  }

  /** Resolves once the flash has peaked (world fully covered), then fades the flash out. */
  async finish(minMs: number, onPeak: () => void) {
    this.setProgress(1);
    const left = minMs - (performance.now() - this.start);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    // Let the bar's own transition reach the end before the flash.
    await new Promise((r) => setTimeout(r, minMs > 0 ? 480 : 0));
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

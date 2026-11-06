// Ambient sound, synthesised with WebAudio: the fountain (positional), birdsong, room tone and
// the boot chime. Every visit starts muted; the HUD button turns sound on.
import type * as THREE from 'three';

export class Ambience {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private outdoor!: GainNode;
  private indoor!: GainNode;
  private panner!: PannerNode;
  private nextBird = 0;
  muted = true;
  isIndoor = false;
  onChange: (() => void) | null = null;

  /** Call from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(ctx.destination);
    this.outdoor = ctx.createGain();
    this.outdoor.gain.value = this.isIndoor ? 0 : 1;
    this.outdoor.connect(this.master);
    this.indoor = ctx.createGain();
    this.indoor.gain.value = this.isIndoor ? 1 : 0;
    this.indoor.connect(this.master);

    const noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029591;
      b1 = 0.985 * b1 + w * 0.032534;
      b2 = 0.95 * b2 + w * 0.048056;
      data[i] = (b0 + b1 + b2 + w * 0.1) * 0.6;
    }
    const src = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, Math.random() * 2);
      return s;
    };
    // Fountain: band-passed noise at the basin, plus a brighter splash layer.
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'equalpower';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 4;
    this.panner.rolloffFactor = 1.1;
    this.panner.positionX.value = 0;
    this.panner.positionY.value = 1;
    this.panner.positionZ.value = 0;
    this.panner.connect(this.outdoor);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    const fg = ctx.createGain();
    fg.gain.value = 0.5;
    src(noise).connect(bp).connect(fg).connect(this.panner);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2600;
    const sg = ctx.createGain();
    sg.gain.value = 0.16;
    src(noise).connect(hp).connect(sg).connect(this.panner);
    // Room tone indoors.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 260;
    const rg = ctx.createGain();
    rg.gain.value = 0.22;
    src(noise).connect(lp).connect(rg).connect(this.indoor);
    this.nextBird = ctx.currentTime + 2;
  }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.1);
    this.onChange?.();
  }

  setIndoor(v: boolean) {
    this.isIndoor = v;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.outdoor.gain.setTargetAtTime(v ? 0 : 1, t, 0.3);
    this.indoor.gain.setTargetAtTime(v ? 1 : 0, t, 0.3);
  }

  chime() {
    if (!this.running || this.muted) return;
    const ctx = this.ctx!, t = ctx.currentTime + 0.02;
    for (const [f, g, d] of [[1046.5, 0.12, 2.4], [1568, 0.07, 2.0], [2637, 0.03, 1.4]]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(g, t + 0.015);
      e.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(e).connect(this.master);
      o.start(t);
      o.stop(t + d + 0.1);
    }
  }

  private bird(daylight: number) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + 0.05;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.outdoor);
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2600 + Math.random() * 1600;
    for (let i = 0; i < notes; i++) {
      const t = t0 + i * (0.09 + Math.random() * 0.06);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), t);
      o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035 * daylight, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(pan);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  update(camera: THREE.Camera, daylight: number) {
    if (!this.running) return;
    const ctx = this.ctx!, L = ctx.listener;
    const p = camera.position;
    const fwd = [0, 0, -1];
    const e = camera.matrixWorld.elements;
    fwd[0] = -e[8]; fwd[1] = -e[9]; fwd[2] = -e[10];
    if (L.positionX) {
      L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z;
      L.forwardX.value = fwd[0]; L.forwardY.value = fwd[1]; L.forwardZ.value = fwd[2];
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    }
    if (!this.isIndoor && daylight > 0.3 && ctx.currentTime > this.nextBird) {
      this.bird(daylight);
      this.nextBird = ctx.currentTime + 2.5 + Math.random() * 6;
    }
  }
}

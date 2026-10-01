// Frame-rate and GPU-cost measurement for a Playwright page. Dependency-free.
// Never calls __hub.debug() (full GPU readback) inside a timing window.

const stats = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null;
  return { median: q(0.5), min: s[0] ?? null, max: s[s.length - 1] ?? null, p95: q(0.95) };
};

/**
 * rAF frame rate. Waits `warmup` seconds, then counts frames for `seconds` seconds.
 * @param {import('@playwright/test').Page} page
 * @returns {{ samples: number[], median, min, max, frameMs: { median, p95, max } }}
 *   samples = frames counted in each 1 s bucket; frameMs = rAF-to-rAF interval.
 */
export async function measureFps(page, { seconds = 10, warmup = 3 } = {}) {
  const r = await page.evaluate(({ seconds, warmup }) => new Promise((done) => {
    const samples = [], gaps = [];
    let start = null, last = null, count = 0, bucket = 0;
    const t0 = performance.now() + warmup * 1000;
    const f = (now) => {
      if (now < t0) return requestAnimationFrame(f);
      if (start === null) { start = last = now; return requestAnimationFrame(f); }
      gaps.push(now - last); last = now;
      const b = Math.floor((now - start) / 1000);
      if (b > bucket) { samples.push(count); count = 0; bucket = b; }
      count++;
      if (samples.length >= seconds) return done({ samples, gaps });
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }), { seconds, warmup });
  const s = stats(r.samples), g = stats(r.gaps);
  return { samples: r.samples, median: s.median, min: s.min, max: s.max,
    frameMs: { median: +g.median.toFixed(2), p95: +g.p95.toFixed(2), max: +g.max.toFixed(2) } };
}

/**
 * Cost of one frame with no rAF pacing. Captures the page's own rAF callbacks, then runs
 * them back to back `frames` times, forcing a CPU/GPU sync after each one with a 1x1
 * gl.readPixels on `canvas`. So ms/frame = JS + GPU for one frame, done serially (an upper
 * bound; real frames overlap CPU and GPU). batchMsPerFrame runs the same frames with one sync at
 * the end: GPU throughput per frame, the basis of fpsCeiling. If EXT_disjoint_timer_query_webgl2 exists, the
 * GPU-only time per frame is measured as well.
 * @param {import('@playwright/test').Page} page
 * @returns {{ method, frames, msPerFrame: { median, p95, min }, batchMsPerFrame, cpuMs: { median }, gpuTimerMs: { median } | null, fpsCeiling }}
 */
export async function measureGpu(page, { frames = 120, discard = 10, canvas = '#world' } = {}) {
  return page.evaluate(async ({ frames, discard, canvas }) => {
    const gl = document.querySelector(canvas)?.getContext('webgl2');
    if (!gl) throw new Error('measureGpu: no webgl2 context on ' + canvas);
    const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const orig = window.requestAnimationFrame;
    let pending = [];
    window.requestAnimationFrame = (cb) => { pending.push(cb); return 0; };
    // Let one real frame run so the page's loop re-registers into `pending`.
    await new Promise((r) => orig(() => orig(r)));
    const px = new Uint8Array(4), total = [], cpu = [], queries = [];
    try {
      for (let i = 0; i < frames + discard; i++) {
        const cbs = pending; pending = [];
        const q = tq && gl.createQuery();
        if (q) gl.beginQuery(tq.TIME_ELAPSED_EXT, q);
        const a = performance.now();
        for (const cb of cbs) cb(a);
        const b = performance.now();
        if (q) gl.endQuery(tq.TIME_ELAPSED_EXT);
        // Read the on-screen buffer, then put back whatever framebuffer three had bound.
        const fb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
        const c = performance.now();
        if (i >= discard) { total.push(c - a); cpu.push(b - a); if (q) queries.push(q); }
        else if (q) gl.deleteQuery(q);
      }
      // Batch: same frames back to back, one sync at the end. GPU throughput per frame.
      const a = performance.now();
      for (let i = 0; i < frames; i++) { const cbs = pending; pending = []; for (const cb of cbs) cb(performance.now()); }
      const fb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
      var batchMs = +((performance.now() - a) / frames).toFixed(2);
    } finally {
      window.requestAnimationFrame = orig;
      for (const cb of pending) orig(cb);
    }
    let gpuTimer = null;
    if (queries.length) {
      await new Promise((r) => setTimeout(r, 100));
      const disjoint = gl.getParameter(tq.GPU_DISJOINT_EXT);
      const ms = queries.filter((q) => gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE))
        .map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      queries.forEach((q) => gl.deleteQuery(q));
      if (!disjoint && ms.length) gpuTimer = ms;
    }
    const st = (a) => { const s = [...a].sort((x, y) => x - y); const q = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); return { median: q(0.5), p95: q(0.95), min: q(0) }; };
    const t = st(total);
    return {
      method: gpuTimer ? 'sync-readPixels + EXT_disjoint_timer_query_webgl2' : 'sync-readPixels (no timer query extension)',
      frames, msPerFrame: t, batchMsPerFrame: batchMs, cpuMs: { median: st(cpu).median },
      gpuTimerMs: gpuTimer ? { median: st(gpuTimer).median } : null,
      fpsCeiling: +(1000 / batchMs).toFixed(1),
    };
  }, { frames, discard, canvas });
}

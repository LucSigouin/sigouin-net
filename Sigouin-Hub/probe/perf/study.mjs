// FPS study: runs every condition N times (round robin), writes raw JSON per condition
// to probe/shots/perf-study/<condition>.json and a summary.json.
// Usage: node probe/perf/study.mjs [--runs 3] [--only a,b] [--timeline 25]
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, rmdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { measureFps, measureGpu } from './measure.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + 'shots/perf-study/';
const LOCK = ROOT + '.gpu-lock';
const URL_ = 'https://sigouin.net/hub/';
const GPU_ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const RUNS = +arg('runs', 3), TIMELINE = +arg('timeline', 25), ONLY = arg('only', '');

const C = (name, o) => ({ name, engine: 'shell', w: 1440, h: 900, dsf: 1, quality: 'medium', args: [], ...o });
const CONDITIONS = [
  C('shell-1440-med'),
  C('shell-1280-med', { w: 1280, h: 720 }),
  C('shell-1280-med-dpr2', { w: 1280, h: 720, dsf: 2 }),
  C('shell-1440-low', { quality: 'low' }),
  C('shell-1440-high', { quality: 'high' }),
  C('shell-1440-med-novsync', { args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] }),
  C('chromium-1440-med', { engine: 'chromium' }),
  C('webkit-1440-med', { engine: 'webkit' }),
  C('shell-1440-med-shared', { shared: true }),
].filter((c) => !ONLY || ONLY.split(',').includes(c.name));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Whole-Mac GPU busy %, from the IOAccelerator driver stats (includes WindowServer, CNVS, us).
const gpuUtil = () => { try { return +execFileSync('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator']).toString().match(/"Device Utilization %"=(\d+)/)[1]; } catch { return null; } };
const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

async function takeLock() {
  for (let t = 0; t < 60; t++) {
    try { mkdirSync(LOCK); return; } catch { if (t === 0) console.log('  gpu lock held, waiting'); await sleep(10000); }
  }
  throw new Error('gpu lock still held after 10 minutes, giving up');
}
const dropLock = () => { try { rmdirSync(LOCK); } catch {} };
process.on('SIGINT', () => { dropLock(); process.exit(130); });

async function launch(c) {
  if (c.engine === 'webkit') return webkit.launch();
  return chromium.launch({ args: [...GPU_ARGS, ...c.args], ...(c.engine === 'chromium' ? { channel: 'chromium' } : {}) });
}

async function openHub(browser, c) {
  const page = await browser.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dsf });
  const t0 = Date.now();
  await page.goto(`${URL_}?quality=${c.quality}`);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 120000 });
  const readyMs = Date.now() - t0;
  await page.evaluate(() => window.__hub.pauseDay(0.35));
  return { page, readyMs };
}

async function runOnce(c, run) {
  const rec = { condition: c.name, run, at: new Date().toISOString(), config: c };
  await takeLock();
  let browser, load;
  try {
    rec.gpuUtilIdle = [gpuUtil(), (await sleep(500), gpuUtil()), (await sleep(500), gpuUtil())];
    browser = await launch(c);
    rec.browserVersion = browser.version();
    if (c.shared) { load = await launch(c); await openHub(load, c); } // second hub rendering at the same time
    const { page, readyMs } = await openHub(browser, c);
    rec.readyMs = readyMs;
    rec.env = await page.evaluate(() => {
      const g = document.createElement('canvas').getContext('webgl2');
      const e = g?.getExtension('WEBGL_debug_renderer_info');
      const w = document.querySelector('#world');
      return { renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g?.getParameter(g.RENDERER), dpr: devicePixelRatio,
        buffer: [w.width, w.height], tier: window.__hub.tier(), timerQuery: !!g?.getExtension('EXT_disjoint_timer_query_webgl2') };
    });
    // Timeline from the moment of 'play': per-second fps, GPU util sampled alongside.
    const util = []; let sampling = true;
    (async () => { while (sampling) { util.push(gpuUtil()); await sleep(1000); } })();
    rec.timeline = await measureFps(page, { seconds: TIMELINE, warmup: 0 });
    sampling = false;
    rec.gpuUtilDuring = util;
    rec.gpu = await measureGpu(page, { frames: 120 });
    rec.fpsAfter = await measureFps(page, { seconds: 8, warmup: 1 });
    // Pacing control: an empty page in the same browser, nothing to draw.
    await page.setContent('<body></body>');
    rec.blank = await measureFps(page, { seconds: 5, warmup: 1 });
  } catch (e) {
    rec.error = String(e?.message || e);
  } finally {
    await browser?.close().catch(() => {});
    await load?.close().catch(() => {});
    dropLock();
  }
  return rec;
}

mkdirSync(OUT, { recursive: true });
const load = (n) => existsSync(OUT + n + '.json') ? JSON.parse(readFileSync(OUT + n + '.json', 'utf8')) : [];
const fresh = new Set();
for (let run = 1; run <= RUNS; run++) {
  for (const c of CONDITIONS) {
    const rec = await runOnce(c, run);
    // First write for a condition in this invocation replaces the old file.
    const all = fresh.has(c.name) ? load(c.name) : []; fresh.add(c.name);
    all.push(rec); writeFileSync(OUT + c.name + '.json', JSON.stringify(all, null, 1));
    const tl = rec.timeline?.samples ?? [];
    console.log(`${c.name} #${run}`, rec.error ? 'ERROR ' + rec.error :
      `ready ${rec.readyMs}ms first5 [${tl.slice(0, 5)}] last10 median ${median(tl.slice(-10))} | gpu sync ${rec.gpu.msPerFrame.median}ms batch ${rec.gpu.batchMsPerFrame}ms (cpu ${rec.gpu.cpuMs.median}, timer ${rec.gpu.gpuTimerMs?.median ?? '-'}) | after ${rec.fpsAfter.median} | blank ${rec.blank.median} | util idle ${rec.gpuUtilIdle} during ${median(rec.gpuUtilDuring)}`);
  }
}

// Summary across every condition file on disk.
const summary = {};
for (const f of readdirSync(OUT).filter((f) => f.endsWith('.json') && f !== 'summary.json')) {
  const recs = JSON.parse(readFileSync(OUT + f, 'utf8')).filter((r) => !r.error);
  const steady = recs.map((r) => median(r.timeline.samples.slice(-10)));
  const vals = (fn) => { const v = recs.map(fn); return { median: median(v), min: Math.min(...v), max: Math.max(...v), all: v }; };
  summary[f.replace('.json', '')] = {
    runs: recs.length, errors: JSON.parse(readFileSync(OUT + f, 'utf8')).length - recs.length,
    renderer: recs[0]?.env.renderer, buffer: recs[0]?.env.buffer, dpr: recs[0]?.env.dpr, timerQuery: recs[0]?.env.timerQuery,
    firstSecondFps: vals((r) => r.timeline.samples[0]),
    first5sFps: vals((r) => median(r.timeline.samples.slice(0, 5))),
    steadyFps: { median: median(steady), min: Math.min(...steady), max: Math.max(...steady), all: steady },
    afterFps: vals((r) => r.fpsAfter.median),
    frameMsP95: vals((r) => r.timeline.frameMs.p95),
    gpuMsPerFrame: vals((r) => r.gpu.msPerFrame.median),
    gpuBatchMs: vals((r) => r.gpu.batchMsPerFrame),
    gpuCpuMs: vals((r) => r.gpu.cpuMs.median),
    gpuTimerMs: recs.some((r) => r.gpu.gpuTimerMs) ? vals((r) => r.gpu.gpuTimerMs?.median ?? null) : null,
    fpsCeiling: vals((r) => r.gpu.fpsCeiling),
    blankFps: vals((r) => r.blank.median),
    gpuUtilIdle: vals((r) => median(r.gpuUtilIdle)),
    gpuUtilDuring: vals((r) => median(r.gpuUtilDuring)),
  };
}
writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1));
console.log('summary ->', OUT + 'summary.json');

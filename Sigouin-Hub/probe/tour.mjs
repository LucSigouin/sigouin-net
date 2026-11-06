// Full probe tour: every viewpoint x layer, orbits, per-part GPU cost, a repeat load to prove
// frozen shots are pixel-identical, the scripted play through all four buildings and out of
// the garden, and a perf pass. Desktop (1440x900) and phone (Pixel 7).
//
//   node probe/tour.mjs                 full tour, both devices
//   node probe/tour.mjs --quick         desktop only, fewer views, one building
//   node probe/tour.mjs --no-build      reuse probe/.dist
//   node probe/tour.mjs --devices phone
//   node probe/tour.mjs --move fountain-stone=0.5,0,0   mutant: shift one object before the shots
//
// Output: probe/shots/<run-id>/ with PNGs, manifest-*.json, perf.json, steps.json, run.json, contact.html.
import fs from 'node:fs';
import path from 'node:path';
import { PROBE, build, serve, launch, openHub, savePng, withGpuLock, decodePng, pngBytes, diffPixels, encodePng, gpuBusy } from './lib.mjs';
import { measureFps, measureGpu } from './perf/measure.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const quick = flag('quick');
const deviceList = opt('devices', quick ? 'desktop' : 'desktop,phone').split(',');
const move = opt('move', null);
const now = new Date(), two = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
const runId = opt('id', stamp + (quick ? '-quick' : '') + (move ? '-mutant' : ''));
const OUT = path.join(PROBE, 'shots', runId);
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...a);

const LAYERS = ['beauty', 'id', 'depth', 'normals', 'wireframe', 'walkable', 'triggers'];
const BUILDINGS = ['computer-lab', 'music-studio', 'office', 'ai-workspace'];
const rel = (f) => path.relative(OUT, f);
const writeJson = (name, v) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(v, null, 2));
const shotsIndex = [];

function save(dataUrl, file, meta) {
  savePng(dataUrl, file);
  shotsIndex.push({ file: rel(file), ...meta });
}

async function applyMove(page) {
  if (!move) return null;
  const [name, d] = move.split('=');
  const delta = d.split(',').map(Number);
  return page.evaluate(([name, delta]) => {
    let n = 0;
    window.__probe.app.level.scene.traverse((o) => { if (o.name === name) { o.position.x += delta[0]; o.position.y += delta[1]; o.position.z += delta[2]; n++; } });
    return { name, delta, moved: n };
  }, [name, delta]);
}

function playSteps(device) {
  const steps = [];
  for (const b of quick ? ['music-studio'] : BUILDINGS) {
    steps.push(
      { walkTo: b }, { shot: `${b}-at-door` }, { press: 'KeyE' }, { expect: { level: b, state: 'play' }, timeout: 20000 },
      { shot: `${b}-inside` },
      ...(quick || device !== 'desktop' ? ['beauty', 'id'] : LAYERS).map((layer) => ({ shot: `${b}-overview-${layer}`, view: 'overview', layer })),
      { walkTo: `${b}:0` }, { press: 'KeyE' }, { expect: { cardOpen: true } }, { page: `${b}-card` },
      { press: 'Escape' }, { expect: { cardOpen: false } },
      { walkTo: `${b}:exit` }, { press: 'KeyE' }, { expect: { level: 'courtyard', state: 'play' }, timeout: 20000 },
    );
  }
  steps.push({ shot: 'back-in-courtyard' }, { leave: true });
  return steps;
}

async function tourDevice(browser, url, device) {
  const D = path.join(OUT, device), res = { device };
  // ---- load 1: frozen views x layers, manifest, cost, orbits ----
  const a = await openHub(browser, url, device);
  const page = a.page;
  res.bootMs = a.bootMs;
  res.info = await page.evaluate(() => window.__probe.info());
  res.moved = await applyMove(page);
  log(device, 'ready', `${a.bootMs} ms`, res.info.gpu, res.info.size.join('x'), 'tier', res.info.tier);
  const tex1 = await page.evaluate(() => window.__probe.textures());
  const manifest = await page.evaluate(() => window.__probe.manifest());
  writeJson(`manifest-${device}.json`, manifest);
  res.manifest = { counts: manifest.counts, totals: manifest.totals, rendererInfo: manifest.rendererInfo, parts: manifest.parts.length };
  res.grid = await page.evaluate(() => window.__probe.grid());
  const views = Object.keys(await page.evaluate(() => window.__probe.views()));
  const useViews = quick ? ['spawn', 'fountain', 'aerial'] : views;
  const legends = {};
  for (const view of useViews) for (const layer of LAYERS) {
    const s = await page.evaluate(([view, layer]) => window.__probe.shot({ view, layer }), [view, layer]);
    save(s.png, path.join(D, 'views', view, `${layer}.png`), { device, section: 'views', view, layer, ms: s.ms });
    if (s.legend) legends[`${view}/${layer}`] = s.legend;
  }
  writeJson(`legends-${device}.json`, legends);
  log(device, `${useViews.length} views x ${LAYERS.length} layers`);
  // Per-part GPU cost from the player's view, and from above (desktop) to tell pixel cost from fixed cost.
  res.costs = {};
  for (const view of quick || device !== 'desktop' ? ['spawn'] : ['spawn', 'aerial']) {
    const c = await page.evaluate((view) => window.__probe.cost({ view }), view);
    res.costs[view] = c;
    const s = await page.evaluate((view) => window.__probe.shot({ view, layer: 'cost' }), view);
    save(s.png, path.join(D, 'cost', `${view}.png`), { device, section: 'cost', view, layer: 'cost' });
    log(device, `cost from ${view}:`, c.method.split(' ')[0], `base ${c.baseMs} ms, sum of parts ${c.sumOfParts}`, 'top', c.parts.slice(0, 3).map((p) => `${p.key} ${p.ms}`).join(', '));
  }
  res.cost = res.costs.spawn;
  res.orbits = [];
  for (const target of quick ? ['fountain-stone'] : ['fountain-stone', 'music-studio']) {
    const o = await page.evaluate((t) => window.__probe.orbit(t, { angles: 8, heights: ['low', 'eye', 'high'] }), target);
    for (const s of o.shots) save(s.png, path.join(D, 'orbits', target, `${s.height}-${String(s.angle).padStart(3, '0')}.png`), { device, section: 'orbits', target, height: s.height, angle: s.angle });
    res.orbits.push({ target, center: o.center, radius: o.radius, dist: o.dist, shots: o.shots.length });
  }
  log(device, 'orbits', res.orbits.map((o) => `${o.target} x${o.shots}`).join(', '));
  res.errors = [...a.errors];
  await a.ctx.close();

  // ---- load 2: a fresh page, same frozen shots (must match load 1), then scripted play ----
  const b = await openHub(browser, url, device);
  await applyMove(b.page);
  res.repeat = [];
  for (const view of useViews) {
    const s = await b.page.evaluate((view) => window.__probe.shot({ view }), view);
    const file = path.join(D, 'repeat', `${view}.png`);
    save(s.png, file, { device, section: 'repeat', view, layer: 'beauty' });
    const d = diffPixels(decodePng(fs.readFileSync(path.join(D, 'views', view, 'beauty.png'))), decodePng(pngBytes(s.png)));
    if (d.count) fs.writeFileSync(path.join(D, 'repeat', `${view}-diff.png`), encodePng(d.image));
    res.repeat.push({ view, differentPixels: d.count, maxDelta: d.maxDelta, of: d.total });
  }
  const tex2 = await b.page.evaluate(() => window.__probe.textures());
  res.textures = { count: tex1.length, differing: tex2.length !== tex1.length ? [`count ${tex1.length} vs ${tex2.length}`] : tex2.filter((t, i) => t.hash !== tex1[i].hash).map((t) => `${t.users.join(',')} ${t.size.join('x')}`) };
  log(device, 'repeat load, pixels different:', res.repeat.map((r) => `${r.view}=${r.differentPixels}`).join(' '), `| canvas textures: ${res.textures.count}, differing: ${res.textures.differing.length ? res.textures.differing.join('; ') : 'none'}`);
  const all = playSteps(device), results = [];
  let seg = [];
  const flush = async () => {
    if (!seg.length) return true;
    let r;
    try { r = await b.page.evaluate((s) => window.__probe.run(s), seg); } catch (e) {
      results.push({ i: results.length, step: { run: seg.length + ' steps' }, pass: false, reason: `page.evaluate threw: ${e.message.split('\n')[0]}`, ms: 0 });
      seg = [];
      return false;
    }
    for (const st of r.steps) {
      if (st.shot) {
        const file = path.join(D, 'play', `${String(results.length).padStart(2, '0')}-${st.step.shot}.png`);
        save(st.shot.png, file, { device, section: 'play', name: st.step.shot, layer: st.shot.layer });
        st.shot = { file: rel(file), layer: st.shot.layer, view: st.shot.view, from: st.shot.from, lookAt: st.shot.lookAt, legend: st.shot.legend ? '(see legend files)' : undefined };
      }
      results.push(st);
    }
    seg = [];
    return r.pass;
  };
  let ok = true;
  for (const s of all) {
    if (!ok) break;
    if ('page' in s) {
      ok = await flush();
      if (!ok) break;
      const file = path.join(D, 'play', `${String(results.length).padStart(2, '0')}-${s.page}.png`);
      await b.page.screenshot({ path: file, animations: 'disabled' });
      shotsIndex.push({ file: rel(file), device, section: 'play', name: s.page, layer: 'page screenshot' });
      results.push({ i: results.length, step: s, pass: true, reason: 'page screenshot (card is HTML, not in the 3D canvas)', ms: 0 });
    } else if ('leave' in s) {
      ok = await flush();
      if (!ok) break;
      seg.push(s);
      const nav = b.page.waitForURL((u) => !u.pathname.startsWith('/hub/'), { timeout: 20000 }).then(() => true, () => false);
      ok = await flush();
      const left = await nav;
      const at = b.page.url();
      const stub = left && (await b.page.locator('#landing-stub').count()) === 1;
      results.push({ i: results.length, step: { landed: 'landing page' }, pass: left && stub, reason: left ? `browser went to ${at}${stub ? '' : ' but it is not the landing page'}` : 'browser never left /hub/', ms: 0 });
      ok &&= left && stub;
    } else seg.push(s);
  }
  if (ok) ok = await flush();
  res.play = { pass: ok && results.every((r) => r.pass), steps: results.length, failed: results.filter((r) => !r.pass).map((r) => `${r.i}: ${JSON.stringify(r.step)} -> ${r.reason}`) };
  writeJson(`steps-${device}.json`, results);
  res.errors.push(...b.errors);
  log(device, 'play', res.play.pass ? 'PASS' : 'FAIL', `${results.length} steps`, res.play.failed.join(' | '));
  await b.ctx.close();

  // ---- load 3: perf, live (not frozen). Method from probe/perf/FINDINGS.md. ----
  const c = await openHub(browser, url, device, { freeze: false });
  await c.page.evaluate(() => window.__hub.pauseDay(0.35));
  const busyBefore = gpuBusy();
  const fps = await measureFps(c.page, { seconds: quick ? 5 : 10, warmup: 2 });
  const gpu = await measureGpu(c.page, { frames: 120 });
  const contended = fps.frameMs.p95 > 25;
  res.perf = { gpuBusyBefore: busyBefore, fps, gpu, contended, cost: { method: res.cost.method, baseMs: res.cost.baseMs, top: res.cost.parts.slice(0, 10) } };
  log(device, 'perf', `fps median ${fps.median}, p95 frame ${fps.frameMs.p95} ms`, `batch ${gpu.batchMsPerFrame} ms/frame, ceiling ${gpu.fpsCeiling} fps`, `GPU busy before ${busyBefore}%`, contended ? 'CONTENDED' : '');
  res.errors.push(...c.errors);
  await c.ctx.close();
  return res;
}

fs.mkdirSync(OUT, { recursive: true });
if (!flag('no-build')) log('build', `${build()} ms`);
const srv = await serve();
const report = { runId, quick, move, started: new Date(t0).toISOString(), url: srv.url, devices: {} };
try {
  await withGpuLock('tour', async () => {
    const browser = await launch();
    try {
      for (const d of deviceList) report.devices[d] = await tourDevice(browser, srv.url, d);
    } finally { await browser.close(); }
  });
} finally { await srv.close(); }
report.tookSec = Math.round((Date.now() - t0) / 1000);
report.shots = shotsIndex.length;
writeJson('perf.json', Object.fromEntries(Object.entries(report.devices).map(([d, r]) => [d, { ...r.perf, bootMs: r.bootMs }])));
writeJson('steps.json', Object.fromEntries(Object.entries(report.devices).map(([d, r]) => [d, r.play])));
writeJson('run.json', report);
writeJson('shots.json', shotsIndex);

// ---- contact sheet ----
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const groups = new Map();
for (const s of shotsIndex) {
  const k = `${s.device} / ${s.section}${s.view ? ` / ${s.view}` : s.target ? ` / ${s.target}` : ''}`;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(s);
}
const summary = Object.entries(report.devices).map(([d, r]) => `<tr><th>${d}</th><td>${r.info.size.join('x')} ${esc(r.info.tier)}</td><td>${r.bootMs} ms</td><td>${r.manifest.counts.objects} objects, ${r.manifest.totals.triangles.toLocaleString()} tris, ${r.manifest.rendererInfo.calls} calls</td><td>${r.repeat.map((x) => `${x.view}: ${x.differentPixels}`).join(', ')}</td><td class="${r.play.pass ? 'ok' : 'bad'}">${r.play.pass ? 'pass' : 'FAIL'} (${r.play.steps})</td><td>${r.perf.fps.median} fps (p95 ${r.perf.fps.frameMs.p95} ms), ${r.perf.gpu.batchMsPerFrame} ms/frame, ceiling ${r.perf.gpu.fpsCeiling}</td><td>${r.errors.length}</td></tr>`).join('');
const html = `<!doctype html><meta charset="utf-8"><title>Probe tour ${esc(runId)}</title>
<style>
:root{color-scheme:dark;--bg:#0f1117;--fg:#e8e6e3;--mute:#9aa0aa;--line:#262a33;--ok:#5fd38d;--bad:#ff6b6b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif;padding:clamp(1rem,3vw,2.5rem)}
h1{margin:0 0 .3rem;font-size:1.6rem}h2{font-size:1rem;margin:2rem 0 .6rem;color:var(--mute);font-weight:600;border-top:1px solid var(--line);padding-top:1rem}
table{border-collapse:collapse;width:100%;margin:.8rem 0}th,td{padding:.35rem .6rem;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.ok{color:var(--ok)}.bad{color:var(--bad);font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.6rem}
figure{margin:0;background:#161922;border:1px solid var(--line);border-radius:6px;overflow:hidden;cursor:zoom-in}
figure img{display:block;width:100%;height:auto;aspect-ratio:auto}figcaption{padding:.3rem .5rem;color:var(--mute);font-size:12px}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.92);display:none;align-items:center;justify-content:center;cursor:zoom-out;padding:1rem}
#lb img{max-width:100%;max-height:100%}#lb.on{display:flex}
</style>
<h1>Probe tour ${esc(runId)}</h1>
<div style="color:var(--mute)">${report.shots} shots, ${report.tookSec} s${move ? `, MUTANT: moved ${esc(move)}` : ''}. Pixel-identical column = different pixels between two separate page loads (0 = identical).</div>
<table><tr><th>device</th><th>size, tier</th><th>boot</th><th>scene</th><th>repeat load diff (px)</th><th>scripted play</th><th>perf</th><th>errors</th></tr>${summary}</table>
${[...groups].map(([k, list]) => `<h2>${esc(k)}</h2><div class="grid">${list.map((s) => `<figure><img loading="lazy" src="${esc(s.file)}" alt=""><figcaption>${esc(s.layer ?? '')} ${esc(s.name ?? '')}${s.height !== undefined ? ` ${esc(s.height)} ${s.angle}&deg;` : ''}</figcaption></figure>`).join('')}</div>`).join('')}
<div id="lb"><img alt=""></div>
<script>const lb=document.getElementById('lb');document.addEventListener('click',e=>{const f=e.target.closest('figure');if(f){lb.firstElementChild.src=f.querySelector('img').src;lb.classList.add('on')}else if(e.target.closest('#lb'))lb.classList.remove('on')});</script>`;
fs.writeFileSync(path.join(OUT, 'contact.html'), html);

const fails = Object.entries(report.devices).flatMap(([d, r]) => [
  ...(r.play.pass ? [] : [`${d}: scripted play failed`]),
  ...r.repeat.filter((x) => x.differentPixels !== 0).map((x) => `${d}: repeat ${x.view} differs by ${x.differentPixels} px`),
  ...(r.textures.differing.length ? [`${d}: canvas textures differ between loads: ${r.textures.differing.join('; ')}`] : []),
  ...(r.errors.length ? [`${d}: ${r.errors.length} page errors: ${r.errors.slice(0, 3).join(' | ')}`] : []),
]);
log(`done: ${report.shots} shots in ${report.tookSec} s -> ${path.relative(process.cwd(), OUT)}/contact.html`);
if (fails.length) { console.log('PROBLEMS:\n  ' + fails.join('\n  ')); process.exitCode = 1; }
else console.log('all checks passed');

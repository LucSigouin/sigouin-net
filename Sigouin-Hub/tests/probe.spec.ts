// Probe gate: a short version of probe/tour.mjs.
//   npx playwright test tests/probe.spec.ts --project=desktop
import { test, expect, type Page } from '@playwright/test';
import type {} from '../src/hubApi';
import type {} from '../src/probe/probe';

async function open(page: Page, query: string) {
  await page.goto(`/${query}`);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  if (query.includes('freeze')) await page.waitForFunction(() => window.__probe?.frozen, null, { timeout: 10_000 });
}

/** Pixels that differ between two PNG data URLs, decoded in the page. */
function differentPixels(page: Page, a: string, b: string) {
  if (a === b) return Promise.resolve(0);
  return page.evaluate(async ([a, b]) => {
    const px = async (u: string) => {
      const img = await createImageBitmap(await (await fetch(u)).blob());
      const c = new OffscreenCanvas(img.width, img.height).getContext('2d')!;
      c.drawImage(img, 0, 0);
      return c.getImageData(0, 0, img.width, img.height).data;
    };
    const [p, q] = await Promise.all([px(a), px(b)]);
    if (p.length !== q.length) return -1;
    let n = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2]) n++;
    return n;
  }, [a, b] as const);
}

test('a normal visit downloads no probe code @desktop', async ({ page }) => {
  // Every script body a normal visit downloads: none may hold probe code, split out or inlined.
  const bodies: Promise<{ url: string; text: string }>[] = [];
  page.on('response', (r) => { if (r.request().resourceType() === 'script') bodies.push(r.text().then((text) => ({ url: new URL(r.url()).pathname, text }))); });
  await open(page, '');
  const normal = await Promise.all(bodies);
  console.log(`normal visit: ${normal.length} scripts, ${normal.reduce((a, b) => a + b.text.length, 0)} bytes`);
  expect(normal.length).toBeGreaterThan(0);
  expect(normal.filter((s) => s.url.includes('probe') || s.text.includes('__probe')).map((s) => s.url)).toEqual([]);
  expect(await page.evaluate(() => '__probe' in window)).toBe(false);
  bodies.length = 0;
  await open(page, '?probe');
  const probed = await Promise.all(bodies);
  expect(probed.filter((s) => s.text.includes('__probe')).length).toBe(1);
});

test('frozen shots are pixel-identical across two page loads @desktop', async ({ page }) => {
  const views = ['spawn', 'fountain', 'aerial'];
  const take = () => page.evaluate((vs) => vs.map((view) => window.__probe.shot({ view }).png), views);
  await open(page, '?probe&freeze');
  const first = await take();
  await open(page, '?probe&freeze');
  const second = await take();
  for (let i = 0; i < views.length; i++) {
    const n = await differentPixels(page, first[i], second[i]);
    console.log(`${views[i]}: ${n} different pixels`);
    expect(n, views[i]).toBe(0);
  }
});

test('every layer renders and the scene reads as data @desktop', async ({ page }) => {
  await open(page, '?probe&freeze');
  const r = await page.evaluate(() => {
    const p = window.__probe;
    const m = p.manifest();
    const layers = p.info().layers.filter((l) => l !== 'cost').map((layer) => {
      const s = p.shot({ view: 'aerial', layer });
      return { layer, ok: s.png.startsWith('data:image/png;base64,') && s.png.length > 20_000, size: s.size, legend: s.legend as Record<string, unknown> | undefined };
    });
    return { counts: m.counts, triangles: m.totals.triangles, parts: m.parts.length, grid: p.grid(), layers, fountain: p.find('fountain-stone').length, size: p.size() };
  });
  console.log(JSON.stringify({ counts: r.counts, triangles: r.triangles, parts: r.parts, grid: r.grid }));
  expect(r.counts.shown).toBeGreaterThan(50);
  expect(r.triangles).toBeGreaterThan(100_000);
  expect(r.fountain).toBeGreaterThan(0);
  expect(r.grid.walkableM2).toBeGreaterThan(1000);
  for (const l of r.layers) {
    expect(l.ok, l.layer).toBe(true);
    expect(l.size, l.layer).toEqual(r.size);
  }
  const id = r.layers.find((l) => l.layer === 'id')!.legend as { objects: { path: string }[] };
  expect(id.objects.length).toBeGreaterThan(10);
  expect(id.objects.some((o) => o.path === 'unknown colour')).toBe(false);
  const trig = r.layers.find((l) => l.layer === 'triggers')!.legend as { zones: { id: string }[] };
  expect(trig.zones.map((z) => z.id).sort()).toEqual(['ai-workspace', 'computer-lab', 'leave', 'music-studio', 'office']);
});

test('scripted play: walk to a building, go in, open a card, come back out @desktop', async ({ page }) => {
  await open(page, '?probe&freeze');
  const b = 'music-studio';
  const r = await page.evaluate((b) => window.__probe.run([
    { walkTo: b }, { press: 'KeyE' }, { expect: { level: b, state: 'play' }, timeout: 20_000 },
    { walkTo: `${b}:0` }, { press: 'KeyE' }, { expect: { cardOpen: true } },
    { press: 'Escape' }, { expect: { cardOpen: false } },
    { walkTo: `${b}:exit` }, { press: 'KeyE' }, { expect: { level: 'courtyard', state: 'play' }, timeout: 20_000 },
  ]), b);
  for (const s of r.steps) console.log(`${s.pass ? 'ok  ' : 'FAIL'} ${JSON.stringify(s.step)} ${s.reason} (${s.ms} ms)`);
  expect(r.pass).toBe(true);
  expect(await page.evaluate(() => window.__probe.frozen)).toBe(true);
});

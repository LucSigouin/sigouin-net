// Probe for the Computer Lab dive (2026-09-30): both linked computers, a mid-dive frame, the CRT
// loading screen, and the navigation URL for each. External sites are stubbed, never loaded.
// Usage: node probe/undergrowth-link.mjs [baseUrl]   (default http://localhost:5193/)
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { GPU_ARGS } from './lib.mjs';

const BASE = process.argv[2] ?? 'http://localhost:5193/';
const OUT = new URL('./shots/undergrowth-link', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: GPU_ARGS });
const results = [];

async function lab(title) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const hits = [];
  for (const host of ['https://undergrowth.pages.dev', 'https://dragonwilds.sigouin.net']) {
    await page.route(`${host}/**`, (r) => { hits.push(r.request().url()); r.fulfill({ contentType: 'text/html', body: '<title>stub</title>stub' }); });
  }
  await page.goto(BASE);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  await page.evaluate(() => window.__hub.teleport('computer-lab'));
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__hub.level() === 'computer-lab' && window.__hub.state() === 'play', null, { timeout: 60_000 });
  const ex = (await page.evaluate(() => window.__hub.interactables())).find((i) => i.label === title);
  await page.evaluate((i) => window.__hub.teleport(i), ex.id);
  await page.waitForFunction((i) => window.__hub.nearest() === i, ex.id);
  await page.waitForTimeout(1200);
  return { page, errors, hits, ex };
}

// 1. Undergrowth: the pair of computers, the prompt, the dive, the loading screen.
{
  const { page, errors, hits, ex } = await lab('Undergrowth');
  await page.evaluate(() => window.__hub.view([-4.2, 1.75, 4.4], [-4.2, 1.0, 2.1]));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/1-both-computers.png` });
  await page.evaluate(() => window.__hub.view(null));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/2-prompt-f.png` });
  const key = await page.locator('.prompt .key').textContent();
  const label = await page.locator('.prompt').textContent();
  const nav = page.waitForURL('https://undergrowth.pages.dev/', { timeout: 15_000 });
  await page.evaluate(() => window.__hub.diveHold(0.55));
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => window.__hub.dive() >= 0.55);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/3-mid-dive.png` });
  await page.evaluate(() => window.__hub.diveHold(0.86));
  await page.waitForFunction(() => window.__hub.dive() >= 0.86);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/4-glass-flare.png` });
  const cardOpen = await page.evaluate(() => window.__hub.cardOpen());
  await page.evaluate(() => window.__hub.diveHold(null));
  await page.locator('.crt.is-on').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/5-loading-screen.png` });
  await nav;
  results.push({ title: 'Undergrowth', kind: ex.kind, key, label, cardOpen, navigatedTo: page.url(), stubHits: hits, errors });
  await page.close();
}

// 2. Dragonwilds: same dive, just assert where it goes.
{
  const { page, errors, hits, ex } = await lab('Dragonwilds Field Guide');
  const nav = page.waitForURL('https://dragonwilds.sigouin.net/', { timeout: 15_000 });
  const t0 = Date.now();
  await page.keyboard.press('KeyF');
  await nav;
  results.push({ title: ex.label, kind: ex.kind, msToNavigate: Date.now() - t0, navigatedTo: page.url(), stubHits: hits, errors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
fs.writeFileSync(new URL('./notes/undergrowth-link.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
const ok = results[0].navigatedTo === 'https://undergrowth.pages.dev/' && results[1].navigatedTo === 'https://dragonwilds.sigouin.net/'
  && results.every((r) => r.kind === 'screen' && !r.errors.length) && results[0].key === 'F' && results[0].cardOpen === false;
console.log(ok ? 'PROBE OK' : 'PROBE FAIL');
process.exit(ok ? 0 : 1);

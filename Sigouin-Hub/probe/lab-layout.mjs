// Probe for the Computer Lab desk layout (2026-09-30): the view right after walking in.
// Usage: node probe/lab-layout.mjs [baseUrl] [shotName]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { GPU_ARGS } from './lib.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5193/';
const NAME = process.argv[3] ?? 'entrance';
const OUT = new URL('./shots/lab-layout', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: GPU_ARGS });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE);
await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
await page.evaluate(() => window.__hub.teleport('computer-lab'));
await page.keyboard.press('e');
await page.waitForFunction(() => window.__hub.level() === 'computer-lab' && window.__hub.state() === 'play', null, { timeout: 60_000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/${NAME}.png` });
const items = await page.evaluate(() => window.__hub.interactables());
console.log(JSON.stringify({ interactables: items.map((i) => [i.label, i.kind]), errors }));
await browser.close();

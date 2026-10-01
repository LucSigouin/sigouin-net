import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
process.env.TMPDIR = path.join('/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/b', '.runtime/tmp');
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
const { chromium } = createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');

const BASE = 'http://127.0.0.1:5192';
const OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/b/shots';
const pages = [['index', '/'], ['process', '/process/']];
const sizes = [[1440, 900], [390, 844]];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const [name, route] of pages) {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 1,
      isMobile: width === 390, hasTouch: width === 390,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    const res = await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3500);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const file = `${OUT}/${name}-${width}.png`;
    await page.screenshot({ path: file });
    for (const [tag, y] of [['mid', 1000], ['late', 2600]]) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/../.runtime/${name}-${width}-${tag}.png` });
    }
    console.log(name, width, 'status', res?.status(), 'overflowX', overflow, 'errors', JSON.stringify(errors.slice(0, 4)));
    await context.close();
  }
}
await browser.close();

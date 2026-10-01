/* Round 17 screenshots. Serves from port 5196, which stays up for Luc's preview. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const L = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll';
process.env.TMPDIR = L + '/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
fs.mkdirSync(L + '/shots', { recursive: true });
const { chromium } = createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:5196';
const b = await chromium.launch({ channel: 'msedge', headless: true, args: [`--disk-cache-dir=${L}/.runtime/cache`, '--disable-crash-reporter', '--disable-breakpad'] });

async function open(w, h, path) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w === 390, hasTouch: w === 390 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(base + path, { waitUntil: 'load', timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForSelector('html[data-overture="settled"]', { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(900);
  return { ctx, p, errs };
}

for (const [name, path] of [['index', '/'], ['process', '/process/']]) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p, errs } = await open(w, h, path);
    await p.screenshot({ path: `${L}/shots/${name}-${w}.png` });
    const m = await p.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: window.innerHeight, sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    console.log(name, w, JSON.stringify(m), 'errors:', JSON.stringify(errs));
    await ctx.close();
  }
}

/* Index at 1440 with row 10 hovered, so the whole rail rhythm and the stage are both visible. */
{
  const { ctx, p } = await open(1440, 900, '/');
  await p.locator('#rail .row').nth(9).hover();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${L}/shots/index-after-overture-1440.png` });
  const rows = await p.evaluate(() => [...document.querySelectorAll('#rail li')].map(li => Math.round(li.getBoundingClientRect().height)));
  const railBox = await p.evaluate(() => { const r = document.querySelector('#rail').getBoundingClientRect(); return [Math.round(r.height), Math.round(document.querySelector('#rail').scrollHeight)]; });
  console.log('rail row heights', JSON.stringify(rows), 'sum', rows.reduce((a, c) => a + c, 0), 'rail box/scroll', JSON.stringify(railBox));
  await ctx.close();
}

/* Process wing stepped to P8 at 1440. */
{
  const { ctx, p } = await open(1440, 900, '/process/');
  for (let i = 0; i < 7; i++) { await p.locator('#next').click(); await p.waitForTimeout(400); }
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${L}/shots/process-p8-1440.png` });
  console.log('process counter', await p.locator('#count').textContent());
  await ctx.close();
}

/* The tool ledger toggle, at both widths, measured so nothing is clipped inside the pane. */
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { ctx, p } = await open(w, h, '/process/');
  await p.locator('#ledgerBtn').click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${L}/shots/process-ledger-${w}.png` });
  const fit = await p.evaluate(() => {
    const el = document.querySelector('#ledger');
    return { box: Math.round(el.getBoundingClientRect().height), content: el.scrollHeight, clipped: el.scrollHeight > el.clientHeight + 1 };
  });
  console.log('ledger', w, JSON.stringify(fit));
  await ctx.close();
}

/* Phone: the stage pane after tapping a row, with the back control. */
{
  const { ctx, p } = await open(390, 844, '/');
  await p.locator('#rail .row').nth(0).tap();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${L}/shots/index-stage-390.png` });
  console.log('phone stage open:', await p.evaluate(() => document.body.classList.contains('stage-open')),
    'back visible:', await p.locator('.stage__back').isVisible());
  await ctx.close();
}

await b.close();

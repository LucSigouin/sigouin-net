/* Round 21: screenshots of the archived widgell-bach app, served locally on 5203
   with its real KV backup as the data source. Same Playwright harness round 13 used. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const L = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r21-golf';
const OUT = L + '/.runtime/shots-widgell';
process.env.TMPDIR = L + '/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const { chromium } = createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:5203';
const b = await chromium.launch({ channel: 'msedge', headless: true, args: [`--disk-cache-dir=${L}/.runtime/cache`, '--disable-crash-reporter', '--disable-breakpad'] });

async function open(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w === 390, hasTouch: w === 390 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(base + '/', { waitUntil: 'load', timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  return { ctx, p, errs };
}

async function report(p, tag) {
  const m = await p.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    iw: window.innerWidth,
    text: document.body.innerText.slice(0, 220).replace(/\s+/g, ' '),
    buttons: [...document.querySelectorAll('button')].map(x => x.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 24)
  }));
  console.log(tag, JSON.stringify(m));
}

/* 1440 at the top, then at half the page height. */
{
  const { ctx, p, errs } = await open(1440, 900);
  await report(p, 'main-1440');
  console.log('errors', JSON.stringify(errs));
  await p.screenshot({ path: `${OUT}/widgell-1440-scroll0.png` });
  await p.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - window.innerHeight) * 0.5)));
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/widgell-1440-scroll50.png` });
  await ctx.close();
}

/* Phone width, top of the same page. */
{
  const { ctx, p } = await open(390, 844);
  await p.screenshot({ path: `${OUT}/widgell-390-scroll0.png` });
  await ctx.close();
}

/* A second screen reached by a click. The tab name comes in on argv[3]. */
const tab = process.argv[3] || 'Teams';
{
  const { ctx, p } = await open(1440, 900);
  const btn = p.getByRole('button', { name: new RegExp(tab, 'i') }).first();
  if (await btn.count()) {
    await btn.click();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/widgell-1440-${tab.toLowerCase()}.png` });
    await report(p, 'tab-' + tab);
  } else {
    console.log('tab not found:', tab);
  }
  await ctx.close();
}

await b.close();

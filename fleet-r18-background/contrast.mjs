/* Round 18 contrast measurement, real pixels rather than arithmetic.
   Usage: node contrast.mjs <base url> [out.json]
   For each text pane it hides the pane's own contents and rule lines, so what is left inside
   the box is exactly the ground a glyph sits on: the clip, its filter, the ground wash and
   the pane wash. That region is screenshotted at four moments of the ten second loop, the
   PNG is decoded in a browser canvas, and every pixel's relative luminance is computed.
   Run it against the round 17 build too: that is the before number these are judged against. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const L = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r18-background';
process.env.TMPDIR = L + '/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
const { chromium } = createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');
const base = process.argv[2];
const out = process.argv[3];
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-crash-reporter', '--disable-breakpad'] });

function relLum(r, g, bl) {
  const f = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
}
const PAPER = relLum(0xec, 0xe7, 0xdd), DIM = relLum(0x8d, 0x88, 0x7e);
const reader = await (await b.newContext()).newPage();

async function pane(path, region, label) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: 'load', timeout: 30000 });
  await p.waitForSelector('html[data-overture="settled"]', { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.addStyleTag({ content: `${region} > *{visibility:hidden !important}
    ${region},${region} *,${region}::before,${region}::after{border:0 !important;box-shadow:none !important;outline:0 !important}` });
  let worst = 0, p99 = 0, worstPx = null;
  for (let i = 0; i < 4; i++) {
    await p.waitForTimeout(i === 0 ? 400 : 2500);
    const shot = (await p.locator(region).screenshot()).toString('base64');
    const r = await reader.evaluate(async b64 => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const all = [];
      let m = -1, px = null;
      for (let i = 0; i < d.length; i += 4) {
        const l = 0.2126 * f(d[i]) + 0.7152 * f(d[i + 1]) + 0.0722 * f(d[i + 2]);
        all.push(l);
        if (l > m) { m = l; px = [d[i], d[i + 1], d[i + 2], (i / 4) % c.width, Math.floor(i / 4 / c.width)]; }
      }
      all.sort((a, b) => a - b);
      return { max: m, p99: all[Math.floor(all.length * 0.99)], px, w: c.width, h: c.height };
    }, shot);
    if (r.max > worst) { worst = r.max; worstPx = r.px; }
    if (r.p99 > p99) p99 = r.p99;
  }
  const ratio = (v, bg) => Number(((Math.max(v, bg) + 0.05) / (Math.min(v, bg) + 0.05)).toFixed(2));
  const res = {
    label, worstLum: Number(worst.toFixed(4)), p99Lum: Number(p99.toFixed(4)),
    worstPixelRGB: worstPx && `rgb(${worstPx[0]},${worstPx[1]},${worstPx[2]}) at ${worstPx[3]},${worstPx[4]}`,
    paperWorst: ratio(PAPER, worst), paperP99: ratio(PAPER, p99),
    dimWorst: ratio(DIM, worst), dimP99: ratio(DIM, p99),
  };
  console.log(`${label}: paper ${res.paperWorst}:1 worst / ${res.paperP99}:1 p99, dim ${res.dimWorst}:1 / ${res.dimP99}:1, brightest ${res.worstPixelRGB}`);
  await ctx.close();
  return res;
}

const rows = [
  await pane('/', '.rail-col', 'index rail column'),
  await pane('/', '.stage__body', 'index stage body'),
  await pane('/', '.overture', 'index header strip'),
  await pane('/process/', '.scene.is-on .scene__note', 'process scene note'),
];
if (out) fs.writeFileSync(out, JSON.stringify({ base, panes: rows }, null, 2));
const bad = rows.filter(r => r.paperWorst < 4.5);
console.log(bad.length ? 'FAIL on paper text: ' + JSON.stringify(bad) : 'paper text clears 4.5:1 on the brightest pixel of every pane');
await b.close();

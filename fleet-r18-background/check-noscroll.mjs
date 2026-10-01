/* Round 17 gate: the no scroll rule.
   After the load animation settles, neither page may have document scroll at 1440x900
   or at 390x844, and neither may overflow sideways. The index is then exercised on
   rows 01 and 10, the process wing is stepped to P8, and every state is rechecked.
   Exit 0 only when every check passes. */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const LANE = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll';
process.env.TMPDIR = LANE + '/.runtime/tmp';
fs.mkdirSync(process.env.TMPDIR, { recursive: true });

const { chromium } = createRequire('/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/package.json')('playwright-core');

const base = (process.argv[2] || 'http://127.0.0.1:5194').replace(/\/$/, '');
const VIEWPORTS = [[1440, 900], [390, 844]];
const fails = [];
const lines = [];

function measure() {
  const de = document.documentElement;
  return {
    scrollHeight: de.scrollHeight,
    innerHeight: window.innerHeight,
    scrollWidth: de.scrollWidth,
    innerWidth: window.innerWidth,
    scrollTop: window.scrollY
  };
}

function judge(where, m) {
  const over = m.scrollHeight - m.innerHeight;
  const side = m.scrollWidth - m.innerWidth;
  const bad = [];
  if (over > 1) bad.push(`vertical document scroll: scrollHeight ${m.scrollHeight} > innerHeight ${m.innerHeight} by ${over}px`);
  if (side > 1) bad.push(`horizontal overflow: scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth} by ${side}px`);
  const verdict = bad.length ? 'FAIL' : 'pass';
  lines.push(`${verdict}  ${where}  h ${m.scrollHeight}/${m.innerHeight}  w ${m.scrollWidth}/${m.innerWidth}`);
  for (const b of bad) fails.push(`${where}: ${b}`);
}

/* The settled flag is what both pages set when the overture is done. A build that never
   sets it is not skipped: we fall back to a fixed wait and still measure it. */
async function waitSettled(p) {
  try {
    await p.waitForSelector('html[data-overture="settled"]', { timeout: 6000 });
  } catch {
    await p.waitForTimeout(3600);
  }
  await p.waitForTimeout(500);
}

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: [`--disk-cache-dir=${LANE}/.runtime/cache`, '--disable-crash-reporter', '--disable-breakpad']
});

for (const [w, h] of VIEWPORTS) {
  const phone = w === 390;

  /* ---- index ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
    const p = await ctx.newPage();
    await p.goto(base + '/', { waitUntil: 'load', timeout: 30000 });
    await p.evaluate(() => document.fonts.ready);
    await waitSettled(p);
    judge(`index ${w}x${h} after overture`, await p.evaluate(measure));

    const rows = await p.evaluate(() => document.querySelectorAll('#rail .row').length);
    if (rows !== 10) fails.push(`index ${w}x${h}: expected 10 rail rows, found ${rows}`);
    lines.push(`      index ${w}x${h} rail rows: ${rows}`);

    for (const [label, i] of [['row 01', 0], ['row 10', 9]]) {
      const row = p.locator('#rail .row').nth(i);
      if (phone) await row.tap(); else await row.hover();
      await p.waitForTimeout(900);
      judge(`index ${w}x${h} ${label} ${phone ? 'tapped' : 'hovered'}`, await p.evaluate(measure));
      if (phone) {
        const back = p.locator('.stage__back');
        if (await back.isVisible()) { await back.tap(); await p.waitForTimeout(600); }
      }
    }
    await ctx.close();
  }

  /* ---- process ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
    const p = await ctx.newPage();
    await p.goto(base + '/process/', { waitUntil: 'load', timeout: 30000 });
    await p.evaluate(() => document.fonts.ready);
    await waitSettled(p);
    judge(`process ${w}x${h} first scene`, await p.evaluate(measure));

    const next = p.locator('#next');
    if (await next.count()) {
      for (let k = 0; k < 7; k++) {
        if (await next.isDisabled()) break;
        if (phone) await next.tap(); else await next.click();
        await p.waitForTimeout(450);
      }
      await p.waitForTimeout(600);
      const at = await p.evaluate(() => document.querySelector('#count') ? document.querySelector('#count').textContent : 'no counter');
      lines.push(`      process ${w}x${h} stepped to: ${at}`);
      if (at !== 'P8 / 8') fails.push(`process ${w}x${h}: stepper did not reach P8 / 8, it reads "${at}"`);
      judge(`process ${w}x${h} at P8`, await p.evaluate(measure));
    } else {
      fails.push(`process ${w}x${h}: no stepper next control found, this build is not a stepper`);
      lines.push(`FAIL  process ${w}x${h}: no #next control`);
    }
    await ctx.close();
  }
}

await browser.close();

console.log('no scroll gate against ' + base);
for (const l of lines) console.log('  ' + l);
if (fails.length) {
  console.log('\nFAILED ' + fails.length + ' check' + (fails.length === 1 ? '' : 's') + ':');
  for (const f of fails) console.log('  - ' + f);
  process.exit(1);
}
console.log('\nOK: no document scroll on either page at 1440x900 or 390x844.');
process.exit(0);

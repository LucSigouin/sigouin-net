const { chromium } = require('playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.TEST_URL || 'http://127.0.0.1:4176';
const output = path.resolve(__dirname, '../test-results');
const candidates = [process.env.BROWSER_PATH, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'];
const executablePath = candidates.find(p => p && fs.existsSync(p));
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const results = [];
  try {
    for (const site of (process.env.TEST_SITES || 'studio,signal').split(',')) {
      for (const width of [1440, 768, 390, 320]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        const badResponses = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });
        await page.goto(`${base}/${site}/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1, `${site}: exactly one h1`);
        assert.equal(await page.locator('main').count(), 1, `${site}: main landmark`);
        assert.ok(await page.locator('a[href="mailto:luc@sigouin.net"]').count(), `${site}: real contact`);
        for (const dest of ['https://sigzmusic.com', 'https://livetvcan.com', 'https://github.com/LucSigouin']) {
          assert.ok(await page.locator(`a[href="${dest}"]`).count(), `${site}: missing ${dest}`);
        }
        const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(a => a.hash && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.outerHTML));
        assert.deepEqual(brokenAnchors, [], `${site}: broken anchors`);
        const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(overflow.scroll <= width + 1, `${site} ${width}: overflow ${JSON.stringify(overflow)}`);
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const axe = await page.evaluate(async () => {
          const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
          return r.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
        });
        await page.screenshot({ path: `${output}/${site}-${width}.png`, fullPage: true });
        results.push({ site, width, overflow, errors, badResponses, accessibility: axe });
        assert.deepEqual(errors, [], `${site}: JS errors`);
        assert.deepEqual(badResponses, [], `${site}: missing local resources`);
        await context.close();
      }
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(`${base}/${site}/`);
      assert.ok(await page.locator('h1').isVisible(), `${site}: no-JS heading readable`);
      assert.ok(await page.locator('a[href="mailto:luc@sigouin.net"]').first().isVisible(), `${site}: no-JS contact readable`);
      await context.close();
    }
  } finally {
    fs.writeFileSync(`${output}/browser-report.json`, JSON.stringify(results, null, 2));
    await browser.close();
  }
  const violations = results.flatMap(r => r.accessibility.map(v => ({ site: r.site, width: r.width, ...v })));
  console.log(JSON.stringify({ pagesChecked: results.length, accessibilityViolations: violations }, null, 2));
  assert.deepEqual(violations, [], 'Accessibility violations must be resolved');
})().catch(e => { console.error(e); process.exitCode = 1; });

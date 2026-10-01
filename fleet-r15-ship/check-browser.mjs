import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules/playwright-core/index.mjs';

const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({
  executablePath: '/Users/ls/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const results = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', event => {
        window.__csp.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
      });
    });
    for (const route of ['/', '/process/']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto('http://127.0.0.1:8799' + route, { waitUntil: 'networkidle', timeout: 30000 });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (route === '/') {
        assert.equal(await page.getByRole('heading', { name: 'SIGOUIN.NET', exact: true }).count(), 1);
        assert.equal(await page.locator('#rail .row').count(), 12);
        await page.waitForFunction(() => Boolean(customElements.get('model-viewer')));
        await page.waitForFunction(() => document.querySelector('.stage__live')?.textContent !== '...');
      }
      const result = { route, width, status: response.status(), horizontalOverflow: false, errors, models: [] };
      await page.screenshot({ path: out + (route === '/' ? 'hub' : 'process') + '-' + width + '.png' });
      if (route === '/' && width === 1440) {
        for (const [exhibit, media] of [[0, 2], [1, 2], [5, 0], [6, 1]]) {
          await page.locator(`#rail .row[data-i="${exhibit}"]`).click();
          if (media) await page.locator(`[data-m="${media}"]`).click();
          const model = page.locator('model-viewer');
          await model.scrollIntoViewIfNeeded();
          await model.evaluate(element => element.dismissPoster());
          await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded, null, { timeout: 20000 });
          result.models.push(await model.getAttribute('src'));
        }
        await page.locator('#rail .row[data-i="2"]').click();
        await page.locator('[data-m="2"]').click();
        await page.locator('[data-load-frame]').click();
        await page.locator('iframe').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('iframe')?.getAttribute('src') === 'https://undergrowth.pages.dev');
        result.gameFrame = await page.locator('iframe').getAttribute('src');
      }
      result.cspViolations = await page.evaluate(() => window.__csp);
      results.push(result);
      fs.writeFileSync(out + 'browser-checks.json', JSON.stringify(results, null, 2) + '\n');
      console.log(JSON.stringify(result));
      assert.equal(result.cspViolations.length, 0);
      assert.equal(errors.length, 0);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

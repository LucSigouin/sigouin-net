// Whole-site journey on a deployed or `wrangler pages dev` build, with its real headers:
//   SITE_URL=https://sigouin.net npx playwright test tests/site.spec.ts --project=desktop
// Landing 3D → Enter on the monitor → hub with Luc's model → walk out → landing again,
// with zero CSP violations or page errors along the way.
import { test, expect } from '@playwright/test';
import type {} from '../src/hubApi';

const site = process.env.SITE_URL?.replace(/\/$/, '');

test('landing to hub and back @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  test.setTimeout(300_000);
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`));
  });

  await page.goto(`${site}/`);
  await page.waitForFunction(() => (window as unknown as { __vybe?: { mode: string } }).__vybe?.mode === 'live', null, { timeout: 90_000 });
  await expect(page.locator('.site-header')).toBeHidden();
  expect(await page.evaluate(() => [document.scrollingElement!.scrollHeight <= innerHeight, scrollY])).toEqual([true, 0]);

  await page.locator('#canvas-host canvas').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(`${site}/hub/`, { timeout: 15_000 });
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  expect((await page.evaluate(() => window.__hub.debug())).player).toBe('model');

  await page.mouse.click(720, 450);
  await page.keyboard.down('s');
  await page.waitForURL((u) => u.pathname === '/', { timeout: 15_000 });
  await page.keyboard.up('s');
  await page.waitForFunction(() => (window as unknown as { __vybe?: { mode: string } }).__vybe?.mode === 'live', null, { timeout: 90_000 });
  expect(problems).toEqual([]);
});

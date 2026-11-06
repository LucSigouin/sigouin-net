// Landing, 404 and redirect checks on a deployed or `wrangler pages dev` build:
//   SITE_URL=http://localhost:8788 npx playwright test tests/site-fixes.spec.ts --project=desktop
import { test, expect, type Page } from '@playwright/test';
import type {} from '../src/hubApi';

const site = process.env.SITE_URL?.replace(/\/$/, '');

function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`));
  });
  return problems;
}

for (const motion of ['no-preference', 'reduce'] as const) {
  test(`landing: Tab reaches a visible Enter the hub link (${motion}) @desktop`, async ({ page }) => {
    test.skip(!site, 'set SITE_URL');
    const problems = watch(page);
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto(`${site}/`);
    const link = page.locator('a.enter-hub');
    await expect(link).toHaveAttribute('href', '/hub/');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThan(80);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.keyboard.press('Enter');
    await page.waitForURL(`${site}/hub/`);
    expect(problems).toEqual([]);
  });
}

test('unknown addresses are real 404s, old guide links redirect @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  // Not /robots.txt: on the live zone Cloudflare answers it itself (managed content signals).
  for (const path of ['/nope-404', '/hub/nope', '/hub/assets/nope.js', '/process/', '/js/process.js']) {
    const r = await page.request.get(`${site}${path}`);
    expect(r.status(), path).toBe(404);
  }
  expect(await (await page.request.get(`${site}/nope-404`)).text()).toContain('Nothing on this screen.');
  const r = await page.request.get(`${site}/runescape/styles.css`, { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('https://dragonwilds.sigouin.net/styles.css');
});

test('hub under /hub/: a project card shows its screenshot @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  test.setTimeout(240_000);
  await page.goto(`${site}/hub/`);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  // Lab computers dive to their link instead of a card, so the music studio's SiGz card is checked.
  await page.evaluate(() => window.__hub.teleport('music-studio'));
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__hub.level() === 'music-studio' && window.__hub.state() === 'play', null, { timeout: 60_000 });
  const ex = (await page.evaluate(() => window.__hub.interactables())).find((i) => i.label === 'SiGz')!;
  await page.evaluate((i) => window.__hub.teleport(i), ex.id);
  await page.waitForFunction((i) => window.__hub.nearest() === i, ex.id, { timeout: 10_000 });
  await page.keyboard.press('e');
  const img = page.locator('.card-backdrop .card-media img');
  await expect(img).toHaveAttribute('src', '/hub/shots/sigz.jpg');
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
});

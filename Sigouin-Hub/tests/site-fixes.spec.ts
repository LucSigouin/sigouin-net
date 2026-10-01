// Landing, /process/, 404 and redirect checks on a deployed or `wrangler pages dev` build:
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

const HIDDEN_SCENE_MEDIA = ['board-live-2026-09-17', 'landing-nine-up-2026-09-17', 'board-claude-2026-09-17',
  'board-kimi-2026-09-17', 'landing-live-winner', 'sigouin-five-looks-2026-09-17', 'gate-red-green.mp4'];

test('process: hidden scenes load nothing until reached @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  const problems = watch(page);
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto(`${site}/process/`);
  await page.waitForLoadState('networkidle');
  for (const m of HIDDEN_SCENE_MEDIA) expect(urls.filter((u) => u.includes(m)), m).toEqual([]);
  // The scene on screen plays; normal motion is untouched.
  await expect.poll(() => page.evaluate(() => document.querySelector<HTMLVideoElement>('.scene.is-on video')!.paused)).toBe(false);
  // Reaching a scene loads its media.
  await page.locator('#next').click();
  await page.locator('#next').click();
  await expect.poll(() => urls.some((u) => u.includes('board-live-2026-09-17'))).toBe(true);
  // Plain buttons, not half-built tabs.
  await expect(page.locator('#dots [role="tab"], [role="tablist"]')).toHaveCount(0);
  await expect(page.locator('#dots [aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('#dots button').nth(2)).toHaveAttribute('aria-current', 'step');
  expect(problems).toEqual([]);
});

test('process: reduced motion stops every clip @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${site}/process/`);
  await page.waitForLoadState('networkidle');
  await page.locator('#next').click();
  await page.locator('#next').click(); // P3 has the second scene clip
  await page.waitForTimeout(800);
  const playing = await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length);
  expect(playing).toBe(0);
});

test('process: on a short screen the ledger scrolls to its Close button @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(`${site}/process/`);
  await page.locator('#ledgerBtn').click();
  const close = page.locator('[data-close-ledger]');
  const box = await page.locator('#ledger').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 400);
  await expect.poll(async () => { const b = await close.boundingBox(); return !!b && b.y + b.height <= 390; }).toBe(true);
  await close.click();
  await expect(page.locator('#ledger')).toBeHidden();
});

test('unknown addresses are real 404s, old guide links redirect @desktop', async ({ page }) => {
  test.skip(!site, 'set SITE_URL');
  // Not /robots.txt: on the live zone Cloudflare answers it itself (managed content signals).
  for (const path of ['/nope-404', '/hub/nope', '/hub/assets/nope.js', '/process/nope']) {
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

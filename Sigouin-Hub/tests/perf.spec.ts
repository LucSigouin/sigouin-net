// Frame rate at spawn with each part of the outdoors hidden in turn: PERF=1 npx playwright test tests/perf.spec.ts --project=desktop
import { test } from '@playwright/test';
import type {} from '../src/hubApi';

const PARTS = ['meadow', 'bushes', 'rocks', 'track', 'terrain', 'countryside', 'oak-a-leaf', 'oak-b-leaf', 'cypress-leaf', 'hill-cypress-leaf', 'hill-oak-leaf', 'grass', 'bed-foliage', 'bed-blooms', 'mountains'];

test('fps by part @desktop', async ({ page }) => {
  test.skip(!process.env.PERF, 'set PERF=1 to profile');
  test.setTimeout(300_000);
  await page.goto('/');
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  await page.evaluate(() => window.__hub.pauseDay(0));
  const fps = () => page.evaluate(() => new Promise<number>((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  }));
  await page.waitForTimeout(1500);
  console.log(`all: ${(await fps()).toFixed(1)}`);
  for (const name of PARTS) {
    const n = await page.evaluate((nm) => window.__hub.setVisible(nm, false), name);
    console.log(`without ${name} (${n}): ${(await fps()).toFixed(1)}`);
    await page.evaluate((nm) => window.__hub.setVisible(nm, true), name);
  }
});

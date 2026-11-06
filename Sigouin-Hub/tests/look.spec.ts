// Close-up views of the planting and the player, for judging looks. Run on its own:
//   npx playwright test tests/look.spec.ts --project=desktop
import { test, expect } from '@playwright/test';
import type {} from '../src/hubApi';

const OUT = process.env.LOOK_DIR ?? 'tests/screenshots/look';
const VIEWS: [string, number[] | null, number[]?][] = [
  ['spawn', null],
  ['bed', [-1.2, 1.3, 19.5], [-4.5, 0.2, 15.5]],
  ['oak', [-17.5, 2.4, 27], [-25.5, 4.2, 22.5]],
  ['cypress', [-6, 2.2, -10], [-14, 4.5, -19]],
  ['fountain-ring', [3.5, 1.6, 8.5], [0, 0.3, 4.2]],
  ['wide', [0, 9, 34], [0, 2, 0]],
  ['south', [0, 2.2, -4], [0, 4, 40]],
  ['south-east', [-6, 2.4, 6], [40, 5, 40]],
  ['west', [10, 2.4, 10], [-40, 5, 20]],
  ['outside-gate', [1.5, 1.7, 30], [-4, 1, 55]],
  ['outside-side', [34, 1.8, 10], [60, 1.2, 30]],
  ['player-front', [0.4, 1.35, 19.9], [0, 1.05, 22.5]],
  ['player-side', [2.6, 1.2, 22.4], [0, 1.0, 22.5]],
];

test('look views @desktop', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${process.env.LOOK_QUERY ?? ''}`);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  await page.evaluate(() => window.__hub.pauseDay(0));
  await page.waitForTimeout(1500);
  for (const [name, p, l] of VIEWS) {
    await page.evaluate(([p, l]) => window.__hub.view(p as number[] | null, l as number[] | undefined), [p, l] as const);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
  await page.evaluate(() => window.__hub.view(null));
  await page.mouse.click(720, 450);
  await page.keyboard.down('w');
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/player-walk.png` });
  await page.keyboard.down('Shift');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/player-run.png` });
  await page.keyboard.up('Shift');
  await page.keyboard.up('w');
  const fps = await page.evaluate(() => new Promise<number>((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  }));
  console.log(`fps at spawn: ${fps.toFixed(1)}`);
  expect(errors).toEqual([]);
});

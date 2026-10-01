// Dumps the painted foliage atlas for inspection: npx playwright test tests/atlas.spec.ts --project=desktop
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('atlas dump @desktop', async ({ page }) => {
  await page.goto('/?atlas');
  await page.waitForFunction(() => (window as unknown as { __atlas?: HTMLCanvasElement }).__atlas, null, { timeout: 120_000 });
  const url = await page.evaluate(() => (window as unknown as { __atlas: HTMLCanvasElement }).__atlas.toDataURL('image/png'));
  writeFileSync('tests/screenshots/look/atlas.png', Buffer.from(url.split(',')[1], 'base64'));
});

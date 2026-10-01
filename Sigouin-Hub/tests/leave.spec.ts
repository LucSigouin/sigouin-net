// Walking out of the garden returns to the landing page. Needs the hub served under a landing
// page, e.g. LEAVE_URL=http://127.0.0.1:5201/hub/ (the sigouin-net dev copy); skipped otherwise.
import { test, expect } from '@playwright/test';
import type {} from '../src/hubApi';

const url = process.env.LEAVE_URL;

test('walking out the entrance goes back to the landing page @desktop', async ({ page }) => {
  test.skip(!url, 'set LEAVE_URL to a hub served under its landing page');
  await page.goto(url!);
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  await page.mouse.click(720, 450);
  await page.keyboard.down('s');
  await page.waitForURL((u) => !u.pathname.startsWith('/hub/'), { timeout: 15_000 });
  await page.keyboard.up('s');
  await expect(page.locator('#scene')).toBeAttached();
  expect(new URL(page.url()).hash).toBe('');
});

import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const SHOTS = 'tests/screenshots';
const IDS = ['computer-lab', 'music-studio', 'office', 'ai-workspace'] as const;
const content = JSON.parse(readFileSync('src/content/projects.json', 'utf8'));

import type {} from '../src/hubApi';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function boot(page: Page) {
  await page.goto('/');
  // The courtyard drawing is tied to real loading steps and must reach 100 before the reveal.
  await expect(page.getByRole('progressbar', { name: 'Loading the courtyard' })).toHaveAttribute('aria-valuenow', '100', { timeout: 180_000 });
  await page.waitForFunction(() => window.__hub?.state?.() === 'play', null, { timeout: 180_000 });
  await page.evaluate(() => window.__hub.pauseDay(0));
  await expect(page.locator('#boot')).toBeHidden();
}

async function assertFillsViewport(page: Page) {
  const m = await page.evaluate(() => {
    const c = document.getElementById('world')!.getBoundingClientRect();
    const se = document.scrollingElement!;
    return { cw: Math.round(c.width), ch: Math.round(c.height), iw: innerWidth, ih: innerHeight, sw: se.scrollWidth, sh: se.scrollHeight, x: scrollX, y: scrollY };
  });
  expect(m.cw).toBe(m.iw);
  expect(m.ch).toBe(m.ih);
  expect(m.sw).toBeLessThanOrEqual(m.iw);
  expect(m.sh).toBeLessThanOrEqual(m.ih);
  // Scrolling attempts must not move the page.
  await page.mouse.wheel(0, 800);
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
}

async function settle(page: Page, ms = 1800) { await page.waitForTimeout(ms); }

async function waitLevel(page: Page, level: string) {
  await page.waitForFunction((l) => window.__hub.level() === l && window.__hub.state() === 'play', level, { timeout: 120_000 });
}

test('boots cleanly and the canvas fills the viewport @desktop', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page);
  await assertFillsViewport(page);
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/spawn.png` });
  console.log(`tier: ${await page.evaluate(() => window.__hub.tier())}`);
  // Luc's sculpted model must load; the primitive body is only a fallback.
  expect((await page.evaluate(() => window.__hub.debug())).player).toBe('model');
  expect(errors).toEqual([]);
});

test('each door enters and exits by keyboard, and every project card opens @desktop', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await boot(page);
  for (const id of IDS) {
    // Walk-up position in front of the door, then the keyboard does the rest.
    expect(await page.evaluate((i) => window.__hub.teleport(i), id)).toBe(true);
    await expect(page.locator('.prompt')).toBeVisible();
    await expect(page.locator('.prompt')).toContainText('Enter');
    await settle(page, 1200);
    await page.screenshot({ path: `${SHOTS}/door-${id}.png` });
    await page.keyboard.press('e');
    await waitLevel(page, id);
    await settle(page, 1500);
    await page.screenshot({ path: `${SHOTS}/inside-${id}.png` });

    const all = (await page.evaluate(() => window.__hub.interactables())).filter((i) => i.kind === 'exhibit' || i.kind === 'screen');
    const entries = content.buildings[id].entries as { title: string }[];
    expect(all.map((e) => e.label).sort()).toEqual(entries.map((e) => e.title).sort());
    // Lab computers with a link dive instead of opening a card; the dive test below covers them.
    const exhibits = all.filter((i) => i.kind === 'exhibit');
    for (const [n, ex] of exhibits.entries()) {
      await page.evaluate((i) => window.__hub.teleport(i), ex.id);
      await page.waitForFunction((i) => window.__hub.nearest() === i, ex.id, { timeout: 10_000 });
      await page.keyboard.press('e');
      const card = page.locator('.card-backdrop');
      await expect(card).toBeVisible();
      await expect(card.locator('h2')).toHaveText(ex.label);
      const url = (entries as { title: string; url: string | null }[]).find((e) => e.title === ex.label)?.url;
      if (url) await expect(card.locator('a.btn-primary')).toHaveAttribute('href', url);
      const image = (entries as { title: string; image: string | null }[]).find((e) => e.title === ex.label)?.image;
      if (image) await expect.poll(() => card.locator('.card-media img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
      if (n === 0) {
        await settle(page, 600);
        await page.screenshot({ path: `${SHOTS}/card-${id}.png` });
      }
      await page.keyboard.press('Escape');
      await expect(card).toBeHidden();
    }

    expect(await page.evaluate((i) => window.__hub.teleport(`${i}:exit`), id)).toBe(true);
    await page.waitForFunction((i) => window.__hub.nearest() === `${i}:exit`, id, { timeout: 10_000 });
    await page.keyboard.press('e');
    await waitLevel(page, 'courtyard');
  }
  expect(errors).toEqual([]);
});

test('F at a lab computer dives into the screen, shows the loading screen, then opens the link @desktop', async ({ page }) => {
  test.setTimeout(600_000);
  const lab = content.buildings['computer-lab'].entries as { title: string; url: string | null; exhibit: string }[];
  const linked = lab.filter((e) => e.url && e.exhibit.startsWith('monitor'));
  expect(linked.map((e) => e.title).sort()).toEqual(['Dragonwilds Field Guide', 'River Garden', 'Undergrowth']);
  for (const entry of linked) {
    const errors = collectErrors(page);
    const host = new URL(entry.url!).origin;
    await page.context().route(`${host}/**`, (r) => r.fulfill({ contentType: 'text/html', body: `<title>stub</title>${entry.title}` }));
    await boot(page);
    await page.evaluate(() => window.__hub.teleport('computer-lab'));
    await page.keyboard.press('e');
    await waitLevel(page, 'computer-lab');
    const ex = (await page.evaluate(() => window.__hub.interactables())).find((i) => i.label === entry.title)!;
    expect(ex.kind).toBe('screen');
    await page.evaluate((i) => window.__hub.teleport(i), ex.id);
    await page.waitForFunction((i) => window.__hub.nearest() === i, ex.id, { timeout: 10_000 });
    await expect(page.locator('.prompt .key')).toHaveText('F');
    const nav = page.waitForURL(entry.url!, { timeout: 15_000 });
    await page.keyboard.press('f');
    // No confirm card: straight into the dive, then the CRT screen names the destination.
    await page.waitForFunction(() => (window.__hub.dive() ?? 0) > 0);
    expect(await page.evaluate(() => window.__hub.cardOpen())).toBe(false);
    await expect(page.locator('.crt h2')).toHaveText(entry.title);
    await nav;
    expect(errors).toEqual([]);
  }
});

test('static links version lists every project and link @desktop', async ({ page }) => {
  const errors = collectErrors(page);
  // Present in the DOM before any script runs (crawlers, screen readers).
  const res = await page.request.get('/');
  const html = await res.text();
  for (const id of IDS) for (const e of content.buildings[id].entries) {
    expect(html).toContain(e.title.replace(/&/g, '&amp;'));
    if (e.url) expect(html).toContain(`href="${e.url}"`);
  }
  // Pinch zoom stays allowed (WCAG 1.4.4); the canvas blocks it itself with touch-action.
  expect(html).not.toMatch(/user-scalable\s*=\s*no/);
  await page.goto('/?links');
  await expect(page.locator('#links')).toBeVisible();
  await expect(page.locator('#links a.links-home')).toHaveAttribute('href', '/');
  await expect(page.locator('#links .links-section')).toHaveCount(4);
  await assertFillsViewport(page);
  await page.screenshot({ path: `${SHOTS}/links.png` });
  expect(errors).toEqual([]);
});

test('skip to links opens the list and returns to the courtyard @desktop', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Skip to links' }).click();
  await expect(page.locator('#links.is-open')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the courtyard' }).click();
  await expect(page.locator('#links')).toHaveClass(/is-hidden/);
  await page.waitForFunction(() => window.__hub.state() === 'play');
  expect(errors).toEqual([]);
});

test('boots on a phone with no scrolling and touch controls @mobile', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page);
  await assertFillsViewport(page);
  await expect(page.locator('.stick-zone.left')).toBeVisible();
  await expect(page.locator('.stick-zone.right')).toBeVisible();
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/mobile-spawn.png` });
  // Tapping the prompt enters, exactly like pressing E.
  await page.evaluate(() => window.__hub.teleport('music-studio'));
  await expect(page.locator('.prompt')).toBeVisible();
  await page.locator('.prompt').tap();
  await waitLevel(page, 'music-studio');
  await settle(page, 1200);
  await page.screenshot({ path: `${SHOTS}/mobile-inside-music-studio.png` });
  expect(errors).toEqual([]);
});

test('on a phone, the project card buttons take taps over the thumbsticks @mobile', async ({ page }) => {
  const errors = collectErrors(page);
  // Lab computers dive straight to their link now, so the music studio's SiGz card stands in.
  await page.context().route('https://sigzmusic.com/**', (r) => r.fulfill({ body: 'sigz' }));
  await boot(page);
  await page.evaluate(() => window.__hub.teleport('music-studio'));
  await page.locator('.prompt').tap();
  await waitLevel(page, 'music-studio');
  const ex = (await page.evaluate(() => window.__hub.interactables())).find((i) => i.label === 'SiGz')!;
  expect(ex).toBeTruthy();
  await page.evaluate((i) => window.__hub.teleport(i), ex.id);
  await page.waitForFunction((i) => window.__hub.nearest() === i, ex.id, { timeout: 10_000 });
  await page.locator('.prompt').tap();
  const card = page.locator('.card-backdrop');
  await expect(card).toBeVisible();
  await settle(page, 600);
  await page.screenshot({ path: `${SHOTS}/mobile-card-music-studio.png` });
  // A real tap lands on whatever is on top at that point, so the button itself must be on top.
  const open = card.locator('a.btn-primary');
  const [popup] = await Promise.all([page.waitForEvent('popup'), open.tap({ timeout: 5_000 })]);
  await popup.waitForURL('https://sigzmusic.com/');
  await popup.close();
  await card.getByRole('button', { name: 'Back to the room' }).tap({ timeout: 5_000 });
  await expect(card).toBeHidden();
  expect(errors).toEqual([]);
});

test('Esc and the gear open settings; Space and Enter on its buttons work like a click @desktop', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page);
  const settings = page.locator('.settings');
  const panel = page.locator('.map-panel');
  await expect(settings).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(settings).toBeVisible();
  // Walking is paused while settings is open: holding W goes nowhere.
  const before = await page.evaluate(() => window.__hub.pos());
  await page.keyboard.down('w');
  await page.waitForTimeout(700);
  await page.keyboard.up('w');
  expect(await page.evaluate(() => window.__hub.pos())).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  const gear = page.getByRole('button', { name: 'Settings (Esc)' });
  await gear.focus();
  await page.keyboard.press(' ');
  await expect(settings).toBeVisible();
  await page.getByRole('button', { name: 'Map of the courtyard' }).focus();
  await page.keyboard.press('Enter');
  await expect(settings).toBeHidden();
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(settings).toBeHidden();
  expect(errors).toEqual([]);
});

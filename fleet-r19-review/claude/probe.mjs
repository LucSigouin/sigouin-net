import { chromium } from '/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules/playwright-core/index.mjs';

const BASE = 'http://127.0.0.1:5199';
const OUT = '/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r19-review/claude/shots';
const report = {};

const browser = await chromium.launch({ executablePath: '/Users/ls/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });

async function probe(path, name, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => reqs.push({ t: Date.now(), url: r.url(), type: r.resourceType() }));
  const t0 = Date.now();
  await page.goto(BASE + path, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  // requests fired before the overture curtain finishes (~2550ms)
  await page.waitForTimeout(3600);
  await page.screenshot({ path: `${OUT}/${name}-${w}.png` });

  const info = await page.evaluate(() => {
    const de = document.documentElement;
    const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
      .map(el => ({ tag: el.tagName, cls: el.className?.toString().slice(0, 40), txt: (el.textContent || '').trim().slice(0, 34), ariaLabel: el.getAttribute('aria-label') }));
    const vids = [...document.querySelectorAll('video')].map(v => ({
      preload: v.preload, autoplay: v.autoplay, poster: !!v.getAttribute('poster'),
      ariaHidden: v.getAttribute('aria-hidden'), srcs: v.querySelectorAll('source').length,
      paused: v.paused, muted: v.muted, loop: v.loop
    }));
    const stage = document.querySelector('#stage');
    return {
      scrollH: de.scrollHeight, clientH: de.clientHeight,
      scrollW: de.scrollWidth, clientW: de.clientWidth,
      overture: de.dataset.overture,
      focusables, vids,
      focusableCount: focusables.length,
      stageAria: stage ? { live: stage.getAttribute('aria-live'), label: stage.getAttribute('aria-label'), role: stage.getAttribute('role'), tabindex: stage.getAttribute('tabindex') } : null,
      railRoles: [...document.querySelectorAll('#rail .row')].slice(0, 3).map(b => ({ ac: b.getAttribute('aria-current'), role: b.getAttribute('role'), txt: b.textContent.trim().slice(0, 30) })),
      railCount: document.querySelectorAll('#rail .row').length,
      stageOpen: document.body.classList.contains('stage-open'),
      dots: [...document.querySelectorAll('#dots button')].map(b => ({ ac: b.getAttribute('aria-current'), role: b.getAttribute('role'), label: b.getAttribute('aria-label'), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height })),
      backBtn: (() => { const b = document.querySelector('.stage__back'); return b ? { display: getComputedStyle(b).display, rect: b.getBoundingClientRect().toJSON() } : null; })(),
      liveRegionUpdates: null
    };
  });

  // tab order walk
  const tabOrder = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    const el = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      return { tag: a.tagName, cls: a.className?.toString().slice(0, 36), txt: (a.textContent || '').trim().slice(0, 30), label: a.getAttribute('aria-label') };
    });
    tabOrder.push(el);
  }

  report[name + '-' + w] = { loadMs, ...info, tabOrder, reqsBefore3s: reqs.length, reqUrls: reqs.map(r => r.url.replace(BASE, '')) };
  await ctx.close();
}

await probe('/', 'index', 1440, 900);
await probe('/', 'index', 390, 844);
await probe('/process/', 'process', 1440, 900);
await probe('/process/', 'process', 390, 844);

// phone: does clicking a rail row open the stage, and is Back reachable
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3400);
  await page.locator('#rail .row').nth(2).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/index-390-stage-open.png` });
  const after = await page.evaluate(() => {
    const b = document.querySelector('.stage__back');
    const r = b.getBoundingClientRect();
    return {
      stageOpen: document.body.classList.contains('stage-open'),
      backVisible: r.top >= 0 && r.bottom <= innerHeight && r.width > 0,
      backRect: r.toJSON(),
      focusAfterClick: document.activeElement?.className?.toString().slice(0, 40),
      railStillFocusable: [...document.querySelectorAll('#rail .row')].every(x => x.tabIndex !== -1),
      railHidden: getComputedStyle(document.querySelector('.rail-col')).visibility,
      stageScrollH: document.querySelector('#stage').scrollHeight,
      stageClientH: document.querySelector('#stage').clientHeight
    };
  });
  report['phone-stage-open'] = after;
  await ctx.close();
}

// reduced motion pass
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/index-1440-reduced.png` });
  report['reduced'] = await page.evaluate(() => ({
    overture: document.documentElement.dataset.overture,
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
    vids: [...document.querySelectorAll('video')].map(v => ({ autoplay: v.autoplay, paused: v.paused }))
  }));
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 1));

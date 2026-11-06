// Card screenshots for the hub's project cards, taken from the live sites.
//   node probe/card-shots.mjs            → public/shots/<name>.jpg (1280×720, JPEG q80)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = [
  ['undergrowth', 'https://undergrowth.pages.dev/', 6000],
  ['dragonwilds', 'https://dragonwilds.sigouin.net/', 3000],
  ['sigz', 'https://sigzmusic.com/', 4000],
  ['teetimes', 'https://teetime.sigouin.net/', 6000],
  ['process', 'https://sigouin.net/process/', 3000],
];
const only = process.argv.slice(2);
mkdirSync('public/shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [name, url, wait] of SHOTS) {
  if (only.length && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `public/shots/${name}.jpg`, type: 'jpeg', quality: 80 });
  console.log(name, 'ok');
  await page.close();
}
await browser.close();

// Node side of the hub probe: build, a tiny static server (hub under /hub/, a stub landing
// page at /), headless Chromium on the real GPU, a GPU lock, and a stdlib-only PNG codec.
import { chromium, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const PROBE = path.dirname(new URL(import.meta.url).pathname);
export const ROOT = path.dirname(PROBE);
export const DIST = path.join(PROBE, '.dist');
export const GPU_ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
export const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: devices['Pixel 7'],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Production build served under /hub/, the way sigouin.net serves it, so leaving the garden works. */
export function build() {
  const t = Date.now();
  execFileSync('npx', ['vite', 'build', '--base=/hub/', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit' });
  return Date.now() - t;
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
export const LANDING_STUB = '<!doctype html><title>landing stub</title><body id="landing-stub">Landing page stub (the probe server stands in for sigouin.net).</body>';

export function serve(root = DIST) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/hub') { res.writeHead(301, { location: '/hub/' }); return res.end(); }
    if (!p.startsWith('/hub/')) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(LANDING_STUB); }
    let f = path.join(root, p.slice(5));
    if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (p.endsWith('/')) f = path.join(f, 'index.html');
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ url: `http://127.0.0.1:${port}/hub/`, close: () => new Promise((r) => server.close(r)) });
  }));
}

/** Only one headless GPU run at a time on this Mac, or the numbers skew each other. */
export async function withGpuLock(who, fn, waitMs = 600_000) {
  const dir = path.join(PROBE, '.gpu-lock'), t = Date.now();
  for (;;) {
    try { fs.mkdirSync(dir); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // A lock whose owner process has died (a crash skips the finally below) is stale: take it over.
      const owners = fs.existsSync(dir) ? fs.readdirSync(dir).map((n) => Number(n.split('-').pop())).filter(Boolean) : [];
      const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; } };
      if (owners.length && !owners.some(alive)) { fs.rmSync(dir, { recursive: true, force: true }); continue; }
      if (Date.now() - t > waitMs) throw new Error(`GPU lock still held after ${waitMs / 1000}s: ${fs.readdirSync(dir).join(', ')}`);
      await sleep(5000);
    }
  }
  fs.writeFileSync(path.join(dir, `${who}-${process.pid}`), new Date().toISOString());
  try { return await fn(); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

export const launch = () => chromium.launch({ args: GPU_ARGS });

/** Whole-Mac GPU busy %, from the IOAccelerator driver stats (WindowServer and CNVS included). */
export const gpuBusy = () => { try { return +execFileSync('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator']).toString().match(/"Device Utilization %"=(\d+)/)[1]; } catch { return null; } };

/** Opens the hub with the probe, waits for play, and (by default) freezes it. */
export async function openHub(browser, url, device, { freeze = true, phase = 0, query = '' } = {}) {
  const ctx = await browser.newContext(DEVICES[device]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const t = Date.now();
  await page.goto(`${url}?probe${freeze ? `&freeze&phase=${phase}` : ''}${query}`);
  await page.waitForFunction(() => window.__probe && window.__hub?.state?.() === 'play', null, { timeout: 120_000 });
  if (freeze) await page.waitForFunction(() => window.__probe.frozen, null, { timeout: 10_000 });
  return { ctx, page, errors, bootMs: Date.now() - t };
}

export const pngBytes = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
export function savePng(dataUrl, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pngBytes(dataUrl));
}

// ---- PNG codec (8-bit grey, RGB or RGBA, not interlaced: what Chromium writes) ----

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let w = 0, h = 0, type = 0;
  const idat = [];
  for (let o = 8; o < buf.length;) {
    const len = buf.readUInt32BE(o), name = buf.toString('ascii', o + 4, o + 8), data = buf.subarray(o + 8, o + 8 + len);
    if (name === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error('only 8-bit, non-interlaced PNGs');
    } else if (name === 'IDAT') idat.push(data);
    else if (name === 'IEND') break;
    o += 12 + len;
  }
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (!bpp) throw new Error(`PNG colour type ${type} not supported`);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp;
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp, d = (y * w + x) * 4;
      if (bpp >= 3) { out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = bpp === 4 ? cur[s + 3] : 255; }
      else { out[d] = out[d + 1] = out[d + 2] = cur[s]; out[d + 3] = bpp === 2 ? cur[s + 1] : 255; }
    }
    [prev, cur] = [cur, prev];
  }
  return { width: w, height: h, data: out };
}

export function encodePng({ width: w, height: h, data }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (name, body) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(name, 4, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), body])) >>> 0, 0);
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Pixels whose largest channel difference is above `tol` (0..255). Also returns a diff image. */
export function diffPixels(a, b, tol = 0) {
  if (a.width !== b.width || a.height !== b.height) return { count: -1, reason: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  const out = Buffer.alloc(a.data.length);
  let count = 0, maxDelta = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > maxDelta) maxDelta = d;
    const g = (a.data[i] * 0.3 + a.data[i + 1] * 0.59 + a.data[i + 2] * 0.11) * 0.35;
    if (d > tol) { count++; out[i] = 255; out[i + 1] = 40; out[i + 2] = 200; }
    else { out[i] = out[i + 1] = out[i + 2] = g; }
    out[i + 3] = 255;
  }
  return { count, maxDelta, total: a.data.length / 4, image: { width: a.width, height: a.height, data: out } };
}

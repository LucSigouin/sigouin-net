// Small JPEG thumbnails for the notes page, so it loads fast on a phone.
// Every <img src="../shots/…png"> becomes src="thumbs/….jpg" with data-full pointing at the
// original, which the lightbox opens on tap. Safe to re-run after adding entries.
//   node probe/notes/thumbs.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const NOTES = path.dirname(new URL(import.meta.url).pathname);
const page = path.join(NOTES, 'index.html');
let html = fs.readFileSync(page, 'utf8');
let made = 0, bytes = 0;
html = html.replace(/<img loading="lazy" src="\.\.\/shots\/([^"]+)\.png"/g, (_m, rel) => {
  const thumb = path.join(NOTES, 'thumbs', `${rel}.jpg`);
  if (!fs.existsSync(thumb)) {
    fs.mkdirSync(path.dirname(thumb), { recursive: true });
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '720', path.join(NOTES, '..', 'shots', `${rel}.png`), '--out', thumb], { stdio: 'ignore' });
    made++;
  }
  bytes += fs.statSync(thumb).size;
  return `<img loading="lazy" src="thumbs/${rel}.jpg" data-full="../shots/${rel}.png"`;
});
fs.writeFileSync(page, html);
const count = (html.match(/src="thumbs\//g) ?? []).length;
console.log(`${count} images use thumbnails (${made} new), ${(bytes / 1e6).toFixed(1)} MB of thumbnails for the rewritten ones`);

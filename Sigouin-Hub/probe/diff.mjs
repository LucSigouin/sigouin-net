// Visual diff of a tour run against the approved baseline (probe/baseline/).
//
//   node probe/diff.mjs [run-dir|latest]            compare, write diff images, exit 1 past the threshold
//   node probe/diff.mjs --approve [run-dir|latest]  make that run's frozen shots the new baseline
//   --tol 6     a pixel counts as different when a colour channel moves more than this (0..255)
//   --max 0.05  percent of pixels allowed to differ per image before it fails
//
// Compared: <device>/views/** and <device>/orbits/** (frozen, repeatable). Not compared: play/
// (walked positions) and cost/ (timings).
import fs from 'node:fs';
import path from 'node:path';
import { PROBE, decodePng, diffPixels, encodePng } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const approve = argv.includes('--approve');
const tol = Number(opt('tol', 6)), max = Number(opt('max', 0.05));
const BASE = path.join(PROBE, 'baseline'), SHOTS = path.join(PROBE, 'shots');
const pos = argv.filter((a, i) => !a.startsWith('--') && !['--tol', '--max'].includes(argv[i - 1]));

function latest() {
  // Newest by when the run finished (run.json), not by folder name.
  const at = (d) => fs.statSync(path.join(SHOTS, d, 'run.json')).mtimeMs;
  const runs = fs.readdirSync(SHOTS).filter((d) => /^\d{8}-\d{6}/.test(d) && fs.existsSync(path.join(SHOTS, d, 'run.json'))).sort((a, b) => at(a) - at(b));
  if (!runs.length) throw new Error('no tour runs in probe/shots yet: run node probe/tour.mjs');
  return path.join(SHOTS, runs[runs.length - 1]);
}
const runDir = !pos[0] || pos[0] === 'latest' ? latest() : path.resolve(pos[0]);

const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
const repeatable = (rel) => /^[^/]+\/(views|orbits)\/.+\.png$/.test(rel);

if (approve) {
  const files = walk(runDir).map((f) => path.relative(runDir, f)).filter(repeatable);
  fs.rmSync(BASE, { recursive: true, force: true });
  for (const f of files) { fs.mkdirSync(path.dirname(path.join(BASE, f)), { recursive: true }); fs.copyFileSync(path.join(runDir, f), path.join(BASE, f)); }
  fs.writeFileSync(path.join(BASE, 'approved.json'), JSON.stringify({ from: path.relative(PROBE, runDir), at: new Date().toISOString(), files: files.length }, null, 2));
  console.log(`baseline <- ${path.relative(process.cwd(), runDir)}: ${files.length} images`);
  process.exit(0);
}

if (!fs.existsSync(BASE)) { console.error('no baseline yet: node probe/diff.mjs --approve <run>'); process.exit(2); }
// A --quick tour shoots a subset, so its missing files are skipped; a full run must have them all.
const quickRun = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')).quick;
const baseFiles = walk(BASE).map((f) => path.relative(BASE, f)).filter(repeatable).filter((f) => !quickRun || fs.existsSync(path.join(runDir, f)));
const out = path.join(runDir, 'diff');
fs.rmSync(out, { recursive: true, force: true });
const rows = [];
for (const f of baseFiles) {
  const cur = path.join(runDir, f);
  if (!fs.existsSync(cur)) { rows.push({ file: f, status: 'missing' }); continue; }
  const d = diffPixels(decodePng(fs.readFileSync(path.join(BASE, f))), decodePng(fs.readFileSync(cur)), tol);
  if (d.count < 0) { rows.push({ file: f, status: 'size', reason: d.reason }); continue; }
  const pct = (d.count / d.total) * 100;
  const status = pct > max ? 'FAIL' : d.count ? 'drift' : 'same';
  if (d.count) { fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true }); fs.writeFileSync(path.join(out, f), encodePng(d.image)); }
  rows.push({ file: f, status, differentPixels: d.count, pct: +pct.toFixed(4), maxDelta: d.maxDelta });
}
const bad = rows.filter((r) => ['FAIL', 'missing', 'size'].includes(r.status));
const summary = { run: path.relative(PROBE, runDir), quickRun, baseline: 'probe/baseline', tol, maxPct: max, compared: rows.length, same: rows.filter((r) => r.status === 'same').length, drift: rows.filter((r) => r.status === 'drift').length, failed: bad.length, rows };
fs.mkdirSync(runDir, { recursive: true });
fs.writeFileSync(path.join(runDir, 'diff.json'), JSON.stringify(summary, null, 2));
console.log(`compared ${rows.length} images (tol ${tol}, max ${max}%): ${summary.same} same, ${summary.drift} small drift, ${bad.length} failed`);
for (const r of bad.slice(0, 30)) console.log(`  ${r.status.padEnd(7)} ${r.file}${r.pct !== undefined ? `  ${r.differentPixels} px (${r.pct}%), max delta ${r.maxDelta}` : r.reason ? `  ${r.reason}` : ''}`);
if (bad.length > 30) console.log(`  ... and ${bad.length - 30} more (see diff.json)`);
if (bad.length) console.log(`diff images: ${path.relative(process.cwd(), out)}/`);
process.exit(bad.length ? 1 : 0);

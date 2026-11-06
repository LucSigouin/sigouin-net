// Mutant tests for the probe's own checks: break one thing on purpose, run the check that
// guards it, and require it to FAIL; then put the code back and require it to PASS.
//
//   node probe/mutants.mjs            all mutants
//   node probe/mutants.mjs freeze     only the ones whose name contains "freeze"
//
// Source edits are exact string swaps with a backup, restored in a finally block.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PROBE, ROOT } from './lib.mjs';

const gate = (grep) => ['npx', 'playwright', 'test', 'tests/probe.spec.ts', '--project=desktop', '-g', grep];
const MUTANTS = [
  {
    name: 'freeze: world time not pinned',
    guard: 'gate test "frozen shots are pixel-identical across two page loads"',
    edits: [{ file: 'src/probe/probe.ts', find: '    app.time = T0;\n    u.uTime.value = T0;\n', replace: '' }],
    check: gate('pixel-identical'),
  },
  {
    name: 'bundle: probe imported statically into the main chunk',
    guard: 'gate test "a normal visit downloads no probe code"',
    edits: [
      { file: 'src/main.ts', find: "import type { HubApi } from './hubApi';", replace: "import type { HubApi } from './hubApi';\nimport * as probeStatic from './probe/probe';" },
      { file: 'src/main.ts', find: "const probe = params.has('probe') ? await import('./probe/probe') : null;", replace: "const probe = params.has('probe') ? probeStatic : null;" },
    ],
    check: gate('downloads no probe'),
  },
  {
    name: 'game: the E key no longer opens doors',
    guard: 'gate test "scripted play" (the expect step)',
    edits: [{ file: 'src/core/app.ts', find: "if (inp.consume('e') || inp.consume('enter')) {", replace: "if (inp.consume('e-broken')) {" }],
    check: gate('scripted play'),
  },
  {
    name: 'game: a crate blocks the Music Studio doorstep',
    guard: 'gate test "scripted play" (walkTo step)',
    edits: [{ file: 'src/buildings/buildings.ts', find: "    if (spec.id === 'music-studio') {\n", replace: "    if (spec.id === 'music-studio') {\n      { const [bx, bz] = toWorld(spec, 0, spec.depth / 2 + 1.5); colliders.box(bx, bz, 3, 1.5, spec.yaw, 2); }\n" }],
    check: gate('scripted play'),
  },
  {
    name: 'visual diff: fountain moved 0.5 m',
    guard: 'node probe/diff.mjs against probe/baseline',
    run: () => {
      const id = `mutant-fountain-${Date.now()}`;
      const tour = sh(['node', 'probe/tour.mjs', '--quick', '--no-build', '--move', 'fountain-stone=0.5,0,0', '--id', id]);
      const diff = sh(['node', 'probe/diff.mjs', path.join(PROBE, 'shots', id)]);
      return { code: diff.code, out: `${tail(tour.out, 3)}\n${tail(diff.out, 12)}` };
    },
    clean: () => {
      const id = `mutant-clean-${Date.now()}`;
      sh(['node', 'probe/tour.mjs', '--quick', '--no-build', '--id', id]);
      return sh(['node', 'probe/diff.mjs', path.join(PROBE, 'shots', id)]);
    },
  },
];

function sh(cmd) {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}
const tail = (s, n) => s.trim().split('\n').slice(-n).join('\n');

function apply(edits) {
  const saved = new Map();
  for (const e of edits) {
    const f = path.join(ROOT, e.file);
    if (!saved.has(f)) saved.set(f, fs.readFileSync(f, 'utf8'));
    const src = fs.readFileSync(f, 'utf8');
    if (!src.includes(e.find)) throw new Error(`mutant does not apply: "${e.find.slice(0, 60)}" not found in ${e.file}`);
    fs.writeFileSync(f, src.replace(e.find, e.replace));
  }
  return () => { for (const [f, s] of saved) fs.writeFileSync(f, s); };
}

const only = process.argv[2];
const results = [];
for (const m of MUTANTS.filter((x) => !only || x.name.includes(only))) {
  console.log(`\n=== ${m.name}\n    guarded by: ${m.guard}`);
  let broken, clean;
  if (m.run) {
    broken = m.run();
    clean = m.clean();
  } else {
    const restore = apply(m.edits);
    try { broken = sh(m.check); } finally { restore(); }
    clean = sh(m.check);
  }
  const ok = broken.code !== 0 && clean.code === 0;
  console.log(`    broken: exit ${broken.code} ${broken.code !== 0 ? '(RED, good)' : '(still green: the check MISSED it)'}`);
  console.log(tail(broken.out, 40).replace(/^/gm, '      | '));
  console.log(`    restored: exit ${clean.code} ${clean.code === 0 ? '(green)' : '(RED after restore!)'}`);
  if (clean.code !== 0) console.log(tail(clean.out, 8).replace(/^/gm, '      | '));
  results.push({ name: m.name, guard: m.guard, brokenExit: broken.code, restoredExit: clean.code, pass: ok, brokenTail: tail(broken.out, 40), restoredTail: tail(clean.out, 4) });
}
fs.mkdirSync(path.join(PROBE, 'data'), { recursive: true });
fs.writeFileSync(path.join(PROBE, 'data', 'mutants.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} mutants caught and cleanly restored`);
process.exitCode = results.every((r) => r.pass) ? 0 : 1;

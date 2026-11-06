# Hub Probe: full self-testing for the Sigouin Hub

You are building a **probe layer** for the Sigouin Hub, a walkable Three.js courtyard served at
https://sigouin.net/hub/. The goal: an AI agent can load the hub headless, read the whole scene as
data, see it from any angle through see-through layers, play it with scripted input, and check
every result, all without a human guiding it. You also keep an HTML "patch notes" page that
documents everything you do, with screenshots.

You share no context with the session that wrote this plan. Everything you need is here.

---

## 0. Ground rules (read first, they are Luc's standing rules)

- **Project root:** `Sigouin-Hub/` (TypeScript +
  Vite + three 0.186). Not a git repo. Work only inside this folder.
- **Playwright is approved here, headless only** (Luc, 2026-09-23). It is already a dev dependency
  (`@playwright/test` 1.63.0), and Chromium + WebKit are installed. Never open the system browser
  (`open`, `osascript`, and so on). Never install other browser tooling.
- **Showing Luc a page:** use the CNVS browser node: `cnvs_open_browser` with
  `focusAfter: false` and `page: "4"`. Never pan to it. Then say in one line:
  `Live on page 4: <node name>` (check the real page with `cnvs_state`, and don't claim page 4
  if it landed elsewhere).
- **Do not deploy.** Nothing goes to sigouin.net without Luc's OK. If he later says deploy: build
  with `npx vite build --base=/hub/`, copy `dist/` (minus `dist/_headers`) into
  `../dev-render-only/hub/` and `../site/hub/`, run `CONFIRM_DEPLOY=1 ../deploy/deploy.sh`, then
  follow the edge-cache rule in `../releases/hub-medium-20260923/README.md` (wait until `/hub/?cb=…`
  shows the new entry file before requesting any asset without a query string).
- **"Done" means verified.** Show real command output. Mutant-test every harness: break the thing it
  guards and show it goes red.
- **Voice:** plain words, short sentences, no em dashes, no jargon without a 5-word definition.
  This applies to the patch-notes page too.
- **Never edit** `.env` or lock files. Use `npm --cache "$TMPDIR/npmcache"` for npm commands.

## 1. What already exists

- `window.__hub` (typed in `src/hubApi.ts`, built in `src/core/app.ts` around line 450):
  `state()`, `bootProgress`, `level()`, `tier()`, `cardOpen()`, `nearest()`, `teleport(id)`,
  `pauseDay(phase)`, `interactables()`, `view(pos, lookAt)`, `setVisible(name, on)`, `debug()`.
  Warning: `debug()` reads back the whole render target and scans every pixel. It is slow and
  stalls the GPU, so never call it inside a timing window.
- Quality tiers in `src/core/quality.ts`: default **medium**; `?quality=low|medium|high` overrides;
  a HUD button saves `localStorage['hub-quality']`.
- Outdoor part names for `setVisible`: meadow, bushes, rocks, track, terrain, countryside,
  oak-a-leaf, oak-b-leaf, cypress-leaf, hill-cypress-leaf, hill-oak-leaf, grass, bed-foliage,
  bed-blooms, mountains.
- Tests in `tests/` (`hub.spec.ts`, `site.spec.ts`, `look.spec.ts`, `perf.spec.ts`,
  `leave.spec.ts`, `atlas.spec.ts`). `playwright.config.ts` builds, serves `vite preview` on :5191,
  and launches Chromium with the real Mac GPU:
  `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`.
- **Working smoke test:** `probe/smoke.mjs` (run `node probe/smoke.mjs`). It loads the live hub
  headless, freezes the time of day, reads the interactables, walks with W, moves the camera to an
  aerial view, and saves 3 PNGs to `probe/shots/smoke/`. Last run: ready in 6.8 s, Apple M5 Metal,
  4 buildings found, no errors, 31 fps at 1440x900 on Medium.
- Open question to settle with the probe: two identical headless runs at 1440x900 Medium gave 31 and
  47 fps, while an earlier 1280x720 run in a CNVS browser showed 57-60. Find out the true number and
  why it swings (warm-up, shader compile, GPU sharing, headless frame pacing).

## 2. What to build

All probe code loads **only** with `?probe` in the URL, through a dynamic `import()`, so normal
visitors download nothing extra. Prove it: compare the production bundle's file list and sizes
before and after (the main chunks must not grow by more than 1 KB).

### Phase A: frozen mode (repeatable pictures)
`?probe&freeze`: fixed time of day, wind and foliage sway stopped, fountain and particles paused,
a fixed random seed, pixel ratio 1, fixed canvas size. Two shots of the same view must be
pixel-identical (show the diff count = 0).

### Phase B: scene map as data
`__probe.manifest()` returns JSON for every object in the current level: path/name, type, world
position, bounding box, triangle count, draw calls, material names, visible flag, and which named
part it belongs to. Save it with each run. Add `__probe.find(query)` to look objects up by name.

### Phase C: camera and screenshots
- `__probe.shot({ from, lookAt, fov, layer, size })` renders one frame and returns a PNG data URL.
- Named viewpoints: spawn, each building's door, fountain, aerial, the four corners.
- `__probe.orbit(target, { angles: 8, heights: [low, eye, high] })` for every angle of an object.

### Phase D: see-through layers
Each is a switch the shot can use:

| Layer | Shows |
|---|---|
| `beauty` | The normal picture |
| `id` | Each object a flat unique colour, plus a legend in the JSON, so a pixel maps to an object |
| `depth` | Distance as greyscale |
| `normals` | Surface direction as colour (finds flipped or broken faces) |
| `wireframe` | Mesh lines |
| `walkable` | Where the player can stand, and collision walls (from `src/core/collision.ts`) |
| `triggers` | Door and interaction zones |
| `cost` | Heatmap of GPU time per object or part (use `EXT_disjoint_timer_query_webgl2` when present, otherwise time the frame with each part hidden, measured A/B/A) |

### Phase E: scripted play
`__probe.run(steps)` with steps such as `{ walkTo: 'music-studio' }`, `{ press: 'KeyE' }`,
`{ wait: 500 }`, `{ expect: { level: 'musicStudio' } }`, `{ expect: { cardOpen: true } }`,
`{ shot: 'name' }`. Each step returns pass or fail, with the reason. Cover: walk to each building,
enter it, open its card, leave, walk out of the garden (which returns to the landing page).

### Phase F: tour runner and visual diffs
- `probe/tour.mjs`: one command that runs every viewpoint x layer, the orbits, the scripted plays
  and a perf pass, on desktop (1440x900) and phone (Pixel 7 preset).
- Output: `probe/shots/<run-id>/` (run-id = date-time) with the PNGs, `manifest.json`,
  `perf.json`, `steps.json`, and a `contact.html` grid of every shot.
- `probe/baseline/` holds approved shots. `probe/diff.mjs` compares a run against the baseline,
  writes diff images, and exits non-zero past a threshold. Mutant-test it (move one object, show red).
- Add `tests/probe.spec.ts` so `npx playwright test tests/probe.spec.ts --project=desktop` runs a
  short version as a gate.

**All Playwright images go under `probe/shots/`.** Nothing in the scratchpad or `/tmp`.

## 3. The patch-notes page (Luc wants to see everything)

`probe/notes/index.html`: one self-contained page (inline CSS, no external requests) that reads
like app patch notes.

- Newest entry first. One entry per milestone (each phase above, plus any bug you find).
- Each entry: version tag and time, a one-line headline, **what changed**, **why**, **how it was
  checked** (the real command and its real output, trimmed), numbers (fps, sizes, counts),
  **screenshots** (relative `<img>` paths into `../shots/...`, click to enlarge), and anything that
  failed or is still unverified.
- A top section: the plan (this file, summarised), a phase checklist with status, and the open
  questions.
- Layout: full screen, no centred narrow box. Full-bleed header, multi-column grid that reflows
  (`repeat(auto-fit, minmax(…, 1fr))`), padding `clamp(1rem, 4vw, 3rem)`. Screenshot grids use the
  full width. Dark theme to match the hub's evening look is fine.
- Update it after every milestone, not at the end. Open it once as a CNVS browser node (rules
  above) and refresh that node after each update.

## 4. Self-check before you call any phase done

1. The probe costs visitors nothing (`?probe` only, dynamic import, bundle diff shown).
2. Frozen shots are pixel-identical across two runs (diff count 0 shown).
3. Every harness went red when broken on purpose (mutant shown in the notes).
4. Existing tests still pass: `npx playwright test --project=desktop` (paste the summary).
5. `npm run build` passes (tsc + vite).
6. The patch notes show the screenshots and real output for every phase.

If something can't be verified, say so in the notes and to Luc. Don't round it up to done.

## 5. When finished

Report to Luc in about 6 lines: what exists, the one command to run a full tour, where the shots
and notes are, the answer to the 31 vs 60 fps question, and anything unverified. Then stop. No
deploy.

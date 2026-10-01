# Handoff (2026-09-23)

Built from `../HUB-GAME-PROMPT.md` (reference image: `personal/.cnvs/images/39d739d7…png`).
Read `README.md` first for layout, content editing and controls.

## State

- `npm test`: 5/5 Playwright tests pass (desktop + mobile), screenshots in `tests/screenshots/`.
- Suite mutant-tested: breaking door entry, card open, console, scroll, or boot bar each turns it red.
- Not a git repo. Live at https://sigouin.net/hub/ (see `../releases/` for each deploy).

## Realistic planting (2026-09-23)

- All plants are now alpha-cut leaf and petal cards textured from one painted atlas
  (`src/world/foliage.ts`, 16 cells, hand-built mipmaps). Trees are grown from a branch
  skeleton (`src/world/trees.ts`); card and tube builders live in `src/world/plantGeo.ts`.
- Foliage shading keeps authored normals on both faces and adds sun glow through leaves
  (`applyWind(..., translucency)` in `src/core/shaders.ts`; sun uniforms set in `courtyard.ts`).
- Plants add 0 KB of downloads (the character GLB is the only asset file). 57-60 fps on High
  at 1440×900 (M5).
- `tests/look.spec.ts` shoots close-ups (beds, oak, cypress, fountain ring, wide) and logs fps;
  `LOOK_QUERY='?quality=low'` for the Low tier. `tests/atlas.spec.ts` dumps the atlas (`/?atlas`).

## Character from Luc's picture (2026-09-23)

- Model: Tripo Studio (web credits; the API key's pool is separate and empty), retopo 10k quads,
  auto-rigged with a Mixamo skeleton. Exports had no animation data.
- Sources in `art/character/` (`idle|walk|run.glb`, 9.6 MB each, identical rig). Shipped file:
  `public/models/luc.glb` (1.75 MB; 2048 textures since 2026-09-23, was 1024 / 907 KB) via
  `npx @gltf-transform/cli optimize art/character/idle.glb public/models/luc.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false`.
- `src/character/model.ts` loads it and retargets the hand-authored clips (idle, walk, run, wave,
  openDoor) onto the Mixamo bones, straightening the A-pose rest. Load failure keeps the
  primitive body; `hub.spec` asserts `debug().player === 'model'` (mutant-tested: hiding the file
  turns it red).

## Surroundings and horizon (2026-09-23)

- `src/world/surroundings.ts`: long meadow grass and wildflowers past the mown lawn (instanced
  crossed cards in 40 m chunks so off-screen grass is culled), laurel/box bushes, a dirt track
  from the entrance to the village, textured boulders, and `nearTreeSpots()` groves drawn with
  the full-detail tree variants. `groundY()` gives ground height inside and outside the floor.
- `backdrop.ts`: mountains ring the whole valley; `fieldAt()` farmland patchwork with hedgerow
  tree lines; village, farmsteads (night-glow windows) and two windmills; ground detail texture.
- Starts on Medium (HUD button switches to High), always starts muted. `PERF=1 npx playwright test tests/perf.spec.ts` prints fps
  with each outdoor part hidden (`__hub.setVisible(name, on)`). Clean reading: 54-60 fps at
  1440×900 on the M5; readings drop to 30s when another game shares the GPU.

## Gotchas

- Local servers (vite preview, Playwright webServer) need the sandbox off: listen gets EPERM.
- Headless Chromium on this Mac uses the real GPU (`--use-angle=metal`); config picks it automatically.
- Any NaN in a shader smears across the whole frame through bloom. Guard every `pow()` base.
  A sanitize pass before bloom (`src/core/post.ts`) is the safety net.
- three r186 dropped `PCFSoftShadowMap`; use `PCFShadowMap`.
- `Color.setHSL` defaults to linear; pass `THREE.SRGBColorSpace` for hand-picked colours.
- `window.__hub` hooks (`teleport`, `view`, `pauseDay`, `debug`) drive the tests and screenshots.

## Open items / ideas for iteration

- Frame rate only measured on an M5 (~60 fps High). 2020 MacBook Air and real phones untested.
- Interiors are fairly sparse and flat-lit next to the courtyard.
- Lawns are large and plain compared with the reference; more beds or hedges would help.
- Clouds barely show at the default camera pitch.
- Verify project URLs in `src/content/projects.json` (RsyncGui repo may be private).

## Quality default (2026-09-23)

- Default tier is Medium (High dropped to ~41-54 fps on grass/flower density). The HUD button
  switches High/Medium, saved in `localStorage['hub-quality']`, and reloads. `?quality=` still wins.
- After a hub deploy, see `../releases/hub-medium-20260923/README.md` for the edge-cache trap.

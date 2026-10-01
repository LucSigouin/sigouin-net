# Release: hub probe layer + fountain rim and windmill fixes (2026-09-23)

Deployment `fafc78f3` (https://fafc78f3.sigouin-net.pages.dev), live at https://sigouin.net/hub/.

- Probe layer (`Sigouin-Hub/src/probe/`, plan in `Sigouin-Hub/probe/PLAN.md`): loads only with
  `/hub/?probe`, in its own file (`hub/assets/probe-*.js`, 28 KB). Normal visitors pay +240 bytes
  in total (probe loader in the entry file, a dt hook in `app.ts`, cloud start angles in `sky.ts`).
- Fountain: the outer rim lathe was traced inside-out (faces pointed into the stone). Reversed the
  outline in `src/world/fountain.ts`. Found by the probe's normals layer (124,067 flagged px, now 0).
- Windmill: sails were driven by `performance.now()`; now by the world time uniform at the same
  speed (`src/world/backdrop.ts`), so they stop with frozen mode and pause with the world.
- Only `hub/` changed: `index.html` and 10 new asset files. `_headers`, landing, `/process/`
  untouched. `dist/_headers` was not copied. `dev-render-only/hub/` == `site/hub/` == build.

Verification:
- The deployed build is byte-identical to `Sigouin-Hub/probe/.dist`, the build the final probe
  tours and gate ran against (`diff -rq` clean).
- `/hub/?cb=…` referenced the new entry `index-DacjnP62.js` on the first poll; then all 14 hub
  files (no query string) returned 200 with the right content types and sha256-matched local.
- `SITE_URL=https://sigouin.net LEAVE_URL=https://sigouin.net/hub/ npx playwright test
  tests/site.spec.ts tests/leave.spec.ts --project=desktop`: 2 passed.
- Probe on live: normal visit 4 scripts with no probe code and 0 console errors; `?probe&freeze`
  repeat across two loads 0 px on spawn, fountain, aerial, corner-se, corner-nw; rim 0 flipped px;
  scripted play (Office: walk, enter, card, exit) 11/11; walk out lands on https://sigouin.net/.
  Shots in `Sigouin-Hub/probe/shots/live-20260923/`.
- Not tested: a real phone or on-screen browser (headless only).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

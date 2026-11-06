# Release: Ley Woods → new game at leywoods.sigouin.net (2026-10-13) — DEPLOYED 3e221fd3, then 649f6c33 (/shots rewrite)

Hub entry `index-BzCowT8y.js` (app chunk `app-CzW0_2Jc.js`). Live before this: `index-DXAyWnWY.js` (as in `site-before/`).

- `Sigouin-Hub/src/content/projects.json`: Computer Lab `monitor-5` Ley Woods → https://leywoods.sigouin.net/,
  tag "Idle game", new blurb for the top-down world game.
- `Sigouin-Hub/public/shots/leywoods.jpg` (1280×720 JPEG, q82): top 16:9 band (rows 0–882, full width) of
  `ley-woods/world/shot-world-final.png`, resized with sips.
- Built with `npx vite build --base=/hub/`, `dist/` minus `_headers` copied into `site/hub/` and
  `dev-render-only/hub/`. Old `site/hub/assets/*` kept for open tabs.

Verification: `npm test` 14 passed / 7 skipped. Deployed `3e221fd3`; verify-live 1150 MATCH, only DIFF is the
known `/ai-prep/` challenge script (`verify-live.log`). `/hub/shots/leywoods.jpg` 200 image/jpeg, hash = local.
Live `app-CzW0_2Jc.js` contains `leywoods.sigouin.net`, no `leywoods.pages.dev`.
`site/_redirects`: added `/shots/* /hub/shots/:splat 200` so https://sigouin.net/shots/leywoods.jpg serves (200 image/jpeg,
same hash); the hub itself still loads `/hub/shots/`. Deployed `649f6c33`, verify-live re-run: 1150 MATCH, same known DIFF.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

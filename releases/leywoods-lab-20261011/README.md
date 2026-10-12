# Release: Ley Woods on Lab monitor-5 (2026-10-11) — DEPLOYED dc176aa6

Hub entry `index-DXAyWnWY.js`. Live before this: `index-CdhEihSD.js` (as in `site-before/`).

- `Sigouin-Hub/src/content/projects.json`: Computer Lab `monitor-5` = Ley Woods →
  https://leywoods.pages.dev/ (tag "Idle game"), listed after River Garden.
- `Sigouin-Hub/public/shots/leywoods.jpg` (1280×720, sRGB JPEG): crop of
  `ley-woods/fleet-r7/b/shot-pass16-demo.png`, rows 185–1065 full width (familiars column + all node cards).
- `tests/hub.spec.ts`: linked lab monitors list now includes Ley Woods.
- Built with `npx vite build --base=/hub/`, `dist/` minus `_headers` copied into `site/hub/` and
  `dev-render-only/hub/`. Old `site/hub/assets/*` kept for open tabs.
- `site-before/` = `site/` copied before the hub build.

Verification: `npm test` 14 passed / 7 skipped (run on port 5317; 5191 was held by the Ley Woods
dev server). Mutant (Ley Woods url null) fails the dive test (`- "Ley Woods"`), restored.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

Deployed `dc176aa6` 2026-10-11; verify-live 1120 MATCH, 1 known DIFF: `/ai-prep/` (Cloudflare injects a per-request challenge script into that page; same DIFF in every release log since ai-prep-20261006, not a regression) (`verify-live.log`). Live hub serves `index-DXAyWnWY.js`.

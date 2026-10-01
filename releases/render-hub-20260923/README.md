# Release: render-only landing + walkable hub (2026-09-23)

Deployment `91e52cf6` (https://91e52cf6.sigouin-net.pages.dev), live at https://sigouin.net.

- `/`: the Vybe workstation only, full screen, no visible text, no scrolling. The monitor is a
  login screen (Luc's face, name, Enter). Enter (click or key) fades into `/hub/`.
- `/hub/`: the Sigouin-Hub build (`../../Sigouin-Hub`, `vite build --base=/hub/`). Every building
  shows "Coming soon". Walking out of the garden returns to `/` with a fade.
- `_headers`: `'wasm-unsafe-eval'` added to script-src (the hub's meshopt decoder needs it);
  `/hub/` no-transform, `/hub/assets/*` immutable.
- Source of the landing changes: `../../dev-render-only/` (== `site/` at deploy) and
  `../../dev-render-only-src/` (login plate + Blender still renderers).

Verification: 24/24 changed files hash-match live; `SITE_URL=https://sigouin.net npx playwright
test tests/site.spec.ts` (in Sigouin-Hub) passed: landing 3D, Enter, hub with the sculpted model,
walk out, landing again, zero CSP violations. Mutant: without `'wasm-unsafe-eval'` it fails.
`/process/` and `/api/live/*` unchanged (200).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

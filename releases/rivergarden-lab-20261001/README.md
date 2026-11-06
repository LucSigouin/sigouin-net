# Release: River Garden on Lab monitor-4 (2026-10-01) — DEPLOYED 164e97ac

Hub entry `index-Dflyg_TS.js`. Live before this: `index-BLtl4dCT.js` (deploy `042e4a9f`).

- `Sigouin-Hub/src/content/projects.json`: Computer Lab `monitor-4` = River Garden →
  https://rivergarden.sigouin.net/ (own Pages project `rivergarden`, see `river-garden/deploy/`).
- `Sigouin-Hub/public/shots/rivergarden.jpg` (1280×720, modal closed).
- `tests/hub.spec.ts`: linked lab monitors list now includes River Garden.
- `site-before/` = live site before this change (verify-live exit 0 against it on 2026-10-01).

DNS CNAME added by Luc. Deployed `164e97ac`; verify-live exit 0, 114 MATCH (`verify-live.log`).

Verification so far: `npm test` 14 passed / 10 skipped; mutant (River Garden url null) fails the dive test.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

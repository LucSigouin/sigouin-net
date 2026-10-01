# Release: loader without LS, cache-busted landing art (2026-10-01)

Deployment `042e4a9f`, live at https://sigouin.net.

- `/hub/` loader: LS monogram removed; just the courtyard drawing and status line.
- `/`: `?v=ls-20261001` on app.js → workspace.js → signal.js and on every poster/plate fetch, so
  browsers holding the old face login screen fetch the LS one.

Verification: `npm test` 14 passed / 10 skipped; `verify-live.sh` exit 0, 110/110 MATCH attempt 1;
live `site.spec` + `site-fixes.spec` desktop 8 passed; live hub has no `boot-mark`.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

# Release: remove /process/ (2026-10-06) — DEPLOYED 08470fe5

Luc asked to take the "How it gets built" page off the live site.

- `site/process/`, `site/js/process.js`, `site/assets/proc/` moved to `retired/process-20261006/`.
- `site/_headers`: dropped the `/process/` block.
- Hub: "The fleet" card in AI Workspace kept, now unlinked (`url: null`, `image: null`). Hub entry `index-Hk-mLFJl.js`.
- `site/functions/_middleware.js` + `_routes.json`: `/process`, `/process/*`, `/js/process.js`, `/assets/proc/*`
  answer with the real 404 page. Needed because Pages keeps serving deleted files for about a week
  (`x-robots-tag: noindex`, `s-maxage=604800`); the first deploy `cc0efb75` still served the old page.
- `Sigouin-Hub/tests/site-fixes.spec.ts`: the three process tests removed; `/process/` and `/js/process.js` added to the 404 list.

Verification: hub `npm test` 14 passed / 10 skipped. Preview branch `process-404-test` checked first.
Live: verify-live exit 0 (104 MATCH, 0 DIFF, `verify-live.log`); live Playwright site suite 5 passed.
The 404 test failed against live while `/process/` still returned 200 (red before green).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder, and restore
the hub card in `Sigouin-Hub/src/content/projects.json` (`url: "/process/"`, `image: "/shots/process.jpg"`).

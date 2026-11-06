# Release: Computer Lab dive + desks pushed back (2026-09-30)

Deployment `ba66f579`, hub entry `index-D8iDIeBr.js`. Live before this: `index-B1qD82ld.js` (deploy `a3e36a1d`).

- Undergrowth on Lab `monitor-2` + F-dive into the screen → CRT loading screen → navigate
  (see `Sigouin-Hub/probe/notes/undergrowth-link-20260930.md`).
- `Sigouin-Hub/src/interiors/computerLab.ts`: desk rows z `[2.2, -0.6]` → `[-1.0, -3.6]`, cols
  x `±2.8/±5.6` → `±2.1/±4.5`. From the entrance spawn all 8 monitors show, 4 per side
  (`probe/shots/lab-layout/before.png` vs `try2.png`, live `live-entrance.png`).

Verification:
- `npm test`: 14 passed, 10 skipped (site specs need SITE_URL).
- `probe/undergrowth-link.mjs` on the new layout: both computers are `screen`, navigate to their URLs, no errors.
- Live `/hub/?cb=` named `index-D8iDIeBr.js` on attempt 1; 11/11 new `/hub/assets/*` hash-match with no
  query string, none `text/html`.
- `verify-live.sh`: exit 0, 103 MATCH + both Functions, attempt 1.
- Live `site-fixes.spec` + `site.spec` (desktop): 8 passed. Mobile (iPhone 15 UA) `/`: rack still, 200, no errors.
- Not tested: real phones.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

# Release: phone taps reach the project card buttons (2026-09-25)

Bug: on phones the two thumbstick zones (bottom 62% of the screen) were added to `#ui` after the
card, so they sat on top of it and swallowed taps on "Open project" / "Back to the room".
Fix: `.card-backdrop { z-index: 1 }` in `Sigouin-Hub/src/ui/styles.css`.

- New test `tests/hub.spec.ts` "on a phone, the project card buttons take taps over the thumbsticks":
  failed before the fix (`<div class="stick-zone left"> intercepts pointer events`), passes after.
  Full suite 12 passed, 3 skipped. Shot: `tests/screenshots/mobile-card-computer-lab.png`.
- Deployment `7f94a63f`, hub entry `index-DNIckFYO.js`. `verify-live.sh`: exit 0, 142/142 MATCH, attempt 1.
- Not tested: a real phone (headless Pixel 7 emulation only).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

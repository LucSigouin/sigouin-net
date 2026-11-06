# Release: LS everywhere, courtyard loader, Esc settings (2026-10-01)

Deployment `345b44ab` (https://345b44ab.sigouin-net.pages.dev), live at https://sigouin.net. Hub entry
`index-BLtl4dCT.js` (was `index-D8iDIeBr.js`).

- `/`: tab title `Luc Sigouin · sigouin.net` (was `Vybe — Luc Sigouin`); tab icon is the hub's LS
  monogram (`/hub/favicon.svg`, was an orange V).
- Monitor login screen: the character-sheet face is replaced by the LS monogram on the hub's dusk
  gradient. `dev-render-only-src/ls_mark.py` draws it; `login_plate.py` / `login_plate_rack.py` use it.
  All 7 webps re-rendered (`login-background`, `closed`, `open`, `mobile-{closed,open}`,
  `rack-{closed,open}`); old vs new differ only inside the avatar disc.
- `/hub/` loader: the courtyard (Lab, Studio, Office, AI Workspace) inks in as a line drawing, one
  building per stretch of real progress, windows light when done, status line + %. `src/boot/boot.ts`
  trails real progress at 0.7/s so fast loads still draw building by building.
- `/hub/` HUD: the five buttons moved into a settings card (Esc, gamepad B, or the one gear button).
  Walking pauses while it is open. New `__hub.pos()` test hook.

Verification:
- `npm test` (Sigouin-Hub): 14 passed, 10 skipped. The settings test fails when the pause is broken (mutant).
- `verify-live.sh`: exit 0, attempt 2: 110/110 MATCH + both Functions.
- Live `site-fixes.spec` + `site.spec` (desktop): 8 passed.
- Not tested: real phones (gear tap, rack still on device).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

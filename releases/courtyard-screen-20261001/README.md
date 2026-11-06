# Release: courtyard login screen on the PC (2026-10-01)

Deployment `db4941b2`, live at https://sigouin.net.

- The monitor's login screen is now the glowing courtyard at dusk (Luc's pick, concept 1 of 5 in
  `personal/imagegen/drops/20261001-132808-login-screens/`), recomposed with gpt-image-2 images/edits
  (`scratch/courtyard-edit.py`) so the lower part is empty. Source art: `dev-render-only-src/art/courtyard-plate.png`.
- No name, no badge. Button reads "Walk in"; ENTER and PLAYER regions unchanged, so the hover shader
  and the live Blender Vybe bars in the strip work as before. Rack (phone) plate: "Tap to walk into the hub".
- All 7 webps re-rendered; cache tag `?v=ls-20261001d`.

Verification: local `site.spec` 1 passed before deploy; `verify-live.sh` exit 0, 114/114 MATCH attempt 1;
live `site.spec` + `site-fixes.spec` desktop 8 passed; live plate fetched and viewed.
Not tested: real phone; live 3D bar animation (needs eyes).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

# Release: character textures 2048 (2026-09-23)

Deployment `49a8861f`. `hub/models/luc.glb` rebuilt from `Sigouin-Hub/art/character/idle.glb` with
`--texture-size 2048` (was 1024): 907 KB → 1.75 MB. Live hash matches local; hub loads with
`__hub.debug().player === "model"`, zero CSP violations.

Rollback: copy `luc-before.glb` over `site/hub/models/luc.glb` (and `dev-render-only/`), then
`CONFIRM_DEPLOY=1 ../../deploy/deploy.sh`.

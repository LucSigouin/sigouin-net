# Workstation homepage deployed

Production: https://sigouin.net/
Deployment: https://0b9052c8.sigouin-net.pages.dev
Date: 2026-09-18

The approved Vybe workstation replaces the homepage. It includes the reference router/switch, right-hand SFP link, seven cable hover wiggles, rack hover, tile hover and the rainbow song waveform. Mobile/reduced-motion/graphics-failure stills remain available. Existing `/process/` and `/api/live/*` routes are retained.

Production resources live under `/vybe/`. Relative resource paths were adapted for the root homepage, the import map is allowed by its exact CSP hash, and local font loading is allowed. The Inter and Three.js license files are included. Editable Blender files and builder scripts remain in `vybe-workstation/revisions/network-reference` and are not uploaded as website assets.

Validation: staged and live WebKit interaction/fallback checks passed with zero page/CSP errors; all 28 checked live static assets match local SHA-256 hashes; both live API routes return JSON. Desktop/mobile and browser-pane captures are saved here. Canonical `sigouin-net/site` now contains the deployed version.

Rollback: `before-site/` is the previous complete site. Its homepage was byte-identical to the live homepage before publishing; see `before-live.json`. To restore, run `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/before-site"` from this release folder, then copy `before-site/` back to the canonical site directory with rsync --delete (excluding .wrangler). This creates a new production deployment. No rollback has been executed.

The initial deployment 34a179d2 was immediately superseded by 0b9052c8 to include the font license; visible site bytes are identical between them.

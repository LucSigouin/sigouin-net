# sigouin.net

Luc's personal site. Cloudflare Pages project `sigouin-net` (personal account, luc@sigouin.net).
Live deployment: `a3e36a1d` (2026-09-29). Every deploy has notes and a rollback in `releases/`.

## What is live

| Address | What it is | Source |
|---|---|---|
| `/` | Render-only Vybe workstation (monitor login screen). Upright phones get the rack still. Tab shows an "Enter the hub" link. | `site/index.html`, `site/vybe/` |
| `/hub/` | Walkable 3D courtyard, four buildings of project cards. `?links` = plain list. | `Sigouin-Hub/` (built with `vite build --base=/hub/`) |
| `/process/` | Removed 2026-10-06 (real 404 via `site/functions/_middleware.js`). Source in `retired/process-20261006/`. | `releases/remove-process-20261006/` |
| `/runescape/*` | 301 to https://dragonwilds.sigouin.net (own Pages project). | `site/_redirects`, `dragonwilds/` |
| anything else | Real 404 page. | `site/404.html` |
| `/api/live/*` | Read-only JSON relay (SiGz tracks, BBC state, teetimes). No page calls it now. | `site/functions/api/live/` |

## Changing things

- Hub projects: edit `Sigouin-Hub/src/content/projects.json` (see `Sigouin-Hub/README.md`).
- Hub code: `cd Sigouin-Hub && npm test` (13 tests, builds first), then
  `npx vite build --base=/hub/` and copy `dist/` minus `dist/_headers` into `site/hub/`. Keep old `site/hub/assets/*` files: open tabs may still ask for them.
- Landing, process, headers: edit `site/` directly. Files under `/vybe/`, `/js/`, `/css/` are cached
  4 h in browsers by a zone setting, so bump the `?v=` tag on any file you change.

## Deploy and verify

```sh
CONFIRM_DEPLOY=1 deploy/deploy.sh          # deploys a clean staging copy of site/
deploy/verify-live.sh                      # every file hash, headers, 404 page, both Functions
cd Sigouin-Hub && SITE_URL=https://sigouin.net npx playwright test tests/site-fixes.spec.ts tests/site.spec.ts --project=desktop
```

After a hub deploy, wait until `https://sigouin.net/hub/?cb=<random>` names the new `index-*.js`
before requesting assets without a query string (see `releases/hub-medium-20260923/`).

Local copy with real headers and redirects: `cd site && npx wrangler@4.133.0 pages dev . --port 8788`
(needs the sandbox off to listen), then `SITE_URL=http://127.0.0.1:8788` for the tests.

## Other folders

- `dragonwilds/`: the Dragonwilds field guide, its own site and `deploy.sh`.
- `releases/`: one folder per deploy with notes, checks and rollback.
- Design rounds, mockups, handoff notes and retired copies moved out of the repo on 2026-11-06 to
  `../archive/sigouin-net-iterations-2026-11-06/` (see `archive/README.md`). The former cream site is at
  `../archive/sigouin-net-cream-2026-09-17/site/`.

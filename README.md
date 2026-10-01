# sigouin.net

Luc's personal site. Cloudflare Pages project `sigouin-net` (personal account, luc@sigouin.net).
Live deployment: `a3e36a1d` (2026-09-29). Every deploy has notes and a rollback in `releases/`.

## What is live

| Address | What it is | Source |
|---|---|---|
| `/` | Render-only Vybe workstation (monitor login screen). Upright phones get the rack still. Tab shows an "Enter the hub" link. | `site/index.html`, `site/vybe/` |
| `/hub/` | Walkable 3D courtyard, four buildings of project cards. `?links` = plain list. | `Sigouin-Hub/` (built with `vite build --base=/hub/`) |
| `/process/` | "How it gets built" stepper, 8 scenes. Media loads per scene. | `site/process/`, `site/js/process.js`, `site/css/hub.css` |
| `/runescape/*` | 301 to https://dragonwilds.sigouin.net (own Pages project). | `site/_redirects`, `dragonwilds/` |
| anything else | Real 404 page. | `site/404.html` |
| `/api/live/*` | Read-only JSON relay (SiGz tracks, BBC state, teetimes). No page calls it now. | `site/functions/api/live/` |

## Changing things

- Hub projects: edit `Sigouin-Hub/src/content/projects.json` (see `Sigouin-Hub/README.md`).
- Hub code: `cd Sigouin-Hub && npm test` (13 tests, builds first), then
  `npx vite build --base=/hub/` and copy `dist/` minus `dist/_headers` into `site/hub/` and
  `dev-render-only/hub/`. Keep old `site/hub/assets/*` files: open tabs may still ask for them.
- Landing, process, headers: edit `site/` directly. Files under `/vybe/`, `/js/`, `/css/` are cached
  4 h in browsers by a zone setting, so bump the `?v=` tag on any file you change.
- `dev-render-only/` mirrors `site/`: `rsync -a --delete --exclude .wrangler site/ dev-render-only/`.

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
- `retired/site-unused-20260925/`: 61 files removed from `site/` because nothing referenced them.
- `releases/`: one folder per deploy with notes, checks and rollback.
- `fleet-r*/`, `workbench/`, `redesign-2026/`, `motion/`, `mobile-mockup/`, `hub-board/`: past design
  and review rounds. Latest review: `fleet-r23-review/SUMMARY.md`.

# History

## Previous portfolio implementation (historical)

Luc's personal portfolio hub, live at https://sigouin.net since 2026-09-17.
Cloudflare Pages project `sigouin-net`, personal account (luc@sigouin.net), deployment `3d91385e`.

`site/` serves round 22: the round 20 restored header and background videos, round 21 golf exhibit, and S01 process script fix. Round 15 deployed and verified
the two pages, all 76 public files, security headers, and both required live JSON routes.
Round 16 shipped ten exhibits on 2026-09-17, removed rail slivers, and made stage media fit in full.
The former cream scrollcraft build, deploy `cc756f0c`, is archived at
`../archive/sigouin-net-cream-2026-09-17/site/`.

## What is here (2026-09-17)

- `site/`: the deployable hub, with `index.html` and `process/index.html`, plus `assets/`,
  `css/`, `js/`, `data/`, and `live.js`. No build step is needed.
- `site/functions/api/live/[[path]].ts`: a read-only Pages Function with six fixed JSON
  routes for SiGz Music, BBC, and TeeTimes. The hub reads SiGz and BBC through `/api/live/`
  on the same origin and reads TeeTimes directly. No runtime credentials or bindings.
- `site/functions/assets/[[path]].js` and `site/_routes.json`: return 404 for the four
  removed round 16 assets. The explicit routes keep other static assets outside Functions.
- `site/_headers`: the CSP, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`. The former missing-header item is
  resolved. The process module is served from `js/process.js` under the same-origin script policy. The two HTML routes also send
  `Cache-Control: public, max-age=0, must-revalidate, no-transform` to preserve their
  exact bytes when Cloudflare would otherwise inject a script.
- `fleet-r14-build/a/`: Luc's selected lane, kept intact as the round 14 record.
  Round 15 used `cp -R fleet-r14-build/a/site site` after archiving the former site.
  Prep changes belong in `site/`; do not overwrite the lane record.
- `fleet-r15-ship/`: the prep and deploy reports, deployment output, rollback reference,
  source hashes, local and live HTTP checks, browser checks, and screenshots.
  The promoted proxy uses `redirect: "manual"`
  and rejects non-2xx responses because the tested Workers runtime rejects
  `redirect: "error"`.
- `fleet-r16-tweaks/`: the ten-exhibit source, tweak report, deployment report, and live
  checks. The round 15 rollback copy is `fleet-r15-ship/site-as-deployed-9d9c5bd0/`.
- `deploy/`: `promote.sh`, `deploy.sh`, and `verify-live.sh`. The existing promotion
  helper requires `posts/` and `build.py`, so it does not fit this static lane.
  `deploy.sh` still requires `CONFIRM_DEPLOY=1`. It enters `site/` and deploys `.` so
  Wrangler compiles `site/functions/` from the correct working directory.
  It prints the full Wrangler output and preserves its exit code.
  Wrangler is pinned to `4.133.0` after an unavailable npm latest version blocked a retry.
  `verify-live.sh` checks both page routes, asset hashes, security headers, and the
  SiGz/BBC JSON routes; it excludes Function source and local Wrangler state.
- `../archive/sigouin-net-cream-2026-09-17/site/`: the entire former cream site, moved
  intact with `mv`. Its archive row records deploy `cc756f0c` and how to revive it.
- `../scrollcraft/builds/sigouin-net/`: the historical cream build source, kept in place
  and unchanged. It is not the hub's edit source.
- `fleet-r3-scroll/` and `workbench/`: earlier build records.

## Release status

Round 22 deployment `3d91385e` completed on 2026-09-17. Both page routes returned HTTP 200.
Local checks passed with zero CSP violations and the process Next button advancing to `P2 / 8`.
Live verification was skipped on Luc's instruction.
See `fleet-r22-merge/DEPLOY-REPORT.md` for deployment output, rollback commands, and limits.

The prep lane's local desktop and mobile browser checks passed with no CSP violations;
all four GLBs loaded. See `fleet-r15-ship/REPORT.md` for those checks.

For future approved deployments, run these from `personal/sigouin-net/`:

```sh
CONFIRM_DEPLOY=1 deploy/deploy.sh
deploy/verify-live.sh
```

## History

Round 12 (2026-09-02 evening, revised 09-03): Luc asked for the plant back, then chose an EMPTY near plane after a side-by-side. Also removed: the desk chapter's scrubbed clip and 12% zoom (now a flow section with fade-in copy) and the LiveTVCan route card. Plant history: Near plane restored from
`../archive/sigouin-net-fleet-2026-09-02/scrollcraft-builds/sigouin-net-pre-light-cable/assets/`
(sha256 prefix b3aee751d6ceb390, the same bytes round 10 replaced). The headphones pair is kept in
`../scrollcraft/builds/sigouin-net/lab/hero-r10-headphones/`. Round 11's three alternatives (desk
corner, mini PC, speaker) sit unpicked in `fleet-r11-near3/` and `../scrollcraft/builds/sigouin-near-{a,b,c}/`.

Rounds 5 to 9 (2026-09-02): hero planes, seam dissolve, folio removed + cable fixed, pinned
sections shortened, then four signature-move variants (light / object / ink / depth); Luc chose
light. Losers and the cable version are in the archive folder below.

Four rounds, five candidate looks, 2026-09-01 to 09-02. Everything that lost is in
`../archive/sigouin-net-fleet-2026-09-02/` with a row in `archive/README.md`.

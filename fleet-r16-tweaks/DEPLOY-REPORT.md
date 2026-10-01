# Round 16 deploy report

Round 16 is live at https://sigouin.net on 2026-09-17, deployment
`83b9e0f7`. The hub has ten exhibits, no rail slivers, and stage media
that fits in full. Production verification exited **0** on the first attempt after
the final deploy. All 72 public files match local hashes, both page header sets match,
and both required live JSON routes work. All five requested smoke URLs return 200.
All four removed assets return 404.

## Deployment

| Item | Result |
|---|---|
| Final deployment id | `83b9e0f7` |
| Pages URL | https://83b9e0f7.sigouin-net.pages.dev |
| Production URL | https://sigouin.net |
| Project and branch | `sigouin-net`, `main` |
| Deploy command exit code | 0 |
| Deploy started, UTC | `2026-09-17T15:43:09.810398+00:00` |
| Deploy completed, UTC | `2026-09-17T15:43:21.301335+00:00` |
| Deploy duration | 11.491 seconds |
| Initial deployment before the deleted-asset fix | `efd42747`, https://efd42747.sigouin-net.pages.dev |
| Wrangler version | `4.133.0`, now pinned in `deploy/deploy.sh` |

The approved deploy command was:

```sh
CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
```

[deploy-output.txt](deploy-output.txt) contains the combined final output after
redaction of token-like strings. [deployment.json](deployment.json) records the exit
code and times. The ids are the short ids from the deployment URLs.

The first deployment succeeded. A later retry failed before upload because npm
reported `ETARGET`, with no matching version for `wrangler@4.134.0`. Pinning the
already successful version `4.133.0` fixed that deploy plumbing failure. The failed
output is in [failed-wrangler-latest/deploy-output.txt](failed-wrangler-latest/deploy-output.txt);
the script change is in [deploy-version-pin.diff](deploy-version-pin.diff).

## Promotion and integrity

Before promotion, the served and local homepage hashes were recorded in
[pre-deploy.txt](pre-deploy.txt), and the current site was copied to the rollback
folder. These commands completed in order:

```sh
cp -R /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0
diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0
rsync -a --delete /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site/ /Users/ls/Claude-Workspace/personal/sigouin-net/site/
diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site /Users/ls/Claude-Workspace/personal/sigouin-net/site
```

Both comparisons exited 0 and printed nothing. [rollback-copy.diff](rollback-copy.diff)
and [promotion.diff](promotion.diff) are empty. After the deploy plumbing addition,
the tweak source was promoted again. The final `diff -rq` also exited 0 and printed
nothing, recorded in [final-site.diff](final-site.diff).

All 74 files from the original prepared tweak copy retain their saved SHA-256 hashes
in both copies. The only added site files are `_routes.json` and
`functions/assets/[[path]].js`. All HTML, CSS, JS design files, media, data, `_headers`,
and the live API proxy retain their prepared bytes. Wrangler's generated local state
was moved to `wrangler-state-83b9e0f7/` outside `site/`.
See [source-manifest.json](source-manifest.json) and [final-checks.json](final-checks.json).

## Propagation

The initial ten-exhibit homepage first matched at
`2026-09-17T15:38:23.668917+00:00`, **10.225 seconds**
after deployment `efd42747` completed, on the second poll.
The requested hash command ran at ten-second intervals with a three-minute limit:

```sh
curl -s https://sigouin.net/ | shasum -a 256
```

After final deployment `83b9e0f7`, the first poll matched at
`2026-09-17T15:43:21.479650+00:00`, **0.178 seconds** after completion.
The homepage bytes were the same in the two round 16 deployments, so that second
measurement confirms the correct homepage remained live. It does not alone establish
when the final Functions bundle reached the custom domain. All four new 404 responses
were observed by `2026-09-17T15:44:38.140678+00:00`, 76.839 seconds after the final
deploy, in the first smoke check after verification.

Final local and served homepage SHA-256:

```text
12f73cab94e91157b844609559cbd0ab370cb444319f2f63b424e4247c699b3a
```

Evidence: [initial propagation](initial-efd42747/propagation.json) and
[final propagation](propagation.json). These are observed matches from the serving
edge, not measurements of global propagation.

## Deleted-asset deploy plumbing

The initial required smoke check found that the custom domain still served all four
old images with HTTP 200. The deployment URL instead returned the ten-exhibit
homepage with HTTP 200 for those missing paths. Their local asset files were absent.
[deleted-asset-diagnostics.json](deleted-asset-diagnostics.json) records both hosts,
body hashes, and response headers. The original smoke evidence remains in
[initial-efd42747/](initial-efd42747/).

Cloudflare documents that a project without a top-level `404.html` falls back to the
homepage for missing paths, and that assets can remain cached after a deployment.
The observed responses are consistent with those behaviors. See
[Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Added a Pages Function returning a plain `Not found` response with status 404 for
exactly the four removed asset paths. `_routes.json` invokes Functions for those paths
and the existing `/api/live/*` routes. Other static assets stay outside Functions.
The handler also passes through any unrelated path if invoked, and sends `no-store,
no-transform`, a plain-text content type, and security headers on its 404 responses.
This follows [Pages Function routing](https://developers.cloudflare.com/pages/functions/routing/).
The correction was applied to both `fleet-r16-tweaks/site/` and `site/`.

## Production verification

```sh
/Users/ls/Claude-Workspace/personal/sigouin-net/deploy/verify-live.sh https://sigouin.net /Users/ls/Claude-Workspace/personal/sigouin-net/site
```

Exit code: **0**. Attempt: **1/10**. Runtime:
10.201 seconds. Started at `2026-09-17T15:43:36.442414+00:00` and
finished at `2026-09-17T15:43:46.643699+00:00`. The verifier script itself was not changed.

Full output, also saved in [verify-live.log](verify-live.log):

```text
Attempt 1/10
path                                          local hash   live hash    result
/assets/cap/bbc-1440-scroll0-20260917.webp    eb2819527bf3 eb2819527bf3 MATCH
/assets/cap/bbc-1440-scroll50-20260917.webp   801e74a5192c 801e74a5192c MATCH
/assets/cap/bbc-390-scroll0-20260917.webp     8be2ea70ef5f 8be2ea70ef5f MATCH
/assets/cap/livetvcan-1440-scroll0-20260917.webp ec2f03de5949 ec2f03de5949 MATCH
/assets/cap/livetvcan-1440-scroll50-20260917.webp 5a8e4e732c93 5a8e4e732c93 MATCH
/assets/cap/livetvcan-390-scroll0-20260917.webp 93a2f0dfb123 93a2f0dfb123 MATCH
/assets/cap/sigouin-1440-scroll-20260917-poster.webp 5d3613cc0735 5d3613cc0735 MATCH
/assets/cap/sigouin-1440-scroll-20260917.mp4  d6788c7bfb24 d6788c7bfb24 MATCH
/assets/cap/sigouin-1440-scroll0-20260917.webp 38fd2fbbf726 38fd2fbbf726 MATCH
/assets/cap/sigouin-390-scroll0-20260917.webp 53ea296d5e60 53ea296d5e60 MATCH
/assets/cap/sigz-music-1440-scroll-20260917-poster.webp ab24fb8d6fbe ab24fb8d6fbe MATCH
/assets/cap/sigz-music-1440-scroll-20260917.mp4 2a95c1cc6a7e 2a95c1cc6a7e MATCH
/assets/cap/sigz-music-1440-scroll0-20260917.webp 7e41ca1cf61a 7e41ca1cf61a MATCH
/assets/cap/sigz-music-1440-scroll50-20260917.webp d46cdd369b02 d46cdd369b02 MATCH
/assets/cap/sigz-music-390-scroll0-20260917.webp f8962f799bfc f8962f799bfc MATCH
/assets/cap/teetimes-1440-scroll-20260917-poster.webp daff37d75c38 daff37d75c38 MATCH
/assets/cap/teetimes-1440-scroll-20260917.mp4 0f46f7ba4b18 0f46f7ba4b18 MATCH
/assets/cap/teetimes-1440-scroll0-20260917.webp 102d7d9067df 102d7d9067df MATCH
/assets/cap/teetimes-1440-scroll50-20260917.webp 03be5225c6d1 03be5225c6d1 MATCH
/assets/cap/teetimes-390-scroll0-20260917.webp 2c4cfaf475b3 2c4cfaf475b3 MATCH
/assets/cap/undergrowth-1440-play-20260917-poster.webp 54ad844422dc 54ad844422dc MATCH
/assets/cap/undergrowth-1440-play-20260917.mp4 c08c95cd8483 c08c95cd8483 MATCH
/assets/cap/undergrowth-1440-scroll0-play8s-20260917.webp b5e6a5395f74 b5e6a5395f74 MATCH
/assets/cap/undergrowth-1440-scroll0-ready-20260917.webp f27b964c587a f27b964c587a MATCH
/assets/cap/undergrowth-390-scroll0-play8s-20260917.webp 37c09fdf7ad2 37c09fdf7ad2 MATCH
/assets/glb/game-server-tower-20260917.glb    b683f293f3c3 b683f293f3c3 MATCH
/assets/glb/game-server-tower-20260917.webp   49e6fd0361d8 49e6fd0361d8 MATCH
/assets/glb/golf-pin-v2-20260917.glb          615090bf0774 615090bf0774 MATCH
/assets/glb/golf-pin-v2-20260917.webp         7c38b3229c9a 7c38b3229c9a MATCH
/assets/glb/rack-server-4u-20260917.glb       2c2f788e7e17 2c2f788e7e17 MATCH
/assets/glb/rack-server-4u-20260917.webp      ba25ea0d5e02 ba25ea0d5e02 MATCH
/assets/glb/sigz-neon-sign-20260917.glb       bbd4bc2da8c6 bbd4bc2da8c6 MATCH
/assets/glb/sigz-neon-sign-20260917.webp      16d4241f60d4 16d4241f60d4 MATCH
/assets/proc/board-claude-2026-09-17.png      c9a4ca992a5d c9a4ca992a5d MATCH
/assets/proc/board-kimi-2026-09-17.png        513bedcf521c 513bedcf521c MATCH
/assets/proc/board-live-2026-09-17.png        b5b2b662d253 b5b2b662d253 MATCH
/assets/proc/gate-red-green-poster-2026-09-17.webp 122bb872bf1b 122bb872bf1b MATCH
/assets/proc/gate-red-green.mp4               14682d7d2476 14682d7d2476 MATCH
/assets/proc/gate-red-green.txt               611634a08456 611634a08456 MATCH
/assets/proc/how-the-fleet-works-2026-09-17.png a9f6c8bb80e0 a9f6c8bb80e0 MATCH
/assets/proc/landing-live-winner.png          7c1bc7ff5abb 7c1bc7ff5abb MATCH
/assets/proc/landing-nine-up-2026-09-17.webp  000003c96529 000003c96529 MATCH
/assets/proc/scrollcraft-filmstrip-2026-09-17.mp4 5d6fef3e7bd9 5d6fef3e7bd9 MATCH
/assets/proc/scrollcraft-filmstrip-poster-2026-09-17.webp c27a3326ae16 c27a3326ae16 MATCH
/assets/proc/sigouin-all-seven-2026-09-17.webp da2406c6b3d7 da2406c6b3d7 MATCH
/assets/proc/sigouin-five-looks-2026-09-17.webp 247c1290d89d 247c1290d89d MATCH
/assets/proc/sigouin-live-2026-09-17.png      4f904c2b38f0 4f904c2b38f0 MATCH
/assets/still/01-livetvcan-hero.webp          57e4526d2958 57e4526d2958 MATCH
/assets/still/02-gardens-homelab.webp         84f488236fcf 84f488236fcf MATCH
/assets/still/03-sigz-waveform.webp           b0b55032abfe b0b55032abfe MATCH
/assets/still/04-teetimes-map.webp            df3b0cd747c5 df3b0cd747c5 MATCH
/assets/vid/cnvs-canvas-pullback-20260917.av1.mp4 9abd87c832d9 9abd87c832d9 MATCH
/assets/vid/cnvs-canvas-pullback-20260917.mp4 07390d13316f 07390d13316f MATCH
/assets/vid/cnvs-canvas-pullback-20260917.poster.webp dbd3ef6c3266 dbd3ef6c3266 MATCH
/assets/vid/sigz-neon-loop-20260917.av1.mp4   67d9ab97572e 67d9ab97572e MATCH
/assets/vid/sigz-neon-loop-20260917.mp4       cd52d616a6c6 cd52d616a6c6 MATCH
/assets/vid/sigz-neon-loop-20260917.poster.webp 9f92bf64da1f 9f92bf64da1f MATCH
/assets/vid/undergrowth-flyover-20260917.av1.mp4 6723e144bb05 6723e144bb05 MATCH
/assets/vid/undergrowth-flyover-20260917.mp4  480465273bba 480465273bba MATCH
/assets/vid/undergrowth-flyover-20260917.poster.webp 1fae09030d79 1fae09030d79 MATCH
/css/hub.css                                  959857e0fd4d 959857e0fd4d MATCH
/data/bbc-state-2026-09-17.json               31914778ebe0 31914778ebe0 MATCH
/data/costs-timeline-20260917.json            c7f69dc86234 c7f69dc86234 MATCH
/data/sigz-tracks-2026-09-17.json             1561fd58ba89 1561fd58ba89 MATCH
/data/stills-costs-20260917.jsonl             4cd294d0412b 4cd294d0412b MATCH
/data/tee-teetimes-2026-09-17.json            b3c1ce32c575 b3c1ce32c575 MATCH
/                                             12f73cab94e9 12f73cab94e9 MATCH
Headers /: MATCH
/js/exhibits.js                               3357b1506fa8 3357b1506fa8 MATCH
/js/hub.js                                    66ccdfa07d60 66ccdfa07d60 MATCH
/js/live-hub.js                               3cc473707fce 3cc473707fce MATCH
/live.js                                      6ea36c097650 6ea36c097650 MATCH
/process/                                     f8f0c887f21c f8f0c887f21c MATCH
Headers /process/: MATCH
Function /api/live/sigz/tracks: 200 JSON (sigzmusic.com)
Function /api/live/bbc/state: 200 JSON (bbc.sigouin.net)
```

## Live smoke checks

Each excerpt below is the first 200 body bytes, represented as a JSON string so
newlines and quotes remain visible. Full bodies, headers, and separate byte samples
are saved in [live-smoke/](live-smoke/), with results and timestamps in
[live-smoke.json](live-smoke.json). Requests used the normal URLs without cache-busting
query parameters. Captured at approximately `2026-09-17T15:44:38.167980+00:00`.

| Route | HTTP | Content-Type | Body bytes | First 200 body bytes |
|---|---|---|---|---|
| `/` | 200 | `text/html; charset=utf-8` | 2510 | `"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>Luc Sigouin: ten exhibits</title>\n<meta n"` |
| `/process/` | 200 | `text/html; charset=utf-8` | 10408 | `"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>How it gets built: the fleet</title>\n<met"` |
| `/api/live/sigz/tracks` | 200 | `application/json` | 14387 | `"{\"tracks\":[{\"slug\":\"to-the-beach\",\"title\":\"To the Beach\",\"durationSeconds\":193,\"releaseDate\":\"2024-06-14\",\"accentColor\":\"#35E0FF\",\"description\":null,\"demo\":false,\"playCount\":40,\"albumSlug\":\"vybe\",\"tra"` |
| `/api/live/bbc/state` | 200 | `application/json` | 1000 | `"{\"setup\":{\"teamA\":{\"name\":\"Blue\",\"color\":\"#1d4ed8\"},\"teamB\":{\"name\":\"Green\",\"color\":\"#15803d\"},\"matchTarget\":18,\"bonuses\":[{\"id\":\"b1\",\"type\":\"ctp\",\"hole\":\"5\",\"points\":1},{\"id\":\"b2\",\"type\":\"ctp\",\"hole\""` |
| `/js/exhibits.js` | 200 | `application/javascript` | 9022 | `"// The ten exhibits. Every media path is a real round 13 asset copied into site/assets.\n// Tool lists come from fleet-r12-portfolio-discovery/tooling/TOOLING.md. Nothing invented.\n\nexport const EXHIBI"` |

The page and exhibit-JS bodies also match their local files. The verifier confirms
that the SiGz body has a `tracks` array with `X-Live-Source: sigzmusic.com`, and that
the BBC body has `setup`, `scores`, and `bonusWinners` objects with
`X-Live-Source: bbc.sigouin.net`.

The following checks ran against the saved live response bodies:

```text
$ grep -nF 'Kingdom Idle' live-smoke/exhibits.body
(no output, exit 1)
$ grep -nF 'Cooking The Lads' live-smoke/exhibits.body
(no output, exit 1)
$ grep -nF 'Index of ten' live-smoke/index.body
23:    <span>Index of ten</span>
(exit 0)
```

The exit-1 grep results mean no matches. Structured evidence is in
[content-checks.json](content-checks.json).

Every asset in `REPORT.md`'s deleted list now returns 404 at the normal production
URL. The response is shorter than 200 bytes, so its entire body is shown:

| Deleted route | HTTP | Body |
|---|---|---|
| `/assets/proc/kingdom-idle-current-state-2026-09-17.webp` | 404 | `"Not found\n"` |
| `/assets/still/05-ff-crest-cooking-the-lads.webp` | 404 | `"Not found\n"` |
| `/assets/still/06-ff-ref-james-cook.webp` | 404 | `"Not found\n"` |
| `/assets/still/07-ff-ref-ladd-mcconkey.webp` | 404 | `"Not found\n"` |

## Rollback reference and exact commands

The preserved copy of deployment `9d9c5bd0` is:

```text
/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0
```

Both pre-deploy homepage hashes matched. The rollback copy's homepage still has
that same hash. The full original capture is:

```text
Round 16 pre-deploy reference
Captured UTC: 2026-09-17T15:37:08.709415+00:00

$ curl -s https://sigouin.net/ | shasum -a 256
e246a01af166c7c7eaaa069438bef77f94ca3f87a2e0383cee52ab96186b4fff  -
Exit code: 0

$ shasum -a 256 < /Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html
e246a01af166c7c7eaaa069438bef77f94ca3f87a2e0383cee52ab96186b4fff  -
Exit code: 0
```

These commands preserve the current site, restore the saved round 15 bytes, deploy
them, and run production verification. They are documented only. No rollback was
performed. Cloudflare would assign a new deployment id to the restored content.

```sh
(
  set -e
  test -d /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0
  test ! -e /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-before-rollback-83b9e0f7
  cp -R /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-before-rollback-83b9e0f7
  rsync -a --delete /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0/ /Users/ls/Claude-Workspace/personal/sigouin-net/site/
  diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/site-as-deployed-9d9c5bd0 /Users/ls/Claude-Workspace/personal/sigouin-net/site
  shasum -a 256 < /Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html
  CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
  /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/verify-live.sh https://sigouin.net /Users/ls/Claude-Workspace/personal/sigouin-net/site
)
```

Expected restored homepage SHA-256:

```text
e246a01af166c7c7eaaa069438bef77f94ca3f87a2e0383cee52ab96186b4fff
```

## Scope

The README records deployment `83b9e0f7` and that round 16 shipped ten
exhibits. The credential file was sourced only by `deploy.sh`; it was not opened,
read, or printed by this lane, and no credential variable was inspected. No git push,
DNS or Cloudflare settings edit, system browser launch, or access to the work
workspace occurred. npm used only the allowed `npmcache` location for Wrangler.

## Could not verify

- Global edge propagation or the exact changeover time between observations.
- Live browser rendering, physical-phone behavior, video decoding, and interactive
  controls. This deploy lane used HTTP checks; the prepared build's browser evidence
  is in [REPORT.md](REPORT.md).
- A rollback in production. The copy was verified before promotion and its homepage
  hash was checked again, but the rollback commands were not executed.
- Removal from users' existing browser caches. The normal production URLs returned
  404 in the recorded live requests.

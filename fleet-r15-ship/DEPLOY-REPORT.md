# Round 15 deploy report

The portfolio hub is live at https://sigouin.net since 2026-09-17, deployment
`9d9c5bd0`. Production verification exited **0** on its first attempt after
one deploy plumbing correction. All 76 public files match the local files, both
page header sets match, and both required proxy routes return valid JSON.

## Deployment

| Item | Result |
|---|---|
| Final deployment id shown in URL | `9d9c5bd0` |
| Pages URL | https://9d9c5bd0.sigouin-net.pages.dev |
| Project and branch | `sigouin-net`, `main` |
| Deploy command exit code | 0 |
| Deploy started, UTC | 2026-09-17T15:19:53.437642+00:00 |
| Deploy completed, UTC | 2026-09-17T15:20:03.683007+00:00 |
| Deploy duration | 10.246 seconds |
| Initial deployment before the header fix | `3150de6b`, https://3150de6b.sigouin-net.pages.dev |

Both deployments used this command, with Wrangler running from `site/`:

```sh
CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
```

[deploy-output.txt](deploy-output.txt) contains the full combined final deploy
output, including Wrangler compilation, asset upload, headers upload, Functions
bundle upload, and the resulting URL. The capture redacts token-like strings
before saving or printing them. The initial script emitted only the URL; its
output is retained in [deploy-output-initial.txt](deploy-output-initial.txt).
The ids above are the short ids printed in the deployment URLs, not full API UUIDs.

## Propagation

The final Pages URL matched the local homepage at
`2026-09-17T15:20:04.195950+00:00`, 0.513 seconds after
the deploy command completed. The custom domain matched at
`2026-09-17T15:20:13.822151+00:00`, **10.139 seconds after completion**,
on the second poll. Polls were ten seconds apart, so this is the first observed
match, not the exact instant every edge changed.

Local and final live homepage SHA-256:

```text
e246a01af166c7c7eaaa069438bef77f94ca3f87a2e0383cee52ab96186b4fff
```

[Propagation samples](propagation.json) record the curl hash pipelines and UTC
times for both hosts. The initial deployment's custom-domain hash did not match
during the full three-minute polling window; its Pages URL matched throughout.
Those samples are in [propagation-initial.json](propagation-initial.json).

## Deploy plumbing correction

The first `verify-live.sh` run exited **1** after all ten attempts. The 74
non-HTML public files, both page security-header sets, and both proxy routes
passed. Only `/` and `/process/` had different hashes. Saved response diffs show
that each page contained exactly one additional 938-byte Cloudflare JavaScript
Detections script; removing that script in the diagnostic comparison reproduced
the local HTML exactly. The verifier itself was not changed.

Added this response header to the exact `/` and `/process/` paths in
`site/_headers`, retaining the existing cache revalidation directives:

```text
Cache-Control: public, max-age=0, must-revalidate, no-transform
```

Cloudflare documents that an origin `no-transform` directive prevents JavaScript
Detections injection. It also means those responses do not supply JavaScript
Detections results. This change is in the deployed Pages headers; no zone, DNS,
or project setting was changed. The rule is limited to the two HTML routes.
Sources: [JavaScript Detections](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/#if-your-origin-sends-a-no-transform-header)
and [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).

`deploy/deploy.sh` now prints its captured Wrangler output and preserves the
Wrangler exit code so the requested deployment log is complete. The deploy
command, credential source, confirmation gate, and working directory are unchanged.

Evidence: [initial verifier output](verify-live-before-fix.log),
[homepage diff](custom-domain-injection.diff),
[process page diff](process-domain-injection.diff),
[header change](headers-fix.diff), and
[deploy logging change](deploy-logging-fix.diff).

## Production verification

```sh
/Users/ls/Claude-Workspace/personal/sigouin-net/deploy/verify-live.sh https://sigouin.net /Users/ls/Claude-Workspace/personal/sigouin-net/site
```

Exit code: **0**. Attempt: **1/10**. Runtime:
8.951 seconds. Started at `2026-09-17T15:20:26.846824+00:00` and
finished at `2026-09-17T15:20:35.798335+00:00`.

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
/assets/proc/kingdom-idle-current-state-2026-09-17.webp 9c9902b573b9 9c9902b573b9 MATCH
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
/assets/still/05-ff-crest-cooking-the-lads.webp 6b1509b65be4 6b1509b65be4 MATCH
/assets/still/06-ff-ref-james-cook.webp       5ec9ba404bde 5ec9ba404bde MATCH
/assets/still/07-ff-ref-ladd-mcconkey.webp    95d2472677b4 95d2472677b4 MATCH
/assets/vid/cnvs-canvas-pullback-20260917.av1.mp4 9abd87c832d9 9abd87c832d9 MATCH
/assets/vid/cnvs-canvas-pullback-20260917.mp4 07390d13316f 07390d13316f MATCH
/assets/vid/cnvs-canvas-pullback-20260917.poster.webp dbd3ef6c3266 dbd3ef6c3266 MATCH
/assets/vid/sigz-neon-loop-20260917.av1.mp4   67d9ab97572e 67d9ab97572e MATCH
/assets/vid/sigz-neon-loop-20260917.mp4       cd52d616a6c6 cd52d616a6c6 MATCH
/assets/vid/sigz-neon-loop-20260917.poster.webp 9f92bf64da1f 9f92bf64da1f MATCH
/assets/vid/undergrowth-flyover-20260917.av1.mp4 6723e144bb05 6723e144bb05 MATCH
/assets/vid/undergrowth-flyover-20260917.mp4  480465273bba 480465273bba MATCH
/assets/vid/undergrowth-flyover-20260917.poster.webp 1fae09030d79 1fae09030d79 MATCH
/css/hub.css                                  d0727c513e38 d0727c513e38 MATCH
/data/bbc-state-2026-09-17.json               31914778ebe0 31914778ebe0 MATCH
/data/costs-timeline-20260917.json            c7f69dc86234 c7f69dc86234 MATCH
/data/sigz-tracks-2026-09-17.json             1561fd58ba89 1561fd58ba89 MATCH
/data/stills-costs-20260917.jsonl             4cd294d0412b 4cd294d0412b MATCH
/data/tee-teetimes-2026-09-17.json            b3c1ce32c575 b3c1ce32c575 MATCH
/                                             e246a01af166 e246a01af166 MATCH
Headers /: MATCH
/js/exhibits.js                               ef0037a482a9 ef0037a482a9 MATCH
/js/hub.js                                    eed2bb9f2e0a eed2bb9f2e0a MATCH
/js/live-hub.js                               3cc473707fce 3cc473707fce MATCH
/live.js                                      6ea36c097650 6ea36c097650 MATCH
/process/                                     6fbaa29ee8dd 6fbaa29ee8dd MATCH
Headers /process/: MATCH
Function /api/live/sigz/tracks: 200 JSON (sigzmusic.com)
Function /api/live/bbc/state: 200 JSON (bbc.sigouin.net)
```

## Live smoke checks

Captured at `2026-09-17T15:21:31.640314+00:00`. All five URLs returned 200. Each excerpt
below is exactly the first 200 body bytes, rendered as a JSON string so newline
escapes remain visible. Full bodies, headers, and separate 200-byte samples are
saved in [live-smoke/](live-smoke/); structured results are in
[live-smoke.json](live-smoke.json).

| Route | HTTP | Content-Type | Body bytes | First 200 body bytes |
|---|---|---|---|---|
| `/` | 200 | `text/html; charset=utf-8` | 2525 | `"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>Luc Sigouin: twelve exhibits</title>\n<met"` |
| `/process/` | 200 | `text/html; charset=utf-8` | 10411 | `"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>How it gets built: the fleet</title>\n<met"` |
| `/api/live/sigz/tracks` | 200 | `application/json` | 14387 | `"{\"tracks\":[{\"slug\":\"to-the-beach\",\"title\":\"To the Beach\",\"durationSeconds\":193,\"releaseDate\":\"2024-06-14\",\"accentColor\":\"#35E0FF\",\"description\":null,\"demo\":false,\"playCount\":40,\"albumSlug\":\"vybe\",\"tra"` |
| `/api/live/bbc/state` | 200 | `application/json` | 1000 | `"{\"setup\":{\"teamA\":{\"name\":\"Blue\",\"color\":\"#1d4ed8\"},\"teamB\":{\"name\":\"Green\",\"color\":\"#15803d\"},\"matchTarget\":18,\"bonuses\":[{\"id\":\"b1\",\"type\":\"ctp\",\"hole\":\"5\",\"points\":1},{\"id\":\"b2\",\"type\":\"ctp\",\"hole\""` |
| `/live.js` | 200 | `application/javascript` | 11057 | `"/** Browser ES module for the portfolio hub. No dependencies or import-time DOM work. */\n\nexport const LIVE_ROUTES = Object.freeze([\n  \"/api/live/sigz/tracks\", \"/api/live/sigz/albums\", \"/api/live/sigz"` |

`/api/live/sigz/tracks` has a `tracks` array and `X-Live-Source: sigzmusic.com`.
`/api/live/bbc/state` has `setup`, `scores`, and `bonusWinners` objects and
`X-Live-Source: bbc.sigouin.net`. Both bodies parse as JSON and neither has the
`{"error":"upstream","host":...}` error shape. Both pages and `live.js` also
matched their local bytes during the smoke check.

The separate requested HEAD check exited 0 and returned this CSP:

```text
$ curl -sI https://sigouin.net/ | grep -i content-security-policy
content-security-policy: default-src 'none'; script-src 'self' https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js 'sha256-i/v3n435qolquosYEoF5HFeHcApJE65vTLe7+0NDBZw='; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' blob: https://teetime.sigouin.net; frame-src https://undergrowth.pages.dev; media-src 'self' data: blob:; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'
```

Both pages also returned `Cache-Control: public, max-age=0, must-revalidate, no-transform`.

## Rollback reference and commands

The pre-deploy headers and requested curl SHA-256 pipeline are saved in
[pre-deploy.txt](pre-deploy.txt). Pre-deploy served homepage hash:

```text
164754e2274724d31e60b61df048cfcc46b491e53c22d83ee1569a54c0f107f5
```

The archived cream homepage's local hash is:

```text
8346d2ee15f6c36ba8900fe40ddd3d5cfc013a34d638ed667ecebc4c23a07d44
```

These hashes differ. The pre-deploy response body was not retained, so the cause
of that prior difference cannot be confirmed from the rollback capture. The
archive's 12 files still match the baseline taken before this deployment.

The following commands move the hub aside, restore the archived cream site,
and deploy it through the required script. They are documented only; no
rollback was performed.

```sh
(
  set -e
  test -d /Users/ls/Claude-Workspace/personal/archive/sigouin-net-cream-2026-09-17/site
  test ! -e /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/hub-before-rollback-9d9c5bd0
  mv /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r15-ship/hub-before-rollback-9d9c5bd0
  mv /Users/ls/Claude-Workspace/personal/archive/sigouin-net-cream-2026-09-17/site /Users/ls/Claude-Workspace/personal/sigouin-net/site
  CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
)
```

## Scope and integrity

Only `_headers` changed among the 78 prepared site files. All HTML, CSS, JS,
assets, data, and Function source retain their pre-deploy hashes. The cream
archive is unchanged. Local Wrangler state from each deploy was moved out of
`site/` into this evidence folder. See [deploy-checks.json](deploy-checks.json).

The credential file was sourced only by `deploy.sh`; it was never inspected or
printed. No git push, DNS edit, Cloudflare settings change, system browser launch,
or access to the work workspace occurred. No package was installed outside the
allowed Wrangler npx cache. The README and only the `sigouin-net/` bullet in the
workspace CLAUDE.md record the new live state and archive path.

## Could not verify

- Global propagation outside the edge serving these curl requests, or the exact arrival time between ten-second polls.
- Live browser rendering, physical-phone or Safari behavior, full video playback, and interactive gameplay were not rerun in this deploy lane. The prep report records its local browser checks.
- A rollback was not executed. The pre-deploy served hash differs from the archive's local homepage hash, and the pre-deploy HTML body was not captured, so exact reproduction of those prior served bytes is unverified.

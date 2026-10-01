# Round 15 ship prep

Prepared 2026-09-17. Requested and effective model: `gpt-6-astra`. The effective
model is confirmed by this exact Codex session's turn metadata. No deployment ran.

## What moved where

Moved the entire cream scrollcraft site with `mv` from
`/Users/ls/Claude-Workspace/personal/sigouin-net/site/` to
`/Users/ls/Claude-Workspace/personal/archive/sigouin-net-cream-2026-09-17/site/`.
All 12 files match their pre-move SHA-256 hashes. The archive README row records
the cream build live from 2026-09-03 to 2026-09-17, deploy `cc756f0c`, Luc's
replacement decision on 2026-09-17, and the move-back and approved deploy steps.
The archive date does not mean production changed during this lane.

The source at
`/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/` stays in place
and was not changed.

Copied only `fleet-r14-build/a/site/` into `sigouin-net/site/` with `cp -R`.
`promote.sh` requires `posts/` and `build.py`, so it does not fit this lane. No
lane shots, report, manifest, or result were copied. All 77 original lane site
files still match the baseline. The prepared site has 78 files. Its changes from
lane A are `_headers`, the proxy redirect fix below, and the wordmark's accessible
label in `index.html`. The label now says `SIGOUIN.NET`, matching the complete
visible heading; it had said only `Sigouin`. This also satisfies the attached
completion check's full-name requirement. Local Wrangler state was moved out of
`site/` into this report folder after each foreground server shutdown.

The project README now describes the two-page hub, Functions proxy, resolved
headers item, deploy gate, and old site's archive path. `baseline.json` and
`checks.json` record the integrity checks.

## Content Security Policy

`site/_headers` applies one `/*` rule in the format parsed by `verify-live.sh`:

```text
/*
  Content-Security-Policy: default-src 'none'; script-src 'self' https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js 'sha256-i/v3n435qolquosYEoF5HFeHcApJE65vTLe7+0NDBZw='; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' blob: https://teetime.sigouin.net; frame-src https://undergrowth.pages.dev; media-src 'self' data: blob:; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

| Directive | Why it is present |
|---|---|
| `default-src 'none'` | Denies resource types without an explicit allowance. |
| `script-src` | Local modules, the exact pinned model-viewer 3.5.0 script on unpkg, and only the SHA-256 hash of the process-page inline module. No inline script wildcard or eval. |
| `script-src-attr 'none'` | There are no inline event handlers. |
| `style-src` | Local CSS, Google Fonts CSS, and the inline styles in the HTML, exhibit controls, and model-viewer. `unsafe-inline` is confined to styles. |
| `font-src` | Font files come from fonts.gstatic.com. |
| `connect-src` | Self serves local JSON and GLBs; TeeTimes is fetched directly. Model-viewer's ImageBitmapLoader fetches blob URLs for embedded GLB textures. |
| `frame-src` | The only frame is the user-triggered Undergrowth game. |
| `media-src` | Local clips and data/blob media. No external video origin. |
| `img-src` | Local posters and captures, plus data/blob images used by the renderer. |
| `object-src 'none'` | No object or embed elements. |
| `base-uri 'none'` | No base element is needed. Relative URLs retain the document origin. |
| `form-action 'none'` | No form submissions. |
| `frame-ancestors 'none'` | The hub has no embedding requirement. Its own game frame is still allowed. |
| `worker-src 'none'` | The four shipped GLBs have no compressed-mesh or KTX2 extensions and need no decoder workers. All four loaded under this policy. |

The HTTP(S) scan covers both HTML files, CSS, all JS, and the Function. Full
results are in `external-references.json`. Fonts use fonts.googleapis.com and
fonts.gstatic.com; model-viewer uses unpkg.com; the direct API uses
teetime.sigouin.net; the frame uses undergrowth.pages.dev. Other hosts are
navigation links or server-side upstream/CORS constants: sigzmusic.com,
bbc.sigouin.net, sigouin.net, www.sigouin.net, livetvcan.com, and github.com.
They need no extra browser fetch permissions.

The same rule sends nosniff and strict-origin-when-cross-origin. Both page routes
served all three headers locally. Function JSON has its own nosniff header.
Page CSP is checked on HTML, without assuming it applies to Function responses.

## Deploy and verification scripts

Cloudflare's [Direct Upload Functions documentation](https://developers.cloudflare.com/pages/get-started/direct-upload/#functions)
says Wrangler takes functions from the directory where the command runs. The
[Functions setup guide](https://developers.cloudflare.com/pages/functions/get-started/#create-a-function)
also puts functions at the Pages project root. The allowed
`wrangler pages deploy --help` command was inspected. It describes the directory
argument as static assets and lists the working-directory override. Cached
Wrangler version: 4.133.0.

`deploy/deploy.sh` now uses `wrangler pages deploy .`, enters `"$SITE"` after the
existing confirmation gate, and invokes the quoted command array:

```sh
cd "$SITE"
OUTPUT="$("${COMMAND[@]}")"
```

The condition `if [ "${CONFIRM_DEPLOY:-0}" != "1" ]; then` is unchanged.
The refusal message now shows the working directory. Array quoting preserves
paths containing spaces. Shell syntax and source structure were checked. The
script was not executed, so its credential-sourcing path never ran.

`verify-live.sh` needed an update for both page routes and Functions. It maps
index files to `/` and `/process/`, excludes Function source, Wrangler state,
and Pages control files from static hashes, and strips carriage returns from
response headers. It checks CSP, nosniff, and referrer policy on both HTML
responses. Both required Function routes must return 200, the expected JSON
shape, and the correct X-Live-Source. Curl calls have timeouts. The existing
ten-attempt retry behavior remains.

## Proxy runtime fix

The first local run returned 200 for both pages and 502 for both JSON routes.
Temporary server diagnostics showed that this Workers runtime rejects
`redirect: "error"` before making the network request. Both upstreams separately
returned 200 to curl. The runtime error is recorded in `runtime-failure.txt`.

Only the promoted Function changed to `redirect: "manual"`. Its existing
`!upstreamResponse.ok` branch cancels and rejects 3xx responses, so redirects
still cannot leave the fixed allowlist. Temporary diagnostics were removed.
The [Workers Request reference](https://developers.cloudflare.com/workers/runtime-apis/request/#properties)
describes manual mode as returning the redirect response to the caller. That
page still lists error mode too; the observed runtime failure is the evidence
for this fix. The browser module's redirect setting was not changed.

## Local checks

The server ran in a separate controlled PTY, in the foreground, from
`/Users/ls/Claude-Workspace/personal/sigouin-net/site/`:

```sh
export TMPDIR="${TMPDIR:-/tmp}"
npx --yes --cache "$TMPDIR/npmcache" wrangler pages dev /Users/ls/Claude-Workspace/personal/sigouin-net/site --port 8799
```

TMPDIR was initially unset, so the first help invocation tried an invalid
`/npmcache` path. Its normal `/tmp` fallback confined downloads to the allowed
Wrangler cache. No other package or browser was installed. Wrangler compiled
the Worker and parsed one valid header rule. Without a configured compatibility
date, it used 2026-09-16.

The main shell used curl for all four URLs below. These are the final results
after the proxy fix. Each excerpt is exactly the first 200 body bytes. Full
captures, byte counts, hashes, and UTC times are in `local-curl/` and
`local-curl.json`. Initial failures are in `local-curl-before-fix.json`.

| Route | Status | Body bytes | UTC check time |
|---|---|---|---|
| `/` | 200 | 2525 | 2026-09-17T14:59:39.704767+00:00 |
| `/process/` | 200 | 10411 | 2026-09-17T14:59:39.706367+00:00 |
| `/api/live/sigz/tracks` | 200 | 14387 | 2026-09-17T14:59:39.974270+00:00 |
| `/api/live/bbc/state` | 200 | 1000 | 2026-09-17T14:59:39.988935+00:00 |

`/` first 200 bytes:

```text
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Luc Sigouin: twelve exhibits</title>
<met
```

`/process/` first 200 bytes:

```text
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>How it gets built: the fleet</title>
<met
```

`/api/live/sigz/tracks` first 200 bytes:

```text
{"tracks":[{"slug":"to-the-beach","title":"To the Beach","durationSeconds":193,"releaseDate":"2024-06-14","accentColor":"#35E0FF","description":null,"demo":false,"playCount":40,"albumSlug":"vybe","tra
```

`/api/live/bbc/state` first 200 bytes:

```text
{"setup":{"teamA":{"name":"Blue","color":"#1d4ed8"},"teamB":{"name":"Green","color":"#15803d"},"matchTarget":18,"bonuses":[{"id":"b1","type":"ctp","hole":"5","points":1},{"id":"b2","type":"ctp","hole"
```

`deploy/verify-live.sh http://127.0.0.1:8799` exited 0 on attempt 1: all 76 public
files matched local hashes, both page header sets matched, and both Function
routes returned the expected JSON. See `verify-local.log`. The initial failing
run is retained as `verify-local-before-fix.log`.

Additional local contract checks passed: an unknown proxy route returned 404;
POST to tracks returned 405 with `Allow: GET, HEAD`; HEAD to BBC returned 200.
All three returned the requested www CORS origin. See `proxy-contract.json`.

The existing Playwright Chromium headless shell, not the system browser, checked
both pages at 1440 and 390 pixels with reduced motion. There were no page errors,
CSP violations, or horizontal overflows. All four GLBs loaded on desktop. The
game iframe was inserted with its expected URL. Results and viewport captures
are in `browser-checks.json` and the four PNGs in this folder.

Stopped the foreground Wrangler shell with Ctrl-C. It exited 0 and port 8799 is
closed. Shell syntax checks pass; archive and lane hashes match. The largest
file is 2,381,660 bytes, below the
[25 MiB Pages upload limit](https://developers.cloudflare.com/pages/get-started/direct-upload/#limits).
`checks.json` records the final audit.

No deploy, DNS action, git push, or change under `Claude-Workspace/work/` occurred.
The credential file was not opened, read, quoted, or sourced.

## Could not verify

- Production deployment, custom-domain responses, and the production verify-live.sh run are reserved for the next lane after Luc gives the deploy go.
- Production edge cache TTL and project compatibility settings were not tested. Local Wrangler 4.133.0 used its default compatibility date 2026-09-16.
- Physical-phone and Safari behavior, full video playback, and interactive Undergrowth gameplay were not tested. Browser checks used the existing Playwright Chromium headless shell at 1440 and 390 pixels with reduced motion.

## Next lane commands

Only after Luc gives the deploy go, from
`/Users/ls/Claude-Workspace/personal/sigouin-net/`, run exactly:

```sh
CONFIRM_DEPLOY=1 deploy/deploy.sh
deploy/verify-live.sh
```

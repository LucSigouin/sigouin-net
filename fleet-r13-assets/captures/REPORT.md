# CAPTURES, round 13

All six live sites are captured. The package contains 42 full viewport PNGs, 42 WebP twins, four muted H.264 MP4 clips, and four WebP posters. Every image is in captures-index.html with its filename. The contact sheet also plays the clips. manifest.json lists every retained file with its absolute path, kind, source, poster where needed, and exact byte count.

Work started at 13:30 UTC on 2026-09-17. The first report draft was saved within four minutes. Work resumed at 13:58 UTC after the user approved visible game readiness for Undergrowth. The complete package is within the original 45 minute timebox.

## What was shot

Desktop captures are 1440 x 900. Phone captures are 390 x 844. All use deviceScaleFactor 1 and the real public pages.

| Site or route | Desktop frames | Phone frames | States |
|---|---:|---:|---|
| https://sigzmusic.com/ | 1 | 1 | Scroll 0%; the landing canvas does not scroll vertically |
| https://sigzmusic.com/music/ | 3 | 3 | 0%, 50%, 100% of the music list panel |
| https://teetime.sigouin.net/ and /m/ | 3 | 3 | Desktop root and phone /m/; 0%, 50%, 100% of the course list panel |
| https://undergrowth.pages.dev/ | 5 | 5 | Initial board, placed defenses, and 3, 8, 15 seconds after Start |
| https://sigouin.net/ | 3 | 3 | Current cream page at 0%, 50%, 100% document scroll |
| https://livetvcan.com/ | 3 | 3 | Marketing page only at 0%, 50%, 100% |
| https://bbc.sigouin.net/ | 3 | 3 | Scoreboard at 0%, 50%, 100%; no scores changed |

Capture metadata records the original URL, viewport, timestamp, scroll selector, requested percentage, actual pixel position, and scroll limit. TeeTimes lazy images change its list height. Its final captures recalculate the height until the requested position is within two pixels. The phone Sigz landing crops its wide logo at this viewport; that is the live layout and was preserved.

Undergrowth waits for a Start click. The approved readiness check used a visible nonzero canvas, an enabled Start control, loaded fonts, and a short render settle. Three Ballistas and one Catapult were placed through visible UI controls. Phone placements used the visible Place engine confirmation. The first wave was active at 3 seconds and had cleared by 8 seconds. The 8 and 15 second images accurately show the game waiting to start stage 2. No game state or debug hook was injected.

## Muted loops and image conversion

Every clip came from a Playwright recordVideo WebM. ffmpeg trimmed it to seven seconds and encoded H.264 MP4 at 25 fps, with faststart and no audio stream. Every WebP poster comes from second 1 of its delivered MP4. The Sigz music and TeeTimes clips scroll their native panels. The sigouin.net clip scrolls from the hero to the desk scene. Undergrowth shows the first wave and its cleared state.

| Clip | Duration | Dimensions | Bytes |
|---|---:|---|---:|
| sigouin-1440-scroll-20260917.mp4 | 7.00 s | 1152 x 720 | 581267 |
| sigz-music-1440-scroll-20260917.mp4 | 7.00 s | 1152 x 720 | 206791 |
| teetimes-1440-scroll-20260917.mp4 | 7.00 s | 1152 x 720 | 533402 |
| undergrowth-1440-play-20260917.mp4 | 7.00 s | 1152 x 720 | 292756 |

The largest PNG is 1359711 bytes. The largest screenshot WebP is 164160 bytes. Every image is under 1.5 MB and every video is under 3 MB. Asset filenames include the capture date.

Installed ffmpeg has no WebP encoder, and macOS sips lists WebP as read-only. The already installed cwebp encoded PNG twins and posters at quality 88. Nothing was installed. ffmpeg handled H.264 encoding and poster extraction.

## Public endpoint probes

cors-probe.json records four curl GET requests with Origin: https://sigouin.net. No redirects were followed. curl called only the four requested endpoint paths.

| Endpoint | Status | Access-Control-Allow-Origin | Cache-Control | Body bytes |
|---|---:|---|---|---:|
| https://sigzmusic.com/api/tracks | 200 | absent | private, max-age=120 | 14387 |
| https://teetime.sigouin.net/api/teetimes | 200 | * | public, max-age=60 | 68328 |
| https://teetime.sigouin.net/api/courses | 200 | * | public, max-age=60 | 25859 |
| https://bbc.sigouin.net/api/state | 200 | absent | absent | 1000 |

All responses were JSON. The first three included charset=utf-8. BBC returned application/json. Sigz and BBC returned no allow-origin header. TeeTimes returned a wildcard allow-origin header.

Spend: USD 0. Paid generation credits used: 0. Before balance: not queried, since no paid account was used. After balance: not queried. No generation spend occurred.

## Verification

Headless Microsoft Edge 153.0.4234.32 used the already installed playwright-core. All PNG and WebP dimensions match their requested viewport. All scroll captures are within two pixels of the requested percentage. All 88 images decode in the local contact sheet. All four clips advance during playback and seek to second 6. ffprobe confirms H.264, seven second duration, 720 pixel height, and zero audio streams. Representative desktop and phone frames, posters, and clip frames were inspected visually.

verify-media-20260917.py exits 0 with 42 capture pairs, four videos, no errors, and no missing deliverables. The required check-assets.py command exits 0. gate-check-20260917.json records its exact command, output, and exit code.

All browser processes were closed by PID and checked for remaining Edge processes using this lane. No HTTP server was started. browser-processes-20260917.json records the checks. Temporary browser profiles, scout frames, and raw video intermediates were removed after verification.

## Could not verify

- The original window.__garden condition. The production bundle contains no such development hook. Initial waits failed. The user then explicitly approved visible game readiness, which was used for every game capture. The evidence and approval are in garden-readiness-20260917.json.
- Future live data or page content. Capture and probe timestamps record the observed session.
- Physical phone rendering. Phone captures use a 390 x 844 touch viewport in headless Edge.
- Credentialed CORS requests or preflight behavior. The requested probes measure GET response headers only.

## Rubric self-check

| # | Criterion | Status and evidence |
|---|---|---|
| 1 | Real, not invented | Pass. All six running public sites are captured. Game actions used visible controls. No fake UI or injected game state. |
| 2 | Web-ready | Pass. All PNG and WebP images fit the cap. Four seven second H.264 MP4s have no audio, fit the cap, and have WebP posters from second 1. Asset names are dated. |
| 3 | Manifest twin | Pass. Every retained file has a path, kind, source, and exact bytes. Every video has a poster. Image sources include URL, viewport, scroll, and timestamp. |
| 4 | Honesty | Pass. The missing development hook, approved fallback, tool limitation, unverified items, and zero spend are recorded. |
| 5 | Scope | Pass. Writes stayed inside this lane. No .env or secret file was opened. No login, push, deploy, publish, system browser, or work/ access occurred. |
| 6 | Plain words | Pass. Short factual prose. No em dashes. |

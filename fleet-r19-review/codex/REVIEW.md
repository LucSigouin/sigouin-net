## Correctness

19 findings: C01 to C13, S01 to S03, P01 to P03. Source locations are relative to `site-snapshot/`, except the explicitly named round 13 test. The snapshot contains 76 files and 19,874,675 bytes. The original and snapshot matched byte for byte before and after the review. SHA-256 of the sorted, newline-separated `relative-path:SHA256(file)` manifest, without a final newline: `59a83c06812ef7d7d6335a549acbce5ce447a661afe89dbbc8aeb05ea8668e09`.

The actual CSP blocks the process page script entirely, as detailed in S01. Process interaction and layout checks below used a diagnostic response without that header. Neither HTML nor other snapshot files were edited.

- **C01 [medium] Live results never refresh or recover.** `js/live-hub.js:39`, `js/live-hub.js:58`. The cache keeps the first promise for the lifetime of the page. Input: return 502 for SiGz, let the sample succeed, restore the API, then select SiGz again. The page still shows the sample and makes no new API request. A successful first result also remains labelled live indefinitely, including after an overnight tab session. There is no expiry, refresh, visibility refresh, or age-based stale marking. The polling helpers in `live.js:38` are not used by the hub.

- **C02 [medium] A slow response leaves permanent loading text.** `js/live-hub.js:44`, `js/live-hub.js:49`, `js/live-hub.js:64`. Input: keep the TeeTimes response or a proxy response pending. After 8.6 seconds, every affected slot still reads `...`, without a stale class or explanatory note, and no sample request has started. Neither primary nor sample fetch has an abort deadline. The eight-second timeout in `live.js:19` does not apply to these raw fetch calls. Repeated exhibit swaps also leave async `paint()` continuations holding detached live nodes while the shared promise remains pending.

- **C03 [medium] Hidden panes keep their media active.** `js/hub.js:117`, `js/hub.js:158`, `process/index.html:212`, `process/index.html:219`, `css/hub.css:292`. Input: at 390x844, open TeeTimes and press Back to the index. After the hide transition, the video has `visibility: hidden` through its parent but `paused === false` and an advancing playback time. Resizing a desktop video exhibit to 844x390 does the same. Load the Undergrowth iframe and press Back: it stays attached in the hidden stage. On the process page, P1 and P3 videos remain playing after switching to P6. There is no pane-close, resize, or page-visibility media cleanup. Actual exhibit replacement does detach the old iframe and pause the removed video; the failure is hiding an existing pane or scene.

- **C04 [medium] Reduced motion does not stop process video or model rotation.** `process/index.html:17`, `process/index.html:34`, `process/index.html:65`, `process/index.html:206`, `js/hub.js:39`. Input: load the process page with `prefers-reduced-motion: reduce`. All three video elements still autoplay, including hidden P3; each advanced about 0.69 seconds in the check. Skipping the explicit `play()` call does not remove HTML `autoplay`. Every generated model viewer also has unconditional `auto-rotate`. `js/hub.js:6` takes only an initial preference reading, so changing the preference later does not stop an already playing stage video.

- **C05 [medium] Moving within the same rail row resets its exhibit.** `js/hub.js:91`, `js/hub.js:107`, `js/hub.js:111`. Input: select TeeTimes, then move the pointer between its number and title. Bubbling `pointerover` calls `select()` again, resets `mediaIndex`, and replaces the video node even though the exhibit did not change. Focus followed by click also renders the same exhibit twice. This restarts media and can discard the selected layer or loaded game when returning to the current rail row. There is no same-exhibit or related-target guard.

- **C06 [medium] Wheel handling misses notches and unlocks during a gesture tail.** `process/index.html:248`, `process/index.html:249`, `process/index.html:251`. Input sequence from P1: `deltaY=100` at 0 ms, `deltaY=3` at 200 ms, then `deltaY=9` at 450 ms. It reaches P3. The small event returns before resetting the timeout, so the lock expires 380 ms after the first event, rather than after the last event. Separately, repeated `deltaY=3, deltaMode=1` events never leave P1 because line units are compared to the eight-pixel threshold without conversion.

- **C07 [medium] Keyboard focus stays behind the phone stage.** `js/hub.js:103`, `js/hub.js:111`, `js/hub.js:117`, `css/hub.css:290`. Input: at 390x844, click SiGz and press Tab. Focus moves to the covered TeeTimes rail button and changes the open stage to TeeTimes. The rail remains focusable underneath the stage, opening does not move focus into the stage, and closing does not restore focus to the selected rail button. Escape can leave focus on an element inside the now-hidden stage.

- **C08 [medium] Keyboard input reaches the hidden hub during the overture.** `js/hub.js:111`, `js/hub.js:127`, `js/hub.js:142`, `css/hub.css:21`. Input: during the first second, focus About this page and press Tab twice. At 264 ms, focus reached TeeTimes, started its video, and moved `body.scrollTop` to 63 while the header was still 700 px tall. `overflow: hidden` does not prevent focus-driven scrolling. The settled flag does not gate interaction, and the main pane is not inert during the animation.

- **C09 [high] Phone landscape clips content while document-size checks pass.** `css/hub.css:135`, `css/hub.css:138`, `css/hub.css:244`, `css/hub.css:263`, `css/hub.css:297`, `css/hub.css:302`. Input: load or resize into 844x390 or 667x375. The rail buttons exceed their clipped grid cells; at 844x390, row 1 is 33.1 px tall but its button is 58.3 px tall, cutting off the year and keyword. Process P3 loses part of the gate transcript and its tools. The ledger Close button ends near y=502, below either landscape viewport, with scrolling disabled. Rotating an already-open ledger from 390x844 to 844x390 reproduces this. At 667x375 the RsyncGui stage media is only 32 px high. Width breakpoints and minimum font sizes do not make the content fit a short pane.

| Viewport | Document width and height | Content result |
| --- | --- | --- |
| 1440x700 | Match viewport on both pages | Ten exhibits, eight scenes, and ledger fit |
| 1280x1024 | Match viewport on both pages | Ten exhibits, eight scenes, and ledger fit |
| 390x844 | Match viewport on both pages | Tested content fits |
| 844x390 | Match viewport on both pages | Rail years clipped; P3 note needs 312 px in 178 px; ledger needs 461 px in 299 px |
| 667x375 | Match viewport on both pages | Rail clipped; several scene tool lists clipped; P3 needs 312 px in 169 px; ledger needs 461 px in 284 px |

- **C10 [medium] P6 displays overlapping images instead of a pair.** `css/hub.css:178`, `css/hub.css:242`, `process/index.html:120`. Input: select P6 at 1440x700. Both images have the same rectangle, x=446.4, y=63.1, width=993.6, height=594.2. The later `.scene__frame img` rule changes both pair children back to absolute positioning with `inset: 0`. The Kimi image covers the Claude image despite the left/right caption.

- **C11 [medium] TeeTimes accepts old data and elapsed tee times as current availability.** `live.js:225`, `live.js:235`, `js/live-hub.js:21`. Input: a non-mock feed for 2026-09-17 with one live course, one available slot at `07:00`, and `fetchedAt: 2026-09-17T11:00:00Z`. At `now: 2026-09-18T02:00:00Z`, which is still September 17 in Toronto, the helper returns one open slot although its time has passed. The hub also ignores `fetchedAt` when deciding stale status, so an old same-day response stays bright. Date matching alone cannot substantiate availability now.

- **C12 [medium] A JSON error becomes a successful spend total.** `js/hub.js:82`, `js/hub.js:84`, `js/hub.js:86`. Input: return HTTP 502 with `{"error":"unavailable"}` for `data/stills-costs-20260917.jsonl`, then select Imagegen. The display reads `1 images, 0.00 USD, logged`. The code checks neither `res.ok` nor the row schema, treats the missing amount as zero, and caches the false success for the session.

- **C13 [low] Stepper tab focus and selection disagree.** `process/index.html:209`, `process/index.html:215`, `process/index.html:237`. Input: focus the P1 dot, press ArrowRight, then Space. ArrowRight changes the scene but leaves focus on P1; Space selects P1 again. All eight dots are tab stops. Elements advertised as `role="tab"` have no `aria-selected`, panel association, or matching focus movement.

The listener and timer checks found no growing event-listener count across 100 exhibit swaps: the rail retained one click, pointerover, and focusin listener, and the stage retained one click listener. `live.js:27`, `live.js:64`, `live.js:84`, `live.js:117`, and `live.js:158` clear the helper deadlines, polling interval, visibility listener, animation frame, and motion listener on their documented completion or stop paths. The overture timeout at `js/hub.js:143` is not cancelled after animation completion, but it is one callback that safely repeats the settled check. It does not accumulate. The actionable wheel timer error is C06.

Checks executed: `node --check` passed for all five `.js` files, including the asset-removal Function, and the extracted process module passed module syntax checking. All 19 round 13 `live.test.mjs` tests passed against snapshot `live.js`. The unmodified proxy suite, retargeted in memory to the snapshot Function and original fixtures, passed 10 of 11 tests. Its sole failure is the obsolete `redirect: "error"` assertion at `fleet-r13-assets/proxy/functions/api/live/proxy.test.mjs:114`. Updating only that expectation in memory to `manual` and adding real 301, 302, 303, 307, and 308 response cases produced 12 passing tests. No test or source file was edited.

## Security

- **S01 [high] The CSP rejects the entire process stepper.** `_headers:2`, `process/index.html:193`. Input: serve the snapshot with its own `_headers` policy and open `/process/`. Chromium reports an inline script violation; there are zero active scenes, zero dots, no ledger handler, and no settled flag. The allowed hash is `sha256-i/v3n435qolquosYEoF5HFeHcApJE65vTLe7+0NDBZw=`, while the actual script hashes to `sha256-IYNRftI8B3bvenb0AQ6+qbICNVd01rc38tGYwO7oPYk=`. The obsolete allowed hash is unused. Inline hashes include exact whitespace, so syntax checks and a static server that ignores `_headers` miss this failure. [CSP script hash rules](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).

- **S02 [medium] The live game iframe has no sandbox.** `js/hub.js:123`. Input: select Undergrowth, choose play it, and load the game. The actual element has only `src`, `title`, `loading="lazy"`, and `allow="fullscreen"`. `allow` is a Permissions Policy attribute, not a sandbox. The child retains normal iframe capabilities, including forms and user-activated popups or top navigation, subject to browser rules. The same-origin policy prevents reading the parent DOM but does not supply these sandbox restrictions. Add only the sandbox permissions the game requires and verify play and fullscreen. This is missing containment, not evidence that the game is malicious. [Iframe sandbox and allow attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).

- **S03 [low] An unused public data file exposes workspace details.** `data/costs-timeline-20260917.json:4`, `data/costs-timeline-20260917.json:15`. Input: request `/data/costs-timeline-20260917.json` from the static snapshot. The 66,636-byte file exposes 154 entries with absolute local source paths, project names, providers, and spend records. No HTML, JavaScript, or CSS references it. Keep the raw workspace log outside the publishable tree, or publish a deliberately reduced version.

External browser URLs and the policy that applies, from `index.html:8`, `index.html:13`, `process/index.html:8`, `js/live-hub.js:18`, and `js/exhibits.js:40`:

| URL | Use and CSP result |
| --- | --- |
| `https://fonts.googleapis.com` | Preconnect hint on both pages for the stylesheet origin |
| `https://fonts.gstatic.com` | Preconnect hint on both pages for the font origin |
| `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap` | Both pages; allowed by `style-src https://fonts.googleapis.com` |
| `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwgknk-4.woff2` | Observed JetBrains Mono font; allowed by `font-src https://fonts.gstatic.com` |
| `https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjnTLgNs.woff2` | Observed Instrument Serif regular font; allowed by `font-src https://fonts.gstatic.com` |
| `https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7Motmp5g.woff2` | Observed Instrument Serif italic font; allowed by `font-src https://fonts.gstatic.com` |
| `https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js` | Index script; exact URL allowed by `script-src` |
| `https://teetime.sigouin.net/api/teetimes` | Direct browser fetch; allowed by `connect-src https://teetime.sigouin.net` |
| `https://undergrowth.pages.dev` | Game iframe after the load button; allowed by `frame-src https://undergrowth.pages.dev` |

The font URLs above are those returned to the tested Chromium user agent. The preconnect hints are not stylesheet or font payloads; the subsequent requests are allowed by the directives shown. No external resource was blocked by CSP in the exercised index paths, including all four GLBs. The blocked script is the inline process module in S01.

The outbound links in `js/exhibits.js:8`, `:21`, `:34`, `:46`, `:58`, `:69`, and `:108` are, respectively, `https://sigzmusic.com`, `https://teetime.sigouin.net`, `https://undergrowth.pages.dev`, `https://bbc.sigouin.net`, `https://livetvcan.com`, `https://github.com/LucSigouin/rsyncgui`, and `https://sigouin.net`. They are ordinary top-level navigations, not resource loads governed by this policy's `connect-src` or `frame-src`.

Every proxy upstream URL is fixed in `functions/api/live/[[path]].ts:15`. Browser CSP does not govern these server-side fetches:

| Proxy route | External upstream URL | Used by current hub |
| --- | --- | --- |
| `/api/live/sigz/tracks` | `https://sigzmusic.com/api/tracks` | Yes |
| `/api/live/sigz/albums` | `https://sigzmusic.com/api/albums` | No |
| `/api/live/sigz/health` | `https://sigzmusic.com/api/health` | No |
| `/api/live/bbc/state` | `https://bbc.sigouin.net/api/state` | Yes |
| `/api/live/tee/teetimes` | `https://teetime.sigouin.net/api/teetimes` | No, the browser uses the direct URL |
| `/api/live/tee/courses` | `https://teetime.sigouin.net/api/courses` | No |

`https://sigouin.net` and `https://www.sigouin.net` at Function lines 23 and 24 are CORS response values, not extra upstreams. Tests confirmed exact path matching, GET and HEAD only, discarded query strings, and no forwarding of client Cookie, Authorization, Range, arbitrary headers, or body. `redirect: "manual"` at line 88 and the status check at line 91 reject all five tested redirect statuses without following Location. The five-second abort stays active through JSON body consumption and is cleared in `finally` at line 101. These checks passed with mocked fetch and cache APIs.

Function lines 40, 66, 95, and 104 reconstruct responses from parsed JSON, strip upstream Set-Cookie and other headers, cache only successful results with `public, max-age=60`, and return errors with `no-store`. Cache hits apply CORS after lookup and do not reflect arbitrary origins. The 502 body at line 99 exposes `{"error":"upstream","host":"sigzmusic.com"}` or the other fixed public hostname, and `X-Live-Source` exposes the same host. This is deliberate disclosure of already-linked public hosts, not a private homelab hostname or upstream exception trace. No credentials or upstream body are included in the error.

Remaining CSP details at `_headers:2`: local scripts, styles, images, videos, fixtures, and proxy calls use their respective `'self'` permissions. Inline styles at `index.html:31` and `js/hub.js:52` and `:55` are allowed by `style-src 'unsafe-inline'`; there are no inline event handlers requiring an exception to `script-src-attr 'none'`. The current site has no `data:` image references or `data:`/`blob:` video references, so those allowances exceed the first-party markup. Model viewer did fetch embedded GLB textures through `blob:` URLs, so its `connect-src blob:` allowance is used; image blob handling may also be needed by its browser fallback. All four GLBs have no compression extensions. The library's optional Draco, Basis, and Lottie loader URLs were not requested and are not allowed by the current policy: `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`, `https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/`, and `https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/loaders/LottieLoader.js`. They are unused code paths, not broken current asset loads.

Cloudflare does not apply static `_headers` rules to Function responses. The proxy supplies its own JSON content type, cache policy, CORS, and `nosniff`; the asset-removal Function supplies its own CSP and 404 headers. [Cloudflare header scope](https://developers.cloudflare.com/pages/configuration/headers/).

## Performance

- **P01 [high] An eager 3D library holds up the entire index.** `index.html:13`, `index.html:58`. A cold load fetches the model viewer before any GLB is selected: 935,194 decoded bytes, about 252.8 KB transferred with gzip in the check. Input: keep that CDN response pending. At 3.4 seconds the CSS overture had collapsed, but the rail had zero rows, the stage was empty, and `hub.js` had not set the settled flag. Aborting the CDN request let the hub render ten rows. Loading the viewer only when a GLB is requested removes both startup bytes and this unrelated availability dependency.

- **P02 [medium] The process page fetches hidden media immediately.** `process/index.html:17`, `process/index.html:34`, `process/index.html:51`, `process/index.html:65`, `css/hub.css:235`. Input: open P1 without stepping. All seven image URLs belonging to P2, P4, P5, P6, P7, and P8 were requested, totalling 2,079,787 bytes. `loading="lazy"` does not defer these images because the hidden scenes occupy the same viewport rectangle. All three autoplay videos start despite `preload="none"`. The canvas clip is represented by two independently playing elements, in the header and P1. Attach sources when selecting a scene and pause media on exit.

- **P03 [low] Fourteen unreferenced assets add 1,829,408 bytes to the site.** The asset scan compared every `assets/` relative path with all HTML, JavaScript, and CSS text. All runtime asset names in this build are literal paths. These files have no references; they increase the published tree, not initial transfer bytes. Binary assets have no source line numbers.

| Unreferenced asset | Bytes |
| --- | ---: |
| `assets/cap/livetvcan-390-scroll0-20260917.webp` | 24,242 |
| `assets/cap/sigouin-1440-scroll0-20260917.webp` | 42,630 |
| `assets/cap/sigouin-390-scroll0-20260917.webp` | 18,564 |
| `assets/cap/sigz-music-1440-scroll-20260917-poster.webp` | 22,766 |
| `assets/cap/sigz-music-1440-scroll-20260917.mp4` | 206,791 |
| `assets/cap/sigz-music-1440-scroll50-20260917.webp` | 28,816 |
| `assets/cap/sigz-music-390-scroll0-20260917.webp` | 21,324 |
| `assets/cap/teetimes-1440-scroll0-20260917.webp` | 117,296 |
| `assets/cap/teetimes-1440-scroll50-20260917.webp` | 112,578 |
| `assets/cap/teetimes-390-scroll0-20260917.webp` | 52,866 |
| `assets/cap/undergrowth-1440-scroll0-ready-20260917.webp` | 161,142 |
| `assets/cap/undergrowth-390-scroll0-play8s-20260917.webp` | 39,368 |
| `assets/proc/gate-red-green.txt` | 920 |
| `assets/proc/sigouin-live-2026-09-17.png` | 980,105 |

Before the index overture ended, a cold 1440x700 browser replay completed these response bodies. All listed index responses finished within 257 ms, before the 2550 ms curtain end:

| Category | Decoded response bytes |
| --- | ---: |
| Snapshot HTML, CSS, four client JS modules, overture image, and initial stage image | 225,480 |
| Model viewer library | 935,194 |
| Google Fonts CSS | 6,857 |
| Three font files | 62,064 |
| SiGz and TeeTimes responses, replayed from the saved fixtures | 82,715 |
| Total | 1,312,310 |

CDP reported 630,608 encoded bytes including response headers in that run. This is a controlled replay, not a production transfer estimate: snapshot responses and fixture APIs were fulfilled locally without compression, browser routing disabled cache reuse, and the fonts and model viewer came from their real servers. The process replay without the blocking CSP completed 3,567,445 decoded bytes by 2.7 seconds, including both requests for the 564,822-byte canvas video. A production cache or range handling may avoid transferring that file twice; two video elements still need playback work.

The image preload at `index.html:11` and the overture image at `index.html:19` use the same URL and produced one request. `fetchpriority="high"` applies to that image. The first stage image at `js/exhibits.js:13` is loaded eagerly by `js/hub.js:127`, including before opening the phone stage. Other stage layers are created only when selected. Stage videos have posters and `preload="none"`, but their autoplay and explicit `play()` start selected videos immediately. GLBs have `loading="lazy"` and an interaction poster; those attributes do not defer the library script. The iframe is genuinely attached only after the load button, with its later hide problem covered by C03.

`css/hub.css` is 17,632 bytes and is linked once per page. The duplicate-block scan found no identical selector/declaration blocks. `css/hub.css:278` redundantly sets the same overture animation name already assigned at line 55. The consequential repeated image positioning rules are the P6 conflict in C10, not a second CSS download.

## Top 10

1. [bug] Move the process module to a local JS file and verify both pages with the actual CSP, fixing the dead stepper in S01.
2. [perf] Load model viewer on first GLB selection so an optional CDN cannot hold the index empty, fixing P01.
3. [bug] Scope the process image positioning rule so P6's two captures remain side by side, fixing C10.
4. [bug] Guard same-exhibit selection and pointer movement within a row to prevent media resets, fixing C05.
5. [bug] Give primary and sample fetches abort deadlines and an explicit failed state, fixing C02.
6. [bug] Replace the permanent promise cache with refresh, expiry, and stale-age handling, fixing C01 and the age part of C11.
7. [bug] Pause hidden videos and detach the hidden game on close, resize, and scene changes, fixing C03.
8. [bug] Normalize wheel units and extend the debounce for small tail events, fixing C06.
9. [sec] Keep the unused raw workspace cost timeline outside the public site, fixing S03.
10. [bug] Add a layout for short landscape panes and check content bounds as well as document bounds, fixing C09.

## Could not verify

- Production Cloudflare Functions, deployed `_headers`, edge cache age and eviction, actual CORS responses, and real upstream outages were not executed. Proxy tests used the snapshot Function with mocked fetch and caches. The live domain runs the previous round and was not used as evidence for this snapshot.
- Real browser playback quality, audible behavior, H.264 fallback, battery use, Safari, Firefox, and physical phones or tablets were not verified. Installed headless Chromium 153.0.8010.12 did execute the snapshot, advance video playback, and load all four GLBs. No system browser was launched or software installed.
- Actual Undergrowth gameplay, its child-page network dependencies, fullscreen, and the minimum compatible sandbox permissions were not verified. A local response stub at the frame URL was used to check attachment, detachment, and hiding.
- Real trackpad inertia, real multitouch, safe-area behavior, browser chrome changes, and device orientation sensors were not exercised. Wheel sequences, a touch swipe, keyboard input, reduced motion, viewport resizing, and the five listed viewport sizes were exercised in the headless harness.
- Production transfer bytes, media range requests, CDN cache reuse, and bandwidth-limited startup timings remain unmeasured. Performance totals above identify the locally replayed and remote responses separately.

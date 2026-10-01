# Live sigouin.net review — 2026-09-24

1. **P1: The landing fallback is a dead end for keyboard users.** Reduced-motion desktop, landscape touch, and failed WebGL hide every navigation control. Keep an ordinary **Enter hub** link visible in all modes. `site/vybe/render-only.css:3`.
2. **P1: Reduced motion does not stop the process videos.** Three clips were playing with the preference enabled. Apply the policy to every clip and provide a pause control. `site/js/bg.js:12`.
3. **P1: Process content is clipped on short screens.** At 320×568 and 844×390, the ledger Close button is below the clipped pane; scene P3 also loses text. Allow pane scrolling. `site/css/hub.css:272`, `:291`.
4. **P1: Hub keyboard handling breaks native buttons.** Space on the focused Map button does nothing; Enter works. Exempt interactive elements from game key interception. `Sigouin-Hub/src/core/input.ts:34`.
5. **P1: The process page requests hidden-scene media immediately.** Its initial snapshot contained 3.69 MB of resource bodies, including P7's 684 KB image and a playing P3 video before those scenes were selected. Load media only when its scene is selected. `site/js/process.js:22`.

No confirmed P0 security blocker. Review only; no site changes or builds. Paths below are relative to the project root. **Rebuild “Yes” means rebuild Sigouin-Hub and copy its output through the established release flow; do not edit hashed bundles directly.**

| ID / severity | File:line | What breaks / evidence | Smallest fix | Rebuild? |
|---|---|---|---|---|
| F01 / P1 | `site/vybe/render-only.css:3`; `site/vybe/render-only.js:3`; `site/vybe/app.js:28` | The CSS hides Explore, navigation and content. Reduced-motion desktop and landscape touch have zero visible controls; Tab stays on the body in reduced mode. A click-only scene listener is the only retry. With WebGL disabled, or JS disabled on desktop, there is likewise no visible route into the hub. “You can still explore the page” is false in this layout. Evidence: `reduced.json`, `landscape.json`, `fallback.json`. | Add a visible HTML `<a href="/hub/">Enter hub</a>` outside hidden containers, available without JS/WebGL. Keep any 3D retry separately keyboard operable. | No |
| F02 / P1 | `site/js/bg.js:12`; `site/process/index.html:25`, `:42`, `:73`; `site/js/process.js:27` | Only `video[data-bg]` is paused. With reduced motion, all three remaining clips had `paused:false`, `autoplay:true` and currentTime ≈2.5 s. No pause button exists for normal-motion visitors either. `process-reduced.json`. | Remove unconditional autoplay; start only the visible scene when motion is allowed. Pause all clips for reduced motion/save-data and expose a global pause control. | No |
| F03 / P1 | `site/css/hub.css:272`, `:291`; `site/js/process.js:54`, `:69` | `overflow:hidden` makes content inaccessible on short viewports. At 320×568 P3 requires 357 px in 259 px; ledger requires 560 px in 433 px and Close ends at y=627. At 844×390 ledger Close ends at y=502. `process-clipping.json` and `process-ledger-320.png`. | Use `overflow:auto` on notes/ledger and let wheel/swipe scroll an overflowing pane before advancing scenes; retain the existing ledger toggle/Escape exit. | No |
| F04 / P1 | `Sigouin-Hub/src/core/input.ts:34` | Global keydown ignores only inputs/textareas and prevents Space on buttons. Live Map test: `spaceOpened:false`, `enterOpened:true`; same handler also intercepts arrows while the links view is open. `journey.json`. | Ignore events originating in buttons, links, selects, editable areas and dialogs; intercept movement keys only when game input owns focus. | Yes |
| F05 / P1 | `site/js/process.js:22`; `site/process/index.html:42`, `:73`, `:146`; `site/css/hub.css:263` | Scenes share the viewport and are only visibility-hidden. Initial resource entries already include images for later scenes (including `landing-live-winner.png`, 683,629 bytes); P3's hidden video plays. `loading="lazy"` does not provide scene-level deferral here. `show()` never pauses the previous clip. `process.json`. | Store inactive media URLs in data attributes, hydrate current/next scene deliberately, and pause all videos outside the active scene. | No |
| F06 / P1 | `Sigouin-Hub/index.html:5`; deployed `site/hub/index.html:5` | `user-scalable=no` asks mobile browsers to suppress zoom, including the plain HTML fallback where users may need enlarged text. This is a source/served-markup finding; physical-device pinch behavior was not tested. | Remove `user-scalable=no`; restrict gesture interception to the 3D canvas. | Yes |
| F07 / P2 | `site/vybe/style.css:1`; `site/index.html:21` | An Inter TTF downloads even for the portrait still: 150,512 encoded bytes of 293,606 total resource bytes (51%). Almost all visible lettering is baked into images; hidden status/instruction text still uses the font. `portrait.json`. | Use a system font for this render-only surface, or scope/subset a WOFF2 font to genuinely visible DOM text. | No |
| F08 / P2 | `deploy/deploy.sh:22`; `site/js/hub.js:1`; `site/js/exhibits.js:15` | Old portfolio code remains in the deploy tree but no site HTML/JS/CSS imports `hub.js`; only that dead module imports `exhibits.js`. Seventeen asset basenames have zero references in **any** site HTML/JS/CSS/JSON: 3,405,600 bytes. This is deployment/storage weight, not first-paint traffic. See exact list below and `dead-grep.json`. | Archive proven orphan assets and the unreachable old module chain outside `site/`; keep assets used by `/process/`. | No |
| F09 / P2 | `site/js/process.js:2`; `site/js/live-hub.js:6`, `:75`; `site/data/costs-timeline-20260917.json:1` | Process imports live-feed code and calls `paintAll()` but has no `[data-live]` slots. It downloads `live-hub.js` and `live.js` without fetching any feed. Cost timeline (66,636 bytes) has no site-code reference; stills-cost JSONL is referenced only by dead `hub.js:82`. | Remove the unused process import/call; archive the unreachable cost data. Keep sample feed data only if another supported surface needs it. | No |
| F10 / P2 | `site/_headers:2` | The global policy still permits the external model-viewer script at unpkg and the Undergrowth frame used by the retired exhibit system. No reviewed live surface requests either; the obsolete frame reference is in `site/js/exhibits.js:40`. This is excess trust, not an observed exploit. | Remove unused external script/frame allowances after confirming no retained route needs them. Keep the import-map hash and WASM allowances needed by the landing. | No |
| F11 / P2 | `deploy/deploy.sh:22`; `site/runescape/fixture/build_fixture.py:1` | Deploying `.` publishes development inputs: the fixture builder and `fixture/raw-items.json` both return 200 and match local bytes. The fixture itself is **not** dead: `site/runescape/app.js:28` uses it for explicit/failure fallback. | Exclude only builder/raw-source inputs from the publish tree, or stage an explicit release tree; retain runtime fixture data/images. | No |
| F12 / P2 | `Sigouin-Hub/playwright.config.ts:17`; `Sigouin-Hub/tests/site.spec.ts:2` | The documented `SITE_URL=... npx playwright test ...` still starts `npm run build && npx vite preview` because `webServer` is unconditional. It is not a read-only live-test command as written. | Set `webServer` only when `SITE_URL` is absent and provide separate local/live output paths. | No |
| F13 / P2 | `Sigouin-Hub/src/content/projects.json:10`, `:38`, `:66`, `:94`; `site/hub/index.html:50` | All twelve deployed entries are “Coming soon” with null URLs/images. The plain “links” version contains no links or return-home action when opened directly. This is an incomplete content destination; placeholder intent is not assumed to be a runtime bug. `hub-links.json`, `hub-links.png`. | Populate approved project entries or clearly label the hub a preview; add a Home link to the plain view. | Yes |
| F14 / P2 | `README.md:3`; `Sigouin-Hub/README.md:66`, `:79`, `:80`; `site/process/index.html:33` | Current docs name deployment `91e52cf6` versus the task's verified `fafc78f3`; hub docs say always High/no setting and primitive character, while live reports Medium and model. RsyncGui is absent from current content. Process says “Back to the ten” but returns to the workstation. | Update the production pointer and hub behavior docs; rename the process back link “Home.” Keep historical sections explicitly historical. | No |
| F15 / P2 | `site/js/process.js:18`; `site/process/index.html:198`; `site/css/hub.css:340` | Scene buttons declare tab/tablist roles but use `aria-current` without tab selection/panel associations. Mobile dots are 9×9 px with narrow spacing. | Use ordinary scene-navigation buttons with `aria-current`, or implement complete tabs; enlarge hit areas without enlarging the visible dots. | No |

## Evidence and coverage

The three live HTML responses matched local `site/` SHA-256 values. CSP, `nosniff` and Referrer-Policy were present on `/`, `/hub/`, `/process/`. All 29 same-origin HTML `href/src/poster` targets checked returned 200 (`html-links.json`); browser observations had no missing-image, page-error or CSP-error evidence. No blanket claim is made about every external destination or every asset in the publish tree.

Functions review: `site/functions/api/live/[[path]].ts:15` fixes six upstream URLs; lines 53–66 reject unknown paths and strip query/cache variation; lines 84–96 omit credentials, reject redirects and keep the five-second deadline through JSON consumption. Live GET checks returned JSON for all six routes on the final pass; arbitrary-path request returned 404 and a `?url=` query on health still returned health. One initial TeeTimes request returned 502 and the repeat returned 200; persistent upstream failure was not established. No user-controlled upstream/redirect path or reflected HTML sink was found. No load/abuse test was performed. The four removed-asset Function routes each returned real 404. Routing and header evidence is retained in `http.json`.

Deployment inspection: `deploy.sh` deploys the working `site/` directory with pinned Wrangler; it does not explicitly create a clean staging tree. **Sampled `.wrangler` cache/database URLs returned the same HTML fallback as a nonexistent path, not matching the local private files. No `.wrangler` leak is claimed.** `verify-live.sh:19` dynamically enumerates the current tree, maps nested `index.html` to routes, checks HTML headers and hashes, and explicitly prunes `.wrangler`/Functions. It therefore includes `/hub/` and `/process/`; its API health gate covers only SiGz tracks and BBC state (`:72`), not the other four APIs or browser behavior. I inspected it rather than running its large ten-retry whole-tree sweep. No credential file, deploy command, build or push was run.

The source review covered landing modules and media selection; process HTML/CSS/JS; hub boot, input, UI, content, renderer, quality, transitions, character/world/interior loading and test hooks; both Functions; routing/headers; deployment/promotion/verification scripts. Deployed `site/hub` was the browser target throughout; newer `Sigouin-Hub/dist` was not used.

### Payloads actually observed

Fresh isolated Chromium contexts, normal local network, no throttling. Body bytes below sum Resource Timing `encodedBodySize` **after initial settling**, excluding HTML and HTTP headers; they are not a full waterfall or a claim that every byte precedes first paint. Cross-origin resources without timing permission may report zero. Videos can issue multiple range requests. First paint is the browser's measured event, not 3D readiness.

| Route / mode | Resource body bytes | First paint | What loads |
|---|---:|---:|---|
| `/` desktop | 4,827,547 | 176 ms | Poster/CSS/module entry, then Three modules, 3,477,944-byte workstation GLB, 433,756-byte HDR, signal art and font; live canvas reached. |
| `/` portrait 390×844 | 293,606 | 120 ms | Both rack stills, CSS/entry scripts and font; **no workstation GLB/Three**. Rack toggle and Enter worked. |
| `/` landscape touch 844×390 | 199,956 | 100 ms | Mobile poster, CSS/scripts/font; still mode with no visible controls. |
| `/` reduced motion desktop | 230,546 | 112 ms | Desktop poster, CSS/scripts/font; no 3D until pointer opt-in. |
| `/process/` | 3,694,469 | 536 ms | CSS/fonts/scripts, posters, background/video requests and images for hidden scenes. |
| `/process/` reduced motion | 3,129,647 | 144 ms | Background is paused, but other clips and hidden images still load. |
| `/hub/` desktop / mobile | 1,995,281 | 124 / 152 ms | Boot shell, entry/CSS, app/Three/furniture, 1,747,064-byte Luc model. Interior chunks load on entry. |
| `/hub/?links` | 5,349 | 128 ms | Entry/CSS and Cloudflare speculation response; no app/Three/model. |

The site tree contains approximately 22.2 MB in legacy `assets/`, 7.84 MB in `vybe/`, and 2.70 MB in `hub/` (uncompressed file bytes). The separately published RuneScape app is not counted as dead merely because the three primary routes do not link to it. Measurements do not establish real-phone FPS or slow-network readiness.

### Proven unreferenced assets

For each basename below, `rg -n -F BASENAME site -g '*.html' -g '*.js' -g '*.css' -g '*.json'` returned **1 with no matches**. `dead-grep.json` records each result and byte size; none appeared in the route network captures. These are old screenshot/video assets, not dynamically named world textures. Source/deployment location for this finding is F08 above.

- `site/assets/bg-b-1080-20260917.{av1.mp4,mp4,poster.webp}`
- `site/assets/cap/livetvcan-390-scroll0-20260917.webp`
- `site/assets/cap/sigouin-{1440,390}-scroll0-20260917.webp`
- `site/assets/cap/sigz-music-1440-scroll-20260917{.mp4,-poster.webp}`
- `site/assets/cap/sigz-music-1440-scroll50-20260917.webp`
- `site/assets/cap/sigz-music-390-scroll0-20260917.webp`
- `site/assets/cap/teetimes-{1440-scroll0,1440-scroll50,390-scroll0}-20260917.webp`
- `site/assets/cap/undergrowth-1440-scroll0-ready-20260917.webp`
- `site/assets/cap/undergrowth-390-scroll0-play8s-20260917.webp`
- `site/assets/proc/gate-red-green.txt`
- `site/assets/proc/sigouin-live-2026-09-17.png`

Additional chain proof: exact `hub.js` import/path search returned no matches; `exhibits.js` is imported only from that unreachable file. `process.js` still imports `live-hub.js` → `live.js`, so those two are **currently requested** and must not be described as unloaded assets. Process images/videos/CSS remain in use.

### Checks and limits

- Nine lane-local read-only Playwright observations: desktop/reduced/portrait/landscape landing, normal/reduced process, desktop/mobile hub and plain links. All passed; saved JSON and screenshots accompany this report.
- Three focused checks passed: complete return journey plus native button behavior, all process scenes at three small sizes, and landing fallback with WebGL/JS disabled. These tests record existing defects; passing does not mean accessibility passed.
- Original `Sigouin-Hub/tests/site.spec.ts` passed against live using `journey.config.cjs`, which has **no webServer/build** and writes outputs into this lane.
- `node Sigouin-Hub/node_modules/typescript/bin/tsc --noEmit -p Sigouin-Hub` exited 0. This checks current source types, not equivalence between all source and deployed bundles.
- Four-interior/twelve-card keyboard review passed: every room entered/exited, every card opened/closed, and no page/console errors (`rooms.json`). Total: 14 Playwright checks passed across the four lane-local configs.
- Visual inspection covered landing, rack portrait, process, desktop/mobile hub and plain links. Alt text is present on reviewed images; canvas entry and several keyboard paths were exercised. Text contrast was visually inspected but not exhaustively measured; VoiceOver, Safari, physical phones, gamepad, real device GPU/memory and slow-network tests remain unverified.

## Rubric self-check

| Criterion | Yes/no | Evidence / boundary |
|---|---|---|
| 1. Every live surface, Functions, headers, routing, deploy | Yes | Source inspection plus live HTTP/browser evidence described above. |
| 2. Findings have location and observed/source evidence | Yes | F01–F15; live assertions tied to saved captures; source-only zoom/deploy/doc claims identified. |
| 3. Severity discipline | Yes | No P0 claimed; P1 visitor defects; P2 optimization/content/maintenance. |
| 4. Dead weight with grep proof | Yes | 17 files, 3,405,600 bytes, exact per-file `rg` exits plus dead module chain. |
| 5. Smallest fix and rebuild cost | Yes | Every finding includes both. |
| 6. Plain language, top five first | Yes | Five actionable priorities precede the full reference table. |

Reviewer model: **gpt-6-astra**, read from this session’s runtime `turn_context` metadata. CNVS spawned the Codex default without an explicit model flag, so `result.json` identifies the actual evidence source rather than claiming an unseen spawn flag.

# sigouin.net live review — claude lane (2026-09-24)

Scope: `/`, `/hub/`, `/process/`, Pages Functions, `_headers`, `_routes.json`, `deploy/`.
Evidence: `curl` against https://sigouin.net (2026-09-24 ~12:50 UTC), `grep` over `site/`, `npx tsc --noEmit -p Sigouin-Hub` (exit 0), full `deploy/verify-live.sh` run (result at bottom).
No P0 found. Nothing leaks, the proxy is safe, headers cover every HTML route.

## Top 5

1. **`deploy/verify-live.sh` cannot pass right now.** Cloudflare injects a bot-check inline script (`window.__CF$cv$params`, different on every request) into `/runescape/`. That page is not under a `no-transform` rule, so its hash never matches the local file and all 10 attempts fail. The same injected script also hits every soft-404 page, and the CSP blocks it there (a console error). Seen 3/3 times on `/runescape/` and 0 times on `/`. Fix: add `/runescape/*` (or `/*`) `no-transform` in `_headers`, or remove runescape (plain edit).
2. **No 404 page, so every missing URL returns 200 + the landing page.** `/robots.txt`, `/hub/nope`, `/hub/assets/nope.js` all come back as HTML with status 200, and under `/hub/assets/` it is cached `immutable` for a year. After a hub deploy, an open old tab lazy-loads a removed chunk, gets HTML, and the 3D hub dies. Fix: add `site/404.html` (plain edit).
3. **`/runescape/` is live but nobody knows it.** 187 MB, 3,456 files, linked from nowhere, in no brief or README. It is 97% of every deploy and of every verify run. It also ships `build_fixture.py` and raw fixtures publicly. Fix: decide if it should be public; if not, move it out of `site/`.
4. **17 MB of dead files ship on every deploy.** 54 of 72 files in `site/assets` + `site/data` are requested by no live page. The same goes for `js/hub.js`, `js/exhibits.js`, and `vybe/assets/player-background.webp`. `/process/` still loads `live-hub.js` + `live.js` for **zero** `data-live` slots. Fix: delete them (plain edit).
5. **Keyboard and reduced-motion users have no way into the hub from `/`.** The render-only CSS hides every link and button. In still mode, entry is a mouse click on a plain `<div>`, and there is no `<a href="/hub/">` in the DOM. Also, landing JS/CSS are cached 4 h in browsers despite `_headers` saying 0 (#13), so deploys can mix old and new modules. Fix: add one focusable `/hub/` link, and set the zone to respect origin cache headers.

## Full findings

| # | Sev | Where (file:line) | What breaks | Smallest fix | Rebuild? |
|---|---|---|---|---|---|
| 0 | P1 | `site/_headers:6-14` (no rule for `/runescape/`); `deploy/verify-live.sh:54-58` | Live `/runescape/` body has an extra inline `<script>(function(){…window.__CF$cv$params={r:'…'…` before `</body>`, a new one each request (3/3 curls). Local hash `9c1c0935471f` vs live `955b2578fe6f` means DIFF, so verify-live fails every attempt. The injected script is blocked by the CSP (no hash), so the console shows an error. The same happens on soft-404 pages. | Add `/runescape/*` + `/runescape/` `Cache-Control: …, no-transform`, or remove runescape. Longer term, turn off the zone bot-JS injection for this host. | No |
| 1 | P1 | `site/` has no `404.html`; `site/_headers:6-14` | Every unknown path returns 200 + the landing HTML (13,239 B, observed on `/nope-404`, `/robots.txt`, `/favicon.ico`, `/hub/nope`, `/process/x`). Search engines index soft 404s. | Add `site/404.html`. That switches off the SPA fallback. | No |
| 2 | P1 | `site/_headers:16-17` + missing 404 | `/hub/assets/nope.js` → 200 `text/html`, `cache-control: public, max-age=31536000, immutable`, `cf-cache-status: HIT`. After a deploy, an old `/hub/` tab's lazy `import()` of `app-*.js`/`furniture-*.js` gets HTML. With nosniff that is a hard module failure, so the user sees the "could not start" fallback. | Same `404.html` fix. | No |
| 3 | P2 | fallback copy of `site/index.html:45,48` | The fallback copy is not under the `/` `no-transform` rule. Cloudflare Email Obfuscation rewrites `mailto:` to `/cdn-cgi/l/email-protection…` and injects `email-decode.min.js` (seen in the `/robots.txt` body). Harmless now, but it proves the no-transform guard only covers 3 exact paths. | `404.html` fixes it. Or turn Email Obfuscation off for the zone. | No |
| 4 | P1 | `site/runescape/index.html:1` (whole dir) | Live at `/runescape/` (200), orphaned: no link from `/`, `/hub/`, `/process/`, and not in `README.md` or the task brief. 187 MB / 3,456 files. `/runescape/fixture/build_fixture.py` and `raw-items.json` are public. It also carries third-party game images (see its `CREDITS.md`), so check the licence before keeping it public. | Decide: keep it and document it, or move it to `archive/`. | No |
| 5 | P2 | `site/runescape/` + `deploy/verify-live.sh:20-24` | `verify-live.sh` curls all ~3,590 files one by one. Its run takes minutes, and 97% of that is runescape. It also times out as noise instead of signal. | Move runescape out, or hash only a manifest of routes. | No |
| 6 | P1 | `site/assets/**`, `site/data/**` | 54 of 72 files (17.0 MB) are referenced by no live page: `assets/cap/*` (26), `assets/glb/*` (8, incl. 2.4 MB `sigz-neon-sign`), `assets/vid/*` (6), `assets/still/*` (4), `assets/proc/*` (5), `bg-b-*` (3), `data/costs-timeline`, `data/stills-costs`. Proof: `grep -F <basename>` over `process/index.html css/hub.css js/*.js live.js index.html vybe/*.js vybe/*.css` finds nothing. | Delete them, or move to `archive/`. | No |
| 7 | P2 | `site/js/hub.js:1`, `site/js/exhibits.js` | Only referenced by each other and by a comment. No HTML loads `hub.js`. It is the old 09-17 portfolio hub (model-viewer, undergrowth iframe). | Delete both. | No |
| 8 | P2 | `site/js/process.js:1-2` → `site/js/live-hub.js:6` → `site/live.js` | `/process/` downloads 2 extra modules (~14 KB) and calls `paintAll()`, but `process/index.html` has **0** `data-live` nodes (`grep -c` = 0). Pure waste. | Drop the import and the call. Then `live-hub.js`, `live.js`, `data/*.json` are dead too. | No |
| 9 | P2 | `site/js/live-hub.js:11,20,29` | Sample fallback paths are relative (`data/…`). From `/process/` they resolve to `/process/data/…`, which returns 200 HTML (checked), so `res.json()` throws. The fallback could never have worked. Moot if #8 is done. | Delete, or use `/data/…`. | No |
| 10 | P2 | `site/vybe/assets/player-background.webp` | 268 KB, never requested: 0 references in `index.html` or `vybe/*.js`/`*.css`. `Inter-OFL.txt` is also unreferenced, but that is a licence file, so keep it. | Delete the webp. | No |
| 11 | P2 | `site/_headers:2` | The CSP still allows things no live page uses: `https://unpkg.com/@google/model-viewer@3.5.0/…`, the second script hash `sha256-i/v3n4…` (matches no inline script in `index.html`, `hub/index.html`, `process/index.html`, or `runescape/index.html`; only the importmap hash `lmntmx…` matches), `connect-src https://teetime.sigouin.net`, `frame-src https://undergrowth.pages.dev`. Every extra allowance is attack surface. | Remove all four after #7 and #8. | No |
| 12 | P2 | `site/_headers:1-4` | No `Strict-Transport-Security` on any response (checked `/`, `/hub/`, `/process/`). HTTP → HTTPS 301 works, but the first visit is downgradable. | Add `Strict-Transport-Security: max-age=31536000; includeSubDomains`. Or enable HSTS in the zone. | No |
| 13 | P1 | `site/_headers:19-20` vs live | `/vybe/*` says `max-age=0`, but live JS/CSS send `public, max-age=14400, must-revalidate` (`/vybe/style.css`, `workspace.js`, `render-only.js`, also `/js/process.js`, `/css/hub.css`). `.glb` keeps 0. Only `app.js?v=perf-20260923` and `signal.css?v=…` are busted. `workspace.js:1-5` imports `mobile-zoom.js`, `cables.js`, `signal.js` with no version tag. | Zone: Caching → Browser Cache TTL = "Respect Existing Headers". Or version every import. | No |
| 14 | P1 | `site/vybe/render-only.css:3`; `site/vybe/app.js:11`; `site/index.html:17` | `.skip-link`, the header, `h1`, `.content` and `.mobile-explore` are all `display:none`. In still mode (`prefers-reduced-motion`, Save-Data, `?still`), the canvas never mounts (its `tabIndex=0` is at `workspace.js:19`) and `#explore-3d` is hidden. That leaves no focusable control on the desktop page, and the hub is mouse-only. No `<a href="/hub/">` exists at all. | Add one `<a href="/hub/" class="sr-only-focusable">Enter the hub</a>`. | No |
| 15 | P2 | `site/index.html:39-45` | About 9 KB of copy (about, homelab, gaming, music, projects, field notes, contact) ships, but `render-only.css:3` hides all of it. Visitors and screen readers get none of it, including the only contact link. | Delete it, or show a trimmed version on focus. | No |
| 16 | P1 | `site/vybe/vendor/three/three.core.js:1`, `three.module.js` | The landing ships **unminified** three r186: 2.1 MB raw, 418 KB gzip (measured). The hub ships its own minified copy (`three-_mNVCict.js`, 181 KB gzip). Landing → hub downloads three.js twice, about 240 KB of that avoidable. | Swap in `three.module.min.js` + `three.core.min.js` from the same release. | No |
| 17 | P2 | `site/vybe/style.css:1` | Inter is served as a 325 KB TTF (153 KB gzip) for a page whose text is all hidden. | Use a woff2 Latin subset (~25 KB), or drop it. | No |
| 18 | P2 | first paint `/`, desktop live mode | Bytes before the scene is live: `workstation.glb` 3.48 MB (no transfer compression), `studio.hdr` 434 KB, three 418 KB gz, draco 63 KB gz + 58 KB, plus posters. About 4.6 MB. Phones and still mode get the ~40–70 KB webp only, which is good. | Drop the HDR to a 1k `.hdr` or a PMREM-baked `.ktx2`; meshopt-compress the glb. | No |
| 19 | P2 | `Sigouin-Hub/index.html:5` → `site/hub/index.html:5` | `user-scalable=no` blocks pinch zoom on Android (a WCAG 1.4.4 failure) on the text fallback list too. | Remove `user-scalable=no`. Keep `touch-action:none` on the canvas only. | Yes (hub) |
| 20 | P1 | `Sigouin-Hub/src/content/projects.json:10-19` → `site/hub/index.html:50-68` | The hub's plain-list fallback shows 12 × "Coming soon" and zero links. `canvas aria-label` (`site/hub/index.html:35`) promises "the same projects are listed as plain links". The live site links to none of Luc's live projects (sigzmusic, teetime, undergrowth). | Fill in `url`/`title` for real projects, or reword the aria-label. | Yes (hub) |
| 21 | P2 | `site/functions/api/live/[[path]].ts:15-22` | No live page calls `/api/live/*` (grep over `site/hub/assets`, `site/vybe`, `site/js` finds only the dead `live-hub.js`/`live.js`). It is still a public relay. 502s are not cached (`:98-99`), so a caller can hammer the upstream and wait out the 5 s timeout. Observed: `/api/live/tee/teetimes` returned 502 after 5.10 s once, then 200 (61 KB) on retry. The teetimes upstream fans out to 28 third-party courses. | Drop the `tee/*` routes (unused), or cache 502s for ~30 s. | No |
| 22 | P2 | `site/functions/api/live/[[path]].ts:31` | `forClient` always sets ACAO to apex or www even on 404/405. Fine, but `www.sigouin.net` serves the site itself (200, no redirect to apex). That means duplicate content, and two cache keys for the Function (`:66` uses `url.origin`). | 301 www → apex (zone redirect rule). | No |
| 23 | P2 | `site/process/index.html:198`, `site/js/process.js:18` | `role="tablist"`/`role="tab"` with `aria-current` and no `aria-selected`/`tabpanel`. Screen readers announce broken tabs. | Drop the roles (plain buttons with `aria-current="step"`). | No |
| 24 | P2 | `site/process/index.html:129-130` | Two `<img>` have no `width`/`height`, so the layout shifts. | Add `width="1440" height="900"`. | No |
| 25 | P2 | `site/process/index.html:8-10` | Google Fonts are loaded from Google, so every `/process/` visit sends the visitor's IP to Google. They are the only third-party request on the site. | Self-host the 2 families. Then drop the googleapis/gstatic CSP entries. | No |
| 26 | P1 | `Sigouin-Hub/playwright.config.ts:17-22` | `webServer` always runs `npm run build && vite preview`, even when `SITE_URL` is set. The "pre-approved read-only" `SITE_URL=https://sigouin.net npx playwright test tests/site.spec.ts` in RULES.md therefore **rebuilds `dist/`**, which is a write. I did not run it for that reason. | `webServer: process.env.SITE_URL ? undefined : {...}`. | No (config) |
| 27 | P2 | `deploy/deploy.sh:21,32` | Uploads all of `site/` as is. It relies on wrangler's built-in ignore list for `.wrangler/` (4.3 MB of miniflare state + `account_id`). Live `/.wrangler/cache/pages.json` returns the SPA fallback, so it is not served today. There is no explicit exclude, no size/file-count check, and no check that `site/hub` came from the intended build (`Sigouin-Hub/dist` is already newer). | Deploy from a staging copy made with `rsync --exclude .wrangler --exclude runescape …`, and print the file count. | No |
| 28 | P2 | `deploy/deploy.sh:17-19` | `set -a; source personal/.env` exports **every** variable in that file into `npx wrangler` and its install scripts. | Export only `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`. | No |
| 29 | P2 | `deploy/verify-live.sh:73` | Checks only the `sigz/tracks` and `bbc/state` Functions. It never checks `/hub/` boot, a 404 status, or `Cache-Control`, so findings #1, #2, #13 all pass it. | Add `curl -o /dev/null -w %{http_code} /nope` == 404 and one cache-header assert. | No |
| 30 | P2 | `README.md:8-30` | Still describes the 09-17 "portfolio hub" (round 22, deploy `3d91385e`, 76 files, exhibits, `live.js`). Only line 3 reflects the current Vybe + `/hub/` site. `deploy/REPORT.md` and `deploy/result.json` are fleet leftovers inside the deploy tool folder. | Rewrite lines 8-30. Move the two leftovers to `releases/`. | No |
| 31 | P2 | `releases/*/site-before/` | 1.5 GB of full `site/` copies, each with a 185 MB runescape. Not live, but 10× duplication in the project folder. | Keep the latest 2. Tar the rest. | No |

## verify-live.sh result

Ran a copy of `deploy/verify-live.sh` with only `mktemp -d` swapped for a scratch dir (the sandbox blocks the default temp dir). Attempt 1 checked all ~3,590 files in about 12 minutes:

```
Attempt 1/10
/runescape/                                   9c1c0935471f 955b2578fe6f DIFF
Function /api/live/sigz/tracks: 200 JSON (sigzmusic.com)
Function /api/live/bbc/state: 200 JSON (bbc.sigouin.net)
Attempt 2/10
```

Every other file MATCHed, and security headers on all 4 HTML routes (`/`, `/hub/`, `/process/`, `/runescape/`) MATCHed. I stopped it at attempt 2: the DIFF is a new random value every request, so all 10 attempts would fail (about 2 h). **Verdict: live matches local except the Cloudflare injection. The script exits 1 today.**

## Not verified

- Rendered visuals, contrast ratios, real phone portrait/landscape, and actual first-paint waterfall (no browser run; see #26 for why Playwright was not run).
- Whether wrangler actually uploads `.wrangler/`. Only proven: it is not served.
- Cloudflare zone settings (Browser Cache TTL, Email Obfuscation, HSTS) are inferred from response headers, not read from the dashboard.

## Rubric self-check

| Criterion | Pass | Note |
|---|---|---|
| 1 Coverage | Yes | `/`, `vybe/*`, `/process/`, `/hub/` (built + src entry/content/config), both Functions, `_headers`, `_routes.json`, all 3 deploy scripts. Also found `/runescape/`. |
| 2 Evidence | Yes | Every live claim is from curl output in this session; every dead-file claim is from grep. |
| 3 Severity | Yes | No P0; P1 only for real breakage/a11y/perf. |
| 4 Dead weight | Yes | #6–#10 with grep proof. 17 MB + runescape 187 MB. |
| 5 Fix cost | Yes | Every row has a fix + rebuild flag. Only #19 and #20 need a hub rebuild. |
| 6 Plain language | Yes | Top 5 first. |

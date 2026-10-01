# fleet-r23-review — merged summary (orchestrator, 2026-09-24)

Two independent read-only reviewers: claude (Opus 5.5, 32 findings, 10 P1) and codex (gpt-6-astra, 15 findings, 6 P1). No P0. Both verified live == local `site/` for `/`, `/hub/`, `/process/`.
Full reports: `claude/REPORT.md`, `codex/REPORT.md` (+ codex evidence JSON/screenshots).

## Both reviewers agree (fix first)

| # | Sev | Finding | Fix | Rebuild hub? |
|---|---|---|---|---|
| 1 | P1 | Landing `/` has NO keyboard/reduced-motion/no-WebGL way into the hub: every link is `display:none`, entry is a click on a div. `site/vybe/render-only.css:3` | Add one visible `<a href="/hub/">Enter hub</a>` | No |
| 2 | P1 | `/process/` loads ~3.7 MB up front incl. hidden scenes; reduced-motion only pauses `[data-bg]`, 3 other clips keep playing. `site/js/bg.js:12`, `site/js/process.js:22` | Defer inactive-scene media, pause all clips under reduced motion | No |
| 3 | P1 | Hub `user-scalable=no` blocks pinch zoom, incl. on the text fallback. `Sigouin-Hub/index.html:5` | Remove it; `touch-action:none` on the canvas only | Yes |
| 4 | P1 | Hub plain-list fallback = 12 × "Coming soon", zero links, no Home. `Sigouin-Hub/src/content/projects.json` | Populate or label as preview; add Home link | Yes |
| 5 | P1 | Playwright config always runs `npm run build` even with `SITE_URL` set: the "read-only live test" writes `dist/`. `Sigouin-Hub/playwright.config.ts:17` | `webServer: process.env.SITE_URL ? undefined : {...}` | No |
| 6 | P2 | Dead weight shipped every deploy: 54/72 files in `site/assets`+`site/data` (17 MB), `js/hub.js`, `js/exhibits.js`, `vybe/assets/player-background.webp`; `/process/` imports `live-hub.js`+`live.js` for zero slots | Delete | No |
| 7 | P2 | CSP still allows unpkg model-viewer, undergrowth iframe, a stale script hash. `site/_headers:2` | Trim | No |
| 8 | P2 | `/process/` tablist roles incomplete (no `aria-selected`/panels); mobile dots 9 px | Plain buttons + `aria-current`; bigger hit areas | No |
| 9 | P2 | `deploy.sh` ships raw `site/` (relies on wrangler ignore for `.wrangler/`; publishes `runescape/fixture/build_fixture.py` + raw fixtures) | Deploy from an rsync'd staging copy | No |
| 10 | P2 | README still documents the 09-17 portfolio hub; deployment id stale (`91e52cf6` vs live `fafc78f3`) | Rewrite | No |

## Only claude found (verify before acting)

- **P1 `/runescape/` is live, 187 MB / 3,456 files, linked from nowhere, in no README.** 97% of every deploy and verify run. Luc decides: keep public, or move out of `site/`.
- **P1 `deploy/verify-live.sh` fails today**: Cloudflare injects a per-request bot-check script into `/runescape/` (no `no-transform` rule there) → hash never matches. Fix: `no-transform` for `/runescape/*`, or remove runescape.
- **P1 no `404.html`**: every unknown URL is 200 + landing HTML; under `/hub/assets/` it is cached immutable for a year → an old open hub tab that lazy-loads a removed chunk dies. Fix: add `site/404.html`.
- **P1 cache mismatch**: `_headers` says `max-age=0` for `/vybe/*` but live JS/CSS send `max-age=14400` (zone Browser Cache TTL overrides). Old+new modules can mix after a deploy.
- P2 no HSTS header. P2 `www.sigouin.net` serves the site with no redirect to apex. P2 Google Fonts on `/process/` is the only third-party request. P2 `deploy.sh` `set -a; source .env` exports every variable to wrangler.
- P2 `/api/live/*` is a public relay nobody calls now (only dead `live-hub.js`); 502s uncached.

## Only codex found

- P1 Hub global keydown swallows Space on native buttons (Enter works). `Sigouin-Hub/src/core/input.ts:34`. Rebuild.
- P1 `/process/` clips content on short screens (320×568, 844×390): ledger Close button off-pane. `site/css/hub.css:272,291` → `overflow:auto`.
- P2 Inter TTF (150 KB) downloads on the portrait still where all text is baked into images.

## Not verified by either
Real phones, Safari, VoiceOver, contrast numbers, real-device FPS, whether wrangler uploads `.wrangler/` (only proven: not served).

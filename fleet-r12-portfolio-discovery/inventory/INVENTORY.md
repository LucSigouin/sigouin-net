# Exhibit inventory: Luc's personal workspace

Scope: every top-level dir under `/Users/ls/Claude-Workspace/personal/` plus every row of
`/Users/ls/Claude-Workspace/personal/archive/README.md`. Built 2026-09-17, read-only.
All paths are absolute. All asset counts come from `find` with `node_modules`, `.git`,
`masters` and `DerivedData` pruned.

Endpoint checks were plain GET, no keys, no writes.

Groups: Live, Local only, Archived, Dead.

---

## LIVE

### sigzmusic

- **What it is:** Luc's own music site under his artist name SiGz. Press play, the catalogue
  streams from his own server, no platform in the way.
- **Stack:** one Cloudflare Worker, D1 catalog, private R2 audio, AES-128 encrypted audio-only
  HLS, SPA with a persistent bottom player bar.
- **Status:** LIVE at https://sigzmusic.com (200). The old worker host
  `sigzmusic.luc-sigouin.workers.dev` returns 404 on `/api/health`, so treat the apex as the
  only live address.
- **Live data endpoints (all public, verified 200):**
  - `https://sigzmusic.com/api/tracks` returns JSON, 14387 bytes, a `tracks` array with slug,
    title, durationSeconds, releaseDate, accentColor, playCount, albumSlug, trackNumber.
    Real per-track play counts.
  - `https://sigzmusic.com/api/albums` returns JSON, 1242 bytes, the 6 records.
  - `https://sigzmusic.com/api/health` returns JSON, 11 bytes.
  - Declared in source but NOT probed: `/api/albums/:slug`, `/api/mixes`, `/api/mixes/:slug`,
    `/api/play/:slug`, `/api/key/:slug` (key handout, do not expose), `/api/admin/publish`
    (admin, do not expose). Source: `/Users/ls/Claude-Workspace/personal/sigzmusic/site/src`.
- **Visual assets on disk:**
  - `/Users/ls/Claude-Workspace/personal/sigzmusic/site/public` 155 image files (cover art,
    OG images, icons).
  - `/Users/ls/Claude-Workspace/personal/sigzmusic/brand` 30 images, including
    `brand/source/Neon-Sigz.HEIC`, `brand/source/neon-sign.jpg`, `neon-sign-1600.jpg` and
    three Spotify artist crops. The HEIC and those crops are the only copies.
  - `/Users/ls/Claude-Workspace/personal/sigzmusic/artwork-lab` 29 images.
  - `/Users/ls/Claude-Workspace/personal/sigzmusic/security-audit/shots/ripped-ytdlp.mp4`
    1 clip, a recorded proof that the old stream could be ripped.
  - Whole project: 281 png, 129 jpg, 30 webp, 12 svg, 1 mp4, 1 heic (masters pruned).
  - `masters/` is 12 GB of source audio and was deliberately not scanned, except that
    `masters/Released Tracks/Social/youtube/` holds at least 6 mp4 music videos
    (Croozin, HypCOStic, FOMO, Medicated Drama, Wanted, Miran).
- **The hook:** the waveform. Peaks are precomputed per track (`peaks.json`, real -1..+1
  floats), so a waveform on the hub is real data, not decoration. Per-record accent colours
  with acid lime `#C6F53C` reserved for now-playing.
- **Process artifacts:** 43 `REPORT.md` files, the most of any project. Fleet dirs
  `fleet-fix-review-findings` (4 SCORE.md: frontend-player, publisher, secrets-auth,
  worker-data), `fleet-loose-ends`, `fleet-mobile-chrome`, `fleet-mobile-rebuild`,
  `fleet-vibe-fix`. Boards: `security-audit/workbench.html`, `artwork-lab/workbench.html`.
  Rubrics and scores in `player-page/`, `design-audit/`, `reports/lanes/`, `mobile-fix/`,
  `ios/lanes/SCORER-TASK.md`.
- **Show it as:** a live waveform strip driven by `/api/tracks`, with play counts ticking and
  the record accent colour flooding the panel on hover.

### teetimes

- **What it is:** a map of every open golf tee time near you in the Ottawa area, with a link
  out to the course's own booking page. No booking inside the app.
- **Stack:** Cloudflare Worker API plus two static front ends (desktop and phone), MapLibre
  map, Chronogolf as the live data source.
- **Status:** LIVE at https://teetime.sigouin.net since 2026-09-15, one Worker serving
  desktop at `/`, phone at `/m/`, API at `/api/*`. Private repo `LucSigouin/teetimes`.
  Paused 2026-09-14 per `STATUS.md`.
- **Live data endpoints (verified 200):**
  - `https://teetime.sigouin.net/api/courses` JSON, 25859 bytes. Course objects with id,
    name, city, province, lat, lng, holes, vendor, bookingUrl, website, phone, verified,
    live, photo.url. Ready-made map pins with photos.
  - `https://teetime.sigouin.net/api/teetimes` JSON, 82239 bytes. The big one, real slots.
  - `https://teetime.sigouin.net/api/health` JSON, 42 bytes.
  - `https://teetime.sigouin.net/m/` HTML, 2565 bytes, the phone app.
  - `https://teetime.sigouin.net/api/weather` returns 400 with no query parameters. It needs
    args I did not guess.
- **Visual assets on disk:** 2185 jpg, 21 png, 3 svg under
  `/Users/ls/Claude-Workspace/personal/teetimes/v0.1`. The jpgs are course photos, duplicated
  across `v0.1/data/photos`, `v0.1/web-b/public/photos`, `v0.1/web-m/public/photos` and the
  three `dist/photos` build copies. `STATUS.md` warns these are the courses' own images and
  are now public, so licensing is unresolved.
- **The hook:** the map. Drop a pin, drag a radius, watch live slots across 38 courses fill in.
- **Process artifacts:** 12 `REPORT.md`. Round-1 research lanes in `research/` (grok-market,
  codex-probe, claude-arch), synthesis in `PLAN.md`, the brief and its self-check rubric in
  `BRIEF.md`, current state in `STATUS.md`.
- **Show it as:** a live embedded map pulling `/api/teetimes`, slot counts animating in per
  course, with the course photo as the pin.

### undergrowth-v2

- **What it is:** a browser tower defense game. You build war engines on a grid to bend the
  route the horde walks, and a longer route means more seconds under your guns.
- **Stack:** Three.js plus Vite, deployed to Cloudflare Pages.
- **Status:** LIVE at https://undergrowth.pages.dev (200). Public repo
  `LucSigouin/undergrowth`. Deploys only via `deploy/deploy.sh`.
- **Live data endpoints:** none. It is a static page with no API. The page itself is the feed.
- **Visual assets on disk:**
  - `/Users/ls/Claude-Workspace/personal/undergrowth-v2/public/art` 58 files, sprite art at
    fixed sizes: `enemy-armor@192.png`, `enemy-boss@256.png`, `enemy-brood@256.png`,
    `enemy-grub@192.png`, `enemy-grubling@192.png`, `enemy-moth@192.png`,
    `enemy-runner@192.png`, `enemy-warden@192.png`, `gate-entry@256.png`,
    `apron-wood@512.webp` and more.
  - Whole project: 862 png, 12 webp. Most of the 862 are gate screenshots under
    `test-results/` and the art fleet rounds.
- **The hook:** the garden siege itself, a 3D board where the dotted route bends as you build.
  This is the only WebGL and the only true 3D thing in the workspace.
- **Process artifacts:** 18 `REPORT.md`. Seven fleet rounds on disk:
  `fleet-r1-foundation`, `fleet-r2-design`, `fleet-r3-polish`, `fleet-r4-ship`,
  `fleet-r5-layout`, `fleet-r6-art`, `fleet-r7-medieval`. Rounds r1 to r3 each have a
  `scorer/SCORE.md`. Board at `workbench/workbench.html`. Art rounds r6 and r7 each logged
  costs in four `costs.jsonl` files (board, icons, towers, enemies), all gpt-image-2.
  Gates: `npm test`, `tests/golden.mjs`, `tests/balance-gate.mjs`, `tests/layout-gate.mjs`,
  `tests/browser.mjs`, `tests/mobile-layout.mjs`.
- **Show it as:** a playable embed, or a looping screen capture of one wave with the route
  rerouting live.

### sigouin-net

- **What it is:** Luc's own site, the thing this round is feeding. A scroll-driven page where
  a warm sun patch travels down the page as you scroll.
- **Stack:** static HTML with inlined scrollcraft CSS and JS, Cloudflare Pages, personal
  account.
- **Status:** LIVE at https://sigouin.net (200, 124193 bytes of HTML, so the page is inlined).
  `README.md` still says "Not live yet" and then describes the 2026-09-03 deploy `cc756f0c`.
  The README is stale on that line.
- **Live data endpoints:** none. Static page.
- **Visual assets on disk:**
  - `/Users/ls/Claude-Workspace/personal/sigouin-net/site/assets` 11 webp:
    `01-desk.webp`, `02-studio.webp`, `03-living-room.webp`, `04-gaming.webp`,
    `04-media.webp`, `04-offsite.webp`, `hero-far-1600.webp`, `hero-far-800.webp`,
    `hero-mid-1600.webp`, `hero-mid-900.webp`, `real-neon-sign.webp`.
  - Whole project: 39 png, 19 jpg, 11 webp, 2 svg, 1 mp4.
  - Source of truth for edits is `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`,
    whose `assets/` still holds `01-desk.mp4` and `01-desk-m.mp4` that `site/assets` dropped.
- **The hook:** the window light. A sun patch that tracks scroll position, chosen over three
  rejected signature moves.
- **Process artifacts:** 12 `REPORT.md`. Nine fleet round dirs on disk: `fleet-r3-scroll`,
  `fleet-r5-hero`, `fleet-r6-seam`, `fleet-r7-folio-cable`, `fleet-r8-stuck`,
  `fleet-r9-signature`, `fleet-r10-near`, `fleet-r11-near3`, and this round
  `fleet-r12-portfolio-discovery`. Board at `workbench/workbench.html`. Four earlier rounds
  and five candidate looks are archived (see the archive section).
- **Show it as:** the hub itself. Its own process board is the exhibit.

### IPTV / livetvcan-website

- **What it is:** the marketing site, admin panel, customer portal and API for LiveTVCan, all
  in one deploy.
- **Stack:** React plus Vite front end, Cloudflare Pages Functions backend, D1 migrations.
  One Pages project serves marketing, `/admin/`, `/portal/` and `/api/*`. No Stripe.
- **Status:** LIVE at https://livetvcan.com (200).
- **Live data endpoints:** the API is a single catch-all at
  `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/functions/api/[[path]].ts`.
  I did not enumerate or call its routes. Assume customer data, so treat as NOT usable for a
  public hub feed. Use the marketing page only.
- **Visual assets on disk:** 94 png, 4 svg across the project. Two loose screenshots sit at
  the project root: `Screenshot 2026-04-09 at 1.33.31 PM.png` and
  `Screenshot 2026-04-09 at 1.44.40 PM.png`.
- **The hook:** one deploy wearing four faces. Marketing, admin, portal and API from a single
  Pages project.
- **Process artifacts:** 8 `REPORT.md`. Six fleet dirs: `fleet-admin-fixes`, `fleet-p1-fix`,
  `fleet-p1-fix2`, `fleet-p1-review`, `fleet-wb-merge`, `fleet-wb-unslop`. Five carry a
  `RUBRIC.md`. Three workbench boards: `workbench/workbench.html`,
  `reports/fleet-100x/workbench.html`, `public/admin/wb/workbench.html` (plus its dist copy).
  `PATCH-NOTES.md` and `IPTV-FEATURES-PLAN.md`.
- **Show it as:** a before and after screenshot pair of the admin panel, plus the fleet-100x
  board. Keep the live data out.

### RsyncGui

- **What it is:** a web UI to schedule, run and watch rsync backups across servers, shipped as
  one Docker container for Unraid.
- **Stack:** React front end, Express plus SQLite backend, single container, SSE for live run
  logs, published as `ghcr.io/lucsigouin/rsyncgui` by GitHub Actions. Repo
  `LucSigouin/rsyncgui`.
- **Status:** SHIPPED as a public container image, no public web URL. Runs on Luc's Unraid box.
  Claude is read-only in this folder.
- **Live data endpoints:** none public. The app talks to a private homelab instance.
- **Visual assets on disk:** 4 svg and 2 png only, including
  `/Users/ls/Claude-Workspace/personal/RsyncGui/icon.svg` and
  `/Users/ls/Claude-Workspace/personal/RsyncGui/RsyncGui-icon.png`. This is the
  screenshot-poorest shipped project.
- **The hook:** a streaming run log with a progress bar over SSE, cancellable mid-flight.
  Motion that is real, not staged.
- **Process artifacts:** `security-audit/workbench.html`, `CHANGELOG.md`, `README.md`,
  `unraid-template.xml`, `docs/`.
- **Show it as:** a screen capture of one backup run streaming its log, since no still image
  carries it. Needs new capture work, nothing usable is on disk.

---

## LOCAL ONLY

### scrollcraft

- **What it is:** the working area for the `/scrollcraft` skill, which builds scroll-driven
  sites. Each build gets a folder and a row in a registry that stops two builds sharing a
  skeleton.
- **Stack:** static HTML, CSS and JS per build, plus a Python inliner (`build-inline.py`) and
  per-build screenshot harnesses in `lab/`.
- **Status:** local tooling. `builds/sigouin-net/` is the source of the live sigouin.net.
- **Live data endpoints:** none.
- **Visual assets on disk:** 432 png, 54 webp, 31 jpg, 9 mp4 across the folder.
  - `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/lab` 172 files. This
    is a scroll capture strip, a frame-by-frame record of the page moving.
  - `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigz-console` 167 files.
  - Clips: `builds/sigouin-net/assets/01-desk.mp4`, `01-desk-m.mp4`, `out/01-desk.mp4`, and
    the same pair in `builds/sigouin-near-a`, `-b`, `-c`.
  - Six `lab/` dirs under `builds/`: sigz-console, sigouin-net, sigouin-near-a, -b, -c.
- **The hook:** `FINGERPRINTS.md`, an append-only registry with six dimensions (grammar, nav
  treatment, hero device, act-sequence shape, close pattern, signature move). A new build
  must differ from every existing row on at least four. Proof of not repeating yourself,
  in a table.
- **Process artifacts:** `FINGERPRINTS.md` itself, and every `lab/` capture strip.
  `builds/sigz-console` is a scroll-driven alternative front end for sigzmusic that was
  never shipped.
- **Show it as:** the lab capture strip played as a scrubbing filmstrip, with the
  FINGERPRINTS table as the caption. This is the single best process exhibit on disk.

### imagegen

- **What it is:** the scripts behind the `/imagegen` skill. Turns a theme into images and
  shows them landing on a self-refreshing gallery page.
- **Stack:** pure-stdlib Python. `generate.py`, `remix.py`, `live-gallery.py`,
  `gallery_assets.py`, `dopamine.py`, `costlog.py`.
- **Status:** local tooling, not a deployable.
- **Live data endpoints:** none.
- **Visual assets on disk:** 101 png. 35 of them under
  `/Users/ls/Claude-Workspace/personal/imagegen/drops`, plus `remixes/` and `site/`.
- **The hook:** `costlog.py`. Every generated image gets one JSON line with provider, model
  and real dollars or credits, so the gallery shows a running cost next to each picture.
- **Process artifacts:** `imagegen/drops/20260903-213421-cooking-the/costs.jsonl`.
  Across the whole workspace, 10 `costs.jsonl` files hold 146 image records totalling
  30.25 USD, 144 from gpt-image-2 (OpenAI) and 2 from grok. Zero credit-denominated rows,
  so no Higgsfield or kie.ai credits are logged in this file format anywhere in `personal/`.
  The archive README records 494 kie.ai credits for the layered sigouin.net sites, as prose.
- **Show it as:** the live gallery page, images appearing one by one with the running cost
  counter next to them.

### homelab

- **What it is:** notes, plans and reports for Luc's three-box Tailscale homelab called the
  Gardens. Reference material, not a deployable.
- **Stack:** self-contained HTML reports plus shell and JSON runbook artifacts.
- **Status:** local only.
- **Live data endpoints:** none public. Every service behind it is private and gated by the
  strict homelab API rule.
- **Visual assets on disk:** 3 png, 1 webp. `dynacat-glance.webp`, and two pasted screenshots
  dated 2026-09-14. Plus seven standalone HTML documents:
  `the-gardens.html`, `gardens-master-plan.html`, `amp-plan.html`, `amp-capabilities.html`,
  `config-report-2026-07-22.html`, `sonarr-cleanup-runbook.html`,
  `sonarr-cleanup-runbook-v4-archive-2026-07-27.html`.
- **The hook:** the Sonarr cleanup runbook. Every destructive step has a matching rollback
  JSON on disk (`sonarr-tag-purge-2026-07-27-rollback.json` and four siblings). It shows
  work done carefully on live infrastructure.
- **Process artifacts:** the dry-run and rollback JSON pairs, the migration plans
  (`palworld-to-amp-migration.md`, `windrose-to-amp-migration.md`,
  `offsite-versioning-plan-2026-08-14.md`).
- **Show it as:** the Gardens topology as an interactive diagram, with the rollback pairs
  shown as a paired before and after list.

### fantasy-football

- **What it is:** now just one thing, generated profile art for a fantasy football team called
  Cooking the Lads.
- **Stack:** gpt-image-2 through the imagegen pipeline.
- **Status:** local only.
- **Live data endpoints:** none.
- **Visual assets on disk:** 5 jpg and 1 png under
  `/Users/ls/Claude-Workspace/personal/fantasy-football/cooking-the-lads`:
  `out/cooking-the-lads-pfp.jpg`, `out/profile-steam.jpg`, `out/candidates/`,
  `refs/ladd-mcconkey.png`, `refs/james-cook.jpg`. Plus `out/gallery.html`,
  `out/costs.jsonl`, `result.json`.
- **The hook:** the reference-to-result pair. Two real player photos in, one team crest out.
- **Process artifacts:** `out/gallery.html`, `out/costs.jsonl`, `result.json`.
- **DISCREPANCY:** `personal/CLAUDE.md` says the live product here is
  `fleet-cheatsheet-workbench/lane-c-codex/cheatsheet.html` with a fleet mission log at
  `workbench.html`. Neither exists. The only child of `fantasy-football/` today is
  `cooking-the-lads/`. The draft cheatsheet is gone from this folder and I did not find it
  elsewhere.
- **Show it as:** a small before and after card, two reference photos morphing into the crest.

### tripo-mcp

- **What it is:** a hand-written MCP server that turns an image or a text prompt into a 3D
  model through the Tripo v3 API.
- **Stack:** one Python file, `server.py`, run by `uv run --script` with PEP-723 inline deps.
  Registered at user scope so it loads in every session.
- **Status:** local tooling, registered and available. 40K total.
- **Live data endpoints:** none. It is an MCP server, not a web service.
- **Visual assets on disk:** none. `tripo-mcp/out/` is EMPTY, so no `.glb` or `.gltf` has
  been kept. There are zero 3D model files anywhere in `personal/`.
- **The hook:** the reason it is hand written. The official server has no API-key path and
  cannot take a local image, and the community package would hold the key inside unvetted
  npm code. About 300 lines was the safer answer.
- **Process artifacts:** `README.md`, which states that reasoning as a table.
- **Show it as:** a spinning 3D object on the hub, generated fresh. Nothing on disk to reuse,
  so this needs one generation run, which this round is not allowed to do.

### Traditionally

- **What it is:** unknown. `/Users/ls/Claude-Workspace/personal/Traditionally/` contains one
  empty subdirectory also named `Traditionally`, and nothing else. 4.0K total, zero files.
- **Stack:** none.
- **Status:** EMPTY. Not listed in `personal/CLAUDE.md`, which claims the layout list is the
  contract.
- **Live data endpoints:** none.
- **Visual assets on disk:** none.
- **The hook:** none.
- **Process artifacts:** none.
- **Show it as:** do not show it. Candidate for deletion, ask Luc.

### scratch

Disposable, git-ignored working area. 95 entries, 51 MB, 58 png, 26 webp, 4 mp4, 14
`REPORT.md`, a `workbench.bak.html`, `model-bakeoff/` with its own RUBRIC and SCORES, and
`fleet-test/`. **Show it as:** nothing, it is scratch by design, but `model-bakeoff/results/SCORES.md`
is worth reading before the hub picks a "models used" number.

---

## ARCHIVED

Every row below is a row of `/Users/ls/Claude-Workspace/personal/archive/README.md`.
Paths are under `/Users/ls/Claude-Workspace/personal/archive/`.

### BBC (deployed but archived)

- **What it is:** a golf match-play scoreboard for Luc's events. Last event "This is 30",
  2026-06-22.
- **Stack:** Cloudflare, npm project, 86M.
- **Status:** STILL LIVE at https://bbc.sigouin.net (200). Moving the folder did not take the
  deploy down.
- **Live data endpoints:** `https://bbc.sigouin.net/api/state` returns JSON, 1000 bytes,
  verified 200. That is live scoreboard state, usable on the hub.
  `https://bbc.sigouin.net/data.json` returns 200 but with `text/html`, so it is the SPA
  fallback, not data.
- **Visual assets on disk:** 5 image files in `archive/BBC`.
- **The hook:** a real scoreboard that real people watched during a real tournament.
- **Process artifacts:** none found beyond the repo.
- **Show it as:** a live scoreboard tile fed by `/api/state`, captioned with the event date.

### widgell-bach

- **What it is:** a bachelor-party golf tournament site, sister to BBC. Event passed around
  2026-06-06. 298M, of which 160M is regenerable `node_modules`.
- **Status:** archived, no live URL recorded.
- **Live data endpoints:** none recorded.
- **Visual assets on disk:** inside the archive image totals, not separated.
- **The hook:** the same scoreboard idea dressed for one party.
- **Show it as:** one screenshot next to BBC, to show a template reused for a second event.

### Unraid dashboard

- **What it is:** a custom React and Vite dashboard for the Unraid server TheMediaGarden,
  warm paper theme. Idle since 2026-05-10. 102M, 101M of it `node_modules`.
- **Status:** NEVER DEPLOYED, local `npm run dev` only.
- **Live data endpoints:** none. It reads the private Unraid GraphQL API with a key.
- **The hook:** the warm paper theme on a server dashboard, the opposite of every dark
  homelab UI.
- **Show it as:** a screenshot only. It cannot be made live without exposing a homelab key.

### cockpit

- **What it is:** a self-hosted IPTV panel at `cockpit.livetvcan.com` plus a patched TiviMate
  APK. A PHP panel on a VPS, not a Cloudflare Worker.
- **Status:** RETIRED. Not in use since 2026-07-10, the `cockpit` DNS record was removed.
  Reviving needs a licence reissue to a new VPS IP. The `download` CNAME to R2 bucket
  `livetvcan-downloads` still serves the APK.
- **Live data endpoints:** none.
- **The hook:** the only self-hosted PHP box in the whole workspace.
- **Show it as:** a single archive card, text and one screenshot if one exists. Do not revive.

### kimi-projects, Kingdom Idle

- **What it is:** an idle game built end to end by the kimi CLI in its own memory silo. Cold
  since 2026-07-29. Pruned from 2.0G to 18M on 2026-08-19.
- **Status:** archived, never deployed.
- **Visual assets on disk:** 45 image files under `archive/kimi-projects`.
- **The hook:** a whole game written by a non-Claude model, which is the point of the fleet
  story.
- **Show it as:** a screenshot strip captioned "built by kimi, not by me".

### OpenArr tarball

- **What it is:** a from-scratch SwiftUI iPhone client for the arr and homelab stack. Declared
  dead 2026-08-19. Never under version control, so
  `archive/OpenArr-source-2026-08-19.tar.gz` (676K) is the only copy of 164 Swift sources.
- **Status:** DEAD, and closed as an idea.
- **Visual assets on disk:** NONE. The 29M of `docs/screenshots/` was dropped, not archived.
- **The hook:** 164 Swift files and not one surviving picture.
- **Show it as:** do not. Nothing visual survives. Mention in a text ledger at most.

### claude-usage-report

- **What it is:** a Claude usage dashboard delivered 2026-07-30. `index.html` plus `shots/`
  plus `theme/`. 552K.
- **Status:** archived one-off, static, not a running service. The data is a point-in-time
  snapshot.
- **Visual assets on disk:** 2 image files under `archive/claude-usage-report`.
- **The hook:** a dashboard about Luc's own tooling spend.
- **Show it as:** a static screenshot, clearly dated, or regenerate it with fresh numbers for
  the hub's own "cost of building this" panel.

### sigzmusic-landing competition

- **What it is:** a 9-lane landing page fleet. Lanes: `claude`, `codex`, `grok`, `kimi-a`
  through `kimi-e`, plus `neon-remix/` and a 23M backup tarball. 45M.
- **Status:** CLOSED. Luc picked a winner and it is live on sigzmusic.com, so the losing lanes
  are dead weight.
- **Winner:** the live sigzmusic.com landing.
- **The hook:** nine takes on the same brief, side by side, from four different models.
- **Show it as:** a nine-up contact sheet with the winner highlighted. The strongest
  "how he works" exhibit in the archive.

### sigzmusic-redesign-music-page competition

- **What it is:** a 5-lane music page redesign, lanes a to e, with `RUBRIC.md`, `SCORES.md`
  and real catalog JSON (6 records, 61 tracks). 11M.
- **Status:** CLOSED and shipped 2026-08-17.
- **Winner:** lane E, editorial, scored 9.8.
- **Note:** the catalog JSON is a 2026-08-17 snapshot. Pull `/api/tracks` instead.
- **Show it as:** five thumbnails with the scores printed under them and the 9.8 circled.

### sigzmusic-mockups

- **What it is:** the original concept comps that predate both competitions:
  `concept-1-cover-story` to `concept-4-library-shell`, `spectrum.html`, `app.css`, two
  exported PNGs. 3.9M.
- **Status:** archived, superseded twice.
- **The hook:** `concept-4-library-shell.html` is the ancestor of the shipped player.
- **Show it as:** the first frame of an evolution strip that ends on the live site.

### sigzmusic-swipe-transition

- **What it is:** a 3-lane competition for a swipe-up gesture between the landing page and
  `/music/`. Lanes a CURTAIN, b THROUGH THE WAVEFORM, c CUT THE POWER, plus BRIEF, RUBRIC and
  `verify-lane.sh`. 268K.
- **Status:** CLOSED 2026-08-21. Luc chose the plain tap-through instead. The lanes were never
  deployed.
- **The hook:** three named gesture ideas, all rejected, and the research still changed the
  live transition.
- **Show it as:** three short motion clips, captioned "none of these shipped, and it still
  fixed the live page".

### sigouin-net-fleet-2026-09-02

- **What it is:** the sigouin.net build rounds, 2026-09-01 and 09-02. 959M, plus a 1.0G
  evening extension.
  - `fleet-r1-site/`: three bold-editorial lanes a, b, c with a blind `SCORE.md`.
    Winner lane-c at 9.0.
  - `fleet-r2-polish/` and `r2-site/`: lane-c polished with 7 Higgsfield photos, the dark
    "living colour field".
  - `fleet-r4-layered/` and `scrollcraft-builds/sigouin-layered-{a,b}`: two fora.so-style
    layered scrollcraft sites, A dark filmic, B light split-stage. 494 kie.ai credits.
  - Evening: `scrollcraft-builds/sigouin-net-pre-light-cable/` (the blue cable version
    through round 8) and `scrollcraft-builds/sigouin-sig-{object,ink,depth}/` plus
    `fleet-r9-signature-losers/`, the three signature-move variants Luc did not pick.
- **Status:** CLOSED. Four losing looks and three losing signature moves. Do not re-pitch.
- **Visual assets on disk:** the archive as a whole holds 2810 png, 81 webp, 77 jpg, 17 svg,
  17 mp4, and most of that sits here. Six `lab/` capture strips live under
  `archive/sigouin-net-fleet-2026-09-02/scrollcraft-builds/`. Clips include
  `sigouin-layered-a/gen/a1-hero.mp4`, `a7-wake.mp4`, `assets/01.mp4`, `assets/06.mp4` and
  their `-m` mobile pairs.
- **The hook:** five candidate looks for one personal site, with a blind score sheet.
- **Show it as:** a five-way look comparison that ends on the live page, with the blind scores
  shown. Second-strongest process exhibit after the scrollcraft lab strips.

### Other archive rows, short form

- `chase-ai/` 38M, course lessons and transcripts, last touched 2026-05-08. Reference only,
  no visuals worth showing. **Show it as:** nothing.
- `fable-runbooks/` 20K, Fable 5 use-case runbooks. Runbook 01 was run 2026-07-07; 02, 03, 04
  are unrun prompt blocks. **Show it as:** a text card about model-agnostic runbooks.
- `email-migration/` 9.3M, stalled, every checkbox in `tracker/migration-status.md` unchecked,
  untouched since 2026-04-23. **Show it as:** nothing, it never started.
- `homepage-amp-widget/` 8K, a completed and deployed Homepage `customapi` widget config.
  **Show it as:** a live widget tile on a homelab screenshot.
- `homepage-unraid-widget/` 8K, a completed and deployed Homepage native `unraid` widget.
  **Show it as:** the same screenshot as above.
- `sigouin-net/` (old) 16K, the static site idle since 2026-05-15, superseded by the current
  one. **Show it as:** the first frame of the sigouin.net evolution strip.
- `claude-settings-audit/` 84K, an audit of `~/.claude` from 2026-08-06 with `DESIGN.md`,
  `PRODUCT.md` and `index.html`. Its findings were promoted into `CLAUDE.md`.
  **Show it as:** a static screenshot of the audit page.
- `football/` 168K, `PRODUCT.md` plus `plan/` and `research/`, last touched 2026-08-05.
  Nothing was built. **Show it as:** nothing.
- `traktor/` 72K, three CSVs from one Traktor crate-dig session, 2026-07-27.
  **Show it as:** nothing, or one number in a stats band.
- `kimi-usage/` 100K, `kimi_usage.py` plus README plus one screenshot, 2026-08-11. Written
  against the uv kimi-cli 1.49 layout which has since moved. **Show it as:** the one
  screenshot, in a tooling strip.
- `gameserver-hosting/` 88K, round-3 side-income research, rejected on evidence.
  **Show it as:** nothing. The category is closed.

---

## DEAD

- **OpenArr** iOS client. Declared dead 2026-08-19. Only the source tarball survives, zero
  screenshots. Do not re-pitch.
- **cockpit** IPTV panel. DNS removed, licence not transferred. Only the APK download CNAME
  still lives.
- **Traditionally**. An empty directory pair with no content and no record anywhere.
- **research-side-income**. Named as an active area in `personal/CLAUDE.md` but the directory
  does not exist at the top level. Its round-3 output is in `archive/gameserver-hosting/`.
- **undergrowth** (v1). 83M prototype superseded by `undergrowth-v2`. No git, 28 png, its own
  `dist/`, `tests/` and `test-results/`. `personal/CLAUDE.md` says to archive it and that has
  not happened. **Show it as:** one side-by-side frame against v2, to show the rewrite.

---

## Cross-project numbers

| Number | Value | Command |
|---|---|---|
| Top-level dirs in personal/ | 15 plus CLAUDE.md | `ls -1` |
| Archive README rows | 24 rows (23 projects, one duplicated project name for an evening extension) | `grep -n '^\| \`' archive/README.md \| wc -l` |
| Live public URLs confirmed 200 | 6 | `curl -s -o /dev/null -w "%{http_code}" <url>` per URL |
| Public JSON endpoints confirmed 200 | 6 (sigzmusic tracks, albums, health; teetimes courses, teetimes, health; bbc state) counted as 7 responses across 4 hosts | same curl loop |
| Fleet round dirs on disk | 33 | `find . -maxdepth 3 -type d -name 'fleet*' -not -path '*/node_modules/*' \| wc -l` |
| Worker REPORT.md files | 131 | `find . -name 'REPORT.md' -not -path '*/node_modules/*' \| wc -l` |
| result.json files | 66 | `find . -name 'result.json' -not -path '*/node_modules/*' \| wc -l` |
| Competition lane dirs | 36 | `find . -maxdepth 4 -type d -name 'lane*' -not -path '*/node_modules/*' \| wc -l` |
| workbench.html boards | 10 (8 unique, 2 are dist copies) | `find . -name 'workbench*.html' -not -path '*/node_modules/*'` |
| RUBRIC and SCORE files | 40 plus | `find . -maxdepth 4 \( -name 'RUBRIC*.md' -o -name 'SCORE*.md' \) -not -path '*/node_modules/*'` |
| scrollcraft lab capture dirs | 12 (6 live, 6 archived) | `find . -type d -name lab -not -path '*/node_modules/*'` |
| Images logged with a cost | 146 | `find . -name costs.jsonl -exec cat {} + \| python3 -c "sum of lines"` |
| Image spend logged | 30.25 USD | same aggregation, `usd` field |
| Image models logged | gpt-image-2 (144 images), grok (2) | same aggregation, `model` and `provider` fields |
| kie.ai credits recorded | 494, for the layered sigouin.net sites, prose only in archive/README.md | `grep -i 'kie.ai' archive/README.md` |
| Models named across md and json | codex 4878 mentions, veo3 110, claude-opus-5 58, gpt-image-2 24, claude-fable-5 23, gpt-5.4-nano 18, gpt-5 14, grok variants 19, kimi K2 and K3 10, seedream 12, nano-banana 4, gemini 6 | `grep -rhoiE '<model pattern>' --include='*.md' --include='*.json' . \| sort \| uniq -c \| sort -rn` |
| Total visual files, personal minus archive | 4762 | sum of the per-dir extension counts below |
| Total visual files including archive | 7764 | same, plus archive |
| Largest asset pools | teetimes 2185 jpg, undergrowth-v2 862 png, scrollcraft 432 png, sigzmusic 281 png, archive 2810 png | `find <dir> -prune-list -type f -iname '*.<ext>' \| wc -l` |
| 3D model files on disk | 0 | `find . \( -iname '*.glb' -o -iname '*.gltf' -o -iname '*.obj' -o -iname '*.fbx' \) -not -path '*/node_modules/*'` |
| Video clips on disk, excluding masters | 31 mp4 (9 scrollcraft, 17 archive, 4 scratch, 1 sigzmusic audit, 1 sigouin-net) | `find <dir> -name '*.mp4' -not -path '*/node_modules/*'` |

The exact extension counts per directory, from one `find` per directory with `node_modules`,
`.git`, `masters` and `DerivedData` pruned:

| Dir | png | jpg | webp | svg | mp4 | gif | heic |
|---|---|---|---|---|---|---|---|
| sigzmusic | 281 | 129 | 30 | 12 | 1 | 0 | 1 |
| RsyncGui | 2 | 0 | 0 | 4 | 0 | 0 | 0 |
| IPTV | 94 | 0 | 0 | 4 | 0 | 0 | 0 |
| fantasy-football | 1 | 5 | 0 | 0 | 0 | 0 | 0 |
| sigouin-net | 39 | 19 | 11 | 2 | 1 | 0 | 0 |
| undergrowth-v2 | 862 | 0 | 12 | 0 | 0 | 0 | 0 |
| undergrowth | 28 | 0 | 0 | 0 | 0 | 0 | 0 |
| teetimes | 21 | 2185 | 0 | 3 | 0 | 0 | 0 |
| imagegen | 101 | 0 | 0 | 0 | 0 | 0 | 0 |
| homelab | 3 | 0 | 1 | 0 | 0 | 0 | 0 |
| scrollcraft | 432 | 31 | 54 | 0 | 9 | 0 | 0 |
| tripo-mcp | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Traditionally | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| scratch | 58 | 2 | 26 | 0 | 4 | 0 | 0 |
| archive | 2810 | 77 | 81 | 17 | 17 | 0 | 0 |

No `.gif` files exist anywhere in `personal/`. Any animation on the hub has to come from mp4,
webm, a capture strip played as frames, or real CSS and WebGL.

---

## Could not verify

- I did not open any `.env` file, so no credential-gated endpoint was tested.
- `https://teetime.sigouin.net/api/weather` returned 400 with no parameters. I did not read
  the handler to find its required query args, so its shape is unknown.
- The LiveTVCan API lives behind one catch-all at
  `IPTV/livetvcan-website/functions/api/[[path]].ts`. I did not read it or call it, so I
  cannot say which routes exist or which are public.
- `sigzmusic` routes `/api/albums/:slug`, `/api/mixes`, `/api/mixes/:slug`, `/api/play/:slug`
  are declared in source but I did not call them. `/api/key/:slug` and `/api/admin/publish`
  I deliberately did not call.
- I did not run any server, build, test or deploy. Every gate named in a README is quoted
  from that README, not run.
- `sigzmusic/masters/` (12 GB) was pruned from every scan except a single targeted listing of
  `masters/Released Tracks/Social/youtube/`, so the real count of source video and audio there
  is unknown.
- Image counts exclude `node_modules`, `.git`, `masters` and `DerivedData`. Counts inside
  `dist/` and `test-results/` ARE included, so `undergrowth-v2` 862 png and the teetimes jpg
  count both contain build duplicates. The teetimes 2185 jpgs are roughly six copies of the
  same photo set.
- I did not open every `REPORT.md`. The 131 count is a file count, not a read.
- Archive rows `chase-ai`, `email-migration`, `football`, `traktor`, `kimi-usage`,
  `fable-runbooks`, `homepage-amp-widget`, `homepage-unraid-widget`, `claude-settings-audit`,
  `widgell-bach` and old `sigouin-net` were described from `archive/README.md` only. I did not
  open their contents.
- `Traditionally/` is empty today. I do not know what it was meant to hold or who made it.
- `research-side-income/` is named in `personal/CLAUDE.md` but absent from disk. I did not
  search the archive exhaustively for it.
- `fantasy-football/fleet-cheatsheet-workbench/` is named in `personal/CLAUDE.md` but absent.
  I did not search the whole workspace for `cheatsheet.html`.
- The 494 kie.ai credits number is prose in `archive/README.md`. No machine-readable cost log
  backs it.
- The model mention counts are raw string frequency across `.md` and `.json`. "codex" at 4878
  is inflated by `archive/chase-ai/` course material and is not a count of fleet runs.
- `sigouin.net` served 124193 bytes of HTML at check time. I did not diff it against
  `sigouin-net/site/index.html`, so I cannot confirm live matches local.

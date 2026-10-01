# Round 14, lane A: the sigouin.net portfolio hub

Model: claude-opus-5. Lane dir: `fleet-r14-build/a`. Gate: `check-hub.py` exits 0.

## What I built

A dark, editorial index. Two pages, no framework, no build step, no npm install.

**`/` (site/index.html)**
- **The overture.** Full viewport on load: the real SiGz waveform still fills the frame,
  the name SIGOUIN.NET rises letter by letter out of a mask, the dot in the middle is the
  one signal colour on the site. After 1.5 s the block collapses and the wordmark settles to
  a small strip, which is the kinetic type moment the brief asked for. The still is the LCP
  image and it is preloaded, so there is no blank first frame.
- **The index.** Twelve numbered rows down the left, uneven on purpose: every third row gets
  extra air and a larger face, every fourth is italic, three rows carry a 56 px image sliver
  that breaks the rhythm. Number, title, year on the row; the one word appears on hover.
  There are no cards on this page at all, so there is no row of three equal ones.
- **The stage.** The right two thirds is sticky and full height. Hover or focus a row and the
  stage becomes that exhibit: caption on top (number, year, word, title, one fact, the tool
  chips, the link, the live number), media below, filling the rest of the screen. Models are
  the chips outlined in the signal colour, so the models are visually separated from the
  libraries. Exhibits with more than one medium get plain text toggles, so the loop, the
  capture and the GLB all live in the same cell instead of three cells.
- **Media kinds:** capture image, video (AV1 source first, H.264 second, poster always,
  `preload="none"`, muted, loop), a two up pair with a hairline in the signal colour, a
  `<model-viewer>` GLB with a poster and `reveal="interaction"`, and one iframe that only
  loads the live Undergrowth build after you press the button.
- **Footer** is one line: last build date, SiGz catalogue plays, open tee slots.

**`/process/` (site/process/index.html)**
- Eight scenes, P1 to P8, each a full height pinned stop. The media column and the note column
  swap sides on every other scene, so the page never settles into a template rhythm.
- P3 carries the real gate output, red twice then green, copied from
  `process-media/gate-red-green.txt`.
- A closing ledger names all thirteen tools and models from the brief in one grid:
  Claude Fable 5, Claude Opus 5, Codex, Grok 4.6, Kimi K3, Qwen, gpt-image-2, CNVS, Higgsfield,
  Tripo, kie.ai, MotionSites, 21st.dev. Seedance and Playwright are named in the closing line.

## Type, colour, motion

- Instrument Serif for display, JetBrains Mono for everything else. Two families, one voice.
  No Inter, no Poppins, no Space Grotesk.
- Ink `#0a0a0b`, paper `#ece7dd`, one signal orange `#ff5b23`, live numbers in the SiGz acid
  lime `#c6f53c`. No purple, no gradient hero, no glass, no blur card.
- Motion: the letter rise, the wordmark settle, the slow bed push in, the row slide on hover,
  and the muted loops. `@media (prefers-reduced-motion: reduce)` freezes all of it, sets the
  wordmark straight to its settled size, drops video autoplay, and turns the hover word on
  permanently so nothing is hidden behind motion.

## Assets used

From `fleet-r13-assets`, copied into `site/assets/` with their dated filenames:

| Group | Files | Where |
|---|---|---|
| captures | 17 webp stills plus 4 scroll mp4 with posters | exhibits 1, 2, 3, 4, 5, 11 |
| stills | all 7 webp from `stills/out` | exhibits 2, 5, 7, 9, 12 and the overture bed |
| video | all 3 loops, AV1 and H.264 and poster | exhibits 1, 3 and the process intro plus P1 |
| 3d | all 4 GLB with their webp posters | exhibits 1, 2, 6, 7 |
| process-media | 12 files: boards, fleet diagram, nine up sheet, five looks, all seven, live winner, Kingdom Idle, scrollcraft filmstrip, gate replay | exhibits 8, 10, 11 and P1 to P8 |
| proxy | `live.js`, `functions/api/live/[[path]].ts`, 3 sample fixtures | live numbers |
| data | `stills/out/costs.jsonl` | exhibit 9 spend line |

Skipped on purpose:
- `raw-*.mp4` and `ref-*.png` in `video/`: source material, over the 3 MB and 1.5 MB caps.
- The `.png` twins of every capture and still: the webp is smaller and identical in content.
- `stills/out/*.prompt.txt`, every lane `REPORT.md` and `result.json`, the capture harness
  scripts: development records, not site assets.
- `sigouin-layered-a/b`, `landing-kimi-a..e`, `landing-claude/codex/grok`,
  `sigouin-r1-lane-a/b/c`, `sigouin-r2-polish`, `board-*-full`, `how-the-fleet-works-full`:
  the nine up sheet and the five look sheet already carry them, and P5 reads better as one
  contact sheet than as nine separate files.
- `costs-timeline.json` is copied but only the small per image log is read, because the
  timeline needs a chart and the brief asks for almost no text.

## Live data, and where it is honest

- TeeTimes is fetched straight from `https://teetime.sigouin.net/api/teetimes`, which has
  open CORS. SiGz and BBC go through `/api/live/...`, served by the copied Pages Function.
- A plain `python3 -m http.server` preview does not run Pages Functions, so those two routes
  return 404 in dev. The client then falls back to the round 13 fixture and writes
  `sample data, 2026-09-17` next to the number in the signal colour, and dims the number.
  That is what the screenshots show.
- The TeeTimes feed captured on 2026-09-17 is dated 2026-09-18, so `coversToday` is false. The
  page prints the count and labels the feed date instead of pretending it is today.
- If both the route and the fixture fail, the slot reads `-` and says the feed is unreachable.
  No number on this page is ever invented.
- Homelab shows a generated still and two GLBs. No hostnames, no topology, no live data.
- RsyncGui has no screenshot anywhere on disk, so it shows the 3D rack server with the caption
  saying plainly that no capture of a real run exists yet. It is not dressed up as a screenshot.

## Tools named on the page

On the exhibits: Cloudflare Workers, Pages, Pages Functions, D1, R2, AES-128 HLS, MapLibre,
Chronogolf, wrangler, Three.js, Vite, Playwright, React, Express, SQLite, server sent events,
Docker, GitHub Actions, Unraid, Tailscale, AMP, gethomepage, Uptime Kuma, Python stdlib,
Claude Opus 5, Codex, Grok 4.6, Kimi K3, gpt-image-2, Tripo, Higgsfield, CNVS, cnvsctl,
verify-live, unslop, evaluate-ui, imagegen, scrollcraft, MotionSites.

On `/process/`: all of the above plus Claude Fable 5 as the orchestrator, Qwen, kie.ai,
21st.dev, Seedance, vhs, the two CNVS hooks, `check-lane.py`, `check-assets.py`,
`check-hub.py`, `workbench.html`, `board.py`, SCORES.md, DECISIONS.md.

## Substitution I made

PLAN.md scene P7 is the overnight art lab. No art lab covers were delivered in round 13, so
P7 is the winner shipping and being proved on the live URL instead, using
`landing-live-winner.png`. P8 stays the archive scene. I did not invent art lab imagery.

## Verification I ran

- Served `site/` with `python3 -m http.server 5191` in a foreground shell I controlled and
  screenshotted both pages at 1440x900 and 390x844 with the Playwright already installed under
  `scrollcraft/builds/sigouin-net/node_modules`. Four png in `shots/`. I looked at all four and
  fixed four problems they showed: the stage caption was below the fold, the process note
  column was empty in frame, the wordmark stayed too large after the curtain, and the media
  caption rule was inheriting `inset:0` from its parent selector, which made the caption cover
  the whole media panel with a solid black box and hide every image on the stage.
- The harness also reports horizontal overflow. Result: `hscroll: false` on all four captures.
- Page errors: none on either page at either width. The only console noise is the expected 404
  on the proxy route in a static preview, which is the fallback path working.
- Probed the interactive states by script: exhibit 6 renders a `MODEL-VIEWER`, exhibit 9 reads
  the real spend log and prints `4 images, 0.17 USD, logged`, exhibit 12 switches media.
- Gate: `python3 check-hub.py <lane>` exits 0. Output pasted below.

## Could not verify

- How it looks on a real phone or a real retina screen. Headless Edge at 390 wide only.
- The live proxy routes in production. Pages Functions do not run in a static preview, so
  `/api/live/sigz/tracks` and `/api/live/bbc/state` were only exercised through their failure
  path and their fixtures. The TeeTimes direct fetch was also not reachable from this sandbox.
- The GLB models rendering with real lighting. `model-viewer` loads from unpkg, which the
  capture environment did not fetch, so what I confirmed is that the element mounts and the
  poster path resolves, not that the mesh looks right.
- Hover feel, scroll pinning smoothness, and the loop timing. Screenshots are still frames.
- Whether the Undergrowth iframe loads inside the hub. The button and the swap were tested,
  the remote page was not.
- Real Lighthouse or LCP numbers. Sizes and lazy attributes only.

## Rubric self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass | `shots/index-1440.png`: full bleed waveform, the name set large and kinetic, no blank frame. The still is preloaded and is the LCP. |
| 2 | Real work shown | Pass | 12 exhibits, every medium a round 13 file. No placeholder box anywhere. RsyncGui is labelled as a stand in rather than faked. |
| 3 | Process wing | Pass | `shots/process-1440.png`: 8 scenes P1 to P8 with real process media, 13 tool and model names in the closing ledger. |
| 4 | Not a template | Pass | Uneven index with slivers, two family type voice, no cards, no glass, no purple, no centred column, no marquee, no emoji headings. |
| 5 | Fast and honest | Pass | site/ is 19.3 MB against a 40 MB cap, no file over its cap, every video posterised and `preload="none"`, reduced motion branch present, sample data labelled and dimmed. |
| 6 | Verified by eye | Pass | Four screenshots at both widths for both pages, looked at and acted on. This section lists what I could not verify. |

## Gate output

```
OK: a site 19.3 MB, 7 text files, 81 manifest entries
```

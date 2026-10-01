# sigouin.net round 8, the stuck scroll after the hero: REPORT (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, no new
assets, no spend. Engine files untouched; every edit is in page.dev.html.

## What Luc said

"there's one scroll after the hero that it just gets stuck, can you check?"

## Root cause, in one paragraph

Chapter 1 (the desk) is a pinned scrub act. It was `data-sc-span="2.0"` with `data-sc-dwell="0.3"`,
so the engine made the section 200vh tall and stuck its stage for the middle 100vh: one full
viewport height of scroll where the heading, the copy and the frame do not move. The only thing
allowed to change during that hold was the desk clip, and the clip was mapped across the stage's
whole on-screen life (three viewport heights), so the hold got just 1.2 of its 5 seconds: a slow
camera drift that changed 2 to 3 percent of the pixels per 100 px of scroll. From disk, which is
how the canvas browser node opens the page, the clip cannot load at all (CORS on `file://`), so
the poster held with exactly zero change for the whole viewport height. Same under reduced
motion. The wheel was never blocked. It felt stuck because nothing visible moved.

Chapter 4 (the homelab) had the same shape, worse: a 2.2 viewport-height hold with two still runs
of 0.44 and 1.0 viewport heights, and 2.1 dead under reduced motion.

## How it was measured

`lab/stuckscan.mjs` (the skill's own driver, headless Edge through the bundled playwright-core)
steps the page 100 px at a time from 0 to the bottom. At each step, after a 600 ms settle, it
records scrollY, the chapter 1 heading and frame boxes, every act's `--sc-p`, the clip time, the
hero fade, the cable and mesh states, and saves a frame. It also wraps `addEventListener` and
`preventDefault` before the page runs, to list every wheel, touch and key listener and count any
preventDefault on them. A `--wheel` mode sends real wheel events instead of `scrollTo`.

`lab/stuckdiff.py` compares each frame with the previous one: the share of pixels that changed by
more than 10 levels (whole frame, and with the cable margin masked), the mean difference, and a
64-bit difference hash distance. A step is "still" when under 1 percent of the masked frame
changed while scrollY advanced. Consecutive still steps form a stretch. Mutant-tested: it flags
the old build's chapter 4 (2.11 viewport heights under reduced motion, exit 1) and passes the new
one.

Passes, before and after, on the same script: 1440x900 served, 390x844 served, 1440x900 reduced
motion, 1440x900 from `file://`, and the wheel pass. Frames and `scan.json` / `diff.json` for each
under `lab/stuck/before-*` and `lab/stuck/after-*`; before-over-after strips in
`lab/stuck/sheet-ch1-desk.png`, `sheet-ch1-file.png`, `sheet-ch1-mobile.png`, `sheet-ch4-desk.png`.

## Is the wheel blocked? No.

| Check | Result |
|---|---|
| Wheel, touchmove, keydown listeners | none. Only passive scroll listeners and the engine's touchstart prime |
| preventDefault on wheel / touchmove / keydown | 0 / 0 / 0 |
| scroll-snap-type on html, body, main | none / none / none |
| overflow, overscroll-behavior on html and body | visible, auto |
| 81 real wheel events of 100 px (before) | scrollY advanced exactly 100 px on every one, 0 mismatches |
| 68 real wheel events of 100 px (after) | same, 0 mismatches |

## Before and after, same script, same positions

Chapter 1, the desk. "Change" is the share of pixels that moved per 100 px step, cable masked.

| Pass | Before hold | Before change per step | After hold | After change per step |
|---|---|---|---|---|
| 1440x900 served | scrollY 900 to 1800, 900 px = 1.00 vh | 2.1 to 2.7 percent, hash distance 0 on all 9 steps, clip 1.90 to 3.13 s | scrollY 900 to 1530, 630 px = 0.70 vh | 5.4 to 7.7 percent, clip 0 to 5.03 s (0.8 s per step) |
| 1440x900 from disk (canvas node) | 900 px = 1.00 vh | 0.00 percent on all 9 steps | 630 px = 0.70 vh | 2.8 to 3.6 percent (zoom plus two text reveals) |
| 390x844 served | scrollY 844 to 1688, 844 px = 1.00 vh | 3.3 to 4.3 percent | scrollY 844 to 1435, 591 px = 0.70 vh | 10.1 to 12.4 percent |
| 1440x900 reduced motion | 900 px = 1.00 vh | 0.00 percent on all 9 steps | 270 px = 0.30 vh | 0.56 and 0.25 percent (two text fades; no clip by design) |

Chapter 4, the homelab.

| Pass | Before hold | Before still runs | After hold | After still runs |
|---|---|---|---|---|
| 1440x900 served | scrollY 4874 to 6854, 1980 px = 2.20 vh | 5400 to 5800 (0.44 vh) and 5900 to 6800 (1.00 vh); 6500 to 6700 exactly 0.00 percent | scrollY 4604 to 5594, 990 px = 1.10 vh | longest 5300 to 5500 (0.22 vh, mesh finishing, closing line fading in) |
| 390x844 served | 1857 px = 2.20 vh | 6200 to 6600 (0.47 vh) | 929 px = 1.10 vh | none of 0.4 vh or more |
| 1440x900 reduced motion | 1980 px = 2.20 vh | 4900 to 6800 (2.11 vh, FLAG) | 540 px = 0.60 vh | 4300 to 4700 (0.44 vh of caption fades under 1 percent) |

Events inside the new chapter 4 hold at 1440: machine A wakes at 4700 (9.4 percent of pixels), B
at 4900 (3.6), C at 5200 (4.2), the closing line at 5500 to 5600. Between events the mesh line
grows about 2.5 px per px of scroll; being 2 px wide it registers under 1 percent in the pixel
count, which is why short "still" runs of 0.1 to 0.2 vh remain in the table. Nothing in the page
holds still for 0.4 vh or more except the reduced-motion caption fades noted above.

Page height: 8836 to 7576 px at 1440x900 (9.8 to 8.4 viewport heights); 9130 to 7949 at 390x844;
6766 under reduced motion.

## The fix (page.dev.html only)

1. Chapter 1: `data-sc-span="1.7"` (hold 0.7 vh, was 1.0), `data-sc-clip-map="travel"` so the
   whole 5 s drift plays inside the hold, dwell removed (it slowed the middle further).
2. Chapter 1: the frame's poster and clip zoom 12 percent across the hold, read straight off
   `--sc-p` in CSS. This is what keeps the picture moving where the clip cannot load (a page
   opened from disk). Off under reduced motion.
3. Chapter 1: the lede is a line-by-line reveal from 0.10; the caption fades in at 0.60. Text
   progresses through the hold even on the poster.
4. Chapter 4: `data-sc-span="2.1"` (hold 1.1 vh, was 2.2). Mesh draws over 0.04 to 0.84 of the
   hold (was 0.06 to 0.72); captions at 0.28, 0.50, 0.70 (were 0.26, 0.44, 0.60); closing line at
   0.84 with a 0.2 ramp (was 0.70). The dead tail after the last change is about 0.13 vh.
5. Reduced motion: both spans are shortened before the engine mounts (1.3 and 1.6). The clip never
   loads and the mesh is drawn in full there, so a long hold had only text fades to show.

Kept: the grammar (flow > scrub > flow > flow > flow > pin > flow > flow), the cable, the three
hero layers, the seam mask. Engine files verbatim.

## Nothing else regressed

- Hero seam: `lab/seamshots.mjs` at 0/25/50/75/90/100 percent, `lab/seamscan.py` clean on all six
  (`lab/seam/desk-r8/`). Hero fade values identical to round 7.
- Cable: `lab/cablestep.mjs`, 40 one-pixel steps, tip moved 1 px on every one (`lab/cable/after-r8/`).
- Skill harness `shoot.mjs`, three passes of 49 frames on the final index.html (1440, 390, reduced):
  exit 0, every frame settled, every cue clears 4.5:1, clip advances 0 to 5.03 s inside the pin.
  Sheets refreshed in `lab/shots`, `lab/mobile`, `lab/reduced`; logs `lab/shoot-*.log`.
- No em dash in page.dev.html, index.html, BRIEF.md or this report. No CLI or model name on the
  page. Page script passes `node --check`.
- `sigouin-net/site/index.html` and `site/assets/` byte-identical to the build
  (`cmp` and `diff -r` clean, sha 2d46b88ae0dd0e6288c08b74a177683d66041a08).

## How to see it

1. Canvas browser node "sigouin.net r8" opens
   `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html`. Scroll past the title: the
   desk photo should zoom while the lede assembles, then the caption arrives, then the page moves
   on. From disk the clip falls back to its poster; the zoom and the text still move.
2. With the clip: the existing canvas shell node serves the build on http://localhost:4517/.

## Server

No server of mine was started. The sandbox refuses to open a listening port, so every pass ran
through the shell node already serving this build directory on 4517 (checked: it serves the same
bytes as the build). That node is not mine to close, and nothing else is left running.

## Not verified

- A real trackpad or mouse. The harness proves what changes per 100 px and that the wheel is not
  blocked; the feel of the 0.7 vh hold is Luc's call.
- The canvas browser node's rendering (Chromium-based Edge is the driver).
- The difference hash is coarse (8x8) and reads 0 for most in-hold steps even after the fix; the
  pixel-change share is the number to trust.
- Very short phones (under about 660 px tall); only 844 tall was shot.
- FINGERPRINTS.md still lists the old act shape (2.0 and 3.2 spans) in its sigouin row; it sits
  outside this round's write scope.

## Files

Build `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`: `page.dev.html`
(edited; the pre-round built page is `lab/index.pre-r8.html.bak`), `index.html` (rebuilt),
`BRIEF.md` (round 8 section), `lab/stuckscan.mjs`, `lab/stuckdiff.py`, `lab/stucksheet.py` (new),
`lab/stuck/` (all passes, frames, sheets), `lab/seam/desk-r8/`, `lab/cable/after-r8/`,
`lab/shots`, `lab/mobile`, `lab/reduced` (refreshed).
Site copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html` + `assets/`.
Worker: this file, `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r8-stuck/check-r7.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r8-stuck/worker`
Output: `PASS`, exit 0 (recorded in result.json as `verify_exit`).

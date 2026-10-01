# sigouin.net round 7, folio removal and cable fix: REPORT (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, no new
assets, no spend. Engine files untouched; all edits are in page.dev.html.

## What Luc asked

"the numbers on the side lets remove them. also the line that follows is glitchy can we fix that."

## 1. The folio is gone

Removed from page.dev.html: the `nav.folio` markup (seven links), its style block and the two
phone rules, and the script that set `aria-current` on the links. `index.html` has zero
`class="folio` matches (gate checks this).

Nothing else moved. `lab/margincheck.mjs` records the left, top and width of every copy box in
main (49 boxes) on the old build and the new one, at 1440x900 and 390x844:

| Viewport | Boxes compared | Moved | Page height | Cable x |
|---|---|---|---|---|
| 1440x900 | 49 | 0 | 8836 -> 8836 | 33.1 -> 33.1 |
| 390x844 | 49 | 0 | 9130 -> 9130 | 11 -> 11 |

The chapter padding (`.ch__inner` padding-left, gutter + 0.75rem) was left alone. Its comment
ties it to the margin that holds the cable, not the folio, and pulling it would have shifted
every line of copy 12 px left, which Luc ruled out.

## 2. The cable: root causes, with evidence

I read the cable script, then drove the page in the skill's harness (headless Edge through the
bundled playwright-core driver, served on 4517) with `lab/cableshots.mjs`: 60 samples per pass
at load (0, 300, 1000, 2500 ms), the hero to chapter 1 seam in 10% steps, 25 positions down the
page, five fast jumps with reversals (each sampled one frame later and 600 ms later), a resize
1440 to 390 and back sampled at 0/60/130/300/1000 ms, at 1440, 390 and reduced motion. Each
sample measures, in screen pixels, the line's start against the socket after the name, every
drawn port against its anchor, the tip against the end of the visible stroke, and the SVG box
against main. `lab/cablestep.mjs` scrolls one pixel at a time and records how far the tip moves.

Three faults, all measured before anything was changed (`lab/cable/before*`):

**A. The tip stepped instead of gliding (the motion glitch).** The scroll position was turned
into a path length through a lookup table sampled every 5 px, with no blending between samples.
Scrolling one pixel at a time from 1200 to 1240: the drawn length changed by
`0 0 5 0 0 0 0 5 0 0 0 0 5 ...`. 32 of 40 one-pixel steps moved the tip 0 px; the other 8 moved
it 5 px. Next to copy that glides, a dot that freezes for four frames and then hops reads as
glitchy. This is the fault a reader sees on every scroll.

**B. The line started 22 px under the socket instead of 8 px.** The engine slides the title copy
in with a 14 px transform (620 ms, staggered). Every load-time rebuild (script run, `load`,
fonts ready + 50 ms) ran while the heading was still displaced, and nothing rebuilt after the
slide ended, so the socket and the heading's bottom edge were measured 14 px too low. Measured
start-to-socket gap: 21.7 px at 1440 and 24.4 px at 390, against the designed 8 px. Under reduced
motion, where the engine disables the slide, the gap was exactly 8 px, which pins the cause. A
window resize (which rebuilds at rest) also snapped it to 8 px. The run under the name sat 14 px
low for the same reason.

**C. A height change scaled the whole drawing.** The SVG carried a `viewBox` of main's size at
build time, and the default aspect fit scales and centres the drawing when the box no longer
matches. On the 1440 to 390 resize the drawn ports were 2702, 805, 53, -632, -2553 and -3001 px
off their anchors, and the line's start was 3300 px off, until the debounced rebuild 60 ms later.
The same happens on any main height change (rotation, a window drag, layout settling).

Checked and not at fault: the tip already updated inside requestAnimationFrame, and it matched the
stroke's end to within 0.1 px in every sample; the ports matched their anchors to 0.3 px at rest;
`stroke-dashoffset` was set directly (no transition to lag behind); the hero mask (round 6) does
not touch the cable; the run under the name is fully drawn at rest at both viewports, so the
one-step crossing of a flat segment never shows.

## 3. The fix (page.dev.html, cable script only)

1. `lenAtY` blends linearly between the two nearest samples, and the table is sampled every
   2 px instead of 5. The tip now moves one pixel per pixel of scroll.
2. Anchors are measured at rest: `restShift` sums the translateY of every ancestor transform
   (the entrance slide) and subtracts it. The title copy's `transitionend` also schedules one
   more rebuild as a safety net.
3. No `viewBox`: one SVG unit is one CSS pixel from main's top left. A stale size can no longer
   scale or shift the drawn line.
4. Rebuilds (resize, load, fonts ready, ResizeObserver on main, transition end) coalesce onto the
   next animation frame instead of 60 to 120 ms timers, so the drawing is never stale for a
   visible stretch.
5. The tip's target row (62% down the viewport) reads the large viewport height through a
   `100lvh` probe where supported, falling back to innerHeight. On phones the address bar changes
   innerHeight by 60 to 100 px as it hides, which would have made the tip leap; `lvh` holds
   still, and it is the ruler the ports' `vh` offsets already use.

Reduced motion behaviour is unchanged (whole line drawn, tip hidden, sockets all filled).

## 4. Before and after, same positions (`lab/cable/before*` vs `lab/cable/after*`)

| Measure | Before | After |
|---|---|---|
| Tip movement per 1 px scroll, 40 steps at 1440 | 32 steps 0 px, 8 steps 5 px | 40 steps 1 px |
| Line start below socket centre, 1440 / 390 / reduced | 21.7 / 24.4 / 8 px | 8 / 8 / 8 px (design) |
| Ports vs anchors at rest, worst of 6, all passes | 0.3 px | 0 px |
| Resize 1440 to 390, worst anchor error at +0 ms | 3300 px | 0 px |
| Resize, worst anchor error at +60 ms and later | 0.2 px | 0 px |
| Tip vs end of visible stroke, all samples | 0.1 px | 0 px |
| Fast jumps and reversals, one frame after | already in place | already in place |

Excluding the one sample taken at the exact `sc-ready` instant (the heading is still 28 px low
and invisible at opacity 0 while the line already sits at its resting position), the worst anchor
error across all 171 after samples is the designed 8 px socket offset, and the worst port error
is 0 px.

Frames: `lab/cable/before/`, `lab/cable/before-mobile/`, `lab/cable/before-reduced/` and the
matching `after*` folders hold full frames plus 240x160 crops around the tip (`*_tip.png`) for
load, the seam at 0/20/40/60/80/100/120 percent of the hero, seven page positions, every jump,
and the resize. The socket gap is visible by eye in `before/load_2500ms_fonts_ready.png` versus
`after/load_2500ms_fonts_ready.png`. Step logs: `before/step.log`, `after/step.log`. An interim
run before the frame-coalescing change is kept in `lab/cable/interim/` (resize errors of 400 px
at +0 ms, which the coalescing removed).

## 5. Nothing else regressed

- Hero seam, `lab/seamshots.mjs` + `lab/seamscan.py`: desktop frames at 0/25/50/75/90/100 percent
  all clean (`lab/seam/desk-r7/`). Mobile frames report the same photo-content rows as round 6
  (`lab/seam/mobile-r7/` vs `lab/seam/mobile/`); the only changed rows are the cable's run under
  the name, which moved up 16 px to its designed place.
- Hero copy contrast, `lab/herocheck.mjs`: worst 11.4:1 at 1440, 14.37:1 at 390 (unchanged from
  round 6). Its folio check is skipped now that there is no folio.
- Skill harness `shoot.mjs`, three passes of 49 frames on the final index.html: all settled, clip
  moving on every on-screen frame, every cue clears 4.5:1, no console errors or failed requests.
  Sheets refreshed in `lab/shots`, `lab/mobile`, `lab/reduced`.
- No em dash in page.dev.html, index.html, BRIEF.md or this report; no CLI or model name on the
  page; page script passes `node --check`.
- `sigouin-net/site/index.html` and `site/assets/` are byte-identical to the build (`cmp` and
  `diff -r` clean, sha efbc7f1d176740b8c109032a3a20e3dc5f31e579).

## How to see it

1. Canvas browser node "sigouin.net r7" opens
   `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html`. Scroll slowly: the dot at the
   end of the blue line should glide, not hop, and the line should leave the ring after the name.
   From `file://` the chapter 1 clip falls back to its poster; the cable is unaffected.
2. Full experience with the clip: the CNVS shell node still serves the build on
   http://localhost:4517/.

## Not verified

- A real phone: the `lvh` probe and the address bar behaviour could only be reasoned about, not
  driven. The harness is a fixed 390x844 viewport.
- Safari or the CNVS browser node's engine. The driver is Chromium-based Edge. `lvh` is supported
  in Safari 15.4+ and the fallback is innerHeight.
- Frame timing on real hardware (dropped frames). The harness proves positions, not paint times.
- The first 100 to 300 ms of a cold load, before the web font arrives: the line starts where the
  fallback font's name ends, then jumps to the real socket when the font swaps. This existed
  before and is inherent to a swapped font; the rebuild on fonts ready handles it.
- I cannot see the canvas browser node render; Luc's eye is the check for "glitchy".

## Files

Build `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`: `page.dev.html`
(edited; pre-round copy `lab/page.dev.pre-r7.html.bak`), `index.html` (rebuilt), `BRIEF.md`
(round 7 section), `lab/cableshots.mjs`, `lab/cablestep.mjs`, `lab/margincheck.mjs` (new),
`lab/herocheck.mjs` (folio check skipped), `lab/cable/` (all captures and logs), `lab/prev-r7/`
(old index.html plus an assets symlink, for the margin comparison), `lab/seam/*-r7/`,
`lab/hero/*-r7/`, `lab/shots`, `lab/mobile`, `lab/reduced` (refreshed).
Site copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html` + `assets/`.
Worker: this file, `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r7-folio-cable/check-r7.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r7-folio-cable/worker`
Output: see result.json `verify_exit` (0 expected; the run is pasted in the task reply).

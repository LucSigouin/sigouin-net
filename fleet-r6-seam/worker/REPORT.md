# sigouin.net hero seam: REPORT (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, no new
generated assets, no spend.

## What was wrong

Luc's screenshot (`fleet-r6-seam/luc-screenshot-hard-edge.png`): once the title page scrolls
up, the three photographic planes stop in a straight line at the section's bottom edge and
chapter 1 begins below on a slightly whiter ground. Cause: `.title` is `overflow: hidden` and
the layer container is `inset: 0`, so every plane was cut at the section bottom; the title
sits on paper (#F4F2ED) while chapter 1 is `.ch--white` (#FBFAF7), a faint colour step even on
a clean cut.

## The mechanism

1. **Scroll-driven dissolve on the layer container.** `.hero-depth` wears a long alpha mask
   (six eased stops) that is fully transparent at the section's bottom edge. A custom property
   `--hero-fade` sets where the dissolve begins. At rest it is 88% of the hero height (a short
   feather at the very bottom). The hero script pulls it up with scroll, 88% times (1 minus
   scrolled fraction), so at 25% out the bottom third is dissolving, at 50% the whole visible
   slice is, at 100% it is gone. The imagery melts into the ground before the edge can show.
   The mask is a fade tied to scroll position, not a movement, so it also runs under reduced
   motion; the planes themselves still hold still there. The no-script fallback is a fixed
   60% start, still transparent at the edge.
2. **One ground colour.** The title's own background drifts from paper to the chapter 1 white
   over its lower half, so the planes fade to the exact colour chapter 1 begins on. Chapter 1
   is untouched.
3. **Near plane bottom feathered.** The near plane runs ahead of the page, so its bottom edge
   rose into view. `lab/hero-layers.py` now feathers its bottom quarter (smoothstep). Only the
   two near files changed; far and mid re-encoded byte-identical.
4. **Far plane width cap lifted.** Found while isolating planes: the engine's
   `img { max-width: 100% }` capped the far plane at 1440 px instead of 108%, leaving a bare
   58 px strip with a straight vertical edge down the right of the hero, at rest and while
   scrolling. `.hero-layer { max-width: none }` fixes it. The phone mid and near planes had
   been capped the same way and were reviewed and shipped at 100%, so I wrote 100% explicitly
   to keep that composition. If Luc wants the bigger phone desk the round 5 worker intended,
   change those two widths back to 132% and 104%.

Cable, folio, copy, chapter 1: untouched. No new assets. Layers served: 350,818 bytes
desktop set, 133,968 bytes phone set, under 900 KB.

## Verification (skill harness, headless Edge through the skill's bundled driver, served on 4517)

Transition captures, `lab/seamshots.mjs`, hero scrolled out 0 / 25 / 50 / 75 / 90 / 100
percent, read by eye and scanned:

| Set | Frames | By eye | Scan |
|---|---|---|---|
| `lab/seam/desk/` (1440x900) | out-000 to out-100.png | planes dissolve, no cut, one white | clean, full frame and hero-bottom band |
| `lab/seam/mobile/` (390x844) | same | same | clean in the hero-bottom band (full-frame hits are the far photo's window sill and chapter 1's poster frame) |
| `lab/seam/reduced/` (1440, reduced motion) | same | planes static, dissolve still runs, no cut | clean, full frame and band |
| `lab/seam/before-desk/` (the old build, 1440) | same | the hard edge | EDGE at the hero bottom on 25/50/75/90 |

Contact sheet of all three sets: `lab/seam/transition-sheet.png`.

The scanner (`lab/seamscan.py`) compares each row with the row two below it and flags a
straight edge when over 55% of columns step by more than 3 levels. Mutant-tested: it flags
Luc's screenshot (row 469, 99% of columns) and the old build's four frames; the fixed build
passes.

Isolation shots (`lab/seam/iso*.png`, planes hidden one at a time) traced two things I did not
touch on purpose: a faint horizontal step at the plant's foot at 50% is the mid plane's
headphone cup edge at about 10% opacity (photo content, not a seam), and the far photo's
window sill on phones is a soft photo edge inside the imagery.

Hero copy contrast, `lab/herocheck.mjs`, copy hidden, darkest pixel under every line:
1440 worst 11.4:1 across pointer centre, bottom right, top left, quarter and half scroll;
390 worst 14.37:1. Folio clear of copy at all four sampled chapters.

Skill harness `shoot.mjs`, three passes of 49 frames on the final index.html, all settled,
all cues clear 4.5:1: `lab/shots`, `lab/mobile`, `lab/reduced` (sheets refreshed).

Also checked: no em dash in index.html, page.dev.html, BRIEF.md or this report; no CLI or model
name on the page; site copy byte-identical to the build (gate checks it).

## How to see it

1. Canvas browser node "sigouin.net seam fix" opens
   `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html`. Scroll slowly through
   the first screen. From `file://` the chapter 1 clip falls back to its poster; the hero and
   the seam are unaffected.
2. Full experience: the CNVS shell node still serves the build on http://localhost:4517/.

## Not verified

- A real phone or a real mouse; Safari (the driver is Chromium-based Edge). `mask-image` is
  written with and without the `-webkit-` prefix; Safari has supported the unprefixed form
  since 15.4.
- Very short phones (under about 660 px tall); only 844 tall was shot.
- Whether Luc prefers the round 5 phone composition (132% / 104% planes) that never actually
  rendered.

## Files

Build `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`: `page.dev.html`
(edited; pre-round copy `lab/page.dev.pre-r6.html.bak`), `index.html` (rebuilt),
`BRIEF.md` (round 6 section), `lab/hero-layers.py` (near feather),
`assets/hero-near-1200.webp`, `assets/hero-near-700.webp` (regenerated), `lab/seamshots.mjs`,
`lab/seamscan.py`, `lab/seam/` (frames, sheets, isolation shots, shas), `lab/hero/*-r6/`,
`lab/shots`, `lab/mobile`, `lab/reduced` (refreshed).
Site copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html` + `assets/`.
Worker: this file, `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r6-seam/check-hero.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r6-seam/worker`
Output: `PASS`, exit 0 (recorded in result.json as `verify_exit`).

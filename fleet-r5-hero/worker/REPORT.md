# sigouin.net hero layers: REPORT (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed.

## What it is

The title page of sigouin.net now has three photographic planes behind Luc's name: a
blurred window wall far back, the desk in focus in the middle, and a plant and a mug
an inch from the lens in front. They move at three rates on scroll and drift with the
pointer on a mouse device. The type sits between the mid and near planes. The cable,
the socket after the name and the chapter folio are all still there. Second fix: the
folio is now a column of numerals in the left margin, so it never sits on copy.

## How to see it

1. A CNVS shell node serves the build on port 4517. A canvas browser node on
   http://localhost:4517/ is already on the canvas. Scroll slowly through the first
   screen and move the mouse across it.
2. From a plain shell, the same server:
   `node /Users/ls/.claude/plugins/cache/nateherk/nateherk-design/0.2.0/skills/scrollcraft/scripts/serve.mjs --root /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net --port 4517`
   Serve it rather than loading the file directly: from `file://` the chapter 1 clip
   cannot load and that chapter falls back to its poster. The hero layers themselves
   work either way.
3. Deployable copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/` (index.html
   plus assets/). Byte-identical to the build's index.html (sha256 6388e6b0...86f2 both).

## What the three reference sites gave

- 21st.dev: the parallax index (76 components) names the patterns directly: "Layer
  Parallax Hero", "Hero Parallax", "Smooth Scroll Hero", "Parallax Floating" (objects
  floating at different depths), "Mouse-Responsive Background", "3D parallax effect on
  hover", "Zoom Parallax".
- godly.design and motionsites.ai are JavaScript galleries. Fetches returned names and
  thumbnails only (Agentwork, LocalCan, Gumloop, Griffin, Auxia, Serro AI, Weav, Vessa,
  Lightspark, Pryzm; Cyber Ronin, Liquid Glass Agency, Velorah, Pulse 3D) and the
  categories "3D Website" and "Interactive". No technique text was reachable; deeper
  URLs returned 404. The moves below lean on the 21st.dev names and on what those two
  galleries are known for.

## The three moves borrowed (written down before touching code)

1. Separate planes at separate rates (21st.dev "Layer Parallax Hero", "Parallax
   Floating", "Mouse-Responsive Background"). Three real images. The far plane lags the
   page by 0.85 of the scroll (it almost stays put), the mid plane by 0.5, the near
   plane runs ahead by 0.22, so the type at 1.0 sits between mid and near. On a
   pointer device the same planes drift toward the pointer at 6, 14 and 28 px, eased
   with a lerp, and stop animating when they arrive.
2. Depth of field between planes (the photographic heroes on godly.design). Far is
   blurred a second time and lifted toward paper; mid is the one sharp plane; near is a
   wide-open-aperture bokeh object cropped at the corner.
3. Layers melt into the ground (the motionsites.ai "3D Website" heroes, where image
   and page colour are one world). Mid and near carry alpha masks that fade into the
   cream paper, so the hero is not a photo rectangle. A paper scrim behind the copy,
   a sibling of the copy and not a child, keeps every line above 10:1.

## Layers, prompts and spend

All four stills used the build's verbatim world preamble from BRIEF.md (natural-light
documentary, warm white, pale oak, one blue accent, no people, no text), then a scene.
Full prompts are saved next to each PNG in the build's `out/` as `*.prompt.txt`.

| # | File (out/) | Scene | Used as |
|---|---|---|---|
| 1 | hero-far.png | far plane, the room behind a desk | rejected: came back as a full desk with lamp and chair, which fights the mid plane and darkens the type area |
| 2 | hero-mid.png | the desk top with notebook, mug, small computer, keyboard, headphones, objects only in the right half, plain warm off-white elsewhere | mid plane |
| 3 | hero-near.png | one foreground object very close to the lens, blurred plant leaves and a mug rim, plain off-white elsewhere | near plane |
| 4 | hero-far-b.png | the same room with the desk removed: bare wall, window, sheer curtain, sill, out of focus | far plane |

Masks and encodes: `lab/hero-layers.py` (PIL only). Mid: colour normalised so the
studio background lands on the paper colour, background keyed to transparent outside
soft protection zones around the objects, left and top edges feathered, and the small
maker's mark on the computer blurred out so no logo is readable. Near: keyed on
saturation and darkness inside a soft ellipse around the corner. Far: extra blur plus
a 42 percent lift toward paper.

Served weight, WebP:

| Set | Files | Bytes |
|---|---|---|
| desktop | hero-far-1600, hero-mid-1600, hero-near-1200 | 350,314 |
| phone (srcset) | hero-far-800, hero-mid-900, hero-near-700 | 134,058 |

Both far under the 900 KB cap.

Spend: 4 stills. Planned at the published 28 credits each: 112 credits. Probe before
516.0, after 460.0, a delta of 56 credits, which matches the skill's note that the
ledger debits about 0.4x of the published rate. No other consumer was on the key during
the run as far as I can tell. I could not find a credit-to-dollar rate, so `spend_usd`
is null in result.json and the credits are recorded instead.

## The folio fix

Before: a horizontal row (numeral, current title, remaining numerals) fixed at the
bottom left, about 240 px wide at 1440, sitting on the last line of body copy in the
LiveTVCan chapter (previous round's lab/shots/28.png). Now: the numerals stack in a
column inside the left margin beside the cable, 0 at the bottom. The current chapter's
title stands on end beside the column at 1024 px and wider; on phones the numerals
alone carry it. The chapter padding gained 4 px on the left. Measured with
`lab/herocheck.mjs`: folio right edge 76.9 px against copy left 91.2 px at 1440;
31.6 px against 40 px at 390, at the title page and chapters 1, 3 and 4. Clear at all
eight positions. Keyboard order unchanged: 12 stops, all on screen and ringed.

## Verification

Skill harness (headless Edge through the skill's bundled driver, served on 4517),
three passes on the final index.html, 49 frames each, sheets read by eye:

| Pass | Result |
|---|---|
| 1440x900 (`lab/shots`) | 9.8 viewport-heights, no dead scroll, clip moving on every frame it is on screen, all cues clear 4.5:1 |
| 390x844 (`lab/mobile`) | 10.8 viewport-heights, same |
| reduced motion (`lab/reduced`) | posters hold, no clip fetched, planes static (`hero:static`), all cues clear |

Hero-specific (`lab/herocheck.mjs`, copy hidden and the darkest pixel under every
line of hero text measured on the composited frame):

| Viewport | Pointer / scroll | Worst line |
|---|---|---|
| 1440 | centre, bottom right, top left; scroll 0, 225, 450 | 10.76:1 |
| 1440 reduced motion | same positions | 10.97:1 |
| 390 | same positions | 14.34:1 |

The verify state shows the planes really move: at 1440, pointer at the bottom right
gives `far:4 mid:10 near:19`; a quarter of the way down gives `far:191 mid:112
near:-50`.

Hero captures I looked at: `lab/hero/desk/top_pointer-centre.png`,
`lab/hero/desk/top_pointer-bottomright.png`, `lab/hero/desk/quarter.png`,
`lab/hero/mobile/top_pointer-centre.png`, `lab/hero/reduced/top_pointer-centre.png`,
plus harness frames `lab/shots/00.png`, `02.png`, `04.png`, `28.png`, `lab/mobile/00.png`
to `03.png`, `28.png`, `29.png`, `lab/reduced/00.png`, `28.png`. The previous round's
frames are kept in `lab/prev-r3/`.

Also checked: 3 distinct `data-hero-layer` values, layer files present, no em dash in
index.html, BRIEF.md or this report, no employer named, no external script, no CLI or
model name on the page, GitHub and mailto present.

## Not verified

- A real phone or a real mouse. Pointer drift was exercised by moving the headless
  pointer and reading the transform values, not by hand.
- Safari. The harness is Chromium-based Edge only.
- Very short phones (under about 660 px tall); only 844 tall was shot. The hero copy
  is top-aligned on phones so it should not collide with the desk, but I did not
  measure it below 844.
- The dollar figure for the spend (see above).

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`
`page.dev.html` (edited), `index.html` (rebuilt by build-inline.py), `BRIEF.md` (round 5
section appended), `assets/hero-*.webp` (6 files), `out/hero-*.png` + `.prompt.txt` +
logs, `lab/hero-layers.py`, `lab/herocheck.mjs`, `lab/hero/{desk,mobile,reduced}/`,
`lab/shots`, `lab/mobile`, `lab/reduced` (fresh), `lab/prev-r3/` (last round's frames),
`lab/page.dev.pre-r5.html.bak` (the page before this round).
Site copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html` + `assets/`.
Worker: this file, `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r5-hero/check-hero.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r5-hero/worker`
Output: `PASS`, exit 0 (recorded in result.json as `verify_exit`).

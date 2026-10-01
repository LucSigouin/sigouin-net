# sigouin.net round 10: the plant leaves the near plane (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed.

## What changed

Luc: "can we change the plant to something else, it's bothering me in the hero section."
The near plane of the title page is now a pair of over-ear headphones with a fabric
headband hanging on a slim oak stand. It enters from the lower right, is softest toward the
frame edge, and is warm-graded so its shadows sit in the mid plane's window light from the
upper left. No plant, leaf or foliage anywhere in the new plane. Far plane, mid plane, the
seam mask, the window-light move, the CSS and the motion are untouched. Only two asset files
and one CSS comment changed on the page.

## How to see it

1. A canvas browser node named "sigouin.net r10" shows the deployable copy,
   `file:///Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html`. Scroll slowly
   through the first screen and move the mouse across it. (From `file://` the chapter 1 clip
   falls back to its poster; the hero layers themselves work either way.)
2. The stills and the cut are in the live gallery node "sigouin.net near plane"
   (`fleet-r10-near/gallery.html`, watching the build's `out/`).

## The stills and the pick

Two stills through the skill's kie.ai path, both with the build's verbatim world preamble
(natural-light documentary, warm white, pale oak, one blue accent, no people, no text) and
an explicit "No plant, no leaves, no foliage, no mug" line. Full prompts sit beside each PNG
in the build's `out/` as `*.prompt.txt`.

| # | File (out/) | Scene | Used as |
|---|---|---|---|
| 1 | hero-near-hp-a.png | matte black headphones resting on a pale oak stand, bottom right, earcup nearest the lens out of focus | runner-up: sharper, sits mid-frame rather than entering from the corner |
| 2 | hero-near-hp-b.png | fabric-headband headphones hanging on a slim oak stand, whole object gently out of focus and softest toward the frame edge, warm daylight from the upper left | the near plane |

Pick: B. It matches the brief's framing logic best (enters from the lower right, soft toward
the edge) and its warm light already reads as the same window as the mid plane. The third
still was not needed.

Prompt used for B (scene part, after the preamble):

> The near plane of a three-layer hero: one foreground object very close to the lens,
> entering from the bottom right corner, a pair of over-ear studio headphones with a dark
> grey fabric headband and soft leather earcups hanging on a slim oak stand, the whole object
> gently out of focus and softest toward the frame edge, wide-open aperture bokeh, soft warm
> daylight from the upper left with a faint highlight on the headband. No plant, no leaves,
> no foliage, no mug, no cable clutter. Everything else in the frame is a plain, flat,
> seamless warm off-white studio background with no wall, no shadows, no horizon line, empty.

## The cut (lab/hero-near-r10.py, PIL only)

Same shape as round 5's near plane (soft zone around the corner, bottom feather, WebP at
1200 and 700 wide, quality 74), with two changes forced by the object:

1. Round 5 keyed on saturation and darkness. That left the sunlit stretch of the fabric
   headband as a ghost, because its highlights are as bright as the floor. The key is now
   the colour distance from a locally estimated backdrop: a hard core (clearly dark or
   clearly saturated) is dilated, the backdrop under it is filled in by repeated blur at
   quarter size, and alpha is the distance from that estimate (strict away from the object,
   lenient around it so the lit fabric stays whole).
2. Warm grade on the object (R x1.08, B x0.86): the still's shadows were (58,54,46), the
   mid plane's are about (94,78,56). The object is nudged 8 percent right and 9 percent down
   so it enters from the corner. Bottom feather 14 percent instead of 24, since the earcups,
   not bokeh leaves, sit at the bottom.

Weight:

| File | Before (plant) | After (headphones) |
|---|---|---|
| hero-near-1200.webp | 41,192 | 50,590 |
| hero-near-700.webp | 19,732 | 25,404 |
| both | 60,924 | 75,994 (cap 120,000) |

## Verification

Harness server: `serve.mjs` on port 4518 (pid recorded in `lab/serve-r10.pid`, killed at
the end). `lab/herocheck.mjs` (headless Edge through the skill's bundled driver), extended
this round with a near-plane cover check: it decodes the near image, maps every line of hero
copy into image space and reports the maximum alpha under it.

| Run | Positions | Worst contrast | Near alpha under any copy line |
|---|---|---|---|
| 1440x900 (`lab/hero-r10/desk`) | scroll 0 with pointer centre, bottom right, top left; 25 percent (225 px); 50 percent (450 px) | 11.4:1 | 0/255 at all five |
| 390x844 (`lab/hero-r10/mobile`) | same five (25 percent = 211 px, 50 percent = 422 px) | 14.37:1 | 0/255 at all five |
| 1440x900 reduced motion (`lab/hero-r10/reduced`) | same five, state `hero:static` | 11.62:1 | 0/255 at all five |

The planes still move: at 1440, pointer bottom right gives `far:4 mid:10 near:19`; half way
down the hero gives `far:382 mid:225 near:-99`.

Mutant test of the cover check: `HERO_MUTANT=1` drags the near plane under the copy
(`lab/hero-r10/mutant`). It then reports `alpha 255/255 COVERS` on all five positions and
contrast falls to 1.93:1, so the check does go red when the object sits on the type. A first
mutant that only moved the plane to the top left stayed green because the object lives in
the image's lower right; the stronger mutant fixed that.

Captures I looked at: `lab/hero-r10/desk/top_pointer-centre.png`, `quarter.png`, `half.png`;
`lab/hero-r10/mobile/top_pointer-centre.png`, `quarter.png`, `half.png`;
`lab/hero-r10/reduced/top_pointer-centre.png`. At rest the headband arch and the stand enter
from the lower right beside the desk, the earcup sits solid at the corner, and the object
fades into the paper as the near plane rises through 25 and 50 percent. At 390 it stays in
the bottom right, well clear of the top-aligned copy.

Also checked: index.html has no em dash, no plant word (the seven hits for "leaves" are the
verb in engine comments), no CLI or model name on the page; BRIEF.md, this report and the
scripts have no em dash. Site copy: `index.html` sha256 `780bebf9...e2a0` in both the build
and `sigouin-net/site/`; `rsync -a --delete` synced `assets/` and `diff -rq` reports them
identical, so the old plant files are gone from `site/` too (they were overwritten in place
under the same names).

## Spend

2 stills. Probe before 460 credits, after 432: 28 credits, 14 per still. No credit-to-dollar
rate found, so `spend_usd` is not recorded; the credits are.

## Not verified

- A real phone or a real mouse. Pointer drift was read from transform values in headless Edge.
- Safari. The harness is Chromium-based Edge only.
- Phones shorter than 844 px.
- The dollar value of the spend.
- The taste call. The mid plane already holds a small pair of headphones at the back right
  of the desk, so the hero now shows two pairs (the near one large, the mid one small and
  partly behind it). The near pair hides most of the mug and notebook at rest, as the plant
  did. If Luc finds the echo odd, the fallback from the brief is the mug and notebook corner;
  `hero-near-hp-a.png` is also on disk as a runner-up and runs through the same script with
  `python3 lab/hero-near-r10.py out/hero-near-hp-a.png`.

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`
`page.dev.html` (one comment line), `index.html` (rebuilt by build-inline.py), `BRIEF.md`
(round 10 section appended), `assets/hero-near-1200.webp` + `hero-near-700.webp`,
`out/hero-near-hp-{a,b}.png` + `.prompt.txt` + `.run.log`, `out/hero-near-r10.rgba.png`,
`out/hero-near-r10.backdrop.png`, `out/hero-near-r10.probe-{before,after}.log`,
`lab/hero-near-r10.py`, `lab/hero-near-r10-comp.py`, `lab/herocheck.mjs` (extended),
`lab/hero-r10/{desk,mobile,reduced,mutant}/`, `lab/page.dev.pre-r10.html.bak`,
`lab/serve-r10.{log,pid}`.
Site copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html` + `assets/`.
Worker: this file, `result.json`. Gallery: `fleet-r10-near/gallery.html`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r10-near/check-r10.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r10-near/worker`
Output: `PASS` / `PASS` / `PASS`, exit 0 (recorded in result.json as `verify_exit`).

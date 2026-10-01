# sigouin.net round 11, lane b: a small silver mini computer as the near plane (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, nothing
copied into sigouin-net/site/.

## What it is

The near plane of the title page is now a small brushed silver mini computer, a flat square box
about the size of a paperback, sitting low in the bottom right corner. One muted blue ethernet
cable runs from its back off the right edge of the frame. A tiny white status light sits on its
front edge. It is gently out of focus, softest toward the frame edge, and fades into the paper at
the bottom. At 1440 it covers roughly 260 by 130 px over the notebook corner of the desk; at 390
it sits in the bottom right, well under the top-aligned copy. Far plane, mid plane, seam mask,
window-light move, copy, CSS and everything below the hero are untouched: page.dev.html and
index.html are byte-identical to the round 10 build. Only the two near asset files changed.

## How to see it

1. Canvas browser node "near: b" shows the finished build,
   `file:///Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-b/index.html`.
   Scroll slowly through the first screen and move the mouse across it. (From `file://` the
   chapter 1 clip falls back to its poster; the hero layers work either way.)
2. The three stills and the cut are in the gallery node "gallery: near b"
   (`fleet-r11-near3/b/gallery.html`, watching the build's `out/`).

## The stills and the pick

Three stills through the skill's kie.ai path (seedream text-to-image, 16:9). Full prompts sit
beside each PNG in the build's `out/` as `*.prompt.txt`.

| # | File (out/) | What came back | Used as |
|---|---|---|---|
| a | hero-near-minipc-a.png | right object (silver box, blue cable off the right edge, white light) but the model painted a full oak desk and wall behind it, so the cut would have been a fight | rejected |
| b | hero-near-minipc-b.png | plain warm backdrop, box mid-frame right, cable to the right edge | runner-up |
| c | hero-near-minipc-c.png | plain warm backdrop, box in the bottom right corner partly cropped, cable running to the bottom right corner, soft focus | the near plane |

Pick: c. It is the only one that enters from the corner the way the brief asks, and the plain
backdrop keys cleanly. Prompt for c (scene part, after a shortened version of the build's world
preamble):

> Isolated product still for a layered composite: the entire frame is a plain, flat, seamless
> warm off-white paper backdrop, no desk, no table, no wall, no floor, no horizon line,
> completely empty. In the bottom right corner of the frame, partly cropped by the right edge,
> one small object very close to the lens: a compact brushed silver aluminium mini computer, a
> flat square box with rounded corners, seen from a low angle, a single muted blue ethernet cable
> running from its back toward the camera and off the bottom right corner of the frame, one tiny
> white status light on its front edge. It casts only a faint soft shadow directly under itself.
> Wide-open aperture bokeh, the whole object gently out of focus and softest toward the frame
> edge, a faint highlight along the top edge of the aluminium. No plant, no leaves, no foliage,
> no headphones, no mug, no monitor, no keyboard, no other cables.

## The cut (lab/hero-near-r11b.py, PIL only)

Same shape as round 10 (backdrop estimate, colour-distance key, WebP at 1200 and 700 wide,
quality 74) with three changes forced by the object:

1. A silver box has no dark or saturated core to seed the key. Instead a hand zone over the lower
   right is excluded from the backdrop estimate, the backdrop is inpainted by repeated blur from
   the rest of the frame, and alpha is the colour distance from that estimate: lenient inside the
   zone (the front face is only about 30 levels off the backdrop), strict outside so grain stays
   empty. The soft shadow under the box comes through faintly, which is wanted.
2. The object is lifted 10 percent of the image height. The near CSS sits the image 5 percent
   below the viewport edge, and in the raw still that clipped the front face and the light.
3. A mild warm grade (R x1.02, B x0.95) and a 12 percent bottom feather so the cable melts into
   the paper past the frame edge.

Weight:

| File | Before (headphones) | After (mini computer) |
|---|---|---|
| hero-near-1200.webp | 50,590 | 60,798 |
| hero-near-700.webp | 25,404 | 26,612 |
| both | 75,994 | 87,410 (cap 120,000) |

## Verification

Harness server: the skill's `serve.mjs` on port 4523 (pid in `lab/serve-r11b.pid`, killed at the
end; 4519 was already held by another lane). `lab/herocheck.mjs` (round 10 version, unchanged:
headless Edge through the skill's bundled driver, copy hidden, darkest pixel under every line of
hero copy, plus the near-plane alpha under every copy line).

| Run | Positions | Worst contrast | Near alpha under any copy line |
|---|---|---|---|
| 1440x900 (`lab/hero-r11b/desk`) | scroll 0 with pointer centre, bottom right, top left; 25 percent (225 px); 50 percent (450 px) | 11.4:1 | 0/255 at all five |
| 390x844 (`lab/hero-r11b/mobile`) | same five (211 px, 422 px) | 14.37:1 | 0/255 at all five |
| 1440x900 reduced motion (`lab/hero-r11b/reduced`) | same five, state `hero:static` | 11.62:1 | 0/255 at all five |

The planes still move: at 1440 pointer bottom right gives `far:4 mid:10 near:19`; half way down
the hero gives `far:382 mid:225 near:-99`.

Mutant test (`HERO_MUTANT=1`, `lab/hero-r11b/mutant`): dragging the near plane under the copy
reports `alpha 254/255 COVERS` at all five positions and contrast falls to 7.27:1, so the check
goes red when the object sits on the type.

Captures I looked at: `lab/hero-r11b/desk/top_pointer-centre.png`, `quarter.png`, `half.png`,
`lab/hero-r11b/mobile/top_pointer-centre.png`. At rest the box sits in the bottom right over the
notebook corner with the cable leaving the frame; at 25 and 50 percent it rises and fades into the
paper. Copies of all 15 frames are in `lab/shots/` for the base gate.

Also checked: page.dev.html and index.html byte-identical to `builds/sigouin-net`; `diff -rq`
on assets shows only the two near files differ; no em dash in index.html, page.dev.html, the
scripts or this report; the near img attributes carry no banned object word; no CLI or model name
on the page. index.html rebuilt with build-inline.py (124,621 bytes).

## Spend

3 stills. Probe before 432 credits, after 320: a delta of 112. Lanes a and c were generating on
the same key at the same time, so I cannot say how much of that is mine; at round 10's observed
rate it would be about 42. No credit-to-dollar rate is recorded, so `spend_usd` is not given.

## Not verified

- A real phone or a real mouse. Pointer drift was read from transform values in headless Edge.
- Safari. The harness is Chromium-based Edge only.
- Phones shorter than 844 px.
- The dollar value of the spend, and the exact share of the 112 credits that is this lane's.
- The taste call. The mid plane already holds a silver desktop computer at the back of the desk,
  so this lane puts a second, smaller silver box in front of it (the same echo problem round 10
  had with two pairs of headphones). The box also hides part of the notebook at rest. The warm
  window light makes the top face read gold rather than silver. Still b is on disk as a runner-up
  and runs through the same script with `python3 lab/hero-near-r11b.py out/hero-near-minipc-b.png`.

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-b/`
`assets/hero-near-1200.webp` + `hero-near-700.webp` (replaced), `index.html` (rebuilt, identical),
`out/hero-near-minipc-{a,b,c}.png` + `.prompt.txt` + `.run.log`, `out/hero-near-r11b.rgba.png`,
`out/hero-near-r11b.backdrop.png`, `out/hero-near-r11b.probe-{before,after}.log`,
`lab/hero-near-r11b.py`, `lab/hero-near-r11b-comp.py`, `lab/herocheck.mjs` (copy of round 10),
`lab/hero-r11b/{desk,mobile,reduced,mutant}/`, `lab/shots/`, `lab/comp-*.jpg`, `lab/near-alone.jpg`,
`lab/preview-{a,b,c}.png`, `lab/serve-r11b.{log,pid}`.
Report dir: this file, `result.json`, `gallery.html`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/check-r11.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-b /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/b`
Output: see result.json `verify_exit`.

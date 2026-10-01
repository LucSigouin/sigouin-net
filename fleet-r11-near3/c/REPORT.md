# sigouin.net round 11, lane c: a studio monitor corner as the near plane (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, nothing
copied into sigouin-net/site/.

## The object

The near plane is now the rounded upper left corner of one compact studio monitor speaker:
warm grey cabinet, fabric front, a pale rim catching the window light, the top edge of the
woofer ring just showing. It sits at the lower right desk edge, cut off by the right and
bottom of the frame, gently out of focus and softest toward the edge. At 1440 it stands
about 180 px tall in a 900 px hero (a fifth, under the one-third cap) and covers the lower
right quarter only. At 390 it sits in the bottom right, under the desk edge. It never
touches the headline or the positioning line. Far plane, mid plane, the seam mask, the
window-light move, all copy and everything below the hero are untouched. Only the two near
asset files and one CSS comment line changed on the page. No CSS size or position change
was needed.

## How to see it

1. Canvas browser node "near: c" shows the finished build,
   `file:///Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-c/index.html`.
   Scroll slowly through the first screen and move the mouse across it. From `file://`
   the chapter 1 clip falls back to its poster; the hero layers work either way.
2. The two stills and the cut are in the live gallery node "gallery: near c"
   (`fleet-r11-near3/c/gallery.html`, watching the build's `out/`).

## The stills and the pick

Two stills through the skill's kie.ai path, both with the build's verbatim world preamble
plus an explicit "No plant, no leaves, no foliage, no headphones, no mug, no cables" line.
Full prompts sit beside each PNG in the build's `out/` as `*.prompt.txt`. A third still was
not needed.

| # | File (out/) | Scene | Used as |
|---|---|---|---|
| 1 | hero-near-spk-a.png | matte black cabinet corner, metallic rim, woofer ring | runner-up: clean, but the black body is the "too dark against the pale page" risk |
| 2 | hero-near-spk-b.png | warm grey cabinet corner, fabric front, pale rim, dark woofer ring | the near plane |

Pick: B. Its grey fabric and pale rim sit in the mid plane's palette (pale oak, soft grey),
and the corner still reads as a speaker once the woofer edge shows.

Prompt used for B (scene part, after the preamble):

> The near plane of a three-layer hero: one small object very close to the lens, entering
> from the bottom right corner of the frame and cut off by the right and bottom edges. It is
> the rounded upper left corner of one compact warm grey studio monitor speaker with a
> fabric-textured front, a small nearfield monitor: a soft rounded cabinet edge and the top
> edge of a dark woofer ring, low and wide, never rising above the lower third of the frame.
> The object is gently out of focus, softest toward the frame edge, wide-open aperture bokeh,
> soft warm daylight from the upper left with a faint highlight along the rounded corner. No
> plant, no leaves, no foliage, no headphones, no mug, no cables. Everything else in the
> frame is a plain, flat, seamless warm off-white studio background with no wall, no shadows,
> no horizon line, empty.

## The cut (lab/hero-near-r11c.py, PIL only)

Same shape as round 10: key = colour distance from a locally estimated backdrop, warm grade,
bottom feather, WebP at 1200 and 700 wide, quality 74. Three changes for this object:

1. The hard core threshold is lifted (V under 150) so the mid-grey fabric counts as object,
   and holes inside the cabinet (bright rim, woofer highlight) are closed with a blur and
   threshold pass.
2. Warm grade is lighter (R x1.06, B x0.90) since the still is already warm grey.
3. The object is raised by a 1.18 zoom anchored at the bottom right corner, not by a shift.
   The first attempt shifted the object up 9 percent and left an empty band under it above
   the bottom feather, which showed as a straight horizontal cut at 50 percent scroll
   (caught in the captures, fixed in the one batched fix round). The zoom keeps the cabinet
   running to the image bottom so the 14 percent smoothstep feather does its job.

Object bounding box in the plane: x 41 to 100 percent, y 46 to 98 percent.

Weight:

| File | Before (headphones) | After (speaker) |
|---|---|---|
| hero-near-1200.webp | 50,590 | 23,622 |
| hero-near-700.webp | 25,404 | 10,552 |
| both | 75,994 | 34,174 (cap 120,000) |

sha256 (first 16) of hero-near-1200.webp: 78d8c49423a15e4b (before: 1bae411940aa4a38).
alt stays empty; the near img attributes carry no plant, leaf, foliage or headphone word.

## Verification

Harness server: the skill's `serve.mjs` on port 4519 in a canvas shell node (pid in
`lab/serve-r11c.pid`, killed at the end, `lsof` shows no listener left). `lab/herocheck.mjs`
(headless Edge through the skill's bundled driver, copied from the round 10 build) measures
composited contrast under every line of hero copy with the copy hidden, plus the near-plane
cover check (max alpha of the near image under any copy line).

| Run | Positions | Worst contrast | Near alpha under any copy line |
|---|---|---|---|
| 1440x900 (`lab/shots-r11c/desk`) | scroll 0 with pointer centre, bottom right, top left; 25 percent (225 px); 50 percent (450 px) | 11.4:1 | 0/255 at all five |
| 390x844 (`lab/shots-r11c/mobile`) | same five (211 px, 422 px) | 14.37:1 | 0/255 at all five |
| 1440x900 reduced motion (`lab/shots-r11c/reduced`) | same five, state `hero:static` | 11.62:1 | 0/255 at all five |

The planes still move: at 1440, pointer bottom right gives `far:4 mid:10 near:19`; half way
down the hero gives `far:382 mid:225 near:-99`.

Mutant test of the cover check (`lab/shots-r11c/mutant`): the round 10 mutant stayed green
here because this object lives lower in its image than the headphones did, so the mutant CSS
was strengthened (`left:-70%; top:-45%; width:150%`). It then reports `alpha 255/255 COVERS`
on all five positions and contrast falls to 1.05:1. The check goes red when the object sits
on the type.

Captures I looked at: `lab/shots-r11c/desk/top_pointer-centre.png`, `quarter.png`,
`half.png`; `lab/shots-r11c/mobile/top_pointer-centre.png`, `half.png`;
`lab/shots-r11c/reduced/top_pointer-centre.png`. At rest the speaker corner sits at the
desk edge in the lower right, its rim lit from the upper left like the desk, covering part
of the notebook. At 25 percent the cabinet rises past the mid headphones and fades; at 50
percent it dissolves into the paper with no straight edge. At 390 it stays in the bottom
right, well clear of the top-aligned copy.

Also checked: no em dash in index.html, page.dev.html or the cut script; no CLI or model
name on the page; page.dev.html changed on one comment line only (backup at
`lab/page.dev.pre-r11c.html.bak`).

## Spend

2 stills. Probe before 432 credits, after 320: a delta of 112. Lanes a and b were generating
on the same key at the same time, so that delta is the round's shared spend, not this
lane's alone. At round 10's rate (14 per still) this lane's share is about 28 credits. No
credit-to-dollar rate found, so `spend_usd` is not recorded.

## Not verified

- A real phone or a real mouse. Pointer drift was read from transform values in headless Edge.
- Safari. The harness is Chromium-based Edge only.
- Phones shorter than 844 px.
- The dollar value of the spend.
- The taste call: whether the corner reads as a speaker to Luc at first glance. The woofer
  ring only shows at the very bottom at rest; if he wants more speaker, ZOOM in
  `lab/hero-near-r11c.py` goes up (1.18 now, still under a third of the hero at 1.35), and
  the matte black still A runs through the same script with
  `python3 lab/hero-near-r11c.py out/hero-near-spk-a.png`.

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-c/`
`page.dev.html` (one comment line), `index.html` (rebuilt by build-inline.py),
`assets/hero-near-1200.webp` + `hero-near-700.webp`, `out/hero-near-spk-{a,b}.png` +
`.prompt.txt` + `.run.log`, `out/hero-near-r11c.rgba.png`, `out/hero-near-r11c.backdrop.png`,
`out/hero-near-spk.probe-{before,after}.log`, `lab/hero-near-r11c.py`, `lab/herocheck.mjs`,
`lab/shots-r11c/{desk,mobile,reduced,mutant}/`, `lab/page.dev.pre-r11c.html.bak`,
`lab/serve-r11c.pid`, preview jpgs in `lab/`.
Report dir: this file, `result.json`, `gallery.html`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/check-r11.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-c /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/c`
Output: `PASS` / `PASS` / `PASS`, exit 0 (recorded in result.json as `verify_exit`).

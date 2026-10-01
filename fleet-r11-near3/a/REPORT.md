# sigouin.net round 11, lane a: the desk corner as the near plane (final)

Status: done. Gate exits 0 (output at the bottom). Nothing deployed, nothing pushed, nothing
copied into sigouin-net/site/.

## The candidate

No object. The near plane is the front corner of the pale oak desk itself: the sharp front edge
running diagonally, a plain white ceramic mug and a closed grey linen notebook with a thin blue
band resting near the corner. It enters from the lower right, sits lower than the old headphones
and further into the corner, and its legs dissolve into the paper through a bottom feather.
Nothing rises toward the headline. The oak is graded down to the mid plane's oak so the two
desks read as one piece of furniture in the same window light.

## How to see it

1. Canvas browser node "near: a" shows the build's index.html
   (`file:///Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-a/index.html`).
   Scroll slowly through the first screen and move the mouse across it. From `file://` the
   chapter 1 clip falls back to its poster; the hero planes work either way.
2. The three stills and the cut are in the live gallery node "gallery: near a"
   (`fleet-r11-near3/a/gallery.html`, watching the build's `out/`).
3. Captures I looked at: `lab/shots-r11/desk/top_pointer-centre.png`, `quarter.png`, `half.png`,
   `lab/shots-r11/mobile/top_pointer-centre.png`, `lab/shots-r11/reduced/top_pointer-centre.png`
   (all under the build dir).

## The stills and the pick

Three stills through the skill's kie.ai path, all with the build's verbatim world preamble
(natural-light documentary, warm white, pale oak, one muted blue accent, no people, no text).
Full prompts sit beside each PNG in the build's `out/` as `*.prompt.txt`.

| # | File (out/) | Scene | Used as |
|---|---|---|---|
| a | hero-near-desk-a.png | desk corner from slightly above, sharp front edge on a diagonal, mug and closed notebook near the corner, plain backdrop | the near plane |
| b | hero-near-desk-b.png | camera low and close to the desk edge | rejected: came back with a whole room (window, wall, floor), no clean cutout |
| c | hero-near-desk-c.png | a small triangle of desk corner, under a quarter of the frame | runner-up: clean, but the notebook is cut by the frame edge and the mug sits on the very corner |

Pick: a. It has the clearest front edge, both objects whole, and a plain backdrop the cut can
key against.

Prompt used for a (scene part, after the preamble):

> The near plane of a three-layer hero, no tall object: only the front corner of a pale oak desk
> enters the frame from the bottom right, seen from slightly above, the sharp front edge of the
> desk top running diagonally, a plain white ceramic mug and a closed grey linen notebook with a
> thin blue elastic band resting on the wood near the corner, both low and small. Soft warm
> daylight from the upper left, the wood grain crisp at the edge and gently softening toward the
> frame border. Nothing rises above the desk surface, no lamp, no monitor, no plant, no
> headphones. The rest of the frame, the whole upper and left area, is a plain, flat, seamless
> warm off-white studio background with no wall, no shadows, no horizon line, empty.

## The cut (lab/hero-near-r11a.py, PIL only)

Same shape as round 10's cut: a hard core of clearly oak or clearly dark pixels, a locally
estimated backdrop, alpha from the colour distance to that backdrop, bottom feather, WebP at 1200
and 700 wide at quality 74. Two changes forced by this object:

1. The sunlit stretch of the desk top is almost the backdrop colour, so the raw key left ragged
   holes in the wood. The binary alpha now gets a morphological closing (grow then shrink, 44 px)
   and a flood fill from the frame corner; anything not reachable from outside is kept solid. That
   also closes the white mug, whose lit side keys weak against off-white.
2. The oak is graded toward the mid plane's oak (mid 173,147,111 against the still's 207,181,145,
   gains 0.84 / 0.81 / 0.77), weighted by a soft oak mask so the mug and notebook keep their own
   colour. Bottom feather 26 percent so the legs go and only the desk top corner reads.

The CSS moved the plane lower and further into the corner (desktop: width 48 percent, right -5,
bottom -12; phone: right -8, bottom -9) after the first capture round showed the near mug standing
directly in front of the mid plane's mug. The `sizes` hint follows the new width (48vw). One CSS
comment describing the near plane was updated. Nothing else on the page changed.

Weight:

| File | Before (headphones) | After (desk corner) |
|---|---|---|
| hero-near-1200.webp | 50,590 | 44,952 |
| hero-near-700.webp | 25,404 | 21,522 |
| both | 75,994 | 66,474 (cap 120,000) |

## Verification

Harness: the skill's `serve.mjs` on port 4531 then 4532 (pid in `lab/serve-r11.pid`, killed at
the end of each run; `lsof` on the port came back empty). `lab/herocheck.mjs` is a copy of the
round 10 script (headless Edge through the skill's bundled driver): contrast under every line of
hero copy with the copy hidden, plus the near-plane cover check (maximum alpha of the near image
under any copy line).

| Run | Positions | Worst contrast | Near alpha under any copy line |
|---|---|---|---|
| 1440x900 (`lab/shots-r11/desk`) | scroll 0 with pointer centre, bottom right, top left; 25 percent (225 px); 50 percent (450 px) | 11.4:1 | 0/255 at all five |
| 390x844 (`lab/shots-r11/mobile`) | same five (211 px, 422 px) | 14.37:1 | 0/255 at all five |
| 1440x900 reduced motion (`lab/shots-r11/reduced`) | same five, state `hero:static` | 11.62:1 | 0/255 at all five |

The planes still move: at 1440, pointer bottom right gives `far:4 mid:10 near:19`; half way down
the hero gives `far:382 mid:225 near:-99`.

Read by eye: at rest at 1440 the desk corner enters from the lower right below the mid desk's
mug, the near mug and notebook sit in the corner, and the front edge is the sharpest line in the
hero. At 25 and 50 percent the corner rises and fades into the paper. At 390 it stays in the
bottom strip, well clear of the top-aligned copy. No pasted-on edge at the desk edge or the mug;
the mug's handle hole shows the still's own shaded off-white rather than the paper, which reads as
shadow.

Mutant test of the cover check: `HERO_MUTANT=1` drags the near plane under the copy
(`lab/shots-r11/mutant`). See the line under "Mutant" below for the result of this session's run.

Also checked: no em dash in index.html, page.dev.html, the cut script or this report; the near
img attributes carry no plant, foliage or headphone word; no CLI or model name on the page; the
far and mid planes, the seam mask, the window-light move and all copy are byte-identical to the
copy I started from apart from the near plane's CSS block and one comment
(`lab/page.dev.pre-r11a.html.bak` is the page before this round).

## Spend

3 stills. Probe before 432 credits, after 362: 70 credits, about 23 per still. No
credit-to-dollar rate found, so the dollar figure is not recorded.

## Not verified

- A real phone or a real mouse. Pointer drift was read from transform values in headless Edge.
- Safari. The harness is Chromium-based Edge only.
- Phones shorter than 844 px.
- The dollar value of the spend.
- The taste call. The mid plane keeps its own mug and notebook, so the hero shows two mugs and
  two notebooks at different depths. Moving the near plane lower separated them; if Luc still
  finds the echo odd, still c (`out/hero-near-desk-c.png`) runs through the same script with
  `python3 lab/hero-near-r11a.py out/hero-near-desk-c.png`.

## Mutant

`HERO_MUTANT=1 node lab/herocheck.mjs http://localhost:4532 1440 900 lab/shots-r11/mutant`
reported `near-under-copy alpha 255/255 COVERS` at all five positions and contrast fell to
3.77:1 (4.22:1 at half), so the check does go red when the object sits on the type. The real
build reports 0/255 and at least 11.4:1 at the same positions.

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-a/`
`page.dev.html` (near CSS block, sizes hint, one comment), `index.html` (rebuilt by
build-inline.py), `assets/hero-near-1200.webp` + `hero-near-700.webp`,
`out/hero-near-desk-{a,b,c}.png` + `.prompt.txt` + `.run.log`, `out/hero-near-r11a.rgba.png`,
`out/hero-near-r11a.alpha.png`, `out/hero-near-r11a.backdrop.png`,
`out/hero-near-r11.probe-{before,after}.log`, `lab/hero-near-r11a.py`, `lab/herocheck.mjs`,
`lab/shots-r11/{desk,mobile,reduced,mutant}/`, `lab/page.dev.pre-r11a.html.bak`,
`lab/serve-r11.{log,pid}`, `lab/mutant-r11.log`, preview crops `lab/*.png`.
Report dir: this file, `result.json`, `gallery.html`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/check-r11.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-near-a /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r11-near3/a`

Output: `PASS` / `PASS` / `PASS`, exit 0 (recorded in result.json as `verify_exit`).

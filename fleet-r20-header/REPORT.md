# Round 20: the header lane

Lane dir: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r20-header/`
Source: a fresh copy of `fleet-r18-background/site`. `sigouin-net/site/`, `fleet-r18-background/`,
`fleet-r17-noscroll/` and every earlier lane were not touched.

Model: claude-opus-5. Date: 2026-09-17.

Luc's feedback on round 18, verbatim: "i don't like that it hides the image at the top can we
leave it a bit like before?"

## What was actually wrong

Round 17 put a `<img class="overture__bed" src="assets/still/03-sigz-waveform.webp">` inside the
overture and left it there forever. When the curtain closed, the overture collapsed into the
header strip and that image stayed behind SIGOUIN.NET, so the strip read as the green waveform.

Round 18 did two things that killed it:

1. It replaced the `<img>` with clip B, the Earth, and `handOffToGround()` in `hub.js` removes
   clip B from the DOM 950 ms after the curtain closes. After that the overture has no bed at
   all.
2. It added `html[data-overture="settled"] .overture::after{background:rgba(10,10,11,.78)}`, a
   flat ink wash that replaces round 17's gradient once the strip settles.

Together the strip became a flat pane over the dim starfield ground, which reads as plain black.

## The three lines changed

| File | Round 18 | Round 20 |
|---|---|---|
| `site/index.html` 11 | `<link rel="preload" as="image" href="assets/bg-b-1080-20260917.poster.webp">` was the first preload | The round 17 line `<link rel="preload" as="image" href="assets/still/03-sigz-waveform.webp">` is back above it, so the bed is fetched at the same priority it had in round 17 |
| `site/index.html` 27 to 30 | The overture opened straight onto `<video class="overture__bed" id="overtureBed">` | The round 17 `<img class="overture__bed" src="assets/still/03-sigz-waveform.webp" alt="" width="1536" height="1024" fetchpriority="high" decoding="sync">` is written first, clip B second |
| `site/css/hub.css` 86 to 88 | `html[data-overture="settled"] .overture::after{background:rgba(10,10,11,.78)}` | Rule deleted. The strip keeps round 17's `linear-gradient(190deg,rgba(10,10,11,.5) 0%,rgba(10,10,11,.2) 40%,rgba(10,10,11,.93) 100%)` |
| `site/css/hub.css` 253 | `.proc-strip::after{...linear-gradient(180deg,rgba(10,10,11,.72),rgba(10,10,11,.9))}` | Back to round 17's `linear-gradient(180deg,rgba(10,10,11,.5),rgba(10,10,11,.88))` |

No new CSS rule was written. The `<img>` reuses the existing `.overture__bed` class, whose
`filter:grayscale(.35) contrast(1.12) brightness(.44)`, `transform:scale(1.08)` and
`animation:bed` are byte for byte the round 17 values, untouched since. That is why the crop and
the brightness match rather than approximate.

## Stacking order

Inside the `.overture` stacking context, bottom to top:

| z-index | Element |
|---|---|
| 0 | `img.overture__bed`, the waveform still, written first |
| 0 | `video.overture__bed#overtureBed`, clip B, written second so it paints over the still |
| 1 | `.overture::after`, the round 17 gradient |
| 2 | `.overture__top`, `.overture__mid`, `.overture__foot` |

Both beds sit at z-index 0, so DOM order alone decides which one shows. No new z-index value was
introduced. Clip B covers the still for the whole overture, then `.is-out` fades it over 900 ms
and `hub.js` removes it, revealing the still underneath. That is the cross fade round 18 built,
now fading to the waveform instead of to nothing.

Above that, at the page level, `.overture` and `.proc-strip` both carry `position:relative;z-index:1`
from round 18 while `.ground` is `position:fixed;z-index:0`. The header sits above the ground
video, and the bed is opaque and `object-fit:cover` across the whole strip, so the ground clip and
its `rgba(10,10,11,.4)` wash are both behind the bed and cannot wash it out. The pane washes round
18 added are on `.rail-col`, `.stage` and `.scene__note`, none of which is in the header.

Everything else from round 18 is untouched: clip A is still the fixed ground behind the rail and
the stage on both pages, clip B is still the overture bed with the cross fade, `js/bg.js` still
holds both clips on their posters under `prefers-reduced-motion` and `navigator.connection.saveData`,
and `handOffToGround()` in `hub.js` is unchanged.

## Gates

```
$ python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py fleet-r20-header
OK
$ bash /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r20-header/verify.sh
no scroll gate against http://127.0.0.1:5200
  pass  index 1440x900 after overture  h 900/900  w 1440/1440
        index 1440x900 rail rows: 10
  pass  index 1440x900 row 01 hovered  h 900/900  w 1440/1440
  pass  index 1440x900 row 10 hovered  h 900/900  w 1440/1440
  pass  process 1440x900 first scene  h 900/900  w 1440/1440
        process 1440x900 stepped to: P8 / 8
  pass  process 1440x900 at P8  h 900/900  w 1440/1440
  pass  index 390x844 after overture  h 844/844  w 390/390
        index 390x844 rail rows: 10
  pass  index 390x844 row 01 tapped  h 844/844  w 390/390
  pass  index 390x844 row 10 tapped  h 844/844  w 390/390
  pass  process 390x844 first scene  h 844/844  w 390/390
        process 390x844 stepped to: P8 / 8
  pass  process 390x844 at P8  h 844/844  w 390/390

OK: no document scroll on either page at 1440x900 or 390x844.
verify exit: 0
```

The gate exercises the settled state, both hover and tap states, both scenes and both widths. No
document scroll on either page at 1440x900 or 390x844.

## The match, measured

`shots/header-compare-1440.png` stacks the top 96 px of each round's settled index capture, top to
bottom: round 17, round 18, round 20. Round 17 and round 20 both show the green waveform behind
SIGOUIN.NET. Round 18 is flat black with only the faint pane seam showing.

That is not a judgement by eye alone. Cropping the same 1440x96 header band out of each round's
`shots/index-after-overture-1440.png` and differencing it against round 17:

| Comparison | Max channel difference | Mean channel difference |
|---|---|---|
| Round 20 against round 17 | **0** | **0.0** |
| Round 18 against round 17 | 84 | 20.152 |

Round 20's header strip is pixel identical to round 17's. Same crop, same brightness, same
gradient at the edges, because the same element under the same unchanged CSS is drawing it.

## The process strip, honestly

The process wing header never actually lost its image. Its markup carries its own
`cnvs-canvas-pullback` clip and round 18 left that markup alone. All round 18 did there was darken
the `::after` wash from `.5` to `.72` at the top. I reverted that value anyway so `/process/`
carries round 17's numbers exactly, but the measured effect in my captures is one channel level:

| Round | Mean brightness across the strip at y=40 |
|---|---|
| Round 17 | 22.7 |
| Round 18 | 22.8 |
| Round 20 | 22.8 |

The strip clip has `preload="none"` and does not reach a painted frame before the capture, so what
my screenshots show is close to the bare wash on all three. On a real browser where that clip does
play, round 20 now matches round 17 because the gradient values are identical again.

## Screenshots

| File | What it is |
|---|---|
| `shots/header-compare-1440.png` | The three header strips stacked and labelled, round 17, round 18, round 20 |
| `shots/index-after-overture-1440.png` | The settled index with row 10 hovered, waveform in the strip |
| `shots/index-1440.png`, `shots/index-390.png` | The index at both widths |
| `shots/process-1440.png`, `shots/process-390.png` | The process wing at both widths |
| `shots/overture-mid-1440.png` | Mid overture, clip B still playing over the waveform |
| `shots/index-stage-390.png`, `shots/process-p8-1440.png`, `shots/process-ledger-{1440,390}.png` | Carried over from the round 18 shoot script, unchanged in purpose |

Round 17 and round 18 versions of the same frames are in `fleet-r17-noscroll/shots/` and
`fleet-r18-background/shots/`.

## Could not verify

- **The rendered pages by human eye.** I looked at my own PNG captures and the pixel difference
  above only. The pixel difference is strong evidence that the header matches round 17 exactly,
  but Luc should open http://127.0.0.1:5201/ and confirm it reads the way he meant.
- **The cross fade in motion.** I have the mid overture frame and the settled frame, not the 900 ms
  between them. The still is behind clip B the whole time and neither element moves during the
  fade, so there is no frame where the strip can be empty, but I did not film it.
- **The process strip clip actually painting.** As measured above, `preload="none"` means my
  captures show close to the bare wash rather than a video frame. My revert restores round 17's
  values, so the two rounds agree whatever the clip does, but I did not see it play.
- **Video decode and battery on a real phone.** The 390 captures are a desktop browser in mobile
  emulation. The index now carries one more image fetch during the overture than round 18 did.
- **saveData in a real browser.** Unchanged from round 18: `navigator.connection.saveData` is not
  settable in Playwright. The still bed is an `<img>`, so it shows in that branch by construction.
- **AV1 selection.** I did not confirm which of the two video sources the browser chose. Unchanged
  from round 18.
- **Live numbers.** `python3 -m http.server` does not run Cloudflare Functions, so
  `/api/live/sigz/tracks` returns 404 and the page falls back to its labelled sample fixture. The
  console 404s in the shoot output are exactly that, unchanged from rounds 17 and 18.
- **Anything about the live site.** I did not deploy, push, install, generate media, or touch
  `sigouin-net/site/` or any earlier lane.

## RUBRIC.md self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass | The overture is unchanged from round 18: Earth from orbit under the rising wordmark, clip B's poster preloaded as the LCP. What changed is where it lands, on the waveform rather than on black. `shots/overture-mid-1440.png` and `shots/index-after-overture-1440.png` |
| 2 | Real work shown | Pass | No exhibit, control, copy or capture touched. The gate counts 10 rail rows at both widths and steps the process wing to P8 at both widths |
| 3 | Process wing | Pass | The eight scenes, their media, their words and every named tool are unchanged. The only edit there is the `.proc-strip::after` gradient back to its round 17 values |
| 4 | Not a template | Pass | No layout change. The bed is a real asset already in the build, not a gradient. No glass, no purple, no centred column, no em dashes |
| 5 | Fast and honest | Pass | One `<img>` and one preload line added, both pointing at `assets/still/03-sigz-waveform.webp`, a file already shipped in the build. Nothing installed, generated or re-encoded. Reduced motion and saveData still fall back to posters, and the still bed is immune to both |
| 6 | Verified by eye | Pass | Eleven screenshots in `shots/`, plus a pixel difference against round 17 showing max channel difference 0. Limits listed under "Could not verify" |

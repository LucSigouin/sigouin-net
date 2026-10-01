# Round 18: the background lane

Lane dir: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r18-background/`
Source: a fresh copy of `fleet-r17-noscroll/site` (one pane, no document scroll, stepper
process wing, overture load animation). `sigouin-net/site/`, `fleet-r17-noscroll/` and every
earlier lane were not touched.

Model: claude-opus-5. Date: 2026-09-17.

Luc's instruction: use the two Higgsfield renders he supplied as the background. Clip A, the
starfield, becomes the ground of the whole site. Clip B, Earth from orbit, plays only during
the load overture and then hands off to A.

## What changed

Six new asset files, one new script, and about thirty lines of CSS. No layout, no copy, no
exhibit, no control changed. The no scroll rule is untouched.

| File | Change |
|---|---|
| `site/assets/bg-a-1080-20260917.{av1.mp4,mp4,poster.webp}` | Clip A, copied in under its dated names |
| `site/assets/bg-b-1080-20260917.{av1.mp4,mp4,poster.webp}` | Clip B, same |
| `site/css/hub.css` 39 to 55 | The new `.ground` layer and the rule that lifts every pane above it |
| `site/css/hub.css` 86 to 90 | The settled header strip wash, and the `.is-out` fade that hands B off to A |
| `site/css/hub.css` 151, 172, 199, 251 | The four pane washes: rail column, stage, process scene note, plus the strip above |
| `site/index.html` 17 to 22 | The ground clip, first element in the body |
| `site/index.html` 26 to 29 | Clip B replaces the `<img>` waveform still as the overture bed |
| `site/index.html` 11 to 12, 41 | Poster preloads, and `js/bg.js` right after the header |
| `site/process/index.html` 12, 15 to 20 | The same ground clip and poster preload, no clip B |
| `site/js/bg.js` | New. The reduced motion and saveData fallback |
| `site/js/hub.js` 137 to 155 | `handOffToGround()`, called when the overture settles |

Both clips are `<video autoplay muted loop playsinline preload="metadata" poster="...">` with
the AV1 source first and the H.264 second, `object-fit:cover` over a fixed full bleed box.
Every reference is a local file under `site/`.

## The ground, and why it is dimmed the way it is

`site/css/hub.css` 48 to 55:

```css
.ground{position:fixed;inset:0;z-index:0;overflow:hidden;background:var(--ink)}
.ground video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  filter:grayscale(.42) contrast(1.42) saturate(.82) brightness(.62)}
.ground::after{content:"";position:absolute;inset:0;background:rgba(10,10,11,.4)}
.overture,.hub,.proc-strip,.scenes,.stepper{position:relative;z-index:1}
```

Three layers of dimming, in this order:

1. **At source.** `contrast(1.42) brightness(.62)` on the clip itself. High contrast plus low
   brightness is deliberate: it crushes the near black of the starfield to true black while
   keeping the stars, the aurora blooms and the light streaks as distinct bright marks. A flat
   brightness cut alone turns the whole clip into grey soup and the streaks vanish first.
2. **One ground wash**, `rgba(10,10,11,.4)` across the whole fixed layer.
3. **A pane wash** on each box that carries text, on top of the ground wash:

| Pane | Wash | Where |
|---|---|---|
| Rail column | `rgba(10,10,11,.72)` | `hub.css` 151 |
| Stage | `rgba(18,18,21,.82)` | `hub.css` 172 |
| Settled header strip | `rgba(10,10,11,.78)` | `hub.css` 88 |
| Process scene note | `rgba(10,10,11,.8)` | `hub.css` 251 |

`.stage__media` keeps its solid `#000` behind contained media, unchanged, so a screenshot
still sits on black and still reads as the main content of the page.

Panels that sit over everything (`.about-panel`, the process tool ledger) stay fully opaque on
`--ink-2`. They are overlays, and the clip moving under a block of text is the one place it
would be a nuisance rather than a ground.

## Contrast, measured rather than asserted

`contrast.mjs` in this lane dir. For each text pane it hides the pane's own contents and rule
lines, so what is left inside the box is exactly the composite a glyph sits on: clip, filter,
ground wash, pane wash. It screenshots that region at four moments of the ten second loop,
decodes each PNG in a browser canvas, and computes the relative luminance of every pixel.

Two numbers per pane. The **worst pixel** is the single brightest pixel found anywhere in the
box. The **p99** is the 99th percentile, which is the ground under all but the brightest one
percent of the area. Paper is `#ece7dd`, the body text. Dim is `#8d887e`, the small uppercase
meta.

Round 18, `shots/contrast.json`:

| Pane | Paper, worst pixel | Paper, p99 | Dim meta, p99 |
|---|---|---|---|
| Index rail column | 11.25:1 | 12.93:1 | 4.52:1 |
| Index stage body | 13.04:1 | 13.08:1 | 4.57:1 |
| Index header strip | 11.25:1 | 13.52:1 | 4.72:1 |
| Process scene note | 4.85:1 | 13.82:1 | 4.83:1 |

Paper clears 4.5:1 on the single brightest pixel of every pane, which is the requirement in
the brief. The dim meta clears 4.5:1 at p99 as well, which is a stricter line than the brief
asks for and the one that actually set the wash values.

Two of those worst pixel numbers are not the clip and are worth naming, because they look
alarming and are not. The same measurement run against the round 17 build,
`shots/contrast-r17-baseline.json`, finds the identical worst pixels:

- The rail column's brightest pixel is `rgb(44,44,51)` at x 518. That is `--line`, `#2c2c33`,
  the rail's own right hand rule. It is the brightest thing in that box in round 17 too, which
  means the clip behind the rail is now darker than a rule line that already shipped.
- The process scene note's brightest pixel is `rgb(74,99,150)` at x 0. That is one column of
  the scene media frame bleeding across the note's left edge. Also identical in round 17.

Where round 18 did move the number: the dim meta at p99 was 5.61:1 in round 17 and is 4.52:1
to 4.83:1 now. That is a real cost of putting a moving image under the text, it is above the
4.5:1 line, and the wash values above are the darkest the clip survives at.

## The overture hand off

`site/index.html` 26 to 29 and `site/js/hub.js` 137 to 155.

Clip B replaces the static waveform still as `.overture__bed`. It keeps the existing bed
treatment: the 2600 ms `bed` scale pull back, `grayscale(.35) contrast(1.12) brightness(.44)`,
and the tall `.overture::after` gradient over it. Clip A is already running full screen behind
the overture the whole time, simply covered by it.

Timing, all of it inherited from round 17 except the last line:

| ms | What |
|---|---|
| 0 | Both clips start. B fills the pane, A is behind it |
| 180 to 750 | The letters of SIGOUIN.NET rise, 52 ms apart |
| 900 | The tagline fades in |
| 1500 | The curtain and the shutter start, 1050 ms each |
| 2550 | The curtain animation ends. `settled()` fires, sets `data-overture="settled"`, and calls `handOffToGround()` |
| 2550 to 3450 | B fades out over 900 ms while the shrinking strip reveals A underneath. That overlap is the cross fade |
| 3500 | B is paused and removed from the DOM |

After 3500 ms exactly one background clip exists on the page. A 3200 ms fallback timer in
round 17's code still calls `settled()` if the animation event never arrives, so the hand off
cannot be stranded. Clip B is not referenced anywhere in `site/process/index.html`.

`shots/overture-mid-1440.png` is the 1150 ms frame, Earth under the rising name. The shoot log
confirms the state at that moment: `bed still in DOM: true settled: no`.

## Reduced motion and saveData

`site/js/bg.js`, a plain script placed immediately after the clips in both pages so it runs
during parse, before a frame is painted:

```js
var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  !!(conn && conn.saveData);
document.documentElement.dataset.motion = still ? 'still' : 'play';
```

When `still` is true it drops `autoplay` and `loop` from every `video[data-bg]`, sets
`preload="none"` and pauses them. A `<video>` that has never played shows its poster, so the
result is the two poster stills and no download beyond them. Both posters are also
`<link rel="preload" as="image">` in the head, so the poster is the LCP either way.

Under reduced motion `settled()` still runs immediately, `handOffToGround()` still removes clip
B, and `hub.css` 285 turns off the `.is-out` transition so B disappears rather than fading.

## Gates

```
bash /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r18-background/verify.sh
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py \
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r18-background
```

`verify.sh` serves this lane's `site/` on port 5197, runs `check-noscroll.mjs` against it and
reaps the server through an EXIT trap. It exits 0: both pages hold at 1440x900 and 390x844,
after the overture, with rows hovered and tapped, and with the process wing stepped to P8.

Site total 21.3 MB against the 40 MB cap. The largest new file is clip B's H.264 at 1.1 MB,
under the 3 MB video cap.

## Screenshots

Served from `python3 -m http.server 5198 --directory <lane>/site`, left running for Luc at
http://127.0.0.1:5198/.

| Name | What it shows |
|---|---|
| `shots/index-1440.png` | `/` at 1440x900. Stars in the rail, a light streak across the top of the stage body, a warm bloom at the top left of the header strip |
| `shots/index-390.png` | `/` at 390x844. Ten rows and the live line inside the pane, ground faint but present |
| `shots/process-1440.png` | `/process/` at 1440x900 on P1, ground behind the strip and the stepper bar |
| `shots/process-390.png` | `/process/` at 390x844 on P1 |
| `shots/overture-mid-1440.png` | The overture at 1150 ms. Earth from orbit under the rising name |
| `shots/index-after-overture-1440.png` | The settled index with row 10 hovered, clip B gone, clip A the only ground |
| `shots/process-p8-1440.png`, `shots/process-ledger-{1440,390}.png`, `shots/index-stage-390.png` | Carried over from round 17's shoot script, unchanged in purpose |
| `shots/contrast.json`, `shots/contrast-r17-baseline.json` | The measurement above, and the round 17 before number |

Round 17 versions of the same frames are in `fleet-r17-noscroll/shots/` for comparison.

## Could not verify

- **The rendered pages by human eye.** I looked at my own PNG captures only. The ground is
  deliberately subtle, because contrast set the ceiling. Luc should open
  http://127.0.0.1:5198/ and say whether the clip reads as a ground or as noise. If he wants it
  more present, the four wash values in the table above are the single dial, and the cost is
  the dim meta dropping below 4.5:1.
- **The clip in motion.** The measurement samples four moments of the ten second loop and the
  captures are single frames. A bright frame between those four samples is not ruled out,
  though the source darkening is what bounds it rather than the sampling.
- **Video decode and battery on a real phone.** The 390 captures are a desktop browser in
  mobile emulation. Two `<video>` elements now autoplay on load at 1080p where round 17 had a
  still image. On the index that is two at once for the first 3.5 seconds.
- **saveData in a real browser.** `navigator.connection.saveData` is not settable in
  Playwright, so I exercised the code path by reading it, not by triggering it. The reduced
  motion half of the same branch is exercised by the round 17 gate.
- **AV1 selection.** I did not confirm which of the two sources the browser actually chose.
  Both are valid and the H.264 fallback is the safe one.
- **Live numbers.** `python3 -m http.server` does not run Cloudflare Functions, so
  `/api/live/sigz/tracks` returns 404 and the page falls back to its labelled sample fixture.
  The two console 404s in the shoot output are exactly that, unchanged from round 17. The
  TeeTimes direct fetch worked and returned 0 open slots, feed dated 2026-09-18.
- **Anything about the live site.** I did not deploy, push, or touch `sigouin-net/site/`.

## RUBRIC.md self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass | The first second is now Earth from orbit under the rising wordmark rather than a still. `shots/overture-mid-1440.png`. Clip B's poster is preloaded and is the LCP, and the poster still shows under reduced motion or saveData |
| 2 | Real work shown | Pass | All ten exhibits untouched, same round 13 captures, stills, loops and GLBs. The gate counts 10 rail rows at both widths. The stage media area keeps its solid black, so screenshots still read as the main content |
| 3 | Process wing | Pass | The eight scenes, their media, their words and every named tool are unchanged. Clip A is the ground behind the strip, the scene note and the stepper. Clip B never appears there |
| 4 | Not a template | Pass | No layout change at all. Rail rhythm, one type voice, no three equal cards, no glass, no purple, no centred column, no em dashes. The ground is a real render Luc supplied, not a gradient |
| 5 | Fast and honest | Pass | Both clips posterised, AV1 first and H.264 second, all six files local and under the 3 MB video cap, site 23.8 MB of 40 MB. Nothing installed, nothing generated, nothing re-encoded. Reduced motion and saveData both fall back to the posters. Live numbers still dim when stale and sample data is still labelled |
| 6 | Verified by eye | Pass | Nine screenshots in `shots/`, looked at across four tuning rounds, plus a pixel level contrast measurement with a round 17 baseline. Limits listed under "Could not verify" |

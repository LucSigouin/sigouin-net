# Round 17: the no scroll lane

Lane dir: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll/`
Source: a fresh copy of `fleet-r16-tweaks/site` (ten exhibits, no rail slivers, contained
stage media, `_headers` and the functions proxy). `site/_headers`, `site/_routes.json` and
`site/functions/` were not touched. `sigouin-net/site/`, `fleet-r16-tweaks/` and
`fleet-r14-build/` were not touched either.

Model: claude-opus-5. Date: 2026-09-17.

Luc's instruction: no scrolling on the website, everything in a pane, apart from the
animation when loading the page.

## The rule, and where it is enforced

`site/css/hub.css` line 22:

```css
html,body{margin:0;padding:0;height:100%;max-height:100%;overflow:hidden}
```

That one line is the whole no scroll rule. The document is never taller than the pane, so
the body scroll lock during the overture is the same lock that holds afterwards: there is
never a moment where scrolling is possible. Everything below is the work of making real
content fit inside that lock instead of being clipped by it.

Both pages are a CSS grid on `body`:

| Page | `body` rows | Contents |
|---|---|---|
| `/` | `auto minmax(0,1fr)` | header strip, then the hub (rail column plus stage) |
| `/process/` | `auto minmax(0,1fr) auto` (`body.proc-page`) | header strip, scene pane, stepper bar |

`minmax(0,1fr)` rather than `1fr` is deliberate: a bare `1fr` track refuses to shrink below
its content, which is exactly how a page grows a scrollbar.

## Index page

### The overture still plays, then becomes the header strip

The load animation is unchanged in character: SIGOUIN.NET rises letter by letter over the
waveform still, the bed pulls back, the curtain closes and the wordmark settles into the
strip. What changed is what it collapses into.

| File | What changed |
|---|---|
| `site/css/hub.css` 47 to 56 | `.overture` is now a three row grid, `auto 1fr auto`: the meta rail, a middle row, then the wordmark. Vertical padding moved to `--padv`, a `clamp(.6rem,1.5svh,1.1rem)` so the strip scales with the pane |
| `site/css/hub.css` 70 to 72 | New `.overture__mid`, the row the tagline lives in. It has its own `shutter` animation on the same 1500 ms delay and 1050 ms duration as the curtain |
| `site/css/hub.css` 96 to 98 | `@keyframes curtain` now ends at `min-height:0` and `@keyframes shutter` takes the middle row from `52svh` to `0`. Together they mean the settled header is exactly its own content: meta rail plus wordmark. No magic `22svh` number that content can outgrow |
| `site/css/hub.css` 95 | `settle` ends the wordmark at `clamp(2.1rem,7vw,4rem)`, slightly smaller than round 16, so the strip is about 96 px at 1440 and 78 px at 390 |
| `site/js/hub.js` 133 to 145 | When the `curtain` animation ends, JS sets `document.documentElement.dataset.overture = 'settled'`. Reduced motion sets it at once, and a 3200 ms timer sets it regardless. This is the flag the gate waits on |

### Ten rows fit, with the rhythm intact

`site/css/hub.css` 118 to 124. The rail is a grid whose ten tracks are fractions of the rail
height, so the arithmetic cannot overflow no matter what the type does:

```css
grid-template-rows:1.34fr 1fr .88fr 1.34fr 1fr .88fr 1.34fr 1fr .88fr 1.34fr;
```

The uneven rhythm is now carried by the track weights instead of by padding. Every third
row takes the largest share and the row after it the smallest, which is the same 3, 1, 1
pattern as before, just expressed as height. On top of that the face still changes: rows
01, 04, 07 and 10 get the larger serif (`nth-child(3n+1)`), rows 04 and 08 are still italic
(`nth-child(4n)`), and the signal coloured keyword still appears on the current row.

Type scales with the pane, not just the width: `.row__title` is
`clamp(1.15rem,2.6svh,2.1rem)` and the large rows `clamp(1.4rem,3.5svh,2.9rem)`, so a short
window shrinks the face rather than pushing a row out of the pane.

Measured at 1440x900 by `shoot.mjs`:

```
rail row heights [90,67,59,90,67,59,90,67,59,90] sum 738 rail box/scroll [739,739]
```

Ten rows, 738 px of row inside a 739 px rail, and the rail's own `scrollHeight` equals its
client height, so the rail does not scroll internally either.

### The footer is now a line of the pane

`site/index.html` 37 to 47 and `site/css/hub.css` 176 to 189. The live line moved out of a
section below the fold and into the bottom of the rail column, inside
`.rail-col{grid-template-rows:minmax(0,1fr) auto}`. It reads last build, SiGz plays, open
tee slots and the link to the process wing, at `.58rem`, on one or two lines. Live values
still dim when stale and sample data is still labelled, unchanged from round 16.

### Secondary copy went into a toggle

`site/index.html` 22 and 49 to 55, `site/css/hub.css` 101 to 113, `site/js/hub.js` 147 to
160. The header strip has an `About this page` button that opens a small panel inside the
pane with the credits copy: the ten and six live line, how the site was made, and who and
where. Escape closes it. The tagline still plays inside the overture on load, so the
opening moment is unchanged; the panel is where it lives afterwards. Nothing was deleted to
make the page fit.

### Phone: two panes, one at a time

`site/css/hub.css` 232 to 244 and `site/js/hub.js`. At 390 the rail column and the stage
occupy the same grid cell. The stage sits at `translateX(100%)` with `visibility:hidden`
until `body.stage-open`, then slides in over the rail. Tapping a row selects the exhibit and
opens the pane, and a `Back to the index` control inside the stage body (and the Escape key)
slides it away again. The old `stage.scrollIntoView` call in `site/js/hub.js` is gone,
because there is nothing to scroll into view any more. The ten rows still fit at 390: the
phone header strip drops the city line and keeps the meta rail to one line.

## Process page

`site/process/index.html` was rewritten as a stepper. The same eight scenes, the same media,
the same words, the same named tools.

- The old `.proc-intro` full screen hero became `.proc-strip`, a header strip with the same
  canvas pullback video behind it, the h1, the ledger toggle and the back link.
- The eight scenes are stacked in one `.scenes` pane, each `position:absolute;inset:0`, only
  the `.is-on` one visible. The swap is a 380 ms opacity cross fade, with `visibility`
  delayed to match so a hidden scene is never clickable
  (`site/css/hub.css` 216 to 219). `prefers-reduced-motion` turns the transition off
  (`site/css/hub.css` 279).
- Media and note keep their alternating sides: `.scene:nth-child(even) .scene__grid` swaps
  the column widths and `order:2` moves the frame, exactly as the old page did.
- Controls, in `site/process/index.html` 236 to 300: `Previous` and `Next` buttons (disabled
  at the ends), a `P3 / 8` counter, and eight dots that jump straight to a scene. Arrow keys
  left, right, up, down and PageUp, PageDown step. One wheel gesture moves one scene: a lock
  is taken on the first event and only released 380 ms after the last one, so an inertial
  trackpad flick is one step, not twelve. A touch swipe of more than 44 px in either axis
  steps one scene.
- The tool ledger that used to end the page is now a panel inside the pane, opened from the
  header strip, closed with its own button or Escape. All thirteen entries are still there
  and every model is still named. Measured unclipped at both widths:
  `ledger 1440 {"box":781,"content":781,"clipped":false}` and
  `ledger 390 {"box":709,"content":709,"clipped":false}`.
- Phone: the scene grid becomes `minmax(0,40%) minmax(0,1fr)`, media stacked over note, both
  inside 844. The stepper bar stays at the bottom.

The footer line that used to sit under the ledger is gone as a separate band. Its two static
facts moved into the ledger panel text (`Worker reports on disk: 131`), and the live tee
slots line it carried is still on the index footer.

## The gate

`check-noscroll.mjs` in this lane dir, imported from the existing Playwright under
`/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules`. Nothing
was installed. It takes a base URL, loads `/` and `/process/` at 1440x900 and 390x844, waits
for `html[data-overture="settled"]` plus 500 ms, and fails if `scrollHeight > innerHeight + 1`
or `scrollWidth > innerWidth + 1`. Then it hovers rows 01 and 10 at 1440, taps them at 390,
and steps the process wing to P8, remeasuring each time.

`verify.sh` starts `python3 -m http.server 5194 --directory <lane>/site` itself, waits for it
to answer, runs the gate, and kills it through an EXIT trap. That is the only background
process, and the same script reaps it.

```
bash /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll/verify.sh
```

exits 0. Full output, and the mutant run where the same gate goes red against the round 16
build on port 5193 with 10 failures and exit 1, are in `GATE-TESTED.txt`.

`python3 fleet-r14-build/check-hub.py <this lane>` exits 0 as well.

## Screenshots

Served from `python3 -m http.server 5196 --directory <lane>/site`, left running for Luc's
preview at http://127.0.0.1:5196/.

| Name | What it shows |
|---|---|
| `shots/index-1440.png` | `/` at 1440x900, exhibit 01 selected. Header strip, ten rows, live line, stage, one pane |
| `shots/index-390.png` | `/` at 390x844. Ten rows and the live line inside 844, rail pane only |
| `shots/process-1440.png` | `/process/` at 1440x900 on P1, stepper bar at the bottom |
| `shots/process-390.png` | `/process/` at 390x844 on P1, media over note |
| `shots/index-after-overture-1440.png` | The settled index with row 10 hovered, so the whole rail rhythm and the stage swap are both visible |
| `shots/process-p8-1440.png` | The stepper at P8, note on the left, media on the right, Next disabled, last dot lit |
| `shots/index-stage-390.png` | The phone stage pane slid in over the rail after tapping row 01, with the back control |
| `shots/process-ledger-1440.png` | The tool ledger panel open at 1440, all thirteen entries |
| `shots/process-ledger-390.png` | The same panel at 390, two columns, nothing clipped |

Before images for comparison are in `fleet-r16-tweaks/shots/`.

## Could not verify

- The rendered pages by human eye. I looked at my own PNG captures. Luc should open
  http://127.0.0.1:5196/ and confirm the settled header strip, the compressed rail rhythm and
  the stepper feel right rather than merely fitting.
- Real trackpad and real touch. The wheel debounce and the swipe threshold were written and
  reasoned about, and the gate drives the buttons, not the gestures. Playwright's synthetic
  wheel and touch events are not a trackpad. Those two input paths are unproven on hardware.
- Viewport heights other than 900 and 844. The layout uses `svh` clamps and fractional rail
  tracks so it should hold, but the gate only measures the two sizes in the brief. A very
  short window, say 500 px tall, is untested.
- Live numbers. `python3 -m http.server` does not run Cloudflare Functions, so
  `/api/live/sigz/tracks` returns 404 and the page falls back to its labelled sample fixture,
  visible in the captures. The two console 404s in the shoot output are exactly that. The
  TeeTimes direct fetch worked and returned 0 open slots with a feed date of 2026-09-18.
- Video decode on a real phone. The 390 captures come from a desktop browser in mobile
  emulation.
- Anything about the live site. I did not deploy, push, or touch `sigouin-net/site/`.

## RUBRIC.md self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass | The overture is untouched in character and is still the first second: the waveform still is preloaded and is the LCP, the wordmark rises letter by letter, the bed pulls back. The only change is that the curtain now closes onto the header strip instead of onto a scroll position. `shots/index-1440.png` is the settled frame |
| 2 | Real work shown | Pass | All ten exhibits present, unchanged, each on the same round 13 captures, stills, loops and GLBs. `check-noscroll.mjs` counts the rail rows and asserts 10 at both widths. Nothing invented, no placeholder |
| 3 | Process wing | Pass | The eight scenes and their media are unchanged. Every tool and model is still named: the per scene chips, plus the thirteen cell ledger now in a toggle panel, measured unclipped at 1440 and 390 |
| 4 | Not a template | Pass | The rail rhythm survives compression as fractional tracks plus the larger face and the italic, visible in `shots/index-after-overture-1440.png`. No three equal cards, no glass, no purple, no centred column, no em dashes. One type voice throughout |
| 5 | Fast and honest | Pass | No new assets, no new dependencies, nothing installed. Videos still posterised and `preload="none"`. Reduced motion branch extended to cover the new overture rows and the scene cross fade. Live numbers still dim when stale and sample data is still labelled |
| 6 | Verified by eye | Pass | Nine screenshots in `shots/`, all looked at, including two rounds after the phone header fix. Limits listed under "Could not verify" |

## Gate

```
bash /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll/verify.sh
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py \
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r17-noscroll
```

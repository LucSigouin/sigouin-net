# sigouin.net round 9, lane "light": WINDOW LIGHT (final)

Status: done. Gate output at the bottom. Nothing deployed, nothing pushed, no new assets, no spend.
Engine files untouched; every edit is in page.dev.html, inlined into index.html by build-inline.py.

## The move, in two sentences

A soft patch of sunlight is born at the window in the hero and follows the reader down the page.
It settles on each chapter's photograph as the chapter arrives, warms that chapter's ground and
lifts its picture a little, then glides on to the next one, going from morning gold to afternoon
amber by the colophon.

Tagged `data-signature="window-light"` on the root element.

## How it is driven

- Three fixed layers (a morning-gold tint, an afternoon-amber tint, a soft glow), each a box the
  size of the patch, moved with one transform. The tints use `mix-blend-mode: multiply`, so paper
  turns cream and ink stays ink. The glow uses `soft-light`, so photo midtones lift instead of
  washing out. No screen blend anywhere, so text never bleaches under the patch. Pure CSS
  gradients: zero new assets.
- The root is `display: contents`. A transformed parent is a stacking context and a blend inside
  one never reaches the page, so each layer is its own fixed element and reads position, tilt,
  stretch and time of day from custom properties on the root.
- Position: every chapter has an anchor (its photograph; the list of lines where there is no
  photograph; the window in the hero at 74% across, 30% down on desktop, 80% and 22% on phones).
  Each frame the script measures the anchors, weights each by a bell curve on its distance from
  the viewport's middle, and puts the light at the weighted middle. As one anchor leaves and the
  next arrives the weights trade and the patch glides across. Only scroll drives it.
- Warmth: the same weight is written to each chapter as `--lit` (0 to 1). The chapter's ground is
  `color-mix(ground, sun tint, lit * 8%)` and its photos get `brightness(1 + 0.06 * lit)` plus a
  warm soft-light wash. The day (`--day`, scroll fraction of the page) crossfades gold to amber and
  tilts and stretches the patch, a longer lower patch as the afternoon goes on.
- Homelab: the asleep machines are now dim and grey (saturate 0.35, brightness 0.9, opacity 0.82)
  instead of half transparent, so the light waking them reads as warmth arriving. The mesh's three
  lines between machines stay; the feed line that came in from the cable is gone.
- Verify state: the root publishes `light x:.. y:.. day:.. on:<chapter>` on
  `data-sc-verify-state` so the harness can see the layer change on flow spans.
- Reduced motion: no travel. The light rests on the chapter nearest the eye and, when the chapter
  changes, fades out and back in at the next anchor (600 ms opacity, no movement). Ground tint
  and photo lift settle by colour fade. Pin spans still shorten as in round 8.

## Removed

The cable, completely: the SVG (`.cable`, `.cable__line`, `.cable__ports`, `.cable__tip`), the
socket after the name, the six `.port` anchors, all cable CSS and the whole cable script
(length lookup, rest-shift measuring, lvh probe kept for the light). The mesh feed path
(`ml--feed`) is gone with it. Gate confirms no `class="cable..."` remains.

## Kept

Hero: three `data-hero-layer` planes, drift, dissolve mask and seam untouched. Pin lengths from
round 8 (1.7 and 2.1, 1.3 and 1.6 under reduced motion). Copy, photos, contact, colophon.
Grammar: flow > scrub > flow > flow > flow > pin > flow > flow.

## Captures (skill harness, headless Edge through the bundled playwright-core, served on 4519)

| Pass | Frames | Result | Sheet |
|---|---|---|---|
| 1440x900 | 49 + sheet | exit 0, no dead scroll, all cues clear 4.5:1 | `lab/shots/sheet.png` |
| 390x844 | 49 + sheet | exit 0, no dead scroll, all cues clear 4.5:1 | `lab/mobile/sheet.png` |
| 1440x900 reduced motion | 49 + sheet | exit 0, no dead scroll, all cues clear 4.5:1 | `lab/reduced/sheet.png` |

Logs: `lab/shoot-desk.log`, `lab/shoot-mobile.log`, `lab/shoot-reduced.log`; per-frame state in
each folder's `report.json` (the `light x:.. y:.. on:..` values show the patch gliding hero > desk >
who > sigz > ltc > home > notes > hello). The FROZEN CLIP note in the desktop and mobile logs is
the round 8 decision (`data-sc-clip-map="travel"`), unchanged and out of scope here.

Fix round (one batch, after looking at the first frames): the patch read as a drawn oval on the
white chapters. Cause: the radial gradient sized itself to the box corner, so the round clip cut
it while it still had alpha. Now `closest-side`, with a longer bell-shaped falloff and lower core
alpha (0.36 gold, 0.42 amber), glow core 0.7, ground tint 12% to 8%. Re-shot all three passes.

Page height 7576 px at 1440x900 (8.4 viewport heights), 7949 at 390x844, 6766 under reduced
motion: identical to round 8. New assets: 0 bytes. index.html 124,622 bytes. Server pid killed
at the end (see below). No em dash in the page or this report. No CLI or model name on the page.

## How to see it

1. Canvas browser node "sig: light" opens the built `index.html` from disk. Scroll slowly from the
   top: the warm patch at the hero window slides down onto the desk photo, then crosses to the
   studio, the living room, the three machines, the notes and the last lines, going amber.
2. From disk the desk clip falls back to its poster (CORS on file://); the light itself needs no
   server.

## Not verified

- A real trackpad; the harness proves position and state per frame, the feel of the glide is
  Luc's call.
- The canvas browser node's own rendering; the driver is Chromium-based Edge.
- Safari: `color-mix` with a calc() percentage and `rgb(r g b / a)` with custom properties were
  checked in Edge only. The `@supports` fallback keeps the plain ground colour where color-mix
  is missing.
- Very short phones (under about 660 px tall).
- Per-frame cost of three blended fixed layers on a low-end phone. Layers are patch-sized, not
  viewport-sized, and only transform and opacity change per frame.

## Files

Build `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-sig-light/`: `page.dev.html`
(edited), `index.html` (rebuilt), `lab/shots`, `lab/mobile`, `lab/reduced`, `lab/shoot-*.log`,
`lab/serve.pid`. Worker: this file, `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r9-signature/check-sig.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-sig-light /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r9-signature/light`

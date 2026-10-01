# sigouin.net scroll lane: REPORT (final)

Status: done. Gate command exits 0 (see the bottom). Built with the scrollcraft skill.

## What it is

One page, light and airy, that reads like a printed feature about Luc: a title page, five
chapters, a colophon. Scroll is the timeline. One cobalt cable leaves the socket after Luc's
name, runs down the left margin as you scroll, plugs into every chapter, and at the homelab
it feeds a drawing that wires three machines together and wakes each one as its line
arrives. It ends in a plug beside his email.

## How to view it

1. The build is served on the canvas already: a CNVS shell node runs the skill's static
   server on port 4517. Open http://localhost:4517 in a canvas browser node.
2. If that node is gone, from any shell:
   `node /Users/ls/.claude/plugins/cache/nateherk/nateherk-design/0.2.0/skills/scrollcraft/scripts/serve.mjs --root /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net --port 4517`
   Serve it; from `file://` the clip cannot load and the page falls back to its poster.
3. The shipped file is `index.html` (114 KB, engine inlined verbatim) plus `assets/`.
   `page.dev.html` is the same page linking the engine files; `python3 build-inline.py`
   regenerates `index.html` from it.

## Interview

Answered by Luc through the orchestrator. Three of the eight answers were not given
(energy curve, the one moment, the "thing no site does") and are marked `inferred` in
BRIEF.md with the reasoning. Nothing about Luc was invented.

## Grammar: chaptered editorial, and why the other seven lost

- Filmic one-shot: full-bleed scrub hero plus kinetic stack is the template trap; the
  references are pages you read, not films.
- Live surface: taken by sigz-console, and this is not a product demo.
- Continuous world: Luc asked for distinct scenes, not one flight.
- Typographic poster: Luc said not poster, and asked for photography.
- Gallery/catalog: its label copy is terse by rule; Luc wants conversational copy.
- Split stage: needs two sides in tension; both sides here are Luc.
- Rhythmic cutlist: pulse and speed; the brief says airy and calm.

Obeyed: no fixed bar, one scrub chapter, no spotlight or magnet, no pinned crossfade type
act, grounds painted per chapter (no drift), no centred hero copy, media in its own column.

## Signature move: the cable

Page-local SVG over `main`. Its path is built from the measured positions of the name's
socket and every chapter's port, drawn with `stroke-dashoffset` through a length-by-y
lookup keyed to scroll position, tip placed with `getPointAtLength`. Sockets fill as the
tip passes; the folio updates from the same state. Inside the homelab stage a second SVG
draws four runs between the three photographs from the act's own `--sc-p`; each machine
sits dimmed until its run completes, then wakes to full colour. The engine is untouched.
Both layers publish `data-sc-verify-state` so the harness sees real rendered state, and
the cable declares `data-sc-verify-hold` only once it is fully plugged in.

## Fingerprint gate against sigz-console: six of six differ

grammar (live surface vs chaptered editorial), nav (app chrome and bottom rail vs a
bottom-left folio with margin sockets), hero (dead deck vs a title page with a socket
after the name), act shape (pin > pin > pan > pin > flow > pin at 11.6 vh vs flow > scrub >
flow > flow > flow > pin > flow > flow at 9.8 vh), close (search field vs colophon plate
with a plug), signature (the handover vs the cable). Row appended to FINGERPRINTS.md with
seven "what is taken" bullets.

## Journey, feeling curve, peak

| # | Section | Feeling | Device | Span |
|---|---|---|---|---|
| 0 | Title page | calm | flow + in (staggered entrance); the cable starts | 1.0vh |
| 1 | The desk | recognition | scrub, clip in a column, pinned | 2.0vh |
| 1b | Who | honest | flow + in | ~0.6vh |
| 2 | SiGz | pride | reveal (left wipe) on the studio still, real sign inset | ~1.1vh |
| 3 | LiveTVCan | competence | parallax, photo and the four routes at two rates | ~1.1vh |
| 4 | The homelab | wonder (peak) | pin: mesh draws, machines wake, four cues | 3.2vh |
| 5 | Notes | calm | flow + in | ~0.7vh |
| 6 | Say hello | resolve | kinetic heading held, the plug | ~0.7vh |

Six device families, none twice in a row, one scrub. Peak sentence: "I had been following
one cable down the page, and when it got to his homelab it split and wired his three
machines up while I scrolled." Silence before it: the LiveTVCan spread is the quietest act.

## Feel check (cold, on the sheets, before rereading the brief)

Felt: calm, recognition, honest, pride, competence, satisfaction, calm, resolve.
Two disagreements. "Honest" for the bio is a section doing its job, kept. The peak read
"satisfaction" where "wonder" was intended: lines drew, machines sat there. Change made to
the page: each machine is dimmed and desaturated until its run reaches it, then wakes.
Re-checked on the new sheet: the wake-ups land at three separate scroll positions and the
peak now has events, not only a drawing. Recorded in BRIEF.md under "Measured".

## Assets

Generated on kie.ai from one preamble (natural-light documentary, warm white, pale oak,
soft grey, one blue accent, no people, no text). All reviewed by eye before use.

| File | What | Notes |
|---|---|---|
| 01-desk (still + 5 s clip) | the desk by the window | the one scrub clip; poster cut from the encoded clip's first frame |
| 02-studio | the music corner | wiped in |
| 03-living-room | living room, TV as a soft colour wash, red cushion | parallax |
| 04-media, 04-gaming, 04-offsite | the three machines | 04-gaming rerolled once, the first came back too dark for the set |
| real-neon-sign | the real 2019 SiGz sign photo from `sigzmusic/brand/source` | copied, source untouched; captioned as real |

Encodes: desktop 814x1080, GOP 8, 1.5 MB; phone 542x720, GOP 4, 0.7 MB; audio stripped.
Stills shipped as WebP, 18 to 72 KB each. Total assets about 2.6 MB.

Spend. Per-call sum at published rates: 7 stills x 28 + 1 clip x 160 = 356 credits.
Probe: 1010 before, 516 after, a delta of 494. The delta is larger than the per-call sum,
so another consumer was almost certainly drawing on the same key during this run (a
parallel lane); treat 494 as a ceiling and 356 as this build's planning figure. I could
not find a published credit-to-dollar rate (the pricing page returns 403 to fetches), so
`spend_usd` is null in result.json rather than a guess.

## Verification (skill harness, headless Edge, served on 4517)

Three passes on the final `index.html`, 49 frames each, contact sheets read by eye:

| Pass | Result |
|---|---|
| 1440x900 | 9.8 viewport-heights. No dead scroll. Clip painted on 49/49 frames, playhead advancing 0 to 5.03 s. Contrast: every cue clears 4.5:1 at its worst frame. 0 console errors, 0 failed requests |
| 390x844 | 10.8 viewport-heights. Same: no dead scroll, clip moving, contrast clean, pinned spreads fit one screen |
| reduced motion | posters hold, no clip fetched, cable and mesh drawn in full, all copy readable, contrast clean |
| keyboard | 12 tab stops: skip link, 7 folio links, 2 project links, email, GitHub. Every stop on screen, opacity 1, focus ring visible |

Fixes found by the harness and made: mesh runs sat under two captions (2.05:1), re-routed
over the top and down the gutters with node boxes sized to their photos; the closing cue
straddled a sample position, moved to open earlier; two project links could take focus
while their block was still hidden, a focusin handler now opens the block.

Also checked: no em dash in index.html or this report; no employer named; no external
script; name and positioning in the first viewport; GitHub and mailto present; SiGz and
LiveTVCan links present; folio and cable state agree at every sample.

Screenshot strips: `lab/shots/sheet.png`, `lab/mobile/sheet.png`, `lab/reduced/sheet.png`
under the build (plus 49 frames and `report.json` in each).

## Not verified

- A real phone. Headless Edge cannot reproduce an iPhone's decoder, autoplay policy or
  Low Power Mode. The engine carries the iOS priming logic; the mobile encode is portrait
  and small. If the hero clip ever sits frozen on a real device, deploy the skill's
  `references/device-diag.html` beside the page and let the phone answer.
- Google Fonts on a real network (the harness loaded them fine; a blocked network falls
  back to Helvetica Neue and Arial).
- Very short phones (under about 660 px tall): a media query shrinks the pinned spreads,
  but I only shot 844 px tall.
- The dollar figure for the spend, see above.

## Files

Build: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/`
`index.html` (deliverable), `page.dev.html`, `build-inline.py`, `BRIEF.md`,
`scrollcraft.css`, `scrollcraft.js` (engine, verbatim), `assets/` (9 files),
`lab/shots`, `lab/mobile`, `lab/reduced` (49 frames + sheet + report each),
`lab/tabcheck.mjs`, `out/` (raw generations and logs), `package.json` (playwright-core
for the harness only). Registry: `/Users/ls/Claude-Workspace/personal/scrollcraft/FINGERPRINTS.md`
(one row and seven bullets appended). Worker: this file and `result.json`.

## Gate

`python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r3-scroll/check-scroll.py /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r3-scroll/worker`
Output recorded in result.json as `verify_exit`.

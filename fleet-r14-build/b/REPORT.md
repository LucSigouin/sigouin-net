# Round 14, lane B: the sigouin.net portfolio hub

Model requested claude-opus-5, effective claude-opus-5. Built 2026-09-17. Gate:
`python3 fleet-r14-build/check-hub.py fleet-r14-build/b` exits 0.

## What I built

An ink ledger. Near black ground, one paper white and one acid lime taken from the real SiGz
now playing colour, a serif display voice against a mono voice for every number and label. No
third colour, no card, no glass, no centred column. Every band is full bleed.

**`/` the index.** The first screen is a two column overture: the name set in a huge serif that
bleeds across the seam onto a full height plate, the letters rising out of a mask, an acid rule
sweeping the width, and two offset rows of real project tiles climbing up the left. The plate is
a plain `<img>` with `fetchpriority="high"`, so the largest paint is a real picture and there is
never a blank first frame.

Below it the hub splits 46 / 54. On the left a numbered list of the ten exhibits, one row
each: number, title, year, one word. The rhythm is deliberately uneven. Three rows are set loud
at over four rem, three are set quiet and dimmed, the rest sit in the middle, and each row leans
a different distance from the edge on a cycle that never repeats in a block of four. Four rows
carry an inline strip of grey tiles that colour up on hover. Hovering a row previews it on the
right, clicking holds it and steps through that exhibit's media. The right side is a sticky full
height stage: the loop, the capture, the model or the live embed, with a small tag naming exactly
which asset you are looking at and which of that exhibit's plates it is.

Under the stage, one fact line in the serif, a credits paragraph that names every tool and model
that touched the project, and the live numbers for that exhibit.

**`/process/`** is eight full bleed stops, P1 to P8, plate and body alternating sides down the
page. Real media only: the CNVS canvas pullback, the fleet diagram, the gate going red then
green, the live board, the nine up contact sheet, the two model build off as a stacked pair, the
overnight lanes as a before and after pair, and the shelf of losers next to the winner. Terminal
and diagram plates use `object-fit: contain` so the real text stays readable. It ends with a
thirteen cell ledger naming every tool.

**Footer** is one live line: last deploy, SiGz plays logged, open tee slots.

## Tools and models named on the page

CNVS, cnvsctl, Claude Fable 5 (orchestrator), Claude Opus 5, Codex, Grok 4.6, Kimi K3, Qwen,
Higgsfield (Seedance), Tripo, kie.ai (Nano Banana and Nano Banana Pro), gpt-image-2, MotionSites,
21st.dev. All thirteen from the brief are present, plus cnvsctl. Each exhibit also carries its own
per project credit line, so the naming is not only on the process wing.

## Live data

`site/functions/api/live/[[path]].ts` and `site/live.js` are copied unchanged from
`fleet-r13-assets/proxy/`. `hub.js` calls `fetchProxy` first. In a plain static preview the
function does not run, so the reader falls back to the direct TeeTimes API (CORS is open there),
and only then to the round 13 fixtures in `site/assets/samples/`. A sample number is labelled
`(sample data, 2026-09-17)` in the accent ember colour, never presented as live. A TeeTimes
payload that does not cover today is labelled with the date it does cover and dimmed through the
`.stale` class instead of showing a today count that is not real. If a derive function throws,
the line reads "Feed unavailable, no number shown" and no number is invented.

## Assets used

- Captures: sigz-music, teetimes, undergrowth play at 8 s, bbc, livetvcan, sigouin at 1440 and
  390, scroll 0 and 50.
- Stills: the four scene plates from `stills/out` (livetvcan hero, gardens homelab, sigz waveform,
  teetimes dusk map).
- Video: all three, both codecs and posters (undergrowth flyover, sigz neon loop, cnvs canvas
  pullback), plus the scrollcraft filmstrip and the gate red green replay.
- 3D: all four GLBs with their webp posters, through `<model-viewer>` pinned to jsdelivr 3.5.0,
  `loading="lazy"`.
- Process media: both boards, the live board, the fleet diagram, the nine up sheet, the five
  looks and all seven sheets, the two r1 lanes, the r2 polish, the live winner.

## Removed on Luc's instruction, 2026-09-17

Two exhibits were cut after the first build and the index renumbered 01 to 10:

- **Kingdom Idle** (was 08). Its plate `kingdom-idle-current-state-2026-09-17.webp` is deleted
  from `site/assets/process/` and from the overture tile strip.
- **Cooking the Lads** (was 12). Its crest and both reference photos
  (`05-ff-crest-cooking-the-lads.webp`, `06-ff-ref-james-cook.webp`,
  `07-ff-ref-ladd-mcconkey.webp`) are deleted from `site/assets/stills/` and from the strip.

The two strip tiles they occupied were replaced with the LiveTVCan hero and the 4U rack poster.
Nothing else referenced either exhibit. Grep for kingdom, cooking-the-lads, ff-crest and ff-ref
across `site/` returns nothing.

Deleting the Kingdom Idle source and archive rows from the Mac is a separate ask and is outside
this lane, which may only write inside its own folder. I listed what is on disk and left it
untouched pending Luc's go ahead.

## Assets I skipped and why

- Every `.png` twin of a `.webp` capture. The webp is smaller and the gate caps images at 1.5 MB.
- The raw `raw-*.mp4` encodes in `video/`. They are 2.6 to 5.4 MB, over the 3 MB video cap, and
  the encoded pair already exists.
- `stills/out/*.png` originals, same reason as above: up to 2.4 MB each.
- The `sigouin-layered-a|b` pngs and `board-*-full.png`. The short board captures read better at
  plate size and the layered looks are already represented by the five looks sheet.
- The three undergrowth play frames other than 8 s, and the scroll 100 captures. One frame per
  exhibit was enough and every extra file costs page weight for nothing.
- `proxy/live.test.mjs`, `package.json`, manifests and reports, per the proxy README: those are
  development assets and must not ship.

## Substitutions I made, stated plainly

- **RsyncGui has no screen capture anywhere on disk.** The plan wanted a 6 s capture of a live
  backup run from the Unraid box and it was never taken. Rather than invent one I used the Tripo
  4U rack model and said on the page, in the credits line, that it is a stand in and no capture
  of a live run exists yet.
- **P7, the overnight lab.** The plan named `sigzmusic/artwork-lab/` covers. No capture of that
  wall exists in round 13, so P7 uses the two real overnight sigouin.net lane captures (r1 lane a
  and the r2 polish) as a before and after pair, and the cost facts in the copy are the real
  logged ones.
- **Exhibit 8, Imagegen**, shows the four generated stills as its own gallery because they are
  literally that pipeline's output. `costs.jsonl` is copied into `site/assets/stills/` as the
  provenance for the 146 images and 30.25 USD figures, which are read from the round 12 inventory,
  not computed live in the page.

## Anti-list

No Inter, no Poppins, no Space Grotesk (Instrument Serif and JetBrains Mono from
fonts.bunny.net, each with a real fallback stack, and the page is fully designed if the webfont
never arrives). No em dash anywhere in the site or in this file. No `backdrop-filter` blur. No
emoji in a heading. No marquee. No purple. No three equal cards and no equal card grid at all.
No centred column: every section is full bleed and the side padding is a `clamp` on the band
itself. Every `<video>` carries a poster and `preload="none"`. A `prefers-reduced-motion` branch
turns off the rise, the sweep, the plate push in, the row lean, the stage cross fade, the model
auto rotate and the video autoplay, and leaves the layout, the colour and the type untouched.

## Verified

- `node shoot.mjs` against `python3 -m http.server 5192` served from `site/`: all four pages
  return 200, `document.scrollWidth - clientWidth` is **0** at both 1440 and 390 on both pages,
  and the two process page contexts log zero console and zero page errors.
- The index page logs three 404s at 1440 and two at 390. Those are the `/api/live/*` proxy routes,
  which cannot run under a static server. The fallback then loads the fixtures, which is exactly
  the documented dev path, and the numbers on screen are marked as sample data.
- I looked at all four deliverable screenshots plus eight scrolled captures in `.runtime/` and
  fixed three real defects they showed: a CSS rule that was stretching the stage caption into a
  full bleed acid rectangle over the media, a run together footer line, and hard cropping that
  made the terminal replay and the fleet diagram unreadable.
- Sizes: `site/` is 17 MB against a 40 MB cap. Largest video 1.10 MB against 3 MB. Largest GLB
  2.27 MB against 5 MB. Largest image 1.37 MB against 1.5 MB.

## Could not verify

- Whether the two proxy routes actually return 200 from a real Cloudflare Pages deploy. I never
  deploy and there is no Functions runtime in a `python3 -m http.server` preview, so the only
  thing proven here is that the client falls back correctly.
- The live SiGz, BBC and TeeTimes numbers as served to a browser on sigouin.net. The screenshots
  show fixture values from 2026-09-17, correctly labelled as sample data.
- `<model-viewer>` rendering the GLBs. The jsdelivr script is blocked in this sandbox, so every
  model cell fell back to its poster in my captures. The GLB files, their sizes and their posters
  are verified; the rotating model on screen is not.
- The Undergrowth iframe. It is only attached when a person clicks to that plate, and the sandbox
  has no route to undergrowth.pages.dev.
- Motion itself. A screenshot cannot prove the letters rise, the rule sweeps or the loops play.
  The rules are in `hub.css` and the reduced motion branch is in the same file, but the moving
  result needs a human eye.
- Webfont delivery from fonts.bunny.net on the real domain. It resolved during my captures.
- How it reads on a real phone, as opposed to a 390 by 844 emulated viewport.

## Rubric self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Wow on load | Pass | `shots/index-1440.png`: full height serif name bleeding over a real plate, two offset tile rows, acid rule. The plate is a preloaded `<img>` with `fetchpriority="high"`, so the LCP is a picture, not a blank frame. |
| 2 | Real work shown | Pass | Ten exhibits, every one bound to a round 13 capture, still, loop or GLB in `site/assets/`. No placeholder box anywhere. The one gap, RsyncGui, is labelled a stand in on the page. |
| 3 | Process wing | Pass | `site/process/index.html`: eight scenes P1 to P8 on real media, and all thirteen tools and models named, both inline in the copy and in the closing ledger. |
| 4 | Not a template | Pass | Uneven index with three loud and three quiet rows and four lean distances, one serif and one mono voice, no card grid, no glass, no purple, no centred column. Gate greps all pass. |
| 5 | Fast and honest | Pass | 17 MB total, every video posterised with `preload="none"` and AV1 before H.264, GLBs lazy with posters, reduced motion branch present, sample numbers labelled and stale numbers dimmed. |
| 6 | Verified by eye | Pass | Four screenshots at 1440 and 390 for both pages in `shots/`, looked at, three defects found and fixed, no horizontal overflow, and this "Could not verify" list. |

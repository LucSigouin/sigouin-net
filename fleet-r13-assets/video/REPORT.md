# Lane VIDEO, round 13 assets (sigouin.net portfolio hub)

Three muted 8 second 720p clips, each anchored to a real image from Luc's own
work. Every clip ships as H.264 mp4, AV1 mp4, and a webp poster taken from
second 1. All three landed on the first try. No clip failed.

## Model substitution (read this first)

The task asked for `seedance_2_5` in `omni_reference` mode. That model refuses
to run on this account:

```
$ higgsfield generate create seedance_2_5 --mode omni_reference --image ... --duration 8 --resolution 720p
Error: "Pro" or "Ultimate" plan required
```

`seedance_2_0` gives the same error. The account is on the starter plan
(`higgsfield account status`). Auth is fine, and I did not touch
`higgsfield auth`. I probed the tier boundary with one cheap 5 second 480p text
only job on `seedance_2_0_mini`, which succeeded, so the gate is the Pro tier of
Seedance, not video generation as such.

All three clips therefore ran on **`seedance_2_0_mini`**, which takes the same
`--image` reference, does 720p, and needs no `mode` flag. `generate_audio` was
set to false on every job.

## Spend

| Item | Credits |
|---|---|
| Balance before | 213 |
| Tier probe (seedance_2_0_mini, 5 s, 480p, no image) | 5 |
| Clip 1, Undergrowth flyover (8 s, 720p) | 20 |
| Clip 2, SiGz neon loop (8 s, 720p) | 20 |
| Clip 3, CNVS canvas pullback (8 s, 720p) | 20 |
| Balance after | 148 |

Total spend 65 credits. The plan gated calls cost nothing. Free calls used
first: `account status`, `model get seedance_2_5`, `model get seedance_2_0`,
`model get seedance_2_0_mini`, `model list`, and `generate cost` at 8, 9 and 10
seconds on all three models. Quoted cost per 8 second 720p clip: 52 credits on
`seedance_2_5`, 36 on `seedance_2_0`, 20 on `seedance_2_0_mini`.

## Clips

### 1. `undergrowth-flyover-20260917.mp4`

Reference: `/Users/ls/Claude-Workspace/personal/undergrowth-v2/test-results/combat.png`
(1440 by 1000, read only), cropped to `ref-undergrowth-board-20260917.png` in this
lane dir with `crop=545:900:180:60`. The crop cuts away the right hand war engine
sidebar and the Ballista info panel so no game UI text could bleed into the video.
The source file was not modified.

Prompt: "Slow aerial drift over a stylised 3D garden board with wooden war
engines. A dirt horde route runs down the board and bends between the towers.
The camera glides gently forward and slightly down, steady, no cuts. Keep the
reference image colours exactly: mossy green board squares, pale grey stone
border, warm brown wood, dark green trees and grey boulders around the edge. No
text, no user interface panels, no people."

### 2. `sigz-neon-loop-20260917.mp4`

Reference: `/Users/ls/Claude-Workspace/personal/sigzmusic/brand/source/neon-sign-1600.jpg`,
read only, never modified, never copied over.

Prompt: "A neon sign glows on a wall in a dark room and flickers gently, the glow
breathing up and down. The camera pushes in very slowly, steady, no cuts. Keep
the reference image colours exactly: near black room, warm neon tube light and
its soft spill on the wall. Ambient loop, nothing else moves, no people, no new
text."

The generated sign keeps the SiGz script lettering from the photo.

### 3. `cnvs-canvas-pullback-20260917.mp4`

Reference: `ref-cnvs-canvas-20260917.png`, a fresh screenshot of the live CNVS
window taken with `cnvs_screenshot` on 2026-09-17 and saved into this lane dir.

Prompt: "The camera pulls back slowly over a dark canvas of glowing rectangular
panels arranged in a loose grid, like agent terminals and a board floating over
still water and mist. Panels light up one by one, their thin outlines brightening
in turn. Abstract and calm, steady move, no cuts. Keep the reference image
colours exactly: deep midnight blue, pale drifting mist, soft moonlight, thin
teal and amber panel outlines, one warm golden glow on the right. No readable
text, no people."

## Encode settings and bytes

Raw downloads were all 1280 by 720, h264, 8.041667 s. They are kept in the lane
dir as `raw-*.mp4` but are not listed in the manifest.

H.264: `ffmpeg -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart`.
CRF 28 put every clip under 3 MB on the first pass, so the raise loop never fired.

AV1: `libsvtav1` is present in `ffmpeg -encoders`, so each clip also has an AV1
mp4 at `-preset 8 -crf 38 -pix_fmt yuv420p -movflags +faststart`.

Poster: `ffmpeg -ss 1 -vframes 1` to png, then `cwebp -q 80`. This ffmpeg build
has no `libwebp` encoder, so `cwebp` from homebrew does the webp step.

| File | Bytes |
|---|---|
| `undergrowth-flyover-20260917.mp4` | 1067645 |
| `undergrowth-flyover-20260917.av1.mp4` | 1149128 |
| `undergrowth-flyover-20260917.poster.webp` | 66544 |
| `sigz-neon-loop-20260917.mp4` | 555997 |
| `sigz-neon-loop-20260917.av1.mp4` | 171857 |
| `sigz-neon-loop-20260917.poster.webp` | 14504 |
| `cnvs-canvas-pullback-20260917.mp4` | 652565 |
| `cnvs-canvas-pullback-20260917.av1.mp4` | 564822 |
| `cnvs-canvas-pullback-20260917.poster.webp` | 43930 |
| raw downloads (not in manifest) | 5646202, 2729469, 3874586 |

Note on the AV1 files: the Undergrowth AV1 is slightly larger than its H.264
twin, so for that clip H.264 is the better `<source>` to list first.

## Could not verify

- **Motion quality.** I looked at the three webp posters, which are single
  frames. I did not watch any clip play. I cannot confirm the drift is smooth,
  that the neon flicker reads as gentle rather than strobing, or that the CNVS
  pullback panels light up one by one as asked. Luc should watch all three.
- **Loopability.** Clip 2 is called an ambient loop but nothing checks that the
  last frame meets the first. Assume a visible seam until someone watches it.
- **AV1 playback.** The AV1 files were encoded without error and probe as valid,
  but I have no browser here, so I have not played them in Safari or Chrome.
- **Text artifacts.** The posters show no stray text, but a frame in the middle
  of a clip could still carry garbled lettering. Unchecked.
- **`seedance_2_5` output.** Never produced, so there is no comparison between
  the requested model and the one that ran.
- **Exact duration wanted.** The brief said 8 to 10 s. I chose 8 s because 10 s
  on the requested model would have cost 195 of 213 credits with no retry
  headroom. The clips are 8.04 s.

## Rubric self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Real, not invented | PASS | Clip 1 references a real Undergrowth test screenshot, clip 2 the only copy of the SiGz neon photo, clip 3 a screenshot of the live CNVS window taken today. Every clip lists its reference path and full prompt above. No stock, no fake UI. |
| 2 | Web-ready | PASS | Three clips, each 8.04 s, muted (`-an`, and `generate_audio false` at the source), 1280 by 720, H.264 plus AV1 mp4 plus a webp poster. Largest video is 1149128 bytes, well under the 3 MB cap. Posters are 14 to 67 KB, under the 1.5 MB image cap. Filenames are dated. |
| 3 | Manifest twin | PASS | `manifest.json` lists all 9 deliverables with absolute path, kind, poster for every video, source reference plus prompt, and bytes. |
| 4 | Honesty | PASS | Spend line has before (213), per clip (20 each), probe (5) and after (148). "## Could not verify" lists six real gaps, including that I never watched a clip. |
| 5 | Scope | PASS | Every write is inside the lane dir. No `.env` opened. Nothing deployed, pushed, or committed. `work/` untouched. Both reference sources were read only, and the Undergrowth crop was written into the lane dir, not over the original. |
| 6 | Plain words | PASS | Short sentences, no em dashes, no filler. |

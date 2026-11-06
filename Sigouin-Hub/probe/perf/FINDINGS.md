**True fps: 60 (the display cap) at 1440x900 Medium on the M5, with a real GPU cost of about 7 ms per frame. It swings when another GPU job runs at the same time: a second headless hub drops it to 35 to 52 because frames miss their 16.7 ms slot and wait for the next one.**

Study run 2026-09-23, 27 fresh browser runs (9 conditions x 3), round robin so no condition got a lucky or unlucky minute. Raw data: `probe/shots/perf-study/<condition>.json`, rolled up in `summary.json`, console log in `study.log`. Re-run with `node probe/perf/study.mjs` (takes the GPU lock per run).

Terms:
- **rAF fps**: frames the browser paints per second.
- **Steady fps**: median of the last 10 of 25 one-second samples.
- **Batch ms**: GPU time per frame, no pacing. 120 app frames run back to back in one go, one forced sync at the end, divided by 120.
- **Sync ms**: same, but a sync after every frame. Adds about 4 to 5 ms of readback wait, so it is an upper bound.
- **Timer ms**: GPU time from the WebGL timer query extension (Chromium only).
- **GPU busy %**: whole-Mac GPU use, from `ioreg`.

## Every condition (3 runs each, median with [min to max])

| Condition | Canvas px | Steady fps | 1st second fps (each run) | Batch ms | Sync ms | Timer ms | GPU busy % before run (each run) |
|---|---|---|---|---|---|---|---|
| shell 1440x900 medium (baseline) | 1440x900 | 60 [60-60] | 59, 59, 59 | 6.93 [6.83-8.39] | 11.7 [11.1-12.1] | 11.36 [10.44-12.58] | 86, 86, 88 |
| shell 1280x720 medium | 1280x720 | 60 [60-60] | 60, 59, 60 | 5.8 [5.58-8.85] | 12.7 [10.5-14.1] | 10.58 [9.54-13.29] | 82, 86, 85 |
| shell 1280x720 medium, scale 2 | 1792x1007 | 60 [60-60] | 59, 59, 59 | 8.8 [8.7-8.97] | 16.4 [14.4-16.6] | 14.6 [14.01-15.71] | 83, 84, 85 |
| shell 1440x900 low | 1440x900 | 60 [60-60] | 60, 60, 60 | 4.33 [4.17-4.34] | 8.8 [5.3-10] | 3.85 [3.24-5.46] | 84, 85, 84 |
| shell 1440x900 high | 1440x900 | 60 [60-60] | 59, 59, 60 | 11.57 [11.26-12.21] | 16.6 [15.9-16.6] | 17.6 [16.05-19.99] | 80, 82, 81 |
| shell 1440x900 medium, vsync off | 1440x900 | 84 [80-99] | 85, 97, 118 | 8.11 [5.56-8.4] | 14.7 [10.2-16.5] | 13.13 [7.57-14.27] | 85, 79, 83 |
| full Chromium (new headless) 1440x900 medium | 1440x900 | 60 [60-60] | 59, 59, 59 | 6.82 [4.42-10.06] | 12.7 [8.1-16.1] | 10.65 [9.77-14.98] | 10, 86, 84 |
| WebKit 1440x900 medium | 1440x900 | 60 [60-60] | 59, 59, 59 | 7.1 [6.56-9.18] | 15 [13-17] | n/a (no extension) | 27, 82, 83 |
| shell 1440x900 medium + 2nd hub at same time | 1440x900 | **38 [35-52]** | 54, 56, 33 | **19.58 [15.27-19.62]** | 26.4 [18.6-27.5] | 29.44 [24.91-31.76] | 84, 81, 82 |

"shell" = Playwright's default chromium headless-shell 153.0.8010.12. Full Chromium is the same 153.0.8010.12. WebKit is 26.6. All Chromium runs report `ANGLE Metal Renderer: Apple M5`; WebKit reports `Apple GPU`. An empty page in every browser ran at 60 (55 with vsync off).

## Hypotheses

**1. Warm-up (shader compile, texture upload). Rejected.**
- First second after `state() === 'play'` was 59 to 60 in all 21 runs with vsync on and no second hub. Every one of those 21 runs stayed between 59 and 61 for all 25 seconds.
- Why: the app already runs `compileAsync` plus a warm-up frame before it reports ready.
- The only early dip is contention run 2 (56 then 42, 36): that is the second hub finishing its own load, not warm-up.

**2. Headless frame pacing. Rejected as the cause of the swing, but it hides the true speed.**
- Headless rAF tracks a 60 Hz beat properly: empty pages hit 60, and frame gaps were 16.7 to 16.8 ms at the 95th percentile (18 in WebKit).
- Medium's real cost is 6.9 ms (batch), 11.4 ms (timer), well under the 16.7 ms slot. So 60 is a cap, not a limit.
- Proof of headroom: with `--disable-gpu-vsync --disable-frame-rate-limit` the same scene ran 80, 99, 84 fps.
- Caveat: those two flags also bend pacing (empty page drops to 55), so use them for headroom checks, not as the headline number.

**3. GPU sharing. Confirmed. This is the swing.**
- One extra hub rendering at the same time gave 52, 38, 35 fps. That lands right on the 31 to 47 range from the earlier runs.
- Batch cost nearly tripled, 6.93 to 19.58 ms, and whole-Mac GPU use hit 99% in all three runs.
- Frame gaps became 33.3 ms at the 95th percentile: each frame that misses its 16.7 ms slot waits for the next one. That is why readings cluster near 30 and in the 40s, not a smooth slope.
- The Mac is never idle: GPU was 80 to 88% busy before nearly every run, with no browser of ours open. The CNVS canvas has no browser nodes (checked with `cnvs_state`), so that load is the CNVS app and WindowServer drawing the desktop. It moves: two runs caught it at 10% and 27%. Medium's 7 to 12 ms leaves only a few ms of slack on top of that, so any extra GPU job tips it over.
- Not proven: what exactly ran during the earlier 31 and 47 runs. They had no GPU lock, and the lead runs GPU work too, so overlap is the likely story. Only the reproduction above is proven.

**4. Browser build. No effect.**
- headless-shell, full Chromium new headless, and WebKit all gave 60 [60-60], with batch cost 6.82 to 7.1 ms.
- Vsync-off flags only raise the cap (see 2).

**5. Resolution and pixel ratio. Changes cost, not fps.**
- 1280x720 at scale 2 gives a 1792x1007 canvas (Medium caps pixel ratio at 1.4). That is 1.96x the pixels of 1280x720 at scale 1.
- Batch cost went 5.8 to 8.8 ms, still 60 fps. So the CNVS on-screen view (Retina, 57 to 60) and headless agree once nothing else fights for the GPU.

## Mutant test of measureGpu (does it catch a heavier scene?)

Each should cost more than the one before. It does, in every method:

| Heavier scene | Batch ms | Timer ms |
|---|---|---|
| low, then medium, then high (1440x900) | 4.33, then 6.93, then 11.57 | 3.85, then 11.36, then 17.6 |
| 1280x720 at scale 1, then scale 2 | 5.8, then 8.8 | 10.58, then 14.6 |
| medium alone, then with a 2nd hub competing | 6.93, then 19.58 | 11.36, then 29.44 |

Across runs of one condition, low and high never overlapped (low max 4.34, high min 11.26). Batch is the steadiest number; sync ms carries a fixed readback wait; timer ms runs higher than batch because it measures wall time on a shared GPU.

## What could not be tested

- A real on-screen browser. The rules forbid headed browsers and new CNVS browser nodes. The Retina case is only simulated, with `deviceScaleFactor: 2`.
- The GPU load from CNVS and WindowServer could not be switched off. Every number here was measured with it running, which is also Luc's normal setup.
- The timer query is not available in WebKit.

## Recommended standard for the tour

1. Take `probe/.gpu-lock` for the whole browser session. That alone removes the 31 to 47 readings.
2. After `play` and `pauseDay(0.35)`, call `measureFps(page, { seconds: 10, warmup: 2 })`. Report `median` and `frameMs.p95`. Expect 60 and 16.7. A p95 near 33 means the GPU is contended.
3. Call `measureGpu(page, { frames: 120 })`. Report `batchMsPerFrame` as the real cost and `fpsCeiling` as the uncapped speed. Budget: Medium must stay under about 10 ms, leaving room on a GPU that is already about 85% busy.
4. Log whole-Mac GPU busy % before the run (the `ioreg` line in `study.mjs`). Mark the run invalid if fps is under 55 and batch ms is more than double its usual value.
5. Never quote a single fps from one run. Use at least 3 fresh browsers and give the median plus spread.

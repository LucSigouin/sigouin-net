# PROCESS-MEDIA, round 13

Prepared 2026-09-17. Requested and effective model: gpt-6-astra, from the spawn flag. The draft was saved at 13:33 UTC, within ten minutes of the 13:31 UTC start.

The manifest contains 49 files: 30 images, 2 videos, 9 data files, and 8 code files. Every media item comes from a real file or one of the two requested public pages. The six-frame Kingdom Idle strip is unavailable from the specified archive. The user approved using the one surviving clean gameplay image and documenting the missing strip. The pack is complete under that approved scope and passes the mechanical gate.

## Made

| Deliverable | Result |
|---|---|
| Nine-up landing comparison | Eight archived demos plus the live sigzmusic.com winner. Each PNG is 1440 by 900. The unlabeled WebP grid is 4320 by 2700. Reading order: claude, codex, grok, kimi-a, kimi-b, kimi-c, kimi-d, kimi-e, live winner. |
| sigouin.net looks | Seven individual PNGs cover round 1 A, B, C, round 2 polish, layered A, layered B, and the live page. The primary five-look strip selects round 1 winner C, polish, layered A, layered B, and live. A second strip includes all seven. |
| Scrollcraft filmstrip | All 49 numbered frames, 00 through 48, from the requested lab/shots folder. H.264, 1280 by 800, 30 fps, 7.00 seconds, 1,285,355 bytes, no audio. WebP poster comes from frame 00. |
| Boards and flow | The live workbench, Claude workbench, Kimi workbench, and how-the-fleet-works page each have a 1440 by 900 viewport capture and a full-page PNG. All full-page outputs are 1440 pixels wide. |
| Kingdom Idle | current-state.png converted to a 1206 by 2622 WebP. No crop and no content changes. The user approved this single surviving image and omission of the six-frame strip. |
| Cost timeline | 154 records from 12 costs.jsonl files. Sorted UTC timestamps, provider, model, separate USD and credits, project from the source path, and totals per provider and model. Known USD subtotal: 30.58767. Two Grok entries have unknown prices and models. |
| Gate replay | gate-red-green.tape, the real terminal transcript, three captured exit codes, a 7.47-second H.264 MP4, and a WebP poster. Empty lane exits 1, the copied em dash mutant exits 1, and the unchanged round 12 tooling lane exits 0. |

Exact requested landing filenames are kept in the dated 2026-09-17 folder. Other media filenames are dated. The required tape and JSON filenames are unchanged. Every manifest row has a source, byte count, kind, and SHA-256. Videos point to their posters.

The looks strip follows the archive README's four closed looks plus the current page. Round 1 A and B were rendered from their unchanged archived HTML because no comparable complete 1440 capture survives for those lanes. Round 1 C and both layered looks come from saved captures. The round 2 image was extracted from the saved harness strip. Its outer harness label and gray margin were removed. The original harness capture already ends before the bottom of its viewport. Individual aspect ratios are preserved in the composites.

The Claude full-page source has 1655 pixels of scroll width at a 1440 viewport. The full image keeps that entire scroll area and scales it proportionally to 1440 by 26024. Its four-color PNG meets the size limit; the viewport PNG keeps full color. The live and Kimi full-page PNGs are 1440 by 12399 and 1440 by 20294. Their palettes are also reduced. No page content or lane state was rewritten.

## Gate rendering

VHS 0.12.0 ran the terminal sequence but did not start its encoder. Its recording context is canceled before the encoder subprocess is created. The helper retains VHS text and cursor frames and encodes those real frames with FFmpeg after VHS exits. The finished replay uses 224 frames and is 113,078 bytes. This is documented in the [VHS evaluator source](https://github.com/charmbracelet/vhs/blob/v0.12.0/evaluator.go) and evidence/gate-render-2026-09-17.json.

Reproduce it from this lane with `python3 scripts/render-gate-2026-09-17.py`. The tape also remains valid VHS syntax. It uses no shared round 13 fixture. The temporary empty and mutant lanes are made inside this lane and removed after execution. The original round 12 tooling lane is only read.

## Skipped and why

The six-image Kingdom Idle strip is omitted with user approval: "Use the surviving image and document the missing strip." The 45 image files consist of 37 PNGs and 8 SVGs. Only current-state.png is a clean gameplay capture. The rest are 8 art studies, 25 building PNGs, 8 building SVGs, one annotated test view, and two unrelated CNVS report captures.

The [archive README](/Users/ls/Claude-Workspace/personal/archive/README.md:26) records that screenshots/, UITests/, and uitest-attachments* were deleted on 2026-08-19. The old shot list remains in [TEST_NOTES.md](/Users/ls/Claude-Workspace/personal/archive/kimi-projects/TEST_NOTES.md:216), but screenshots/final does not exist. The availability audit is included as data. No sprite, art study, duplicated crop, or test view was substituted for a missing gameplay screenshot.

Spend: USD 0; credits 0. Before and after provider balances: not queried. No paid services or generation tools were called. Historical totals in costs-timeline.json are source data, not spend by this lane.

## Could not verify

- Six distinct clean Kingdom Idle gameplay screenshots are unavailable at the required source. The user approved the surviving image and documented omission of the strip. This source limitation no longer blocks completion.
- The cost snapshot is not a complete bill for building the portfolio. It covers the costs.jsonl files found at 2026-09-17T13:50:57.517678Z. Two Grok records have no numeric price. No price was invented, and USD was not added to provider credits. New logs created later are outside this dated snapshot.
- The two live page captures are point-in-time images. Their Cloudflare analytics script failed to load. Visible assets loaded, and the capture logs show no page JavaScript errors. Later changes to either site are not covered.
- Direct MP4 encoding by the installed VHS 0.12.0 remains broken. The provided helper and finished MP4 are verified. A different VHS version was not tested.

## Verification

The detailed asset check passed: image decoding, dimensions, exact byte counts and hashes, both complete video decodes, H.264 codec, no audio streams, duration caps, source frame order, gate exits, and cost reconciliation. Both public landing pages returned HTTP 200. All local page captures loaded without page errors.

The required round 13 gate passed with exit 0. Its command and output are recorded in result.json and evidence/check-assets-2026-09-17.txt. Browser profiles, captured VHS frames, and temporary fixtures were confined to .runtime in this lane. No HTTP server was needed. Headless browser contexts were closed, and the PID check found no remaining browser process for this lane.

## Rubric self-check

| # | Criterion | Status and evidence |
|---|---|---|
| 1 | Real, not invented | PASS for included assets. Actual app files, saved screenshots, two live pages, 49 lab frames, and real gate executions. The missing Kingdom strip is disclosed. |
| 2 | Web-ready | PASS. Every image is PNG or WebP below 1.5 MiB. Both videos are H.264, silent, 6 to 8 seconds, below 3 MB, and have WebP posters. Media dates are in names or the requested dated folder. |
| 3 | Manifest twin | PASS. 49 deliverables with absolute paths, kind, poster where needed, source, bytes, and SHA-256. |
| 4 | Honesty | PASS. Spend is zero. Source gaps, price gaps, palette reduction, and the VHS workaround are stated. |
| 5 | Scope | PASS. Asset writes and runtime data stay in process-media. No .env or secrets opened. No work/ access, push, deploy, publish, system browser, or generation. |
| 6 | Plain words | PASS. No em dashes in the report or authored text assets. |

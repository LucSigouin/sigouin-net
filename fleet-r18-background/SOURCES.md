# Round 18 background assets (prepared 2026-09-17 by the orchestrator)

Luc supplied two Higgsfield renders on 2026-09-17 and asked to use one or both as the background.
Originals kept in personal/scratch/hub-bg-candidates/ (bg-a.mp4 1080p 2.8 MB, bg-b.mp4 4K 13 MB).

| File | What | Use |
|---|---|---|
| bg-a-1080-20260917.mp4 / .av1.mp4 / .poster.webp | starfield, aurora blooms, HUD lines, falling light streaks. 10 s, 1080p, muted. 707 KB h264, 190 KB av1 | site-wide ground behind the pane (replaces the static waveform ground) |
| bg-b-1080-20260917.mp4 / .av1.mp4 / .poster.webp | Earth from orbit, slow drift, city lights. 10 s, 1080p, muted. 1.1 MB h264, 412 KB av1 | overture only, under the rising name, then fades to A |

Encode: ffmpeg scale=1920:-2 lanczos, libx264 crf 27 slow, libsvtav1 crf 38 preset 6, faststart, no audio.
Source: Higgsfield CDN https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/ (hf_20260423_084718_… = A, hf_20260613_180732_… = B).
Integration lane runs after round 17 (no-scroll) lands, on a copy of that build.

# Round 13 rubric: assets for the sigouin.net portfolio hub

Self-check standard for every worker. Fill the table at the end of your REPORT.md.
Gate: python3 check-assets.py <lane dir> must exit 0.

| # | Criterion | What passes |
|---|---|---|
| 1 | Real, not invented | Every capture is of the real running app or real file on disk. Every generated asset lists its reference input and prompt. No stock, no fake UI. |
| 2 | Web-ready | Video under 3 MB, muted, 6 to 10 s, AV1 or H.264 mp4 plus a webp poster. GLB under 5 MB, 10k to 50k faces, poster png. Images webp or png under 1.5 MB. Hashed or dated filenames. |
| 3 | Manifest twin | `manifest.json` in the lane dir lists every deliverable with path, kind (image, video, glb, html, data, code), poster (for video and glb), and the source or prompt. |
| 4 | Honesty | REPORT.md has "## Could not verify" and a spend line (credits or USD, before and after). Never empty. |
| 5 | Scope | Writes only in your lane dir. Never .env, never deploy, never push, never touch work/. |
| 6 | Plain words | Short sentences, no em dashes, no filler. |

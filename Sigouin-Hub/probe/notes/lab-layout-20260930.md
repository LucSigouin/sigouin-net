# Computer Lab desk layout (2026-09-30)

Luc: "push the desks a bit further up so when we walk in we see all 4 on each side".
8 desks (2 rows x 4). Entrance spawn is z=2.4 facing -z, so the old front row (z=2.2) sat beside the
camera and the outer desks (x=±5.6) were off-frame.

- Try 1: rows [-0.6, -3.3], cols ±2.6/±5.2 → outer front monitors still clipped.
- Try 2 (shipped): rows [-1.0, -3.6], cols ±2.1/±4.5 → all 8 monitors in frame, 4 per side, centre aisle to projector clear.

Probe: `node probe/lab-layout.mjs <baseUrl> <name>` → `probe/shots/lab-layout/<name>.png`.

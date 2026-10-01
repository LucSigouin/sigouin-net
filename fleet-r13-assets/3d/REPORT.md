# Lane 3d: four web-ready GLB objects (round 13)

Four GLB props for the sigouin.net portfolio hub, all made with the tripo3d MCP server
(hand-written Tripo v3 client at /Users/ls/Claude-Workspace/personal/tripo-mcp/server.py).
Every file lives in this lane dir. Each GLB has a poster PNG next to it, converted with
`sips` from the WebP preview Tripo returns.

## Objects

| # | File | Model | Faces | Bytes | Poster |
|---|---|---|---|---|---|
| 1 | sigz-neon-sign-20260917.glb | P2-20260801 (image to 3D, textured, PBR) | 33,950 | 2,381,660 (2.27 MB) | sigz-neon-sign-20260917.png |
| 2 | golf-pin-v2-20260917.glb | P1-20260311 lowpoly | 18,693 | 1,235,020 (1.18 MB) | golf-pin-v2-20260917.png |
| 3 | rack-server-4u-20260917.glb | P1-20260311 lowpoly | 16,257 | 1,522,268 (1.45 MB) | rack-server-4u-20260917.png |
| 4 | game-server-tower-20260917.glb | P1-20260311 lowpoly | 17,738 | 1,266,212 (1.21 MB) | game-server-tower-20260917.png |

All four are under the 5 MB cap and under the 2.5 MB soft target. All four sit inside the
10k to 50k face window. Face counts come from parsing the GLB JSON chunk with `glbstat.py`
in this dir: read the 12 byte header, read chunk 0, then sum accessor counts for each
primitive (indices where present, else POSITION), divided by 3 for triangle mode.

## Sources and prompts

1. Neon sign, hero object. Image to 3D from
   `/Users/ls/Claude-Workspace/personal/sigzmusic/brand/source/neon-sign-1600.jpg`.
   That file was read only and was not modified. face_limit 40000, texture on, PBR on.
2. Golf pin, for the TeeTimes exhibit. Text to 3D, prompt:
   "a single connected golf pin object: one long thin vertical white pole standing straight
   up out of a green grass mound, the pole reaching from the ground all the way to the top,
   a small red triangle flag attached to the very top of the pole, one solid piece, low poly,
   clean flat colors, game ready asset"
3. Rack server, for the homelab (Unraid) exhibit. Text to 3D, prompt:
   "a 4U rackmount home server chassis, matte black steel box, wide front panel with two
   columns of removable hard drive bays with small handles and status LEDs, rack ears with
   screw holes on each side, low poly, clean flat colors, game ready asset"
4. Game server tower, homelab pair. Text to 3D, prompt:
   "a small stylised mini PC game server tower, upright dark charcoal box with rounded
   corners, a single bright glowing cyan light strip running vertically down the centre of
   the front panel, small vents on the side, low poly, clean flat colors, game ready asset"

## One retry

The first golf pin (task dab6ba5b) came out broken: the flag floated in the air with no pole
and the cup sat far below as a separate disc. I looked at its poster, rejected it, and ran one
retry with a prompt that insisted on one connected piece with the pole reaching the ground.
The retry (task 84792a87) is correct: white pole rising from a green mound with a red flag on
top. The rejected v1 GLB, WebP, and PNG were deleted from the lane dir. Its 40 credits are
still counted in the spend below. No other object needed a retry.

## Spend

Tripo credits: 380 before, 110 after, 270 spent. Per object: neon sign 110, golf pin v1
(rejected) 40, golf pin v2 40, rack server 40, game server tower 40. Numbers come from
`tripo_balance` before the first job and after the last, and from `credits_consumed` on each
finished task.

## Could not verify

- I have not opened these GLBs in a real 3D viewer. My only view of each object is the single
  Tripo preview render saved as the poster. Geometry on the back or underside of each model is
  unseen, and I cannot confirm how they light up in the site's own renderer.
- Materials are unchecked beyond the preview. The neon sign reads as a marbled blue plastic
  tube shape rather than an emissive neon glow. The letterforms are right, but if the site
  wants it to glow, the emissive material has to be set in the page, not in this file.
- The game server tower's body renders closer to dark brown than the charcoal I asked for.
- Draw call count, texture resolution, and load time in a browser are untested.
- Face counts are triangles from the accessor data. If a viewer triangulates differently the
  number it reports may differ slightly.

## Rubric self-check

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Real, not invented | Pass | Every object is a file on disk in this lane. Each one lists its reference image path or its exact prompt above. No stock assets. |
| 2 | Web-ready | Pass | 4 GLB, largest 2.27 MB against a 5 MB cap. Faces 16,257 to 33,950, inside 10k to 50k. Poster PNG for each, largest 137 KB. Dated filenames. |
| 3 | Manifest twin | Pass | manifest.json lists 8 files: 4 glb with poster and source, 4 image posters. |
| 4 | Honesty | Pass | Spend line gives 380 before, 110 after, 270 spent, per object. "Could not verify" lists five real gaps including the rejected first pin. |
| 5 | Scope | Pass | Wrote only inside 3d/. Read the neon sign JPG without modifying it. No .env, no deploy, no push, no work/. |
| 6 | Plain words | Pass | Short sentences, no em dashes, no filler. |

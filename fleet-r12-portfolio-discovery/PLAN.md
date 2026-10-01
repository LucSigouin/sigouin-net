# sigouin.net portfolio hub: the plan

Round 12 synthesis, 2026-09-17. Five discovery lanes, all five gates green. Sources:
`inventory/INVENTORY.md`, `tooling/TOOLING.md`, `awwwards/RESEARCH-awwwards.md`,
`process-showcase/RESEARCH-process.md`, `ai-assets/RESEARCH-ai-assets.md` in this folder.

Decisions already made by Luc (2026-09-17): name every tool and model on the page; live data
from SiGz, TeeTimes, Undergrowth, BBC only; spend credits freely; the hub replaces sigouin.net
and the current cream site goes to `archive/` with a README row first.

---

## 1. What we have to show (the facts)

| Number | Value |
|---|---|
| Projects with a card | 37 (15 top-level dirs + 24 archive rows) |
| Live public sites | 6: sigzmusic.com, teetime.sigouin.net, undergrowth.pages.dev, sigouin.net, livetvcan.com, bbc.sigouin.net |
| Public JSON feeds, no key | SiGz `/api/tracks` + `/api/albums` (real play counts, waveform peaks), TeeTimes `/api/teetimes` + `/api/courses` (38 courses, photos), BBC `/api/state` |
| Fleet rounds on disk | 33 in personal, 9 in Fleet-Machine |
| Worker reports | 131 REPORT.md, 66 result.json |
| Boards (workbench.html) | 27 across personal, Fleet-Machine, cnvs |
| Competition lanes | 36 lane dirs, largest contest 9 lanes (sigzmusic landing, 4 model families) |
| Skills / MCP / CLIs / hooks | 52 / 4 / 8 / 4 live + 12 parked |
| Images with a logged cost | 146 images, 30.25 USD, gpt-image-2 + grok |
| Visual files on disk | 7,764 (4,762 outside archive), 31 mp4, 0 gif, 0 GLB |
| Credits available | Higgsfield 270, Tripo 380, kie.ai (balance not probed), OpenAI pay-as-you-go |

Gaps the build round must fill: zero 3D files exist, zero gifs, RsyncGui has no screenshot at
all, OpenArr has no picture left, CORS is missing on SiGz and BBC (TeeTimes has it).

## 2. The twelve exhibits

Each is one full-bleed scene. No paragraph anywhere. One fact line max.

| # | Exhibit | Medium | Live piece | Asset to make | Tool |
|---|---|---|---|---|---|
| 1 | SiGz music | real waveform strip from `peaks.json`, play counts ticking, record colour floods on hover | `/api/tracks` via proxy | neon sign GLB from the 2019 photo, ambient 6 s loop | Tripo, Seedance |
| 2 | TeeTimes | live map, slots landing per course, course photo as pin | `/api/teetimes` direct (CORS ok) | golf pin GLB, dusk still | Tripo, kie Nano Banana |
| 3 | Undergrowth | the game itself, playable, route bending | iframe of pages.dev with poster first | 10 s garden flyover | Seedance 2.5 720p |
| 4 | BBC scoreboard | live match state tile, event date | `/api/state` via proxy | one still | capture |
| 5 | LiveTVCan | one deploy wearing four faces: marketing, admin, portal, API | none (customer data) | before/after admin pair, marketing hero | capture, gpt-image-2 |
| 6 | RsyncGui | one backup run streaming its log over SSE | none | 6 s screen capture of a run | capture on the Unraid box (Luc) |
| 7 | Homelab: the Gardens | topology diagram that moves, rollback pairs | none (private) | two low-poly boxes + AMP tower GLBs, one cinematic still | Tripo, Nano Banana Pro |
| 8 | Kingdom Idle | "built by kimi, not by me" screenshot strip | none | crop the 45 archived images | ffmpeg |
| 9 | Imagegen | the live gallery filling, running cost counter | replay of a real `costs.jsonl` | none, it exists | none |
| 10 | Scrollcraft | the lab capture strip as a scrubbing filmstrip, FINGERPRINTS table as caption | none | none, 172 frames exist | ffmpeg |
| 11 | Evolution of sigouin.net | five candidate looks + three signature moves, blind scores, ends on the live page | none | contact sheet from archive strips | ffmpeg |
| 12 | Fantasy football crest | two reference photos morph into the crest | none | none, 3 images exist | none |

## 3. The process wing: "how I work"

Eight scenes, each a real artifact, filmed or replayed, not drawn from scratch.

| # | Scene | Source on disk | Medium |
|---|---|---|---|
| P1 | The canvas: six agent nodes working, one needs-you | live CNVS, `cnvs_screenshot` or Screen Studio | screen recording, zoomed out |
| P2 | The split: one prompt becomes five lane folders | `Fleet-Machine/how-the-fleet-works.html` + this round's dirs | animated six-stop diagram (Rive or CSS) |
| P3 | The gate goes red, then green | `check-lane.py` + `GATE-TESTED.txt` | terminal replay, real output, red then green |
| P4 | The workbench board: header colour is the fleet state | `sigouin-net/workbench/workbench.html` | live iframe of the board, pills reused |
| P5 | Nine lanes, one brief, one winner lit | `archive/sigzmusic-landing/*/demo.html` (8 render) | nine-up contact sheet, losers dim to 30 % |
| P6 | Same brief, two models, one loses (9.25 vs 8.42) | `Fleet-Machine/fleet-r2-workbench/{claude,kimi}` | wipe slider |
| P7 | Overnight art lab | `sigzmusic/artwork-lab/` covers + board | covers wall with timestamps landing |
| P8 | Losers archived, winner ships | `archive/sigouin-net-fleet-2026-09-02/` | shelf: four looks, three slide into a crate |

Tools named on this wing, by Luc's decision: CNVS, Claude Fable 5 (orchestrator), Claude Opus 5,
Codex, Grok 4.6, Kimi K3, Qwen, Higgsfield, Tripo, kie.ai, gpt-image-2, MotionSites, 21st.dev.
Plus the two hooks that make workers visible and keep pages on the canvas.

## 4. Site structure: the recommendation

Research offered three shapes. Recommendation: **C with A's process wing.**

- **Index and wing (C)** ages well. Work projects arrive later and just add rows.
- Opening: name, then a numbered list of 12. Number, title, year, one word. Hover plays a muted
  loop on the right. Click: the right side becomes the exhibit (loop, live embed, GLB). The list stays.
- A second route `/process`: the eight scenes above as pinned full-bleed stops (the film part of A).
- Footer is one live line: last deploy, tracks played today, open tee slots now.
- Filter chips only if real: web, game, music, homelab, live.

Rejected for now: **B, the 3D yard** (one scene to maintain, phones struggle). Fine as a later
Undergrowth-only Easter egg.

## 5. Twelve mechanics we will use (from the Awwwards lane)

1. Scroll is a camera (pin, dolly). 2. Cursor becomes the UI. 3. WebGL as weather behind type.
4. View transitions, no hard cuts. 5. Hover plays the work. 6. Sound you opt into (SiGz only).
7. Kinetic type once, on the name. 8. Filmstrip rail for the evolution scene. 9. Uneven index,
never three equal cards. 10. Live numbers, dimmed when stale, never faked. 11. Reduced-motion
branch that still looks designed. 12. One 3D context per view, poster first, DPR capped.

## 6. Anti-list (hard gate, mechanical)

The build gate fails the page on any of: purple gradient hero, three equal cards, generic hero
sentence, Inter / Poppins / Space Grotesk, glass blur cards, blob 3D with no subject, icon row of
services, centred column in a sea of background, stock or fake screenshots, marquee logo cloud,
emoji headings, em dashes, a video with no poster, any file over 3 MB, missing
`prefers-reduced-motion` branch.

## 7. Formats and performance rules

- Video: AV1 mp4 first, HEVC second, H.264 last. 6 to 10 s, 720p, muted, `preload="none"`, poster webp is the LCP. Under 3 MB. No gif, ever.
- 3D: `<model-viewer>` for one spinning object per cell, `loading="lazy"`, poster png, GLB under 5 MB, 10k to 50k faces. Three.js only for the garden.
- Chrome animation: CSS or Rive. Lottie only if an AE file exists.
- Hosting: Cloudflare Pages, 25 MiB per file wall, R2 for anything larger. Hashed filenames, never overwrite.
- Live data: TeeTimes direct (CORS `*`). SiGz and BBC through a read-only proxy route on sigouin.net with a 60 s cache. Never expose `/api/key/*` or anything admin.

## 8. Rounds to get there

| Round | What | Lanes (CLI) | Gate |
|---|---|---|---|
| 13 assets | captures of all 6 live sites at 1440 + 390 via the scrollcraft harness; 4 GLBs (neon sign, golf pin, Unraid box, AMP tower); 3 Seedance clips (garden, neon ambient, canvas); poster stills per exhibit; process media (nine-up sheet, five-way strip, board captures, gate replay, canvas screenshot); proxy Worker route | codex (captures, media, proxy), claude opus (Tripo via MCP, Higgsfield via CLI, imagegen), 6 lanes, disjoint folders | `check-assets.py`: every listed file exists, size caps, poster per video, GLB face count |
| 14 build | two hub builds from one brief, structure C + process wing | kimi K3 + claude opus, same brief, separate folders. Luc picks. | `check-hub.py`: anti-list, size budget, reduced-motion, live feeds return 200, capture strip at 1440/390 |
| 15 ship | archive current site + README row, promote winner, deploy via `deploy/deploy.sh`, `verify-live` hash match | orchestrator + one codex lane | served hash equals local |

Estimated spend for round 13: Tripo about 160 of 380 credits, Higgsfield about 180 of 270,
OpenAI under 3 USD, kie.ai two stills. Nothing spent until Luc says go.

## 9. Housekeeping found on the way (not done, asking first)

- `personal/CLAUDE.md` names `fantasy-football/fleet-cheatsheet-workbench/` and `research-side-income/`. Neither exists on disk.
- `Traditionally/` is an empty folder pair with no record. Delete?
- `undergrowth/` v1 is still top-level; CLAUDE.md says archive it.
- `sigouin-net/README.md` still says "Not live yet" above a paragraph describing the live deploy.
- vhs and asciinema are not installed. Terminal replays either need `brew install vhs` or a CSS replay of real captured output.
- The `ui-skills` (21st.dev) and `motionsites` MCP servers did not connect for the grok lane (auth required). They worked from the orchestrator session, so this is a worker-scope issue, not a dead server.

## Could not verify

- Rendered look of any board or page. Sizes and paths only.
- Tripo credit cost per GLB at the `high` quality flag; the lane read the public table, not a real call.
- Seedance 2.5 per-second credit rate on Luc's plan: the services registry says 9 credits per second at 1080p (probed 2026-09-08), the public blog says 52 credits for 8 s at 720p. Both are used above; the first real clip settles it.
- CORS on `/api/teetimes` (only `/api/courses` was probed with an Origin header).
- Whether the 8 archived `demo.html` lanes still render without assets that moved to `sigzmusic/brand/source/`.

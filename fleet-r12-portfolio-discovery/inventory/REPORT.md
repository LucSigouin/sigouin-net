# Lane INVENTORY report, round 12

Deliverable: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/inventory/INVENTORY.md`
Machine twin: `inventory.json`, 37 cards, one object per exhibit.

## What I did

1. Listed every top-level dir under `personal/` and read every row of `archive/README.md`.
2. Read the project docs that exist: `sigzmusic/PRODUCT.md`, `teetimes/BRIEF.md` and
   `STATUS.md`, `sigouin-net/README.md`, `undergrowth-v2/README.md`, `RsyncGui/README.md`,
   `tripo-mcp/README.md`, `scrollcraft/FINGERPRINTS.md`, `personal/CLAUDE.md`.
3. Counted visual assets with one `find` per directory, pruning `node_modules`, `.git`,
   `masters` and `DerivedData`, grouped by extension.
4. Extracted API routes from source with grep rather than guessing, then probed only the
   public ones with plain GET. No key was used, no `.env` was opened, nothing was mutated.
5. Aggregated every `costs.jsonl` in the workspace into one image spend number.
6. Counted process artifacts: fleet dirs, lane dirs, workbench boards, rubrics, scores,
   REPORT.md and result.json files.

## Numbers

| Thing | Value |
|---|---|
| Exhibit cards written | 37 |
| Top-level dirs covered | 15, plus a one-line entry for `scratch` |
| Archive README rows covered | 24 |
| Live URLs confirmed 200 | 6 (sigzmusic.com, teetime.sigouin.net, undergrowth.pages.dev, bbc.sigouin.net, livetvcan.com, sigouin.net) |
| Public JSON endpoints confirmed 200 | 7 responses across 4 hosts |
| Fleet round dirs on disk | 33 |
| Worker REPORT.md files | 131 |
| result.json files | 66 |
| Competition lane dirs | 36 |
| workbench.html boards | 10 (8 unique) |
| scrollcraft lab capture dirs | 12 |
| Images with a logged cost | 146, totalling 30.25 USD, 144 gpt-image-2 and 2 grok |
| 3D model files on disk | 0 |
| gif files on disk | 0 |
| mp4 clips outside `masters/` | 31 |
| Visual files total, including archive | 7764 |

## Things worth surfacing to the orchestrator

- Best process exhibits, in order: the scrollcraft `lab/` capture strips (172 frames for the
  live sigouin.net alone), the archived 9-lane sigzmusic landing competition, the 5-way
  sigouin.net look comparison with its blind score sheet.
- Best live-data exhibits: `teetime.sigouin.net/api/teetimes` (82 KB of real slots),
  `sigzmusic.com/api/tracks` (real play counts), `bbc.sigouin.net/api/state` (live scoreboard).
- Only true 3D on the hub can come from `undergrowth.pages.dev`. `tripo-mcp/out/` is empty and
  there are zero model files anywhere, so any spinning object needs a fresh generation run.
- No gif exists anywhere. Motion has to be mp4, a capture strip played as frames, or real
  CSS and WebGL.
- Three documentation discrepancies found: `personal/CLAUDE.md` still names
  `fantasy-football/fleet-cheatsheet-workbench/` and `research-side-income/`, neither of which
  is on disk; `sigouin-net/README.md` says "Not live yet" while sigouin.net serves 200.
- `Traditionally/` is an empty directory pair with no record anywhere. Ask Luc.
- RsyncGui is the screenshot-poorest shipped project: 4 svg and 2 png, no captures of the
  thing that makes it good (the streaming run log).

## Rubric self-check

| # | Criterion | Pass | Evidence |
|---|---|---|---|
| 1 | Evidence | PASS | Every card carries absolute paths or probed URLs with status code and byte size. Counts name the `find` that produced them in the Cross-project numbers table. |
| 2 | Coverage | PASS | All 15 top-level dirs plus all 24 archive README rows have a card. 37 cards in `inventory.json`. |
| 3 | Exhibit-ready | PASS | Every card ends with a "Show it as:" line. Checked mechanically: `json.load` then assert every `show_it_as` starts with "Show it as:", zero failures. |
| 4 | Honesty | PASS | "## Could not verify" lists 14 items, including unread archive folders, uncalled endpoints, and the build duplicates inflating two asset counts. |
| 5 | Plain words | PASS | A grep for the em dash character returns 0 on INVENTORY.md, inventory.json and this file. Short sentences, no marketing adjectives. |
| 6 | Machine twin | PASS | `inventory.json`, 37 objects, all with exactly the ten required keys. Verified by `json.load` plus a key-set assertion. |

## Gate

```
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/check-lane.py \
        /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/inventory
```

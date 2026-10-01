# Lane TOOLING report, round 12

Deliverable: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/tooling/TOOLING.md`
Machine twin: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/tooling/tooling.json`
Model: requested claude-opus-5, effective claude-opus-5.

## What I did

Read-only scan of four places: `~/.claude/` (skills, agents, hooks), `~/.claude.json` mcpServers
(names, type, url or command only, never env values), `/Users/ls/Claude-Workspace/Fleet-Machine/`,
`/Users/ls/Claude-Workspace/cnvs/`, and every fleet round, REPORT.md, result.json and workbench
board under `/Users/ls/Claude-Workspace/personal/` with node_modules excluded. Nothing under
`work/` was opened. No `.env` file was opened. Nothing was generated and no credits were spent.

## What the numbers say

- 52 skills, 20 subagent definitions, 4 live hooks, 12 parked hooks.
- 8 agent CLIs on the machine: claude, codex, grok, kimi, qwen, opencode, higgsfield, cnvsctl.
- 3 user scope MCP servers (motionsites, tripo3d, ui-skills) plus cnvs and 3 plugin servers.
- 50 fleet rounds catalogued across 8 projects, from 1 lane to 9 lanes.
- 131 worker REPORT.md files in personal, 91 result.json files across the three roots.
- 27 workbench boards on disk, the largest 1.65 MB, which is the board for this very site.

## The three findings worth carrying to the build round

1. **The process has a visible history of changing itself.** The scorer role existed from
   2026-08-30 and was deleted on 2026-09-08. The data shows it: every undergrowth round through r7
   has a scorer lane, round 12 has none. That is an exhibit, not a footnote.
2. **undergrowth-v2 is the only project whose lanes all recorded their model.** If the page wants a
   real lane chart coloured by model, build it from
   `/Users/ls/Claude-Workspace/personal/undergrowth-v2/fleet-r6-art/` and `fleet-r7-medieval/`.
   Seven lanes, five models, all verify commands exit 0.
3. **The best ready made process exhibit already exists.**
   `/Users/ls/Claude-Workspace/Fleet-Machine/how-the-fleet-works.html` is 2.6 KB, one screen, emoji
   stop map, zero jargon. It was written for a non-technical reader. Reuse the idea, not the file.

## Risks for the next round

- Board HTML files carry real project data. The sigouin.net board is 1.65 MB and the livetvcan
  boards sit inside a deployed site. Screenshot them, do not embed them.
- Model names in result.json are self reported strings, not verified. `gpt-6-astra` appears 9 times
  and nothing on disk confirms which vendor that is.
- Many rounds predate the model field, so any "models used" chart will have gaps. Show the gap
  honestly rather than guessing.

## Rubric self-check

| # | Criterion | Pass | Evidence |
|---|---|---|---|
| 1 | Evidence | pass | Every row in TOOLING.md sections 2, 3 and 4 carries an absolute path. Section 5 gives the shell command behind each number. |
| 2 | Coverage | pass | All 52 skills listed, all 20 agents named, all 16 hooks named, all 4 MCP servers, all 8 CLIs, 50 fleet rounds, 27 boards. |
| 3 | Exhibit-ready | pass | Every tool row has a "Show it as" column. All 8 story beats end with a "Medium" line. Sections 1 and 4 each end with a "Show it as" line. |
| 4 | Honesty | pass | "## Could not verify" lists 13 items, including that no board was opened and no verify script was run. |
| 5 | Plain words | pass | Short sentences, no em dashes anywhere in TOOLING.md, tooling.json or this file. Gate checks the em dash. |
| 6 | Machine twin | pass | `tooling.json`: 38 tool entries, 50 round entries, 27 board entries, numbers block. |

## Could not verify

Full list in the deliverable. The short version: I opened no rendered page, ran no verify script,
and read none of the 131 REPORT.md bodies. Dates are filesystem modification times.

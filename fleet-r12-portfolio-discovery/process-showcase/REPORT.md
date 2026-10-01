# Lane PROCESS-SHOWCASE, round 12

Done. Research file is on disk. Gate not yet run at the time of this sentence; run follows.

## What

Web research on how studios, indie hackers, and AI labs present process and tooling as a showpiece. Mapped each example to Luc's CNVS fleet.

## Model

- requested: grok (CLI default, highest)
- effective: grok-4.6
- source: spawn flag
- CLI: grok 1.0.34, config.toml `[models] default = "grok-4.6"`, reasoning high
- node: Zuma, CNVS_NODE_ID 77C62CD0-09D7-4786-8C73-1F9AA0995F61
- taskId: null. cnvs_state returned an empty tasks list.

## Files

- RESEARCH-process.md, the deliverable
- this REPORT.md
- result.json

Wrote only inside process-showcase/.

## Counts

- 24 numbered examples, each with a URL, a medium, a why, and a Show it as: line
- 1 extra Resn note because resn.co DNS failed
- 8 exhibit storyboards, each tied to a path on disk
- 6 capture tools with pros, cons, formats
- 7 live-metric habits
- 5 no-text ways to show multi-model competition plus a human pick

## Verify

Command:

```
python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/check-lane.py /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/process-showcase
```

Must exit 0. Ran in this session:

```
PASS: process-showcase deliverable RESEARCH-process.md 23819 bytes, model {'requested': 'grok (CLI default, highest)', 'effective': 'grok-4.6', 'source': 'spawn flag'}
EXIT:0
```

## Did not do

No .env. No push. No deploy. No image, video, or 3D generation. No system browser. No Screen Studio / vhs / ffmpeg run.

## Rubric self-check

| # | Criterion | Pass/fail | Evidence |
|---|---|---|---|
| 1 | Evidence | pass | Every example has a URL. Every exhibit names a path on disk. |
| 2 | Coverage | pass | 24 named examples, rubric asked for 20. |
| 3 | Exhibit-ready | pass | Each example ends with Show it as: naming a medium. |
| 4 | Honesty | pass | RESEARCH-process.md has ## Could not verify, not empty. |
| 5 | Plain words | pass | Short sentences. Zero em dashes in RESEARCH-process.md and this file. |
| 6 | Machine twin | n/a | Research lane. Rubric says json twin is for inventory lanes. |

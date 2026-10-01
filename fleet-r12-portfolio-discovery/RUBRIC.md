# Round 12 rubric: portfolio discovery (research + inventory lanes)

Self-check standard for every worker. Fill the table at the end of your REPORT.md.
Gate: python3 check-lane.py <lane dir> must exit 0.

| # | Criterion | What passes |
|---|---|---|
| 1 | Evidence | Every fact carries a path on disk (inventory lanes) or a URL (research lanes). No "I believe". |
| 2 | Coverage | Inventory: every top-level dir in personal/ AND every row of archive/README.md gets a card. Research: at least 20 named examples with URLs. |
| 3 | Exhibit-ready | Every project or example ends with one "Show it as:" line naming a medium: screenshot, video/gif, live data feed, 3D object, animation, or process board. |
| 4 | Honesty | A "## Could not verify" section lists what you did not open, run, or confirm. Never empty. |
| 5 | Plain words | Short sentences, no em dashes, no filler, no marketing adjectives. |
| 6 | Machine twin | Inventory lanes also write a .json with the same cards so a page builder can read it. |

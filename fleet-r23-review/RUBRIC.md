# Rubric — full review of the live sigouin.net (2026-09-24). Reviewer self-check; no scorer.

Each criterion is a yes/no the reviewer answers in a table at the end of REPORT.md.

1. Coverage: every live surface got eyes — landing `/` (site/index.html + site/vybe/*),
   `/process/`, `/hub/` (Sigouin-Hub/src/**, built to site/hub), Pages Functions
   (site/functions/**), `_headers` CSP, `_routes.json`, deploy/ scripts.
2. Evidence: every finding has file:line, and every claim about live behaviour was
   actually observed (curl output, test output, or line reference), not assumed.
3. Severity discipline: P0 = broken/insecure/data-leak for a visitor; P1 = real defect or
   perf/a11y problem; P2 = polish/dead code. No inflation.
4. Dead weight found: unused files, stale data, orphan assets in `site/` that the live pages
   never request. List them with proof (grep shows no reference).
5. Fix cost stated: each finding names the smallest fix and whether it needs a rebuild
   (`Sigouin-Hub`) or is a plain edit in `site/`.
6. Plain language: REPORT.md readable by Luc in 2 minutes: top-5 summary first, then the full table.

TASK: full read-only review of the LIVE sigouin.net site. Project root: /Users/ls/Claude-Workspace/personal/sigouin-net

First read, in order: fleet-r23-review/RULES.md (hard rules), fleet-r23-review/RUBRIC.md (your self-check), fleet-r23-review/ROUND.md.

What is live (verified 2026-09-24, deploy fafc78f3, Cloudflare Pages project sigouin-net):
- https://sigouin.net/        = site/index.html + site/vybe/* (render-only "Vybe workstation" landing, monitor login screen). Phones in portrait get a rack-first still.
- https://sigouin.net/hub/    = site/hub/* — a walkable Three.js 3D hub, built with Vite from Sigouin-Hub/src/** (8.9k lines TS). site/hub is the DEPLOYED build; Sigouin-Hub/dist is a NEWER unreleased build, ignore dist.
- https://sigouin.net/process/ = site/process/index.html (+ site/css, site/js, site/data, site/assets — leftovers of the 2026-09-17 portfolio hub; check what is still referenced).
- Pages Functions: site/functions/api/live/[[path]].ts (read-only JSON proxy: SiGz, BBC, TeeTimes) and site/functions/assets/[[path]].js (404s for 4 removed assets). Routing: site/_routes.json. Headers/CSP: site/_headers.
- Deploy: deploy/deploy.sh, deploy/verify-live.sh. Hub tests: Sigouin-Hub/tests/*.spec.ts (Playwright, read-only runs against live are allowed).

Review everything for: security (CSP gaps, Functions proxy abuse/SSRF/open-redirect, header coverage on /hub/ and /process/), correctness (broken links/404s, JS errors, stale hard-coded data, mobile/portrait path), performance (payload sizes per route, what actually loads on first paint, unused shipped bytes), accessibility (keyboard, reduced-motion, contrast, alt text), maintainability (dead files in site/ that no live page requests — prove with grep; duplicated or stale docs), and deploy safety (does deploy.sh ship .wrangler/ or other junk; does verify-live.sh still match what is live).

Output: fleet-r23-review/<your lane>/REPORT.md (top-5 first, then full findings table: severity, file:line, what breaks, smallest fix, needs-rebuild?) plus result.json per RULES.md. Write a draft REPORT.md within 10 minutes. Do not fix anything. Read-only everywhere except your lane folder.

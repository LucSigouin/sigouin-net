# Shared rules for every reviewer in fleet-r23-review (read once, follow throughout)

1. READ-ONLY outside your own lane folder. You may write ONLY inside
   `sigouin-net/fleet-r23-review/<your-cli>/`. Never edit `site/`, `Sigouin-Hub/`, `deploy/`,
   or anything else. Never run `npm run build`, `vite build`, `wrangler`, or any command that
   writes into the project. `npx tsc --noEmit -p Sigouin-Hub` is fine (read-only).
2. No deploys, no pushes, no publishing, no `.env` reads. `curl` against https://sigouin.net is fine.
3. No browser automation launches EXCEPT: Playwright is pre-approved for read-only test runs
   inside `Sigouin-Hub/` (e.g. `SITE_URL=https://sigouin.net npx playwright test tests/site.spec.ts --project=desktop`).
   Never `open` a URL in the system browser.
4. Every finding carries `file:line`, a severity (P0 blocker / P1 should-fix / P2 nice), what breaks,
   and the smallest fix. No praise sections. No findings without a location.
5. Deliverables, both required, in your lane folder:
   - `REPORT.md` — write a draft within 10 minutes (its mtime is your heartbeat), then keep updating.
   - `result.json` — schema:
     {"state":"done","taskId":"<your CNVS task id if shown, else null>",
      "model":{"requested":"<id>","effective":"<id>","source":"spawn flag"},
      "files":["REPORT.md","result.json"],
      "verify":{"cmd":"<the verify cmd you were given>","exit":0},
      "unverified":["<anything you could not check, e.g. real phone>"]}
6. Timebox 40 minutes. If blocked, write what you have, set state "blocked" in result.json, say why.

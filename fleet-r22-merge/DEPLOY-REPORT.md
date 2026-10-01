# Round 22 deploy report

Deployed round 20's restored header, background videos, no-scroll layout and process wing with round 21's Golf Game App exhibit on 2026-09-17.

Deployment id: `3d91385e`
Deployment URL: https://3d91385e.sigouin-net.pages.dev
Production: https://sigouin.net
Deploy exit code: 0. Sanitized output is in `deploy-output.txt`.

## Merge

Copied `fleet-r20-header/site` to `fleet-r22-merge/site`, replaced `js/exhibits.js` from round 21 and copied its four `widgell-*.webp` captures.
Round 21 actually removed three BBC captures, despite the task saying two. `rg -n -F` across merged HTML and JS returned no references for each before removal:

- `bbc-1440-scroll0-20260917.webp`
- `bbc-390-scroll0-20260917.webp`
- `bbc-1440-scroll50-20260917.webp`

Before the S01 fix, `diff -rq fleet-r21-golf/site fleet-r22-merge/site` printed exactly:

```text
Files fleet-r21-golf/site/css/hub.css and fleet-r22-merge/site/css/hub.css differ
Files fleet-r21-golf/site/index.html and fleet-r22-merge/site/index.html differ
```

## S01 change and CSP proof

`site/process/index.html:201` now contains `<script type="module" src="../js/process.js"></script>`.
The inline body was moved verbatim, including whitespace, to `site/js/process.js:1` (import at line 2). Extraction asserted byte-equivalent text. No behavior or CSP policy was changed. `site/index.html` has no inline scripts.

Ran the requested `npx --yes --cache "$TMPDIR/npmcache" wrangler pages dev /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r22-merge/site --port 5205` in a controlled foreground shell. TMPDIR was unset initially, so the first invocation failed trying `/npmcache`; reran with TMPDIR=/tmp. Wrangler 4.134.0 parsed three header rules. Stopped the server after the check.

Headless Edge through the existing `playwright-core` package, viewport 1440x900, received the shipped CSP on both pages:

| Route | CSP violations | Console errors | Page errors | After one Next click |
| --- | --- | --- | --- | --- |
| /process/ | 0 | 0 | 0 | P2 / 8 |
| / | 0 | 0 | 0 | Not applicable |

Evidence and reproducible harness: `csp-results.json`, `csp-check.mjs`. This local server did not run Pages Functions, so this proves static-page CSP and stepper behavior, not live feed behavior.

## Asset and promotion checks

The round 14 checker requires screenshots, manifest and lane metadata that do not fit this merge lane. Ran `check-assets.py` instead: 81 local references resolve, 12 video elements or media objects have posters, zero errors. This covers HTML src/href/poster, JS imports and literal asset/data paths, and the dynamic video template and exhibit media records. Evidence: `asset-results.json`.

The rollback copy comparison and promotion `diff -rq` both printed nothing and exited 0. Wrangler's generated `site/.wrangler` state was moved into `fleet-r22-merge/wrangler-deploy-state` after deployment. Final source/deploy comparison is empty in `final-site.diff`.

## Live status only

One curl request per route after deployment:

| URL | HTTP code |
| --- | --- |
| https://sigouin.net/ | 200 |
| https://sigouin.net/process/ | 200 |

Both curl commands exited 0. Evidence: `live-status.json`.

## Rollback

Preserved copy: `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-as-deployed-83b9e0f7`
Pre-deploy live homepage SHA-256 from `curl -s https://sigouin.net/ | shasum -a 256`:

```text
12f73cab94e91157b844609559cbd0ab370cb444319f2f63b424e4247c699b3a
```

Copy and hash were captured before promotion. Exact preparation commands:

```sh
cp -R /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-as-deployed-83b9e0f7
diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/site /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-as-deployed-83b9e0f7
curl -s https://sigouin.net/ | shasum -a 256 > /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r22-merge/pre-deploy.txt
rsync -a --delete /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r22-merge/site/ /Users/ls/Claude-Workspace/personal/sigouin-net/site/
diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r22-merge/site /Users/ls/Claude-Workspace/personal/sigouin-net/site
CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
```

Exact rollback commands, documented only and not executed:

```sh
rsync -a --delete /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-as-deployed-83b9e0f7/ /Users/ls/Claude-Workspace/personal/sigouin-net/site/
diff -rq /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r16-tweaks/site-as-deployed-83b9e0f7 /Users/ls/Claude-Workspace/personal/sigouin-net/site
CONFIRM_DEPLOY=1 /Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh
```

Restoring these bytes would create a new deployment id.

## Could not verify

`deploy/verify-live.sh` was skipped on Luc's instruction: "push this version to live, don't verify, just push". No live browser checks, asset hashes, headers, API checks or global propagation checks were run. The two HTTP 200 responses do not establish which version every edge serves. Other round 19 findings were outside the requested S01-only fix.

No git push, DNS or Cloudflare settings changes, system browser launch, or credential inspection occurred. The deploy script sourced its own credential file. Only Wrangler used the allowed npx cache.

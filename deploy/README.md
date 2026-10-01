# sigouin.net deploy tools

Run these from this folder after the site files are ready.

1. Preview promotion: `bash promote.sh /path/to/lane`.
2. Promote when ready: `bash promote.sh --apply /path/to/lane`. Add `--force` only when the target `site/` should be updated.
3. Deploy with `CONFIRM_DEPLOY=1 bash deploy.sh`.
4. Check the live files: `bash verify-live.sh`.

The Pages project must be created once, either in the dashboard or with `wrangler pages project create sigouin-net --production-branch main`. Attach the custom domain `sigouin.net` in the Cloudflare dashboard.

`deploy.sh` reads only `CLOUDFLARE_ACCOUNT_ID` from `/Users/ls/Claude-Workspace/personal/.env`; wrangler's own login does the auth. It deploys an rsync'd staging copy of `site/` (no dotfiles, no `*.py`). Deploying is intentionally blocked unless `CONFIRM_DEPLOY=1` is set.

`verify-live.sh` hashes every file in `site/` against live, checks the security headers on HTML, checks one random missing path returns the 404 page (body compared up to `</main>`, because Cloudflare's bot check injects a script into 404 pages), and checks the two live JSON Functions.

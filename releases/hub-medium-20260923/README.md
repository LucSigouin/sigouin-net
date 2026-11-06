# Release: hub defaults to Medium + quality button (2026-09-23)

Deployment `8e2b27e1`, live at https://sigouin.net/hub/.

- `Sigouin-Hub/src/core/quality.ts`: `pickTier()` = `?quality=` param, else saved choice
  (`localStorage['hub-quality']`), else **medium** (was always high). `switchTier()` saves and reloads.
- `src/ui/hud.ts`: "Medium"/"High" button between full screen and Skip; `.hud-quality` in styles.css.
- Measured locally (1280x720, dpr 1, 60 cap): Medium 57-60 fps, High 48-54 fps.

Incident during this release: deploy `b44dc318` left `hub/assets/app-N694heRi.js` cached at the
Cloudflare edge as the HTML fallback page (200, `immutable`), which breaks the hub. Likely cause: a
request for the new file hit the old deployment while production was still switching over, and
`/hub/assets/*` is cached for a year. No purge token exists (`.env` has only the account ID), so the
fix was a rebuild with new file names (hover-text tweak) and redeploy `8e2b27e1`. Afterwards all 12
hub files hash-match live **without** a cache-buster, with correct content types.

Rule for future hub deploys: after `deploy.sh`, wait until `/hub/?cb=…` references the new entry
file before requesting any asset without a query string, then check every `/hub/assets/*` file with
no query string (content type must not be text/html).

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

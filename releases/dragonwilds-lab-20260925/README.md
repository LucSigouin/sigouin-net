# Release: Dragonwilds guide moves to its own site, linked from the Computer Lab (2026-09-25)

- `site/runescape/` (187 MB, 3,456 files) moved to `../../dragonwilds/site/`, its own Pages project
  `dragonwilds` at https://dragonwilds.sigouin.net. Fixture builder + raw dumps moved to `dragonwilds/tools/`.
- `site/_redirects`: `/runescape` and `/runescape/*` 301 to the new domain.
- Hub: Computer Lab `monitor-1` is now "Dragonwilds Field Guide" with an Open project button.
  `tests/hub.spec.ts` now checks each card's button href (mutant-tested: a broken href turns it red).
- `site-before/` = the site as it was before this change (runescape included) for rollback.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

Deployed 2026-09-25:
- Guide: Pages project `dragonwilds` (created with `--force` to stay on classic Pages; never needed again),
  deployment `8b6dcde2`, domain dragonwilds.sigouin.net (CNAME to dragonwilds-62m.pages.dev, proxied,
  added by hand: wrangler's login has no DNS scope).
- Main site: deployment `dfa7fe5c`, hub entry `index-DVCvExg8.js`.

Verification:
- `verify-live.sh https://sigouin.net site`: exit 0, 138/138 MATCH on attempt 1 (it failed on every run
  while `/runescape/` was part of the site).
- `verify-live.sh https://dragonwilds-62m.pages.dev dragonwilds/site`: exit 0 on attempt 1, all 3,453 files.
- dragonwilds.sigouin.net via the edge: 200, own CSP + no-transform headers, 18/18 sampled files sha256-match.
- `/runescape`, `/runescape/`, `/runescape/styles.css` → 301 to the same path on dragonwilds.sigouin.net.
- Live `/hub/` static list has `<a href="https://dragonwilds.sigouin.net/">Dragonwilds Field Guide</a>`.
- Not tested: clicking the lab monitor on a real phone or visible browser (headless tests only).

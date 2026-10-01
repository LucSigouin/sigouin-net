# Release: review fixes 1-5 from fleet-r23-review (2026-09-25)

Deployment `432a834e`, hub entry `index-BJ6gSDxE.js`. Live before this: `7f94a63f`.

1. Landing `/`: `<a class="enter-hub" href="/hub/">Enter the hub</a>`, hidden until focused, then a
   visible pill (render-only design kept). `render-only.css?v=enter-hub-20260925` beats the 4 h zone TTL.
2. `/process/`: scene images use `data-src` and load for the current + next scene only; scene and
   header clips no longer autoplay, `process.js` plays only the on-screen clip unless bg.js set
   `data-motion=still` (reduced motion or Data Saver). Dots are plain buttons with
   `aria-current="step"` and 28 px tap targets. `.scene__note` and `.ledger` scroll on short screens.
   "Back to the ten" → "Home". Dropped the dead `live-hub.js` import. `process.js`/`hub.css` got `?v=20260925`.
   Measured live: 0.89 MB on load (0.39 MB with reduced motion), was 3.69 MB.
3. `site/404.html`: unknown paths now return a real 404 (was 200 + landing page).
4. 61 files (17.3 MB) moved out of `site/` to `../../retired/site-unused-20260925/` (reference scan in
   Python over every html/js/css/json; no names are built at runtime). Inter licence kept. CSP trimmed:
   no unpkg model-viewer, no unused second script hash, no teetime connect-src, no undergrowth frame-src.
5. Hub: pinch zoom allowed (dropped `user-scalable=no`), Space/Enter on a focused button or link is left
   to that control (`src/core/input.ts`), plain-list view has a Home link.

`deploy/verify-live.sh`: `404.html` is no longer hashed as a route. Cloudflare's bot check injects a
script into every 404 page, so the script checks one random missing path for status 404, CSP, and the
404 body up to `</main>`.

Verification:
- Hub suite: 13 passed, 3 skipped. New tests (Space on Map button, no `user-scalable=no`, Home link)
  each went red with its fix reverted.
- New `tests/site-fixes.spec.ts` (6 tests): all 6 went red against the old files on `wrangler pages dev`,
  all pass locally and on https://sigouin.net. `site.spec` + `leave.spec` journeys pass on live
  (zero CSP violations).
- `verify-live.sh https://sigouin.net`: exit 0, 86/86 MATCH + 404 check + both Functions, attempt 1.
  Mutant (changed 404 heading): exit 1 on the 404 check only.
- Not tested: real phones, Safari, VoiceOver.

Rollback: Cloudflare dashboard → Workers & Pages → sigouin-net → Deployments → `7f94a63f` → Rollback.
Files: `mv ../../retired/site-unused-20260925/* ../../site/` (merge folders) restores the moved assets.

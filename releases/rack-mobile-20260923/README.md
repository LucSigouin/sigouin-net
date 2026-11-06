# Release: rack-first phone landing (2026-09-23)

Deployment `c6811a51` (https://c6811a51.sigouin-net.pages.dev), live at https://sigouin.net.

- Phones held upright (`max-width:759px` and portrait): the server rack fills the screen. The
  blank top panel and UNRAID display are replaced by a rack monitor showing the login screen with
  a big glowing Enter and a pulsing ring. Tapping the monitor fades into `/hub/`; tapping the
  rack below crossfades to the open-door still. No 3D download on phones.
- Tablets, phones in landscape, and desktop: unchanged.
- Files: `index.html` (`#rack-view`), `vybe/render-only.css`, `vybe/render-only.js`,
  `vybe/assets/rack-{closed,open}.webp`.
- Source: `../../dev-render-only/` (== `site/` at deploy). Stills from
  `../../dev-render-only-src/render_rack.py` (straight view) with the plate from
  `login_plate_rack.py`. Blender must run outside the sandbox (Metal GPU probe crashes inside it).

Verification: the five changed files hash-match live; `/`, `/hub/`, `/process/`, `/vybe/app.js`
return 200. Local build rendered at 390x844, 375x667, 430x932 in a CNVS browser node
(`../../mobile-mockup/preview.html`). Not tested: real taps on a real phone.

Rollback: `CONFIRM_DEPLOY=1 ../../deploy/deploy.sh "$PWD/site-before"` from this folder.

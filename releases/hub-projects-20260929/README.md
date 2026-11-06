# Release: hub project cards filled in (2026-09-29)

Deployment `a3e36a1d`, hub entry `index-B1qD82ld.js`. Live before this: `e2d1cf52`.

- `Sigouin-Hub/src/content/projects.json` (via `Sigouin-Hub/probe/fill-projects-20260929.py`): 9 of 12 slots filled.
  Linked: Undergrowth (Lab projector), Dragonwilds (Lab monitor-1), SiGz (Studio mixing desk),
  TeeTimes (Office whiteboard), The fleet `/process/` (AI brain). No link: Game servers (Lab monitor-2),
  Gardens homelab (Office rack), RsyncGui (Office desk-1), Tripo 3D tool (AI terminal-1).
  Still "Coming soon": Studio piano, Studio guitar wall, AI terminal-2.
- Card screenshots: `Sigouin-Hub/public/shots/*.jpg`, taken from the live sites by `probe/card-shots.mjs`.
- Bug fixed on the way: card image paths ignored the `/hub/` base (`src/ui/overlays.ts`).

Verification:
- Hub suite 13 passed; the card test now also checks each card image loads.
- New site test "hub under /hub/: a project card shows its screenshot": failed with the path fix
  undone (`/shots/undergrowth.jpg` instead of `/hub/shots/undergrowth.jpg`), passes with it.
- `verify-live.sh`: exit 0, 94/94 MATCH + 404 + both Functions, attempt 1.
- Live: `site-fixes.spec` (7) + `site.spec` + `leave.spec`: 9 passed.
- Not tested: real phones.

Rollback: Cloudflare dashboard → Workers & Pages → sigouin-net → Deployments → `e2d1cf52` → Rollback.

# Computer Lab: Undergrowth computer + dive into the screen (2026-09-30)

## What changed
- `projects.json`: Undergrowth moved from the projector to `monitor-2` (next to Dragonwilds on
  `monitor-1`); game servers moved to `monitor-3`. New optional `tag` field ("Tower defence",
  "Field guide") shows under the title on the screen. Projector now reads "Computer Lab · Gaming projects".
- Lab monitors pass a `screen` (centre, facing, height, material) to their exhibit. An entry with a
  url on such an exhibit becomes an interactable of kind `screen`: no card, it dives.
- F, E, Enter, a tap on the monitor, or a click on the prompt all trigger it. The prompt shows `F`.
- Dive (1.2 s, `App.placeDive`): small pull-back, then an in-out rush to 0.3x the fill distance while
  the camera keeps aiming at the screen centre; FOV narrows by 10°; the screen material brightens
  6x (bloom does the glow); the player hides once the camera passes them; from 80% a white-blue CSS
  flash (`.crt --flash`) washes in. At 100% the CRT loading screen (`Boot` in `ui/overlays.ts`)
  powers on: title, tag, filling bar, `> host_`. 1.45 s later `location.href = url` (same tab).
- Back button through the bfcache restores the lab (`undive`). Reduced motion skips the flight.
- Other rooms keep their cards. Upright-phone rack page untouched (separate page).

## Probe
`node probe/undergrowth-link.mjs http://127.0.0.1:5193/` (dev server). External hosts are stubbed.
Shots in `probe/shots/undergrowth-link/`: 1 both computers, 2 prompt with F, 3 mid-dive (held at
0.55 via `__hub.diveHold`), 4 glass flare (0.86), 5 loading screen. Results in `undergrowth-link.json`.
Asserted: both entries are kind `screen`, no card opened, Undergrowth navigates to
https://undergrowth.pages.dev/, Dragonwilds to https://dragonwilds.sigouin.net/ (~2.7 s after F).

## Tests changed
- `hub.spec` card loop skips `screen` kinds; new test dives each lab computer and waits for its URL.
- Mobile card-tap test and the live `site-fixes` card test now use the music studio's SiGz card,
  since lab computers no longer have a card.

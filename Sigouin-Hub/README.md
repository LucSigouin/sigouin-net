# Sigouin Hub

The sigouin.net landing page as a small walkable 3D courtyard. You play as Luc, walk
around a fountain, and enter four buildings. Each building shows one area of work, and
every project inside is also a plain link.

Vite + TypeScript + Three.js 0.186. No game engine, no React. Everything (character,
buildings, plants, textures, sound) is generated in code, so the whole build is about
220 KB gzipped.

## Run it

```sh
npm install
npm run dev        # http://localhost:5190
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ on http://localhost:5191
npm test           # Playwright checks (builds first), screenshots in tests/screenshots/
```

Deploy: `dist/` is a static site for Cloudflare Pages. `public/_headers` caches hashed assets.

## Edit the content

All projects live in **`src/content/projects.json`**. No code changes needed.

Each building has `entries`, each `{ title, blurb, url, image, exhibit, tag? }` (`tag` is the short line under the title on a Computer Lab screen):

- `url`: `null` shows "Link coming soon" instead of a button.
- `image`: a path under `public/` (for example `/shots/sigz.jpg`), or `null` for the placeholder.
- `exhibit`: which object in the room shows it. If a name is missing or used twice, the entry
  moves to the next free exhibit and a warning is logged.

| Building | Exhibit names |
|---|---|
| `computer-lab` | `projector`, `monitor-1` to `monitor-8` |
| `music-studio` | `mixing-desk`, `piano`, `guitar-wall`, `drums`, `keyboard` |
| `office` | `desk-1` to `desk-4`, `server-rack`, `whiteboard` |
| `ai-workspace` | `brain`, `terminal-1`, `terminal-2`, `curved-desk` |

The same file also builds the plain-HTML list that is baked into `index.html` at build time
(for search engines, screen readers, "Skip to links" and browsers without WebGL 2).

## Controls

- Desktop: WASD or arrows to walk, Shift to run, drag to look, scroll to zoom, E to enter or
  view, Esc to close, M for the map.
- Phone: left thumb walks (push to the edge to run), right thumb looks, tap the prompt to enter.
- Gamepad: left stick walks, right stick looks, A to use, B to close.

## Where things are

| Path | What |
|---|---|
| `src/boot/` | macOS-style boot screen; bar tracks real build steps |
| `src/core/` | app loop, input, collision, camera-safe post chain, quality tiers, audio, shaders |
| `src/world/` | courtyard layout (`layout.ts` is the single source of positions), ground, sky and day cycle, fountain, plants, props, backdrop |
| `src/buildings/` | the four exteriors, doors, shared furniture, the hologram brain |
| `src/interiors/` | one file per room, lazy-loaded on first entry |
| `src/character/` | the player rig, hand-authored clips, movement and camera |
| `src/ui/` | HUD, map, prompt, project card, thumbsticks, static links |
| `tests/` | Playwright suite and its screenshots |

## Quality, sound, leaving

Starts on Medium; the HUD "Medium"/"High" button switches and remembers the choice
(`localStorage['hub-quality']`). `?quality=low|medium|high` forces a tier for testing;
`?links` opens the plain list. `prefers-reduced-motion` skips the boot hold and camera move,
stops plant sway, and removes camera lag. Every visit starts muted; the HUD button turns sound on.

Served under a landing page (built with `--base=/hub/`), walking out past the end of the entrance
path plays an exit (the player walks off, the screen fades) and loads the landing page with
`#from-hub`, which plays its return animation. At base `/` the exit is off.
`LEAVE_URL=http://127.0.0.1:5201/hub/ npx playwright test tests/leave.spec.ts` checks it.

## Known limits

- Frame rate was measured on an Apple M5 only (about 60 fps at 2880×1800, High). The 2020
  MacBook Air and mid-range phone targets are untested on real hardware.
- The character is `public/models/luc.glb` (Tripo model, Mixamo rig); if it fails to load, a
  primitive body on the same rig takes its place.

## Tests against a deployed site

`SITE_URL=https://sigouin.net npx playwright test tests/site-fixes.spec.ts tests/site.spec.ts --project=desktop`
runs read-only: with `SITE_URL` set there is no local build or preview server.

# Prompt: sigouin.net hero page as a walkable 3D hub

Copy everything below the line into a fresh Opus 5.5 session. Attach the reference image
(`.cnvs/images/39d739d7…png`, the courtyard render) with it.

---

## What you are building

My personal portfolio hub, sigouin.net, gets a new hero/landing page: a small, beautiful
third-person 3D world built in Three.js that runs in the browser. Visitors play as me, walk
around a courtyard, and enter four buildings. Each building shows off one area of my work.
This is a website first and a game second: it must load fast, run on a laptop and a phone,
and every project inside must be reachable as a real link.

Stack: Vite + TypeScript + Three.js (current release), no React, no game engine. Deploy
target is Cloudflare Pages (static output). Keep the whole thing in one repo folder with a
`README.md` that says how to run, build, and where to edit content.

Reference image attached. Match its layout, palette, and mood as closely as you can. It is a
golden-hour, storybook-realistic courtyard: warm stone paths, saturated flower beds, a lake
and mountains behind, soft blue sky with a few clouds.

## 1. Boot screen

Before the world appears, play a macOS-style boot sequence:

- Full-viewport gradient background, not black. Slow-moving, multi-stop gradient (think
  dawn: deep indigo → violet → warm peach at one corner). Subtle animated grain so it is not
  flat. Insane quality is the bar: no banding, smooth 60 fps, crisp on retina.
- A centered monogram or wordmark ("LS" or "sigouin.net") fades in, then a thin rounded
  progress bar below it, exactly like the Apple boot bar. The bar is tied to real asset
  loading progress (textures, models, audio), not a fake timer. If loading is fast, hold a
  minimum of about 1.8 s so the animation still reads.
- Progress bar completes → gentle white flash → cross-dissolve into the courtyard with the
  camera settling behind the character. A soft chime is optional and must be off until the
  user interacts (browser autoplay rules).
- Keyboard and touch hints appear for 3 s after the fade: "WASD / arrows to walk, drag to
  look, E to enter" or on mobile "left thumb to walk, right thumb to look, tap door to enter".

## 2. The character (this is me)

Third-person controllable character:

- Young adult male, tall (about 6'1" / 185 cm), athletic build around 170 lb, short brown
  hair, light skin, casual outfit: fitted grey t-shirt or hoodie, dark jeans, white sneakers,
  small backpack (matches the figure in the reference image).
- Stylized-realistic proportions, not chibi and not photoreal. Clean PBR materials.
- Animations: idle (breathing, slight weight shift), walk, run, and a short "open door" or
  wave. Blend between them. Feet do not slide.
- Sourcing: prefer a rigged glTF you can legally ship (CC0 / Mixamo-style rig) recolored to
  the description above. If no suitable asset can be bundled, build the character
  procedurally in code from primitives with a proper skeleton and hand-authored animation
  clips. Either way it must look intentional, not placeholder.
- Controls: WASD / arrow keys to move relative to the camera, shift to run, mouse drag or
  right-stick to orbit the camera, scroll to zoom within limits. Mobile: two virtual
  thumbsticks. Gamepad support if cheap.
- Camera: smooth follow, collision-aware so it never clips through walls or buildings,
  slight lag on turns, gentle auto-recentering when walking straight.
- Character collides with walls, fountain, benches, planters, trees, and building
  exteriors. Cannot leave the courtyard (invisible boundary at the outer stone wall and
  hedge line, with a soft nudge rather than a hard stop).

## 3. The courtyard

Lay it out to match the reference image:

- **Center**: a three-tier stone fountain in a circular basin. Real water: animated surface
  shader with reflections and refraction, splashing particle streams from each tier, ripple
  rings where water lands. A ring of dense flower beds (pink, purple, white, lavender, blue)
  surrounds the basin, with small trimmed shrubs.
- **Paths**: warm beige stone pavers. A circular walkway around the fountain, four spokes
  leading to the four buildings, and a wide main approach from the bottom of the map that
  passes between two stone gate pillars topped with flower planters. Low stone walls with
  ivy flank the entry.
- **Lawn quadrants** between paths, edged with flower beds and scattered boulders.
- **Furniture**: at least six wooden park benches with black iron frames, eight black iron
  lampposts with warm glowing lanterns (they switch on at dusk in the day cycle), stone
  planters with flowers, a few decorative rocks.
- **Trees**: tall Italian cypress rows behind the buildings, broad-leaf deciduous trees at
  the corners with leaves that sway in a light breeze. Grass and flowers sway subtly too.
- **Backdrop**: a calm lake with distant islands, layered mountain ranges, a hillside
  castle silhouette on the right, cumulus clouds drifting slowly. Use a skybox or layered
  billboard cards, whichever looks better at the budget.
- **Ambient life**: a few birds crossing the sky, butterflies near the flowers, dust motes
  in the light. Optional gentle ambient audio (fountain, birds) with a mute toggle.

## 4. The four buildings

Each has a large, legible sign over the entrance, real double glass doors, lit interiors
visible through the windows, and an interior you can walk into. Positions match the image:

| Position | Building | Exterior | Interior |
|---|---|---|---|
| Back-left | **Computer Lab** | Pale limestone, flat roof, glass storefront, sign in serif on stone lintel | Rows of desks with monitors glowing blue, ergonomic chairs, a projector screen. Shows my **gaming projects**. Leave content blank for now: monitors show a placeholder "Coming soon" screen. |
| Back-center | **Music Studio** | Warm timber A-frame with gabled roof, wooden sign, flowering vines on the posts | Recording studio: grand piano, electric and acoustic guitars on wall hooks, drum kit, keyboard, studio monitors, a mixing desk with a computer, acoustic foam, warm lamps. Shows my **music**. Link out to sigzmusic.com. |
| Back-right | **Office** | Limestone with an arched doorway, sconce lights, sign over the arch | Desks with dual-monitor setups, a wall of server racks with blinking LEDs, whiteboard, plants. Shows my **work / infrastructure projects**. |
| Front-right | **AI Workspace** | Modern dark steel and glass, rooftop vents, backlit sign, a glowing holographic brain visible through the window | AI lab: holographic brain centerpiece slowly rotating, curved desks, monitors with scrolling terminal output, cool blue accent lighting. Shows my **AI projects**. |

## 5. Interaction and content

- Walk near a door → a floating prompt appears ("Enter Computer Lab · E"). Press E, click,
  or tap → doors open with animation → fade to the interior (a separate small scene,
  lazy-loaded on first entry). An exit door returns you to the courtyard at the same spot.
- Inside, project exhibits are interactable objects (a monitor, a poster, an instrument).
  Walk near one → prompt → opens an HTML overlay card over the 3D view: title, one-line
  description, a screenshot slot, and a button that opens the project link in a new tab.
  Esc or a close button dismisses it. The 3D view keeps rendering behind at reduced rate.
- All content is data-driven from one file: `src/content/projects.json`. Each building has
  a list of entries `{ title, blurb, url, image, exhibit }` where `exhibit` names which
  object in the room displays it. Ship it with realistic placeholder entries so I can fill
  in later without touching code.
- A minimal top-right HUD: mute, fullscreen, a "Skip to links" button, and a small map icon
  that shows which building is which.

## 6. Quality bar (this is what "insane quality" means here)

- Physically based materials, ACES tone mapping, sRGB output, soft shadow maps, an HDR or
  gradient environment for reflections, subtle bloom on lamps and screens, light ambient
  occlusion, very light depth of field on the far background only.
- Slow day cycle (about 6 minutes per loop) or at minimum a fixed golden-hour look that
  matches the image. Lamp lanterns and window interiors glow when the light dims.
- No pop-in: everything visible from the spawn point is loaded before the boot bar
  completes. Interiors stream on demand with a short door animation covering the load.
- Motion is smooth: fixed-step character update, frame-independent, no jitter on the
  camera.
- Text signs are real geometry or high-res textures, readable from the spawn point.

## 7. Performance and fallbacks

- Targets: 60 fps on a 2020 MacBook Air at 1440×900, 30 fps on a mid-range phone.
  Initial payload under 8 MB before interiors. Compress models (Draco or Meshopt),
  KTX2/Basis textures where they help, instanced meshes for flowers, grass, and pavers.
- Quality tiers: detect GPU tier on load and drop post-processing, shadow resolution, and
  particle counts on weak devices. Expose a manual toggle in the HUD.
- Respect `prefers-reduced-motion`: skip the boot animation timing, stop ambient sway,
  disable camera lag.
- If WebGL 2 is missing, or the user chooses "Skip to links", show a clean static HTML
  version of the same four sections with the same project links. That static list also
  lives in the DOM at all times (visually hidden) so search engines and screen readers get
  the content.
- The page must not scroll. The canvas fills the viewport exactly on desktop and mobile,
  with safe-area insets handled.

## 8. Deliverables and verification

- Repo layout: `src/` (boot, world, character, buildings, interiors, ui, content),
  `public/` (models, textures, audio), `tests/`, `README.md`.
- `npm run dev`, `npm run build`, `npm run preview`. Build output in `dist/` ready for
  Cloudflare Pages.
- Headless checks with Playwright: the page boots without console errors, the boot bar
  reaches 100 percent, the canvas fills the viewport with no scrollbars on desktop and
  mobile viewports, each of the four doors can be entered and exited via keyboard, and each
  project card opens. Take a screenshot at spawn, at each building door, and inside each
  building, and save them to `tests/screenshots/`.
- Do not report done until the build passes and every screenshot exists. Show the test
  output.

## 9. What not to do

- No third-party game frameworks, no React, no physics engine unless a tiny one is truly
  needed for capsule-vs-box collision (hand-rolled is fine and preferred).
- No purple-gradient "AI website" look on the 2D overlays. Overlays use a warm, restrained
  palette pulled from the courtyard: stone beige, deep green, lavender accent, near-black
  text.
- No lorem ipsum in the visible world. Placeholders should read like real copy ("Coming
  soon", project slots with believable names I can swap).
- No booking, no forms, no analytics. It is a portfolio, not a product.

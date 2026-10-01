# Round 14 common brief: BUILD the sigouin.net portfolio hub

Luc Sigouin is replacing sigouin.net with a portfolio hub. Twelve exhibits of his personal
projects, plus a `/process` wing showing how he builds with a fleet of AI agents on CNVS.
Almost no text. Awwwards quality. Professional, with a real wow moment when the landing page
loads. Zero "AI template" look. Every tool and model that touched a project is NAMED on the page.

Two lanes build from this same brief, in separate folders. Luc picks the winner by eye.
Round 12 discovery and round 13 assets are DONE. You build only. You generate no new media.

## Read first (all read-only)
- Plan, sections 2 to 7 are the spec: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/PLAN.md
- Luc's decisions, newest last: /Users/ls/Claude-Workspace/personal/sigouin-net/hub-board/DECISIONS.md
- Project facts, every path: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/inventory/INVENTORY.md
- Tools and models per project: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/tooling/TOOLING.md
- Awwwards mechanics: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/awwwards/RESEARCH-awwwards.md
- Embedding and speed rules: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/ai-assets/RESEARCH-ai-assets.md
- Assets, one manifest.json per lane dir under /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/
  captures/ (all six live sites at 1440 and 390, scroll positions, plus scroll mp4s and Undergrowth play frames)
  stills/out/ (livetvcan hero, gardens homelab, sigz waveform, teetimes dusk map, fantasy crest and its two refs)
  video/ (undergrowth flyover, sigz neon loop, cnvs canvas pullback; h264 + av1 + poster webp each)
  3d/ (sigz neon sign, golf pin, 4U rack server, game server tower; glb + poster png each)
  process-media/2026-09-17/ (boards, nine-up landing sheet, scrollcraft filmstrip mp4, five looks, gate red-green mp4 + tape)
  proxy/ (README.md, functions/api/live/[[path]].ts, live.js, samples/*.json fixtures)
- Background inspiration: MotionSites via the mcp__motionsites tools if they connect for you; skip if not.

## Shape (decided by Luc, do not re-litigate)
- `/` opens on the name with one kinetic type moment, then a numbered index of the 12 exhibits
  on the left (number, title, year, one word). Hover plays the muted loop or capture on the right.
  Click: the right side becomes the exhibit (loop, capture, live embed, or GLB). The list stays.
  Uneven rhythm. Never three equal cards.
- `/process/` is a second page: the 8 scenes P1 to P8 from PLAN.md section 3 as pinned
  full-bleed stops. Use the real process-media files. Name the tools: CNVS, Claude Fable 5
  (orchestrator), Claude Opus 5, Codex, Grok 4.6, Kimi K3, Qwen, Higgsfield, Tripo, kie.ai,
  gpt-image-2, MotionSites, 21st.dev.
- Footer is one live line: last deploy, tracks played today, open tee slots now.
- Screenshots first. Live data only where it earns its place (SiGz tracks, TeeTimes slots, BBC state).
- Homelab stays private: still and GLBs only, no live data, no hostnames.

## Live data
- TeeTimes: fetch https://teetime.sigouin.net/api/teetimes and /api/courses directly (CORS open).
- SiGz and BBC: through the proxy. Copy `proxy/functions/api/live/[[path]].ts` to
  `site/functions/api/live/[[path]].ts` and `proxy/live.js` to `site/live.js`, then use the
  client as its README says. Functions do not run in a plain static preview, so in dev load
  the fixtures from `proxy/samples/` and mark them visibly as sample data. Live numbers dim when
  stale. Never fake a number.

## Formats (hard rules, the gate checks them)
- Static site. Plain HTML, CSS, JS. No framework build step. No npm install. Vanilla or Three.js
  from a pinned local copy only if you truly need WebGL (the garden is an iframe of
  https://undergrowth.pages.dev with poster first, so you probably do not).
- Copy every asset you use into `site/assets/` with its dated or hashed filename. Reference
  only files inside `site/`. No hotlinks except the three live APIs, the Undergrowth iframe, and
  fonts.googleapis.com or fonts.bunny.net (with a real fallback stack).
- Video: `<video muted playsinline preload="none" poster="...">` with the AV1 source first and
  H.264 second. GLB via `<model-viewer>` (pinned CDN script allowed: unpkg or jsdelivr,
  `loading="lazy"`, poster). Images webp, png only where webp does not exist.
- Caps: image 1.5 MB, video 3 MB, GLB 5 MB, whole `site/` under 40 MB.
- `@media (prefers-reduced-motion: reduce)` branch that still looks designed.
- Works at 1440 and at 390 wide. No horizontal scroll on the body.
- Forbidden (gate greps for them): Inter, Poppins, Space Grotesk; em dashes anywhere;
  `backdrop-filter` blur cards; emoji in headings; a `<video>` without a poster; marquee logo
  clouds; a centred column floating in empty background; purple gradient hero.

## Self-check by screenshot
Render your own page with the harness already installed at
/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules (Playwright).
Copy the pattern from /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/captures/capture-20260917.mjs.
Serve `site/` with `python3 -m http.server <port>` in the FOREGROUND of a second shell you
control (never a detached background process), capture `/` and `/process/` at 1440x900 and
390x844, save them as `shots/<page>-<width>.png` in your lane dir, look at them, fix, repeat.
Never launch the system browser. Never install anything.

## Shared rules
- Write ONLY inside your lane dir. Everything else is read-only.
- Never open, read, or quote .env. Never push, deploy, publish, or change DNS. Never touch
  /Users/ls/Claude-Workspace/work/. Never spend credits: no image, video, or 3D generation.
- Deliverables: `site/` (index.html, process/index.html, assets/, functions/), `shots/` (the
  four png captures), `manifest.json` `{"lane":"a|b","files":[{"path":"<abs>","kind":"html|css|js|image|video|glb|data|code","bytes":N}]}`
  covering every file under site/ and shots/, REPORT.md (draft within 10 minutes, keep saving:
  what you built, which assets you used and which you skipped and why, the tools named on the
  page, "## Could not verify", the RUBRIC.md self-check table), then result.json
  `{"state":"done","taskId":null,"model":{"requested":"claude-opus-5","effective":"<what ran>","source":"spawn flag"},
   "deliverable":"<abs path of site/index.html>","files":["..."],
   "verify":{"cmd":"python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r14-build/check-hub.py <your lane dir>","exit":0},
   "unverified":["..."]}`
- Run the gate yourself before you report. Exit 0 or keep working.
- Plain words. No em dashes. Timebox 90 minutes. If blocked, write what you have, set state
  "blocked", and say why in one line.

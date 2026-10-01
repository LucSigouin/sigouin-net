// The ten exhibits. Every media path is a real round 13 asset copied into site/assets.
// Tool lists come from fleet-r12-portfolio-discovery/tooling/TOOLING.md. Nothing invented.

export const EXHIBITS = [
  {
    n: '01', title: 'SiGz Music', year: '2024', word: 'sound',
    fact: 'His own catalogue, streamed off his own server. Encrypted audio only HLS out of private R2, real per track play counts, waveform peaks precomputed so the strip on screen is data, not decoration.',
    link: { href: 'https://sigzmusic.com', label: 'sigzmusic.com' },
    live: 'sigz',
    tools: ['Cloudflare Workers', 'D1', 'R2', 'AES-128 HLS', 'Claude Opus 5', 'Kimi K3', 'Tripo', 'Higgsfield'],
    models: ['Claude Opus 5', 'Kimi K3'],
    media: [
      { kind: 'image', label: 'the site', src: 'assets/cap/sigz-music-1440-scroll0-20260917.webp', tag: 'Live capture, 1440, 2026-09-17' },
      { kind: 'video', label: 'neon loop', poster: 'assets/vid/sigz-neon-loop-20260917.poster.webp', av1: 'assets/vid/sigz-neon-loop-20260917.av1.mp4', h264: 'assets/vid/sigz-neon-loop-20260917.mp4', tag: 'Seedance via Higgsfield, from the 2019 neon photo' },
      { kind: 'glb', label: '3D sign', src: 'assets/glb/sigz-neon-sign-20260917.glb', poster: 'assets/glb/sigz-neon-sign-20260917.webp', tag: 'Tripo v3, image to 3D from brand/source/neon-sign.jpg' }
    ]
  },
  {
    n: '02', title: 'TeeTimes', year: '2026', word: 'slots',
    fact: 'Every open tee time near Ottawa on one map. Pick a point and a radius, see the slots, leave for the course own booking page. No booking inside the app, on purpose.',
    link: { href: 'https://teetime.sigouin.net', label: 'teetime.sigouin.net' },
    live: 'tee',
    tools: ['Cloudflare Workers', 'MapLibre', 'Chronogolf feed', 'wrangler', 'Claude Opus 5', 'Codex', 'Grok 4.6', 'Tripo'],
    models: ['Claude Opus 5', 'Codex', 'Grok 4.6'],
    media: [
      { kind: 'video', label: 'scroll', poster: 'assets/cap/teetimes-1440-scroll-20260917-poster.webp', h264: 'assets/cap/teetimes-1440-scroll-20260917.mp4', tag: 'Live site, scrolled by the capture harness' },
      { kind: 'image', label: 'dusk map', src: 'assets/still/04-teetimes-map.webp', tag: 'gpt-image-2 still, round 13' },
      { kind: 'glb', label: 'pin', src: 'assets/glb/golf-pin-v2-20260917.glb', poster: 'assets/glb/golf-pin-v2-20260917.webp', tag: 'Tripo v3, text to 3D' }
    ]
  },
  {
    n: '03', title: 'Undergrowth', year: '2026', word: 'garden',
    fact: 'A tower defense garden in the browser. Three.js and Vite, six gates before any commit, including a layout gate that fails the build if the page ever scrolls.',
    link: { href: 'https://undergrowth.pages.dev', label: 'undergrowth.pages.dev' },
    tools: ['Three.js', 'Vite', 'Cloudflare Pages', 'Playwright gates', 'Claude Opus 5', 'Kimi K3', 'Higgsfield'],
    models: ['Claude Opus 5', 'Kimi K3'],
    media: [
      { kind: 'video', label: 'flyover', poster: 'assets/vid/undergrowth-flyover-20260917.poster.webp', av1: 'assets/vid/undergrowth-flyover-20260917.av1.mp4', h264: 'assets/vid/undergrowth-flyover-20260917.mp4', tag: 'Seedance flyover, 10 s, muted' },
      { kind: 'video', label: 'real play', poster: 'assets/cap/undergrowth-1440-play-20260917-poster.webp', h264: 'assets/cap/undergrowth-1440-play-20260917.mp4', tag: 'Recorded from the live build, not a mockup' },
      { kind: 'iframe', label: 'play it', src: 'https://undergrowth.pages.dev', poster: 'assets/cap/undergrowth-1440-scroll0-play8s-20260917.webp', tag: 'Loads the live game only when you ask for it' }
    ]
  },
  {
    n: '04', title: 'BBC Scoreboard', year: '2026', word: 'match',
    fact: 'A golf match scoreboard for one recurring game. Two teams, a target, closest to the pin and long drive bonuses, one public state endpoint driving every phone on the course.',
    link: { href: 'https://bbc.sigouin.net', label: 'bbc.sigouin.net' },
    live: 'bbc',
    tools: ['Cloudflare Workers', 'Claude Opus 5', 'verify-live skill'],
    models: ['Claude Opus 5'],
    media: [
      { kind: 'image', label: 'board', src: 'assets/cap/bbc-1440-scroll0-20260917.webp', tag: 'Live capture, 1440, 2026-09-17' },
      { kind: 'pair', label: 'two widths', a: 'assets/cap/bbc-1440-scroll50-20260917.webp', b: 'assets/cap/bbc-390-scroll0-20260917.webp', tag: 'Same page at 1440 and at 390' }
    ]
  },
  {
    n: '05', title: 'LiveTVCan', year: '2026', word: 'four faces',
    fact: 'One Cloudflare Pages deploy wearing four faces: the marketing site, the admin console, the customer portal and the API. Customer data never appears here, so this exhibit is the shell only.',
    link: { href: 'https://livetvcan.com', label: 'livetvcan.com' },
    tools: ['React', 'Vite', 'Cloudflare Pages Functions', 'Claude Opus 5', 'Codex', 'unslop skill', 'evaluate-ui skill'],
    models: ['Claude Opus 5', 'Codex'],
    media: [
      { kind: 'image', label: 'hero', src: 'assets/still/01-livetvcan-hero.webp', tag: 'gpt-image-2 still, round 13' },
      { kind: 'pair', label: 'top and mid', a: 'assets/cap/livetvcan-1440-scroll0-20260917.webp', b: 'assets/cap/livetvcan-1440-scroll50-20260917.webp', tag: 'Live captures, 1440, 2026-09-17' }
    ]
  },
  {
    n: '06', title: 'RsyncGui', year: '2026', word: 'backups',
    fact: 'A web UI that schedules, runs and streams rsync backups, shipped as one Docker container for Unraid. The run log arrives over SSE and is cancellable mid flight. This is the screenshot poorest shipped project on disk, so it shows as the machine it runs on.',
    link: { href: 'https://github.com/LucSigouin/rsyncgui', label: 'ghcr.io/lucsigouin/rsyncgui' },
    tools: ['React', 'Express', 'SQLite', 'Server sent events', 'Docker', 'GitHub Actions', 'Claude Opus 5', 'Tripo'],
    models: ['Claude Opus 5'],
    media: [
      { kind: 'glb', label: 'the box', src: 'assets/glb/rack-server-4u-20260917.glb', poster: 'assets/glb/rack-server-4u-20260917.webp', tag: 'Tripo v3 stand in. No screenshot of a real run exists yet.' }
    ]
  },
  {
    n: '07', title: 'The Gardens', year: '2026', word: 'homelab',
    fact: 'Three boxes on a Tailscale mesh running the media stack, the game servers and the backups. It stays private on purpose: no hostnames, no live data, no dashboards. Only the shape of it.',
    tools: ['Unraid', 'Tailscale', 'AMP', 'gethomepage', 'Uptime Kuma', 'Claude Opus 5', 'Tripo', 'gpt-image-2'],
    models: ['Claude Opus 5'],
    media: [
      { kind: 'image', label: 'the gardens', src: 'assets/still/02-gardens-homelab.webp', tag: 'gpt-image-2 still, round 13. No real topology shown.' },
      { kind: 'glb', label: 'game tower', src: 'assets/glb/game-server-tower-20260917.glb', poster: 'assets/glb/game-server-tower-20260917.webp', tag: 'Tripo v3, text to 3D' }
    ]
  },
  {
    n: '08', title: 'Imagegen', year: '2026', word: 'cost per pixel',
    fact: 'Every generated image writes one JSON line with provider, model and real money spent, so the gallery shows a running cost next to each picture. 146 images logged across the workspace.',
    tools: ['Python stdlib', 'gpt-image-2', 'Grok image', 'Higgsfield', 'CNVS browser node'],
    models: ['gpt-image-2', 'Grok 4.6'],
    costs: true,
    media: [
      { kind: 'image', label: 'the drop', src: 'assets/still/03-sigz-waveform.webp', tag: 'One of the round 13 stills, cost logged below' }
    ]
  },
  {
    n: '09', title: 'Scrollcraft', year: '2026', word: 'no two alike',
    fact: 'A skill that builds scroll driven pages and keeps an append only registry of skeletons, so no two builds can share one. The lab screenshots every scroll position and grades its own output.',
    tools: ['Scrollcraft skill', 'Playwright', 'ffmpeg', 'Claude Opus 5', 'MotionSites'],
    models: ['Claude Opus 5'],
    media: [
      { kind: 'video', label: 'filmstrip', poster: 'assets/proc/scrollcraft-filmstrip-poster-2026-09-17.webp', h264: 'assets/proc/scrollcraft-filmstrip-2026-09-17.mp4', tag: 'The lab capture strip, scrubbed' }
    ]
  },
  {
    n: '10', title: 'This Page, Before', year: '2026', word: 'losers kept',
    fact: 'Seven candidate looks for sigouin.net across three rounds. Four lost and were archived intact, one shipped, and this hub replaces it. Nothing is deleted, so the losing work is still on disk.',
    link: { href: 'https://sigouin.net', label: 'sigouin.net' },
    tools: ['Claude Opus 5', 'Codex', 'Grok 4.6', 'Kimi K3', 'Claude Fable 5', 'Higgsfield'],
    models: ['Claude Opus 5', 'Codex', 'Grok 4.6', 'Kimi K3'],
    media: [
      { kind: 'image', label: 'all seven', src: 'assets/proc/sigouin-all-seven-2026-09-17.webp', tag: 'Seven candidate looks, one contact sheet' },
      { kind: 'image', label: 'five looks', src: 'assets/proc/sigouin-five-looks-2026-09-17.webp', tag: 'The 2026-09-02 fleet, four of them archived' },
      { kind: 'video', label: 'the live one', poster: 'assets/cap/sigouin-1440-scroll-20260917-poster.webp', h264: 'assets/cap/sigouin-1440-scroll-20260917.mp4', tag: 'The page this hub replaces, scrolled' }
    ]
  }
];

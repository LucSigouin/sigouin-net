/* The ten exhibits. Every asset here is a real round 13 file under assets/. */

export const EXHIBITS = [
  {
    n: "01", title: "SiGz Music", year: "2025", word: "Sound", weight: "loud",
    fact: "One Worker, one D1 catalogue, private R2 audio behind encrypted HLS. The waveform on the site is real peak data, not decoration.",
    credits: "Cloudflare Worker, D1, R2, AES-128 HLS. Built with <b>Claude Fable 5</b> as orchestrator, <b>Claude Opus 5</b> and <b>Codex</b> as workers, <b>Kimi K3</b> in the nine-lane landing contest. Neon sign modelled by <b>Tripo</b>, ambient loop by <b>Higgsfield</b> Seedance, cover art by <b>gpt-image-2</b>.",
    media: [
      { kind: "video", src: "assets/video/sigz-neon-loop-20260917", poster: "assets/video/sigz-neon-loop-20260917.poster.webp", tag: "Higgsfield Seedance loop" },
      { kind: "image", src: "assets/caps/sigz-music-1440-scroll0-20260917.webp", tag: "sigzmusic.com, live" },
      { kind: "image", src: "assets/stills/03-sigz-waveform.webp", tag: "gpt-image-2 still" },
      { kind: "glb", src: "assets/glb/sigz-neon-sign-20260917.glb", poster: "assets/glb/sigz-neon-sign-20260917.webp", tag: "Tripo model, from the 2019 photo" }
    ],
    thumbs: ["assets/caps/sigz-music-1440-scroll0-20260917.webp", "assets/caps/sigz-music-1440-scroll50-20260917.webp", "assets/stills/03-sigz-waveform.webp"],
    live: "sigz"
  },
  {
    n: "02", title: "TeeTimes", year: "2026", word: "Slots", weight: "",
    fact: "Every open tee time near Ottawa on one map. Pick a point, drag a radius, book on the course's own page.",
    credits: "Cloudflare Worker, MapLibre, Chronogolf as the source, 38 courses. <b>Claude Fable 5</b> orchestrating, <b>Claude Opus 5</b> on the API and both front ends, <b>Codex</b> on the probe lane, <b>Grok 4.6</b> on the market sweep. Pin modelled by <b>Tripo</b>, dusk plate by <b>kie.ai</b> Nano Banana.",
    media: [
      { kind: "image", src: "assets/caps/teetimes-1440-scroll0-20260917.webp", tag: "teetime.sigouin.net, live" },
      { kind: "image", src: "assets/stills/04-teetimes-map.webp", tag: "kie.ai Nano Banana still" },
      { kind: "glb", src: "assets/glb/golf-pin-v2-20260917.glb", poster: "assets/glb/golf-pin-v2-20260917.webp", tag: "Tripo model" },
      { kind: "image", src: "assets/caps/teetimes-1440-scroll50-20260917.webp", tag: "teetime.sigouin.net, list view" }
    ],
    thumbs: [],
    live: "tee"
  },
  {
    n: "03", title: "Undergrowth", year: "2026", word: "Siege", weight: "loud",
    fact: "A garden tower defense in the browser. You build engines to bend the route the horde walks, because a longer walk means more seconds under your guns.",
    credits: "Three.js and Vite on Cloudflare Pages. <b>Claude Fable 5</b> across seven fleet rounds, <b>Claude Opus 5</b> and <b>Kimi K3</b> competing on polish, <b>Qwen</b> as the extra lane. Sprites by <b>gpt-image-2</b>, flyover by <b>Higgsfield</b> Seedance. Six gates run before any commit.",
    media: [
      { kind: "video", src: "assets/video/undergrowth-flyover-20260917", poster: "assets/video/undergrowth-flyover-20260917.poster.webp", tag: "Higgsfield Seedance flyover" },
      { kind: "iframe", src: "https://undergrowth.pages.dev", poster: "assets/caps/undergrowth-1440-scroll0-play8s-20260917.webp", tag: "Playable, loads on click" },
      { kind: "image", src: "assets/caps/undergrowth-1440-scroll0-play8s-20260917.webp", tag: "Wave 1, eight seconds in" }
    ],
    thumbs: ["assets/caps/undergrowth-1440-scroll0-play8s-20260917.webp", "assets/video/undergrowth-flyover-20260917.poster.webp"],
    live: null
  },
  {
    n: "04", title: "BBC Scoreboard", year: "2025", word: "Match", weight: "quiet",
    fact: "A match play scoreboard for Luc's golf events. Still serving the last event, This is 30.",
    credits: "Cloudflare, small and static. <b>Claude Opus 5</b> built it, <b>Codex</b> reviewed it. State comes from one public JSON route.",
    media: [
      { kind: "image", src: "assets/caps/bbc-1440-scroll0-20260917.webp", tag: "bbc.sigouin.net, live" },
      { kind: "image", src: "assets/caps/bbc-1440-scroll50-20260917.webp", tag: "Card view" }
    ],
    thumbs: [],
    live: "bbc"
  },
  {
    n: "05", title: "LiveTVCan", year: "2026", word: "One deploy", weight: "",
    fact: "One Pages project wearing four faces: the marketing site, the admin desk, the customer portal and the API.",
    credits: "React and Vite with Cloudflare Pages Functions, merged down from two retired Workers. <b>Claude Fable 5</b> orchestrating, <b>Claude Opus 5</b> on the merge, <b>Codex</b> on the review lane. Hero plate by <b>gpt-image-2</b>. No customer data is shown here.",
    media: [
      { kind: "image", src: "assets/stills/01-livetvcan-hero.webp", tag: "gpt-image-2 hero" },
      { kind: "image", src: "assets/caps/livetvcan-1440-scroll0-20260917.webp", tag: "livetvcan.com, live" },
      { kind: "image", src: "assets/caps/livetvcan-1440-scroll50-20260917.webp", tag: "Plans section" }
    ],
    thumbs: [],
    live: null
  },
  {
    n: "06", title: "RsyncGui", year: "2026", word: "Backup", weight: "quiet",
    fact: "A web front end for rsync backups, shipped as a container for Unraid. Claude is read only in this repo by Luc's rule.",
    credits: "Docker image on GHCR built by GitHub Actions, repo LucSigouin/rsyncgui. <b>Claude Opus 5</b> reads and proposes, never writes. <b>Codex</b> audits. The rack model is a <b>Tripo</b> stand in: no screen capture of a live run exists yet.",
    media: [
      { kind: "glb", src: "assets/glb/rack-server-4u-20260917.glb", poster: "assets/glb/rack-server-4u-20260917.webp", tag: "Tripo model, stand in" }
    ],
    thumbs: [],
    live: null
  },
  {
    n: "07", title: "The Gardens", year: "2026", word: "Private", weight: "",
    fact: "Three boxes on a Tailscale mesh running the media stack and the game servers. No hostnames, no live data, no map. That is the point.",
    credits: "Unraid, AMP, gethomepage, Uptime Kuma. Runbooks written with <b>Claude Opus 5</b> behind a hard approval gate on every write. Cinematic plate by <b>kie.ai</b> Nano Banana Pro, tower modelled by <b>Tripo</b>.",
    media: [
      { kind: "image", src: "assets/stills/02-gardens-homelab.webp", tag: "kie.ai Nano Banana Pro still" },
      { kind: "glb", src: "assets/glb/game-server-tower-20260917.glb", poster: "assets/glb/game-server-tower-20260917.webp", tag: "Tripo model" }
    ],
    thumbs: ["assets/stills/02-gardens-homelab.webp", "assets/glb/game-server-tower-20260917.webp"],
    live: null
  },
  {
    n: "08", title: "Imagegen", year: "2026", word: "146 images", weight: "",
    fact: "A stdlib Python pipeline behind one slash command. Every run opens a gallery that refills while the images land, and logs what it cost.",
    credits: "Pure Python, no dependencies. Images by <b>gpt-image-2</b> and <b>Grok 4.6</b>. 146 images logged at 30.25 USD across the workspace. Four of the plates on this page came out of it.",
    media: [
      { kind: "image", src: "assets/stills/01-livetvcan-hero.webp", tag: "gpt-image-2" },
      { kind: "image", src: "assets/stills/02-gardens-homelab.webp", tag: "kie.ai Nano Banana Pro" },
      { kind: "image", src: "assets/stills/03-sigz-waveform.webp", tag: "gpt-image-2" },
      { kind: "image", src: "assets/stills/04-teetimes-map.webp", tag: "kie.ai Nano Banana" }
    ],
    thumbs: ["assets/stills/01-livetvcan-hero.webp", "assets/stills/03-sigz-waveform.webp", "assets/stills/04-teetimes-map.webp"],
    live: "cost"
  },
  {
    n: "09", title: "Scrollcraft", year: "2026", word: "Filmstrip", weight: "",
    fact: "A skill that builds scroll driven pages and refuses to reuse a skeleton. A registry file records every fingerprint so no two builds move the same way.",
    credits: "Static HTML, CSS and JS with a Python inliner. <b>Claude Fable 5</b> runs the interview, <b>Claude Opus 5</b> builds, references pulled from <b>MotionSites</b> and <b>21st.dev</b>. The strip is 172 real frames of one build scrolling itself.",
    media: [
      { kind: "video", src: "assets/process/scrollcraft-filmstrip-2026-09-17", single: true, poster: "assets/process/scrollcraft-filmstrip-poster-2026-09-17.webp", tag: "172 captured frames" }
    ],
    thumbs: [],
    live: null
  },
  {
    n: "10", title: "sigouin.net", year: "2026", word: "Seven looks", weight: "loud",
    fact: "This page, contested. Five candidate looks and three signature moves went into the ring. Four were archived, one shipped, and now the whole thing is being replaced by the page you are reading.",
    credits: "<b>Claude Opus 5</b> and <b>Codex</b> built the lanes, <b>Grok 4.6</b> hunted references, <b>Kimi K3</b> took two of the lanes. Luc picked by eye. Losers live in archive with a revive note, never deleted.",
    media: [
      { kind: "image", src: "assets/process/sigouin-five-looks-2026-09-17.webp", tag: "Five candidate looks" },
      { kind: "image", src: "assets/process/sigouin-all-seven-2026-09-17.webp", tag: "All seven lanes" },
      { kind: "image", src: "assets/caps/sigouin-1440-scroll0-20260917.webp", tag: "sigouin.net, the look that shipped" }
    ],
    thumbs: ["assets/process/sigouin-five-looks-2026-09-17.webp", "assets/process/sigouin-r2-polish-2026-09-17.png"],
    live: null
  }
];

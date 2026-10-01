# Asset tools for the sigouin.net portfolio hub

Research only. No generation this round. Facts below have a URL or a path on disk.

Lane model: grok-4.6. Date: 2026-09-17.

The hub should be built with these tools and should show them working. Clients see the output, not a tool list.

## 21st.dev and ui-skills MCP

**What it produces.** React plus Tailwind components, shadcn-compatible. TSX/JSX code. SVG logos from the logo search. Not png, not mp4, not glb. The site is a marketplace of 10,000+ production components, plus optional AI generation of new UI.

**Current models (2026).** 21st AI "sketch" and "code" modes, multi-model comparison on paid AI plans. The catalog itself is human-authored components, not a generative model.

**Pricing.** Free: browse, 2 copies per day, 5 Design Bug Bot reviews. Builder: $6/mo billed yearly, $8/mo billed quarterly, unlimited copy/install, unlimited MCP retrieval, no AI credits. Builder + AI: 500 / 1,000 / 2,000 credits per month at $15 / $30 / $60 yearly. Extra pack: +100 credits for $5, rolls over. Team: $7.50/seat/year billed, AI seats from $18.75. Source: https://21st.dev/pricing.md and https://help.21st.dev/ai/pricing

**Entry point.** Web: https://21st.dev. MCP: `https://21st.dev/api/mcp` with `x-api-key`. CLI: `npx @21st-dev/cli`. Luc's wired MCP is a related but different server: `https://www.ui-skills.com/mcp` (protocol mcp, tools `list_skills` and `get_skill`, registry https://www.ui-skills.com/skills/registry.json). A `list_skills` query for "bento" returned 0 skills in this session.

**Size limits.** Component code, not media. Templates sold per author. Free tier meters retrievals at 2 per day.

**License.** Copied component code is yours to ship. Templates sold by authors are bought per template. Membership copy/install is unlimited on paid plans. Commercial client work is the point of the marketplace. Confirm each author's template license before buying.

**Three portfolio uses.**

1. Bento grid for the hub index, one cell per live project. Show it as: animation of the grid assembling, then a live page.
2. Cursor-follow spotlight on the process board. Show it as: short loop of the pointer dragging light across lane cards.
3. SVG wordmark search for "SiGz" and "sigouin.net" as paste-ready JSX, then composite the real logo on top. Show it as: screenshot of the mark in the hub header.

## MotionSites

**What it produces.** Prompt text you paste into Cursor, Claude, Bolt, or Lovable. Some items ship real React/Tailwind code. Animated background videos and animated webp/gif hero previews. Not a site builder. Output of a used prompt is HTML/CSS/JS or React. Backgrounds are looping video.

**Current models (2026).** No generation model of its own. Library of 500+ premium prompts on motionsites.ai. A separate motionsites.dev library claims 1,600+ items with MCP. Do not mix the two brands. Luc's MCP name is MotionSites at motionsites.ai.

**Pricing.** motionsites.ai paid plans include commercial license. Live site "See plans" at https://motionsites.ai/unlimited. Stork.AI review (2026-07-04) listed $149/year or $239 lifetime for prompts, Power tier higher for backgrounds. motionsite.ai (different domain, similar product) listed $59/3 months, $149/year, $249 lifetime. Free accounts on motionsites.ai MCP: 3 free prompts. Paid unlocks 500+. Per-page generation cost is $0. The cost is the subscription plus the coding agent's tokens.

**Entry point.** Web: https://motionsites.ai. MCP: `https://xgdzyqfalbibzelpdpvr.supabase.co/functions/v1/mcp` (from https://motionsites.ai/mcp). This session's motionsites MCP failed to connect: auth required.

**Size limits.** Prompts are text. Background videos should be re-encoded under 3 MB for a hero loop. Cloudflare Pages caps a single file at 25 MiB.

**License.** Paid plans advertise commercial license. Do not scrape premium prompts. Use the MCP or a paid copy.

**Three portfolio uses.**

1. Hero section prompt for the hub, then rewrite it so it is Luc, not a SaaS template. Show it as: before/after of the prompt output vs the shipped hero.
2. Animated background behind the SiGz music cell. Show it as: muted looping webm under the neon sign.
3. Portfolio prompt as a starting scene list, then throw most of it away. Show it as: process board of "prompt in, Luc pick, rewrite".

## Tripo3D

**What it produces.** GLB by default, with PBR textures and a preview png. Convert to FBX, OBJ, USDZ, STL, 3MF. Quad mesh forces FBX. Optional auto-rig and animation retarget.

**Current models (2026).** H series: `v3.1-20260211` latest, `v3.0-20250812`, `v2.5-20250123`. P series P1 for game-ready mesh at a higher credit cost. Texture model `v3.5-20260815`. Luc's MCP quality flags: `high` (P2), `lowpoly` (P1), aliases `v31` / `v30` / `v25`.

**Pricing.** API: 1 credit = $0.01. H-series text to 3D: 10 credits no texture, 20 with standard texture. Image to 3D: 20 / 30. Add-ons: HD texture +10, 8K +20, HD geometry +20, quad +5, smart low-poly +10, parts +20. Auto rig 25. Convert basic 5, advanced 10. P1 is higher: text 30/40, image 40/50. Consumer Studio: Free $0 with public non-commercial models. Pro $20/mo billed yearly, 3000 credits, private, commercial. Source: https://developers.tripo3d.ai/en/pricing and https://www.tripo3d.ai/pricing

**Entry point.** REST v3: `https://openapi.tripo3d.ai/v3/generation/image-to-model` and `/generation/text-to-model`. Bearer token. Luc's MCP tools: `tripo_image_to_3d`, `tripo_text_to_3d` (both need `confirm_spend: true`), `tripo_task_status`, `tripo_balance` (free). Local wrapper: `/Users/ls/Claude-Workspace/personal/tripo-mcp/`. Do not call generate this round.

**Size limits.** Input image: PNG, JPEG, WebP, max 20 MB, min 256x256. Output poly: v3.1 triangle standard 1.5M, ultra 2M. Web/mobile target 10k to 50k faces. Smart low-poly 500 to 20k. A GLB for the hub should stay well under Cloudflare's 25 MiB per file. Prefer under 5 MB with meshopt compress.

**License.** Paid plan or paid API: you own outputs, commercial use allowed. Free Studio: Tripo keeps rights, not commercial. Do not feed copyrighted characters you do not own. Do not build a competing 3D API. Source: https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially

**Three portfolio uses.**

1. Turn the 2019 SiGz neon sign photo into a spinning GLB hero. Show it as: 3D object, auto-rotate, poster png until load.
2. Low-poly Unraid box plus a game-server tower as two GLBs on the homelab cell. Show it as: 3D object pair, click to orbit.
3. A golf flag or pin from a course photo for teetimes. Show it as: 3D object over the map, not a screenshot of the map.

## kie.ai

**What it produces.** Images (png/jpeg/webp depending on model) and videos (mp4, Seedance also mov). First/last frame jpegs on Seedance when requested. Music via Suno. Unified async jobs.

**Current models (2026).** Seedance 2.5: `bytedance/seedance-2-5`. Seedance 2.0: `bytedance/seedance-2`. Nano Banana 2 / Pro. GPT Image 2. Seedream 5 Pro. Veo 3.1. Kling 3.0. Wan 2.6. MiniMax H3. Market page announced Seedance 2.5 and Nano Banana 2. Luc's scrollcraft skill uses kie.ai, with planned rates 28 credits per still and 160 per clip in `scrollcraft/builds/sigouin-net/BRIEF.md`.

**Pricing.** Pay as you go. Reviews quote about $0.005 per credit, packs from $5. Failed jobs not charged. Live English pricing table at https://kie.ai/pricing did not yield a parseable per-model sheet in this fetch. Third-party 2026 reviews: Nano Banana 2 1K about $0.04, GPT Image 2 1K T2I about $0.03, Seedance 2.0 about $0.057/s, Veo 3.1 Quality 1080p about $1.28/video. Treat those as dated snapshots. Luc's own planned unit rates: 28 credits/still, 160 credits/clip.

**Entry point.** `POST https://api.kie.ai/api/v1/jobs/createTask` with Bearer token. Poll `Get Task Details` or set `callBackUrl`. Seedance 2.5 docs: https://docs.kie.ai/market/bytedance/seedance-2-5.md. Duration 4 to 30 s, resolution 480p / 720p / 1080p, output mp4 or mov. Prompt max 30,000 characters. Input image max 30 MB. Input video max 200 MB.

**Size limits.** Seedance 2.5 image refs: jpeg/png/webp/bmp/tiff/gif, 300 to 6000 px, under 30 MB. Video refs: mp4/mov, 2 to 30 s, under 200 MB. Hub copies must be re-encoded. Aim under 3 MB for autoplay loops.

**License.** kie.ai is a reseller of other labs' models. Commercial use follows the upstream model plus kie terms. Confirm Nano Banana / Seedance / GPT Image terms before a client-facing ad. Do not assume "API output = yours" without reading the current ToS.

**Three portfolio uses.**

1. Seedream stills of the home workspace for the personal-site scroll, already planned in scrollcraft. Show it as: video/gif of the scroll scrubbing the desk clip.
2. A 10 s Seedance clip of the tower defense garden. Show it as: muted hero loop on the Undergrowth cell.
3. Nano Banana edit of a teetimes map screenshot into a dusk mood without moving pins. Show it as: screenshot pair, original vs dusk.

## Higgsfield

**What it produces.** Images (png/webp via GPT Image 2, Nano Banana Pro, Soul, Recraft vector-like). Video (mp4 from Seedance, Kling, Veo, Grok Video). 3D via `multi_image_to_3d` (Meshy under the hood, GLB-style). Audio via Seed Audio 1.0, Sonilo, Mirelo.

**Current models (2026), from the local skill catalog and a live `higgsfield model list`.** Image defaults: `gpt_image_2`, `nano_banana_2`, `nano_banana_pro`, Soul 2.0. Video defaults in the skill: `seedance_2_0`. The live CLI list includes Seedance 1.5 Pro, Seedance 2.0, Seedance 2.0 Mini, and Seedance 2.5. 3D: `multi_image_to_3d`. Audio: `seed_audio`. Luc's prompt named Seedance 2.5 at 9 credits/second 1080p. That exact 9 cr/s figure is not on the public pages I loaded.

**Pricing.** Two products.

- App/CLI credits. Starter / Plus / Ultra. Third-party capture 2026-07-29: Starter $19 / 270 credits, Plus $59 / 1,200, Ultra $129 / 3,000. Nano Banana Pro 2 credits, 4K 4 credits. GPT Image 1 credit. Seedance 2.0 1080p 45 credits per 5 s. Higgsfield blog 2026-08-06: Seedance 2.5 on the $49 plan, 52 credits for 8 s at 720p, about $2.55. 480p same clip 24 credits. Commercial use included on paid app plans, not on Free.
- API dollars, separate balance. Seedance 2.5 from $0.0738/sec. Seedance 2.0 listed at $0.9332/sec starting. Failed requests refunded. Commercial use yes. Files kept at least 7 days. Source: https://higgsfield.ai/blog/higgsfield-api

**Entry point.** CLI: `higgsfield generate create <job_set_type> --prompt "..." --wait`. Installed at `/opt/homebrew/bin/higgsfield`. MCP for agents: `https://mcp.higgsfield.ai/mcp`. API console: https://console.higgsfield.ai/dashboard. Do not run generate this round.

**Size limits.** Seedance 2.0: 4 to 15 s, up to 4K. Seedance 2.5 on kie docs: 4 to 30 s, 480p/720p/1080p. Higgsfield blog said 2.5 generates at 480p and 720p on the app. Those two statements disagree. See Could not verify. Recraft can emit vector-like output. Hub files still need a 25 MiB Pages cap.

**License.** Paid app: commercial use included. Free app: watermark, no commercial. API: commercial products, ads, client work allowed. Source: https://higgsfield.ai/pricing and the API blog FAQ.

**Three portfolio uses.**

1. Seedance 10 s clip of the garden, 720p, then compress to webm. Show it as: video/gif on the Undergrowth cell.
2. Nano Banana Pro still of two Unraid boxes plus an AMP game server, from a real homelab photo as reference. Show it as: screenshot, then a 3 s Ken Burns.
3. Recraft SVG-like mark for RsyncGui, then drop the real logo on top if the gen lies. Show it as: SVG in the hub chrome.

## OpenAI gpt-image-2

**What it produces.** Raster images. PNG by default from the Images API. JPEG and WebP via `output_format`. Luc's `/imagegen` skill writes png. Sizes used locally: 1024x1024, 1536x1024, 1024x1536.

**Current models (2026).** Luc's skill default: `gpt-image-2`, quality medium. OpenAI docs now lead with `gpt-image-2.5-sunburst` (edits) and `gpt-image-2.5-flare` (fast everyday). `gpt-image-2` is still on the pricing table. Quality for gpt-image-2: low, medium, high. 2.5 adds xhigh and max.

**Pricing.** Official, per 1M tokens, standard: gpt-image-2 text in $5, image in $8, cached image in $2, image out $30. Same rates for 2.5 sunburst/flare. Per-image from the official calculator: gpt-image-2 1024x1024 low $0.006, medium $0.053, high $0.211. Landscape 1536x1024 high $0.165. Luc's `imagegen/costlog.py` stores those rates as of 2026-08-30. Endpoint: `POST https://api.openai.com/v1/images/generations`. Also the Responses API image tool.

**Entry point.** Luc: `python3 /Users/ls/Claude-Workspace/personal/imagegen/dopamine.py` and `remix.py`. Never open `.env`. Key lives there.

**Size limits.** Documented gpt-image-2 sizes include 1024x1024, 1024x1536, 1536x1024, plus extra sizes listed by third parties up to 3840x2160. Official customize-output section did not fully load in this fetch. Organization verification may be required.

**License.** OpenAI does not claim copyright on API outputs. You can sell them, subject to the Terms of Use and the fact that training data can still collide with real brands. Source: https://help.openai.com/en/articles/5008634-can-i-sell-images-i-create-with-dall-e (help center now titled around API copyright). Do not generate fake SiGz or LiveTVCan logos. Composite the real mark.

**Three portfolio uses.**

1. LiveTVCan marketing stills in the locked brand style prefix from the imagegen skill. Show it as: screenshot of the remix compare page, then the live livetvcan.com hero.
2. Fantasy football draft-board texture or team-tile art, medium quality 1024. Show it as: screenshot of the board with generated tiles crossed off.
3. Poster frames for every hero video, one still per project. Show it as: the LCP image, video loads after.

## Embedding: GLB on a static Cloudflare Pages site

**model-viewer.** One HTML tag. Host the GLB yourself. Orbit, auto-rotate, poster, AR. Apache 2.0. Last two evergreen browsers plus last two Safari. Bundle about 200 KB. Best for product-style heroes. CDN or self-host `model-viewer.min.js`. CORS required if the GLB is on another origin. Source: https://modelviewer.dev/

**Three.js.** Full control. `GLTFLoader` in the addons. Luc already ships Undergrowth on Three.js, so a custom viewer matches that exhibit. Cost: you write lights, camera, fallback, and a poster. Bundle much larger than model-viewer. Use it when the object must react, not just spin.

**Pick for the hub.** Default: model-viewer for one spinning object per cell. Use Three.js only for the garden, where the live game already is the exhibit.

**Pages limits.** Max 25 MiB per file. Free: 20,000 files. Paid: 100,000. Bigger media goes to R2. Source: https://developers.cloudflare.com/pages/platform/limits/

**Show it as:** 3D object with a still poster, lazy-loaded GLB.

## Embedding: hero video under 3 MB

Muted, loop, playsinline, autoplay. Unmuted autoplay is blocked.

| Codec | Container | Why | Fallback |
|---|---|---|---|
| AV1 | mp4 or webm | Smallest. ~50% vs H.264 | Safari needs hardware AV1. Put it first. |
| HEVC | mp4 `hvc1` | Good on Apple | License mess in Chrome. Second source. |
| VP9 | webm | Solid Chrome/Firefox | Safari 14.1+ |
| H.264 | mp4 | Universal last source | Largest |

Target: 6 to 10 s, 720p or less, no audio track, under 3 MB. A 5 s 480p H.264 can land near 200 KB to 1.5 MB. GIF of the same shot can be 8 MB. Do not ship GIF.

Markup pattern from https://mintec.co/blog/video-lcp-hero-performance-2026/ :

```html
<img src="poster.webp" width="1920" height="1080" decoding="async" fetchpriority="high" alt="">
<video autoplay muted loop playsinline preload="none" poster="poster.webp">
  <source src="hero-av1.mp4" type="video/mp4; codecs=av01">
  <source src="hero-hevc.mp4" type='video/mp4; codecs="hvc1"'>
  <source src="hero-h264.mp4" type="video/mp4">
</video>
```

Poster is the LCP. Video `preload="none"`. Lazy-load the file after first paint.

**Show it as:** video/gif that is actually a muted mp4/webm.

## Animated webp vs gif vs Lottie vs Rive

| Format | Typical 5 s | Transparency | Interaction | Use on this hub |
|---|---|---|---|---|
| GIF | 2 to 15 MB | Binary only | None | Never, except email |
| Animated WebP | 200 KB to 2 MB | Yes | None | Tiny loops in `<img>` |
| Lottie JSON | 10 to 150 KB | Yes | Hover, seek | Icons, loaders, line draws |
| Rive `.riv` | Small, state machine | Yes | Pointer, scroll, data bind | Process board, live meters |
| WebM/MP4 | 150 KB to 1.5 MB | WebM yes, H.264 no | Pause/seek | Filmed or generated clips |

Sources: https://www.kalex.studio/blog/lottie-vs-gif-vs-mp4-vs-webm-web-animation-formats , https://rive.app/docs/runtimes/web/web-js

Rive runtime: `@rive-app/webgl2`, canvas tag, `autoplay`, `stateMachine`. Good for a workbench that reacts to scroll. Lottie is simpler if the motion is a After Effects export.

**Show it as:** animation for UI chrome, video for filmed or generated scenes.

## Keep a heavy visual site fast

1. Poster webp with `fetchpriority="high"` for every hero. Video does not start the LCP clock if a poster is there.
2. `preload="none"` on video. IntersectionObserver starts the download when the cell is near the viewport.
3. GLB: poster png, then model-viewer `loading="lazy"`. Keep faces under 50k for mobile.
4. Serve AV1 then H.264. Do not make Safari download AV1 it cannot play. The `type` attribute on `<source>` stops that.
5. Cloudflare cache plus immutable hashes in filenames. Luc already learned this on LiveTVCan: rename, never overwrite, 4 h cache.
6. R2 for anything over a few MB. Pages 25 MiB is a hard wall, not a goal.
7. One autoplay video on first paint. The rest wait.
8. Prefer Lottie/Rive for chrome. Generated video is the expensive byte.
9. Preload only the first poster and the font. Nothing else.
10. Measure LCP on a mid phone. If the poster is over 100 KB, shrink it.

Sources: https://mintec.co/blog/video-lcp-hero-performance-2026/ , https://evilmartians.com/chronicles/better-web-video-with-av1-codec , https://developers.cloudflare.com/pages/tutorials/use-r2-as-static-asset-storage-for-pages/

## Exhibit table

Cost is one approved asset, not a full retry budget. Effort is hub-embed work after the asset exists.

| # | Exhibit idea | Project | Tool | Est. cost | Format | Effort | Show it as |
|---|---|---|---|---|---|---|---|
| 1 | Spinning neon sign from 2019 photo | SiGz music | Tripo image-to-3D v3.1, textured | 30 credits, $0.30 API | glb + poster png | med | 3D object |
| 2 | Encrypted HLS / waveform still | SiGz music | gpt-image-2 medium 1536x1024 | ~$0.04 | webp poster | low | screenshot |
| 3 | 10 s garden flyover | Undergrowth | Higgsfield Seedance 2.5 720p 8 to 10 s | ~52 to 65 app credits, ~$2.50 | mp4 then webm+h264 under 3 MB | med | video/gif |
| 4 | Live game iframe | Undergrowth | none, already Three.js | $0 | live embed | low | live data feed |
| 5 | Golf pin GLB over the map | teetimes | Tripo from a course photo, low-poly | 30 credits + 10 smart low-poly = $0.40 | glb < 2 MB | med | 3D object |
| 6 | Dusk map still | teetimes | kie Nano Banana edit | ~$0.04 to $0.09 | webp | low | screenshot |
| 7 | Draft board tiles | fantasy football | gpt-image-2 medium 1024 | ~$0.05 each, 8 tiles ~$0.40 | png | med | screenshot |
| 8 | Cross-off loop | fantasy football | Higgsfield Seedance 5 s of a hand crossing a name | ~24 to 52 credits | webm | med | video/gif |
| 9 | Brand hero still | IPTV / livetvcan | gpt-image-2 via /imagegen remix, locked style | ~$0.05 | png on Pages | low | screenshot |
| 10 | Cursor-follow or bento of products | IPTV | 21st.dev component | $0 if copied on Builder, else 2/day free | TSX | med | animation |
| 11 | Two Unraid boxes + AMP tower | homelab | Tripo two GLBs | ~$0.60 | glb pair | med | 3D object |
| 12 | Homelab photo to cinematic still | homelab | Higgsfield Nano Banana Pro | 2 credits | webp | low | screenshot |
| 13 | Backup job filmstrip | RsyncGui | kie Seedance of the UI, or a screen recording, no gen | $0 if recorded, ~160 kie credits if gen | webm | low | video/gif |
| 14 | Recraft mark, then real logo on top | RsyncGui | Higgsfield Recraft V4.1 | ~1 credit | svg | low | screenshot |
| 15 | Scrollcraft desk clip | personal site | kie Seedream still + 1 clip, already planned 328 credits | 328 credits at Luc's unit rates | png + mp4 | med | video/gif |
| 16 | Hub bento grid | personal site | 21st.dev bento + MotionSites hero prompt as a start | $6/mo Builder, MotionSites subscription | TSX | high | animation |
| 17 | Canvas of 9 lanes competing | fleet process | screen recording, then AV1 under 3 MB | $0 | webm+mp4 | med | process board |
| 18 | Workbench board live | fleet process | iframe of workbench.html, Rive for lane-state dots | $0 plus Rive author time | riv or css | med | live data feed |
| 19 | Verify gate going red then green | fleet process | Lottie of a stamp, plus a real terminal gif | $0 | json + webm | low | animation |
| 20 | Seedance of the CNVS canvas itself | fleet process | Higgsfield Seedance from a canvas screenshot | ~52 credits | webm | med | video/gif |

## Local evidence, read-only

- Higgsfield catalog: `/Users/ls/.claude/skills/higgsfield-generate/references/model-catalog.md`
- Higgsfield skill: `/Users/ls/.claude/skills/higgsfield-generate/SKILL.md`
- Imagegen skill: `/Users/ls/.claude/skills/imagegen/SKILL.md`
- Cost table: `/Users/ls/Claude-Workspace/personal/imagegen/costlog.py` rates as of 2026-08-30
- Scrollcraft kie plan: `/Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/BRIEF.md` lines 170 to 182
- Tripo MCP on this canvas: tools `tripo_image_to_3d`, `tripo_text_to_3d` require `confirm_spend`
- ui-skills MCP: `https://www.ui-skills.com/mcp`

## URL list (26)

1. https://21st.dev/pricing.md
2. https://21st.dev/pricing
3. https://help.21st.dev/ai/pricing
4. https://www.ui-skills.com/mcp
5. https://raw.githubusercontent.com/21st-dev/magic-mcp/main/skills/21st-ui/SKILL.md
6. https://motionsites.ai/
7. https://motionsites.ai/mcp
8. https://www.stork.ai/en/motionsites-ai
9. https://developers.tripo3d.ai/en/pricing
10. https://developers.tripo3d.ai/en/docs/generation-image-to-model/standard
11. https://www.tripo3d.ai/pricing
12. https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially
13. https://docs.kie.ai/market/bytedance/seedance-2-5.md
14. https://kie.ai/pricing
15. https://www.bitdoze.com/kie-ai-review/
16. https://higgsfield.ai/blog/higgsfield-api
17. https://higgsfield.ai/blog/seedance-2-5-pricing-2026
18. https://higgsfield.ai/pricing
19. https://developers.openai.com/api/docs/pricing
20. https://developers.openai.com/api/docs/guides/image-generation
21. https://help.openai.com/en/articles/5008634-can-i-sell-images-i-create-with-dall-e
22. https://modelviewer.dev/
23. https://developers.cloudflare.com/pages/platform/limits/
24. https://mintec.co/blog/video-lcp-hero-performance-2026/
25. https://www.kalex.studio/blog/lottie-vs-gif-vs-mp4-vs-webm-web-animation-formats
26. https://rive.app/docs/runtimes/web/web-js

## Could not verify

- Higgsfield Seedance 2.5 at "9 credits/second 1080p". Not on the pages I loaded. Closest official Higgsfield number: 52 credits for 8 s at 720p on the $49 plan. 1080p per-second credit rate for 2.5 was not on that blog. The CLI list includes Seedance 2.5, but I did not run `higgsfield model get` for the credit schema.
- kie.ai live per-model USD table. https://kie.ai/pricing loaded as a shell. Korean/Japanese mirrors listed Qwen and MiniMax H3, not Seedance 2.5. Luc's 28/160 credit unit rates are from his BRIEF, not from a 2026-09-17 kie price row.
- OpenAI gpt-image-2 extra sizes beyond 1024/1536. Official customize-output section truncated. Third parties list 1920x1080 up to 4K. I did not confirm 4K on the Images API itself.
- 21st.dev per-generation credit burn for sketch vs code. Help page says "Credits" without a number per call.
- MotionSites live dollar price on motionsites.ai/unlimited. The page is a CTA. I used Stork.AI's July 2026 snapshot and the MCP page's "3 free prompts".
- ui-skills registry contents. `list_skills` for "bento" returned 0. I did not dump the full registry.
- Motionsites MCP tools. Server status: auth required. No tool list this session.
- Tripo P2 vs P1 vs H3.1 naming in Luc's MCP versus the public v3.1-20260211 slug. MCP says quality `high` is P2. Public H-series docs use `v3.1-20260211`. I did not spend a credit to see which id the MCP actually sends.
- kie.ai and Higgsfield full Terms of Use PDFs. Commercial claims above are from help/FAQ pages, not a lawyer-read of the contracts.
- Exact dollar value of one Higgsfield app credit on Luc's current plan. It depends on Starter vs Plus vs Ultra. I did not call `higgsfield account` in case it is noisy, and I did not open `.env`.
- Animated AVIF support as a GIF killer. Mentioned in 2025 blogs. I did not retest Safari 2026.
- Rive commercial license for a client-facing hub. Runtime is open. Editor files may need a Rive plan. Not confirmed.

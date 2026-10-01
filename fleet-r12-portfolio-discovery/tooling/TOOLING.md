# TOOLING.md: how Luc builds

Lane TOOLING, round 12 portfolio discovery. Every row below carries a path on disk.
Scope: personal workspace, CNVS, Fleet-Machine. Nothing under `work/` was read.
Date of scan: 2026-09-17.

---

## 1. Orchestration model

The pattern is one lead agent that never does the work, several single-task workers that do,
a machine check on every task, and a live board the human watches.

**The five parts**

| Part | What it is | Evidence path |
|---|---|---|
| Orchestrator | Always Claude Fable 5. Splits the task, writes the rubric, spawns workers, never edits a file itself. If the session is not Fable 5, it spawns one and hands over the lead. | `/Users/ls/.claude/skills/fleet/SKILL.md` (roles table), `/Users/ls/.claude/CLAUDE.md` (Fleet playbook) |
| Workers | One task, one fresh spawn, one owned folder. Picked per task from claude (Opus), codex, kimi (K3), grok, qwen. Never reused for a second task. Never two writers on the same files. | `/Users/ls/.claude/skills/fleet/SKILL.md` (who gets which task) |
| Verify gate | Every spawn carries a shell command. Done means the worker reported AND the command exited 0. Gates are read-only and are mutant tested before they are trusted. | `/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/check-lane.py`, `/Users/ls/Claude-Workspace/personal/undergrowth-v2/fleet-r1-foundation/`, `/Users/ls/.claude/CLAUDE.md` (Done means verified) |
| Result contract | Each worker writes `REPORT.md` plus `result.json` with state, model requested vs effective, files, verify cmd and exit code, and an `unverified` list. The board reads model from here because the CNVS ledger has no model field. | `/Users/ls/.claude/skills/fleet/SKILL.md` (result.json schema), 91 `result.json` files on disk |
| Workbench board | A single HTML page, live from the first spawn, showing every worker, task, model, state, verify command and cost. Not a diary written afterwards. | `/Users/ls/Claude-Workspace/Fleet-Machine/workbench/workbench.html` (565 KB), `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r3-live/board/board.py` |
| CNVS canvas | macOS canvas of live agent terminal nodes, browser nodes, markdown readers and shared memory. Workers are visible nodes, not hidden subprocesses. Fleet is the default mode inside CNVS. | `/Users/ls/Claude-Workspace/cnvs/CLAUDE.md`, `/Applications/CNVS.app/Contents/MacOS/cnvsctl` |

**Rules that shaped it, with dates**

- 2026-08-30: scorer agents existed and graded competing builds out of 10 against a rubric, gate 8.5.
  Evidence: `/Users/ls/Claude-Workspace/Fleet-Machine/STATUS.md` round 2, claude 9.25 PASS vs kimi 8.42 FAIL.
- 2026-09-08: scorer agents retired. The gate became the verify command, the worker's own self check
  against the rubric, and Luc's eye. Rubrics are still written before spawning.
  Evidence: `/Users/ls/.claude/skills/fleet/SKILL.md` line block "NO SCORER AGENTS".
- 2026-08-30: wide fan-out by default was dropped. Fan out only when tasks own separate folders.
  Evidence: same file, "who gets which task".
- 2026-08-30: codex is out of UI contests after scoring 6.42 in an earlier round. UI goes to kimi plus claude.
  Evidence: same file.
- Claude workers are always Opus, never Sonnet. Non-Claude CLIs run at their highest model and effort.
  Evidence: `/Users/ls/.claude/CLAUDE.md` (effort level per spawned agent).
- Fleet-Machine itself exists because Luc said he got lost in what was running.
  Evidence: `/Users/ls/Claude-Workspace/Fleet-Machine/BRIEF.md`, quote block under "Why this project exists".

**Show it as:** an animated diagram of the six parts with a real board screenshot dropped in the
middle, plus the one-screen flow page already built at
`/Users/ls/Claude-Workspace/Fleet-Machine/how-the-fleet-works.html` (2.6 KB, emoji stop map).

---

## 2. Tool table

### 2a. Agent CLIs installed

| CLI | Path | Role in the fleet | Used on | Show it as |
|---|---|---|---|---|
| claude | `/opt/homebrew/bin/claude` | Orchestrator (Fable 5) and worker (Opus). Bulk mechanical edits, reviews, UI contests. | Every round. `undergrowth-v2/fleet-r1-foundation/`, `sigouin-net/fleet-r9-signature/` | Terminal replay gif of a spawn to done |
| codex | `/opt/homebrew/bin/codex` | Reviews, audits, forensics, tooling scripts. Out of UI contests since 2026-08-30. | `Fleet-Machine/fleet-r1-discovery/codex-ledger/`, `IPTV/livetvcan-website/fleet-p1-review/codex-review/` | Side by side review diff |
| kimi | `/Users/ls/.local/bin/kimi` | UI build and polish, competing against claude on the same brief. | `archive/sigzmusic-landing/kimi-a..e/`, `undergrowth-v2/fleet-r3-polish/a/` (kimi-code/k3) | Two lanes rendered side by side |
| grok | `/Users/ls/.local/bin/grok` | Research sweeps and reference hunting. | `Fleet-Machine/fleet-r1-discovery/grok-observability/`, `Fleet-Machine/fleet-r8-workbench-look/grok-agentboards/` (grok-4.6) | Source count callout, 45 sources in one report |
| qwen | `/opt/homebrew/bin/qwen` | Extra lane in build-offs. | `cnvs/widgetmart/fleet-r1-test/qwen/dashboard.html` (24 KB) | Screenshot of the qwen lane next to the claude lane |
| opencode | `/opt/homebrew/bin/opencode` | Installed. No fleet round on disk used it. | none found | Skip unless a round adopts it |
| higgsfield | `/opt/homebrew/bin/higgsfield` | Image, video, brandkit and game asset generation behind the higgsfield skills. | `archive/sigouin-net-fleet-2026-09-02/fleet-r2-polish/` (7 photos) | Generated asset strip |
| cnvsctl | `/Applications/CNVS.app/Contents/MacOS/cnvsctl` | The canvas control CLI. Spawns tracked agents, opens browser nodes, reads the task ledger. | Every CNVS round | Screen recording of nodes appearing on the canvas |

### 2b. MCP servers

| Server | Type | Endpoint or command | Purpose | Show it as |
|---|---|---|---|---|
| motionsites | http | `https://xgdzyqfalbibzelpdpvr.supabase.co/functions/v1/mcp` | Motion design prompt library, searched for reference animations. | Motion reference reel |
| tripo3d | stdio | `uv run --script /Users/ls/Claude-Workspace/personal/tripo-mcp/server.py` | Image to 3D and text to 3D via the Tripo v3 REST API. Hand written, about 300 lines, because the official server has no API key path and the community package would hold the key in unvetted npm code. | Rotating 3D object on the page, generated live |
| ui-skills | http | `https://www.ui-skills.com/mcp` | 21st.dev style component library served as skills. | Component gallery still |
| cnvs | stdio | CNVS app | Canvas control from inside a session: spawn agent, open browser, screenshot, shared memory. | Canvas screenshot |

Evidence: `/Users/ls/.claude.json` mcpServers block, `/Users/ls/Claude-Workspace/personal/tripo-mcp/README.md`.
No env values were read.

### 2c. Skills (52 installed, `/Users/ls/.claude/skills/`)

Purpose lines are the skill's own description, trimmed. Project column names a place on disk
where output of that skill exists, or "no round on disk" when none was found.

| Skill | Purpose | Project that used it | Evidence path | Show it as |
|---|---|---|---|---|
| fleet | Run several AI coders at once on CNVS. The orchestration contract itself. | every fleet round | `/Users/ls/.claude/skills/fleet/SKILL.md` | Process board |
| scrollcraft (plugin) | Build a scroll driven landing page, interview first, signature move per build, no two builds share a skeleton. | sigouin.net, sigz console | `/Users/ls/Claude-Workspace/personal/scrollcraft/FINGERPRINTS.md` | Scroll capture video |
| imagegen | Drop mode and remix mode image generation with a live gallery node. | sigzmusic artwork lab | `/Users/ls/Claude-Workspace/personal/imagegen/` | Generated image wall |
| img2threejs | Reference image to a procedural, animation ready Three.js model built in code. | no round on disk | `/Users/ls/.claude/skills/img2threejs/SKILL.md` | 3D object on the page |
| impeccable | Frontend design, critique, polish, motion, accessibility, tokens. | sigouin.net rounds | `/Users/ls/.claude/skills/impeccable/SKILL.md` | Before and after pair |
| new-ui | Plan, theme, build, evaluate, polish a new page or component. | IPTV admin, undergrowth | `/Users/ls/.claude/skills/new-ui/SKILL.md` | Build timeline |
| redesign-skill | Full visual overhaul of an existing UI, strips AI template patterns. | sigzmusic music page | `/Users/ls/Claude-Workspace/personal/archive/sigzmusic-redesign-music-page/` | Before and after pair |
| modify-design | Router for vague design improvement requests. | sigzmusic | `/Users/ls/.claude/skills/modify-design/SKILL.md` | Skip, internal |
| evaluate-ui | Three lens UI audit: technical, UX critique, Nielsen heuristics with severity. | sigzmusic, IPTV | `/Users/ls/.claude/skills/evaluate-ui/SKILL.md` | Severity scorecard |
| verify-live | Deploy then prove it on the live endpoint before saying done. | livetvcan, teetimes, sigzmusic | `/Users/ls/.claude/skills/verify-live/SKILL.md` | Terminal replay of curl plus shasum match |
| push | Pre-flight checked push to GitHub with commit review. | undergrowth, teetimes | `/Users/ls/.claude/skills/push/SKILL.md` | Skip, internal |
| connect-service | Onboard a new API credential: env location, read-only verify call, registry entry. | teetimes, homelab | `/Users/ls/Claude-Workspace/.services.md` | Skip, internal |
| unslop | Cut AI tells from any writing. Applies to every reply. | IPTV `fleet-wb-unslop/` | `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/fleet-wb-unslop/editor/REPORT.md` | Before and after text pair |
| grilling / grill-me | Relentless interview that stress tests a plan before building. | sigouin.net direction | `/Users/ls/.claude/skills/grilling/SKILL.md` | Quote card of one hard question |
| grill-skill / evaluate-skill | Design, run and interpret a skill eval, pass@k scoring. | `cnvs/scratch/skill-eval-2026-09-16/` | `/Users/ls/Claude-Workspace/cnvs/scratch/skill-eval-2026-09-16/` | Pass rate chart |
| higgsfield-generate | Images, video, 3D, audio via Higgsfield. | sigouin.net r2 photos | `/Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02/` | Generated asset strip |
| higgsfield-brandkit | Full visual identity: palette, SVG marks, type, mockups, brandbook. | widgetmart | `/Users/ls/Claude-Workspace/cnvs/widgetmart/brandkit/` (6 review pages) | Brand board screenshot |
| higgsfield-product-photoshoot | Brand quality product and lifestyle imagery. | no round on disk | `/Users/ls/.claude/skills/higgsfield-product-photoshoot/SKILL.md` | Product still |
| higgsfield-game-generation | Playable browser games plus sprites, textures, animated 3D, SFX. | undergrowth adjacent | `/Users/ls/.claude/skills/higgsfield-game-generation/SKILL.md` | Sprite sheet |
| higgsfield-video-explainer | Narrated explainer video built from ordered 10 second blocks. | no round on disk | `/Users/ls/.claude/skills/higgsfield-video-explainer/SKILL.md` | Explainer clip |
| higgsfield-websites | Full stack sites as one Cloudflare Worker, React 19 plus TanStack Start. | no round on disk | `/Users/ls/.claude/skills/higgsfield-websites/SKILL.md` | Skip |
| higgsfield-soul-id | Train a Soul Character for identity faithful generation. | no round on disk | `/Users/ls/.claude/skills/higgsfield-soul-id/SKILL.md` | Skip |
| higgsfield-marketplace-cards | Marketplace listing image sets. | no round on disk | same folder | Skip |
| higgsfield-youtube-thumbnail | High click through thumbnails and vertical covers. | no round on disk | same folder | Skip |
| motion-design | Adapt motion gallery prompts or recreate a supplied video. | no round on disk | `/Users/ls/.claude/skills/motion-design/SKILL.md` | Motion clip |
| cloudflare | Workers, Pages, KV, D1, R2, Vectorize, Workers AI. | sigzmusic, teetimes, IPTV | `/Users/ls/.claude/skills/cloudflare/SKILL.md` | Architecture diagram |
| wrangler | The Workers CLI for deploy and resource management. | teetimes, undergrowth | `/Users/ls/Claude-Workspace/personal/teetimes/v0.1/deploy/deploy.sh` | Deploy log replay |
| workers-best-practices | Reviews and authors Worker code against production practices. | teetimes review lane | `/Users/ls/Claude-Workspace/personal/teetimes/v0.1/review/REPORT.md` | Findings list |
| durable-objects | Stateful coordination objects, SQLite storage, alarms, WebSockets. | no round on disk | `/Users/ls/.claude/skills/durable-objects/SKILL.md` | Skip |
| agents-sdk | Stateful agents and durable workflows on Workers. | no round on disk | `/Users/ls/.claude/skills/agents-sdk/SKILL.md` | Skip |
| sandbox-sdk | Sandboxed code execution apps. | no round on disk | `/Users/ls/.claude/skills/sandbox-sdk/SKILL.md` | Skip |
| cloudflare-email-service | Email sending and routing from Workers, SPF DKIM DMARC. | no round on disk | `/Users/ls/.claude/skills/cloudflare-email-service/SKILL.md` | Skip |
| turnstile-spin | End to end Cloudflare Turnstile setup: widget, Worker, verify. | IPTV | `/Users/ls/.claude/skills/turnstile-spin/SKILL.md` | Skip |
| web-perf | Core Web Vitals measurement via Chrome DevTools MCP. | no round on disk | `/Users/ls/.claude/skills/web-perf/SKILL.md` | Vitals gauge |
| install-anti-slop | Install and update vendored anti-slop Oxlint plugins. | no round on disk | `/Users/ls/.claude/skills/install-anti-slop/SKILL.md` | Lint output |
| debug | Ultra-think root cause, fix, regression test pipeline. | sigzmusic fix rounds | `/Users/ls/.claude/skills/debug/SKILL.md` | Skip |
| refactor | Explain, refactor, simplify with tests between steps. | no round on disk | `/Users/ls/.claude/skills/refactor/SKILL.md` | Skip |
| feature-dev | Parallel code-explorer agents map the codebase, then build. | no round on disk | `/Users/ls/.claude/skills/feature-dev/SKILL.md` | Skip |
| pr-review | Five parallel review agents on a GitHub PR, confidence filtered. | no round on disk | `/Users/ls/.claude/skills/pr-review/SKILL.md` | Fan-out diagram |
| end-session | Audits and improves CLAUDE.md files with session learnings. | workspace CLAUDE.md files | `/Users/ls/.claude/skills/end-session/SKILL.md` | Skip |
| memory-sweep | Set to off. Memory system disabled 2026-08-31. | n/a | `/Users/ls/.claude/CLAUDE.md` memory section | Skip |
| update-cheatsheet | Rebuilds the IHSI-HQ cheatsheet by scanning skills, agents, hooks. | work side, not read | `/Users/ls/.claude/skills/update-cheatsheet/SKILL.md` | Skip |
| amp | Create and configure CubeCoders AMP game server instances, backups, widgets, monitors. | homelab | `/Users/ls/Claude-Workspace/personal/homelab/` | Dashboard widget screenshot |
| homepage-widget | Build a gethomepage widget for a self hosted app, native or customapi. | homelab, archived widget configs | `/Users/ls/Claude-Workspace/personal/archive/README.md` rows for homepage widgets | Dashboard tile |
| swiftui-liquid-glass | iOS 26 Liquid Glass API adoption and review. | OpenArr, archived | `/Users/ls/Claude-Workspace/personal/archive/OpenArr-source-2026-08-19.tar.gz` | Skip, screenshots gone |
| swiftui-iphone-duo | Adapt SwiftUI layouts for the foldable iPhone Duo. | no round on disk | `/Users/ls/.claude/skills/swiftui-iphone-duo/SKILL.md` | Skip |
| class-create | Build the runnable project a Chase AI+ lesson teaches. | archived chase-ai | `/Users/ls/Claude-Workspace/personal/archive/README.md` row `chase-ai/` | Skip |
| transcript | Pull YouTube captions, make study notes, refresh the local site. | archived chase-ai | same row | Skip |
| audit-script, manage-report, org-report | Work side skills. Not read this round by lane rule. | work, out of scope | n/a | Skip |
| chisle (plugin) | Maximum signal minimum noise mode for prose and code. | this session | `/Users/ls/.claude/skills/` plugin listing | Quote card |
| last30days (plugin) | Research a topic across Reddit, X, YouTube, TikTok, HN, Polymarket, GitHub, web. | `cnvs/github-trending-aug2026.html` | `/Users/ls/Claude-Workspace/cnvs/github-trending-aug2026.html` (11 KB) | Research page screenshot |
| ouroboros (plugin) | Interview, seed, run, evaluate, evolve loop with its own MCP tools. | no round on disk | plugin listing | Skip |
| reticle (plugin) | Drives and verifies a running web app from the inside. | no session connected | plugin listing | Skip |

### 2d. Subagent definitions (20, `/Users/ls/.claude/agents/`)

Personal or general: `code-architect`, `code-explorer`, `code-reviewer`, `context-manager`,
`feature-dev-reviewer`, `search-specialist`, `security-auditor`, `vibecoding-security`.
Work scoped, named only: `autoelevate`, `halopsa`, `hudu`, `inhouse-sysadmin`, `lucos`, `mdt`,
`microsoft365`, `nerdio`, `ninjaone`, `prospect-research`, `sentinelone`, `unifi`.

`vibecoding-security` is the one with visible output: a 48 check read-only audit drawn from
real 2026 vibe coding incidents, every finding carrying a file and line.
Evidence: `/Users/ls/Claude-Workspace/personal/sigzmusic/security-audit/workbench.html` (21 KB),
`/Users/ls/Claude-Workspace/personal/RsyncGui/security-audit/workbench.html` (28 KB).
**Show it as:** the security audit board screenshot with finding counts.

### 2e. Hooks (`/Users/ls/.claude/hooks/`)

Live, 4 files:

| Hook | Purpose | Show it as |
|---|---|---|
| `cnvs-browser-redirect.sh` | Inside CNVS, rewrites a bare `open <url>` into a canvas browser node so pages never steal a desktop window. Denies what it cannot rewrite safely. | Canvas screenshot with a browser node |
| `subagent-cnvs-redirect.sh` | Blocks the invisible built-in subagent tool inside CNVS so every worker appears as a real, watchable terminal node. | Canvas screenshot, many nodes |
| `session-mode-banner.sh` | Prints which workspace mode a session started in: work, personal, cnvs or global. | Terminal still |
| `homelab-allow-writes.sh` | Opens a time boxed, TTY gated write window for homelab APIs. Cannot be armed by an agent. | Skip, internal |

Disabled but kept, 12 files in `/Users/ls/.claude/hooks/disabled/`: `block-env-files.sh`,
`block-lock-files.sh`, `cnvs-browser-guard.sh`, `cnvs-project-jail.sh`,
`dangerous-command-guard.sh`, `halo-delete-guard.sh`, `homelab-api-guard.sh`,
`memory-correction-nudge.sh`, `memory-distiller.sh`, `memory-heartbeat.sh`,
`memory-inbox-check.sh`, `workspace-isolation.sh`.

**Show it as:** a two column "on / parked" panel. The story is that guardrails were deliberately
removed on 2026-08-04 and only four were brought back.
Evidence: `/Users/ls/.claude/CLAUDE.md` (Guardrail status).

---

## 3. Fleet rounds ledger

Lane counts are subdirectories of the round folder. Model column lists what the lanes'
`result.json` files actually recorded. "not recorded" means the field was absent.

### sigzmusic (12 GB source audio site, Worker plus D1 plus R2)

| Round | Date | Lanes | Models recorded | Winner | Verify | Reports |
|---|---|---|---|---|---|---|
| `archive/sigzmusic-landing/` | 2026-08-12 | 9 (claude, codex, grok, kimi-a..e, neon-remix) | not recorded | closed, shipped | not recorded | `archive/sigzmusic-landing/*/REPORT.md` |
| `archive/sigzmusic-redesign-music-page/` | 2026-08-17 | lane-a, lane-e plus scoring | not recorded | lane E editorial scored 9.8 | SCORES.md present | `archive/sigzmusic-redesign-music-page/SCORES.md` |
| `fleet-fix-review-findings/` | 2026-08-17 | 5 (frontend-player, publisher, secrets-auth, tests-gate, worker-data) | not recorded | n/a, fix round | per lane | `sigzmusic/fleet-fix-review-findings/*/REPORT.md` |
| `fleet-mobile-rebuild/` | 2026-08-17 | 5 (claude-a, claude-b, kimi-a, kimi-b, baseline-backup) | not recorded | Luc picked by eye | per lane | same pattern |
| `fleet-mobile-chrome/` | 2026-08-17 | 5 (claude-chrome, claude-density, kimi-chrome, kimi-density, merged) | not recorded | merged lane shipped | per lane | same pattern |
| `fleet-vibe-fix/` | 2026-08-17 | 8 (lane-a..e, backup, followup, smoke) | not recorded | n/a | smoke lane | same pattern |
| `artwork-lab/` | 2026-08-19 | 3 (art, research, tools) | not recorded | see SCORES.md | RUBRIC.md present | `sigzmusic/artwork-lab/REPORT.md`, `SCORES.md` |
| `fleet-loose-ends/` | 2026-08-21 | 8 (all-tweaks, cardnav, deeplink, home-meta-trim, home-trim, r2-token, transition-fix, url-remap) | not recorded | n/a | per lane | same pattern |
| `archive/sigzmusic-swipe-transition/` | 2026-08-21 | 3 (a curtain, b through the waveform, c cut the power) | not recorded | none, Luc kept the live tap-through | `verify-lane.sh` | `archive/sigzmusic-swipe-transition/lanes/*/REPORT.md` |
| `security-audit/` | 2026-08-22 | 3 | not recorded | n/a | board | `sigzmusic/security-audit/workbench.html` |

### livetvcan (IPTV, React plus Vite plus Pages Functions)

| Round | Date | Lanes | Winner | Verify | Reports |
|---|---|---|---|---|---|
| `fleet-p1-review/` | 2026-08-31 | 3 (claude-review, codex-review, scoring) | both reviews merged | `python3 ../gate.py <lane>` exit recorded | `fleet-p1-review/*/REPORT.md`, `scoring/SCORES.md` |
| `fleet-p1-fix/` | 2026-08-31 | 2 (fixer, scoring) | fixer | `npm run lint && npm run build` | `fleet-p1-fix/fixer/REPORT.md` |
| `fleet-p1-fix2/` | 2026-08-31 | 2 | fixer | `npm run lint && npm run build` | `fleet-p1-fix2/fixer/REPORT.md` |
| `fleet-wb-merge/` | 2026-08-31 | 2 (builder, scoring) | builder | `python3 fleet-wb-merge/gate-wb.py` | `fleet-wb-merge/builder/REPORT.md` |
| `fleet-wb-unslop/` | 2026-08-31 | 1 (editor) | editor | `python3 fleet-wb-unslop/gate-unslop.py` | `fleet-wb-unslop/editor/REPORT.md` |
| `fleet-admin-fixes/` | 2026-09-06 | 3 (admin-ui, backend-bouquet, plus gate) | both | exit 0 recorded | `fleet-admin-fixes/*/REPORT.md` |
| `reports/fleet-100x/` | 2026-08-31 | board plus rubric plus scores | n/a | n/a | `reports/fleet-100x/SCORES.md` |

All paths above are under `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/`.

### sigouin.net (this site)

| Round | Date | Lanes | Verify script | Notes |
|---|---|---|---|---|
| `archive/.../fleet-r1-site/` | 2026-09-01 | 5 (lane-a, lane-b, lane-c, scoring, assets) | `check-lane.py` | lane-c won 9.0, blind scored |
| `archive/.../fleet-r2-polish/` | 2026-09-02 | 1 worker | `check-r2.py` | lane-c polished with 7 Higgsfield photos |
| `fleet-r3-scroll/` | 2026-09-02 | 1 worker | `check-scroll.py` | the scrollcraft lane Luc picked |
| `archive/.../fleet-r4-layered/` | 2026-09-02 | 1 worker, 2 builds | `check-scroll.py` run twice | 494 kie.ai credits, both closed |
| `fleet-r5-hero/` | 2026-09-02 | 1 worker | `check-hero.py` | |
| `fleet-r6-seam/` | 2026-09-02 | 1 worker | `check-hero.py` | |
| `fleet-r7-folio-cable/` | 2026-09-02 | 1 worker | `check-r7.py` | |
| `fleet-r8-stuck/` | 2026-09-02 | 1 worker | `check-r7.py` | |
| `fleet-r9-signature/` | 2026-09-02 | 1 (light) plus 3 archived losers (object, ink, depth) | `check-sig.py` | light won, three variants closed |
| `fleet-r10-near/` | 2026-09-02 | 1 worker | round check script | |
| `fleet-r11-near3/` | 2026-09-02 | 3 (a, b, c) | round check script | |
| `fleet-r12-portfolio-discovery/` | 2026-09-17 | 5 (ai-assets, awwwards, inventory, process-showcase, tooling) | `check-lane.py` | this round |

Root: `/Users/ls/Claude-Workspace/personal/sigouin-net/`, archive under
`/Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02/` (959 MB plus 1.0 GB extension).

### undergrowth-v2 (browser tower defense, Three.js plus Vite, live on Pages)

Every lane here recorded its model. This is the cleanest ledger on disk.

| Round | Date | Lanes | Models | Verify |
|---|---|---|---|---|
| `fleet-r1-foundation/` | 2026-09-07 | format, sim, scorer | claude-opus-5 x2, claude-fable-5 | exit 0 all three |
| `fleet-r2-design/` | 2026-09-07 | design, scorer | claude-opus-5, claude-fable-5 | exit 0 |
| `fleet-r3-polish/` | 2026-09-11 | a, b, scorer | kimi-code/k3, claude-opus-5, claude-fable-5 | exit 0 |
| `fleet-r4-ship/` | 2026-09-07 | ship, scorer | claude-opus-5, claude-fable-5 | exit 0 |
| `fleet-r5-layout/` | 2026-09-07 | layout, scorer | claude-opus-5, claude-fable-5 | exit 0 |
| `fleet-r6-art/` | 2026-09-08 | board, enemies, icons, towers, integrate, scorer | gpt-6-astra x4, claude-opus-5, claude-fable-5 | exit 0 all six |
| `fleet-r7-medieval/` | 2026-09-08 | board, enemies, icons, towers, integrate, theme, scorer | gpt-6-astra x5, claude-opus-5, claude-fable-5 | exit 0 all seven |

Root: `/Users/ls/Claude-Workspace/personal/undergrowth-v2/`.
Gates before any commit: `npm test`, `tests/golden.mjs`, `tests/balance-gate.mjs`,
`tests/layout-gate.mjs`, `tests/browser.mjs`, `tests/mobile-layout.mjs`.
Evidence: `/Users/ls/Claude-Workspace/personal/CLAUDE.md` undergrowth-v2 row.

### Fleet-Machine (the project that redesigned the process itself)

| Round | Date | Lanes | Models | Result |
|---|---|---|---|---|
| `fleet-r1-discovery/` | 2026-08-30 | 5 (grok-observability, grok-efficiency, codex-ledger, codex-cnvs, claude-workbench) | grok x2, codex high x2, claude opus | all five verified. Forensics rebuilt a 51 task timeline from the CNVS ledger |
| `fleet-r2-workbench/` | 2026-08-30 | 3 (claude, kimi, scorer) | claude opus, kimi K3, claude fable-5 scorer | claude 9.25 PASS, kimi 8.42 FAIL. Claude ships. 316 KB page, 60 task cards |
| `fleet-r3-live/` | 2026-08-30 | 2 (shots, board) | codex gpt-5.6 high x2 | both exit 0. Board self updates every 15 s |
| `fleet-r4-ops/` | 2026-08-30 | 3 (cost, preflight, plus) | not recorded | exit 0 |
| `fleet-r5-rating/` | 2026-08-30 | 4 (grok, kimi, qwen, synthesis) | not recorded | exit 0, produced RATING-SYSTEM-v1.md |
| `fleet-r6-liveworkbench/` | 2026-08-31 | flat | not recorded | n/a |
| `fleet-r7-template/` | 2026-09-06 | 2 plus a 3 lane demo fixture | not recorded | exit 0 |
| `fleet-r8-workbench-look/` | 2026-09-06 | 3 (claude-visual, grok-agentboards, grok-runboards) | claude-opus-5, grok-4.6 x2 | exit 0. 38 named reference products across three reports |
| `fleet-r9-workbench-redesign/` | 2026-09-06 | 2 (builder, scorer) | claude-opus-5, claude-fable-5 | exit 0 |

Root: `/Users/ls/Claude-Workspace/Fleet-Machine/`.

### CNVS side projects

| Round | Date | Lanes | Models | Notes |
|---|---|---|---|---|
| `cnvs/widgetmart/fleet-r1-test/` | 2026-08-31 | 4 (claude, codex, qwen, scorer) | opus, claude-opus, qwen default, fable-5 | four way dashboard build-off, exit 0 each |
| `cnvs/widgetmart/brandkit/` | 2026-09 | 6 brandkit review pages | higgsfield-brandkit | palette and type direction pairs |
| `cnvs/scratch/skill-eval-2026-09-16/` | 2026-09-16 | 4 grok lanes | grok-4.6 | skill eval runs, one verify exit 0, three not recorded |
| `personal/scratch/fleet-test/` | 2026-08-10 | 4 | not recorded | the first fleet smoke test |

### teetimes

`personal/teetimes/research/` had 3 research lanes (claude-arch, codex-probe, grok-market) and
`v0.1/` has 9 worker folders (api, data, data/verify, data/verify-fixes, data/photos, review,
web-a, web-b, web-m), each with REPORT.md and result.json. Those result.json files use an older
shape with no `state` or `model` field.

---

## 4. Boards on disk

Screenshot candidates. Size is a proxy for how much run history each one carries.

| Bytes | Path |
|---|---|
| 1,652,566 | `/Users/ls/Claude-Workspace/personal/sigouin-net/workbench/workbench.html` |
| 1,313,030 | `/Users/ls/Claude-Workspace/personal/undergrowth-v2/workbench/workbench.html` |
| 902,095 | `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/public/admin/wb/workbench.html` |
| 902,095 | `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/dist/admin/wb/workbench.html` (build copy) |
| 902,095 | `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/reports/fleet-100x/workbench.html` |
| 735,035 | `/Users/ls/Claude-Workspace/personal/IPTV/livetvcan-website/workbench/workbench.html` |
| 565,000 | `/Users/ls/Claude-Workspace/Fleet-Machine/workbench/workbench.html` |
| 320,430 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/claude/workbench.html` (contest winner) |
| 254,277 | `/Users/ls/Claude-Workspace/personal/scratch/workbench.bak.html` |
| 227,113 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/kimi/workbench.html` (contest loser) |
| 154,082 | `/Users/ls/Claude-Workspace/cnvs/widgetmart/workbench/workbench.html` |
| 93,179 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r7-template/fixture/workbench/workbench.html` |
| 85,984 | `/Users/ls/Claude-Workspace/cnvs/widgetmart/workbench/workbench-final.html` |
| 64,986 | `/Users/ls/Claude-Workspace/cnvs/widgetmart/workbench/workbench-after.html` |
| 63,795 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r3-live/board/board.html` (self updating) |
| 47,029 | `/Users/ls/Claude-Workspace/Fleet-Machine/workbench/template.html` |
| 31,697 | `/Users/ls/Claude-Workspace/cnvs/widgetmart/workbench/final-template.html` |
| 28,362 | `/Users/ls/Claude-Workspace/personal/RsyncGui/security-audit/workbench.html` |
| 24,047 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/claude/template.html` |
| 23,457 | `/Users/ls/Claude-Workspace/personal/sigzmusic/artwork-lab/workbench.html` |
| 21,725 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r8-workbench-look/preview.html` |
| 21,350 | `/Users/ls/Claude-Workspace/personal/sigzmusic/security-audit/workbench.html` |
| 20,158 | `/Users/ls/Claude-Workspace/cnvs/widgetmart/workbench/after-template.html` |
| 14,002 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r8-workbench-look/preview-2x3.html` |
| 13,500 | `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-rules.html` |
| 5,698 | `/Users/ls/Claude-Workspace/Fleet-Machine/STATUS.html` |
| 2,599 | `/Users/ls/Claude-Workspace/Fleet-Machine/how-the-fleet-works.html` |

Best three for the portfolio, by size and by story:
the sigouin.net board (biggest, and it is the board for this very site),
the Fleet-Machine r2 pair (winner next to loser, same brief, two models),
and `how-the-fleet-works.html` (one screen, no jargon, already designed for a non-technical reader).

**Show it as:** a horizontal rail of board screenshots that scrubs on scroll, with the r2
winner-versus-loser pair as a wipe comparison.

---

## 5. Numbers

Each number with the command that produced it, run from `/Users/ls/Claude-Workspace/personal`
unless stated.

| Number | Value | Command |
|---|---|---|
| Skills installed | 52 | `ls -d /Users/ls/.claude/skills/*/ \| grep -v disabled \| wc -l` |
| Subagent definitions | 20 | `ls /Users/ls/.claude/agents/*.md \| wc -l` |
| Hooks live | 4 | `ls /Users/ls/.claude/hooks/*.sh \| wc -l` |
| Hooks parked | 12 | `ls /Users/ls/.claude/hooks/disabled/*.sh \| wc -l` |
| MCP servers registered | 3 user scope plus cnvs and 3 plugin servers | `python3` read of `/Users/ls/.claude.json` mcpServers keys |
| Agent CLIs installed | 8 | `for c in claude codex grok kimi qwen opencode higgsfield cnvsctl; do command -v $c; done` |
| Worker REPORT.md files in personal/ | 131 | `find . -path ./node_modules -prune -o -name REPORT.md -print \| grep -v node_modules \| wc -l` |
| result.json files across personal, Fleet-Machine, cnvs | 91 | python walk over the three roots, counting `result.json`, node_modules skipped |
| Fleet round folders in personal/ | 33 | `find . -path ./node_modules -prune -o -type d -name "fleet-*" -print \| grep -v node_modules \| wc -l` |
| Fleet round folders in Fleet-Machine | 9 | `ls -d /Users/ls/Claude-Workspace/Fleet-Machine/fleet-r*` |
| Workbench boards in personal/ | 10 | `find . -path ./node_modules -prune -o -name "workbench*.html" -print \| grep -v node_modules \| wc -l` |
| Boards across all three roots | 27 | the same find over personal, Fleet-Machine and cnvs, node_modules excluded |
| Distinct models named in result.json | 9 | claude-opus-5, claude-fable-5, kimi-code/k3, grok-4.6, gpt-6-astra, gpt-5.6, qwen default, opus, claude-opus |
| Largest single competition | 9 lanes | `ls /Users/ls/Claude-Workspace/personal/archive/sigzmusic-landing/` counting lane dirs |

---

## 6. Story beats

Six moments worth putting on the page. Each is real, dated, and has a path.

**1. The nine lane landing competition.** 2026-08-12. Nine agents got one brief for the sigzmusic
landing page: claude, codex, grok, five kimi variants, and a neon remix. Luc picked the winner by eye.
Path: `/Users/ls/Claude-Workspace/personal/archive/sigzmusic-landing/` (claude, codex, grok,
kimi-a through kimi-e, neon-remix, each with REPORT.md).
**Medium:** a nine tile grid of the nine rendered lanes, the winner staying lit as the others dim.

**2. The forensics round that rewrote the process.** 2026-08-30. Luc said he could not tell what was
running. Five workers spent one round auditing the previous project's own 51 task ledger, and the
output was a new workflow plus a live board, not a feature.
Path: `/Users/ls/Claude-Workspace/Fleet-Machine/BRIEF.md`,
`/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r1-discovery/` (5 lanes, all verified).
**Medium:** the quote pulled out as type, then the timeline chart the codex lane produced.

**3. Same brief, two models, one loses.** 2026-08-30. Claude Opus and kimi K3 built the same
workbench page from the same five reports. A cold, zero-context Fable 5 judge scored them 9.25 and
8.42 against a rubric written before either started. Claude shipped, kimi did not.
Path: `/Users/ls/Claude-Workspace/Fleet-Machine/fleet-r2-workbench/claude/workbench.html` (320 KB)
and `/kimi/workbench.html` (227 KB), scores in `/Users/ls/Claude-Workspace/Fleet-Machine/STATUS.md`.
**Medium:** side by side wipe of the two pages with the two scores counting up.

**4. The gate that had to be broken first.** The standing rule is that a verify command proves
nothing until you break the thing it is supposed to catch and watch it fail. In round 2 the gate
reported BLOCKED because of a quoting bug in the orchestrator's verify string, not because the build
was wrong. The corrected gate was mutant tested before it was trusted.
Path: `/Users/ls/Claude-Workspace/Fleet-Machine/STATUS.md` round 2 row,
`/Users/ls/.claude/CLAUDE.md` section "Done means verified".
**Medium:** terminal replay gif, red then green, with the mutated line highlighted.

**5. The artwork lab.** 2026-08-19. Three lanes (research, tools, art) produced cover artwork for
sigzmusic with a rubric and a scores file, plus its own board.
Path: `/Users/ls/Claude-Workspace/personal/sigzmusic/artwork-lab/` (REPORT.md, RUBRIC.md, SCORES.md,
covers.html, workbench.html, art/, research/, tools/).
**Medium:** the generated covers as a wall, with the board screenshot behind it.

**6. Seven agents on a game at once.** 2026-09-08. Undergrowth round 7 ran seven lanes: board,
enemies, icons, towers, integrate, theme, scorer. Five ran on gpt-6-astra, one on claude-opus-5, the
judge on claude-fable-5. All seven verify commands exited 0.
Path: `/Users/ls/Claude-Workspace/personal/undergrowth-v2/fleet-r7-medieval/` (7 result.json files).
Live: https://undergrowth.pages.dev
**Medium:** live embed of the running game next to a seven row lane chart coloured by model.

**7. Scorers got fired.** 2026-09-08. Luc killed the scorer agent role after deciding it cost money
for nothing. The gate became the mechanical verify command, the worker's own self check against the
rubric, and Luc's eye. Rubrics are still written before spawning. The change is visible in the data:
every undergrowth round through r7 has a scorer lane, round 12 has none.
Path: `/Users/ls/.claude/skills/fleet/SKILL.md` (NO SCORER AGENTS block),
`/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/RUBRIC.md` (a rubric
with no scorer).
**Medium:** an animated before and after of the pipeline diagram, the scorer node dropping out.

**8. Workers are visible on purpose.** A hook blocks the invisible built-in subagent tool inside
CNVS, so every worker has to appear as a real terminal node Luc can watch and interrupt.
Path: `/Users/ls/.claude/hooks/subagent-cnvs-redirect.sh`,
`/Users/ls/Claude-Workspace/cnvs/CLAUDE.md`.
**Medium:** screen recording of the canvas as nodes spawn, zoomed out.

---

## Could not verify

- I did not open any workbench.html, board.html or dashboard.html. Sizes come from `stat`, not
  from rendering. No page in this report is confirmed to render correctly.
- I did not run any verify script, including the gates I cite as exiting 0. Exit codes come from
  what each worker wrote into its own `result.json`, which is self reported.
- Many `result.json` files predate the model field. Rows marked "not recorded" mean the file has no
  model, not that the model is unknown to Luc.
- `personal/teetimes/*/result.json` files parse but have no `state` or `model` key, so their round
  is listed without states.
- I did not read the 131 REPORT.md files. Lane names and counts come from directory listings.
- Skill "project that used it" is inferred from folders that exist near the skill's output. For
  skills marked "no round on disk" I found no artifact, which does not prove the skill was unused.
- Dates are filesystem modification times of the round directories, not the date work started.
  A folder touched later reads later.
- Plugin skills (chisle, ouroboros, reticle, last30days, scrollcraft, dataviz and the Anthropic
  built ins) are listed from the session skill roster, not from `~/.claude/skills/`, so they are not
  in the 52 count.
- I did not read `/Users/ls/Claude-Workspace/work/` or any `.env`. Work scoped agents and skills are
  named only.
- MCP servers motionsites, tripo3d and ui-skills were not called. Their purpose lines come from the
  registration entry and the tripo README, not from a live request.
- `opencode` is installed but I found no round that used it. Absence of evidence only.
- The 494 kie.ai credit figure and the sigouin.net round 1 score of 9.0 come from
  `archive/README.md` prose, not from a scores file I opened.
- Fleet-Machine round 4 through 7 lane purposes were not read. Only lane names and verify exit
  codes were taken from `result.json`.

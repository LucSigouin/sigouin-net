# Round 13 common brief: assets for the sigouin.net portfolio hub

Luc Sigouin is replacing sigouin.net with a portfolio hub that shows his projects and his
multi-agent build process with images, video, 3D and live data, almost no text, at Awwwards
quality. Shape chosen 2026-09-17: a numbered index of 12 projects on the left, the exhibit on
the right, plus a `/process` wing of 8 pinned scenes. Tools and models ARE named on the page.
Full plan: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/PLAN.md
Inventory with every path: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/inventory/INVENTORY.md
Format rules: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/ai-assets/RESEARCH-ai-assets.md (sections Embedding and Keep it fast)

This round MAKES assets. It does not build the site.

Shared rules for every lane:
- Write ONLY inside your lane dir under /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/<lane>/.
  Everything else in the workspace is read-only for you.
- Never open, read, or quote .env files. Tools that need a key read it themselves.
- Never push, deploy, publish, or change DNS. Never touch /Users/ls/Claude-Workspace/work/.
- Never launch the system browser (no `open`). Rendering pages for capture uses the scrollcraft
  harness driver already installed under
  /Users/ls/Claude-Workspace/personal/scrollcraft/builds/sigouin-net/node_modules (read its lab/
  scripts for the pattern). Do not install any other browser automation.
- Credits are approved for THIS round (Higgsfield, Tripo, kie.ai, OpenAI). Record every spend:
  balance before, balance after, per asset. Stop and report if a single asset fails twice.
- Deliverables go in your lane dir with dated or hashed filenames. Write `manifest.json`:
  {"lane":"<lane>","files":[{"path":"<abs>","kind":"image|video|glb|html|data|code","poster":"<abs or null>","source":"<reference path or prompt>","bytes":N}]}
- Write REPORT.md (draft within 10 minutes, keep saving) with: what you made, spend line,
  "## Could not verify", and the RUBRIC.md self-check table. Then result.json:
  {"state":"done","taskId":null,"model":{"requested":"<from your prompt>","effective":"<what ran>","source":"spawn flag"},
   "deliverable":"<abs path of manifest.json>","files":["..."],
   "verify":{"cmd":"python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/check-assets.py <your lane dir>","exit":0},
   "unverified":["..."]}
- No em dashes anywhere. Rubric: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/RUBRIC.md
- Timebox 60 minutes. If you hit a CLI usage limit, write what you have, set state "blocked", and stop.

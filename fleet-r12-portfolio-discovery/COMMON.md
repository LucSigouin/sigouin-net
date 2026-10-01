# Round 12 common brief: discovery for the sigouin.net portfolio hub

Luc Sigouin wants sigouin.net to become a portfolio hub for ALL his projects (personal first,
work later). It must show, with almost no text: screenshots, video/gif, animations, live data
pulled from the running apps, 3D objects, and the ORCHESTRATION PROCESS itself (CNVS canvas,
multi-model fleets, workbench boards). Target quality: Awwwards level, nothing that reads as
AI-template. Audience: clients, to show how and what he builds.

This round does NOT build the site. It gathers facts and references so the next round can.

Shared rules for every lane:
- READ-ONLY on the whole workspace except your own lane dir under
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/<lane>/.
- Never open, read, or quote .env files or any secret. Never push, deploy, publish, or run
  anything that spends credits (no image, video, or 3D generation this round).
- Never touch /Users/ls/Claude-Workspace/work/.
- Do not launch a system browser. Web research uses your CLI's own fetch/search tools.
- Write REPORT.md (draft within 10 minutes, keep saving) and result.json in your lane dir:
  {"state":"done","taskId":"<your CNVS task id if you have one, else null>",
   "model":{"requested":"<exact model id from your prompt>","effective":"<what actually ran>","source":"spawn flag"},
   "deliverable":"<absolute path of your main .md>","files":["..."],
   "verify":{"cmd":"python3 /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/check-lane.py <your lane dir>","exit":0},
   "unverified":["..."]}
- Your deliverable .md must have a "## Could not verify" section and zero em dashes (the "—" character).
- Fill the RUBRIC.md self-check table at the bottom of REPORT.md (criterion, pass/fail, evidence).
- Rubric: /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r12-portfolio-discovery/RUBRIC.md

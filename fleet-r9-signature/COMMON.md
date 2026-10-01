# Round 9 common brief: replace the blue cable with a new signature move

Site: Luc Sigouin's personal page sigouin.net, a scrollcraft build. Light, airy, desk-by-a-window
photographic world. Hero has three parallax planes (far/mid/near, data-hero-layer) that dissolve
into the page. Chapters: 0 title, 1 the desk (pinned clip), 1b who, 2 SiGz, 3 LiveTVCan, 4 homelab,
5 notes, 6 say hello. The blue cable (`.cable`, `.cable__line`, `.cable__tip`, `.cable__ports` plus
its script in page.dev.html) was the move that tied chapters together. Luc wants it gone and
replaced by ONE new move. Each variant lane builds a different move so Luc can compare.

Read first: <your build dir>/BRIEF.md, and these reports for how the page works:
/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r3-scroll/worker/REPORT.md (grammar),
/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r6-seam/worker/REPORT.md (hero mask),
/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r7-folio-cable/worker/REPORT.md,
/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r8-stuck/worker/REPORT.md (pin lengths, keep them).

Rules for every lane:
- Your build dir is a full copy of the current site (page.dev.html + scrollcraft.css + scrollcraft.js
  inlined into index.html by build-inline.py; assets/; node_modules with the harness driver). lab/
  is empty: recreate the screenshot strip there with the skill's harness (the ONE sanctioned
  browser automation; never launch the system browser). Kill your harness server by pid when done.
- Remove the cable completely (markup, CSS, script). The gate fails if `class="cable..."` remains.
- Tag the root element(s) of your new move with data-signature="<short name>". Gate requires it.
- Keep everything else: hero layers and seam, pin lengths from round 8, copy, photos, contact.
- The move must be visible at 1440 and 390, degrade to a readable static page under
  prefers-reduced-motion, cost under 300 KB of new assets, and never block the wheel.
- If you generate an image, use the skill's kie.ai path (key in every shell), at most 2 stills, and
  start a live gallery first via cnvs_run_shell:
  `python3 /Users/ls/Claude-Workspace/personal/imagegen/live-gallery.py <your out dir> --out <your out dir>/gallery.html --title "sigouin.net sig <name>" --loop`
  then show gallery.html with the cnvs_open_browser tool.
- Verify with captures at 1440, 390, reduced, at 8 or more scroll positions, look at them yourself,
  fix in one batched round, confirm. Show the finished index.html with the cnvs_open_browser tool as
  a node named "sig: <name>".
- Write scope: your build dir and your report dir only. Never edit .env, never push, deploy or
  publish, never touch scrollcraft/builds/sigouin-net (the live source) or FINGERPRINTS.md.
  No em dashes anywhere. No CLI or model names on the page.
- Report dir: draft REPORT.md within 10 minutes; final REPORT.md (the move in two sentences, how it
  is driven, capture paths, what you could not verify); result.json
  {"state":"done","files":[...],"verify":"<gate cmd>","verify_exit":0,"unverified":[...]}.
- Standing rules: /Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02/fleet-r1-site/WORKER-RULES.md

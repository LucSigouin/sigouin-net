# Round 11 common brief: three candidate near planes for the hero

Site: Luc Sigouin's personal page sigouin.net, a scrollcraft build. The hero has three parallax
planes tagged data-hero-layer far / mid / near. The NEAR plane (assets/hero-near-1200.webp and
hero-near-700.webp, the `.hero-layer--near` img, entering from the lower right) has been a plant
(Luc: "bothering me") and then headphones on a stand (Luc: "no that's awful"). Each lane makes ONE
different candidate so Luc can compare three side by side. The object must belong to a
systems-and-music person's desk by a window, in warm upper-left window light, and must not be a
plant, foliage, or headphones.

What "awful" most likely meant, so you avoid it: a cut-out object floating in front of the name with
a visible pasted-on edge, too large, too central, too dark against the pale page. Aim instead for:
small footprint (lower right quarter of the hero at 1440, lower third at 390), soft feathered edges
that melt into the mid plane, colour and light matched to the desk mid plane, never touching the
headline or the positioning line, reads as part of the same photograph.

Rules for every lane:
- Your build dir is a full copy of the current site (page.dev.html + scrollcraft.css + scrollcraft.js
  inlined into index.html by build-inline.py; assets/; node_modules with the harness driver). lab/
  is empty: recreate captures with the skill's harness (the ONE sanctioned browser automation;
  never launch the system browser). Kill your harness server by pid when done.
- Read /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r5-hero/worker/REPORT.md and
  /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r10-near/worker/REPORT.md first: they hold
  the near-plane pipeline (kie.ai prompt, cutout, feather, WebP sizes 1200 + 700, srcset wiring).
- Generate with the skill's kie.ai path (key in every shell), at most 3 stills, pick the best.
  Before the first generation start a live gallery via cnvs_run_shell:
  `python3 /Users/ls/Claude-Workspace/personal/imagegen/live-gallery.py <your build>/out --out <your report dir>/gallery.html --title "sigouin.net near <lane>" --loop`
  then show gallery.html with the cnvs_open_browser tool.
- Replace ONLY the near plane files and, if needed, its size/position CSS. Keep far and mid planes,
  the seam mask, the window-light move, all copy, everything below the hero exactly as is.
- Both near files together under 120 KB. alt stays empty. No plant/leaf/foliage/headphone words in
  the img attributes.
- Verify: hero captures at 1440 and 390 at scroll 0, 25 and 50 percent, plus reduced motion. Look
  at them. The object must never overlap the headline or positioning line. One batched fix round.
- Rebuild index.html with build-inline.py. Show the finished index.html with the cnvs_open_browser
  tool as a node named "near: <lane>". Do NOT copy anything into sigouin-net/site/ (Luc picks first).
- Write scope: your build dir and your report dir only. Never edit .env, never push, deploy or
  publish, never touch scrollcraft/builds/sigouin-net or FINGERPRINTS.md. No em dashes anywhere.
  No CLI or model names on the page.
- Report dir: draft REPORT.md within 10 minutes; final REPORT.md (the object, prompt, pick, capture
  paths, spend, what you could not verify); result.json
  {"state":"done","files":[...],"verify":"<gate cmd>","verify_exit":0,"unverified":[...]}.
- Standing rules: /Users/ls/Claude-Workspace/personal/archive/sigouin-net-fleet-2026-09-02/fleet-r1-site/WORKER-RULES.md

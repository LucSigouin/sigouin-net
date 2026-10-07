# ai-prep publish — 2026-10-06

Added /ai-prep/ (public copy of the interview prep brief) and filled the AI Workspace
"Coming soon" hub slot with a card linking to it ("How I work with AI").

- Source: /Users/ls/Claude-Workspace/cnvs/interview-prep/index.html, with all "For Luc only"
  notes, the sources table, the share-mode machinery, and leave-behind links stripped
  (leave-behind.html and talk-track.md stay private).
- Hub rebuilt (npm test 14 passed, vite build --base=/hub/, dist copied to site/hub/ and
  dev-render-only/hub/, old assets kept). site/ai-prep/ mirrored to dev-render-only/ai-prep/.
- Deploy b4cbf736 (2026-10-06). verify-live.sh: all hashes MATCH, 404 + Functions OK.
  Live /ai-prep/ byte-identical to local apart from Cloudflare's injected challenge script.
  Live leak grep (for luc only|ihsi|inhouse|kimi|mine): 0 hits.
  Post-deploy playwright site specs: 5 passed.

Rollback: redeploy previous deployment a3e36a1d from the Cloudflare Pages dashboard, or
remove site/ai-prep/ + restore the "Coming soon" slot in Sigouin-Hub/src/content/projects.json,
rebuild hub, redeploy.

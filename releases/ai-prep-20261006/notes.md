# ai-prep publish — 2026-10-06

Added /ai-prep/ (public "How I work with AI" brief) and filled the AI Workspace
"Coming soon" hub slot with a card linking to it.

- Hub rebuilt (npm test 14 passed, vite build --base=/hub/, dist copied to site/hub/, old assets kept).
- Deploy b4cbf736 (2026-10-06). verify-live.sh: all hashes MATCH, 404 + Functions OK.
  Post-deploy playwright site specs: 5 passed.
- 2026-11-06: trimmed employer-specific figures and private negotiation notes from the page.

Rollback: redeploy the previous deployment from the Cloudflare Pages dashboard, or
remove site/ai-prep/ + restore the "Coming soon" slot in Sigouin-Hub/src/content/projects.json,
rebuild hub, redeploy.

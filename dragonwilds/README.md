# Dragonwilds Field Guide

Unofficial RuneScape: Dragonwilds item, recipe and map guide. Static site, no build step.
Moved out of `../site/runescape/` on 2026-09-25 so the main site deploy drops 187 MB.

- `site/`: what gets published. Own Pages project `dragonwilds`, domain `dragonwilds.sigouin.net`.
- `tools/`: the fixture builder and its raw wiki dumps (not public).
- Deploy: `CONFIRM_DEPLOY=1 ./deploy.sh`, then `../deploy/verify-live.sh https://dragonwilds.sigouin.net "$PWD/site"`.
- Linked from the hub: Computer Lab, `monitor-1` (`../Sigouin-Hub/src/content/projects.json`).
- Old `sigouin.net/runescape/*` links 301 here via `../site/_redirects`.

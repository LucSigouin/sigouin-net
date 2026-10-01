# REPORT: lane AWWWARDS (round 12)

Model: grok-4.6. Requested: grok CLI default, highest. Source: spawn flag.

Deliverable: RESEARCH-awwwards.md in this lane. 38 named live sites with URLs that returned HTTP 200 on 2026-09-17. Twelve mechanics with two example URLs each and a plain HTML/CSS/JS or Three.js build note. Ten AI-template tells with a fix. Live-data patterns. 3D patterns with five examples. Three hub structures for ~12 projects plus process.

Annual facts used:
- Awwwards SOTY 2025: Lando Norris, OFF+BRAND. Users' Choice: same. Source: https://www.awwwards.com/annual-awards/hall-of-fame
- Developer SOTY 2025: Messenger, abeto. Live: https://messenger.abeto.co/
- E-commerce of the Year 2025: Scout Motors, Locomotive. Live: https://www.scoutmotors.com/
- Agency of the Year 2025: Immersive Garden. Studio of the Year 2025: Malvah. Independent: Louis Paquet.
- FWA of the Year 2025 and People's Choice: Bruno Simon, https://bruno-simon.com/
- CSSDA Website of the Year 2025: Dropbox Brand, https://brand.dropbox.com/

SOTY 2026 is not out. SOTD/SOTM 2026 winners are in the file.

Verify command: python3 check-lane.py on this lane dir.

## Self-check

| # | Criterion | Pass/fail | Evidence |
|---|---|---|---|
| 1 | Evidence | pass | Every site has a live URL. Award claims cite Awwwards hall of fame, FWA news, CSSDA posts, Exhibita canon, Hon Tran jury roundup. curl HEAD 200 recorded in-session. |
| 2 | Coverage | pass | 38 named live sites, floor was 25. Research lane, 20 required. |
| 3 | Exhibit-ready | pass | Every named site ends with a "Show it as:" line naming screenshot, video/gif, live data feed, 3D object, animation, or process board. |
| 4 | Honesty | pass | RESEARCH-awwwards.md section "## Could not verify" lists SOTY 2026, Godly redirect, dead studio URLs, no GPU walkthrough. |
| 5 | Plain words | pass | Short sentences. Zero em dashes in deliverable and this report. |
| 6 | Machine twin | n/a | Research lane. COMMON.md requires json only for inventory. result.json still written for the gate. |

Unverified items are listed in RESEARCH-awwwards.md and copied into result.json.

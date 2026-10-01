#!/usr/bin/env python3
"""Read-only gate for the scrollcraft lane. Usage: check-scroll.py <build dir> <worker dir>."""
import json, re, sys
from pathlib import Path
b = Path(sys.argv[1]).resolve(); w = Path(sys.argv[2]).resolve(); fails = []
idx = b / "index.html"
if not idx.is_file(): fails.append("missing index.html")
else:
    t = idx.read_text(encoding="utf-8", errors="replace")
    for s, label in (("Luc Sigouin", "name"), ("github.com/LucSigouin", "GitHub link"), ("mailto:luc@sigouin.net", "mailto"), ("sigzmusic.com", "SiGz link"), ("livetvcan.com", "LiveTVCan link"), ("prefers-reduced-motion", "reduced-motion rule")):
        if s not in t: fails.append(f"{label} missing")
    if "—" in t: fails.append("em dash in index.html")
    for banned in ("Inhouse", "IHSI", "inhouse-support"):
        if banned in t: fails.append(f"employer reference '{banned}'")
    if re.search(r'<script[^>]+src="https?://', t): fails.append("external script tag")
fp = Path("/Users/ls/Claude-Workspace/personal/scrollcraft/FINGERPRINTS.md").read_text()
if "sigouin" not in fp.lower(): fails.append("no sigouin row in FINGERPRINTS.md")
shots = [p for p in b.rglob("*.png") if "verify" in str(p).lower() or "shots" in str(p).lower() or "screens" in str(p).lower()]
if len(shots) < 4: fails.append(f"fewer than 4 screenshot files found under the build (found {len(shots)})")
for f in ("REPORT.md", "result.json"):
    if not (w / f).is_file(): fails.append(f"missing worker/{f}")
rj = w / "result.json"
if rj.is_file():
    try:
        if json.loads(rj.read_text()).get("state") != "done": fails.append("result.json state != done")
    except Exception as e: fails.append(f"result.json invalid: {e}")
for f in fails: print("FAIL:", f)
print("PASS" if not fails else f"{len(fails)} failure(s)"); sys.exit(1 if fails else 0)

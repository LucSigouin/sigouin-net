#!/usr/bin/env python3
import re, subprocess, sys, hashlib
from pathlib import Path
b, w = Path(sys.argv[1]), Path(sys.argv[2]); here = Path(__file__).parent; fails = []
base = subprocess.run([sys.executable, str(here / "check-sig.py"), str(b), str(w)], capture_output=True, text=True)
print(base.stdout.strip())
if base.returncode: fails.append("base gate failed")
t = (b / "index.html").read_text(errors="replace")
m = re.search(r'<img[^>]*data-hero-layer="near"[^>]*>', t)
if not m: fails.append("no near hero layer")
else:
    src = re.search(r'src="([^"]+)"', m.group(0))
    if not src or not (b / src.group(1)).is_file(): fails.append("near layer src missing")
    else:
        h = hashlib.sha256((b / src.group(1)).read_bytes()).hexdigest()[:16]
        if h == (here / "near-before.sha").read_text().strip(): fails.append("near plane asset unchanged (still the plant)")
    if re.search(r'plant|leaf|leaves|foliage', m.group(0), re.I): fails.append("near layer alt/attrs still mention the plant")
site = Path("/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html")
if site.read_text(errors="replace") != t: fails.append("site/index.html not synced")
for f in fails: print("FAIL:", f)
print("PASS" if not fails else f"{len(fails)} failure(s)"); sys.exit(1 if fails else 0)

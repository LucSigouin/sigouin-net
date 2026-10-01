#!/usr/bin/env python3
import re, subprocess, sys
from pathlib import Path
b, w = Path(sys.argv[1]), Path(sys.argv[2]); fails = []
base = subprocess.run([sys.executable, str(Path(__file__).with_name("check-scroll.py")), str(b), str(w)], capture_output=True, text=True)
print(base.stdout.strip())
if base.returncode: fails.append("base scroll gate failed")
t = (b / "index.html").read_text(errors="replace")
if re.search(r'class="folio(__[a-z]+)?"', t): fails.append("folio markup still present in index.html")
if len(set(re.findall(r'data-hero-layer="([^"]+)"', t))) < 3: fails.append("hero layers regressed")
if 'class="cable' not in t: fails.append("cable removed; it should be fixed, not deleted")
site = Path("/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html")
if site.is_file() and site.read_text(errors="replace") != t: fails.append("site/index.html not synced with build")
for f in fails: print("FAIL:", f)
print("PASS" if not fails else f"{len(fails)} failure(s)"); sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Gate for the hero-layers round: base scroll gate + three tagged hero layers + no folio overlap claim."""
import re, subprocess, sys
from pathlib import Path
b, w = Path(sys.argv[1]), Path(sys.argv[2]); fails = []
base = subprocess.run([sys.executable, str(Path(__file__).with_name("check-scroll.py")), str(b), str(w)], capture_output=True, text=True)
print(base.stdout.strip())
if base.returncode: fails.append("base scroll gate failed")
t = (b / "index.html").read_text(errors="replace")
layers = set(re.findall(r'data-hero-layer="([^"]+)"', t))
if len(layers) < 3: fails.append(f"need 3 distinct data-hero-layer values, found {sorted(layers)}")
for lay in re.findall(r'<[^>]+data-hero-layer="[^"]+"[^>]*>', t):
    m = re.search(r'src="([^"]+)"', lay)
    if m and not m.group(1).startswith("data:") and not (b / m.group(1)).is_file(): fails.append(f"hero layer asset missing: {m.group(1)}")
site = Path("/Users/ls/Claude-Workspace/personal/sigouin-net/site/index.html")
if site.is_file() and site.read_text(errors="replace") != t: fails.append("sigouin-net/site/index.html is not a copy of the build index.html")
for f in fails: print("FAIL:", f)
print("PASS" if not fails else f"{len(fails)} failure(s)"); sys.exit(1 if fails else 0)

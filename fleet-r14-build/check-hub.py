#!/usr/bin/env python3
"""Gate for round 14 hub lanes. Read-only predicate. Exit 0 = lane done.

Checks: site/index.html and site/process/index.html exist, four screenshots, REPORT.md,
result.json, manifest.json covering real files, size caps, anti-list greps across html/css/js,
every video has a poster, reduced-motion branch present, every local src/href resolves,
no em dashes in REPORT.md or the site.
"""
import json
import re
import sys
from pathlib import Path

MB = 1024 * 1024
CAPS = {"image": int(1.5 * MB), "video": 3 * MB, "glb": 5 * MB}
SITE_CAP = 40 * MB
EXT_KIND = {".webp": "image", ".png": "image", ".jpg": "image", ".jpeg": "image", ".svg": "image",
            ".mp4": "video", ".webm": "video", ".glb": "glb"}
FORBIDDEN = [
    (r"\bInter\b(?=['\",;\s]*(?:,|;|['\"]))", "font Inter"),
    (r"Poppins", "font Poppins"),
    (r"Space\s*Grotesk", "font Space Grotesk"),
    (r"backdrop-filter\s*:\s*[^;]*blur", "glass blur card"),
    (r"<marquee", "marquee"),
    (r"—", "em dash"),
]
EMOJI = re.compile(r"<h[1-6][^>]*>[^<]*[\U0001F300-\U0001FAFF☀-➿]")
SHOTS = ["index-1440.png", "index-390.png", "process-1440.png", "process-390.png"]


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


if len(sys.argv) < 2:
    fail("usage: check-hub.py <lane dir>")
lane = Path(sys.argv[1]).resolve()
if not lane.is_dir():
    fail(f"lane dir missing: {lane}")
site = lane / "site"
index = site / "index.html"
process = site / "process" / "index.html"
for p in (index, process):
    if not p.is_file() or p.stat().st_size < 2000:
        fail(f"{p.relative_to(lane)} missing or under 2000 bytes")

shots = lane / "shots"
for s in SHOTS:
    p = shots / s
    if not p.is_file() or p.stat().st_size < 10000:
        fail(f"shots/{s} missing or under 10 KB")

report = lane / "REPORT.md"
if not report.is_file() or report.stat().st_size < 800:
    fail("REPORT.md missing or under 800 bytes")
rep = report.read_text(encoding="utf-8", errors="replace")
if "—" in rep:
    fail("REPORT.md contains an em dash")
if "self-check" not in rep.lower():
    fail("REPORT.md lacks the rubric self-check table")
if "## Could not verify" not in rep:
    fail("REPORT.md lacks '## Could not verify'")

rj = lane / "result.json"
if not rj.is_file():
    fail("result.json missing")
try:
    r = json.loads(rj.read_text())
except Exception as e:
    fail(f"result.json not JSON: {e}")
if r.get("state") != "done":
    fail(f"state is {r.get('state')!r}, not done")
m = r.get("model")
if not m or (isinstance(m, dict) and not m.get("effective")):
    fail("model missing (exact id required)")
if not isinstance(r.get("unverified"), list):
    fail("unverified must be a list")

mf = lane / "manifest.json"
if not mf.is_file():
    fail("manifest.json missing")
try:
    manifest = json.loads(mf.read_text())
except Exception as e:
    fail(f"manifest.json not JSON: {e}")
files = manifest.get("files")
if not isinstance(files, list) or not files:
    fail("manifest.files missing or empty")
listed = set()
for i, f in enumerate(files):
    p = Path(str(f.get("path", "")))
    if not p.is_file():
        fail(f"manifest file {i}: not found: {p}")
    listed.add(p.resolve())
for p in list(site.rglob("*")) + list(shots.rglob("*")):
    if p.is_file() and p.resolve() not in listed:
        fail(f"not in manifest: {p.relative_to(lane)}")

total = 0
for p in site.rglob("*"):
    if not p.is_file():
        continue
    size = p.stat().st_size
    total += size
    kind = EXT_KIND.get(p.suffix.lower())
    if kind and size > CAPS[kind]:
        fail(f"{p.relative_to(lane)} is {size / MB:.2f} MB, cap {CAPS[kind] / MB:.1f} MB")
if total > SITE_CAP:
    fail(f"site/ is {total / MB:.1f} MB, cap 40 MB")

text_files = [p for p in site.rglob("*") if p.suffix.lower() in (".html", ".css", ".js", ".mjs")]
if not text_files:
    fail("no html/css/js under site/")
all_text = ""
for p in text_files:
    t = p.read_text(encoding="utf-8", errors="replace")
    all_text += t
    for pat, name in FORBIDDEN:
        if re.search(pat, t):
            fail(f"{name} in {p.relative_to(lane)}")
    if p.suffix.lower() == ".html":
        if EMOJI.search(t):
            fail(f"emoji in a heading in {p.relative_to(lane)}")
        for vid in re.finditer(r"<video\b[^>]*>", t, re.I):
            if "poster=" not in vid.group(0):
                fail(f"<video> without poster in {p.relative_to(lane)}")
        for att in re.finditer(r"""(?:src|href|poster)\s*=\s*["']([^"'#?]+)""", t, re.I):
            ref = att.group(1)
            if re.match(r"^(https?:)?//|^(data|mailto|tel|javascript):", ref):
                continue
            target = (site / ref.lstrip("/")) if ref.startswith("/") else (p.parent / ref)
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                fail(f"broken local reference {ref!r} in {p.relative_to(lane)}")
if "prefers-reduced-motion" not in all_text:
    fail("no prefers-reduced-motion branch")

print(f"OK: {lane.name} site {total / MB:.1f} MB, {len(text_files)} text files, {len(files)} manifest entries")

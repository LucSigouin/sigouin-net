#!/usr/bin/env python3
"""Gate for round 13 asset lanes. Read-only predicate. Exit 0 = lane done.

Checks: REPORT.md, result.json (state done, model, unverified), manifest.json with real files,
per-kind size caps, poster for every video and glb, per-lane minimums from expected.json,
no em dashes in REPORT.md.
"""
import json
import sys
from pathlib import Path

MB = 1024 * 1024
CAPS = {"video": 3 * MB, "glb": 5 * MB, "image": int(1.5 * MB)}
KINDS = {"image", "video", "glb", "html", "data", "code"}


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


if len(sys.argv) < 2:
    fail("usage: check-assets.py <lane dir>")
lane = Path(sys.argv[1])
if not lane.is_dir():
    fail(f"lane dir missing: {lane}")
round_dir = Path(__file__).resolve().parent
expected = json.loads((round_dir / "expected.json").read_text())
rules = expected.get(lane.name)
if rules is None:
    fail(f"no expected.json entry for lane {lane.name!r}")

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

kinds_seen = set()
for i, f in enumerate(files):
    p = Path(str(f.get("path", "")))
    kind = f.get("kind")
    if kind not in KINDS:
        fail(f"file {i}: kind {kind!r} not in {sorted(KINDS)}")
    if not p.is_file():
        fail(f"file {i}: not found: {p}")
    size = p.stat().st_size
    if size == 0:
        fail(f"file {i}: empty: {p}")
    try:
        p.resolve().relative_to(lane.resolve())
    except ValueError:
        fail(f"file {i}: outside lane dir: {p}")
    cap = CAPS.get(kind)
    if cap and size > cap:
        fail(f"file {i}: {p.name} is {size} bytes, cap for {kind} is {cap}")
    if kind in ("video", "glb"):
        poster = f.get("poster")
        if not poster or not Path(poster).is_file():
            fail(f"file {i}: {kind} {p.name} has no poster on disk")
    if not f.get("source"):
        fail(f"file {i}: {p.name} has no source (reference path or prompt)")
    kinds_seen.add(kind)

if len(files) < rules["min_files"]:
    fail(f"{len(files)} files listed, lane {lane.name} needs at least {rules['min_files']}")
for k in rules["must_have_kinds"]:
    if k not in kinds_seen:
        fail(f"lane {lane.name} must include kind {k!r}, saw {sorted(kinds_seen)}")

print(f"PASS: {lane.name} {len(files)} files, kinds {sorted(kinds_seen)}, model {m}")

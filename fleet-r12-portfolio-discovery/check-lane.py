#!/usr/bin/env python3
"""Gate for round 12 discovery lanes. Read-only predicate. Exit 0 = lane done."""
import json, sys
from pathlib import Path


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


if len(sys.argv) < 2:
    fail("usage: check-lane.py <lane dir>")
lane = Path(sys.argv[1])
if not lane.is_dir():
    fail(f"lane dir missing: {lane}")
report = lane / "REPORT.md"
if not report.is_file() or report.stat().st_size < 800:
    fail("REPORT.md missing or under 800 bytes")
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
d = r.get("deliverable")
if not d:
    fail("deliverable path missing in result.json")
dp = Path(d)
if not dp.is_file():
    fail(f"deliverable not found: {d}")
if dp.stat().st_size < 4000:
    fail(f"deliverable under 4000 bytes: {dp.stat().st_size}")
text = dp.read_text(encoding="utf-8", errors="replace")
if "## Could not verify" not in text:
    fail("deliverable lacks '## Could not verify' section")
if "—" in text:
    fail("deliverable contains an em dash")
rep = report.read_text(encoding="utf-8", errors="replace")
if "—" in rep:
    fail("REPORT.md contains an em dash")
if "self-check" not in rep.lower():
    fail("REPORT.md lacks the rubric self-check table")
print(f"PASS: {lane.name} deliverable {dp.name} {dp.stat().st_size} bytes, model {m}")

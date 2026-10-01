#!/usr/bin/env python3
"""Gate for the housekeeping lane. Read-only predicate. Exit 0 = all four fixes landed."""
import re
import sys
from pathlib import Path

P = Path("/Users/ls/Claude-Workspace/personal")
problems = []

claude_md = (P / "CLAUDE.md").read_text(encoding="utf-8", errors="replace")
if "fleet-cheatsheet-workbench" in claude_md:
    problems.append("CLAUDE.md still points at fantasy-football/fleet-cheatsheet-workbench (gone from disk)")
if re.search(r"^- `research-side-income/`", claude_md, re.M):
    problems.append("CLAUDE.md still lists research-side-income/ as a top-level dir (absent from disk)")
if re.search(r"^- `undergrowth/`", claude_md, re.M):
    problems.append("CLAUDE.md still lists undergrowth/ (v1) as a top-level dir")
if "`Traditionally/`" not in claude_md and (P / "Traditionally").exists():
    problems.append("Traditionally/ still exists on disk")
if (P / "Traditionally").exists():
    problems.append("Traditionally/ still exists")
if (P / "undergrowth").exists():
    problems.append("undergrowth/ (v1) still at top level")
if not (P / "archive" / "undergrowth").is_dir():
    problems.append("archive/undergrowth missing")
archive_readme = (P / "archive" / "README.md").read_text(encoding="utf-8", errors="replace")
if not re.search(r"^\| `undergrowth/`", archive_readme, re.M):
    problems.append("archive/README.md has no undergrowth/ row")
readme = (P / "sigouin-net" / "README.md").read_text(encoding="utf-8", errors="replace")
if "Not live yet" in readme:
    problems.append("sigouin-net/README.md still says 'Not live yet'")
for name in ("CLAUDE.md", "archive/README.md", "sigouin-net/README.md"):
    txt = (P / name).read_text(encoding="utf-8", errors="replace")
    # only flag NEW em dashes: compare against a count recorded before the lane ran
    # (baseline written by the orchestrator into em-dash-baseline.txt)
base_file = Path(__file__).resolve().parent / "em-dash-baseline.txt"
if base_file.is_file():
    for line in base_file.read_text().splitlines():
        name, _, n = line.partition("=")
        txt = (P / name).read_text(encoding="utf-8", errors="replace")
        if txt.count("—") > int(n):
            problems.append(f"{name} gained em dashes")

if problems:
    for p in problems:
        print("FAIL:", p)
    sys.exit(1)
print("PASS: housekeeping complete")

#!/bin/zsh
# Rebuild the portfolio-hub workbench every 15 s from a ledger filtered to this project's rows
# (createdAt >= Luc's first prompt, 2026-09-17T13:00Z, Apple epoch 811342800) and the two hub rounds.
H=/Users/ls/Claude-Workspace/personal/sigouin-net/hub-board
SRC=/Users/ls/Claude-Workspace/personal/.cnvs/dumbpipe.jsonl
OUT=/Users/ls/Claude-Workspace/personal/sigouin-net/workbench/workbench.html
while true; do
  python3 - "$SRC" "$H/.cnvs/dumbpipe.jsonl" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
keep = []
for line in open(src, encoding="utf-8"):
    line = line.strip()
    if not line: continue
    try: d = json.loads(line)
    except Exception: continue
    try: ts = float(d.get("createdAt", 0))
    except Exception: ts = 0
    if ts >= 811342800: keep.append(line)
open(dst, "w", encoding="utf-8").write("\n".join(keep) + ("\n" if keep else ""))
PY
  # --cost points at a file that does not exist on purpose: the board then says "not captured"
  # instead of falling back to Fleet-Machine's 17-day-old snapshot (Luc: no old data).
  python3 /Users/ls/Claude-Workspace/Fleet-Machine/workbench/build.py --project "$H" --ledger "$H/.cnvs/dumbpipe.jsonl" --cost "$H/cost/cost.json" --out "$OUT" --once >/dev/null 2>&1 || echo "build failed $(date)"
  sleep 15
done

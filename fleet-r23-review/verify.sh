#!/usr/bin/env bash
# Read-only predicate: lane has a non-empty REPORT.md and a result.json with state=done, model, files.
L="/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r23-review/$1"
test -s "$L/REPORT.md" || { echo "FAIL: $L/REPORT.md missing/empty"; exit 1; }
python3 - "$L/result.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
assert d.get("state")=="done", "state != done"
assert d.get("model"), "model missing"
assert d.get("files"), "files missing"
print("PASS")
PY

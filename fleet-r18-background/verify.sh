#!/bin/bash
# Round 18 verify: serve the lane build, run the no scroll gate against it, reap the server.
# The background server is started and killed by this same script, so nothing is left running.
set -u
LANE="/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r18-background"
PORT=5197

python3 -m http.server "$PORT" --directory "$LANE/site" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; wait "$SERVER" 2>/dev/null' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then break; fi
  sleep 0.25
done

if ! curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
  echo "verify.sh: the preview server on port $PORT never came up"
  exit 1
fi

node "$LANE/check-noscroll.mjs" "http://127.0.0.1:$PORT"
CODE=$?
exit $CODE

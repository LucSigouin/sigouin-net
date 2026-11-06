#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-https://sigouin.net}"
SITE="${2:-$(cd "$(dirname "$0")/.." && pwd)/site}"
BASE="${BASE%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ ! -d "$SITE" ]; then printf 'Site directory not found: %s\n' "$SITE" >&2; exit 1; fi
if [ ! -f "$SITE/_headers" ]; then printf 'Missing headers file: %s/_headers\n' "$SITE" >&2; exit 1; fi

CSP="$(awk 'tolower($1) == "content-security-policy:" { sub(/^[^:]*:[[:space:]]*/, ""); print; exit }' "$SITE/_headers")"
if [ -z "$CSP" ]; then printf 'No Content-Security-Policy in %s/_headers\n' "$SITE" >&2; exit 1; fi

FILES=()
# Functions are compiled routes. Wrangler state and Pages control files are not
# public assets and must never be requested or compared as static files.
while IFS= read -r rel; do FILES+=("$rel"); done < <(
  cd "$SITE" && find . \
    \( -path './functions' -o -path './.wrangler' -o -path './node_modules' -o -path './.git' \) -prune -o \
    -type f ! -name '_headers' ! -name '_routes.json' ! -name '_redirects' ! -name '404.html' \
    ! -name '.env*' ! -name '.dev.vars*' -print | sed 's#^./##' | sort
)
if [ "${#FILES[@]}" -eq 0 ]; then printf 'No files found under %s\n' "$SITE" >&2; exit 1; fi

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

header_value() {
  awk -v name="$1" 'tolower($1) == tolower(name) ":" {
    sub(/^[^:]*:[[:space:]]*/, ""); sub(/\r$/, ""); value=$0
  } END { print value }' "$2"
}

for attempt in $(seq 1 10); do
  ALL_MATCH=1
  printf '\nAttempt %s/10\n' "$attempt"
  printf '%-45s %-12s %-12s %s\n' 'path' 'local hash' 'live hash' 'result'
  for rel in "${FILES[@]}"; do
    case "$rel" in
      index.html) route=/ ;;
      */index.html) route="/${rel%index.html}" ;;
      *) route="/$rel" ;;
    esac
    local_hash="$(hash_file "$SITE/$rel")"
    headers="$TMP_DIR/headers"
    body="$TMP_DIR/body"
    status="$(curl -sS -L --connect-timeout 5 --max-time 20 -D "$headers" -o "$body" -w '%{http_code}' "$BASE$route" || true)"
    live_hash=""
    result="DIFF"
    if [ "$status" = 200 ]; then live_hash="$(hash_file "$body")"; fi
    if [ "$status" = 200 ] && [ "$local_hash" = "$live_hash" ]; then result="MATCH"; else ALL_MATCH=0; fi
    printf '%-45s %-12s %-12s %s\n' "$route" "${local_hash:0:12}" "${live_hash:0:12}" "$result"
    if [[ "$rel" == *.html ]]; then
      if [ "$(header_value Content-Security-Policy "$headers")" = "$CSP" ] &&
         [ "$(header_value X-Content-Type-Options "$headers")" = nosniff ] &&
         [ "$(header_value Referrer-Policy "$headers")" = strict-origin-when-cross-origin ]; then
        printf 'Headers %s: MATCH\n' "$route"
      else
        printf 'Headers %s: DIFF\n' "$route"
        ALL_MATCH=0
      fi
    fi
  done
  # 404.html is not a route: Pages serves it with status 404 for any unknown path. Cloudflare's
  # bot check injects a script before </body> on those pages (no no-transform rule can cover
  # every unknown path), so compare everything up to </main> and the headers instead.
  if [ -f "$SITE/404.html" ]; then
    route="/verify-live-missing-$RANDOM"
    status="$(curl -sS --connect-timeout 5 --max-time 20 -D "$headers" -o "$body" -w '%{http_code}' "$BASE$route" || true)"
    if [ "$status" = 404 ] &&
       [ "$(header_value Content-Security-Policy "$headers")" = "$CSP" ] &&
       python3 - "$SITE/404.html" "$body" <<'PY'
import sys
local = open(sys.argv[1], encoding='utf-8').read()
live = open(sys.argv[2], encoding='utf-8', errors='replace').read()
cut = local.index('</main>') + len('</main>')
sys.exit(0 if live.startswith(local[:cut]) else 1)
PY
    then
      printf '404 %s: 404 + 404.html body (up to </main>) + CSP MATCH\n' "$route"
    else
      printf '404 %s: FAIL (HTTP %s)\n' "$route" "$status"
      ALL_MATCH=0
    fi
  fi
  if [ -d "$SITE/functions/api/live" ]; then
    for route in /api/live/sigz/tracks /api/live/bbc/state; do
      case "$route" in
        /api/live/sigz/tracks) source_host=sigzmusic.com ;;
        /api/live/bbc/state) source_host=bbc.sigouin.net ;;
      esac
      status="$(curl -sS --connect-timeout 5 --max-time 15 -D "$headers" -o "$body" -w '%{http_code}' "$BASE$route" || true)"
      if [ "$status" = 200 ] &&
         [[ "$(header_value Content-Type "$headers")" == application/json* ]] &&
         [ "$(header_value X-Live-Source "$headers")" = "$source_host" ] &&
         python3 - "$body" "$route" <<'PY'
import json, sys
try:
    with open(sys.argv[1]) as file:
        data = json.load(file)
    assert isinstance(data, dict)
    if sys.argv[2].endswith('/tracks'):
        assert isinstance(data.get('tracks'), list)
    else:
        assert all(isinstance(data.get(key), dict) for key in ('setup', 'scores', 'bonusWinners'))
except (OSError, ValueError, AssertionError):
    sys.exit(1)
PY
      then
        printf 'Function %s: 200 JSON (%s)\n' "$route" "$source_host"
      else
        printf 'Function %s: FAIL (HTTP %s)\n' "$route" "$status"
        ALL_MATCH=0
      fi
    done
  fi
  [ "$ALL_MATCH" -eq 1 ] && exit 0
  [ "$attempt" -lt 10 ] && sleep 6
done
exit 1

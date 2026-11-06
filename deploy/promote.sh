#!/usr/bin/env bash
set -euo pipefail

TARGET="${TARGET:-$(cd "$(dirname "$0")/.." && pwd)}"
FORCE=0
APPLY=0
LANE=""

usage() {
  printf 'Usage: %s [--apply] [--force] <lane-dir>\n' "$0"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --force) FORCE=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
    *)
      if [ -n "$LANE" ]; then
        printf 'Only one lane directory is allowed.\n' >&2; usage >&2; exit 2
      fi
      LANE="$1"
      ;;
  esac
  shift
done

if [ -z "$LANE" ]; then usage >&2; exit 2; fi
LANE="$(cd "$LANE" && pwd)"

for item in site posts build.py; do
  if [ ! -e "$LANE/$item" ]; then
    printf 'Missing source: %s\n' "$LANE/$item" >&2
    exit 1
  fi
done

if [ -e "$TARGET/site" ] && [ "$FORCE" -ne 1 ]; then
  printf 'Refusing to replace existing target site: %s\n' "$TARGET/site" >&2
  printf 'Use --force if this replacement is intended.\n' >&2
  exit 1
fi

if [ "$APPLY" -ne 1 ]; then
  printf 'Dry run. No files copied.\n'
  printf 'Would copy %s/site -> %s/site\n' "$LANE" "$TARGET"
  printf 'Would copy %s/posts -> %s/posts\n' "$LANE" "$TARGET"
  printf 'Would copy %s/build.py -> %s/build.py\n' "$LANE" "$TARGET"
  exit 0
fi

mkdir -p "$TARGET"
if [ -e "$TARGET/site" ]; then
  cp -R "$LANE/site/." "$TARGET/site/"
else
  cp -R "$LANE/site" "$TARGET/site"
fi
cp -R "$LANE/posts" "$TARGET/posts"
cp "$LANE/build.py" "$TARGET/build.py"
printf 'Copied %s/site -> %s/site\n' "$LANE" "$TARGET"
printf 'Copied %s/posts -> %s/posts\n' "$LANE" "$TARGET"
printf 'Copied %s/build.py -> %s/build.py\n' "$LANE" "$TARGET"

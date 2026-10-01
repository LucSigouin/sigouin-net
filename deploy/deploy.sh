#!/usr/bin/env bash
set -euo pipefail

SITE="${1:-/Users/ls/Claude-Workspace/personal/sigouin-net/site}"
ENV_FILE="/Users/ls/Claude-Workspace/personal/.env"
NPM_CACHE="${TMPDIR:-/tmp}/npmcache"

if [ ! -d "$SITE" ]; then
  printf 'Site directory not found: %s\n' "$SITE" >&2
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  printf 'Credential file not found: %s\n' "$ENV_FILE" >&2
  exit 1
fi

# Only the account id goes to wrangler; nothing else in the shared .env is exported.
CLOUDFLARE_ACCOUNT_ID="$(grep -E '^CLOUDFLARE_ACCOUNT_ID=' "$ENV_FILE" | cut -d= -f2-)"
export CLOUDFLARE_ACCOUNT_ID

# Pin the version verified by the previous deploy; the registry latest tag can race publication.
COMMAND=(npx --yes --cache "$NPM_CACHE" wrangler@4.133.0 pages deploy . --project-name sigouin-net --branch main)
if [ "${CONFIRM_DEPLOY:-0}" != "1" ]; then
  printf 'Deployment not confirmed. Set CONFIRM_DEPLOY=1 to run:\n'
  printf 'cd "%s" && npx --yes --cache "%s" wrangler@4.133.0 pages deploy . --project-name sigouin-net --branch main\n' "$SITE" "$NPM_CACHE"
  exit 1
fi

# Deploy a clean staging copy: no dotfiles (.wrangler, .DS_Store), no Python, no raw fixtures.
# Pages discovers ./functions from the working directory, not the asset argument, so it is copied too.
# https://developers.cloudflare.com/pages/get-started/direct-upload/#functions
STAGE="$(mktemp -d)"
trap 'rm -r "$STAGE"' EXIT
rsync -a --exclude '.*' --exclude '*.py' --exclude '__pycache__' "$SITE/" "$STAGE/"
cd "$STAGE"
DEPLOY_EXIT=0
OUTPUT="$("${COMMAND[@]}")" || DEPLOY_EXIT=$?
printf '%s\n' "$OUTPUT"
[ "$DEPLOY_EXIT" -eq 0 ] || exit "$DEPLOY_EXIT"
URL="$(printf '%s\n' "$OUTPUT" | grep -Eo 'https://[^[:space:]]+\.pages\.dev[^[:space:]]*' | tail -n 1 || true)"
if [ -z "$URL" ]; then
  printf 'Deploy completed, but no Pages URL was found in the command output.\n' >&2
  exit 1
fi
printf 'Deployment URL: %s\n' "$URL"

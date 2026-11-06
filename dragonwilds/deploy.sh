#!/usr/bin/env bash
# Deploy the Dragonwilds field guide to its own Pages project (dragonwilds.sigouin.net).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="${1:-$HERE/site}"
ENV_FILE="${ENV_FILE:-$HOME/Claude-Workspace/personal/.env}"
NPM_CACHE="${TMPDIR:-/tmp}/npmcache"
[ -d "$SITE" ] || { printf 'Site directory not found: %s\n' "$SITE" >&2; exit 1; }
if [ "${CONFIRM_DEPLOY:-0}" != "1" ]; then
  printf 'Deployment not confirmed. Set CONFIRM_DEPLOY=1 to deploy %s to Pages project dragonwilds.\n' "$SITE"
  exit 1
fi
# Only the account id; wrangler auth comes from its own login, like ../deploy/deploy.sh.
export CLOUDFLARE_ACCOUNT_ID="$(grep -E "^CLOUDFLARE_ACCOUNT_ID=" "$ENV_FILE" | cut -d= -f2-)"
cd "$SITE"
npx --yes --cache "$NPM_CACHE" wrangler@4.133.0 pages deploy . --project-name dragonwilds --branch main
printf '\nNext: ../deploy/verify-live.sh https://dragonwilds.sigouin.net "%s"\n' "$SITE"

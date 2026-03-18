#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env.cloudflare.production" ]]; then
  set -a
  source ".env.cloudflare.production"
  set +a
elif [[ -f ".vercel/.env.production.local" ]]; then
  set -a
  source ".vercel/.env.production.local"
  set +a
fi

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.duel-log.codenica.dev/api}"
export CLOUDFLARE_PAGES_PRODUCTION_BRANCH="${CLOUDFLARE_PAGES_PRODUCTION_BRANCH:-main}"

pnpm pages:build
npx wrangler pages deploy apps/web/dist --project-name="${CLOUDFLARE_PAGES_PROJECT_NAME:-duel-log}" --branch="${CLOUDFLARE_PAGES_PRODUCTION_BRANCH}"

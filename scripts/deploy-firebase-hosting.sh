#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but was not found in PATH." >&2
  exit 1
fi

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-${GCP_PROJECT_ID:-}}"
REGION="${GOOGLE_CLOUD_REGION:-${GCP_REGION:-asia-northeast1}}"
SITE_ID="${FIREBASE_HOSTING_SITE:-duel-log}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-duel-log-api}"
ENV_INPUT="${FIREBASE_WEB_ENV_INPUT:-$ROOT_DIR/.vercel/.env.production.local}"
ENV_FILE="${FIREBASE_WEB_ENV_FILE:-$ROOT_DIR/.firebase/hosting.production.env}"
CONFIG_FILE="${FIREBASE_CONFIG_FILE:-$ROOT_DIR/firebase.hosting.generated.json}"
MODE="${FIREBASE_HOSTING_MODE:-spa}"
PUBLIC_DIR="${FIREBASE_HOSTING_PUBLIC_DIR:-$ROOT_DIR/apps/web/dist}"
API_BASE_URL="${FIREBASE_WEB_API_BASE_URL:-/api}"
PRIMARY_WEB_URL="${FIREBASE_WEB_PRIMARY_URL:-https://duel-log.codenica.dev}"
LEGACY_WEB_HOSTS="${FIREBASE_WEB_LEGACY_HOSTS:-duel-log-app.vercel.app}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID is required." >&2
  exit 1
fi

cd "$ROOT_DIR"

if [[ "$MODE" == "spa" ]]; then
  node scripts/generate-firebase-hosting-env.mjs \
    -- \
    --input "$ENV_INPUT" \
    --output "$ENV_FILE" \
    --api-base-url "$API_BASE_URL" \
    --primary-web-url "$PRIMARY_WEB_URL" \
    --legacy-web-hosts "$LEGACY_WEB_HOSTS"

  set -a
  source "$ENV_FILE"
  set +a
fi

node scripts/generate-firebase-hosting-config.mjs \
  -- \
  --output "$CONFIG_FILE" \
  --mode "$MODE" \
  --public-dir "$PUBLIC_DIR" \
  --site "$SITE_ID" \
  --service "$SERVICE_NAME" \
  --region "$REGION"

if [[ "$MODE" == "spa" ]]; then
  pnpm --filter @duel-log/shared build
  pnpm --filter @duel-log/web build
fi

npx firebase-tools deploy \
  --project "$PROJECT_ID" \
  --config "$CONFIG_FILE" \
  --only hosting

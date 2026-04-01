#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required but was not found in PATH." >&2
  exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${GCP_REGION:-${GOOGLE_CLOUD_REGION:-asia-northeast1}}"
ARTIFACT_REPO="${ARTIFACT_REGISTRY_REPO:-apps}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-duel-log-api}"
IMAGE_NAME="${CLOUD_RUN_IMAGE_NAME:-api}"
MIN_INSTANCES="${CLOUD_RUN_MIN_INSTANCES:-1}"
MAX_INSTANCES="${CLOUD_RUN_MAX_INSTANCES:-20}"
ENV_INPUT="${CLOUD_RUN_ENV_INPUT:-$ROOT_DIR/.env/production}"
ENV_FILE="${CLOUD_RUN_ENV_FILE:-$ROOT_DIR/.cloudrun/api.env.yaml}"
BUILD_CONFIG="${CLOUD_BUILD_CONFIG:-deploy/google/cloudbuild.api.yaml}"
BUILD_REGION="${CLOUD_BUILD_REGION:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required." >&2
  exit 1
fi

cd "$ROOT_DIR"

node scripts/generate-cloudrun-api-env.mjs -- --input "$ENV_INPUT" --output "$ENV_FILE"

IMAGE_REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_NAME}"
BUILD_IMAGE_URI="${IMAGE_REPO}:latest"

build_args=(
  --project "$PROJECT_ID"
  --config "$BUILD_CONFIG"
  --substitutions "_IMAGE=$BUILD_IMAGE_URI"
  --suppress-logs
  --format="value(id)"
)

describe_args=(
  --project "$PROJECT_ID"
  --format="value(results.images[0].digest)"
)

if [[ -n "$BUILD_REGION" ]]; then
  build_args+=(--region "$BUILD_REGION")
  describe_args+=(--region "$BUILD_REGION")
fi

BUILD_ID="$(
  gcloud builds submit "${build_args[@]}" |
    tail -n 1 |
    tr -d '[:space:]'
)"

if [[ -z "$BUILD_ID" ]]; then
  echo "Failed to determine Cloud Build ID." >&2
  exit 1
fi

IMAGE_DIGEST="$(
  gcloud builds describe "$BUILD_ID" "${describe_args[@]}" |
    tail -n 1 |
    tr -d '[:space:]'
)"

if [[ -z "$IMAGE_DIGEST" ]]; then
  echo "Failed to determine image digest for build $BUILD_ID." >&2
  exit 1
fi

DEPLOY_IMAGE_URI="${IMAGE_REPO}@${IMAGE_DIGEST}"

echo "Deploying Cloud Run service ${SERVICE_NAME} with image ${DEPLOY_IMAGE_URI}"

DB_SECRET="${CLOUD_RUN_DB_SECRET:-duel-log-database-url}"

gcloud run deploy "$SERVICE_NAME" \
  --image "$DEPLOY_IMAGE_URI" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --min-instances "$MIN_INSTANCES" \
  --max-instances "$MAX_INSTANCES" \
  --env-vars-file "$ENV_FILE" \
  --set-secrets="DATABASE_URL=${DB_SECRET}:latest"

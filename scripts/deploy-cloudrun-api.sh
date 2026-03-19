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
ENV_INPUT="${CLOUD_RUN_ENV_INPUT:-$ROOT_DIR/.vercel/.env.production.local}"
ENV_FILE="${CLOUD_RUN_ENV_FILE:-$ROOT_DIR/.cloudrun/api.env.yaml}"
BUILD_CONFIG="${CLOUD_BUILD_CONFIG:-deploy/google/cloudbuild.api.yaml}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required." >&2
  exit 1
fi

cd "$ROOT_DIR"

node scripts/generate-cloudrun-api-env.mjs -- --input "$ENV_INPUT" --output "$ENV_FILE"

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_NAME}:latest"

gcloud builds submit \
  --project "$PROJECT_ID" \
  --config "$BUILD_CONFIG" \
  --substitutions=_IMAGE="$IMAGE_URI"

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --min-instances "$MIN_INSTANCES" \
  --max-instances "$MAX_INSTANCES" \
  --env-vars-file "$ENV_FILE"

#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AUTH_TOKEN:-}" || -z "${PAIR_ID:-}" ]]; then
  echo "Usage: AUTH_TOKEN=<supabase_access_token> PAIR_ID=<pair_id> [BASE_URL=http://localhost:3001] $0" >&2
  exit 1
fi

curl --silent --show-error --fail \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  "${BASE_URL:-http://localhost:3001}/v1/chat/${PAIR_ID}/list?limit=2"

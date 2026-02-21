#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="apps/api/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "FAIL env: missing $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a
echo "OK   env loaded ($ENV_FILE)"

BASE_URL="${BASE_URL:-http://localhost:3001}"
SUPABASE_PUBLIC_KEY="${SUPABASE_PUBLISHABLE_KEY:-${SUPABASE_ANON_KEY:-}}"
PYTHON_BIN="$(command -v python3 || true)"
CURL_BIN="$(command -v curl || true)"

failures=0

ok() {
  echo "OK   $1"
}

fail() {
  echo "FAIL $1"
  failures=$((failures + 1))
}

require_env() {
  local key="$1"
  local value="${(P)key:-}"
  if [[ -z "$value" ]]; then
    fail "missing env $key"
    return 1
  fi
  return 0
}

read_json_field() {
  local path="$1"
  "$PYTHON_BIN" -c '
import json, sys
path = [p for p in sys.argv[1].split(".") if p]
raw = sys.stdin.read() or "{}"
try:
    obj = json.loads(raw)
except Exception:
    sys.exit(1)
cur = obj
for part in path:
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]
    else:
        sys.exit(1)
if cur is None:
    sys.exit(1)
if isinstance(cur, bool):
    sys.stdout.write("true" if cur else "false")
else:
    sys.stdout.write(str(cur))
' "$path"
}

request_json() {
  local method="$1"
  local url="$2"
  local payload="${3:-}"
  local tmp
  tmp="$(mktemp)"

  if [[ -n "$payload" ]]; then
    RESPONSE_STATUS="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$payload" || true)"
  else
    RESPONSE_STATUS="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" || true)"
  fi

  RESPONSE_BODY="$(cat "$tmp")"
  rm -f "$tmp"
}

require_env SUPABASE_URL || true
require_env CG_TEST_EMAIL || true
require_env CG_TEST_PASSWORD || true
if [[ -z "$SUPABASE_PUBLIC_KEY" ]]; then
  fail "missing env SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY"
fi
if [[ -z "$PYTHON_BIN" ]]; then
  fail "missing python3"
fi
if [[ -z "$CURL_BIN" ]]; then
  fail "missing curl"
fi

if (( failures > 0 )); then
  exit 1
fi

token_tmp="$(mktemp)"
TOKEN_STATUS="$(curl -sS -o "$token_tmp" -w "%{http_code}" -X POST "${SUPABASE_URL%/}/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CG_TEST_EMAIL\",\"password\":\"$CG_TEST_PASSWORD\"}" || true)"
TOKEN_PAYLOAD="$(cat "$token_tmp")"
rm -f "$token_tmp"

if [[ "$TOKEN_STATUS" != "200" ]]; then
  fail "token generation status=$TOKEN_STATUS"
  echo "      body=$TOKEN_PAYLOAD"
  exit 1
fi

TOKEN="$(printf "%s" "$TOKEN_PAYLOAD" | read_json_field "access_token" || true)"
if [[ -z "$TOKEN" ]]; then
  fail "token generation missing access_token"
  echo "      body=$TOKEN_PAYLOAD"
  exit 1
fi
ok "token generation"

request_json "GET" "$BASE_URL/v1/pairs/me"
if [[ "$RESPONSE_STATUS" == "200" ]]; then
  PAIR_ID="$(printf "%s" "$RESPONSE_BODY" | read_json_field "pair.id" || true)"
  ok "GET /v1/pairs/me"
else
  fail "GET /v1/pairs/me status=$RESPONSE_STATUS"
  echo "      body=$RESPONSE_BODY"
  exit 1
fi

if [[ -z "${PAIR_ID:-}" ]]; then
  fail "active pair required from /v1/pairs/me"
  exit 1
fi
ok "pair id resolved"

request_json "GET" "$BASE_URL/v1/pulse?pairId=${PAIR_ID}"
if [[ "$RESPONSE_STATUS" == "200" ]]; then
  ok "GET /v1/pulse"
else
  fail "GET /v1/pulse status=$RESPONSE_STATUS"
  echo "      body=$RESPONSE_BODY"
fi

request_json "POST" "$BASE_URL/v1/pulse" "{\"pairId\":\"$PAIR_ID\",\"mood\":\"Calm\"}"
if [[ "$RESPONSE_STATUS" == "200" ]]; then
  ok "POST /v1/pulse"
else
  fail "POST /v1/pulse status=$RESPONSE_STATUS"
  echo "      body=$RESPONSE_BODY"
fi

request_json "POST" "$BASE_URL/v1/rituals/complete" "{\"pairId\":\"$PAIR_ID\",\"ritualKey\":\"daily\"}"
if [[ "$RESPONSE_STATUS" == "200" ]]; then
  ok "POST /v1/rituals/complete"
else
  fail "POST /v1/rituals/complete status=$RESPONSE_STATUS"
  echo "      body=$RESPONSE_BODY"
fi

request_json "GET" "$BASE_URL/v1/rituals/status?pairId=${PAIR_ID}&ritualKey=daily"
if [[ "$RESPONSE_STATUS" == "200" ]]; then
  COMPLETED="$(printf "%s" "$RESPONSE_BODY" | read_json_field "ritual.completed" || true)"
  if [[ "$COMPLETED" == "true" ]]; then
    ok "GET /v1/rituals/status"
  else
    fail "GET /v1/rituals/status completed!=true"
    echo "      body=$RESPONSE_BODY"
  fi
else
  fail "GET /v1/rituals/status status=$RESPONSE_STATUS"
  echo "      body=$RESPONSE_BODY"
fi

if (( failures > 0 )); then
  echo "FAIL total=$failures"
  exit 1
fi

echo "OK   smoke dashboard"

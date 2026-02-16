set -euo pipefail

cd /Users/axm/dev/CommonGround

LAN_IP="$(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
if [ -z "$LAN_IP" ]; then
  echo "Could not detect LAN IP"
  exit 1
fi

if [ -z "${TOKEN:-}" ]; then
  echo "TOKEN is empty. Run: source tools/dev/cg-token.zsh"
  exit 1
fi

PAIR_JSON="$(curl -sS "http://$LAN_IP:3001/v1/pairs/me" -H "Authorization: Bearer $TOKEN")"
PAIR_ID="$(echo "$PAIR_JSON" | python3 -c 'import sys,json; j=json.load(sys.stdin); print((j.get("pair") or {}).get("id",""))')"

if [ -z "$PAIR_ID" ]; then
  echo "PAIR_ID empty. Raw response:"
  echo "$PAIR_JSON"
  exit 1
fi

MSG_ID="$(python3 - <<'PY'
import uuid
print(str(uuid.uuid4()))
PY
)"

curl -sS -i "http://$LAN_IP:3001/v1/chat/$PAIR_ID/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"messageId\":\"$MSG_ID\",\"text\":\"smoke $(date +%H:%M:%S)\"}" | tail -n 20

echo

curl -sS -i "http://$LAN_IP:3001/v1/chat/$PAIR_ID/list?limit=5" \
  -H "Authorization: Bearer $TOKEN" | tail -n 60

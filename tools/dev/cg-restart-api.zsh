set -euo pipefail

cd /Users/axm/dev/CommonGround

pkill -f "node --watch server.js" 2>/dev/null || true
pkill -f "apps/api" 2>/dev/null || true

rm -f /tmp/cg-api.log

(cd apps/api && npm run dev) >/tmp/cg-api.log 2>&1 &

sleep 1

lsof -nP -iTCP:3001 -sTCP:LISTEN || true
tail -n 60 /tmp/cg-api.log || true

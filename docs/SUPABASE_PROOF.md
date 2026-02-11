# Supabase Chat Proof (Single Artifact)

This is the definitive, repeatable proof path for chat storage backing using the existing chat list endpoint.

## Single curl command

```bash
curl --silent --show-error --fail \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  "${BASE_URL:-http://localhost:3001}/v1/chat/${PAIR_ID}/list?limit=2"

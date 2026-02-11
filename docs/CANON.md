# CommonGround Canon Guardrails

## What Is Canon Locked
- Layer 1 chat behavior is locked.
- Pairing behavior is locked.
- Auth behavior is locked.
- Treat these as parity contracts: preserve inputs, outputs, and user-visible behavior.

## Supabase Scope
- Supabase is dev-only chat backend infrastructure.
- Supabase usage is temporary and replaceable.
- Do not treat Supabase details as product canon.

## Keystone Scope
- Keystone is the immutable core library contract.
- CommonGround owns and injects all secrets; Keystone must not own app secrets.
- Canonical rewrite endpoint is `POST /api/keystone/rewrite`.

## Allowed Changes
- Rewiring only (move plumbing without behavior drift).
- Parity-only modifications (same behavior, same contract).
- UI wiring and integration updates that preserve canon behavior.

## Disallowed Changes
- Refactors that alter runtime behavior.
- Behavior changes to Layer 1 chat, pairing, or auth.
- "Cleanup" that changes contracts or control flow outcomes.
- Schema redesigns or data-model rewrites.

## Where The Truth Lives
- `apps/api/.env` (runtime secrets owned by CommonGround).
- `apps/web/src/lib/keystoneClient.ts` (Keystone client wiring contract).
- `POST /api/keystone/rewrite` (canonical rewrite boundary).
- `apps/api/server.js` (API boundary wiring).
- `docs/CANON.md` (this guardrail policy).

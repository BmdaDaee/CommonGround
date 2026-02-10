# CommonGround API – Development Contract

## Purpose
Prevent Firebase quota exhaustion during development by enforcing a
Supabase-only data backend, while retaining Firebase Admin for auth.

## Dev Backend Mode (REQUIRED)
Development runs in **Supabase-only data mode** with a hard lock.

- Firebase Admin: **auth only** (verifyIdToken)
- Supabase: **all data** (pairing, chat, session state)
- Firestore: **hard-blocked** in development

## Required Environment
NODE_ENV=development
DEV_BACKEND_LOCK=supabase
CHAT_BACKEND=supabase
PAIR_BACKEND=supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

## Enforcement Rules
- Mixed backend mode is not allowed.
- Any Firestore access in dev throws:
  [firestore-lock] DEV_BACKEND_LOCK=supabase blocks Firestore access in development.
- No dual writes. No silent fallbacks.

## Expected Behavior
- /v1/auth/session works (Firebase Admin auth)
- Pairing + chat work (Supabase-backed)
- Firebase-backed routes fail loudly in dev
- This is intentional and correct behavior

## Production
- DEV_BACKEND_LOCK must be unset
- Firebase-only backend is used

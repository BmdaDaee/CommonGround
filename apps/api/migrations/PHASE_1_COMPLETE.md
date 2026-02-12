# API Phase 1 (Supabase Baseline)

Phase 1 completed with Supabase-backed auth/session and pair chat flows.

## Included

- Supabase service role admin client
- Token-protected `/v1` routes
- Pair lifecycle endpoints
- Profile read/update endpoints
- Pair-scoped chat send/list endpoints
- SQL schema in `apps/api/migrations/supabase_schema.sql`

## Runtime assumptions

- `SUPABASE_URL` set
- `SUPABASE_SERVICE_ROLE_KEY` set
- API started via `npm --workspace apps/api run start`

## Next phases

- Expand API test coverage for pair/chat/profile flows
- Add migration smoke checks for schema + policies
- Add CI checks for auth/session regressions

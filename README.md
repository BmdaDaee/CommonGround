# CommonGround Unified Monorepo

This repo combines:
- `apps/web`: Vite React frontend
- `apps/api`: Node/Express backend
- `apps/mobile`: Expo Router mobile app
- `packages/ui`: shared UI components and theme system
- `packages/tokens`: design tokens

## Quick start

1. Install dependencies
```bash
npm install
```

2. Configure API env
```bash
cp apps/api/.env.example apps/api/.env
```

3. Configure mobile env
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

4. Run API
```bash
npm run dev:api
```

5. Run mobile (separate terminal)
```bash
npm run dev:mobile
```

## Auth and data stack

- Mobile auth/session: Supabase client (`@supabase/supabase-js`) with anon key.
- API auth verification: Supabase access token verification.
- API data access: Supabase service role client.

## API endpoints

All `/v1` endpoints expect `Authorization: Bearer <Supabase access token>`.

- `POST /v1/auth/session`
- `POST /v1/pairs`
- `POST /v1/pairs/join`
- `GET /v1/pairs/me`
- `POST /v1/pairs/leave`
- `GET /v1/profile`
- `PUT /v1/profile`
- `POST /v1/chat/:pairId/send`
- `GET /v1/chat/:pairId/list`

## Notes

- OpenAI keys stay server-side in `apps/api`.
- Service role key is server-only; do not expose it to mobile/web clients.
- Theme tokens are loaded from `packages/ui/tokens/index.ts` with safe defaults + JSON overrides.

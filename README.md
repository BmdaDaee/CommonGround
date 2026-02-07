# CommonGround Unified Monorepo

## Prerequisites

- Node.js `20.x` (matches CI in `.github/workflows/check.yml`)
- npm `10+`

## Monorepo Structure

```text
apps/
  api/      Node + Express backend
  mobile/   Expo Router React Native app
  web/      Vite React web app
packages/
  tokens/   Shared design tokens
  ui/       Shared UI components (@cg/ui)
```

## Workspace Command Matrix

| Workspace | Dev | Lint | Test | Build | Typecheck |
| --- | --- | --- | --- | --- | --- |
| root | `npm run dev` | `npm run lint` | - | - | `npm run typecheck` |
| `apps/web` | `npm --workspace apps/web run dev` | `npm --workspace apps/web run lint` | - | `npm --workspace apps/web run build` | - |
| `apps/api` | `npm --workspace apps/api run dev` | - | `npm --workspace apps/api run test` | - | - |
| `apps/mobile` | `npm --workspace apps/mobile run start` | `npm --workspace apps/mobile run lint` | - | - | `npm --workspace apps/mobile run typecheck` |
| `packages/ui` | - | - | - | - | `npm --workspace @cg/ui run typecheck` |
| `packages/tokens` | - | - | - | - | - |

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure API env:
```bash
cp apps/api/.env.example apps/api/.env
```

3. Configure mobile env:
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

4. Run web + API:
```bash
npm run dev
```

5. Run mobile in a separate terminal:
```bash
npm run dev:mobile
```

## Phase 2 Quality Gates

`npm run check` is the main repository gate and now runs:

1. `npm run lint`
2. `npm --workspace apps/web run build`
3. `npm --workspace apps/api run test`

CI (`.github/workflows/check.yml`) installs with `npm ci` and then executes `npm run check`.

---

# Phase 1 Build (Foundation)

This phase ships the stuff that makes everything else possible:

- ✅ **Firebase Auth** (client)
- ✅ **Pairing** (create / join with code)
- ✅ **User profile** (minimal)
- ✅ **Reliable chat** (pair-scoped messages, idempotent send)
- ✅ **Firestore security rules** (pair-scoped, no leakage)

## Firestore data model (Phase 1)

### /users/{uid}
```json
{
  "uid": "...",
  "email": "...",
  "displayName": "...",
  "photoURL": "...",
  "activePairId": "pair_...",
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

### /pairs/{pairId}
```json
{
  "id": "pair_...",
  "code": "AB12CD",
  "status": "PENDING" | "ACTIVE",
  "members": {
    "<uidA>": { "role": "A", "joinedAt": <serverTimestamp> },
    "<uidB>": { "role": "B", "joinedAt": <serverTimestamp> }
  },
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

### /pairs/{pairId}/messages/{messageId}
```json
{
  "id": "<uuid>",
  "clientId": "ios" | "android" | "web" | null,
  "senderId": "<uid>",
  "text": "...",
  "createdAt": <serverTimestamp>,
  "serverCreatedAt": <serverTimestamp>
}
```

## API (Express) endpoints (Phase 1)

All endpoints expect `Authorization: Bearer <Firebase ID token>`.

- `POST /v1/auth/session` (verify token, ensure `/users/{uid}` exists)
- `POST /v1/pairs` (create pair)
- `POST /v1/pairs/join` (join by code)
- `GET /v1/pairs/me` (get active pair)
- `GET /v1/profile` (get user profile)
- `PUT /v1/profile` (update displayName/photoURL)
- `POST /v1/chat/:pairId/send` (idempotent send)
- `GET /v1/chat/:pairId/list` (pagination)

## Firebase setup (dev)

1) Create a Firebase project.
2) Enable **Authentication -> Email/Password**.
3) Create a **service account key JSON** for Admin SDK.
4) Place it at:
   - `apps/api/secrets/firebase-admin-key.json`
   - or set `FIREBASE_SERVICE_ACCOUNT_PATH`.
5) Deploy rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Rules live at `firebase/firestore.rules`.

## Mobile setup (Expo)

Create `apps/mobile/.env` from the example:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in your Firebase web config and API base URL.

## Run instructions

From repo root:

```bash
npm install
```

Terminal A (API):
```bash
npm run dev:api
```

Terminal B (Mobile):
```bash
npm run dev:mobile
```

## Sanity checks

1) `GET http://localhost:3001/health` should return `{ ok: true }`.
2) Mobile: sign up with email/password.
3) Create a pair on device A. Copy code.
4) Join on device B with code.
5) Send messages both ways.
6) In Firestore console, verify messages land under `pairs/{pairId}/messages/...`.


## UI Tokens + Shared UI (merged from repo.txt)

This repo now includes `/packages/tokens` and `/packages/ui` (published locally as `@cg/ui`) for theme tokens and shared, mode-aware UI components (ModeToggle + ChatBubble). The mobile chat screen uses these components.

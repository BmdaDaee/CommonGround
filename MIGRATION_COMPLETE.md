# Migration Complete

CommonGround now runs on a Supabase-only auth and data stack.

## Current state

- Mobile auth client: `@supabase/supabase-js`
- API auth verification: Supabase access token verification
- API data store: Supabase PostgreSQL
- Legacy backend lock/store switching removed from runtime paths

## Mobile requirements met

- RN polyfills loaded before Supabase client init:
  - `react-native-get-random-values`
  - `react-native-url-polyfill/auto`
- `@react-native-masked-view/masked-view` installed
- Supabase session persistence enabled with AsyncStorage

## Token/theme hardening

- Themes import tokens only from `packages/ui/tokens/index.ts`
- Token loader now applies safe defaults and merges JSON overrides
- Required token JSON files are present

## Verification target

Run:
```bash
npm -w apps/mobile run start -- --clear
```

Expected: app bundles and opens iOS in Expo Go without startup crash.

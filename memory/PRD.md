# CommonGround - Product Requirements Document

## Original Problem Statement
Build a relationship app (CommonGround) — a shared emotional space for couples featuring daily sparks, shared lists, astrology, trust-building exercises, AI chat (BentlyAI), and a locked "DeeplyUs" X-rated intimacy mode. Tech: React + FastAPI + Supabase Auth + MongoDB. AI via Emergent LLM Key.

## User-Specified Design Direction
- **Color Palette**: Black, Gold (#D4AF37), Metallic Iridescent Purple (#9D4EDD), Red (#E63946)
- **Vibe**: Anime Vibes with HipHop Urban flows — luxury dark aesthetic
- **Layout**: Card/module bento grid with AI generated avatars geared towards couple's gender and ethnicity

## App Flow
Auth -> BasicSetup (name + birthday) -> Pairing (required) -> Onboarding (gender, partner gender, ethnicity, zodiac, partner zodiac) -> Main App

## Implemented Features (All Tested & Passing)
1. Supabase Auth (email/password sign-in/sign-up)
2. BasicSetup screen (name + birthday) -> sets `basic_setup_complete`
3. Pairing (create code / join code) -> required before onboarding
4. Onboarding (gender, partner gender, ethnicity, zodiac, partner zodiac) -> sets `onboarding_complete`
5. Gender & ethnicity stored in user profile, passed to AI portrait/avatar generation prompts
6. Daily Spark questions with partner answer reveal
7. BentlyAI Chat (multi-vibe: soft, realtalk, savage)
8. BentlyAI as participant in partner chat via @bently mention
9. Partner Chat with media attachments
10. DeeplyUs locked mode (X-rated, sex-positive, no content filters)
11. Love Language Quiz
12. AI Portraits (couple portraits with gender/ethnicity context)
13. AI Avatar generation (individual, with gender/ethnicity context)
14. Astrology deep-dives & horoscope
15. Date Night Generator
16. Shared Playlist
17. Milestones tracker
18. Weekly Reports
19. Push Notifications (Service Worker)
20. Streak tracker
21. Black/Gold/Purple/Red visual theme across all screens

## Backend Key Models
- `UserProfile`: id, supabase_uid, email, display_name, gender, partner_gender, ethnicity, zodiac_sign, partner_zodiac, birth_date, basic_setup_complete, onboarding_complete, deeply_unlocked, love_languages, push_subscription, favorites
- `Pair`: id, code, member_a_uid, member_b_uid, status
- Migration: existing users with onboarding_complete auto-get basic_setup_complete on session

## Tech Stack
- Frontend: React, Framer Motion, @phosphor-icons/react, react-fast-marquee
- Backend: FastAPI, Motor (MongoDB async), Supabase Auth
- AI: Emergent LLM Key (OpenAI text + image generation)
- Fonts: Unbounded (headings), Manrope (body)

## Backlog
- P2: Shared playlist Spotify integration
- P2: Advanced astrology compatibility scoring
- P3: Push notification refinements

# CommonGround - Product Requirements Document

## Original Problem Statement
Build a relationship app (CommonGround) — a shared emotional space for couples featuring daily sparks, shared lists, astrology, trust-building exercises, AI chat (BentlyAI), and a locked "DeeplyUs" X-rated intimacy mode.

## User-Specified Design Direction
- **Color Palette**: Black, Gold (#D4AF37), Metallic Iridescent Purple (#9D4EDD), Red (#E63946)
- **Vibe**: Anime Vibes with HipHop Urban flows — luxury dark aesthetic
- **Layout**: Card/module bento grid with AI generated avatars geared towards couple's gender and ethnicity
- **Fonts**: Unbounded (headings), Manrope (body)

## App Flow
Auth -> BasicSetup (name + birthday) -> Pairing (required) -> Onboarding (gender, partner gender, ethnicity, zodiac, partner zodiac) -> Main App

## Tech Stack
- Frontend: React, Framer Motion, @phosphor-icons/react, react-fast-marquee
- Backend: FastAPI, Motor (MongoDB async), Supabase Auth
- AI: Emergent LLM Key (OpenAI text + image generation)

## Implemented Features
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
16. Shared Playlist with Spotify/YouTube/Apple Music link paste & auto-embed players
17. Mood Boards — AI-generated visual collages based on couple's chat themes, music, and relationship context
18. Milestones tracker
19. Weekly Reports
20. Push Notifications (Service Worker)
21. Streak tracker
22. Black/Gold/Purple/Red visual theme across all screens

## Backend Key Models
- `UserProfile`: id, supabase_uid, email, display_name, gender, partner_gender, ethnicity, zodiac_sign, partner_zodiac, birth_date, basic_setup_complete, onboarding_complete, deeply_unlocked, love_languages, push_subscription, favorites
- `Pair`: id, code, member_a_uid, member_b_uid, status
- `MoodBoard`: id, pair_id, theme, style, image_data, prompt_used
- `SharedPlaylist`: id, pair_id, title, artist, url, platform, notes

## Key API Endpoints
- POST /api/auth/session — create/get session with migration
- PUT /api/profile — update profile (gender, ethnicity, etc.)
- POST /api/mood-boards/generate — generate AI mood board
- GET /api/mood-boards — list mood boards
- POST /api/shared-playlist — add song with platform auto-detection
- POST /api/partner-chat/send — send message, @bently triggers AI response

## Backlog
- P3: Advanced astrology compatibility scoring
- P3: Push notification refinements
- P3: DB query projection optimization for production scale

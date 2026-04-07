# CommonGround - Full Relationship Platform PRD

## Original Problem Statement
Build the CommonGround relationship app — a shared emotional space for couples featuring daily sparks, shared lists, astrology, trust-building exercises, AI chat, intimacy exploration, and personalized date planning. Supabase auth, BentlyAI (OpenAI via Emergent LLM Key).

## Architecture

### Tech Stack
- **Frontend**: React 18, inline CSS theming (Pastel Pulse / Gemstone Pulse)
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Supabase Auth (email/password)
- **AI**: OpenAI GPT-4o (text) + GPT Image 1 (images) via Emergent LLM Key

### App Flow
Auth → Onboarding (4 steps) → Pairing (create/join) → Main App

### Navigation
- **Bottom Nav**: Today | Chat | Us | Me | DeeplyUs
- **Us Sub-Nav** (8): Pathways, Trust, Calendar, Lists, Portraits, Astrology, Playlist, Timeline
- **Me Sub-Nav** (6): Favorites, Journal, Stars, Love Language, Avatar, Profile
- **Home Quick Actions** (9): Horoscope, Partner Chat, Love Language, Our Playlist, Portraits, Timeline, Astrology, Weekly Report, Date Night

## ALL Implemented Features

### Auth & Onboarding
- Supabase email/password auth with sign-up/sign-in toggle
- 4-step onboarding: display name → zodiac → partner zodiac → birth date
- Pair creation/joining with 6-char codes

### Home Screen
- Personalized greeting, daily question, partner sync (both must answer)
- Streak tracker (current/best/total), notification banner
- 9 quick action tiles to all features

### BentlyAI Chat
- CommonGround/DeeplyUs mode toggle, Soft/RealTalk/Savage vibe
- Image attachments, love language personalization, pattern detection

### Partner-to-Partner Chat
- Real-time messaging with 5s polling, sender names, timestamps

### Love Language Quiz
- 15-question A/B quiz, 5 languages, bar chart results, partner comparison
- Personalizes all BentlyAI advice

### Couple Portraits
- GPT Image 1 generation, 6 art styles, gallery, download/share

### AI Avatar
- Individual avatar per partner, 6 styles, stored in profile

### Astrology Deep-Dive
- Birth chart (Sun/Moon/Rising), compatibility score, weekly forecast

### Shared Playlist
- Add songs (title/artist/link/notes), shared between partners, CRUD

### Relationship Milestones
- Timeline with 5 categories, date-ordered, add/delete

### Weekly Report
- AI-generated check-in with stats + personalized suggestions

### Date Night Generator
- Mood (5), Budget (4), Location (3) selectors
- AI-personalized date idea with steps, playlist, food, conversation starter
- History of past generated dates
- Personalized based on zodiac, love language, shared playlist, favorites

### DeeplyUs Locked Mode
- Gemstone Pulse dark theme, unlock gate with consent
- Prompts, Exercises, My Space (items CRUD), Ignite

### Push Notifications
- Service Worker, in-app polling, toggle in Profile

### Other Features
- Growth Pathways, Trust Building, Calendar, Lists, Favorites, Journal, Horoscope
- Profile screen with settings + sign out

## MongoDB Collections
users, sessions, daily_questions, horoscopes, calendar_events, list_items, journal_entries, module_progress, portraits, pairs, chat_messages, deeply_items, partner_messages, shared_playlists, milestones, date_nights

## Status: ALL FEATURES COMPLETE
All P0/P1/P2 + Date Night Generator implemented and tested (100% pass rate across 5 test iterations).

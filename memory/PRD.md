# CommonGround - Full Relationship Platform PRD

## Original Problem Statement
Build the CommonGround relationship app from user's repo. Integrate all original features including: AI avatar generation, couple portraits, growth modules, confessional/journaling, shared calendar, shopping/wishlist, DeeplyUs mode, and astrology profiles. Keep Supabase for auth, use BentlyAI (OpenAI via Emergent LLM key) for AI.

## Architecture

### Tech Stack
- **Frontend**: React 18
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (via Motor)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o via Emergent LLM Key

### User Personas
1. **Couples** - Primary users who want to strengthen their relationship
2. **Long-distance partners** - Need connection tools across distance
3. **Couples in therapy** - Supplementary tool for relationship work

## Core Requirements (Static)

### Authentication
- Supabase email/password auth
- Session management with JWT tokens

### Features
1. **Daily Questions** - AI-generated conversation starters
2. **BentlyAI Chat** - Relationship coaching with pattern detection
3. **Horoscopes** - Daily relationship horoscopes based on zodiac
4. **Trust Building** - Guided exercises for connection
5. **Growth Pathways** - 7-14 day relationship improvement modules
6. **Confessional/Journal** - Private journaling with AI analysis
7. **Shared Calendar** - Events and reminders
8. **Shopping/Wishlist** - Lists with AI ingredient/gift suggestions
9. **Favorites** - Music, games, movies sharing
10. **Vibe Selector** - Soft/Real Talk/Savage modes
11. **Mode Toggle** - CommonGround (light) / DeeplyUs (dark)

## What's Been Implemented ✅

### Date: 2026-04-07

**Backend (server.py)**
- All API endpoints for features above
- Supabase JWT verification
- MongoDB models for all data types
- AI text generation via Emergent LLM key
- Pattern detection for chat
- Astrology profile generation

**Frontend**
- Complete UI with Pastel Pulse (light) / Gemstone Pulse (dark) themes
- All screens: Home, Chat, Horoscope, Trust, Modules, Calendar, Lists, Journal, Favorites
- Sub-navigation for Us and Me tabs
- BentlyAI chat with vibe selector
- Daily question system
- Growth pathway exercises with day tracking

## Prioritized Backlog

### P0 (Critical)
- ✅ Core auth flow
- ✅ Chat with AI
- ✅ Daily questions
- ✅ Basic navigation

### P1 (Important)
- ✅ Growth modules
- ✅ Trust exercises
- ✅ Calendar
- ✅ Lists (shopping/wishlist)
- ✅ Journal/Confessional
- 🔲 Pairing system (create/join codes)
- 🔲 Partner sync for daily questions

### P2 (Nice to have)
- 🔲 AI Avatar generation (Imagen API)
- 🔲 Couple portraits
- 🔲 DeeplyUs intimate features
- 🔲 Push notifications
- 🔲 Onboarding flow with astrology setup

## Next Tasks
1. Implement pairing system for couples
2. Add partner sync to see each other's answers
3. Implement onboarding flow with astrology
4. Add AI avatar generation (need Imagen API access)
5. DeeplyUs mode with intimate suggestions

## Technical Notes
- Supabase using new API keys (publishable + secret)
- Emergent LLM key: sk-emergent-7990c1cFd97238e2f9
- MongoDB collections: users, sessions, daily_questions, horoscopes, calendar_events, list_items, journal_entries, module_progress, portraits

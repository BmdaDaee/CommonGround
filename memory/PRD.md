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
1. **Onboarding** - 4-step flow: name, zodiac, partner zodiac, birth date
2. **Pairing System** - Create/join pair codes to link couples
3. **Daily Questions** - AI-generated conversation starters
4. **BentlyAI Chat** - Relationship coaching with pattern detection + mode toggle
5. **Horoscopes** - Daily relationship horoscopes based on zodiac
6. **Trust Building** - Guided exercises for connection
7. **Growth Pathways** - 7-14 day relationship improvement modules
8. **Confessional/Journal** - Private journaling with AI analysis
9. **Shared Calendar** - Events and reminders
10. **Shopping/Wishlist** - Lists with AI ingredient/gift suggestions
11. **Favorites** - Music, games, movies sharing
12. **Vibe Selector** - Soft/Real Talk/Savage modes
13. **Mode Toggle** - CommonGround (light) / DeeplyUs (dark)
14. **DeeplyUs Locked Mode** - Intimate space with prompts, exercises, items, ignite

## What's Been Implemented

### Date: 2026-04-07

**Backend (server.py)**
- All API endpoints for features above
- Supabase JWT verification
- MongoDB models for all data types
- AI text generation via Emergent LLM key
- Pattern detection for chat
- Astrology profile generation
- DeeplyUs endpoints: unlock, prompts, exercises, items CRUD, ignite, explore
- Pairing system: create, join, get, leave
- Couple portraits (prompt-only, no image gen yet)

**Frontend**
- Complete UI with Pastel Pulse (light) / Gemstone Pulse (dark) themes
- All screens: Home, Chat, Horoscope, Trust, Modules, Calendar, Lists, Journal, Favorites
- Onboarding flow: 4-step wizard (name → zodiac → partner zodiac → birth date)
- Pairing screen: Create/Join pair with code system
- DeeplyUs locked mode: unlock gate, prompts, exercises, my space (items), ignite
- Sub-navigation for Us and Me tabs
- BentlyAI chat with vibe selector and mode toggle
- Daily question system
- Growth pathway exercises with day tracking
- 5-tab bottom navigation: Today, Chat, Us, Me, DeeplyUs

## Prioritized Backlog

### P0 (Critical) - DONE
- Auth flow
- Chat with AI
- Daily questions
- Basic navigation
- Onboarding (4-step wizard)
- Pairing system (create/join codes)
- DeeplyUs locked mode (prompts, exercises, items, ignite)

### P1 (Important)
- Growth modules
- Trust exercises
- Calendar
- Lists (shopping/wishlist)
- Journal/Confessional
- Media attachments in chat (images/files)
- Couple portraits with actual AI image generation

### P2 (Nice to have)
- AI Avatar generation (Imagen API)
- Push notifications
- Partner sync for daily questions (see partner's answers)
- Onboarding flow with astrology deep-dive

## Technical Notes
- Supabase using new API keys (publishable + secret)
- Emergent LLM key: sk-emergent-7990c1cFd97238e2f9
- MongoDB collections: users, sessions, daily_questions, horoscopes, calendar_events, list_items, journal_entries, module_progress, portraits, pairs, chat_messages, deeply_items

# CommonGround - Full Relationship Platform PRD

## Original Problem Statement
Build the CommonGround relationship app from user's repo. Integrate all original features including: AI avatar generation, couple portraits, growth modules, confessional/journaling, shared calendar, shopping/wishlist, DeeplyUs mode, and astrology profiles. Keep Supabase for auth, use BentlyAI (OpenAI via Emergent LLM key) for AI.

## Architecture

### Tech Stack
- **Frontend**: React 18
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (via Motor)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o + GPT Image 1 via Emergent LLM Key

### Code Structure
```
/app/
├── backend/
│   ├── .env (MONGO_URL, DB_NAME, SUPABASE_URL, SUPABASE_KEY, EMERGENT_LLM_KEY)
│   ├── requirements.txt
│   ├── server.py (FastAPI, all endpoints)
│   └── tests/
├── frontend/
│   ├── .env (REACT_APP_BACKEND_URL, SUPABASE vars)
│   ├── public/sw.js (Service Worker for push notifications)
│   └── src/
│       ├── App.js (Main routing: Auth → Onboarding → Pairing → MainApp)
│       ├── context/ (AuthContext.js, AppContext.js)
│       ├── lib/ (api.js, supabase.js, theme.js, notifications.js)
│       └── components/ (All screens)
```

## Implemented Features

### Auth & Onboarding (DONE)
- Supabase email/password auth
- 4-step onboarding wizard (name, zodiac, partner zodiac, birth date)
- Pair creation/joining with codes

### Core Features (DONE)
- **Daily Questions**: AI-generated, categorized conversation starters
- **Partner Sync**: Both answers revealed only after both submit
- **BentlyAI Chat**: Relationship coaching with mode toggle + vibe selector + media attachments
- **Growth Pathways**: 7-14 day relationship improvement modules
- **Trust Building**: Guided exercises for connection
- **Shared Calendar**: Events and reminders
- **Shopping/Wishlist**: Lists with AI ingredient/gift suggestions
- **Favorites**: Music, games, movies sharing
- **Journal**: Private entries with AI analysis

### Love Language Quiz (DONE)
- 15-question A/B quiz covering 5 love languages
- Scores stored in profile, results show bar chart breakdown
- Partner results shown when both complete
- BentlyAI personalizes all advice based on love language

### Couple Portraits (DONE)
- AI image generation via GPT Image 1 (Emergent LLM Key)
- 6 art styles: Anime, Watercolor, Oil Painting, Digital Art, Pencil Sketch, Pop Art
- Gallery view of generated portraits

### Astrology Deep-Dive (DONE)
- Full birth chart: Sun, Moon, Rising signs
- Element, Modality, Personality summary
- Love style analysis, Compatibility score
- Strengths/Challenges, Weekly forecast, Advice

### Push Notifications (DONE)
- Service Worker + Browser Notification API
- In-app notification polling
- Toggle on/off in Profile settings
- Alerts for: daily questions, partner answers, love language quiz prompt

### DeeplyUs Locked Mode (DONE)
- Gemstone Pulse dark theme
- Unlock gate with consent prompt
- Sub-tabs: Prompts, Exercises, My Space, Ignite
- Items CRUD: fantasies, desires, insecurities, boundaries
- AI intimate suggestions via BentlyAI

### Navigation (DONE)
- 5-tab bottom nav: Today, Chat, Us, Me, DeeplyUs
- Us sub-nav: Pathways, Trust, Calendar, Lists, Portraits, Astrology
- Me sub-nav: Favorites, Journal, Stars, Love Language, Profile
- Profile screen with user info, notification settings, sign out

## Prioritized Backlog

### P0 — COMPLETED
All core features implemented and tested

### P1 — Future
- Real-time partner-to-partner messaging (currently AI-only chat)
- Streak tracker for daily questions
- Shared music playlists integration

### P2 — Nice to Have
- AI Avatar generation (custom avatar creation)
- Social sharing of portraits
- Relationship milestone tracking
- Weekly relationship reports

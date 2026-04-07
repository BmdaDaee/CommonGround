# CommonGround - Full Relationship Platform PRD

## Original Problem Statement
Build the CommonGround relationship app from user's repo. A shared emotional space for couples featuring daily sparks, shared lists, astrology, trust-building exercises, AI chat, and intimate exploration. Supabase auth, BentlyAI (OpenAI via Emergent LLM Key).

## Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind-style inline CSS, Shadcn/UI base components
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB
- **Auth**: Supabase Auth (email/password)
- **AI**: OpenAI GPT-4o (text) + GPT Image 1 (images) via Emergent LLM Key

### Code Structure
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py (~1400 lines, all endpoints)
├── frontend/
│   ├── .env
│   ├── public/sw.js (Service Worker)
│   └── src/
│       ├── App.js (Auth → Onboarding → Pairing → MainApp routing)
│       ├── context/ (AuthContext.js, AppContext.js)
│       ├── lib/ (api.js, supabase.js, theme.js, notifications.js)
│       └── components/
│           ├── AuthScreen.js, OnboardingScreen.js, PairingScreen.js
│           ├── HomeScreen.js (daily Q, streak, notifications, 8 quick actions)
│           ├── ChatScreen.js (BentlyAI + media attachments)
│           ├── PartnerChatScreen.js (P2P messaging)
│           ├── DeeplyUsScreen.js (locked intimate mode)
│           ├── LoveLanguageScreen.js (15-Q quiz + results)
│           ├── PortraitsScreen.js (AI image gen + download/share)
│           ├── AstrologyScreen.js (birth chart + compatibility)
│           ├── AvatarScreen.js (AI personal avatar)
│           ├── SharedPlaylistScreen.js (shared music)
│           ├── MilestonesScreen.js (relationship timeline)
│           ├── WeeklyReportScreen.js (AI weekly check-in)
│           ├── ProfileScreen.js (settings, notifications, sign out)
│           ├── NotificationSettings.js
│           ├── HoroscopeScreen.js, TrustScreen.js, ModulesScreen.js
│           ├── CalendarScreen.js, ListsScreen.js, JournalScreen.js
│           ├── FavoritesScreen.js, ToolsScreen.js
│           ├── BottomNav.js (5 tabs), SubNav.js (Us: 8, Me: 6)
│           └── ui/ (Shadcn components)
```

## All Implemented Features

### Auth & Onboarding
- Supabase email/password auth
- 4-step onboarding: name, zodiac, partner zodiac, birth date
- Pair creation/joining with codes

### Home Screen
- Personalized greeting
- Daily question with submit/view
- Partner answer sync (both must answer to reveal)
- Streak tracker (current, best, total)
- In-app notifications
- 8 quick action tiles

### BentlyAI Chat
- Mode toggle: CommonGround / DeeplyUs
- Vibe selector: Soft / Real Talk / Savage
- Image attachment support
- Love language personalization
- Pattern detection

### Partner-to-Partner Chat (P1)
- Real-time messaging with 5s polling
- Sender name + timestamps
- Media attachment support

### Love Language Quiz
- 15-question A/B format, 5 languages
- Score breakdown with bar chart
- Partner comparison
- Personalizes all BentlyAI advice

### Couple Portraits
- GPT Image 1 via Emergent LLM Key
- 6 art styles
- Gallery + download/share

### AI Avatar
- Individual avatar generation per partner
- 6 styles: Anime, Watercolor, Pixel Art, Cartoon, Realistic, Chibi
- Stored in profile

### Astrology Deep-Dive
- Full birth chart: Sun, Moon, Rising
- Element, Modality, Personality, Love Style
- Compatibility score + strengths/challenges
- Weekly forecast + advice

### Shared Playlist
- Add songs with title, artist, link, notes
- See who added each song
- Delete songs

### Relationship Milestones
- Timeline view with colored dots
- 5 categories: Firsts, Anniversaries, Trips, Milestones, Other
- Date-ordered with descriptions

### Weekly Report
- AI-generated relationship check-in
- Stats: questions answered together, messages exchanged
- Personalized suggestions

### DeeplyUs Locked Mode
- Gemstone Pulse dark theme
- Unlock gate with consent
- Prompts, Exercises, My Space (items CRUD), Ignite

### Push Notifications
- Service Worker + Browser Notification API
- In-app polling
- Toggle in Profile

### Other Features
- Growth Pathways (7-14 day modules)
- Trust Building exercises
- Shared Calendar
- Shopping/Wishlist with AI suggestions
- Favorites (Music, Games, Movies)
- Private Journal with AI analysis
- Daily Horoscope

## Navigation Structure
- **Bottom Nav**: Today | Chat | Us | Me | DeeplyUs
- **Us Sub-Nav**: Pathways, Trust, Calendar, Lists, Portraits, Astrology, Playlist, Timeline
- **Me Sub-Nav**: Favorites, Journal, Stars, Love Language, Avatar, Profile

## MongoDB Collections
users, sessions, daily_questions, horoscopes, calendar_events, list_items, journal_entries, module_progress, portraits, pairs, chat_messages, deeply_items, partner_messages, shared_playlists, milestones

## Status: ALL P0/P1/P2 COMPLETE

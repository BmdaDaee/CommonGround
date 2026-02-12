# Supabase Migration - Phase 1 Complete

## ✅ What's Done

1. **Schema Created** - All tables, indexes, triggers, RLS policies deployed to Supabase
2. **Services Created** - Supabase versions of chat and pairs services
3. **Environment Configured** - `.env` file with Supabase credentials
4. **Backend Lock** - Set to `supabase` in `.env`

## 📁 Files Created

```
apps/api/
├── .env                              # Supabase credentials
├── lib/
│   └── supabaseAdmin.js             # Supabase client (updated)
├── services/
│   ├── chat.supabase.js             # Chat service (Supabase)
│   └── pairs.supabase.js            # Pairs service (Supabase)
└── migrations/
    └── supabase_schema.sql          # Database schema
```

## 🔄 Current State: HYBRID

- **Firebase**: Auth, user profiles, pair creation/joining (still active)
- **Supabase**: Chat messages (ready to use)

## 🚀 Next Steps

### Option A: Test Supabase Services (Recommended)

Update your routes to use Supabase services:

**File: `apps/api/routes/v1/chat.js`**
```javascript
// Change line 3 from:
const { sendMessage, listMessages } = require("../../services/chat");

// To:
const { sendMessage, listMessages } = require("../../services/chat.supabase");
```

**File: `apps/api/routes/v1/pairs.js`** (if exists)
```javascript
// Change from:
const { createPair, joinPair, ... } = require("../../services/pairs");

// To:
const { createPair, joinPair, ... } = require("../../services/pairs.supabase");
```

### Option B: Keep Firebase (For Now)

If you want to keep using Firebase while testing Supabase:
- Change `DEV_BACKEND_LOCK=firebase` in `.env`
- Test Supabase services separately

## 🧪 Testing Supabase

```bash
# Start API server
cd /Users/axm/dev/CommonGround/apps/api
npm run dev

# Test endpoints
curl http://localhost:3000/v1/chat/messages?pairId=test_pair
```

## 🔑 Key Differences: Firebase → Supabase

### User IDs
- **Firebase**: `uid` (string)
- **Supabase**: `id` (UUID)

### Timestamps
- **Firebase**: `FieldValue.serverTimestamp()` → Firestore Timestamp
- **Supabase**: `DEFAULT NOW()` → ISO 8601 string

### Queries
- **Firebase**: Firestore collections + `.where()` queries
- **Supabase**: PostgreSQL + `.select()` queries

### Auth
- **Firebase**: Firebase Auth (still using for now)
- **Supabase**: Will migrate to Supabase Auth in Phase 2

## 📊 Schema Overview

```
auth.users (Supabase managed)
   ↓
profiles (app-specific user data)
   ├── display_name
   ├── photo_url
   └── active_pair_id → pairs.id
   
pairs
   ├── id (TEXT: "pair_abc123")
   ├── code (TEXT: "AB12CD")
   └── status (ENUM: PENDING/ACTIVE/INACTIVE)
   
pair_members (join table)
   ├── pair_id → pairs.id
   ├── user_id → auth.users.id
   ├── role (ENUM: A/B/CREATOR/JOINER)
   └── left_at (nullable timestamp)
   
messages
   ├── id (TEXT: client UUID)
   ├── pair_id → pairs.id
   ├── sender_id → auth.users.id
   └── text (max 4000 chars)
```

## 🐛 Troubleshooting

**Issue**: Routes return 500 errors
- Check `.env` file exists in `/apps/api/`
- Verify Supabase credentials are correct
- Check `console.log` output for specific errors

**Issue**: Messages not appearing
- Verify pair_members table has active memberships
- Check RLS policies allow access
- Use service_role key (bypasses RLS)

**Issue**: "user_already_paired" error
- Clear `profiles.active_pair_id` for test users
- Or leave existing pair first

## 📝 Migration Phases

- [x] **Phase 1**: Chat messages → Supabase (DONE)
- [ ] **Phase 2**: Auth → Supabase Auth
- [ ] **Phase 3**: Pairs & profiles → Supabase
- [ ] **Phase 4**: Remove all Firebase code

## 💡 Pro Tips

1. **Test with Postman/curl first** before hitting from mobile app
2. **Use Supabase Studio** to inspect data in real-time
3. **Service role key bypasses RLS** - good for backend, bad for frontend
4. **Check Supabase logs** in Dashboard → Database → Logs

---

Need help? The schema and services are ready. Just update your route imports and test!

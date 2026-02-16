#!/usr/bin/env bash

set -e

echo "🔧 CommonGround-AI setup starting..."

# 1. Ensure base directories exist
echo "📁 Ensuring directory structure..."

mkdir -p persona
mkdir -p services
mkdir -p config
mkdir -p models
mkdir -p tests
mkdir -p secrets

# 2. Normalize test files into /tests
echo "🧪 Moving test files into /tests (if any remain in root)..."

for f in test*.js; do
  if [ -f "$f" ]; then
    echo "   → Moving $f → tests/$f"
    mv "$f" "tests/$f"
  fi
done

# 3. Core service files (create if missing, but DO NOT overwrite)
echo "⚙️ Ensuring core service files exist..."

if [ ! -f "services/session.js" ]; then
  cat << 'EOF' > services/session.js
// services/session.js
// Unified entrypoint for sending a message to BentlyAI

const { askPersona, MODES } = require("./ai");
const { getUserById, getRelationshipById } = require("./db");

async function sendToBentlyAI({ userId, relationshipId, message, mode }) {
  if (!userId) {
    throw new Error("sendToBentlyAI requires userId");
  }
  if (!message || typeof message !== "string") {
    throw new Error("sendToBentlyAI requires a non-empty message string");
  }

  const userProfile = await getUserById(userId);
  const relationshipProfile = relationshipId
    ? await getRelationshipById(relationshipId)
    : null;

  const reply = await askPersona(message, {
    mode: mode || MODES.DEFAULT,
    userProfile,
    relationshipProfile,
  });

  return reply;
}

module.exports = { sendToBentlyAI };
EOF
  echo "   → Created services/session.js"
else
  echo "   → services/session.js already exists, leaving it alone."
fi

# 4. OpenAI config (only if missing)
echo "🤖 Ensuring OpenAI config exists..."

if [ ! -f "config/openaiConfig.js" ]; then
  cat << 'EOF' > config/openaiConfig.js
// config/openaiConfig.js
// Centralized OpenAI client config

require("dotenv").config();
const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[openaiConfig] WARNING: OPENAI_API_KEY is not set. OpenAI calls will fail until you configure it in .env"
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;
EOF
  echo "   → Created config/openaiConfig.js"
else
  echo "   → config/openaiConfig.js already exists, leaving it alone."
fi

# 5. Basic model placeholders if missing (won't overwrite your real ones)
echo "🧬 Ensuring model stubs exist (user, relationship, session)..."

if [ ! -f "models/user.js" ]; then
  cat << 'EOF' > models/user.js
// models/user.js
// Shape helper for user documents

function buildUserDoc(partial = {}) {
  return {
    id: partial.id || null,
    displayName: partial.displayName || "",
    email: partial.email || "",
    onboardingStatus: partial.onboardingStatus || "not_started",
    preferences: partial.preferences || {
      contentLevel: "PG_13",
      intimacyComfort: "medium",
    },
    insights: partial.insights || {
      summary: "",
      emotionalPatterns: {},
    },
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { buildUserDoc };
EOF
  echo "   → Created models/user.js stub"
else
  echo "   → models/user.js already exists, leaving it alone."
fi

if [ ! -f "models/relationship.js" ]; then
  cat << 'EOF' > models/relationship.js
// models/relationship.js
// Shape helper for relationship documents

function buildRelationshipDoc(partial = {}) {
  return {
    id: partial.id || null,
    partners: partial.partners || {
      userAId: null,
      userBId: null,
    },
    status: partial.status || "active",
    contentLevel: partial.contentLevel || "PG_13",
    boundaries: partial.boundaries || [],
    insights: partial.insights || {
      summary: "",
      emotionalPatterns: {},
    },
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { buildRelationshipDoc };
EOF
  echo "   → Created models/relationship.js stub"
else
  echo "   → models/relationship.js already exists, leaving it alone."
fi

if [ ! -f "models/session.js" ]; then
  cat << 'EOF' > models/session.js
// models/session.js
// Optional: shape for chat sessions (conversation history, mode, etc.)

function buildSessionDoc(partial = {}) {
  return {
    id: partial.id || null,
    userId: partial.userId || null,
    relationshipId: partial.relationshipId || null,
    mode: partial.mode || "DEFAULT",
    messages: partial.messages || [],
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { buildSessionDoc };
EOF
  echo "   → Created models/session.js stub"
else
  echo "   → models/session.js already exists, leaving it alone."
fi

# 6. Ensure .gitignore is sane (only write if missing)
if [ ! -f ".gitignore" ]; then
  echo "🧹 Creating default .gitignore..."
  cat << 'EOF' > .gitignore
# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Env & Secrets
.env
.env.local
.env.development
.env.production
secrets/

# System files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Build output
dist/
build/

# Expo/React Native (future)
.expo/
.expo-shared/
android/
ios/

# Misc
*.swp
EOF
else
  echo "🧹 .gitignore already exists, leaving it alone."
fi

# 7. Gentle reminder about secrets
echo "🔐 Reminder: make sure you have:"
echo "   - .env (with OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)"

echo "✅ CommonGround-AI setup complete."

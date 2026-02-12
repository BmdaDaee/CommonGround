-- ============================================================================
-- CommonGround: Supabase Schema Migration
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  photo_url TEXT,
  active_pair_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAIRS TABLE
CREATE TABLE IF NOT EXISTS pairs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAIR_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS pair_members (
  pair_id TEXT NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('A', 'B', 'CREATOR', 'JOINER')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (pair_id, user_id)
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  text TEXT NOT NULL CHECK (LENGTH(text) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_active_pair ON profiles(active_pair_id);

CREATE INDEX IF NOT EXISTS idx_pairs_code ON pairs(code);
CREATE INDEX IF NOT EXISTS idx_pairs_status ON pairs(status);

CREATE INDEX IF NOT EXISTS idx_pair_members_user_id ON pair_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pair_members_active ON pair_members(pair_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_pair_id ON messages(pair_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair_created ON messages(pair_id, server_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair_sender ON messages(pair_id, sender_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'photo_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_pair_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pairs_updated_at ON pairs;
CREATE TRIGGER update_pairs_updated_at
  BEFORE UPDATE ON pairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- PAIRS POLICIES
DROP POLICY IF EXISTS "Users can read own pairs" ON pairs;
CREATE POLICY "Users can read own pairs"
  ON pairs FOR SELECT
  USING (
    id IN (
      SELECT pair_id FROM pair_members 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Service role full access to pairs" ON pairs;
CREATE POLICY "Service role full access to pairs"
  ON pairs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- PAIR_MEMBERS POLICIES
DROP POLICY IF EXISTS "Users can read pair members" ON pair_members;
CREATE POLICY "Users can read pair members"
  ON pair_members FOR SELECT
  USING (
    pair_id IN (
      SELECT pair_id FROM pair_members 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Service role full access to pair_members" ON pair_members;
CREATE POLICY "Service role full access to pair_members"
  ON pair_members FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can read messages from own pairs" ON messages;
CREATE POLICY "Users can read messages from own pairs"
  ON messages FOR SELECT
  USING (
    pair_id IN (
      SELECT pair_id FROM pair_members 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can send messages to own pairs" ON messages;
CREATE POLICY "Users can send messages to own pairs"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND pair_id IN (
      SELECT pair_id FROM pair_members 
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Service role full access to messages" ON messages;
CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

function looksLikeJwt(s) {
  const dotCount = (s.match(/\./g) || []).length;
  return dotCount >= 2;
}

function looksLikeSbSecret(s) {
  return /^sb_secret_[A-Za-z0-9_-]+$/.test(s);
}

if (!/^https?:\/\//i.test(SUPABASE_URL)) {
  throw new Error("Missing/invalid SUPABASE_URL in apps/api/.env");
}

if (!SUPABASE_SERVICE_ROLE_KEY || !(looksLikeSbSecret(SUPABASE_SERVICE_ROLE_KEY) || looksLikeJwt(SUPABASE_SERVICE_ROLE_KEY))) {
  throw new Error("Missing/invalid SUPABASE_SERVICE_ROLE_KEY in apps/api/.env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabase };

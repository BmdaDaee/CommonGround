// middleware/requireAuth.js

const { supabase } = require("../lib/supabaseAdmin");

function toProfilePatch(user) {
  const metadata = user?.user_metadata || {};

  const displayName =
    metadata.display_name || metadata.name || metadata.full_name || user?.email || null;
  const photoUrl = metadata.photo_url || metadata.avatar_url || metadata.picture || null;

  const patch = {};
  if (typeof displayName === "string" && displayName.trim()) {
    patch.display_name = displayName.trim();
  }
  if (typeof photoUrl === "string" && photoUrl.trim()) {
    patch.photo_url = photoUrl.trim();
  }

  return patch;
}

/**
 * Supabase Auth middleware
 * - Expects: Authorization: Bearer <Supabase access token>
 * - Sets: req.auth = { uid, token, user }
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: "missing_bearer_token" });
    }

    const accessToken = match[1];
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      if (error) {
        console.error("AUTH VERIFY ERROR:", error.message);
      }
      return res.status(401).json({ error: "invalid_token" });
    }

    const user = data.user;
    req.auth = {
      uid: user.id,
      token: toProfilePatch(user),
      user,
    };

    return next();
  } catch (err) {
    console.error("AUTH VERIFY ERROR:", err);
    return res.status(401).json({ error: "invalid_token" });
  }
}

module.exports = { requireAuth };

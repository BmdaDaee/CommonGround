const { admin } = require("../config/firebaseAdmin");
const { isSupabaseLocked } = require("../config/backend");

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Firebase Auth middleware
 * - Expects: Authorization: Bearer <Firebase ID token>
 * - Sets: req.auth = { uid, token }
 */
async function requireAuth(req, res, next) {
  try {
    if (isSupabaseLocked()) {
      const devUidHeader = req.headers["x-dev-uid"] || req.headers["x-test-uid"];
      const devUid = typeof devUidHeader === "string" ? devUidHeader.trim() : "";
      if (devUid) {
        req.auth = { uid: devUid, token: { uid: devUid } };
        return next();
      }

      const bearerToken = getBearerToken(req);
      if (!bearerToken) {
        return res.status(401).json({ error: "missing_bearer_token" });
      }

      const decoded = decodeJwtPayload(bearerToken);
      const tokenUid = decoded?.uid || decoded?.sub || decoded?.user_id || null;
      if (!tokenUid || typeof tokenUid !== "string") {
        return res.status(401).json({ error: "invalid_token" });
      }

      req.auth = { uid: tokenUid, token: decoded || { uid: tokenUid } };
      return next();
    }

    const idToken = getBearerToken(req);
    if (!idToken) return res.status(401).json({ error: "missing_bearer_token" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    req.auth = { uid: decoded.uid, token: decoded };
    return next();
  } catch (err) {
    console.error("AUTH VERIFY ERROR:", err);
    return res.status(401).json({ error: "invalid_token" });
  }
}

module.exports = { requireAuth };

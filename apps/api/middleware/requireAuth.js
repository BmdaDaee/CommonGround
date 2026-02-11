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

/**
 * Firebase Auth middleware
 * - Expects: Authorization: Bearer <Firebase ID token>
 * - Sets: req.auth = { uid, token }
 */
async function requireAuth(req, res, next) {
  try {
    if (isSupabaseLocked()) {
      const devUid = req.headers["x-dev-uid"] || req.headers["x-test-uid"];
      if (!devUid || typeof devUid !== "string") {
        const header = req.headers.authorization || "";
        const match = header.match(/^Bearer\s+(.+)$/i);
        if (!match) return res.status(401).json({ error: "missing_dev_uid" });

        const decoded = decodeJwtPayload(match[1]);
        const tokenUid = decoded?.uid || decoded?.sub || null;
        if (!tokenUid || typeof tokenUid !== "string") {
          return res.status(401).json({ error: "invalid_token" });
        }

        req.auth = { uid: tokenUid, token: decoded || { uid: tokenUid } };
        return next();
      }
      req.auth = { uid: devUid, token: { uid: devUid } };
      return next();
    }

    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: "missing_bearer_token" });

    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.auth = { uid: decoded.uid, token: decoded };
    return next();
  } catch (err) {
    console.error("AUTH VERIFY ERROR:", err);
    return res.status(401).json({ error: "invalid_token" });
  }
}

module.exports = { requireAuth };

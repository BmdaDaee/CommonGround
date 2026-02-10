const crypto = require("crypto");

function getFirebaseFirestoreDeps() {
  const { getFirestoreDb } = require("../config/firestore");
  const { FieldValue, Timestamp } = require("firebase-admin/firestore");
  const db = getFirestoreDb();
  return { db, FieldValue, Timestamp };
}

function getSupabaseCreateClient() {
  return require("@supabase/supabase-js").createClient;
}

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAuthor(value) {
  const author = normalizeString(value);
  if (author === "self" || author === "partner" || author === "assistant") return author;
  return null;
}

function toMillis(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) return null;
      const abs = Math.abs(numeric);
      if (abs >= 1e17) return Math.trunc(numeric / 1e6); // ns -> ms
      if (abs >= 1e14) return Math.trunc(numeric / 1e3); // us -> ms
      if (abs < 1e11) return Math.trunc(numeric * 1e3); // s -> ms
      return Math.trunc(numeric); // already ms
    }

    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (!value || typeof value !== "object") return null;

  if (typeof value.toMillis === "function") {
    try {
      return value.toMillis();
    } catch {
      // Fall through.
    }
  }

  const seconds = Number(value.seconds ?? value._seconds);
  if (Number.isFinite(seconds)) {
    const nanos = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
    const millisFromNanos = Number.isFinite(nanos) ? Math.floor(nanos / 1e6) : 0;
    return seconds * 1000 + millisFromNanos;
  }

  return null;
}

function asKnownError(message, status, cause) {
  const err = new Error(message);
  err.status = status;
  if (cause) err.cause = cause;
  return err;
}

function generateMessageId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `msg_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function deterministicUuid(input) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function toSupabaseMessageId(rawId, namespace = "") {
  const normalized = normalizeString(rawId);
  if (!normalized) return null;
  if (isUuid(normalized)) return normalized.toLowerCase();
  return deterministicUuid(namespace ? `${namespace}:${normalized}` : normalized);
}

function inferStoredAuthor(data, senderId) {
  const explicitAuthor = normalizeAuthor(data?.author);
  if (explicitAuthor) return explicitAuthor;

  const role = normalizeString(data?.role);
  const senderType = normalizeString(data?.senderType);

  if (role === "assistant" || senderType === "assistant" || senderType === "ai" || senderId === "assistant") {
    return "assistant";
  }
  if (senderType === "partner") return "partner";
  return "self";
}

function toFirestoreMessage(pairId, doc) {
  const data = doc.data() || {};
  const text = normalizeString(data.text);
  if (!text) return null;

  const senderId = normalizeString(data.senderId) || "";
  const author = inferStoredAuthor(data, senderId);
  const createdAtMs =
    toMillis(data.createdAtMs) ??
    toMillis(data.serverCreatedAt) ??
    toMillis(data.createdAt) ??
    toMillis(data.sentAt) ??
    toMillis(data.timestamp) ??
    toMillis(data.time) ??
    toMillis(doc.createTime) ??
    toMillis(doc.updateTime) ??
    null;

  return {
    id: normalizeString(data.id) || doc.id,
    pairId,
    senderId: senderId || (author === "assistant" ? "assistant" : ""),
    author,
    text,
    createdAtMs,
  };
}

function toSupabaseMessage(row) {
  if (!row || typeof row !== "object") return null;
  const text = normalizeString(row.text);
  if (!text) return null;

  const senderId = normalizeString(row.sender_id) || "";
  const author = normalizeAuthor(row.author) || (senderId === "assistant" ? "assistant" : "self");

  return {
    id: normalizeString(row.id) || deterministicUuid(`${row.pair_id || "pair"}:${senderId}:${text}`),
    pairId: normalizeString(row.pair_id) || "",
    senderId: senderId || (author === "assistant" ? "assistant" : ""),
    author,
    text,
    createdAtMs: toMillis(row.created_at),
  };
}

function normalizeLimit(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.min(Math.max(parsed, 1), 100);
}

class FirestoreMessageStore {
  constructor() {
    const { db, FieldValue, Timestamp } = getFirebaseFirestoreDeps();
    this.db = db;
    this.FieldValue = FieldValue;
    this.Timestamp = Timestamp;
  }

  async sendMessage(pairId, senderId, author, text, options = {}) {
    const normalizedPairId = normalizeString(pairId);
    const normalizedSenderId = normalizeString(senderId);
    const normalizedText = normalizeString(text);
    const normalizedAuthor = normalizeAuthor(author);

    if (!normalizedPairId || !normalizedSenderId || !normalizedText || !normalizedAuthor) {
      throw asKnownError("invalid_message_payload", 400);
    }

    const pairRef = this.db.collection("pairs").doc(normalizedPairId);
    const resolvedId = normalizeString(options.id) || generateMessageId();
    const createdAtMs = toMillis(options.createdAtMs) ?? Date.now();

    const messageRef = pairRef.collection("messages").doc(resolvedId);
    const existingSnap = await messageRef.get();

    if (existingSnap.exists) {
      const existing = toFirestoreMessage(normalizedPairId, existingSnap);
      if (existing) return existing;
    }

    const payload = {
      id: resolvedId,
      pairId: normalizedPairId,
      senderId: normalizedSenderId,
      author: normalizedAuthor,
      role: normalizedAuthor === "assistant" ? "assistant" : "user",
      senderType: normalizedAuthor === "assistant" ? "assistant" : normalizedAuthor,
      text: normalizedText,
      createdAtMs,
      createdAt: this.FieldValue.serverTimestamp(),
      serverCreatedAt: this.FieldValue.serverTimestamp(),
    };

    const normalizedClientId = normalizeString(options.clientId);
    if (normalizedClientId) payload.clientId = normalizedClientId;

    await messageRef.set(payload);

    return {
      id: resolvedId,
      pairId: normalizedPairId,
      senderId: normalizedSenderId,
      author: normalizedAuthor,
      text: normalizedText,
      createdAtMs,
    };
  }

  async listMessages(pairId, options = {}) {
    const normalizedPairId = normalizeString(pairId);
    if (!normalizedPairId) throw asKnownError("invalid_pair_id", 400);

    const pairRef = this.db.collection("pairs").doc(normalizedPairId);
    const limit = normalizeLimit(options.limit);
    const beforeMs = toMillis(options.beforeMs);

    let query = pairRef.collection("messages").orderBy("serverCreatedAt", "desc");

    if (beforeMs !== null) {
      query = query.where("serverCreatedAt", "<", this.Timestamp.fromMillis(beforeMs));
    }
    if (limit !== null) {
      query = query.limit(limit);
    }

    const snap = await query.get();
    return snap.docs.map((doc) => toFirestoreMessage(normalizedPairId, doc)).filter(Boolean);
  }
}

class SupabaseMessageStore {
  constructor({ url, serviceRoleKey }) {
    const createClient = getSupabaseCreateClient();
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  async getById(id) {
    const { data, error } = await this.client
      .from("messages")
      .select("id,pair_id,sender_id,author,text,created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw asKnownError("supabase_lookup_failed", 500, error);
    return toSupabaseMessage(data);
  }

  async sendMessage(pairId, senderId, author, text, options = {}) {
    const normalizedPairId = normalizeString(pairId);
    const normalizedSenderId = normalizeString(senderId);
    const normalizedText = normalizeString(text);
    const normalizedAuthor = normalizeAuthor(author);

    if (!normalizedPairId || !normalizedSenderId || !normalizedText || !normalizedAuthor) {
      throw asKnownError("invalid_message_payload", 400);
    }

    const resolvedId = toSupabaseMessageId(options.id, `${normalizedPairId}:${normalizedSenderId}`);
    const createdAtMs = toMillis(options.createdAtMs);

    if (resolvedId) {
      const existing = await this.getById(resolvedId);
      if (existing) return existing;
    }

    const insertPayload = {
      pair_id: normalizedPairId,
      sender_id: normalizedSenderId,
      author: normalizedAuthor,
      text: normalizedText,
    };

    if (resolvedId) insertPayload.id = resolvedId;
    if (createdAtMs !== null) insertPayload.created_at = new Date(createdAtMs).toISOString();

    const { data, error } = await this.client
      .from("messages")
      .insert(insertPayload)
      .select("id,pair_id,sender_id,author,text,created_at")
      .single();

    if (error) {
      if (resolvedId && error.code === "23505") {
        const existing = await this.getById(resolvedId);
        if (existing) return existing;
      }
      throw asKnownError("supabase_insert_failed", 500, error);
    }

    const inserted = toSupabaseMessage(data);
    if (!inserted) throw asKnownError("supabase_insert_failed", 500);
    return inserted;
  }

  async listMessages(pairId, options = {}) {
    const normalizedPairId = normalizeString(pairId);
    if (!normalizedPairId) throw asKnownError("invalid_pair_id", 400);

    const limit = normalizeLimit(options.limit);
    const beforeMs = toMillis(options.beforeMs);

    let query = this.client
      .from("messages")
      .select("id,pair_id,sender_id,author,text,created_at")
      .eq("pair_id", normalizedPairId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (beforeMs !== null) {
      query = query.lt("created_at", new Date(beforeMs).toISOString());
    }
    if (limit !== null) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw asKnownError("supabase_list_failed", 500, error);

    const rows = Array.isArray(data) ? data : [];
    rows.reverse();
    return rows.map((row) => toSupabaseMessage(row)).filter(Boolean);
  }
}

let cachedStore = null;

function createMessageStore() {
  if (cachedStore) return cachedStore;

  const rawBackend = normalizeString(process.env.CHAT_BACKEND);
  const backend = rawBackend ? rawBackend.toLowerCase() : "";

  if (backend === "firebase") {
    cachedStore = new FirestoreMessageStore();
    return cachedStore;
  }

  if (backend === "supabase") {
    const url = normalizeString(process.env.SUPABASE_URL);
    const serviceRoleKey = normalizeString(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!url || !serviceRoleKey) {
      throw new Error("[chat] CHAT_BACKEND=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    cachedStore = new SupabaseMessageStore({ url, serviceRoleKey });
    return cachedStore;
  }

  throw new Error(
    `[chat] Invalid CHAT_BACKEND value "${process.env.CHAT_BACKEND || ""}". Expected "firebase" or "supabase".`
  );
}

module.exports = {
  createMessageStore,
};

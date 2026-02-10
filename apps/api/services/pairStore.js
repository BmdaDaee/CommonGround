const crypto = require("crypto");

function getFirebasePairDeps() {
  const { getFirestoreDb } = require("../config/firestore");
  const { FieldValue } = require("firebase-admin/firestore");
  const db = getFirestoreDb();
  return { db, FieldValue };
}

function getSupabaseCreateClient() {
  return require("@supabase/supabase-js").createClient;
}

const CREATE_PAIR_MAX_ATTEMPTS = 10;

function randomId(prefix = "pair") {
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${prefix}_${raw}`;
}

function generateJoinCode() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePairRole(value) {
  const role = normalizeString(value);
  if (role === "a" || role === "b") return role;
  return null;
}

function asKnownError(message, status, cause = null) {
  const err = new Error(message);
  err.status = status;
  if (cause) err.cause = cause;
  return err;
}

function isConflictError(err) {
  return err?.code === "23505";
}

function getPairMemberIds(pairData) {
  const unique = new Set();

  if (!pairData || typeof pairData !== "object") return [];

  const members = pairData.members;
  if (Array.isArray(members)) {
    for (const member of members) {
      const id = normalizeString(member);
      if (id) unique.add(id);
    }
  } else if (members && typeof members === "object") {
    for (const member of Object.keys(members)) {
      const id = normalizeString(member);
      if (id) unique.add(id);
    }
  }

  const memberA = normalizeString(pairData.memberA ?? pairData.member_a);
  const memberB = normalizeString(pairData.memberB ?? pairData.member_b);
  if (memberA) unique.add(memberA);
  if (memberB) unique.add(memberB);

  return Array.from(unique);
}

function normalizePairStatus(value, memberCount = 0) {
  if (value === "pending" || value === "active") return value;
  return memberCount >= 2 ? "active" : "pending";
}

function normalizeUserRecord(user, fallbackUid = null) {
  if (!user || typeof user !== "object") return null;

  const uid = normalizeString(user.uid) || normalizeString(fallbackUid);
  if (!uid) return null;

  const activePairId =
    normalizeString(user.activePairId) ||
    normalizeString(user.active_pair_id) ||
    normalizeString(user.pairId) ||
    normalizeString(user.pair?.id) ||
    null;

  return {
    ...user,
    uid,
    activePairId,
    pairRole: normalizePairRole(user.pairRole ?? user.pair_role),
  };
}

function normalizePairRecord(pair) {
  if (!pair || typeof pair !== "object") return null;

  const id = normalizeString(pair.id);
  if (!id) return null;

  const memberA = normalizeString(pair.memberA ?? pair.member_a);
  const memberB = normalizeString(pair.memberB ?? pair.member_b);
  const members = getPairMemberIds(pair);
  const membersCount = members.length;
  const code = normalizeString(pair.code)?.toUpperCase() || null;

  return {
    ...pair,
    id,
    code,
    memberA,
    memberB,
    members,
    membersCount,
    status: normalizePairStatus(pair.status, membersCount),
  };
}

function toPairResponse(pair) {
  if (!pair) return null;

  return {
    ...pair,
    id: pair.id,
    code: pair.code || null,
    status: pair.status || "pending",
    membersCount: typeof pair.membersCount === "number" ? pair.membersCount : getPairMemberIds(pair).length,
  };
}

function resolvePairBackend() {
  const rawPairBackend = normalizeString(process.env.PAIR_BACKEND);
  return rawPairBackend ? rawPairBackend.toLowerCase() : "";
}

class FirestorePairStore {
  constructor() {
    const { db, FieldValue } = getFirebasePairDeps();
    this.db = db;
    this.FieldValue = FieldValue;
  }

  async ensureUser(uid, authTokenLike = null, overrides = {}) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const ref = this.db.collection("users").doc(normalizedUid);
    const snap = await ref.get();

    if (snap.exists) {
      const normalized = normalizeUserRecord(snap.data(), normalizedUid);
      const patch = {};

      if (snap.data()?.activePairId !== normalized?.activePairId) patch.activePairId = normalized?.activePairId || null;
      if (snap.data()?.pairRole !== normalized?.pairRole) patch.pairRole = normalized?.pairRole || null;

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = this.FieldValue.serverTimestamp();
        await ref.set(patch, { merge: true });
        const updated = await ref.get();
        return normalizeUserRecord(updated.data(), normalizedUid);
      }

      return normalized;
    }

    const now = this.FieldValue.serverTimestamp();
    const data = {
      uid: normalizedUid,
      email: authTokenLike?.email || null,
      displayName: authTokenLike?.name || null,
      photoURL: authTokenLike?.picture || null,
      activePairId: null,
      pairRole: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };

    await ref.set(data, { merge: true });
    const created = await ref.get();
    return normalizeUserRecord(created.data(), normalizedUid);
  }

  async getUser(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) return null;

    const snap = await this.db.collection("users").doc(normalizedUid).get();
    if (!snap.exists) return null;
    return normalizeUserRecord(snap.data(), normalizedUid);
  }

  async setUserPair(uid, pairId, role) {
    const normalizedUid = normalizeString(uid);
    const normalizedPairId = normalizeString(pairId);
    const normalizedRole = normalizePairRole(role);
    if (!normalizedUid || !normalizedPairId || !normalizedRole) {
      throw asKnownError("invalid_user_pair_update", 400);
    }

    const now = this.FieldValue.serverTimestamp();
    const userRef = this.db.collection("users").doc(normalizedUid);
    const existing = await userRef.get();

    const patch = {
      activePairId: normalizedPairId,
      pairRole: normalizedRole,
      updatedAt: now,
    };

    if (!existing.exists) {
      patch.uid = normalizedUid;
      patch.createdAt = now;
    }

    await userRef.set(patch, { merge: true });
    const updated = await userRef.get();
    return normalizeUserRecord(updated.data(), normalizedUid);
  }

  async clearUserPair(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const userRef = this.db.collection("users").doc(normalizedUid);
    const existing = await userRef.get();
    if (!existing.exists) {
      throw asKnownError("user_not_found", 404);
    }

    await userRef.set(
      {
        activePairId: null,
        pairRole: null,
        updatedAt: this.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const updated = await userRef.get();
    return normalizeUserRecord(updated.data(), normalizedUid);
  }

  async createPair(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const userRef = this.db.collection("users").doc(normalizedUid);

    for (let attempt = 0; attempt < CREATE_PAIR_MAX_ATTEMPTS; attempt += 1) {
      const pairId = randomId("pair");
      const code = generateJoinCode();
      const pairRef = this.db.collection("pairs").doc(pairId);

      try {
        await this.db.runTransaction(async (tx) => {
          const codeQuery = this.db.collection("pairs").where("code", "==", code).limit(1);
          const [userSnap, codeSnap] = await Promise.all([tx.get(userRef), tx.get(codeQuery)]);

          const existingUser = userSnap.exists ? normalizeUserRecord(userSnap.data(), normalizedUid) : null;
          if (existingUser?.activePairId) {
            throw asKnownError("user_already_paired", 409);
          }

          if (!codeSnap.empty) {
            throw asKnownError("code_collision", 409);
          }

          const now = this.FieldValue.serverTimestamp();
          tx.set(pairRef, {
            code,
            members: [normalizedUid],
            status: "pending",
            createdAt: now,
            updatedAt: now,
            joinedAt: null,
          });

          const userPatch = {
            activePairId: pairId,
            pairRole: "a",
            updatedAt: now,
          };

          if (!userSnap.exists) {
            userPatch.uid = normalizedUid;
            userPatch.createdAt = now;
          }

          tx.set(userRef, userPatch, { merge: true });
        });

        return { ok: true, pairId, code };
      } catch (err) {
        if (err?.message === "code_collision") {
          continue;
        }
        throw err;
      }
    }

    throw asKnownError("create_pair_failed", 500);
  }

  async joinPair(uid, rawCode) {
    const normalizedUid = normalizeString(uid);
    const code = normalizeString(rawCode)?.toUpperCase();

    if (!normalizedUid) throw asKnownError("invalid_uid", 400);
    if (!code) throw asKnownError("missing_code", 400);

    const userRef = this.db.collection("users").doc(normalizedUid);
    let joinedPairId = null;

    await this.db.runTransaction(async (tx) => {
      const codeQuery = this.db.collection("pairs").where("code", "==", code).limit(1);
      const [userSnap, match] = await Promise.all([tx.get(userRef), tx.get(codeQuery)]);

      if (match.empty) {
        throw asKnownError("pair_not_found", 404);
      }

      const pairSnap = match.docs[0];
      const pairRef = pairSnap.ref;
      const pairId = pairSnap.id;
      joinedPairId = pairId;

      const pairData = pairSnap.data() || {};
      const members = getPairMemberIds(pairData);
      const alreadyMember = members.includes(normalizedUid);

      const userData = userSnap.exists ? normalizeUserRecord(userSnap.data(), normalizedUid) : null;
      if (userData?.activePairId && userData.activePairId !== pairId) {
        throw asKnownError("user_already_paired", 409);
      }

      if (!alreadyMember && members.length >= 2) {
        throw asKnownError("pair_full", 409);
      }

      const nextMembers = alreadyMember ? members : [...members, normalizedUid];
      const nextStatus = nextMembers.length >= 2 ? "active" : "pending";
      const now = this.FieldValue.serverTimestamp();
      const pairPatch = {
        members: nextMembers,
        status: nextStatus,
        updatedAt: now,
      };

      if (nextStatus === "active" && !pairData.joinedAt) {
        pairPatch.joinedAt = now;
      }

      tx.set(pairRef, pairPatch, { merge: true });

      const role = nextMembers[0] === normalizedUid ? "a" : "b";
      const userPatch = {
        activePairId: pairId,
        pairRole: role,
        updatedAt: now,
      };

      if (!userSnap.exists) {
        userPatch.uid = normalizedUid;
        userPatch.createdAt = now;
      }

      tx.set(userRef, userPatch, { merge: true });
    });

    return { ok: true, pairId: joinedPairId };
  }

  async leavePair(uid) {
    await this.clearUserPair(uid);
    return { ok: true };
  }

  async getPairById(pairId) {
    const normalizedPairId = normalizeString(pairId);
    if (!normalizedPairId) return null;

    const snap = await this.db.collection("pairs").doc(normalizedPairId).get();
    if (!snap.exists) return null;
    return normalizePairRecord({ id: snap.id, ...(snap.data() || {}) });
  }

  async getPairByCode(code) {
    const normalizedCode = normalizeString(code)?.toUpperCase();
    if (!normalizedCode) return null;

    const snap = await this.db.collection("pairs").where("code", "==", normalizedCode).limit(1).get();
    if (snap.empty) return null;

    const row = snap.docs[0];
    return normalizePairRecord({ id: row.id, ...(row.data() || {}) });
  }

  async getPairForUser(uid) {
    const user = await this.getUser(uid);
    if (!user?.activePairId) return { pair: null };

    const pair = await this.getPairById(user.activePairId);
    if (!pair) return { pair: null };

    return { pair: toPairResponse(pair) };
  }
}

class SupabasePairStore {
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

  async ensureUser(uid, authTokenLike = null) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const existing = await this.getUser(normalizedUid);
    if (existing) return existing;

    const now = new Date().toISOString();
    const payload = {
      uid: normalizedUid,
      active_pair_id: null,
      pair_role: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.client
      .from("users")
      .insert(payload)
      .select("uid,active_pair_id,pair_role,created_at,updated_at")
      .maybeSingle();

    if (error) {
      if (isConflictError(error)) {
        return this.getUser(normalizedUid);
      }
      throw asKnownError("pair_store_failed", 500, error);
    }

    return normalizeUserRecord(data, normalizedUid);
  }

  async getUser(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) return null;

    const { data, error } = await this.client
      .from("users")
      .select("uid,active_pair_id,pair_role,created_at,updated_at")
      .eq("uid", normalizedUid)
      .maybeSingle();

    if (error) throw asKnownError("pair_store_failed", 500, error);
    return normalizeUserRecord(data, normalizedUid);
  }

  async setUserPair(uid, pairId, role) {
    const normalizedUid = normalizeString(uid);
    const normalizedPairId = normalizeString(pairId);
    const normalizedRole = normalizePairRole(role);

    if (!normalizedUid || !normalizedPairId || !normalizedRole) {
      throw asKnownError("invalid_user_pair_update", 400);
    }

    const now = new Date().toISOString();
    const patch = {
      active_pair_id: normalizedPairId,
      pair_role: normalizedRole,
      updated_at: now,
    };

    const { data, error } = await this.client
      .from("users")
      .update(patch)
      .eq("uid", normalizedUid)
      .select("uid,active_pair_id,pair_role,created_at,updated_at")
      .maybeSingle();

    if (error) throw asKnownError("pair_store_failed", 500, error);
    if (data) return normalizeUserRecord(data, normalizedUid);

    const { data: inserted, error: insertError } = await this.client
      .from("users")
      .upsert(
        {
          uid: normalizedUid,
          active_pair_id: normalizedPairId,
          pair_role: normalizedRole,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "uid" }
      )
      .select("uid,active_pair_id,pair_role,created_at,updated_at")
      .maybeSingle();

    if (insertError) throw asKnownError("pair_store_failed", 500, insertError);
    return normalizeUserRecord(inserted, normalizedUid);
  }

  async clearUserPair(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const existing = await this.getUser(normalizedUid);
    if (!existing) {
      throw asKnownError("user_not_found", 404);
    }

    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("users")
      .update({
        active_pair_id: null,
        pair_role: null,
        updated_at: now,
      })
      .eq("uid", normalizedUid)
      .select("uid,active_pair_id,pair_role,created_at,updated_at")
      .maybeSingle();

    if (error) throw asKnownError("pair_store_failed", 500, error);
    return normalizeUserRecord(data, normalizedUid);
  }

  async createPair(uid) {
    const normalizedUid = normalizeString(uid);
    if (!normalizedUid) throw asKnownError("invalid_uid", 400);

    const ensuredUser = await this.ensureUser(normalizedUid);
    if (ensuredUser?.activePairId) {
      throw asKnownError("user_already_paired", 409);
    }

    for (let attempt = 0; attempt < CREATE_PAIR_MAX_ATTEMPTS; attempt += 1) {
      const pairId = randomId("pair");
      const code = generateJoinCode();
      const now = new Date().toISOString();

      const { error: insertError } = await this.client.from("pairs").insert({
        id: pairId,
        code,
        status: "pending",
        member_a: normalizedUid,
        member_b: null,
        joined_at: null,
        created_at: now,
        updated_at: now,
      });

      if (insertError) {
        if (isConflictError(insertError)) continue;
        throw asKnownError("create_pair_failed", 500, insertError);
      }

      const { data: updatedUser, error: updateUserError } = await this.client
        .from("users")
        .update({
          active_pair_id: pairId,
          pair_role: "a",
          updated_at: now,
        })
        .eq("uid", normalizedUid)
        .is("active_pair_id", null)
        .select("uid,active_pair_id,pair_role,created_at,updated_at")
        .maybeSingle();

      if (updateUserError) {
        await this.client.from("pairs").delete().eq("id", pairId);
        throw asKnownError("create_pair_failed", 500, updateUserError);
      }

      if (!updatedUser) {
        await this.client.from("pairs").delete().eq("id", pairId);
        const latestUser = await this.getUser(normalizedUid);
        if (latestUser?.activePairId) {
          throw asKnownError("user_already_paired", 409);
        }
        continue;
      }

      return { ok: true, pairId, code };
    }

    throw asKnownError("create_pair_failed", 500);
  }

  async joinPair(uid, rawCode) {
    const normalizedUid = normalizeString(uid);
    const code = normalizeString(rawCode)?.toUpperCase();

    if (!normalizedUid) throw asKnownError("invalid_uid", 400);
    if (!code) throw asKnownError("missing_code", 400);

    await this.ensureUser(normalizedUid);

    const user = await this.getUser(normalizedUid);
    const pair = await this.getPairByCode(code);

    if (!pair) throw asKnownError("pair_not_found", 404);

    if (user?.activePairId && user.activePairId !== pair.id) {
      throw asKnownError("user_already_paired", 409);
    }

    if (pair.memberA === normalizedUid || pair.memberB === normalizedUid) {
      const role = pair.memberA === normalizedUid ? "a" : "b";
      await this.setUserPair(normalizedUid, pair.id, role);
      return { ok: true, pairId: pair.id };
    }

    if (pair.memberB) {
      throw asKnownError("pair_full", 409);
    }

    const now = new Date().toISOString();
    const pairPatch = {
      member_b: normalizedUid,
      status: "active",
      updated_at: now,
    };

    if (!pair.joinedAt && !pair.joined_at) {
      pairPatch.joined_at = now;
    }

    const { data: updatedPair, error: updatePairError } = await this.client
      .from("pairs")
      .update(pairPatch)
      .eq("id", pair.id)
      .is("member_b", null)
      .select("id,code,status,member_a,member_b,joined_at,created_at,updated_at")
      .maybeSingle();

    if (updatePairError) {
      throw asKnownError("join_pair_failed", 500, updatePairError);
    }

    if (!updatedPair) {
      const latestPair = await this.getPairById(pair.id);
      if (!latestPair) throw asKnownError("pair_not_found", 404);
      if (latestPair.memberB && latestPair.memberB !== normalizedUid) {
        throw asKnownError("pair_full", 409);
      }
    }

    await this.setUserPair(normalizedUid, pair.id, "b");

    return { ok: true, pairId: pair.id };
  }

  async leavePair(uid) {
    await this.clearUserPair(uid);
    return { ok: true };
  }

  async getPairById(pairId) {
    const normalizedPairId = normalizeString(pairId);
    if (!normalizedPairId) return null;

    const { data, error } = await this.client
      .from("pairs")
      .select("id,code,status,member_a,member_b,joined_at,created_at,updated_at")
      .eq("id", normalizedPairId)
      .maybeSingle();

    if (error) throw asKnownError("pair_store_failed", 500, error);
    return normalizePairRecord(data);
  }

  async getPairByCode(code) {
    const normalizedCode = normalizeString(code)?.toUpperCase();
    if (!normalizedCode) return null;

    const { data, error } = await this.client
      .from("pairs")
      .select("id,code,status,member_a,member_b,joined_at,created_at,updated_at")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error) throw asKnownError("pair_store_failed", 500, error);
    return normalizePairRecord(data);
  }

  async getPairForUser(uid) {
    const user = await this.getUser(uid);
    if (!user?.activePairId) return { pair: null };

    const pair = await this.getPairById(user.activePairId);
    if (!pair) return { pair: null };

    return { pair: toPairResponse(pair) };
  }
}

let cachedPairStore = null;

function createPairStore() {
  if (cachedPairStore) return cachedPairStore;

  const backend = resolvePairBackend();

  if (backend === "firebase") {
    cachedPairStore = new FirestorePairStore();
    return cachedPairStore;
  }

  if (backend === "supabase") {
    const url = normalizeString(process.env.SUPABASE_URL);
    const serviceRoleKey = normalizeString(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !serviceRoleKey) {
      throw new Error("[pair] PAIR_BACKEND=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    cachedPairStore = new SupabasePairStore({ url, serviceRoleKey });
    return cachedPairStore;
  }

  throw new Error(`[pair] Invalid PAIR_BACKEND value "${process.env.PAIR_BACKEND || backend}". Expected "firebase" or "supabase".`);
}

module.exports = {
  createPairStore,
  getPairMemberIds,
};

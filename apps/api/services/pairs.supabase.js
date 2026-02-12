// services/pairs.supabase.js
// Supabase version of pairs service

const crypto = require("crypto");
const { supabase } = require("../lib/supabaseAdmin");

function randomId(prefix = "pair") {
  const raw = crypto.randomBytes(12).toString("base64url");
  return `${prefix}_${raw}`;
}

/**
 * Generate a 6-character join code using Supabase function
 */
async function generateJoinCode() {
  const { data, error } = await supabase.rpc("generate_pair_code");
  
  if (error || !data) {
    // Fallback to local generation
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(6);
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  }
  
  return data;
}

/**
 * Ensure user profile exists in Supabase profiles table
 * Supabase auth trigger should auto-create this, but we can verify/update
 */
async function ensureUserProfile(userId, overrides = {}) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existing) {
    // Update if overrides provided
    if (Object.keys(overrides).length > 0) {
      const { data: updated } = await supabase
        .from("profiles")
        .update(overrides)
        .eq("id", userId)
        .select()
        .single();
      return updated || existing;
    }
    return existing;
  }

  // Profile doesn't exist - create it
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      ...overrides,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create profile:", error);
    throw new Error("failed_to_create_profile");
  }

  return created;
}

/**
 * Creates a new pair with the caller as the first member
 * Returns { pairId, code }
 */
async function createPair(userId) {
  const pairId = randomId("pair");
  const code = await generateJoinCode();

  // Check if user already has an active pair
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_pair_id")
    .eq("id", userId)
    .single();

  if (profile?.active_pair_id) {
    const err = new Error("user_already_paired");
    err.status = 409;
    throw err;
  }

  // Create pair
  const { error: pairError } = await supabase
    .from("pairs")
    .insert({
      id: pairId,
      code,
      status: "PENDING",
    });

  if (pairError) {
    console.error("Failed to create pair:", pairError);
    throw new Error("failed_to_create_pair");
  }

  // Add user as first member
  const { error: memberError } = await supabase
    .from("pair_members")
    .insert({
      pair_id: pairId,
      user_id: userId,
      role: "CREATOR",
    });

  if (memberError) {
    console.error("Failed to add pair member:", memberError);
    throw new Error("failed_to_add_member");
  }

  // Update user's active pair
  await supabase
    .from("profiles")
    .update({ active_pair_id: pairId })
    .eq("id", userId);

  return { pairId, code };
}

/**
 * Joins an existing pair by join code
 * Returns { pairId }
 */
async function joinPair(userId, code) {
  // Check if user already has an active pair
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_pair_id")
    .eq("id", userId)
    .single();

  if (profile?.active_pair_id) {
    const err = new Error("user_already_paired");
    err.status = 409;
    throw err;
  }

  // Find pair by code
  const { data: pair, error: pairError } = await supabase
    .from("pairs")
    .select("id, status")
    .eq("code", code)
    .single();

  if (pairError || !pair) {
    const err = new Error("pair_not_found");
    err.status = 404;
    throw err;
  }

  if (pair.status === "INACTIVE") {
    const err = new Error("pair_archived");
    err.status = 409;
    throw err;
  }

  // Check if pair is full (already has 2 active members)
  const { data: activeMembers } = await supabase
    .from("pair_members")
    .select("user_id")
    .eq("pair_id", pair.id)
    .is("left_at", null);

  if (activeMembers && activeMembers.length >= 2) {
    const err = new Error("pair_full");
    err.status = 409;
    throw err;
  }

  // Check if user was previously a member (re-join case)
  const { data: existingMembership } = await supabase
    .from("pair_members")
    .select("*")
    .eq("pair_id", pair.id)
    .eq("user_id", userId)
    .single();

  if (existingMembership) {
    // Re-join - clear left_at
    await supabase
      .from("pair_members")
      .update({ left_at: null })
      .eq("pair_id", pair.id)
      .eq("user_id", userId);
  } else {
    // New join - add member
    const { error: memberError } = await supabase
      .from("pair_members")
      .insert({
        pair_id: pair.id,
        user_id: userId,
        role: "JOINER",
      });

    if (memberError) {
      console.error("Failed to add pair member:", memberError);
      throw new Error("failed_to_join_pair");
    }
  }

  // Update pair status to ACTIVE if now has 2 members
  const newMemberCount = (activeMembers?.length || 0) + 1;
  if (newMemberCount >= 2) {
    await supabase
      .from("pairs")
      .update({ status: "ACTIVE" })
      .eq("id", pair.id);
  }

  // Update user's active pair
  await supabase
    .from("profiles")
    .update({ active_pair_id: pair.id })
    .eq("id", userId);

  return { pairId: pair.id };
}

/**
 * Leaves the current active pair
 */
async function leaveActivePair(userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_pair_id")
    .eq("id", userId)
    .single();

  const activePairId = profile?.active_pair_id;
  if (!activePairId) {
    return { left: false, pairId: null };
  }

  // Mark member as left
  const now = new Date().toISOString();
  await supabase
    .from("pair_members")
    .update({ left_at: now })
    .eq("pair_id", activePairId)
    .eq("user_id", userId);

  // Clear user's active pair
  await supabase
    .from("profiles")
    .update({ active_pair_id: null })
    .eq("id", userId);

  // Check remaining active members
  const { data: activeMembers } = await supabase
    .from("pair_members")
    .select("user_id")
    .eq("pair_id", activePairId)
    .is("left_at", null);

  // Update pair status
  const activeCount = activeMembers?.length || 0;
  const nextStatus = activeCount >= 2 ? "ACTIVE" : activeCount === 1 ? "PENDING" : "INACTIVE";
  
  await supabase
    .from("pairs")
    .update({ status: nextStatus })
    .eq("id", activePairId);

  return { left: true, pairId: activePairId, status: nextStatus };
}

/**
 * Get user's current active pair
 */
async function getMyPair(userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_pair_id")
    .eq("id", userId)
    .single();

  const activePairId = profile?.active_pair_id;
  if (!activePairId) {
    return { pair: null };
  }

  const { data: pair } = await supabase
    .from("pairs")
    .select("*")
    .eq("id", activePairId)
    .single();

  if (!pair) {
    return { pair: null };
  }

  // Get pair members
  const { data: members } = await supabase
    .from("pair_members")
    .select("user_id, role, joined_at, left_at")
    .eq("pair_id", activePairId);

  return {
    pair: {
      ...pair,
      members,
    },
  };
}

module.exports = {
  ensureUserProfile,
  createPair,
  joinPair,
  getMyPair,
  leaveActivePair,
};

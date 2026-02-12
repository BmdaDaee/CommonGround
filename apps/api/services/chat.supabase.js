// services/chat.supabase.js
// Supabase version of chat service

const { supabase } = require("../lib/supabaseAdmin");

/**
 * Assert that a user is an active member of a pair
 */
async function assertPairMember(pairId, userId) {
  const { data: membership, error } = await supabase
    .from("pair_members")
    .select("pair_id, user_id, left_at")
    .eq("pair_id", pairId)
    .eq("user_id", userId)
    .is("left_at", null)
    .single();

  if (error || !membership) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  return membership;
}

/**
 * Idempotent message send
 * - client provides messageId (uuid)
 * - if message already exists with this ID, return it instead of creating duplicate
 */
async function sendMessage({ pairId, messageId, clientId, senderId, text }) {
  if (!text || typeof text !== "string") {
    const err = new Error("invalid_text");
    err.status = 400;
    throw err;
  }
  if (text.length > 4000) {
    const err = new Error("text_too_long");
    err.status = 400;
    throw err;
  }

  // Verify membership
  await assertPairMember(pairId, senderId);

  // Check if message already exists (idempotency)
  const { data: existing } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (existing) {
    return existing;
  }

  // Insert new message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      id: messageId,
      pair_id: pairId,
      sender_id: senderId,
      client_id: clientId || null,
      text,
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message || "failed_to_send_message");
    err.status = 500;
    throw err;
  }

  return message;
}

/**
 * List recent messages (newest first)
 * Uses cursor-based pagination via server_created_at
 */
async function listMessages({ pairId, uid, limit = 30, before = null }) {
  // Verify membership
  await assertPairMember(pairId, uid);

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  let query = supabase
    .from("messages")
    .select("*")
    .eq("pair_id", pairId)
    .order("server_created_at", { ascending: false })
    .limit(safeLimit);

  // Cursor-based pagination
  if (before) {
    query = query.lt("server_created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    const err = new Error(error.message || "failed_to_list_messages");
    err.status = 500;
    throw err;
  }

  // Next cursor: last message's server_created_at
  const nextBefore = messages.length > 0 
    ? messages[messages.length - 1].server_created_at 
    : null;

  return { messages, nextBefore };
}

module.exports = {
  sendMessage,
  listMessages,
  assertPairMember,
};

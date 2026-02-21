import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const supabase = createClient(url, anon);

export function isAdminEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return ADMIN_EMAILS.length === 0 ? false : ADMIN_EMAILS.includes(e);
}

export async function signInWithPassword(email, password) {
  const e = String(email || "").trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
  if (error) throw error;

  const authedEmail = data?.user?.email || e;
  if (!isAdminEmail(authedEmail)) {
    await supabase.auth.signOut();
    throw new Error("not_authorized_admin");
  }

  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

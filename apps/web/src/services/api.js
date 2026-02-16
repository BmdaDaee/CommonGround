import { createClient } from "@supabase/supabase-js"

const apiBaseUrl =
  import.meta?.env?.VITE_CG_API_BASE_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  "http://localhost:3001"

const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL
const supabaseAnon = import.meta?.env?.VITE_SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null

async function getAccessToken() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data?.session?.access_token || null
}

async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {})
  headers.set("Content-Type", "application/json")

  const token = await getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  const contentType = res.headers.get("content-type") || ""
  const bodyText = await res.text().catch(() => "")

  if (!res.ok) {
    throw new Error(`[web api] ${res.status} ${res.statusText} ${bodyText}`)
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(bodyText)
    } catch {
      return {}
    }
  }

  return bodyText
}

export async function chatList(pairId, limit = 50) {
  if (!pairId) return { messages: [], nextBefore: null }
  return apiFetch(`/v1/chat/${pairId}/list?limit=${limit}`, { method: "GET" })
}

export async function chatSend(pairId, messageId, text) {
  if (!pairId) throw new Error("missing_pair_id")
  return apiFetch(`/v1/chat/${pairId}/send`, {
    method: "POST",
    body: JSON.stringify({ messageId, text }),
  })
}

export async function pairsMe() {
  return apiFetch(`/v1/pairs/me`, { method: "GET" })
}

export async function pairsCreate() {
  return apiFetch(`/v1/pairs`, { method: "POST", body: JSON.stringify({}) })
}

export async function pairsJoin(code) {
  return apiFetch(`/v1/pairs/join`, {
    method: "POST",
    body: JSON.stringify({ code }),
  })
}

export async function pairsLeave() {
  return apiFetch(`/v1/pairs/leave`, { method: "POST", body: JSON.stringify({}) })
}

export { supabase }

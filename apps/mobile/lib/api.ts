import { supabase } from "@/lib/supabase";
import { apiBaseURL } from "@/lib/runtime";

export function normalizeApiErrorMessage(message: string): string {
  const raw = String(message || "").trim();
  if (!raw) return "request_failed";

  if (raw.includes("missing_bearer_token")) return "missing_bearer_token";
  if (raw.includes("invalid_token")) return "invalid_token";
  if (raw.includes("pairId is required") || raw.includes("missing_pair_id")) return "pairId is required";

  return raw;
}

function extractErrorMessage(text: string): string {
  const raw = String(text || "").trim();
  if (!raw) return "";
  try {
    const data = JSON.parse(raw);
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {
    // Non-JSON body falls back to raw text.
  }
  return raw;
}

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[api] getSession error:", error.message);
    return null;
  }
  return data.session?.access_token ?? null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();

  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${apiBaseURL}${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const serverError = extractErrorMessage(text);
    throw new Error(normalizeApiErrorMessage(serverError || `HTTP ${res.status}`));
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

export async function apiGet<T = any>(path: string): Promise<T> {
  return apiFetch(path, { method: "GET" });
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  return apiFetch(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiPut<T = any>(path: string, body?: unknown): Promise<T> {
  return apiFetch(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return apiFetch(path, { method: "DELETE" });
}

// Compatibility adapter for existing axios-style calls in older screens.
export const api = {
  async get(path: string) {
    return { data: await apiGet(path) };
  },
  async post(path: string, body?: unknown) {
    return { data: await apiPost(path, body) };
  },
  async put(path: string, body?: unknown) {
    return { data: await apiPut(path, body) };
  },
  async delete(path: string) {
    return { data: await apiDelete(path) };
  },
};


export async function apiGetSafe<T = any>(path: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiGet<T>(path);
    return { data, error: null };
  } catch (e: any) {
    const msg = normalizeApiErrorMessage(e?.message ? String(e.message) : String(e));
    return { data: null, error: msg };
  }
}

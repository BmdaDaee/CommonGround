import { supabase } from "@/lib/supabase";
import { apiBaseURL } from "@/lib/runtime";

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
    throw new Error(`[api] ${res.status} ${res.statusText} ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

export async function apiGet(path: string) {
  return apiFetch(path, { method: "GET" });
}

export async function apiPost(path: string, body?: unknown) {
  return apiFetch(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiPut(path: string, body?: unknown) {
  return apiFetch(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiDelete(path: string) {
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
    const msg = e?.message ? String(e.message) : String(e);
    return { data: null, error: msg };
  }
}

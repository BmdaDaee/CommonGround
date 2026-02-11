export const REWRITE_MODES = ["calmer", "clearer", "softer", "shorter"] as const;

export type RewriteMode = (typeof REWRITE_MODES)[number];

type RewriteRequest = {
  draft: string;
  mode: RewriteMode;
};

type AnyRecord = Record<string, unknown>;

function getNestedRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractRewrittenText(payload: unknown): string {
  const record = getNestedRecord(payload);
  if (!record) return "";

  const directCandidates = [record.rewrittenText, record.rewrite, record.text];
  for (const candidate of directCandidates) {
    const text = pickString(candidate);
    if (text) return text;
  }

  const result = getNestedRecord(record.result);
  if (result) {
    const nestedCandidates = [result.rewrittenText, result.rewrite, result.text];
    for (const candidate of nestedCandidates) {
      const text = pickString(candidate);
      if (text) return text;
    }
  }

  const data = getNestedRecord(record.data);
  if (data) {
    const nestedCandidates = [data.rewrittenText, data.rewrite, data.text];
    for (const candidate of nestedCandidates) {
      const text = pickString(candidate);
      if (text) return text;
    }
  }

  return "";
}

function resolveKeystoneEndpoint(): string {
  const path = "/api/keystone/rewrite";
  const envBase = pickString(import.meta.env?.VITE_API_BASE);

  if (envBase) {
    return `${envBase.replace(/\/+$/, "")}${path}`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `http://localhost:3001${path}`;
    }
  }

  return path;
}

export async function rewriteWithKeystone({ draft, mode }: RewriteRequest): Promise<string> {
  let response: Response;

  try {
    response = await fetch(resolveKeystoneEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draft, mode }),
    });
  } catch {
    throw new Error("Keystone is unavailable right now. Please try again.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const record = getNestedRecord(payload);
    const detail =
      pickString(record?.error) ||
      pickString(record?.message) ||
      pickString(record?.detail) ||
      `Keystone rewrite failed (HTTP ${response.status}).`;
    throw new Error(detail);
  }

  const rewritten = extractRewrittenText(payload);
  if (!rewritten) {
    throw new Error("Keystone returned an empty or invalid rewrite result.");
  }

  return rewritten;
}

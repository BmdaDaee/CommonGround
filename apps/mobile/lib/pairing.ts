export type PairStatus = "pending" | "active";

export type SessionShape = {
  uid?: string;
  pairId?: string | null;
  user?: {
    activePairId?: string | null;
    pairId?: string | null;
    pair?: { id?: string | null } | null;
    pairRole?: "a" | "b" | null;
  } & Record<string, any>;
  pair?: { id: string; status?: PairStatus; membersCount?: number } | null;
};

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getPairIdFromSession(session: any): string | null {
  const s = session as SessionShape;
  return (
    normalizeNonEmptyString(s?.user?.activePairId) ||
    normalizeNonEmptyString(s?.user?.pairId) ||
    normalizeNonEmptyString(s?.pairId) ||
    normalizeNonEmptyString(s?.user?.pair?.id) ||
    normalizeNonEmptyString(s?.pair?.id) ||
    null
  );
}

export function getPairStatusFromSession(session: any): PairStatus | null {
  const s = session as SessionShape;
  const st = s?.pair?.status;
  return st === "pending" || st === "active" ? st : null;
}

export function getPairIdFromSessionUser(session: any): string | null {
  return getPairIdFromSession(session);
}

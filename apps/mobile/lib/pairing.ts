type PairObject = {
  id?: unknown;
} | null;

type UserLike = {
  activePairId?: unknown;
  pairId?: unknown;
  pair?: PairObject;
} | null | undefined;

type SessionLike = {
  user?: UserLike;
  pairId?: unknown;
} | null | undefined;

function normalizePairId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getActivePairId(user: UserLike): string | null {
  const pairId = user?.activePairId ?? user?.pairId ?? null;
  return normalizePairId(pairId);
}

export function getSessionPairId(session: SessionLike): string | null {
  const activePairId = getActivePairId(session?.user);
  if (activePairId) return activePairId;

  const topLevelPairId = normalizePairId(session?.pairId);
  if (topLevelPairId) return topLevelPairId;

  const nestedPairId = normalizePairId(session?.user?.pair?.id);
  if (nestedPairId) return nestedPairId;

  return null;
}

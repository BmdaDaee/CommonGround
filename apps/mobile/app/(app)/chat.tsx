import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import { firebaseAuth } from "../../lib/firebase";
import { api, ensureSession } from "../../lib/api";
import { keystoneRewrite, type RewriteMode } from "../../lib/keystoneClient";
import {
  getPairIdFromSession,
  getPairIdFromSessionUser,
  getPairStatusFromSession,
  type PairStatus,
} from "../../lib/pairing";

type ChatMessage = {
  id: string;
  role: "user" | "partner" | "assistant";
  createdAtMs: number | null;
  text: string;
};

type FailedSendPayload = {
  pairId: string;
  messageId: string;
  text: string;
};

type PairOverview = {
  pairId: string | null;
  status: PairStatus | null;
  code: string | null;
  membersCount: number | null;
};

type PairApiResponse = {
  pair?: {
    id?: unknown;
    status?: unknown;
    code?: unknown;
    members?: unknown;
    membersCount?: unknown;
  } | null;
};

const REWRITE_MODES: { label: string; mode: RewriteMode }[] = [
  { label: "De-escalate", mode: "deescalate" },
  { label: "Soften", mode: "soften" },
  { label: "Emotion → Words", mode: "emotion_to_words" },
  { label: "Boundary Set", mode: "boundary_set" },
];

const REWRITE_ERROR_MESSAGE = "Couldn’t rewrite that right now. Please try again.";
const SEND_ERROR_MESSAGE = "Message failed to send.";
const HISTORY_PAGE_LIMIT = 30;
const HISTORY_POLL_DELAY_SUCCESS_MS = 2000;
const HISTORY_POLL_DELAY_FIRST_FAILURE_MS = 5000;
const HISTORY_POLL_DELAY_REPEATED_FAILURE_MS = 10000;

function makeId() {
  return Math.random().toString(36).slice(2);
}

function makeRewriteCacheKey(text: string, mode: RewriteMode) {
  return JSON.stringify([text, mode]);
}

function extractRewriteOutput(result: { output: string } | string) {
  if (typeof result === "string") return result;
  return result.output;
}

type RawHistoryMessage = {
  id?: unknown;
  author?: unknown;
  role?: unknown;
  senderType?: unknown;
  senderId?: unknown;
  createdAtMs?: unknown;
  createdAt?: unknown;
  serverCreatedAt?: unknown;
  sentAt?: unknown;
  timestamp?: unknown;
  time?: unknown;
  text?: unknown;
};

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEpochNumber(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const abs = Math.abs(value);

  if (abs >= 1e17) return Math.trunc(value / 1e6); // nanoseconds -> milliseconds
  if (abs >= 1e14) return Math.trunc(value / 1e3); // microseconds -> milliseconds
  if (abs < 1e11) return Math.trunc(value * 1e3); // seconds -> milliseconds
  return Math.trunc(value); // already milliseconds
}

function toMillis(value: unknown): number | null {
  if (typeof value === "number") {
    return normalizeEpochNumber(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return normalizeEpochNumber(numeric);
    }

    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : normalizeEpochNumber(parsed);
  }
  if (!value || typeof value !== "object") return null;

  const possibleToMillis = (value as { toMillis?: unknown }).toMillis;
  if (typeof possibleToMillis === "function") {
    try {
      const output = (possibleToMillis as () => number).call(value);
      return normalizeEpochNumber(output);
    } catch {
      // fall through
    }
  }

  const seconds = Number(
    (value as { seconds?: unknown; _seconds?: unknown }).seconds ??
      (value as { seconds?: unknown; _seconds?: unknown })._seconds
  );
  if (Number.isFinite(seconds)) {
    const nanos = Number(
      (value as { nanoseconds?: unknown; _nanoseconds?: unknown }).nanoseconds ??
        (value as { nanoseconds?: unknown; _nanoseconds?: unknown })._nanoseconds ??
        0
    );
    const millisFromNanos = Number.isFinite(nanos) ? Math.floor(nanos / 1e6) : 0;
    return normalizeEpochNumber(seconds * 1000 + millisFromNanos);
  }

  return null;
}

function normalizeEpochMs(value: unknown): number | null {
  const parsed = toMillis(value);
  if (parsed === null || !Number.isFinite(parsed)) return null;
  return parsed;
}

function formatMessageDateTime(createdAtMs: number | null) {
  if (createdAtMs === null || !Number.isFinite(createdAtMs)) return "Date unavailable";
  const date = new Date(createdAtMs);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getHistoryMessageRole(
  message: RawHistoryMessage,
  sessionUid: string | null
): "user" | "partner" | "assistant" {
  const author = normalizeNonEmptyString(message.author);
  if (author === "assistant" || author === "ai") return "assistant";
  if (author === "self" || author === "you") return "user";
  if (author === "partner") return "partner";

  const senderId = normalizeNonEmptyString(message.senderId);
  if (senderId && sessionUid) {
    return senderId === sessionUid ? "user" : "partner";
  }

  const senderType = normalizeNonEmptyString(message.senderType);
  if (senderType === "assistant" || senderType === "ai") return "assistant";
  if (senderType === "partner") return "partner";
  if (senderType === "self" || senderType === "user") return "user";

  if (message.role === "assistant") return "assistant";
  if (message.role === "user") return sessionUid ? "user" : "partner";

  return "assistant";
}

function normalizeHistoryMessages(rawHistory: unknown, sessionUid: string | null): ChatMessage[] {
  const rawMessages = Array.isArray(rawHistory)
    ? rawHistory
    : rawHistory && typeof rawHistory === "object" && Array.isArray((rawHistory as { messages?: unknown }).messages)
      ? (rawHistory as { messages: unknown[] }).messages
      : [];

  const normalizedWithSourceIndex = rawMessages.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const message = raw as RawHistoryMessage;
    const text = normalizeNonEmptyString(message.text);
    if (!text) return [];

    const id = normalizeNonEmptyString(message.id) ?? `history-${index}-${makeId()}`;
    const createdAtMs =
      normalizeEpochMs(message.createdAtMs) ??
      normalizeEpochMs(message.serverCreatedAt) ??
      normalizeEpochMs(message.createdAt) ??
      normalizeEpochMs(message.sentAt) ??
      normalizeEpochMs(message.timestamp) ??
      normalizeEpochMs(message.time) ??
      null;

    return [{
      sourceIndex: index,
      message: {
        id,
        role: getHistoryMessageRole(message, sessionUid),
        createdAtMs,
        text,
      } satisfies ChatMessage,
    }];
  });

  normalizedWithSourceIndex.sort((a, b) => {
    const aTs = normalizeEpochMs(a.message.createdAtMs);
    const bTs = normalizeEpochMs(b.message.createdAtMs);
    if (aTs !== null && bTs !== null && aTs !== bTs) return aTs - bTs;
    if (aTs === null && bTs !== null) return 1;
    if (aTs !== null && bTs === null) return -1;
    // API history is newest-first; invert source order to render oldest-first for equal timestamps.
    return b.sourceIndex - a.sourceIndex;
  });

  return normalizedWithSourceIndex.map((entry) => entry.message);
}

function getLatestKnownTimestamp(messages: ChatMessage[]): number | null {
  let latest: number | null = null;

  for (const message of messages) {
    const timestamp = normalizeEpochMs(message.createdAtMs);
    if (timestamp === null) continue;
    if (latest === null || timestamp > latest) latest = timestamp;
  }

  return latest;
}

function getOldestKnownTimestamp(messages: ChatMessage[]): number | null {
  let oldest: number | null = null;

  for (const message of messages) {
    const timestamp = normalizeEpochMs(message.createdAtMs);
    if (timestamp === null) continue;
    if (oldest === null || timestamp < oldest) oldest = timestamp;
  }

  return oldest;
}

function getNextOptimisticTimestamp(messages: ChatMessage[]) {
  const latest = getLatestKnownTimestamp(messages);
  if (latest === null) return Date.now();
  return latest + 1;
}

function getPollDelayMs(failureCount: number) {
  if (failureCount <= 0) return HISTORY_POLL_DELAY_SUCCESS_MS;
  if (failureCount === 1) return HISTORY_POLL_DELAY_FIRST_FAILURE_MS;
  return HISTORY_POLL_DELAY_REPEATED_FAILURE_MS;
}

function mergeMessages(history: ChatMessage[], existing: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  const orderHint = new Map<string, number>();

  for (const [index, message] of existing.entries()) {
    byId.set(message.id, message);
    orderHint.set(message.id, index);
  }

  const historyBaseOrder = existing.length;

  for (const [index, message] of history.entries()) {
    if (!orderHint.has(message.id)) {
      orderHint.set(message.id, historyBaseOrder + index);
    }

    const previous = byId.get(message.id);
    if (!previous) {
      byId.set(message.id, message);
      continue;
    }

    byId.set(message.id, {
      ...previous,
      ...message,
      createdAtMs:
        normalizeEpochMs(message.createdAtMs) ?? normalizeEpochMs(previous.createdAtMs) ?? null,
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTs = normalizeEpochMs(a.createdAtMs);
    const bTs = normalizeEpochMs(b.createdAtMs);

    if (aTs !== null && bTs !== null && aTs !== bTs) return aTs - bTs;
    if (aTs === null && bTs !== null) return 1;
    if (aTs !== null && bTs === null) return -1;

    const aOrder = orderHint.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = orderHint.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.id.localeCompare(b.id);
  });
}

function normalizePairStatus(value: unknown): PairStatus | null {
  return value === "pending" || value === "active" ? value : null;
}

function getPairMembersCount(pair: PairApiResponse["pair"]) {
  if (!pair) return null;

  if (typeof pair.membersCount === "number" && Number.isFinite(pair.membersCount)) {
    return pair.membersCount;
  }
  if (Array.isArray(pair.members)) {
    return pair.members.length;
  }
  if (pair.members && typeof pair.members === "object") {
    return Object.keys(pair.members as Record<string, unknown>).length;
  }
  return null;
}

const EMPTY_PAIR_OVERVIEW: PairOverview = {
  pairId: null,
  status: null,
  code: null,
  membersCount: null,
};

export default function ChatScreen() {
  const requestSeqRef = useRef(0);
  const sessionUidRef = useRef<string | null>(null);
  const historyPollInFlightRef = useRef(false);
  const historyPollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyPollFailureCountRef = useRef(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pairId, setPairId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastFailedSend, setLastFailedSend] = useState<FailedSendPayload | null>(null);

  const [chatBootstrapLoading, setChatBootstrapLoading] = useState(true);
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRetryLoading, setHistoryRetryLoading] = useState(false);
  const [historyLoadingEarlier, setHistoryLoadingEarlier] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyCursorBeforeMs, setHistoryCursorBeforeMs] = useState<number | null>(null);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");

  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [rewriteSourceText, setRewriteSourceText] = useState("");
  const [selectedMode, setSelectedMode] = useState<RewriteMode | null>(null);
  const [rewritePreview, setRewritePreview] = useState("");
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteCache, setRewriteCache] = useState<Record<string, string>>({});
  const [isPairStatusOpen, setIsPairStatusOpen] = useState(false);
  const [pairOverview, setPairOverview] = useState<PairOverview>(EMPTY_PAIR_OVERVIEW);
  const [pairStatusLoading, setPairStatusLoading] = useState(false);
  const [pairStatusError, setPairStatusError] = useState<string | null>(null);
  const [pairCodeDraft, setPairCodeDraft] = useState("");
  const [pairActionLoading, setPairActionLoading] = useState(false);
  const [pairActionMessage, setPairActionMessage] = useState<string | null>(null);

  const canSend = useMemo(() => {
    return draft.trim().length > 0 && !isSending && !!pairId;
  }, [draft, isSending, pairId]);

  const canRewrite = useMemo(() => draft.trim().length >= 12, [draft]);

  const canReplaceDraft = useMemo(() => {
    return !rewriteLoading && !rewriteError && rewritePreview.trim().length > 0;
  }, [rewriteError, rewriteLoading, rewritePreview]);

  const canSubmitPairCode = useMemo(() => {
    return pairCodeDraft.trim().length >= 4 && !pairActionLoading;
  }, [pairActionLoading, pairCodeDraft]);

  const canRetryFailedSend = useMemo(() => {
    return !!lastFailedSend && !isSending;
  }, [lastFailedSend, isSending]);

  function clearHistoryPollTimeout() {
    if (!historyPollTimeoutRef.current) return;
    clearTimeout(historyPollTimeoutRef.current);
    historyPollTimeoutRef.current = null;
  }

  const fetchHistoryPage = useCallback(async (options: { beforeMs: number | null; trackPagination: boolean }) => {
    if (!pairId) return 0;

    const params: { limit: number; before?: number } = { limit: HISTORY_PAGE_LIMIT };
    if (options.beforeMs !== null) {
      params.before = options.beforeMs;
    }

    const res = await api.get(`/v1/chat/${pairId}/list`, { params });
    const history = normalizeHistoryMessages(res.data, sessionUidRef.current);

    setMessages((prev) => mergeMessages(history, prev));

    if (options.trackPagination) {
      if (history.length === 0) {
        setHasMoreHistory(false);
        return 0;
      }

      const oldestFetchedTs = getOldestKnownTimestamp(history);
      if (oldestFetchedTs === null) {
        setHasMoreHistory(false);
      } else {
        setHistoryCursorBeforeMs(oldestFetchedTs);
        setHasMoreHistory(history.length >= HISTORY_PAGE_LIMIT);
      }
    }

    return history.length;
  }, [pairId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsAppActive(nextState === "active");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setChatBootstrapLoading(true);
      try {
        const session = await ensureSession();
        const uid = normalizeNonEmptyString(session?.uid);
        sessionUidRef.current = uid;

        let resolvedPairId = getPairIdFromSessionUser(session);
        if (!resolvedPairId) {
          try {
            const pairRes = await api.get<PairApiResponse>("/v1/pairs/me");
            resolvedPairId = normalizeNonEmptyString(pairRes.data?.pair?.id);
          } catch {
            // Keep fallback silent and use pairing redirect below.
          }
        }

        if (!mounted) return;
        if (!resolvedPairId) {
          router.replace("/pair");
          return;
        }

        setPairId(resolvedPairId);
      } catch {
        if (mounted) router.replace("/pair");
      } finally {
        if (mounted) setChatBootstrapLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pairId) return;
    let cancelled = false;

    setMessages([]);
    setHistoryError(null);
    setHistoryCursorBeforeMs(null);
    setHasMoreHistory(true);
    setInitialHistoryLoading(true);
    historyPollFailureCountRef.current = 0;

    const loadInitialHistory = async () => {
      if (historyPollInFlightRef.current) return;
      historyPollInFlightRef.current = true;
      try {
        await fetchHistoryPage({ beforeMs: null, trackPagination: true });
      } catch {
        if (!cancelled) {
          setHistoryError("Couldn’t load recent messages.");
        }
      } finally {
        historyPollInFlightRef.current = false;
        if (!cancelled) setInitialHistoryLoading(false);
      }
    };

    void loadInitialHistory();

    return () => {
      cancelled = true;
      historyPollInFlightRef.current = false;
    };
  }, [fetchHistoryPage, pairId]);

  useEffect(() => {
    if (!pairId || chatBootstrapLoading || initialHistoryLoading || !isAppActive) {
      clearHistoryPollTimeout();
      return;
    }

    let cancelled = false;

    const scheduleNextPoll = (delayMs: number) => {
      if (cancelled) return;
      clearHistoryPollTimeout();
      historyPollTimeoutRef.current = setTimeout(() => {
        void pollHistory();
      }, delayMs);
    };

    const pollHistory = async () => {
      if (cancelled || !isAppActive) return;

      if (historyPollInFlightRef.current) {
        scheduleNextPoll(getPollDelayMs(historyPollFailureCountRef.current));
        return;
      }

      historyPollInFlightRef.current = true;
      try {
        await fetchHistoryPage({ beforeMs: null, trackPagination: false });
        historyPollFailureCountRef.current = 0;
        setHistoryError(null);
      } catch {
        historyPollFailureCountRef.current += 1;
        setHistoryError("Couldn’t refresh messages. Retrying…");
      } finally {
        historyPollInFlightRef.current = false;
        if (!cancelled && isAppActive) {
          scheduleNextPoll(getPollDelayMs(historyPollFailureCountRef.current));
        }
      }
    };

    scheduleNextPoll(getPollDelayMs(historyPollFailureCountRef.current));

    return () => {
      cancelled = true;
      clearHistoryPollTimeout();
    };
  }, [chatBootstrapLoading, fetchHistoryPage, initialHistoryLoading, isAppActive, pairId]);

  useEffect(() => {
    return () => {
      clearHistoryPollTimeout();
      historyPollInFlightRef.current = false;
    };
  }, []);

  async function sendMessageWithId(options: {
    pairId: string;
    messageId: string;
    text: string;
    addOptimisticUserMessage: boolean;
  }) {
    const { pairId: targetPairId, messageId, text, addOptimisticUserMessage } = options;

    if (addOptimisticUserMessage) {
      setMessages((prev) => {
        const optimisticUserCreatedAt = getNextOptimisticTimestamp(prev);
        return mergeMessages(
          [{ id: messageId, role: "user", createdAtMs: optimisticUserCreatedAt, text }],
          prev
        );
      });
    }

    setIsSending(true);

    try {
      const res = await api.post(`/v1/chat/${targetPairId}/send`, {
        text,
        messageId,
        clientId: sessionUidRef.current,
      });
      const reply = typeof res.data?.reply === "string" ? res.data.reply.trim() : "";

      if (reply) {
        setMessages((prev) => {
          const nextTimestamp = getNextOptimisticTimestamp(prev);
          return mergeMessages(
            [
              {
                id: `assistant_${messageId}`,
                role: "assistant",
                createdAtMs: nextTimestamp,
                text: reply,
              },
            ],
            prev
          );
        });
      }

      setLastFailedSend(null);
    } catch {
      setLastFailedSend({ pairId: targetPairId, messageId, text });
      setMessages((prev) => {
        const nextTimestamp = getNextOptimisticTimestamp(prev);
        return mergeMessages(
          [
            {
              id: `local-error-${makeId()}`,
              role: "assistant",
              createdAtMs: nextTimestamp,
              text: SEND_ERROR_MESSAGE,
            },
          ],
          prev
        );
      });
    } finally {
      setIsSending(false);
    }
  }

  async function onSend() {
    const text = draft.trim();
    if (!text || isSending) return;

    if (!pairId) {
      router.replace("/pair");
      return;
    }

    const messageId = makeId();
    setDraft("");

    await sendMessageWithId({
      pairId,
      messageId,
      text,
      addOptimisticUserMessage: true,
    });
  }

  async function onRetryFailedSend() {
    if (!lastFailedSend || isSending) return;

    await sendMessageWithId({
      pairId: lastFailedSend.pairId,
      messageId: lastFailedSend.messageId,
      text: lastFailedSend.text,
      addOptimisticUserMessage: false,
    });
  }

  async function onRetryHistory() {
    if (!pairId || historyRetryLoading) return;

    setHistoryRetryLoading(true);
    try {
      await fetchHistoryPage({ beforeMs: null, trackPagination: false });
      historyPollFailureCountRef.current = 0;
      setHistoryError(null);
    } catch {
      setHistoryError("Couldn’t refresh messages. Please try again.");
    } finally {
      setHistoryRetryLoading(false);
    }
  }

  async function onLoadEarlierMessages() {
    if (!pairId || historyLoadingEarlier || !hasMoreHistory) return;

    const fallbackOldest = getOldestKnownTimestamp(messages);
    const beforeMs = historyCursorBeforeMs ?? fallbackOldest;
    if (beforeMs === null) {
      setHasMoreHistory(false);
      return;
    }

    setHistoryLoadingEarlier(true);
    try {
      const count = await fetchHistoryPage({ beforeMs, trackPagination: true });
      if (count === 0) {
        setHasMoreHistory(false);
      }
      setHistoryError(null);
    } catch {
      setHistoryError("Couldn’t load earlier messages.");
    } finally {
      setHistoryLoadingEarlier(false);
    }
  }

  function openRewrite() {
    if (!canRewrite) return;
    setRewriteSourceText(draft);
    setSelectedMode(null);
    setRewritePreview("");
    setRewriteError(null);
    setRewriteLoading(false);
    requestSeqRef.current += 1;
    setIsRewriteOpen(true);
  }

  function closeRewrite() {
    requestSeqRef.current += 1;
    setRewriteLoading(false);
    setRewriteError(null);
    setIsRewriteOpen(false);
  }

  async function onSelectMode(mode: RewriteMode) {
    setSelectedMode(mode);
    setRewriteError(null);

    const sourceText = rewriteSourceText;
    const cacheKey = makeRewriteCacheKey(sourceText, mode);
    const cached = rewriteCache[cacheKey];
    if (cached) {
      setRewritePreview(cached);
      setRewriteLoading(false);
      return;
    }

    const requestId = ++requestSeqRef.current;
    setRewriteLoading(true);
    setRewritePreview("");

    try {
      const rewriteResult = await keystoneRewrite(sourceText, mode);
      if (requestSeqRef.current !== requestId) return;

      const output = extractRewriteOutput(rewriteResult).trim();
      if (!output) throw new Error("empty_rewrite_output");

      setRewritePreview(output);
      setRewriteCache((prev) => ({ ...prev, [cacheKey]: output }));
    } catch {
      if (requestSeqRef.current !== requestId) return;
      setRewriteError(REWRITE_ERROR_MESSAGE);
      setRewritePreview("");
    } finally {
      if (requestSeqRef.current === requestId) setRewriteLoading(false);
    }
  }

  function onReplaceDraft() {
    if (!canReplaceDraft) return;
    setDraft(rewritePreview);
    closeRewrite();
  }

  async function loadPairStatus() {
    setPairStatusLoading(true);
    setPairStatusError(null);

    try {
      const [session, pairResponse] = await Promise.all([
        ensureSession(),
        api.get<PairApiResponse>("/v1/pairs/me"),
      ]);
      const apiPair = pairResponse.data?.pair;

      const nextOverview: PairOverview = {
        pairId: normalizeNonEmptyString(apiPair?.id) ?? getPairIdFromSession(session),
        status: normalizePairStatus(apiPair?.status) ?? getPairStatusFromSession(session),
        code: normalizeNonEmptyString(apiPair?.code),
        membersCount: getPairMembersCount(apiPair),
      };

      setPairOverview(nextOverview);
      if (nextOverview.pairId) {
        setPairId(nextOverview.pairId);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setPairStatusError(err.response?.data?.error || "Could not load pair status.");
    } finally {
      setPairStatusLoading(false);
    }
  }

  function onOpenPairStatus() {
    setIsPairStatusOpen(true);
    void loadPairStatus();
  }

  function onClosePairStatus() {
    setIsPairStatusOpen(false);
  }

  async function onCreatePairCodeFromChat() {
    if (pairActionLoading) return;

    setPairActionLoading(true);
    setPairStatusError(null);
    setPairActionMessage(null);

    try {
      const res = await api.post<{ code?: string }>("/v1/pair/create", {});
      const createdCode = normalizeNonEmptyString(res.data?.code);
      setPairActionMessage(createdCode ? `Pairing code ready: ${createdCode}` : "Pair created.");
      await loadPairStatus();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setPairStatusError(err.response?.data?.error || "Create pair failed.");
    } finally {
      setPairActionLoading(false);
    }
  }

  async function onAddPairCodeFromChat() {
    if (!canSubmitPairCode) return;

    const code = pairCodeDraft.trim().toUpperCase();
    setPairActionLoading(true);
    setPairStatusError(null);
    setPairActionMessage(null);

    try {
      await api.post("/v1/pair/join", { code });
      setPairCodeDraft("");
      setPairActionMessage("Pairing code added.");
      await loadPairStatus();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setPairStatusError(err.response?.data?.error || "Join pair failed.");
    } finally {
      setPairActionLoading(false);
    }
  }

  function onOpenPairingScreen() {
    onClosePairStatus();
    router.replace("/pair");
  }

  const pairStatusLabel = pairOverview.status ?? "not_paired";
  const pairCodeLabel = pairOverview.code ?? "No code available";
  const pairIdLabel = pairOverview.pairId ?? "Not paired";

  const showBlockingLoader = chatBootstrapLoading || (!!pairId && initialHistoryLoading);

  if (showBlockingLoader || !pairId) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={{ marginTop: 12, color: "#374151", fontWeight: "600" }}>
          Loading chat…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={6}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderColor: "#E6E6E6",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#171717" }}>Chat</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={onOpenPairStatus}
              style={{
                borderWidth: 1,
                borderColor: "#D4D4D4",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#171717", fontWeight: "700" }}>Pair Status</Text>
            </Pressable>

            <Pressable
              onPress={() => signOut(firebaseAuth)}
              style={{
                borderWidth: 1,
                borderColor: "#D4D4D4",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#171717", fontWeight: "700" }}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
          {historyError ? (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FECACA",
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "#991B1B", fontWeight: "700", flex: 1, marginRight: 10 }}>
                {historyError}
              </Text>
              <Pressable
                onPress={onRetryHistory}
                disabled={historyRetryLoading}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#FCA5A5",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: historyRetryLoading ? "#FEE2E2" : "#FFFFFF",
                }}
              >
                <Text style={{ color: "#991B1B", fontWeight: "800" }}>
                  {historyRetryLoading ? "Retrying…" : "Retry"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {hasMoreHistory ? (
            <Pressable
              onPress={onLoadEarlierMessages}
              disabled={historyLoadingEarlier}
              style={{
                alignSelf: "center",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 7,
                backgroundColor: historyLoadingEarlier ? "#F3F4F6" : "#FFFFFF",
              }}
            >
              <Text style={{ color: "#374151", fontWeight: "700" }}>
                {historyLoadingEarlier ? "Loading earlier…" : "Load earlier messages"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={{ color: "#6B7280" }}>
              Start the conversation. Your rewrite stays preview-only until you tap Replace draft.
            </Text>
          }
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            const isPartner = item.role === "partner";
            const isAssistant = item.role === "assistant";
            const authorLabel = isUser ? "You" : isPartner ? "Partner" : "System (AI)";
            const authorColor = isUser ? "#065F46" : isPartner ? "#1D4ED8" : "#6B7280";
            const timestampLabel = formatMessageDateTime(item.createdAtMs);
            return (
              <View
                style={{
                  alignSelf: isUser ? "flex-end" : isPartner ? "flex-start" : "center",
                  maxWidth: "85%",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isUser ? "#D4F4EC" : isPartner ? "#DBEAFE" : "#E6E6E6",
                  backgroundColor: isUser ? "#EFFCF8" : isPartner ? "#EFF6FF" : "#FAFAFA",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: authorColor, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>
                  {`${authorLabel} • ${timestampLabel}`}
                </Text>
                <Text style={{ color: "#171717", lineHeight: 20, textAlign: isAssistant ? "center" : "left" }}>
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderColor: "#E6E6E6",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: "#FFFFFF",
          }}
        >
          {lastFailedSend ? (
            <View
              style={{
                marginBottom: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#FCA5A5",
                backgroundColor: "#FEF2F2",
                paddingVertical: 8,
                paddingHorizontal: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#991B1B", fontWeight: "700", flex: 1, marginRight: 10 }}>
                Last send failed.
              </Text>
              <Pressable
                onPress={onRetryFailedSend}
                disabled={!canRetryFailedSend}
                style={{
                  borderWidth: 1,
                  borderColor: "#FCA5A5",
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: canRetryFailedSend ? "#FFFFFF" : "#FEE2E2",
                }}
              >
                <Text style={{ color: "#991B1B", fontWeight: "800" }}>
                  {isSending ? "Retrying…" : "Retry send"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message..."
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#DADADA",
              borderRadius: 14,
              minHeight: 56,
              maxHeight: 140,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: "#171717",
              textAlignVertical: "top",
            }}
          />

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {canRewrite ? (
              <Pressable
                onPress={openRewrite}
                style={{
                  borderWidth: 1,
                  borderColor: "#D8B4FE",
                  borderRadius: 999,
                  backgroundColor: "#FAF5FF",
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: "#6B21A8", fontWeight: "700", fontSize: 13 }}>Rewrite</Text>
              </Pressable>
            ) : (
              <View />
            )}

            <Pressable
              onPress={onSend}
              disabled={!canSend}
              style={{
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 9,
                backgroundColor: canSend ? "#111111" : "#D4D4D4",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{isSending ? "Sending..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isPairStatusOpen} transparent animationType="slide" onRequestClose={onClosePairStatus}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            onPress={onClosePairStatus}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.25)" }}
          />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Pair Status</Text>
              <Pressable
                onPress={onClosePairStatus}
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                backgroundColor: "#F9FAFB",
                padding: 12,
                gap: 8,
              }}
            >
              {pairStatusLoading ? (
                <Text style={{ color: "#374151" }}>Loading pair status…</Text>
              ) : (
                <>
                  <Text style={{ color: "#111827", fontWeight: "700" }}>Pair ID: {pairIdLabel}</Text>
                  <Text style={{ color: "#111827" }}>Status: {pairStatusLabel}</Text>
                  <Text style={{ color: "#111827" }}>Code: {pairCodeLabel}</Text>
                  {pairOverview.membersCount !== null ? (
                    <Text style={{ color: "#111827" }}>Members: {pairOverview.membersCount}</Text>
                  ) : null}
                </>
              )}
            </View>

            {pairStatusError ? (
              <View style={{ borderRadius: 12, backgroundColor: "#FEF2F2", padding: 12 }}>
                <Text style={{ color: "#991B1B", fontWeight: "700" }}>{pairStatusError}</Text>
              </View>
            ) : null}

            {pairActionMessage ? (
              <View style={{ borderRadius: 12, backgroundColor: "#EFFCF8", padding: 12 }}>
                <Text style={{ color: "#065F46", fontWeight: "700" }}>{pairActionMessage}</Text>
              </View>
            ) : null}

            <View style={{ gap: 8 }}>
              <Pressable
                onPress={() => void loadPairStatus()}
                disabled={pairStatusLoading || pairActionLoading}
                style={{
                  backgroundColor: pairStatusLoading || pairActionLoading ? "#D1D5DB" : "#111",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Review Pairing Status</Text>
              </Pressable>

              <Pressable
                onPress={onCreatePairCodeFromChat}
                disabled={pairActionLoading}
                style={{
                  backgroundColor: pairActionLoading ? "#D1D5DB" : "#111",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {pairActionLoading ? "Working..." : "Create Pairing Code"}
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <TextInput
                value={pairCodeDraft}
                onChangeText={setPairCodeDraft}
                placeholder="Enter pairing code"
                autoCapitalize="characters"
                editable={!pairActionLoading}
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontWeight: "700",
                }}
              />
              <Pressable
                onPress={onAddPairCodeFromChat}
                disabled={!canSubmitPairCode}
                style={{
                  backgroundColor: canSubmitPairCode ? "#111" : "#D1D5DB",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Add Pairing Code</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={onOpenPairingScreen}
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#111827", fontWeight: "700" }}>Open Pairing Screen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={isRewriteOpen} transparent animationType="slide" onRequestClose={closeRewrite}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            onPress={closeRewrite}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.25)" }}
          />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Rewrite</Text>
              <Pressable
                onPress={closeRewrite}
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {REWRITE_MODES.map((entry) => {
                const active = selectedMode === entry.mode;
                return (
                  <Pressable
                    key={entry.mode}
                    onPress={() => onSelectMode(entry.mode)}
                    style={{
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? "#7C3AED" : "#D1D5DB",
                      backgroundColor: active ? "#F3E8FF" : "#FFFFFF",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#111827", fontWeight: "700", fontSize: 13 }}>{entry.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                backgroundColor: "#F9FAFB",
                padding: 12,
                minHeight: 110,
              }}
            >
              {rewriteLoading ? (
                <Text style={{ color: "#374151" }}>Rewriting…</Text>
              ) : rewriteError ? (
                <Text style={{ color: "#B91C1C" }}>{rewriteError}</Text>
              ) : rewritePreview ? (
                <Text style={{ color: "#111827", lineHeight: 20 }}>{rewritePreview}</Text>
              ) : (
                <Text style={{ color: "#6B7280" }}>Select a mode to preview a rewrite.</Text>
              )}
            </View>

            <Pressable
              onPress={onReplaceDraft}
              disabled={!canReplaceDraft}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: canReplaceDraft ? "#111111" : "#D4D4D4",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Replace draft</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { api, ensureSession } from "../../lib/api";
import { getPairIdFromSession, getPairStatusFromSession } from "../../lib/pairing";

type CreateResponse = { ok: true; pairId: string; code: string };
type JoinResponse = { ok: true; pairId: string };
type PairMeResponse = {
  pair?: {
    id?: unknown;
    status?: unknown;
    code?: unknown;
  } | null;
};

const AUTO_CHAT_REDIRECT_DELAY_MS = 4000;

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeApiErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { response?: { data?: { error?: unknown } } }).response?.data?.error;
  return typeof code === "string" && code.trim().length > 0 ? code : null;
}

function normalizePairStatus(value: unknown): "pending" | "active" | null {
  return value === "pending" || value === "active" ? value : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PairScreen() {
  const router = useRouter();

  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);
  const joinRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [code, setCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const autoRedirectSeconds = Math.round(AUTO_CHAT_REDIRECT_DELAY_MS / 1000);

  const canJoin = useMemo(() => code.trim().length >= 4 && !joinLoading, [code, joinLoading]);

  useEffect(() => {
    return () => {
      if (joinRedirectTimerRef.current) {
        clearTimeout(joinRedirectTimerRef.current);
        joinRedirectTimerRef.current = null;
      }
    };
  }, []);

  function clearJoinRedirectTimer() {
    if (!joinRedirectTimerRef.current) return;
    clearTimeout(joinRedirectTimerRef.current);
    joinRedirectTimerRef.current = null;
  }

  function scheduleJoinRedirect() {
    clearJoinRedirectTimer();
    joinRedirectTimerRef.current = setTimeout(() => {
      router.replace("/chat");
    }, AUTO_CHAT_REDIRECT_DELAY_MS);
  }

  function onOpenChatNow() {
    clearJoinRedirectTimer();
    router.replace("/chat");
  }

  async function loadExistingPairSnapshot() {
    const [sessionResult, pairResult] = await Promise.allSettled([
      ensureSession(),
      api.get<PairMeResponse>("/v1/pairs/me"),
    ]);

    const session = sessionResult.status === "fulfilled" ? sessionResult.value : null;
    const pair = pairResult.status === "fulfilled" ? pairResult.value.data?.pair ?? null : null;

    const sessionPairId = session ? getPairIdFromSession(session) : null;
    const sessionStatus = session ? getPairStatusFromSession(session) : null;

    const pairId = normalizeNonEmptyString(pair?.id) ?? sessionPairId;
    const status = normalizePairStatus(pair?.status) ?? sessionStatus;
    const code = normalizeNonEmptyString(pair?.code);

    return { pairId, status, code };
  }

  async function recoverExistingPair(options: { autoRouteWhenPaired?: boolean } = {}) {
    const autoRouteWhenPaired = options.autoRouteWhenPaired ?? true;

    setRecoveryLoading(true);
    setError(null);
    try {
      const snapshot = await loadExistingPairSnapshot();
      if (snapshot.code) {
        setCreatedCode(snapshot.code);
      }

      if (snapshot.pairId) {
        if (autoRouteWhenPaired) {
          router.replace("/chat");
        } else {
          if (snapshot.status === "active") {
            setJoinSuccessMessage("You are paired and active. Opening chat when ready.");
          } else {
            setJoinSuccessMessage("You are paired. Opening chat when ready.");
          }
        }
        return true;
      }

      setJoinSuccessMessage(null);
      setError("No existing pair was found. You can create a new pair.");
      return false;
    } catch {
      setJoinSuccessMessage(null);
      setError("Could not refresh your pairing status. Please try again.");
      return false;
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function onCheckExistingPair() {
    clearJoinRedirectTimer();
    await recoverExistingPair();
  }

  async function onLeaveCurrentPair() {
    if (leaveLoading) return;

    clearJoinRedirectTimer();
    setLeaveLoading(true);
    setError(null);
    setJoinSuccessMessage(null);
    try {
      await api.post("/v1/pairs/leave", {});
      setCreatedCode(null);
      setCode("");
      setJoinSuccessMessage("Left current pair. You can create or join a new one.");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Leave pair failed");
    } finally {
      setLeaveLoading(false);
    }
  }

  async function refreshAndRouteIfPaired(options: { routeToChat: boolean } = { routeToChat: true }) {
    const snapshot = await loadExistingPairSnapshot();
    if (snapshot.code) {
      setCreatedCode(snapshot.code);
    }
    if (snapshot.pairId) {
      if (options.routeToChat) {
        router.replace("/chat");
      }
      return true;
    }
    return false;
  }

  async function waitForPairingSync(maxAttempts = 12, delayMs = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const paired = await refreshAndRouteIfPaired({ routeToChat: false });
      if (paired) return true;
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs);
      }
    }
    return false;
  }

  async function onCreatePair() {
    if (createLoading) return;
    clearJoinRedirectTimer();
    setJoinSuccessMessage(null);
    setError(null);
    setCreateLoading(true);
    try {
      const res = await api.post("/v1/pair/create", {});
      const data = res.data as CreateResponse;
      if (!data?.ok || !data?.code) throw new Error("create_failed");
      setCreatedCode(data.code);
      // Do NOT auto-route. Creator must be able to see the code.
    } catch (e: any) {
      if (normalizeApiErrorCode(e) === "user_already_paired") {
        await recoverExistingPair();
      } else {
        setError(e?.response?.data?.error || "Create pair failed");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function onJoinPair() {
    if (!canJoin) return;
    clearJoinRedirectTimer();
    setJoinSuccessMessage(null);
    setError(null);
    setJoinLoading(true);
    try {
      const normalized = code.trim().toUpperCase();
      const res = await api.post("/v1/pair/join", { code: normalized });
      const data = res.data as JoinResponse;
      if (!data?.ok) throw new Error("join_failed");

      const ok = await waitForPairingSync();
      if (!ok) {
        setError("Code accepted, but pairing has not synced yet. Please try again in a few seconds.");
        return;
      }

      setJoinSuccessMessage(`Pair connected. Opening chat in ${autoRedirectSeconds} seconds…`);
      scheduleJoinRedirect();
    } catch (e: any) {
      clearJoinRedirectTimer();
      setJoinSuccessMessage(null);
      if (normalizeApiErrorCode(e) === "user_already_paired") {
        await recoverExistingPair();
      } else {
        setError(e?.response?.data?.error || "Join pair failed");
      }
    } finally {
      setJoinLoading(false);
    }
  }

  async function onContinueAfterCreate() {
    setError(null);
    try {
      const ok = await refreshAndRouteIfPaired();
      if (!ok) setError("No pair was found in your session yet. Please try again.");
    } catch {
      setError("Couldn’t refresh session. Make sure the API is running.");
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 14, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Pair Up</Text>
      <Text style={{ color: "#666" }}>
        Create a pair to get a code, or join your partner using their code.
      </Text>

      {error ? (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#FEF2F2" }}>
          <Text style={{ color: "#991B1B", fontWeight: "700" }}>{error}</Text>
        </View>
      ) : null}

      <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "800" }}>Create pair</Text>

        {createdCode ? (
          <>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#F9FAFB" }}>
              <Text style={{ color: "#111", fontWeight: "900", fontSize: 22, letterSpacing: 1 }}>
                {createdCode}
              </Text>
              <Text style={{ marginTop: 6, color: "#666" }}>
                Share this code with your partner. This screen will stay until you continue.
              </Text>
            </View>

            <Pressable
              onPress={onContinueAfterCreate}
              style={{ backgroundColor: "#111", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Continue</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={onCreatePair}
            disabled={createLoading}
            style={{
              backgroundColor: createLoading ? "#D1D5DB" : "#111",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {createLoading ? "Creating…" : "Create pair"}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "800" }}>Join pair</Text>

        <TextInput
          value={code}
          onChangeText={(value) => {
            clearJoinRedirectTimer();
            setJoinSuccessMessage(null);
            setCode(value);
          }}
          placeholder="Enter code"
          autoCapitalize="characters"
          style={{
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontWeight: "700",
          }}
        />

        <Pressable
          onPress={onJoinPair}
          disabled={!canJoin}
          style={{
            backgroundColor: canJoin ? "#111" : "#D1D5DB",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>{joinLoading ? "Joining…" : "Join"}</Text>
        </Pressable>

        {joinSuccessMessage ? (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#EFFCF8", gap: 10 }}>
            <Text style={{ color: "#065F46", fontWeight: "700" }}>{joinSuccessMessage}</Text>
            <Pressable
              onPress={onOpenChatNow}
              style={{ backgroundColor: "#111", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Open chat now</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "800" }}>Already paired?</Text>
        <Pressable
          onPress={onCheckExistingPair}
          disabled={recoveryLoading || leaveLoading}
          style={{
            backgroundColor: recoveryLoading || leaveLoading ? "#D1D5DB" : "#111",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            {recoveryLoading ? "Checking…" : "Load existing pair"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onLeaveCurrentPair}
          disabled={leaveLoading || recoveryLoading}
          style={{
            backgroundColor: leaveLoading || recoveryLoading ? "#F3F4F6" : "#FEE2E2",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FCA5A5",
          }}
        >
          <Text style={{ color: "#991B1B", fontWeight: "800" }}>
            {leaveLoading ? "Leaving…" : "Leave current pair"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

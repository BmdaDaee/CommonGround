import { useCallback, useMemo, useState } from "react";
import { usePersistedState } from "./usePersistedState";
import { apiGet, apiPost, normalizeApiErrorMessage } from "@/lib/api";

type RitualStatus = "idle" | "saving" | "completed" | "error";

export function useRitualState() {
  const [completed, setCompleted] = usePersistedState<boolean>("cg:ritual:completed", false);
  const [status, setStatus] = useState<RitualStatus>(completed ? "completed" : "idle");
  const [error, setError] = useState<string | null>(null);

  const syncFromBackend = useCallback(async (pid: string, ritualKey: string) => {
    const query = `/v1/rituals/status?pairId=${encodeURIComponent(pid)}&ritualKey=${encodeURIComponent(ritualKey)}`;
    const data: any = await apiGet(query);
    const serverCompleted = Boolean(data?.ritual?.completed);

    setCompleted(serverCompleted);
    setStatus(serverCompleted ? "completed" : "idle");
    return serverCompleted;
  }, [setCompleted]);

  const complete = useCallback(async (pairId: string, ritualKey: string = "daily") => {
    const pid = String(pairId || "").trim();
    const wasCompleted = completed;
    if (!pid) {
      setStatus("error");
      setError("pairId is required");
      return;
    }

    setError(null);
    setStatus("saving");
    try {
      await apiPost("/v1/rituals/complete", { pairId: pid, ritualKey });
      await syncFromBackend(pid, ritualKey);
    } catch (e: any) {
      setStatus(wasCompleted ? "completed" : "error");
      setError(normalizeApiErrorMessage(e?.message ? String(e.message) : "ritual_complete_failed"));
    }
  }, [completed, syncFromBackend]);

  const refresh = useCallback(async (pairId: string, ritualKey: string = "daily") => {
    const pid = String(pairId || "").trim();
    const wasCompleted = completed;
    if (!pid) {
      setStatus(wasCompleted ? "completed" : "idle");
      setError("pairId is required");
      return;
    }

    setError(null);
    setStatus("saving");
    try {
      await syncFromBackend(pid, ritualKey);
    } catch (e: any) {
      setStatus(wasCompleted ? "completed" : "idle");
      setError(normalizeApiErrorMessage(e?.message ? String(e.message) : "ritual_refresh_failed"));
    }
  }, [completed, syncFromBackend]);

  const reset = useCallback(() => {
    setCompleted(false);
    setStatus("idle");
    setError(null);
  }, [setCompleted]);

  const label = useMemo(() => {
    if (status === "saving") return "Saving…";
    if (status === "completed") return "Completed ✓";
    if (status === "error") return "Failed";
    return "Pending";
  }, [status]);

  return { completed, status, label, error, complete, reset, refresh };
}

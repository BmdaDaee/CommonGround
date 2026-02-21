import { useCallback, useMemo, useState } from "react";
import { usePersistedState } from "./usePersistedState";
import { apiGet, apiPost } from "@/lib/api";

type RitualStatus = "idle" | "saving" | "completed" | "error";

export function useRitualState() {
  const [completed, setCompleted] = usePersistedState<boolean>("cg:ritual:completed", false);
  const [status, setStatus] = useState<RitualStatus>(completed ? "completed" : "idle");
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(async (pairId: string, ritualKey: string = "daily") => {
    const pid = String(pairId || "").trim();
    const wasCompleted = completed;
    if (!pid) {
      setStatus("error");
      setError("missing_pair_id");
      return;
    }

    setError(null);
    setStatus("saving");
    try {
      await apiPost("/v1/rituals/complete", { pairId: pid, ritualKey });
      setCompleted(true);
      setStatus("completed");
    } catch (e: any) {
      setStatus(wasCompleted ? "completed" : "error");
      setError(e?.message ? String(e.message) : "ritual_complete_failed");
    }
  }, [completed, setCompleted]);

  const refresh = useCallback(async (pairId: string, ritualKey: string = "daily") => {
    const pid = String(pairId || "").trim();
    const wasCompleted = completed;
    if (!pid) {
      setStatus(wasCompleted ? "completed" : "idle");
      setError("missing_pair_id");
      return;
    }

    setError(null);
    setStatus("saving");
    try {
      const query = `/v1/rituals/status?pairId=${encodeURIComponent(pid)}&ritualKey=${encodeURIComponent(ritualKey)}`;
      const data: any = await apiGet(query);
      const serverCompleted = Boolean(data?.ritual?.completed);

      setCompleted(serverCompleted);
      setStatus(serverCompleted ? "completed" : "idle");
    } catch (e: any) {
      setStatus(wasCompleted ? "completed" : "idle");
      setError(e?.message ? String(e.message) : "ritual_refresh_failed");
    }
  }, [completed, setCompleted]);

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

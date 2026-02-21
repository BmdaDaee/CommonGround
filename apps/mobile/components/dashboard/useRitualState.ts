import { useMemo, useState } from "react";
import { usePersistedState } from "./usePersistedState";
import { apiPost } from "@/lib/api";

type RitualStatus = "idle" | "saving" | "completed" | "error";

export function useRitualState() {
  const [completed, setCompleted] = usePersistedState<boolean>("cg:ritual:completed", false);
  const [status, setStatus] = useState<RitualStatus>(completed ? "completed" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function complete(pairId: string, ritualKey: string = "daily") {
    const pid = String(pairId || "").trim();
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
      setStatus("error");
      setError(e?.message ? String(e.message) : "ritual_complete_failed");
    }
  }

  function reset() {
    setCompleted(false);
    setStatus("idle");
    setError(null);
  }

  const label = useMemo(() => {
    if (status === "saving") return "Saving…";
    if (status === "completed") return "Completed ✓";
    if (status === "error") return "Failed";
    return "Pending";
  }, [status]);

  return { completed, status, label, error, complete, reset };
}

import { useMemo, useState } from "react";
import { usePersistedState } from "./usePersistedState";

type RitualStatus = "idle" | "saving" | "completed" | "error";

export function useRitualState() {
  const [completed, setCompleted] = usePersistedState<boolean>("cg:ritual:completed", false);
  const [status, setStatus] = useState<RitualStatus>(completed ? "completed" : "idle");

  async function complete() {
    setStatus("saving");
    try {
      await new Promise((r) => setTimeout(r, 450));
      setCompleted(true);
      setStatus("completed");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setCompleted(false);
    setStatus("idle");
  }

  const label = useMemo(() => {
    if (status === "saving") return "Saving…";
    if (status === "completed") return "Completed ✓";
    if (status === "error") return "Failed";
    return "Pending";
  }, [status]);

  return { completed, status, label, complete, reset };
}

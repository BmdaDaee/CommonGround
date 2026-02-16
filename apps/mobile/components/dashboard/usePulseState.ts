import { useMemo, useState } from "react";
import { usePersistedState } from "./usePersistedState";

export type MoodKey = "Happy" | "Calm" | "Neutral" | "Anxious" | "Tired";
type PulseStatus = "idle" | "saving" | "synced" | "error";

export function usePulseState(initialMood: MoodKey = "Neutral") {
  const [mood, setMood] = usePersistedState<MoodKey>("cg:pulse:mood", initialMood);
  const [status, setStatus] = useState<PulseStatus>("idle");

  async function submit() {
    setStatus("saving");
    try {
      await new Promise((r) => setTimeout(r, 450));
      setStatus("synced");
    } catch {
      setStatus("error");
    }
  }

  const label = useMemo(() => {
    if (status === "saving") return "Saving…";
    if (status === "synced") return "Synced ✓";
    if (status === "error") return "Failed";
    return "Not shared";
  }, [status]);

  return { mood, setMood, status, label, submit };
}

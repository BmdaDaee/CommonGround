import { useEffect, useMemo, useState } from "react";
import { pulseGet, pulseSet } from "../services/api";

const MOODS = ["Happy", "Calm", "Neutral", "Anxious", "Tired"];

function formatAge(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function PulsePanel({ defaultPairId = "" }) {
  const [pairId, setPairId] = useState(defaultPairId);
  const [mood, setMood] = useState("Calm");
  const [pulse, setPulse] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | saving | ok | err
  const [error, setError] = useState("");
  const [syncedAt, setSyncedAt] = useState(0);

  const lastUpdated = useMemo(() => formatAge(pulse?.updatedAt), [pulse?.updatedAt, syncedAt]);

  useEffect(() => {
    if (!pulse?.updatedAt) return;
    const id = setInterval(() => setSyncedAt(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pulse?.updatedAt]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      if (!pairId.trim()) {
        setPulse(null);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      try {
        const data = await pulseGet(pairId.trim());
        if (cancelled) return;

        const p = data?.pulse || null;
        setPulse(p);
        if (p?.mood) setMood(p.mood);
        setStatus("ok");
      } catch (e) {
        if (cancelled) return;
        setStatus("err");
        setError(e?.message || "pulse_get_failed");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [pairId]);

  const doSync = async () => {
    const pid = pairId.trim();
    if (!pid) return;

    setStatus("saving");
    setError("");
    try {
      const data = await pulseSet(pid, mood);
      const p = data?.pulse || null;
      setPulse(p);
      setStatus("ok");
      setSyncedAt(Date.now());
    } catch (e) {
      setStatus("err");
      setError(e?.message || "pulse_set_failed");
    }
  };

  const fresh = (() => {
    const t = new Date(pulse?.updatedAt || 0).getTime();
    if (!Number.isFinite(t) || !t) return false;
    return Date.now() - t < 2 * 60 * 1000;
  })();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 16,
        padding: 14,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>Today’s Pulse</div>
          <div
            title={fresh ? "Synced recently" : "Not fresh"}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: fresh ? "#22c55e" : "#a3a3a3",
              boxShadow: fresh ? "0 0 0 3px rgba(34,197,94,0.15)" : "none",
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {pulse?.updatedAt ? `Updated ${lastUpdated}` : "No pulse yet"}
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {status === "loading" ? "Loading…" : status === "saving" ? "Syncing…" : status === "ok" ? "Ready" : status === "err" ? "Error" : ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={pairId}
          onChange={(e) => setPairId(e.target.value)}
          placeholder="Pair ID"
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #ddd",
            minWidth: 340,
            flex: "1 1 auto",
          }}
        />

        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #ddd",
            minWidth: 160,
            fontWeight: 800,
          }}
        >
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          onClick={doSync}
          disabled={!pairId.trim() || status === "loading" || status === "saving"}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: !pairId.trim() || status === "loading" || status === "saving" ? "#f3f3f3" : "#fff",
            fontWeight: 900,
            cursor: !pairId.trim() || status === "loading" || status === "saving" ? "not-allowed" : "pointer",
          }}
        >
          Sync pulse
        </button>
      </div>

      {error ? <div style={{ color: "crimson", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}

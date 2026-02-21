import { useEffect, useMemo, useState } from "react";
import { normalizeApiErrorMessage, pairsMe, pulseGet, pulseSet } from "../services/api";

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

function shortId(id) {
  const s = String(id || "").trim();
  if (!s) return "";
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function PulsePanel({ defaultPairId = "" }) {
  const [pairId, setPairId] = useState(defaultPairId);
  const [autoPairId, setAutoPairId] = useState(defaultPairId);
  const [autoPairKnown, setAutoPairKnown] = useState(Boolean(defaultPairId));

  const [mood, setMood] = useState("Calm");

  const [pulses, setPulses] = useState([]);
  const [lastActorUserId, setLastActorUserId] = useState(null);

  const [status, setStatus] = useState("idle"); // idle | loading | saving | ok | err
  const [error, setError] = useState("");
  const [syncedAt, setSyncedAt] = useState(0);

  const newestPulse = useMemo(() => {
    if (!Array.isArray(pulses) || pulses.length === 0) return null;
    const sorted = [...pulses].sort((a, b) => {
      const ta = new Date(a?.updatedAt || 0).getTime();
      const tb = new Date(b?.updatedAt || 0).getTime();
      return tb - ta;
    });
    return sorted[0] || null;
  }, [pulses]);

  const lastUpdated = useMemo(() => formatAge(newestPulse?.updatedAt), [newestPulse?.updatedAt, syncedAt]);

  useEffect(() => {
    if (!newestPulse?.updatedAt) return;
    const id = setInterval(() => setSyncedAt(Date.now()), 1000);
    return () => clearInterval(id);
  }, [newestPulse?.updatedAt]);

  useEffect(() => {
    let cancelled = false;

    async function detectPair() {
      try {
        const data = await pairsMe();
        if (cancelled) return;

        const detectedPairId = String(data?.pair?.id || "").trim();
        setAutoPairKnown(true);
        setAutoPairId(detectedPairId);

        if (detectedPairId) {
          setPairId((prev) => {
            const current = String(prev || "").trim();
            return current ? prev : detectedPairId;
          });
        }
      } catch {
        if (cancelled) return;
        setAutoPairKnown(true);
        setAutoPairId("");
      }
    }

    detectPair();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      if (!pairId.trim()) {
        setPulses([]);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      try {
        const data = await pulseGet(pairId.trim());
        if (cancelled) return;

        const list = Array.isArray(data?.pulses) ? data.pulses : [];
        setPulses(list);

        const mine =
          lastActorUserId ? list.find((p) => p?.userId === lastActorUserId) : null;

        if (mine?.mood) setMood(mine.mood);
        else if (list[0]?.mood) setMood(list[0].mood);

        setStatus("ok");
      } catch (e) {
        if (cancelled) return;
        setStatus("err");
        setError(normalizeApiErrorMessage(e?.message || "pulse_get_failed"));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [pairId, lastActorUserId]);

  const doSync = async () => {
    const pid = pairId.trim();
    if (!pid) return;

    setStatus("saving");
    setError("");
    try {
      const data = await pulseSet(pid, mood);
      const row = data?.pulse || null;

      if (row?.userId) setLastActorUserId(row.userId);

      // Merge updated row into pulses list (best effort)
      setPulses((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        if (!row?.userId) return list;

        const nextRow = {
          userId: row.userId,
          mood: row.mood,
          updatedAt: row.updatedAt,
        };

        const idx = list.findIndex((p) => p?.userId === row.userId);
        if (idx >= 0) list[idx] = nextRow;
        else list.push(nextRow);

        return list;
      });

      setStatus("ok");
      setSyncedAt(Date.now());
    } catch (e) {
      setStatus("err");
      setError(normalizeApiErrorMessage(e?.message || "pulse_set_failed"));
    }
  };

  const fresh = (() => {
    const t = new Date(newestPulse?.updatedAt || 0).getTime();
    if (!Number.isFinite(t) || !t) return false;
    return Date.now() - t < 2 * 60 * 1000;
  })();

  const busy = status === "loading" || status === "saving";

  const statusNote = (() => {
    if (status === "loading") return "Loading pulse…";
    if (status === "saving") return "Syncing pulse…";
    if (status === "err") return error || "Sync failed";
    if (!pairId.trim()) return "Enter a pair ID to load pulse";
    if (status === "ok") return "Ready";
    return "";
  })();

  const pulseRows = useMemo(() => {
    const list = Array.isArray(pulses) ? [...pulses] : [];
    return list.sort((a, b) => {
      const ta = new Date(a?.updatedAt || 0).getTime();
      const tb = new Date(b?.updatedAt || 0).getTime();
      return tb - ta;
    });
  }, [pulses]);

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
        textAlign: "left",
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
            {newestPulse?.updatedAt ? `Updated ${lastUpdated}` : "No pulse yet"}
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {status === "loading" ? "Loading…" : status === "saving" ? "Syncing…" : status === "ok" ? "Ready" : status === "err" ? "Error" : ""}
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.68 }}>
        {!autoPairKnown ? "Detecting pair…" : autoPairId ? `Auto pair: ${autoPairId}` : "No active pair"}
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
          disabled={!pairId.trim() || busy}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: !pairId.trim() || busy ? "#f3f3f3" : "#fff",
            fontWeight: 900,
            cursor: !pairId.trim() || busy ? "not-allowed" : "pointer",
          }}
        >
          {status === "saving" ? "Syncing…" : "Sync pulse"}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        {statusNote}
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.85 }}>Relationship pulses</div>

        {pulseRows.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>No pulses yet</div>
        ) : (
          pulseRows.map((p) => (
            <div
              key={p.userId || Math.random()}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 12,
                padding: "8px 10px",
                border: "1px solid #eee",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900 }}>{p.mood || "—"}</div>
                <div style={{ opacity: 0.75 }}>{p.updatedAt ? `· ${formatAge(p.updatedAt)}` : ""}</div>
              </div>

              <div style={{ opacity: 0.65 }} title={p.userId || ""}>
                {p.userId ? shortId(p.userId) : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

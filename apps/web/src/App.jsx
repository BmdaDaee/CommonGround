import { useMemo, useRef, useState } from "react";
import "./App.css";
import { apiBaseUrl } from "./config/runtime";

const DEFAULT_USER_ID = "test-user-1";
const API_BASE = apiBaseUrl; // default: Vite proxy

function nowId() {
  return Math.random().toString(36).slice(2);
}

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        border: "1px solid #e6d9ff",
        background: "#faf5ff",
      }}
    >
      {children}
    </span>
  );
}

function PatternInsightCard({ topic, text }) {
  return (
    <div
      style={{
        border: "1px solid #e6d9ff",
        background: "#faf5ff",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#efe0ff",
            border: "1px solid #e6d9ff",
            fontSize: 13,
            flex: "0 0 auto",
          }}
        >
          ✦
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2 }}>Pattern Insight</div>
          {topic ? <Pill>{topic}</Pill> : null}
        </div>
      </div>

      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{text}</div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Keep this in view while you talk. The goal is awareness, not shame.
      </div>
    </div>
  );
}

function VibeDial({ vibe, setVibe }) {
  const opts = [
    { key: "soft", label: "Soft" },
    { key: "realtalk", label: "Real Talk" },
    { key: "savage", label: "Savage" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => setVibe(o.key)}
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            border: vibe === o.key ? "2px solid #7c3aed" : "1px solid #e6d9ff",
            background: vibe === o.key ? "#f3e8ff" : "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Minimal SSE parser for "event: token" / "event: done" / "event: error"
 */
async function postStream(url, body, { onToken, onDone, onError }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const flushEvent = (raw) => {
    const lines = raw.split("\n").map((l) => l.trimEnd());
    let eventType = "message";
    let dataLine = "";

    for (const line of lines) {
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      if (line.startsWith("data:")) dataLine += line.slice(5).trim();
    }

    let data = null;
    if (dataLine) {
      try {
        data = JSON.parse(dataLine);
      } catch {
        data = { raw: dataLine };
      }
    }

    if (eventType === "token") onToken?.(data?.token ?? "");
    else if (eventType === "done") onDone?.(data);
    else if (eventType === "error") onError?.(data);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (chunk.trim()) flushEvent(chunk);
    }
  }
}

export default function App() {
  const [view, setView] = useState("chat"); // chat | tools
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [message, setMessage] = useState("");
  const [useStream, setUseStream] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [vibe, setVibe] = useState("realtalk");

  const [sessionId, setSessionId] = useState("");
  const [toneState, setToneState] = useState(null);
  const [error, setError] = useState("");

  // Pinned banner points to the last in-chat callout (no duplicate full card)
  const [pinnedCallout, setPinnedCallout] = useState(null); // {topic, text, key?}
  const [pinnedCalloutMsgId, setPinnedCalloutMsgId] = useState(null); // message id of in-chat callout

  const calloutRefs = useRef(new Map()); // msgId -> DOM node
  const scrollRef = useRef(null);

  const [msgs, setMsgs] = useState([
    { id: nowId(), kind: "text", role: "assistant", content: "Send 3 similar messages to trigger a Pattern Insight." },
  ]);

  // Tools UI state (prototype-style features)
  const [toolText, setToolText] = useState("");
  const [toolOut, setToolOut] = useState("");
  const [toolJson, setToolJson] = useState(null);
  const [toolBusy, setToolBusy] = useState(false);

  const debugLinks = useMemo(() => {
    if (!sessionId) return null;
    return {
      session: `${API_BASE}/session/${sessionId}`,
      patterns: `${API_BASE}/debug/session/${sessionId}/patterns`,
      analytics: `${API_BASE}/debug/user/${encodeURIComponent(userId)}/patterns`,
    };
  }, [sessionId, userId]);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const scrollToCallout = (msgId) => {
    const node = calloutRefs.current.get(msgId);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const pushText = (role, content) => {
    setMsgs((prev) => [...prev, { id: nowId(), kind: "text", role, content }]);
    scrollDown();
  };

  // Insert callout ONCE in chat, pin points to it
  const pushCalloutAndPin = (callout) => {
    if (!callout?.text) return;

    const calloutMsgId = nowId();

    setMsgs((prev) => [
      ...prev,
      { id: calloutMsgId, kind: "callout", topic: callout.topic || "", content: callout.text },
    ]);

    setPinnedCallout(callout);
    setPinnedCalloutMsgId(calloutMsgId);

    scrollDown();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      pushText("assistant", "Copied the Pattern Insight to clipboard.");
    } catch {
      pushText("assistant", "Couldn’t copy automatically. Select and copy it manually.");
    }
  };

  const reflectPrompt = (callout) => {
    const topic = callout?.topic || "this";
    return `Help me unpack this pattern (${topic}). Give me:\n1) what’s likely happening underneath,\n2) one sentence I can say in the moment,\n3) one small action to try this week.`;
  };

  const handleIncomingMeta = (meta) => {
    const callout = meta?.callout;
    if (callout?.text) {
      // Non-stream path: insert in chat and pin banner to that exact message
      pushCalloutAndPin(callout);
    }
  };

  const sendNonStream = async (text) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: text }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

    setSessionId(data.sessionId || "");
    setToneState(data.toneState || null);

    handleIncomingMeta(data?.meta);

    return data.reply || "";
  };

  const sendStream = async (text) => {
    const assistantId = nowId();
    setMsgs((prev) => [...prev, { id: assistantId, kind: "text", role: "assistant", content: "" }]);

    let full = "";

    await postStream(
      `${API_BASE}/chat-stream`,
      { userId, message: text },
      {
        onToken: (t) => {
          full += t;
          setMsgs((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)));
          scrollDown();
        },
        onDone: (payload) => {
          setSessionId(payload?.sessionId || "");
          setToneState(payload?.toneState || null);

          const callout = payload?.meta?.callout;
          if (callout?.text) {
            // Stream path: insert in chat BEFORE the assistant message, and pin banner to it.
            const calloutMsgId = nowId();

            setMsgs((prev) => {
              const idx = prev.findIndex((m) => m.id === assistantId);
              if (idx === -1) return prev;

              const before = prev.slice(0, idx);
              const after = prev.slice(idx);

              return [
                ...before,
                { id: calloutMsgId, kind: "callout", topic: callout.topic || "", content: callout.text },
                ...after,
              ];
            });

            setPinnedCallout(callout);
            setPinnedCalloutMsgId(calloutMsgId);

            scrollDown();
          }
        },
        onError: (payload) => {
          throw new Error(payload?.error || "stream_failed");
        },
      }
    );

    return full;
  };

  const runTool = async (task) => {
    setToolBusy(true);
    setToolOut("");
    setToolJson(null);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, task, context: toolText, vibe }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${res.status}`);

      if (data?.expectsJson && data?.parsed) setToolJson(data.parsed);
      setToolOut(data?.output || "");
      if (data?.sessionId) setSessionId(data.sessionId);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setToolBusy(false);
    }
  };

  const onSend = async () => {
    setError("");
    const text = message.trim();
    if (!text) return;

    setMessage("");
    pushText("user", text);

    setIsSending(true);
    try {
      if (useStream) {
        await sendStream(text);
      } else {
        const reply = await sendNonStream(text);
        pushText("assistant", reply);
      }
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      pushText("assistant", `⚠️ Error: ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) onSend();
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <h1 style={{ margin: 0 }}>CommonGround</h1>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Pattern Insights are rare on purpose. They’re not here to nag you.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>User ID</span>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: 8, minWidth: 220, borderRadius: 10, border: "1px solid #ddd" }}
            placeholder="test-user-1"
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={useStream} onChange={(e) => setUseStream(e.target.checked)} />
          <span style={{ fontSize: 12, opacity: 0.8 }}>Use streaming</span>
        </label>

        <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>
          <div>
            API: <code>{API_BASE || "(via Vite proxy)"}</code>
          </div>
          <div>
            Session: <code>{sessionId || "(none yet)"}</code>
          </div>
        </div>
      </div>

      {/* View + Vibe (no "mode selector" robot nonsense) */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("chat")}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              border: view === "chat" ? "2px solid #7c3aed" : "1px solid #ddd",
              background: view === "chat" ? "#f3e8ff" : "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setView("tools")}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              border: view === "tools" ? "2px solid #7c3aed" : "1px solid #ddd",
              background: view === "tools" ? "#f3e8ff" : "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Tools
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Vibe</span>
          <VibeDial vibe={vibe} setVibe={setVibe} />
        </div>
      </div>

      {/* ToneState */}
      {toneState ? (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #ddd", borderRadius: 12 }}>
          <strong style={{ fontSize: 12 }}>ToneState</strong>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {JSON.stringify(toneState, null, 2)}
          </pre>
        </div>
      ) : null}

      {/* Debug links */}
      {debugLinks ? (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #ddd", borderRadius: 12 }}>
          <strong style={{ fontSize: 12 }}>Debug links</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, fontSize: 12 }}>
            <a href={debugLinks.session} target="_blank" rel="noreferrer">
              View session JSON
            </a>
            <a href={debugLinks.patterns} target="_blank" rel="noreferrer">
              View session.patternTracker
            </a>
            <a href={debugLinks.analytics} target="_blank" rel="noreferrer">
              View analytics tracker (user)
            </a>
          </div>
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div style={{ marginBottom: 12, color: "crimson", fontSize: 12 }}>
          <strong>Last error:</strong> {error}
        </div>
      ) : null}

      {view === "chat" ? (
        <>
      {/* COMPACT PINNED BANNER (no duplicate full card) */}
      {pinnedCallout?.text ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 16,
            border: "1px solid #e6d9ff",
            background: "linear-gradient(180deg, #ffffff 0%, #fbf7ff 100%)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 260 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#efe0ff",
                border: "1px solid #e6d9ff",
                fontSize: 13,
                flex: "0 0 auto",
              }}
            >
              ✦
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>Pinned Pattern</div>
                {pinnedCallout.topic ? <Pill>{pinnedCallout.topic}</Pill> : null}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.75,
                  maxWidth: 520,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={pinnedCallout.text}
              >
                {pinnedCallout.text}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={() => pinnedCalloutMsgId && scrollToCallout(pinnedCalloutMsgId)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              View
            </button>

            <button
              onClick={() => setMessage(reflectPrompt(pinnedCallout))}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Reflect
            </button>

            <button
              onClick={() => copyToClipboard(pinnedCallout.text)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Copy
            </button>

            <button
              onClick={() => {
                setPinnedCallout(null);
                setPinnedCalloutMsgId(null);
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Unpin
            </button>
          </div>
        </div>
      ) : null}

      {/* Chat window */}
      <div
        style={{
          height: 420,
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 12,
          background: "#fff",
        }}
      >
        {msgs.map((m) => {
          if (m.kind === "callout") {
            return (
              <div
                key={m.id}
                ref={(node) => {
                  if (node) calloutRefs.current.set(m.id, node);
                  else calloutRefs.current.delete(m.id);
                }}
                style={{ marginBottom: 10 }}
              >
                <PatternInsightCard topic={m.topic} text={m.content} />
              </div>
            );
          }

          return (
            <div
              key={m.id}
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #eee",
                background: m.role === "user" ? "#fcfcfc" : "#fff",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 800 }}>{m.role.toUpperCase()}</div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{m.content}</div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Try: "As soon as there’s tension, I shut down..."'
          style={{
            flex: 1,
            minHeight: 70,
            padding: 12,
            borderRadius: 16,
            border: "1px solid #ddd",
            resize: "vertical",
          }}
        />
        <button
          onClick={onSend}
          disabled={isSending || !message.trim()}
          style={{
            minWidth: 120,
            borderRadius: 16,
            border: "1px solid #ddd",
            background: isSending ? "#f3f3f3" : "#fff",
            fontWeight: 900,
            cursor: isSending ? "not-allowed" : "pointer",
          }}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Enter sends. Shift+Enter makes a new line.
      </div>
        </>
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 14,
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Tools</h2>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
            Prototype features, but powered by Shantell’s voice. Paste text, pick a tool, get something usable.
          </div>

          <textarea
            value={toolText}
            onChange={(e) => setToolText(e.target.value)}
            placeholder='Paste the situation. Example: "She said I always disappear when we argue..."'
            style={{
              width: "100%",
              minHeight: 140,
              padding: 12,
              borderRadius: 14,
              border: "1px solid #ddd",
              resize: "vertical",
              marginBottom: 12,
            }}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button
              onClick={() => runTool("draft_reply")}
              disabled={toolBusy || !toolText.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: toolBusy ? "#f3f3f3" : "#fff",
                fontWeight: 900,
                cursor: toolBusy ? "not-allowed" : "pointer",
              }}
            >
              Draft Reply
            </button>

            <button
              onClick={() => runTool("vent_analysis")}
              disabled={toolBusy || !toolText.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: toolBusy ? "#f3f3f3" : "#fff",
                fontWeight: 900,
                cursor: toolBusy ? "not-allowed" : "pointer",
              }}
            >
              Break It Down
            </button>

            <button
              onClick={() => runTool("date_plan")}
              disabled={toolBusy || !toolText.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: toolBusy ? "#f3f3f3" : "#fff",
                fontWeight: 900,
                cursor: toolBusy ? "not-allowed" : "pointer",
              }}
            >
              Date Plan
            </button>

            <button
              onClick={() => runTool("spark")}
              disabled={toolBusy || !toolText.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: toolBusy ? "#f3f3f3" : "#fff",
                fontWeight: 900,
                cursor: toolBusy ? "not-allowed" : "pointer",
              }}
            >
              Spark
            </button>

            <button
              onClick={() => runTool("note")}
              disabled={toolBusy || !toolText.trim()}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: toolBusy ? "#f3f3f3" : "#fff",
                fontWeight: 900,
                cursor: toolBusy ? "not-allowed" : "pointer",
              }}
            >
              Note
            </button>
          </div>

          {toolBusy ? <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>Thinking…</div> : null}

          {toolJson ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Structured output</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
                {JSON.stringify(toolJson, null, 2)}
              </pre>
            </div>
          ) : null}

          {toolOut ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Output</div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{toolOut}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
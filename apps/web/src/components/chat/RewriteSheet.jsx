import { useEffect, useRef, useState } from "react";
import { keystoneRewrite } from "../../lib/keystoneClient";

const REWRITE_MODES = [
  { label: "De-escalate", value: "deescalate" },
  { label: "Soften", value: "soften" },
  { label: "Emotion -> Words", value: "emotion_to_words" },
  { label: "Boundary Set", value: "boundary_set" },
];

const FRIENDLY_ERROR = "We could not rewrite that right now. Please try again.";

function makeCacheKey(text, mode) {
  return JSON.stringify([text, mode]);
}

export default function RewriteSheet({ isOpen, draftText, onClose, onReplaceDraft }) {
  const requestIdRef = useRef(0);
  const [selectedMode, setSelectedMode] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [cacheByTextAndMode, setCacheByTextAndMode] = useState({});

  useEffect(() => {
    if (!isOpen) {
      requestIdRef.current += 1;
      setIsLoading(false);
      setErrorMessage("");
      setCopyMessage("");
      return;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !selectedMode) return;
    const cached = cacheByTextAndMode[makeCacheKey(draftText, selectedMode)];
    if (cached) {
      setPreviewText(cached);
      setErrorMessage("");
    } else {
      setPreviewText("");
      setErrorMessage("");
    }
  }, [cacheByTextAndMode, draftText, isOpen, selectedMode]);

  const onPickMode = async (mode) => {
    setSelectedMode(mode);
    setCopyMessage("");
    const cacheKey = makeCacheKey(draftText, mode);
    const cached = cacheByTextAndMode[cacheKey];
    if (cached) {
      setPreviewText(cached);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setPreviewText("");
    setErrorMessage("");

    try {
      const output = await keystoneRewrite(draftText, mode);
      if (requestIdRef.current !== requestId) return;
      setPreviewText(output);
      setCacheByTextAndMode((prev) => ({ ...prev, [cacheKey]: output }));
    } catch {
      if (requestIdRef.current !== requestId) return;
      setErrorMessage(FRIENDLY_ERROR);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  };

  const onCopy = async () => {
    if (!previewText || isLoading || errorMessage) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyMessage("Copied.");
    } catch {
      setCopyMessage("Copy failed. Please copy manually.");
    }
  };

  const canReplace = Boolean(previewText) && !isLoading && !errorMessage;

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rewrite draft"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: 16,
          border: "1px solid #ddd",
          background: "#fff",
          padding: 14,
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Rewrite</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Choose a mode to preview before replacing your draft.</div>
          </div>
          <button
            onClick={onClose}
            style={{
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {REWRITE_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onPickMode(mode.value)}
              style={{
                borderRadius: 999,
                padding: "8px 12px",
                border: selectedMode === mode.value ? "2px solid #7c3aed" : "1px solid #ddd",
                background: selectedMode === mode.value ? "#f3e8ff" : "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            minHeight: 110,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8, fontWeight: 800 }}>Preview</div>
          {isLoading ? (
            <div style={{ opacity: 0.8 }}>Rewriting...</div>
          ) : errorMessage ? (
            <div style={{ color: "#b91c1c" }}>{errorMessage}</div>
          ) : previewText ? (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{previewText}</div>
          ) : (
            <div style={{ opacity: 0.75 }}>Select a rewrite mode to generate a preview.</div>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => {
              if (!canReplace) return;
              onReplaceDraft(previewText);
              onClose();
            }}
            disabled={!canReplace}
            style={{
              borderRadius: 12,
              border: "1px solid #ddd",
              background: canReplace ? "#fff" : "#f3f3f3",
              padding: "10px 12px",
              fontWeight: 900,
              cursor: canReplace ? "pointer" : "not-allowed",
            }}
          >
            Replace draft
          </button>

          <button
            onClick={onCopy}
            disabled={!previewText || isLoading || Boolean(errorMessage)}
            style={{
              borderRadius: 12,
              border: "1px solid #ddd",
              background: previewText && !isLoading && !errorMessage ? "#fff" : "#f3f3f3",
              padding: "10px 12px",
              fontWeight: 900,
              cursor: previewText && !isLoading && !errorMessage ? "pointer" : "not-allowed",
            }}
          >
            Copy
          </button>

          {copyMessage ? <div style={{ fontSize: 12, opacity: 0.75 }}>{copyMessage}</div> : null}
        </div>
      </div>
    </div>
  );
}

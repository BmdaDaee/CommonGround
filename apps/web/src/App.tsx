import { useState } from "react";
import { keystoneRewrite } from "./lib/keystoneClient";

export default function App() {
  const [input, setInput] = useState("Um I was, like, kind of thinking we should talk???");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState("");

  async function run() {
    setErr("");
    try {
      const out = await keystoneRewrite(input, "clarify");
      setOutput(out);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h2>Keystone Smoke (UI)</h2>

      <label>Input</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", marginTop: 6 }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={run}>Clarify</button>
      </div>

      {err ? (
        <pre style={{ marginTop: 12, color: "crimson" }}>{err}</pre>
      ) : null}

      <label style={{ display: "block", marginTop: 12 }}>Output</label>
      <textarea value={output} readOnly rows={3} style={{ width: "100%", marginTop: 6 }} />
    </div>
  );
}

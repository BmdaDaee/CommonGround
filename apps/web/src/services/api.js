export async function chat({ userId, message }) {
  const r = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, message }),
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`HTTP ${r.status}: ${txt}`);
  }

  return r.json();
}
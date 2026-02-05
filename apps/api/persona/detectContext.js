// persona/detectContext.js

function detectContext(message) {
  const lower = message.toLowerCase();

  if (lower.includes("argue") || lower.includes("fight") || lower.includes("mad") || lower.includes("upset")) {
    return { mode: "conflict", topic: "emotional tension" };
  }

  if (lower.includes("closer") || lower.includes("distance") || lower.includes("disconnect")) {
    return { mode: "connection", topic: "emotional intimacy" };
  }

  if (lower.includes("money") || lower.includes("bills") || lower.includes("budget")) {
    return { mode: "logistics", topic: "finances" };
  }

  if (lower.includes("love") || lower.includes("feelings") || lower.includes("vulnerable")) {
    return { mode: "intimacy", topic: "feelings" };
  }

  return { mode: "general", topic: "unspecified" };
}

module.exports = detectContext;
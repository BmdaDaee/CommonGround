// testSession.js

const { createSessionDoc, addSessionMessage } = require("./models/session");

(async () => {
  const sess = createSessionDoc("sess_demo_001", {
    context: {
      type: "COUPLE",
      relationshipId: "rel_demo_001",
      startedBy: "user_123",
      participants: ["user_123", "user_456"],
    },
    focus: {
      topic: "CONFLICT",
      description: "We keep arguing about communication.",
      contentLevelCap: "SUGGESTIVE",
    },
  });

  addSessionMessage(sess, {
    senderType: "user",
    senderId: "user_123",
    role: "USER",
    text: "I feel like I'm never really heard.",
  });

  addSessionMessage(sess, {
    senderType: "partner",
    senderId: "user_456",
    role: "PARTNER",
    text: "I feel like whatever I say is wrong.",
  });

  addSessionMessage(sess, {
    senderType: "ai",
    role: "AI",
    senderType: "ai",
    text: "Let’s slow this down. I want each of you to say what you’re actually needing, not just what you’re mad about.",
  });

  console.dir(sess, { depth: null });
})();
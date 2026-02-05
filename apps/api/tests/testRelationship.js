// testRelationship.js

const { createRelationshipDoc } = require("./models/relationship");

(async () => {
  try {
    // Create a mock relationship between two users
    const relationship = createRelationshipDoc("rel_demo_001", {
      partners: {
        userA: "user_123",
        userB: "user_456",
        linkedAt: new Date().toISOString(),
        status: "ACTIVE",
      },
      permissions: {
        allowNSFWSharing: false, // both adults would have to enable this later
      },
      communication: {
        tonePreference: "balanced",
        conversationGoals: ["communicate better", "feel closer"],
      },
      intimacy: {
        comfortLevels: {
          physical: 3,
          emotional: 4,
          communication: 2,
        },
        sharedBoundaries: ["take breaks during conflict", "no yelling"],
        relationshipVision: "We want to build a healthier connection.",
      },
    });

    console.log("\nRELATIONSHIP DOCUMENT:\n");
    console.dir(relationship, { depth: null });
  } catch (err) {
    console.error("Error creating relationship document:", err);
  }
})();
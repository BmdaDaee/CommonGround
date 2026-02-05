const { admin } = require("./config/firebaseAdmin");
console.log("Firebase project ID:", admin.app().options.projectId);
// testFirebase.js

const { upsertUser, getUser, upsertRelationship, getRelationship } = require("./services/db");

(async () => {
  try {
    console.log("Writing user...");

    const user = await upsertUser("user_123", {
      profile: {
        displayName: "Daee",
        isAdult: true,
      },
      settings: {
        nsfwEnabled: false,
      },
    });

    console.log("User written:\n", user);

    const loadedUser = await getUser("user_123");
    console.log("\nLoaded user from Firestore:\n", loadedUser);

    console.log("\nWriting relationship...");

    const relationship = await upsertRelationship("rel_demo_001", {
      partners: {
        userA: "user_123",
        userB: "user_456",
        linkedAt: new Date().toISOString(),
        status: "ACTIVE",
      },
      communication: {
        tonePreference: "balanced",
        conversationGoals: ["communicate better", "feel closer"],
      },
    });

    console.log("\nRelationship written:\n", relationship);

    const loadedRel = await getRelationship("rel_demo_001");
    console.log("\nLoaded relationship from Firestore:\n", loadedRel);

    console.log("\n✅ Firebase test completed.");
  } catch (err) {
    console.error("\n❌ Firebase test failed:\n", err);
  }
})();
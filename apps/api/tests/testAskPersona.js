// testAskPersona.js

require("dotenv").config();
const { askPersona, MODES } = require("./services/ai");

(async () => {
  try {
    const userProfile = {
      displayName: "Daee",
      insights: {
        summary:
          "Tends to shut down in conflict, overthinks before speaking, and worries about being 'too much' when expressing needs.",
        emotionalPatterns: {
          repeatsConflict: true,
          shutsDownInFights: true,
          overExplains: true,
        },
      },
    };

    const relationshipProfile = {
      partners: {
        userA: "Daee",
        userB: "Partner",
      },
      insights: {
        summary:
          "Frequent miscommunication about needs; user feels unheard and is afraid of escalation when they speak up.",
        emotionalPatterns: {
          repeatsConflict: true,
        },
      },
    };

    const userMessage =
      "I'm scared to bring this up again because every time we argue I shut down and then I feel like I'm the one causing problems by even saying anything.";

    const mode = MODES.CONFLICT;

    console.log("Running Hyper-Responsive Bently test...");
    console.log("Mode:", mode);
    console.log("User message:", userMessage);

    const reply = await askPersona(userMessage, {
      mode,
      userProfile,
      relationshipProfile,
    });

    console.log("\nAI REPLY:\n");
    console.log(reply);
  } catch (err) {
    console.error("\n❌ Test failed:\n", err);
  }
})();
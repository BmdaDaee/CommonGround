// testHeat6.js
// Stress-test for Heat Level 6 BentlyAI in CONFLICT mode

require("dotenv").config();
const { askPersona, MODES } = require("./services/ai");

(async () => {
  try {
    const userProfile = {
      displayName: "Daee",
      insights: {
        summary:
          "Frequently questions their own reality in conflict, tends to over-apologize, and has a history of being blamed for other people's reactions.",
        emotionalPatterns: {
          repeatsConflict: true,
          shutsDownInFights: true,
          overApologizes: true,
          overExplains: true,
          peoplePleaser: true,
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
          "Long-term pattern of arguments where Daee is blamed, partner flips situations, and Daee ends up apologizing even when hurt.",
        emotionalPatterns: {
          repeatsConflict: true,
          blamesUser: true,
          gaslightingSuspected: true,
        },
      },
    };

    const userMessage = `
Every time we argue, it somehow becomes my fault.

He'll say something hurtful or raise his voice, and when I finally react or try to explain how I feel, he flips it and tells me I'm being dramatic or starting problems.

If I shut down, he says I'm childish and ruining the relationship. If I speak up, he says I'm attacking him or twisting things.

Last night he told me I make everything worse and that I'm the reason he yells. I ended up apologizing even though I was the one crying.

Now I'm sitting here wondering if I'm actually the problem, or if I'm losing my mind. Maybe it really is all my fault.
    `.trim();

    const mode = MODES.CONFLICT;

    console.log("🔥 Running Heat 6 Stress Test for BentlyAI...");
    console.log("Mode:", mode);
    console.log("User message:\n", userMessage, "\n");

    const reply = await askPersona(userMessage, {
      mode,
      userProfile,
      relationshipProfile,
    });

    console.log("\nAI REPLY (Heat Test):\n");
    console.log(reply);
  } catch (err) {
    console.error("\n❌ Heat 6 test failed:\n", err);
  }
})();
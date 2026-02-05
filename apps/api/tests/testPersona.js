// testPersona.js

const { routeAIRequest } = require("./services/router");
const { CONTENT_LEVELS } = require("./config/contentLevels");

(async () => {
  try {
    // Mock user profile
    const user = {
      id: "demo-user-1",
      isAdult: true,
      nsfwEnabled: false, // change later if you want to test EXPLICIT branch
    };

    const reply = await routeAIRequest({
      user,
      contentLevel: CONTENT_LEVELS.SAFE, // Try SUGGESTIVE too
      intentType: "INTIMACY",
      message: "I'm scared to tell my partner I want more intimacy. What should I do?",
    });

    console.log("\nAI REPLY:\n");
    console.log(reply);
  } catch (err) {
    console.error("Error talking to persona:", err);
  }
})();
const { askPersona } = require("./services/ai");

(async () => {
  try {
    const reply = await askPersona(
      "I'm scared to tell my partner I want more intimacy but I don't know how to bring it up. What should I do?"
    );
    console.log("AI REPLY:\n");
    console.log(reply);
  } catch (err) {
    console.error("Error talking to persona:", err);
  }
})();
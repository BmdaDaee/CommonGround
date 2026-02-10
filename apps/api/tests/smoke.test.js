const test = require("node:test");
const assert = require("node:assert/strict");

const { createUserDoc } = require("../models/user");

test("createUserDoc applies overrides and preserves defaults", () => {
  const user = createUserDoc("user_smoke", {
    profile: { displayName: "Smoke User", isAdult: true },
  });

  assert.equal(user.id, "user_smoke");
  assert.equal(user.profile.displayName, "Smoke User");
  assert.equal(user.profile.isAdult, true);
  assert.equal(user.settings.contentLevelPreference, "SAFE");
});

// backend/repositories/sessionRepository.js
const { getSessionStore } = require("../config/runtime");

const store = getSessionStore();

if (store === "firebase") {
  module.exports = require("./sessionRepository.firebase");
} else {
  module.exports = require("./sessionRepository.memory");
}

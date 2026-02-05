// backend/repositories/sessionRepository.js
const store = (process.env.SESSION_STORE || "memory").toLowerCase();

if (store === "firebase") {
  module.exports = require("./sessionRepository.firebase");
} else {
  module.exports = require("./sessionRepository.memory");
}
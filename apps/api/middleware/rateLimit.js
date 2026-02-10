const rateLimit = require("express-rate-limit");

const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

module.exports = { apiRateLimit, chatRateLimit };
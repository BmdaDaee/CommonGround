const express = require("express");
const router = express.Router();

const pairs = require("./pairs");
const profile = require("./profile");
const chat = require("./chat");
const session = require("./session");
const pulse = require("./pulse");
const rituals = require("./rituals");

router.use("/pairs", pairs);
router.use("/profile", profile);
router.use("/chat", chat);
router.use("/session", session);
router.use("/pulse", pulse);
router.use("/rituals", rituals);

module.exports = router;

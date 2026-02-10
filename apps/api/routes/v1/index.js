// routes/v1/index.js

const express = require("express");

const auth = require("./session");
const pair = require("./pair");
const pairs = require("./pairs");
const profile = require("./profile");
const chat = require("./chat");

const router = express.Router();

router.use("/auth", auth);
router.use("/pair", pair);
router.use("/pairs", pairs);
router.use("/profile", profile);
router.use("/chat", chat);

module.exports = router;

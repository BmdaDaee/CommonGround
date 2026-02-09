const express = require("express");
const router = express.Router();

let keystoneModPromise;

async function getKeystone() {
  if (!keystoneModPromise) {
    keystoneModPromise = import("@anarchyxmayhem/keystone-core");
  }
  return keystoneModPromise;
}

router.post("/rewrite", async (req, res) => {
  try {
    const { text, mode, ctx } = req.body || {};
    const input = String(text ?? "");

    const keystone = await getKeystone();

    const enableOnline = process.env.KEYSTONE_ENABLE_ONLINE === "true";
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const output = enableOnline
      ? await keystone.rewrite(input, mode, ctx, {
          enableOnline: true,
          openai: { apiKey, model },
        })
      : await keystone.rewrite(input, mode, ctx);

    res.json({ ok: true, output });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? String(err) });
  }
});

module.exports = router;

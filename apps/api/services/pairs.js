const { isSupabaseLocked } = require("../config/backend");

module.exports = isSupabaseLocked()
  ? require("./pairs.supabase")
  : require("./pairs.firebase");

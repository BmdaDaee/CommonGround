const { isSupabaseLocked } = require("../config/backend");

module.exports = isSupabaseLocked()
  ? require("./profile.supabase")
  : require("./profile.firebase");

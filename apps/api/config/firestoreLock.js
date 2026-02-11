const { isSupabaseLocked } = require("./backend");

function buildFirestoreLockError(op = "firestore") {
  const err = new Error(`[firestore-lock] ${op} is disabled while DEV_BACKEND_LOCK=supabase`);
  err.code = "firestore-lock";
  err.status = 500;
  return err;
}

function assertFirestoreAvailable(op = "firestore") {
  if (isSupabaseLocked()) {
    throw buildFirestoreLockError(op);
  }
}

module.exports = {
  assertFirestoreAvailable,
  buildFirestoreLockError,
};

const { getFirestore } = require("firebase-admin/firestore");
const { app } = require("./firebaseAdmin");

let db = null;

function getFirestoreDb() {
  const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";
  const lock = typeof process.env.DEV_BACKEND_LOCK === "string"
    ? process.env.DEV_BACKEND_LOCK.trim().toLowerCase()
    : "";

  if (!isProduction && lock === "supabase") {
    throw new Error("[firestore-lock] DEV_BACKEND_LOCK=supabase blocks Firestore access in development.");
  }

  if (db) return db;

  db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || "(default)");
  return db;
}

module.exports = {
  getFirestoreDb,
};

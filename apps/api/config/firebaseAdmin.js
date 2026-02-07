// config/firebaseAdmin.js

const admin = require("firebase-admin");
const path = require("path");
const { getFirestore } = require("firebase-admin/firestore");

let app;

if (!admin.apps.length) {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, "..", "secrets", "firebase-admin-key.json");

  const serviceAccount = require(serviceAccountPath);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

// IMPORTANT: connect specifically to the named Firestore database "commonground-dev"
const db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || "(default)");

module.exports = {
  admin,
  db,
};

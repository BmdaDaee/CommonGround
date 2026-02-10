// config/firebaseAdmin.js

const admin = require("firebase-admin");
const path = require("path");

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

module.exports = {
  admin,
  app,
};

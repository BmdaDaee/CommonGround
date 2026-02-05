// config/firebaseAdmin.js

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

/**
 * Safe Firebase Admin init.
 *
 * Supported credential modes (in priority order):
 *  1) Explicit env vars (recommended for local dev + most deployments)
 *     - FIREBASE_PROJECT_ID
 *     - FIREBASE_CLIENT_EMAIL
 *     - FIREBASE_PRIVATE_KEY   (use literal \n in .env; we convert to newlines)
 *  2) Application Default Credentials (ADC)
 *     - GOOGLE_APPLICATION_CREDENTIALS, workload identity, etc.
 */
let app;
if (!admin.apps.length) {
  const hasEnvCreds =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;

  if (hasEnvCreds) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Falls back to ADC. This is the right choice on many hosted platforms.
    app = admin.initializeApp();
  }
} else {
  app = admin.app();
}

// Optional named Firestore database (usually you want the default one).
// If you do use a non-default database, set FIREBASE_FIRESTORE_DB.
const databaseId = process.env.FIREBASE_FIRESTORE_DB || "(default)";
const db = getFirestore(app, databaseId);

module.exports = {
  admin,
  db,
};

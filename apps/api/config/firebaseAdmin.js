// config/firebaseAdmin.js
const { isSupabaseLocked } = require("./backend");
const { buildFirestoreLockError } = require("./firestoreLock");

if (isSupabaseLocked()) {
  const throwLocked = (op) => {
    throw buildFirestoreLockError(op);
  };

  const lockedDb = {
    collection() {
      return throwLocked("firestore.collection");
    },
    runTransaction() {
      return throwLocked("firestore.runTransaction");
    },
  };

  const lockedAdmin = {
    auth() {
      return throwLocked("firebase.auth");
    },
  };

  module.exports = {
    admin: lockedAdmin,
    db: lockedDb,
  };
} else {
  const admin = require("firebase-admin");
  const { getFirestore } = require("firebase-admin/firestore");

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
      app = admin.initializeApp();
    }
  } else {
    app = admin.app();
  }

  const databaseId = process.env.FIREBASE_FIRESTORE_DB || "(default)";
  const db = getFirestore(app, databaseId);

  module.exports = {
    admin,
    db,
  };
}

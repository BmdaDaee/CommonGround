const test = require("node:test");
const assert = require("node:assert/strict");

function withEnv(overrides, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DEV_BACKEND_LOCK: process.env.DEV_BACKEND_LOCK,
  };

  Object.assign(process.env, overrides);

  try {
    return fn();
  } finally {
    if (previous.NODE_ENV === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.NODE_ENV;

    if (previous.DEV_BACKEND_LOCK === undefined) delete process.env.DEV_BACKEND_LOCK;
    else process.env.DEV_BACKEND_LOCK = previous.DEV_BACKEND_LOCK;
  }
}

function loadFirestoreModuleWithMockedAdmin() {
  const firestorePath = require.resolve("../config/firestore");
  const firebaseAdminPath = require.resolve("../config/firebaseAdmin");

  const previousFirestore = require.cache[firestorePath];
  const previousFirebaseAdmin = require.cache[firebaseAdminPath];

  const mockedFirebaseAdmin = {
    id: firebaseAdminPath,
    filename: firebaseAdminPath,
    loaded: true,
    exports: {
      app: { name: "mocked-app" },
    },
  };

  try {
    delete require.cache[firestorePath];
    require.cache[firebaseAdminPath] = mockedFirebaseAdmin;
    return require(firestorePath);
  } finally {
    if (previousFirestore) require.cache[firestorePath] = previousFirestore;
    else delete require.cache[firestorePath];

    if (previousFirebaseAdmin) require.cache[firebaseAdminPath] = previousFirebaseAdmin;
    else delete require.cache[firebaseAdminPath];
  }
}

test("getFirestoreDb throws firestore-lock when DEV_BACKEND_LOCK=supabase in development", () => {
  const { getFirestoreDb } = loadFirestoreModuleWithMockedAdmin();

  withEnv({ NODE_ENV: "development", DEV_BACKEND_LOCK: "supabase" }, () => {
    assert.throws(() => getFirestoreDb(), /\[firestore-lock\]/);
  });
});

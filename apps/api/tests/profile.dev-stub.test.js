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

function loadProfileRouter(options = {}) {
  const profilePath = require.resolve("../routes/v1/profile");
  const requireAuthPath = require.resolve("../middleware/requireAuth");
  const firestorePath = require.resolve("../config/firestore");

  const previousProfile = require.cache[profilePath];
  const previousRequireAuth = require.cache[requireAuthPath];
  const previousFirestore = require.cache[firestorePath];

  const mockedRequireAuth = {
    id: requireAuthPath,
    filename: requireAuthPath,
    loaded: true,
    exports: {
      requireAuth: (_req, _res, next) => next(),
    },
  };

  const mockedFirestore = {
    id: firestorePath,
    filename: firestorePath,
    loaded: true,
    exports: {
      getFirestoreDb:
        options.getFirestoreDb ||
        (() => {
          throw new Error("firestore_called_unexpectedly");
        }),
    },
  };

  try {
    delete require.cache[profilePath];
    require.cache[requireAuthPath] = mockedRequireAuth;
    require.cache[firestorePath] = mockedFirestore;
    return require(profilePath);
  } finally {
    if (previousProfile) require.cache[profilePath] = previousProfile;
    else delete require.cache[profilePath];

    if (previousRequireAuth) require.cache[requireAuthPath] = previousRequireAuth;
    else delete require.cache[requireAuthPath];

    if (previousFirestore) require.cache[firestorePath] = previousFirestore;
    else delete require.cache[firestorePath];
  }
}

function getRouteHandler(router, method) {
  for (const layer of router.stack) {
    if (!layer.route || layer.route.path !== "/") continue;
    if (!layer.route.methods[method]) continue;
    return layer.route.stack[0].handle;
  }
  throw new Error(`handler_not_found:${method}`);
}

function createMockResponse() {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

test("buildDeterministicDevProfile is stable for the same uid", () => {
  const router = loadProfileRouter();
  const { buildDeterministicDevProfile } = router._test;

  const a = buildDeterministicDevProfile("uid_123");
  const b = buildDeterministicDevProfile("uid_123");

  assert.deepEqual(a, b);
  assert.equal(a.uid, "uid_123");
  assert.match(a.displayName, /^Dev User [A-F0-9]{6}$/);
  assert.match(a.photoURL, /^https:\/\/example\.com\/dev-avatar\/[a-f0-9]{16}\.png$/);
});

test("GET /v1/profile returns deterministic dev stub and skips Firestore when locked", async () => {
  let firestoreCalls = 0;
  const router = loadProfileRouter({
    getFirestoreDb: () => {
      firestoreCalls += 1;
      throw new Error("firestore_should_not_be_called");
    },
  });

  const handler = getRouteHandler(router, "get");

  await withEnv({ NODE_ENV: "development", DEV_BACKEND_LOCK: "supabase" }, async () => {
    const req = { auth: { uid: "dev_uid" } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(firestoreCalls, 0);
    assert.deepEqual(res.body, {
      profile: router._test.buildDeterministicDevProfile("dev_uid"),
    });
  });
});

test("PUT /v1/profile merges allowed string overrides in dev stub mode", async () => {
  let firestoreCalls = 0;
  const router = loadProfileRouter({
    getFirestoreDb: () => {
      firestoreCalls += 1;
      throw new Error("firestore_should_not_be_called");
    },
  });

  const handler = getRouteHandler(router, "put");

  await withEnv({ NODE_ENV: "development", DEV_BACKEND_LOCK: "supabase" }, async () => {
    const req = {
      auth: { uid: "dev_uid" },
      body: {
        displayName: "Dev Display",
        photoURL: "https://cdn.example.com/dev.png",
      },
    };

    const res = createMockResponse();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(firestoreCalls, 0);
    assert.deepEqual(res.body, {
      profile: {
        ...router._test.buildDeterministicDevProfile("dev_uid"),
        displayName: "Dev Display",
        photoURL: "https://cdn.example.com/dev.png",
      },
    });
  });
});

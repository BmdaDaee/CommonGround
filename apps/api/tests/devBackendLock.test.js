const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const baseEnv = {
  ...process.env,
  DEV_BACKEND_LOCK: "supabase",
  OPENAI_API_KEY: "test-key",
  PORT: "3311",
};

function startServer() {
  const cwd = path.resolve(__dirname, "..");
  const proc = spawn("node", ["server.js"], { cwd, env: baseEnv, stdio: ["ignore", "pipe", "pipe"] });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server_start_timeout")), 8000);
    proc.stdout.on("data", (buf) => {
      if (String(buf).includes("[API] listening")) {
        clearTimeout(timer);
        resolve(proc);
      }
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code !== null && code !== 0) reject(new Error(`server_exited_${code}`));
    });
  });
}

async function jsonRequest(url, { method = "GET", uid = "u1", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-dev-uid": uid,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function jsonRequestBearer(url, { method = "GET", uid = "u1", body } = {}) {
  const payload = Buffer.from(JSON.stringify({ sub: uid }), "utf8").toString("base64url");
  const fakeJwt = `x.${payload}.y`;

  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${fakeJwt}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  return { status: res.status, json };
}

test("DEV_BACKEND_LOCK=supabase blocks firestore with deterministic error", async () => {
  process.env.DEV_BACKEND_LOCK = "supabase";
  const { upsertUser } = require("../services/db");
  await assert.rejects(() => upsertUser("lock-test"), /\[firestore-lock\]/);
});

test("supabase lock mode preserves envelopes for pair/profile/chat flow", async (t) => {
  const proc = await startServer();
  t.after(() => proc.kill("SIGTERM"));

  const authSession = await jsonRequest("http://127.0.0.1:3311/v1/auth/session", { method: "POST", uid: "alice" });
  assert.equal(authSession.status, 200);
  assert.equal(authSession.json.uid, "alice");
  assert.ok(authSession.json.user);

  const created = await jsonRequest("http://127.0.0.1:3311/v1/pairs", { method: "POST", uid: "alice" });
  assert.equal(created.status, 200);
  assert.ok(created.json.pairId);
  assert.ok(created.json.code);

  const joined = await jsonRequest("http://127.0.0.1:3311/v1/pairs/join", {
    method: "POST",
    uid: "bob",
    body: { code: created.json.code },
  });
  assert.equal(joined.status, 200);
  assert.equal(joined.json.pairId, created.json.pairId);

  const sent = await jsonRequest(`http://127.0.0.1:3311/v1/chat/${created.json.pairId}/send`, {
    method: "POST",
    uid: "alice",
    body: { messageId: "m1", clientId: "web", text: "hello" },
  });
  assert.equal(sent.status, 200);
  assert.equal(sent.json.message.id, "m1");
  assert.equal(sent.json.message.text, "hello");

  const listed = await jsonRequest(`http://127.0.0.1:3311/v1/chat/${created.json.pairId}/list`, { uid: "bob" });
  assert.equal(listed.status, 200);
  assert.ok(Array.isArray(listed.json.messages));
  assert.equal(listed.json.messages[0].id, "m1");
  assert.ok(Object.hasOwn(listed.json, "nextBefore"));

  const profile = await jsonRequest("http://127.0.0.1:3311/v1/profile", { uid: "alice" });
  assert.equal(profile.status, 200);
  assert.ok(profile.json.profile);

  const updated = await jsonRequest("http://127.0.0.1:3311/v1/profile", {
    method: "PUT",
    uid: "alice",
    body: { displayName: "Alice" },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.profile.displayName, "Alice");
});

test("supabase lock mode accepts bearer token for uid extraction", async (t) => {
  const proc = await startServer();
  t.after(() => proc.kill("SIGTERM"));

  const session = await jsonRequestBearer("http://127.0.0.1:3311/v1/auth/session", {
    method: "POST",
    uid: "token-user",
  });

  assert.equal(session.status, 200);
  assert.equal(session.json.uid, "token-user");
});

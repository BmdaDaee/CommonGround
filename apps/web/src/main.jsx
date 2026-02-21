import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { useEffect, useState } from "react";
import {
  signInWithPassword,
  signOut,
  getUser,
  isAdminEmail,
} from "./services/adminAuth";

function AdminGate({ children }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await getUser();

        if (u?.email && !isAdminEmail(u.email)) {
          await signOut();
          setUser(null);
          setError("not_authorized_admin");
          setLoading(false);
          return;
        }

        setUser(u);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithPassword(email, password);
      const u = await getUser();

      if (u?.email && !isAdminEmail(u.email)) {
        await signOut();
        setUser(null);
        setError("not_authorized_admin");
        return;
      }

      setUser(u);
    } catch (e) {
      setError(e?.message || "login_failed");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  if (!user) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Admin Login</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button onClick={handleLogin}>Sign In</button>
        {error ? <div style={{ color: "crimson", fontSize: 12 }}>{error}</div> : null}
        {error === "not_authorized_admin" ? (
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            This account isn’t allowed for admin access.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Logged in as {user.email}</div>
        <button onClick={async () => { await signOut(); setUser(null); }}>Sign Out</button>
      </div>
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminGate>
      <App />
    </AdminGate>
  </React.StrictMode>
);

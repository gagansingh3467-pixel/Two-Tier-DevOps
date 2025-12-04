// frontend/src/Auth.js
import React, { useState } from "react";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e) {
    e.preventDefault();

    const url = `/api/${mode}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({ detail: "Auth failed" }));
      alert(j.detail || "Auth failed");
      return;
    }

    if (mode === "register") {
      alert("Registered! Now log in.");
      setMode("login");
      return;
    }

    // LOGIN SUCCESS
    const j = await res.json();
    localStorage.setItem("token", j.access_token);
    localStorage.setItem("username", username);

    // Refresh so App.js picks up token
    window.location.reload();
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <h4>{mode === "login" ? "Login" : "Register"}</h4>
      <form onSubmit={submit}>
        <input
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: 8, marginBottom: 8, width: "100%" }}
        />

        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 8, marginBottom: 8, width: "100%" }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: 8 }}>
            {mode === "login" ? "Login" : "Register"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ padding: 8 }}
          >
            {mode === "login" ? "Switch to register" : "Switch to login"}
          </button>
        </div>
      </form>
    </div>
  );
}

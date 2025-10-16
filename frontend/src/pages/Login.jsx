import React, { useState } from "react";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const isLogin = mode === "login";

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    alert(`${mode.toUpperCase()} (demo)\n` + JSON.stringify(Object.fromEntries(form), null, 2));
  }

  return (
    <div>
      <h1 className="h1">Login/Register Page</h1>
      <p className="p-muted">Welcome to PeerPrep</p>

      <div className="card">
        <div className="segmented" style={{ marginBottom: 16 }}>
          <button
            className={isLogin ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={!isLogin ? "is-active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form className="list" style={{ gap: 14 }} onSubmit={onSubmit}>
          {!isLogin && (
            <div>
              <label className="label">Full Name</label>
              <input className="input" name="fullName" placeholder="Alex Chen" required />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" placeholder="alex@example.com" required />
          </div>

          {!isLogin && (
            <div>
              <label className="label">Experience Level</label>
              <select className="select" name="experience" defaultValue="Intermediate">
                <option>Beginner (0–1 year)</option>
                <option>Junior (1–2 years)</option>
                <option>Intermediate (2–4 years)</option>
                <option>Senior (5+ years)</option>
              </select>
            </div>
          )}

          <div>
            <label className="label">Password</label>
            <input className="input" name="password" type="password" required />
          </div>

          {!isLogin && (
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" name="confirmPassword" type="password" required />
            </div>
          )}

          <button className="btn btn--dark" type="submit" style={{ width: "100%", marginTop: 6 }}>
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

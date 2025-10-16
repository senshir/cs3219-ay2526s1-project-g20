import React, { useState } from "react";

export default function LoginModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const isLogin = mode === "login";

  function handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    // Demo auth: accept anything. Hook your real API here.
    const user = {
      name: data.fullName || "John Doe",
      email: data.email,
      level: data.experience || "Intermediate (2–4 years)"
    };
    onLogin?.(user);
    onClose?.();
  }

  return (
    <form className="list" style={{ gap: 14, minWidth: 300 }} onSubmit={handleSubmit}>
      <div className="segmented" style={{ marginBottom: 8 }}>
        <button type="button" className={isLogin ? "is-active" : ""} onClick={() => setMode("login")}>Login</button>
        <button type="button" className={!isLogin ? "is-active" : ""} onClick={() => setMode("signup")}>Sign Up</button>
      </div>

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
          <select className="select" name="experience" defaultValue="Intermediate (2–4 years)">
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

      <button className="btn btn--dark" type="submit" style={{ width: "100%", marginTop: 4 }}>
        {isLogin ? "Login" : "Create Account"}
      </button>
    </form>
  );
}

import React from "react";
import { Link } from "react-router-dom";

export default function ProfileModal({ user, onLogout, onClose }) {
  const initials = (user?.name || "JD")
    .split(" ")
    .map(s => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ minWidth: 360 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div className="avatar-lg">
          {initials}
          <span className="dot" />
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{user?.name || "John Doe"}</div>
          <div className="kicker">{user?.email || "john.doe@example.com"}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div className="p-muted" style={{ marginBottom: 8 }}>Quick Stats</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div className="stat"><div className="v">23</div><div className="l">Sessions</div></div>
          <div className="stat"><div className="v">45</div><div className="l">Solved</div></div>
          <div className="stat"><div className="v">7</div><div className="l">Streak</div></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {/* SPA navigation + close the modal */}
        <Link className="btn" to="/profile" onClick={onClose}>Full Profile</Link>
        <button className="btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import "../css/EditProfileModal.css";

export default function EditProfileModal({ user, onClose, onSave }) {
  const [username, setUsername] = useState(user.username || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Update username if changed
      if (username !== user.username) {
        const res = await fetch("http://localhost:8000/username", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`, // assuming token stored in user
          },
          body: JSON.stringify({ new_username: username }),
        });
        if (!res.ok) throw new Error("Failed to update username");
      }

      // Update password if provided
      if (password) {
        if (password !== confirm) throw new Error("Passwords do not match");
        const res = await fetch("http://localhost:8000/password", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({ new_password: password }),
        });
        if (!res.ok) throw new Error("Failed to update password");
      }

      setMessage("✅ Profile updated successfully!");
      onSave({ ...user, username });
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
        </div>

        {message && <p className="message">{message}</p>}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

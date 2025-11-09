import React, { useState } from "react";
import "../css/EditProfileModal.css";
import { updatePassword, updateUsername } from "../api/userService";
import Modal from "./ProfilePopUpModal.jsx";

export default function EditProfileModal({ user, onClose }) {
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
        await updateUsername(username);
      }

      // Update password if provided
      if (password) {
        if (password !== confirm) throw new Error("Passwords do not match");
        updatePassword(user.password, password);
      }

      setMessage("✅ Profile updated successfully!");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose} width={480}>
      <div className="space-y-4">
        {/* Username field */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Password fields */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Message */}
        {message && (
          <p
            className={`text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

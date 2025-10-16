import { Link, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Problems from "./pages/Problems.jsx";
import Interviews from "./pages/Interviews.jsx";
import Modal from "./components/Modal.jsx";
import LoginModal from "./pages/Login.jsx";
import ProfileModal from "./pages/Profile.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import React, { useMemo, useState, useEffect } from "react";

function Nav({ user, onAvatar }) {
  const { pathname } = useLocation();
  const pill = (to, label) => (
    <Link to={to} className={"pill " + (pathname === to ? "pill--active" : "pill--inactive")}>
      {label}
    </Link>
  );

  const initials = (user?.name || "JD").split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();
  const avatarClass = user ? "avatar-btn avatar-btn--grad" : "avatar-btn";

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">PeerPrep</div>
        <nav className="nav">
          {pill("/", "Dashboard")}
          {pill("/problems", "Problems")}
          {pill("/interviews", "Interviews")}
        </nav>
        <button className={avatarClass} onClick={onAvatar} title={user ? "Profile" : "Login"}>
          {initials}
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(null);   // null = not logged in
  useEffect(() => {
    const saved = localStorage.getItem("pp_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);
  useEffect(() => {
    if (user) localStorage.setItem("pp_user", JSON.stringify(user));
    else localStorage.removeItem("pp_user");
  }, [user]);
  const [sheet, setSheet] = useState(null); // 'login' | 'profile' | null

  const handleAvatarClick = () => setSheet(user ? "profile" : "login");
  const closeSheet = () => setSheet(null);
  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { setUser(null); setSheet(null); };

  return (
    <div className="page">
      <Nav user={user} onAvatar={handleAvatarClick} />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
        </Routes>
      </main>

      {sheet === "login" && (
        <Modal title="Welcome to PeerPrep" onClose={closeSheet}>
          <LoginModal onClose={closeSheet} onLogin={handleLogin} />
        </Modal>
      )}

      {sheet === "profile" && (
        <Modal title="Your Profile" onClose={closeSheet} width={640}>
          <ProfileModal user={user} onLogout={handleLogout} onClose={closeSheet} />
        </Modal>
      )}
    </div>
  );
}

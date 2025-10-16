import React from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Problems from "./pages/Problems.jsx";
import Interviews from "./pages/Interviews.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";

function Nav() {
  const { pathname } = useLocation();
  const pill = (to, label) => (
    <Link
      to={to}
      className={
        "pill " + (pathname === to ? "pill--active" : "pill--inactive")
      }
    >
      {label}
    </Link>
  );
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">PeerPrep</div>
        <nav className="nav">
          {pill("/", "Dashboard")}
          {pill("/problems", "Problems")}
          {pill("/interviews", "Interviews")}
          {pill("/login", "Login")}
          {pill("/profile", "Profile")}
        </nav>
        <div className="avatar">JD</div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="page">
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

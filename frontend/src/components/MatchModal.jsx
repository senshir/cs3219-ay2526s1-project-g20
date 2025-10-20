import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api"; // ← from the helper we set up earlier

export default function MatchModal({ onClose, onMatched }) {
  const [topic, setTopic] = useState("DP");
  const [difficulty, setDifficulty] = useState("Medium");
  const [phase, setPhase] = useState("idle"); // idle | queue | matched | error
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function startMatching() {
    setPhase("queue");
    setMsg("Looking for a partner…");
    try {
      // Adjust path to whatever your match service exposes
      const res = await api.post("match", "/match/find", {
        json: { topic, difficulty },
        token: localStorage.getItem("pp_token") || undefined
      });

      if (res?.partnerName || res?.roomId) {
        setPhase("matched");
        setMsg(`Matched with ${res.partnerName || "a partner"}!`);
        onMatched?.(res);
        return;
      }
      if (res?.ticket) {
        setTicket(res.ticket);
        startPolling(res.ticket);
      } else {
        setPhase("error");
        setMsg("Matching response not understood. Check backend path/format.");
      }
    } catch (e) {
      setPhase("error");
      setMsg("Match failed: " + e.message);
    }
  }

  function startPolling(t) {
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 2000;
      try {
        const status = await api.get("match", `/match/status?ticket=${encodeURIComponent(t)}`);
        if (status?.partnerName || status?.roomId) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setPhase("matched");
          setMsg(`Matched with ${status.partnerName || "a partner"}!`);
          onMatched?.(status);
        } else {
          setMsg("Still looking…");
        }
      } catch (e) {
        setPhase("error");
        setMsg("Polling error: " + e.message);
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (elapsed >= 60000 && pollRef.current) { // 60s timeout
        clearInterval(pollRef.current);
        pollRef.current = null;
        setPhase("idle");
        setMsg("No match found yet. Try again or widen preferences.");
      }
    }, 2000);
  }

  async function cancelQueue() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (ticket) {
      try {
        await api.post("match", "/match/cancel", { json: { ticket } });
      } catch { /* best-effort cancel */ }
    }
    setPhase("idle");
    setMsg("");
  }

  return (
    <div style={{ minWidth: 340 }}>
      <div className="list" style={{ gap: 12 }}>
        <div>
          <label className="label">Topic</label>
          <select className="select" value={topic} onChange={e=>setTopic(e.target.value)}>
            <option>DP</option>
            <option>Arrays</option>
            <option>Strings</option>
            <option>Graphs</option>
            <option>Trees</option>
          </select>
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select className="select" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {msg && (
          <div className="p-muted" style={{ display:"flex", alignItems:"center", gap:8 }}>
            {phase === "queue" && <span className="spin" aria-hidden />}
            <span>{msg}</span>
          </div>
        )}

        <div className="row" style={{ gap: 8, marginTop: 6 }}>
          {phase !== "queue" && (
            <button className="btn btn--dark" onClick={startMatching}>⚡ Start Matching</button>
          )}
          {phase === "queue" && (
            <button className="btn" onClick={cancelQueue}>Cancel</button>
          )}
          <button className="btn" onClick={onClose} style={{ marginLeft: "auto" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

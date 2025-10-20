import React, { useState } from "react";

export default function Matching() {
  const [topic, setTopic] = useState("DP");
  const [difficulty, setDifficulty] = useState("Medium");
  const [mode, setMode] = useState("pair"); // 'pair' | 'solo'
  const [msg, setMsg] = useState("");

  async function onStart(e) {
    e.preventDefault();
    // UI-only for now. Replace with your service call later.
    // Example (when backend is ready):
    // const res = await fetch(`${import.meta.env.VITE_MATCH_URL}/match/find`, { method: 'POST', body: JSON.stringify({ topic, difficulty, mode }) });
    setMsg(`Searching for ${mode === "pair" ? "a partner" : "a session"} in ${topic} (${difficulty})…`);
    setTimeout(() => setMsg("Demo: matched! (wire this to your backend)"), 1000);
  }

  return (
    <div>
      <h1 className="h1">Start Matching</h1>
      <p className="p-muted">Choose your preferences and begin pairing.</p>

      <div className="card" style={{ maxWidth: 680 }}>
        <form className="list" style={{ gap: 14 }} onSubmit={onStart}>
          <div>
            <label className="label">Mode</label>
            <div className="segmented">
              <button type="button" className={mode === "pair" ? "is-active" : ""} onClick={() => setMode("pair")}>
                Pair Match
              </button>
              <button type="button" className={mode === "solo" ? "is-active" : ""} onClick={() => setMode("solo")}>
                Solo Practice
              </button>
            </div>
          </div>

          <div>
            <label className="label">Topic</label>
            <select className="select" value={topic} onChange={e => setTopic(e.target.value)}>
              <option>DP</option>
              <option>Arrays</option>
              <option>Strings</option>
              <option>Graphs</option>
              <option>Trees</option>
            </select>
          </div>

          <div>
            <label className="label">Difficulty</label>
            <select className="select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          {msg && <div className="p-muted">{msg}</div>}

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn--dark btn--xl" type="submit">⚡ Start Matching</button>
            <button className="btn" type="button" onClick={() => { setMsg(""); }}>Clear</button>
          </div>
        </form>
      </div>
    </div>
  );
}

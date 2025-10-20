import React, { useMemo, useState } from "react";

const DATA = [
  { id: 1, title: "Two Sum", topic: "Arrays", diff: "Easy", status: "Solved", blurb: "Find two numbers that add to target." },
  { id: 2, title: "Binary Tree Level Order", topic: "Graphs", diff: "Medium", status: "Practice", blurb: "BFS traversal of a tree." },
  { id: 3, title: "Longest Palindrome Substring", topic: "Strings", diff: "Medium", status: "Practice", blurb: "Center expansion or DP." },
  { id: 4, title: "Edit Distance", topic: "DP", diff: "Hard", status: "Not Solved", blurb: "Classic dynamic programming." },
];

export default function Problems() {
  const [kw, setKw] = useState("");
  const [topic, setTopic] = useState("");
  const [diff, setDiff] = useState("");

  const rows = useMemo(() => {
    return DATA.filter(r => {
      const okKw = !kw || r.title.toLowerCase().includes(kw.toLowerCase());
      const okT  = !topic || r.topic === topic;
      const okD  = !diff || r.diff === diff;
      return okKw && okT && okD;
    });
  }, [kw, topic, diff]);

  return (
    <>
      <h1 className="h1">Problems</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>Search</div>
            <input className="btn" placeholder="title…" value={kw} onChange={e=>setKw(e.target.value)} />
          </div>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>Topic</div>
            <select className="btn" value={topic} onChange={e=>setTopic(e.target.value)}>
              <option value="">All</option><option>Arrays</option><option>Strings</option><option>Graphs</option><option>DP</option>
            </select>
          </div>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>Difficulty</div>
            <select className="btn" value={diff} onChange={e=>setDiff(e.target.value)}>
              <option value="">All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" onClick={()=>{setKw("");setTopic("");setDiff("");}}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="meta" style={{ display:"flex", gap:12, padding:"0 4px 8px" }}>
          <div style={{ width:24 }}>#</div><div style={{ flex:1 }}>Title</div><div style={{ width:96 }}>Topic</div><div style={{ width:80 }}>Diff</div><div style={{ width:110, textAlign:"right" }}>Status</div>
        </div>
        <div className="list">
          {rows.map(r => (
            <div key={r.id} className="item" style={{ padding:"12px 8px" }}>
              <div style={{ width:24 }} className="meta">{r.id}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.title}</div>
                <div className="meta">{r.blurb}</div>
              </div>
              <div style={{ width:96 }}><span className="badge">{r.topic}</span></div>
              <div style={{ width:80 }}><span className="badge">{r.diff}</span></div>
              <div style={{ width:110, textAlign:"right" }}>
                <span className={r.status === "Solved" ? "badge badge--dark" : r.status === "Not Solved" ? "badge badge--red" : "badge"}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

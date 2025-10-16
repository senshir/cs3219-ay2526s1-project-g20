import React from "react";

function Stat({ icon, label, value }) {
  return (
    <div className="stat" style={{ minWidth: 90 }}>
      <div className="v" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon} {value}
      </div>
      <div className="l">{label}</div>
    </div>
  );
}

function Row({ title, subtitle, status, tone = "soft" }) {
  const statusCls =
    "badge--pill " + (status === "Completed" ? "badge--dark" : tone === "soft" ? "badge--soft" : "badge");
  return (
    <div className="item">
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div className="meta">{subtitle}</div>
      </div>
      <span className={statusCls}>{status}</span>
    </div>
  );
}

export default function Profile() {
  return (
    <div>
      <h1 className="h1">PeerPrep User Profile</h1>
      <p className="kicker">Comprehensive user dashboard showing coding statistics, match history, achievements, and skill progression</p>

      {/* Header card */}
      <section className="card">
        <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className="avatar-lg">
              AC
              <span className="dot" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0 }}>Alex Chen</h2>
                <span className="badge badge--pill badge--soft">Active Member</span>
              </div>
              <div className="kicker">alex.chen@example.com</div>
              <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
                <Stat value="47" label="Total Sessions" icon={"👥"} />
                <Stat value="23" label="Problems Solved" icon={"✅"} />
                <Stat value="142h" label="Total Hours" icon={"⏱️"} />
                <Stat value="7" label="Day Streak" icon={"📈"} />
              </div>
              <div className="tags" style={{ marginTop: 10 }}>
                <span className="tag">JavaScript</span>
                <span className="tag" style={{ background: "#e0f2fe", color: "#0369a1" }}>Python</span>
                <span className="tag" style={{ background: "#fee2e2", color: "#b91c1c" }}>Java</span>
                <span className="tag" style={{ background: "#ede9fe", color: "#6d28d9" }}>C++</span>
              </div>
            </div>
          </div>
          <button className="btn">Edit Profile</button>
        </div>

        {/* Segmented tabs (static UI for now) */}
        <div className="segmentted" style={{ marginTop: 16 }}>
          <div className="segmented">
            <button className="is-active">Overview</button>
            <button>Match History</button>
            <button>Achievements</button>
            <button>Skills</button>
          </div>
        </div>
      </section>

      {/* Overview content */}
      <section className="grid-row" style={{ marginTop: 16 }}>
        {/* Performance Stats */}
        <div className="card">
          <h3>Performance Stats</h3>
          <div className="p-muted" style={{ marginBottom: 6 }}>Success Rate <span style={{ float: "right" }}>78%</span></div>
          <div className="bar" style={{ marginBottom: 12 }}><div style={{ width: "78%" }} /></div>

          <div className="p-muted" style={{ marginBottom: 6 }}>Avg. Session Time <span style={{ float: "right" }}>45m</span></div>
          <div className="bar" style={{ marginBottom: 12 }}><div style={{ width: "45%" }} /></div>

          <div className="p-muted">Member since <span style={{ float: "right" }}>March 2024</span></div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3>Recent Activity</h3>
          <div className="list">
            <Row
              title="Two Sum"
              subtitle="with Sarah Kim • 32min • 2024-03-15"
              status="Completed"
            />
            <Row
              title="Binary Tree Traversal"
              subtitle="with Mike Johnson • 58min • 2024-03-14"
              status="Completed"
            />
            <Row
              title="Longest Palindrome"
              subtitle="with Emma Wilson • 67min • 2024-03-13"
              status="Incomplete"
              tone="soft"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

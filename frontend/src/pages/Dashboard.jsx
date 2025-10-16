import React from "react";

function Badge({ children, tone }) {
  const cls =
    tone === "dark" ? "badge badge--dark" :
    tone === "red"  ? "badge badge--red"  :
    tone === "green"? "badge badge--green": "badge";
  return <span className={cls}>{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      <section style={{ marginBottom: 16 }}>
        <h1 className="h1">Welcome back, John!</h1>
        <p className="p-muted">Ready to continue your coding interview preparation?</p>
        <div className="row" style={{ gap: 16 }}>
          <button className="btn btn--dark">&lt;/&gt;&nbsp; Practice Problems</button>
          <button className="btn">👥&nbsp; Find Practice Partner</button>
          <button className="btn">📅&nbsp; Schedule Interview</button>
          <button className="btn">📚&nbsp; Study Resources</button>
        </div>
      </section>

      <section className="grid-row">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h3>Your Progress</h3>
            <Badge>7 days</Badge>
          </div>

          <div className="row" style={{ gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 420px" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <div className="p-muted">Problems Solved</div>
                <div className="p-muted">45/500</div>
              </div>
              <div className="progress"><div /></div>
              <div style={{ marginTop: 8 }} className="p-muted">
                Current Streak <span className="kbd">7</span>
              </div>
            </div>
            <div className="row" style={{ flex: "1 1 260px", justifyContent: "space-around" }}>
              <Stat label="Sessions" value="23" />
              <Stat label="Avg Rating" value="4.2" />
              <Stat label="Success Rate" value="85%" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Upcoming</h3>
          <div className="list">
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tech Corp</div>
                <div className="meta">Tomorrow at 2:00 PM</div>
              </div>
              <Badge>Mock Interview</Badge>
            </div>
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>StartupXYZ</div>
                <div className="meta">Dec 12 at 10:00 AM</div>
              </div>
              <Badge>Peer Practice</Badge>
            </div>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: 12 }}>Schedule More</button>
        </div>
      </section>

      <section className="grid-row" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Recent Practice Sessions</h3>
          <div className="list">
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Two Sum</div>
                <div className="meta">with Alice Smith • 25 min</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Badge>Easy</Badge>
                <Badge tone="dark">Solved</Badge>
              </div>
            </div>
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Binary Tree Traversal</div>
                <div className="meta">with Bob Johnson • 40 min</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Badge>Medium</Badge>
                <Badge tone="dark">Partially Solved</Badge>
              </div>
            </div>
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Dynamic Programming</div>
                <div className="meta">with Carol Davis • 60 min</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Badge tone="red">Hard</Badge>
                <Badge tone="red">Not Solved</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Achievements</h3>
          <div className="list" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <span style={{ display: "inline-block", width: 14, height: 14, background: "#f59e0b", borderRadius: 999 }} />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>Problem Solver</div><div className="meta">Solved 50 problems</div></div>
            </div>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <span style={{ display: "inline-block", width: 14, height: 14, background: "#2563eb", borderRadius: 999 }} />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>Week Streak</div><div className="meta">7 days in a row</div></div>
            </div>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <span style={{ display: "inline-block", width: 14, height: 14, background: "#10b981", borderRadius: 999 }} />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>Team Player</div><div className="meta">25 practice sessions</div></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

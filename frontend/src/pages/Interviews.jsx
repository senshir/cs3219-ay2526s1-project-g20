import React from "react";

export default function Interviews() {
  return (
    <>
      <h1 className="h1">Interviews</h1>
      <section className="grid-row">
        <div className="card">
          <h3>Upcoming</h3>
          <div className="list">
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tech Corp</div>
                <div className="meta">Tomorrow • 2:00 PM • Online</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge">Mock</span>
                <button className="btn">Reschedule</button>
                <button className="btn">Cancel</button>
              </div>
            </div>
            <div className="item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>StartupXYZ</div>
                <div className="meta">Dec 12 • 10:00 AM • Campus</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge">Peer Practice</span>
                <button className="btn">Reschedule</button>
                <button className="btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Schedule New</h3>
          <form onSubmit={(e)=>{e.preventDefault(); alert("Demo only");}} className="list">
            <input className="btn" placeholder="Company / Partner" />
            <select className="btn">
              <option>Mock Interview</option>
              <option>Peer Practice</option>
            </select>
            <div className="row" style={{ gap: 12 }}>
              <input type="date" className="btn" style={{ flex: 1 }} />
              <input type="time" className="btn" style={{ flex: 1 }} />
            </div>
            <select className="btn">
              <option>Online</option>
              <option>Onsite</option>
            </select>
            <button className="btn">Add to Schedule</button>
          </form>
        </div>
      </section>
    </>
  );
}

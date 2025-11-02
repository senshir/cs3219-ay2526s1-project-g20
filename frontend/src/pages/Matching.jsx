import React, { useEffect, useMemo, useState } from "react";
import "../css/Matching.css";
import { api } from "../lib/api";

const FALLBACK_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const FALLBACK_TOPICS = ["Algorithms", "Arrays", "Data Structures", "Strings", "Graphs"];

export default function Matching({ user }) {
  const [difficultyOptions, setDifficultyOptions] = useState(FALLBACK_DIFFICULTIES);
  const [topicOptions, setTopicOptions] = useState(FALLBACK_TOPICS);

  const [selectedDifficulty, setSelectedDifficulty] = useState(FALLBACK_DIFFICULTIES[1]);
  const [selectedTopics, setSelectedTopics] = useState(() => new Set([FALLBACK_TOPICS[0]]));
  const [relaxedDifficulties, setRelaxedDifficulties] = useState(() => new Set());

  const [mode, setMode] = useState("pair");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState(null);

  const totalSelected = (selectedDifficulty ? 1 : 0) + selectedTopics.size;

  const preferences = useMemo(
    () => ({
      difficulty: selectedDifficulty || undefined,
      topics: Array.from(selectedTopics),
      mode,
    }),
    [selectedDifficulty, selectedTopics, mode]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const stats = await api.get("questions", "/api/questions/statistics");
        const byDiff = stats?.data?.byDifficulty ?? [];
        const byCat = stats?.data?.byCategory ?? [];

        const diffs = byDiff.map((item) => String(item._id)).filter(Boolean);
        const topics = byCat.map((item) => String(item._id)).filter(Boolean);

        const nextDiffs = diffs.length ? diffs : FALLBACK_DIFFICULTIES;
        const nextTopics = topics.length ? topics : FALLBACK_TOPICS;

        if (!cancelled) {
          setDifficultyOptions(nextDiffs);
          setTopicOptions(nextTopics);
          setSelectedDifficulty((prev) => (prev && nextDiffs.includes(prev) ? prev : nextDiffs[1] ?? nextDiffs[0]));
          setSelectedTopics((prev) => {
            const filtered = new Set([...prev].filter((topic) => nextTopics.includes(topic)));
            if (filtered.size === 0) filtered.add(nextTopics[0]);
            return filtered;
          });
          if (!diffs.length || !topics.length) {
            setOptionsError("Question Service returned limited data. Using fallback lists.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setDifficultyOptions(FALLBACK_DIFFICULTIES);
          setTopicOptions(FALLBACK_TOPICS);
          setSelectedDifficulty(FALLBACK_DIFFICULTIES[1]);
          setSelectedTopics(new Set([FALLBACK_TOPICS[0]]));
          setOptionsError("Unable to reach Question Service. Using default lists.");
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSearching) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  useEffect(() => {
    if (!ticket || !isSearching) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const result = await api.get("match", "/match/status", { token: ticket });
        if (cancelled) return;

        setStatus(result);
        if (result.status === "SESSION_READY") {
          setMsg("✅ Match ready! Use the collaboration token below to join the room.");
          setIsSearching(false);
        } else if (result.status === "QUEUED") {
          setMsg("⌛ Still searching… hang tight!");
        } else if (result.status) {
          setMsg(`ℹ️ Current status: ${result.status}`);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not retrieve status.");
      }
    };

    const interval = setInterval(poll, 5000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticket, isSearching]);

  const formattedElapsed = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  // Handle when a difficulty is clicked
  function handleDifficultyClick(diff) {
    setSelectedDifficulty((prev) => {
      // Prevent selecting more than one difficulty
      if (prev === diff) {
        return null;  // Deselect if already selected
      }
      return diff;  // Select the clicked difficulty
    });
  }

  // Handle when a topic is clicked
  function handleTopicClick(topic) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);  // Remove if already selected
      } else if (next.size < 3) {
        next.add(topic);  // Add topic if less than 3
      }
      return next;
    });
  }

  async function createMatchTicket() {
    if (!user?.token) throw new Error("Missing login token. Please sign in again.");
    const response = await api.post("users", "/match-ticket", {
      token: user.token,
      json: preferences,
    });
    return response.access_token;
  }

  async function requestMatch(matchToken) {
    await api.post("match", "/match/requests", {
      token: matchToken,
      json: { difficulty: preferences.difficulty, topics: preferences.topics },
    });
  }

  async function onStart(e) {
    e.preventDefault();
    if (totalSelected === 0) {
      setError("Select at least one difficulty or topic (up to 3 total).");
      return;
    }
    setError("");
    setStatus(null);

    try {
      setIsLoading(true);
      setIsSearching(true);
      setElapsedSeconds(0);
      setRelaxedDifficulties(new Set());

      const difficultyLabel =
        selectedDifficulty || selectedTopics.size === 0 ? selectedDifficulty ?? "any difficulty" : selectedDifficulty;
      const topicLabel =
        selectedTopics.size === topicOptions.length
          ? "any topic"
          : selectedTopics.size
          ? Array.from(selectedTopics).join(", ")
          : "any topic";

      setMsg(
        `Searching for ${mode === "pair" ? "a partner" : "a session"} in ${topicLabel} (${
          difficultyLabel || "any difficulty"
        })…`
      );

      const matchToken = await createMatchTicket();
      setTicket(matchToken);
      await requestMatch(matchToken);
      setMsg("🎯 Request submitted. We’ll notify you once another learner accepts.");
    } catch (err) {
      setTicket(null);
      setStatus(null);
      setMsg("");
      setIsSearching(false);
      setError(err.message || "Failed to start matching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckStatus() {
    if (!ticket) {
      setError("Start a matching request first.");
      return;
    }
    setError("");
    try {
      const result = await api.get("match", "/match/status", { token: ticket });
      setStatus(result);
      if (result.status === "SESSION_READY") {
        setMsg("✅ Match ready! Use the collaboration token below to join the room.");
        setIsSearching(false);
      } else if (result.status === "QUEUED") {
        setMsg("⌛ Still searching… hang tight!");
      } else {
        setMsg(`ℹ️ Current status: ${result.status}`);
      }
    } catch (err) {
      setError(err.message || "Could not retrieve status.");
    }
  }

  async function handleCancel() {
    if (!ticket) {
      setError("No active matching request to cancel.");
      return;
    }
    setError("");
    try {
      await api.post("match", "/match/cancel", { token: ticket });
      setMsg("🛑 Matching cancelled.");
      setStatus(null);
      setTicket(null);
      setIsSearching(false);
    } catch (err) {
      setError(err.message || "Failed to cancel request.");
    }
  }

  async function handleRetry(mode = "same") {
    if (!ticket) {
      setError("Start a matching request first.");
      return;
    }
    setError("");
    try {
      const result = await api.post("match", "/match/retry", {
        token: ticket,
        json: { mode },
      });
      if (result?.error) {
        setError(result.error);
        return;
      }

      if (mode === "broaden") {
        const next = new Set(relaxedDifficulties);
        if (selectedDifficulty) next.add(selectedDifficulty);
        const relaxed = result?.applied?.difficulty;
        if (relaxed && relaxed !== "(all)") next.add(relaxed);
        setRelaxedDifficulties(next);
        setMsg(
          relaxed && relaxed !== "(all)"
            ? `🔁 Relaxed difficulty to include ${relaxed}. Searching again with broader matches.`
            : "🔁 Relaxed criteria. Searching again with broader matches."
        );
      } else {
        setMsg("🔁 Requeued with the same criteria.");
      }

      setIsSearching(true);
      setElapsedSeconds(0);
    } catch (err) {
      setError(err.message || "Failed to retry search.");
    }
  }

  function resetForm() {
    setMsg("");
    setError("");
    setStatus(null);
    setTicket(null);
    setIsSearching(false);
    setElapsedSeconds(0);
    setRelaxedDifficulties(new Set());
    setMode("pair");
    setSelectedDifficulty(difficultyOptions[1] ?? difficultyOptions[0] ?? null);
    setSelectedTopics(new Set(topicOptions[0] ? [topicOptions[0]] : []));
  }

  const reachedLimit = totalSelected >= 3;
  const showSuggestions = isSearching && elapsedSeconds >= 30;
  const canRetry = Boolean(ticket && (!status || ["QUEUED", "EXPIRED"].includes(status.status)));
  const canShowRelax = canRetry && showSuggestions && Boolean(selectedDifficulty);

  return (
    <div className="matching">
      <h1 className="h1">Start Matching</h1>
      <p className="p-muted">Choose your preferences and begin pairing.</p>

      <div className="card match-card">
        <form className="list" onSubmit={onStart}>
          <div>
            <label className="label">Search Time</label>
            <div className="timer-display">
              <span>{formattedElapsed}</span>
              {isSearching && <span className="p-muted" style={{ marginLeft: 8 }}>Searching…</span>}
            </div>
          </div>

          <div>
            <label className="label">Mode</label>
            <div className="segmented">
              <button
                type="button"
                className={mode === "pair" ? "is-active" : ""}
                onClick={() => setMode("pair")}
                disabled={isLoading || isSearching}
              >
                Pair Match
              </button>
              <button
                type="button"
                className={mode === "solo" ? "is-active" : ""}
                onClick={() => setMode("solo")}
                disabled={isLoading || isSearching}
              >
                Solo Practice
              </button>
            </div>
          </div>

          <div>
            <label className="label">Difficulties</label>
            <div className="pill-grid">
              {difficultyOptions.map((diff) => {
                const isUserSelected = selectedDifficulty === diff;  // Check if this difficulty is selected
                const disabled = selectedTopics.size === 3 || (isUserSelected && totalSelected === 1);  // Disable if 3 topics or if one difficulty is selected

                return (
                  <button
                    key={diff}
                    type="button"
                    className={[
                      "pill-option",
                      isUserSelected ? "is-selected" : "",
                      disabled ? "is-disabled" : "",
                    ].join(" ")}
                    disabled={disabled}  // Disable if the condition is met
                    onClick={() => handleDifficultyClick(diff)}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Topics</label>
            <div className="pill-grid two-rows">
              {topicOptions.map((topic) => {
                const checked = selectedTopics.has(topic);
                const disabled = !checked && reachedLimit;
                return (
                  <button
                    key={topic}
                    type="button"
                    className={["pill-option", checked ? "is-selected" : "", disabled ? "is-disabled" : ""].join(" ")}
                    disabled={isLoading || optionsLoading || disabled}
                    onClick={() => handleTopicClick(topic)}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {optionsError && (
            <div className="msg-box" style={{ color: "var(--warning, #a16207)" }}>
              {optionsError}
            </div>
          )}
          {error && (
            <div className="msg-box" style={{ color: "var(--danger, #d14343)" }}>
              {error}
            </div>
          )}
          {msg && <div className="p-muted msg-box">{msg}</div>}
          {status?.collabToken && (
            <div className="msg-box">
              <strong>Collaboration Token:</strong>
              <code style={{ display: "block", marginTop: 4, wordBreak: "break-all" }}>{status.collabToken}</code>
            </div>
          )}
          {showSuggestions && canRetry && (
            <div className="msg-box">
              Still waiting? Try relaxing your criteria or requeueing to stay near the front of the line.
            </div>
          )}

          <div className="row btn-row">
            <button
              className="btn btn--dark btn--xl"
              type="submit"
              disabled={isLoading || optionsLoading || isSearching || totalSelected === 0}
            >
              ⚡ Start Matching
            </button>
            <button className="btn" type="button" onClick={handleCheckStatus} disabled={!ticket}>
              Check Status
            </button>
            <button className="btn" type="button" onClick={handleCancel} disabled={!ticket}>
              Cancel
            </button>
            <button className="btn" type="button" onClick={resetForm}>
              Clear
            </button>
            {showSuggestions && (
              <>
                <button className="btn" type="button" onClick={() => handleRetry("same")} disabled={!canRetry}>
                  Retry Same
                </button>
                {canShowRelax && (
                  <button className="btn" type="button" onClick={() => handleRetry("broaden")} disabled={!canShowRelax}>
                    Relax Criteria
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

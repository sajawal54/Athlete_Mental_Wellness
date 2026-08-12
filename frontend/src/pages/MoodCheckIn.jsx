import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { moodService } from "../services/moodService";

const CHECKIN_XP_REWARD = 80;

const MOOD_OPTIONS = [
  {
    id: "great",
    label: "Energized",
    emoji: "🔥",
  },
  {
    id: "good",
    label: "Focused",
    emoji: "😌",
  },
  {
    id: "neutral",
    label: "Neutral",
    emoji: "😐",
  },
  {
    id: "anxious",
    label: "Stressed",
    emoji: "😰",
  },
  {
    id: "exhausted",
    label: "Exhausted",
    emoji: "😫",
  },
];

const MOOD_SCORE_MAP = {
  exhausted: 1,
  anxious: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

const RECOMMENDED_ACTIVITIES = {
  anxious: {
    title: "Sound Therapy",
    path: "/sound-therapy",
    icon: "🌊",
  },
  exhausted: {
    title: "Rest & Recovery with Sound Therapy",
    path: "/sound-therapy",
    icon: "🌙",
  },
  neutral: {
    title: "AI Bio Guide",
    path: "/bio-guide",
    icon: "🧘",
  },
  good: {
    title: "Daily Goals",
    path: "/goals",
    icon: "🎯",
  },
  great: {
    title: "Daily Goals",
    path: "/goals",
    icon: "⚡",
  },
};

export default function MoodCheckIn() {
  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState("");

  const [history, setHistory] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [lastSubmittedMood, setLastSubmittedMood] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Backend pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Load mood history from backend
  useEffect(() => {
    let cancelled = false;

    const loadMoodHistory = async () => {
      try {
        setHistoryLoading(true);
        setError("");

        const data = await moodService.getMoods(1);

        if (cancelled) return;

        const results = Array.isArray(data) ? data : data?.results || [];

        setHistory(results);
        setCurrentPage(1);

        if (!Array.isArray(data)) {
          setTotalCount(Number(data?.count) || results.length);
          setHasNextPage(Boolean(data?.next));
          setHasPreviousPage(Boolean(data?.previous));
        } else {
          setTotalCount(results.length);
          setHasNextPage(false);
          setHasPreviousPage(false);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Mood history error:", err);

        if (err?.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError("Unable to load your mood history.");
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadMoodHistory();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Load a specific backend page
  const loadMoodPage = async (pageNumber) => {
    if (pageNumber < 1 || historyLoading) {
      return;
    }

    try {
      setHistoryLoading(true);
      setError("");

      const data = await moodService.getMoods(pageNumber);

      const results = Array.isArray(data) ? data : data?.results || [];

      setHistory(results);
      setCurrentPage(pageNumber);

      if (!Array.isArray(data)) {
        setTotalCount(Number(data?.count) || results.length);
        setHasNextPage(Boolean(data?.next));
        setHasPreviousPage(Boolean(data?.previous));
      } else {
        setTotalCount(results.length);
        setHasNextPage(false);
        setHasPreviousPage(pageNumber > 1);
      }
    } catch (err) {
      console.error("Mood pagination error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      const backendError =
        err?.response?.data?.error || err?.response?.data?.detail;

      setError(backendError || "Unable to load mood history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setAiMessage("");

    if (!selectedMood) {
      setError("Please select your current mood first.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        mood: selectedMood.id,
        emoji: selectedMood.emoji,
        energy_level: Number(energyLevel),
        notes: notes.trim(),
      };

      const newEntry = await moodService.addMood(payload);

      // New entry is shown immediately on page 1
      setHistory((currentHistory) => [newEntry, ...currentHistory]);

      setCurrentPage(1);

      setAiMessage(newEntry?.ai_message || "");
      setLastSubmittedMood(selectedMood.id);

      setSelectedMood(null);
      setNotes("");
      setEnergyLevel(3);

      // Refresh page 1 from backend so pagination metadata stays correct
      await loadMoodPage(1);
    } catch (err) {
      console.error("Mood submit error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      const backendError =
        err?.response?.data?.error || err?.response?.data?.detail;

      setError(backendError || "Unable to save your mood check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError("");

    try {
      await moodService.deleteMood(id);

      /*
       * After deleting, reload the current page.
       * This is important because backend pagination may
       * move an item from the next page into the current page.
       */
      await loadMoodPage(currentPage);
    } catch (err) {
      console.error("Mood delete error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      const backendError =
        err?.response?.data?.error || err?.response?.data?.detail;

      setError(backendError || "Unable to delete this mood record.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (totalCount === 0 && history.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear your complete mood history? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setClearingHistory(true);
    setError("");

    try {
      await moodService.clearMoods();

      setHistory([]);
      setCurrentPage(1);
      setTotalCount(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setAiMessage("");
      setLastSubmittedMood(null);
    } catch (err) {
      console.error("Clear mood history error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      const backendError =
        err?.response?.data?.error || err?.response?.data?.detail;

      setError(backendError || "Unable to clear your mood history.");
    } finally {
      setClearingHistory(false);
    }
  };

  /*
   * Chart uses currently loaded backend page.
   * If you want the graph to always represent ALL historical
   * moods, backend should provide a separate chart/analytics endpoint.
   */
  const chartData = useMemo(() => {
    return [...history]
      .sort(
        (a, b) =>
          new Date(a.created_at || a.date) -
          new Date(b.created_at || b.date),
      )
      .slice(-7)
      .map((item) => {
        const itemDate = item.created_at || item.date;

        return {
          date: itemDate
            ? new Date(itemDate).toLocaleDateString("en-US", {
                weekday: "short",
              })
            : "—",

          score: MOOD_SCORE_MAP[item.mood] || 3,

          moodLabel: item.mood || "neutral",
        };
      });
  }, [history]);

  const recommendedActivity = lastSubmittedMood
    ? RECOMMENDED_ACTIVITIES[lastSubmittedMood]
    : null;

  /*
   * Backend controls pagination.
   * This is only for displaying the page number.
   */
  const totalPages = Math.max(
    Math.ceil(totalCount / 2),
    1,
  );

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      loadMoodPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      loadMoodPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* HEADER */}
        <section className="rounded-3xl bg-linear-to-r from-indigo-600 to-purple-700 p-6 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
            Mental Wellness
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Daily Mood Check-In
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-indigo-100">
                Check in with yourself, track your emotional patterns,
                and receive a personalized wellness insight.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center backdrop-blur-md">
              <p className="text-2xl font-black">
                +{CHECKIN_XP_REWARD} XP
              </p>

              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Daily Reward
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* CHECK-IN FORM */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* MOOD PICKER */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  How are you feeling?
                </label>

                <span className="text-xs text-slate-400">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {MOOD_OPTIONS.map((mood) => {
                  const selected = selectedMood?.id === mood.id;

                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => setSelectedMood(mood)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-4 transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/40"
                          : "border-slate-200 bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="text-3xl">
                        {mood.emoji}
                      </div>

                      <p
                        className={`mt-2 text-xs font-bold ${
                          selected
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {mood.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ENERGY LEVEL */}
            <div>
              <div className="mb-3 flex justify-between">
                <label
                  htmlFor="energy-level"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Energy Level
                </label>

                <span className="text-sm font-black text-indigo-600">
                  {energyLevel}/5
                </span>
              </div>

              <input
                id="energy-level"
                type="range"
                min="1"
                max="5"
                value={energyLevel}
                onChange={(event) =>
                  setEnergyLevel(Number(event.target.value))
                }
                aria-label="Energy Level"
                className="w-full accent-indigo-600"
              />

              <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                <span>Very Low</span>
                <span>Balanced</span>
                <span>Very High</span>
              </div>
            </div>

            {/* JOURNAL NOTE */}
            <div>
              <div className="mb-2 flex justify-between">
                <label
                  htmlFor="mood-notes"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Journal Note
                </label>

                <span className="text-[10px] text-slate-400">
                  {notes.length}/300
                </span>
              </div>

              <textarea
                id="mood-notes"
                value={notes}
                maxLength={300}
                rows={4}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What's on your mind today?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving Check-In..."
                : `Save Check-In • +${CHECKIN_XP_REWARD} XP`}
            </button>
          </form>
        </section>

        {/* AI WELLNESS INSIGHT */}
        {aiMessage && (
          <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-400">
              🤖 AI Wellness Insight
            </p>

            <p className="mt-3 text-lg font-medium leading-relaxed">
              {aiMessage}
            </p>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:items-center">
              {recommendedActivity ? (
                <div className="text-sm text-slate-300">
                  {recommendedActivity.icon} Recommended:{" "}
                  {recommendedActivity.title}
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  Need personalized guidance? Check out AI Bio Guide.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {recommendedActivity && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(recommendedActivity.path)
                    }
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    Start Activity →
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/bio-guide")}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20"
                >
                  🧬 AI Bio Guide
                </button>
              </div>
            </div>
          </section>
        )}

        {/* MOOD TREND GRAPH */}
        {history.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Mood Trend
              </h2>

              <p className="text-xs text-slate-500">
                Your loaded mood entries
              </p>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <Tooltip
                    formatter={(value, name, props) => [
                      `${props.payload.moodLabel} (${value}/5)`,
                      "Mood",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* RECENT MOOD HISTORY */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Recent Check-Ins
              </h2>

              <p className="text-xs text-slate-500">
                {totalCount > 0
                  ? `Showing 2 entries per page • ${totalCount} total entries`
                  : "Your mood check-in history"}
              </p>
            </div>

            {totalCount > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={clearingHistory}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                >
                  {clearingHistory
                    ? "Clearing..."
                    : "Clear History"}
                </button>
              </div>
            )}
          </div>

          {historyLoading && history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
              Loading mood history...
            </div>
          ) : totalCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
              No mood check-ins yet.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {item.emoji || "😐"}
                      </span>

                      <div>
                        <p className="text-sm font-bold capitalize text-slate-800 dark:text-white">
                          {item.mood}
                        </p>

                        <p className="text-xs text-slate-500">
                          Energy: {item.energy_level}/5
                        </p>

                        {item.notes && (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.notes}
                          </p>
                        )}

                        {(item.created_at || item.date) && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {new Date(
                              item.created_at || item.date,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === item.id ? "..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={
                      !hasPreviousPage || historyLoading
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    ← Previous
                  </button>

                  <span className="text-xs font-bold text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={
                      !hasNextPage || historyLoading
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
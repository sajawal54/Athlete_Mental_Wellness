import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { goalService } from "../services/goalService";

const GOAL_XP_REWARD = 100;

const CATEGORY_COLORS = {
  Mindfulness:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Recovery:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Physical:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Reflection:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export default function Goals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Mindfulness");
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Fetch goals when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      try {
        const data = await goalService.getDailyGoals();

        if (!isMounted) return;

        setGoals(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Goals fetch error:", err);

        if (!isMounted) return;

        if (err?.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError("Unable to load your daily goals. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleToggle = async (goalId) => {
    if (actionId) return;

    setActionId(goalId);
    setError("");

    // Save previous state for rollback
    const previousGoals = [...goals];

    // Optimistic update
    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === goalId
          ? { ...goal, is_completed: !goal.is_completed }
          : goal
      )
    );

    try {
      const updatedGoal = await goalService.toggleGoalComplete(goalId);

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === goalId ? { ...goal, ...updatedGoal } : goal
        )
      );
    } catch (err) {
      console.error("Goal toggle error:", err);

      // Rollback optimistic update
      setGoals(previousGoals);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Unable to update this goal. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const handleAddGoal = async (event) => {
    event.preventDefault();

    const title = newTitle.trim();

    if (!title) {
      setError("Please enter a goal title.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        title,
        category: newCategory,
      };

      const savedGoal = await goalService.addGoal(payload);

      setGoals((currentGoals) => [savedGoal, ...currentGoals]);

      setNewTitle("");
      setNewCategory("Mindfulness");
      setShowAddForm(false);
    } catch (err) {
      console.error("Goal create error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Unable to create the goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (goalId) => {
    const previousGoals = [...goals];

    // Optimistic delete
    setGoals((currentGoals) =>
      currentGoals.filter((goal) => goal.id !== goalId)
    );

    setError("");

    try {
      await goalService.deleteGoal(goalId);
    } catch (err) {
      console.error("Goal delete error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      // Rollback
      setGoals(previousGoals);
      setError("Unable to delete this goal. Please try again.");
    }
  };

  const completedCount = goals.filter(
    (goal) => goal.is_completed
  ).length;

  const totalGoals = goals.length;

  const progressPercent =
    totalGoals > 0
      ? Math.round((completedCount / totalGoals) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <section className="overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Daily Performance
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Wellness Goals
              </h1>

              <p className="mt-2 max-w-xl text-sm text-indigo-100">
                Build consistency by completing your daily mental and
                physical wellness targets.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-md">
              <p className="text-3xl font-black">
                {completedCount}/{totalGoals}
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                Goals Completed
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-bold">
              <span>Daily Progress</span>
              <span>{progressPercent}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-indigo-950/40">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Reward information */}
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
          <span className="text-xl">⚡</span>

          <div>
            <p className="font-bold">
              Complete a goal and earn +{GOAL_XP_REWARD} XP.
            </p>


          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today&apos;s Goals
            </h2>

            <p className="text-xs text-slate-500">
              {totalGoals} goal{totalGoals !== 1 ? "s" : ""} for today
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddForm((current) => !current)
            }
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
          >
            {showAddForm ? "Cancel" : "+ Add Goal"}
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddGoal}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
              Create Daily Goal
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(event) =>
                  setNewTitle(event.target.value)
                }
                placeholder="e.g. 10 minutes of mindful breathing"
                maxLength={200}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={newCategory}
                onChange={(event) =>
                  setNewCategory(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="Mindfulness">Mindfulness</option>
                <option value="Recovery">Recovery</option>
                <option value="Physical">Physical</option>
                <option value="Reflection">Reflection</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Goal"}
              </button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading today&apos;s goals...
          </div>
        )}

        {/* Empty State */}
        {!loading && goals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-4xl">🎯</div>

            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
              No goals yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first wellness goal for today.
            </p>
          </div>
        )}

        {/* Goals List */}
        {!loading && goals.length > 0 && (
          <div className="space-y-3">
            {goals.map((goal) => {
              const completed = Boolean(goal.is_completed);

              const categoryStyle =
                CATEGORY_COLORS[goal.category] ||
                "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div
                  key={goal.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                    completed
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggle(goal.id)}
                      disabled={actionId === goal.id}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                        completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 hover:border-indigo-500 dark:border-slate-600"
                      }`}
                    >
                      {completed && "✓"}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-bold transition-all ${
                          completed
                            ? "text-slate-400 line-through dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {goal.title}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${categoryStyle}`}
                        >
                          {goal.category}
                        </span>

                        <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400">
                          +{GOAL_XP_REWARD} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
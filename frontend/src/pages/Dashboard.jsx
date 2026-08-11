import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSmile,
  FiTarget,
  FiActivity,
  FiAward,
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiStar,
  FiZap,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { getDashboardDataAPI } from "../services/dashboardService";

/*
|--------------------------------------------------------------------------
| Format Mood Date
|--------------------------------------------------------------------------
*/
const formatMoodDate = (dateString) => {
  if (!dateString) return "Recorded";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recorded";
  }

  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/*
|--------------------------------------------------------------------------
| Mood Styling Helper
|--------------------------------------------------------------------------
*/
const getMoodStyle = (mood) => {
  if (!mood) {
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }

  const value = String(mood).toLowerCase();

  if (
    value.includes("great") ||
    value.includes("good") ||
    value.includes("happy") ||
    value.includes("calm") ||
    value.includes("energized")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/30";
  }

  if (
    value.includes("anxious") ||
    value.includes("stressed") ||
    value.includes("exhausted") ||
    value.includes("sad") ||
    value.includes("low")
  ) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/30";
  }

  return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800/30";
};

/*
|--------------------------------------------------------------------------
| Mood Label Helper
|--------------------------------------------------------------------------
*/
const getMoodLabel = (mood) => {
  if (!mood) return "Recorded";

  if (typeof mood === "object") {
    return (
      mood?.label ||
      mood?.mood ||
      mood?.mood_name ||
      mood?.name ||
      mood?.emotion ||
      "Recorded"
    );
  }

  return String(mood);
};

/*
|--------------------------------------------------------------------------
| Mood Emoji Helper
|--------------------------------------------------------------------------
*/
const getMoodEmoji = (mood) => {
  if (!mood) return "🙂";

  if (typeof mood === "object" && mood?.emoji) {
    return mood.emoji;
  }

  const value = String(
    typeof mood === "object" ? mood?.mood || mood?.label || "" : mood,
  ).toLowerCase();

  if (value.includes("great") || value.includes("energized")) return "🔥";
  if (value.includes("good") || value.includes("calm")) return "😌";
  if (value.includes("neutral")) return "😐";
  if (value.includes("anxious") || value.includes("stressed")) return "😰";
  if (value.includes("exhausted") || value.includes("low")) return "😫";

  return "🙂";
};

/*
|--------------------------------------------------------------------------
| Dashboard Component
|--------------------------------------------------------------------------
*/
export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Dashboard Data
  |--------------------------------------------------------------------------
  | Used by the Refresh button and retry button.
  |--------------------------------------------------------------------------
  */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardDataAPI();
      setData(response || {});
    } catch (err) {
      console.error("Dashboard API Error:", err);

      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Unable to load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | Initial Dashboard Load
  |--------------------------------------------------------------------------
  | The API promise is the external async operation.
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await getDashboardDataAPI();

        if (!isMounted) return;

        setData(response || {});
        setError("");
      } catch (err) {
        if (!isMounted) return;

        console.error("Dashboard API Error:", err);

        if (err?.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError("Unable to load your dashboard. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | Data Selectors
  |--------------------------------------------------------------------------
  */
  const userSummary = data?.user_summary || {};
  const todaysGoal = data?.todays_goal || {};
  const moodSummary = data?.mood_summary || {};
  const aiGuide = data?.ai_guide || {};

  /*
  |--------------------------------------------------------------------------
  | XP & Stats
  |--------------------------------------------------------------------------
  */
  const totalXP = Number(userSummary?.total_xp ?? userSummary?.xp ?? 0);
  const level = Math.max(Number(userSummary?.level ?? 1), 1);
  const streak = Math.max(Number(userSummary?.streak ?? 0), 0);

  /*
  |--------------------------------------------------------------------------
  | Today's Mood
  |--------------------------------------------------------------------------
  */
  const todayMoodData = moodSummary?.today || null;

  const hasCheckedInToday = todayMoodData?.checked_in === true;

  const todayMoodLabel = hasCheckedInToday
    ? todayMoodData?.label || todayMoodData?.mood || "Completed"
    : "No check-in yet";

  const todayMoodEmoji = todayMoodData?.emoji || "🙂";

  /*
  |--------------------------------------------------------------------------
  | Goal & Trends
  |--------------------------------------------------------------------------
  */
  const isGoalCompleted =
    todaysGoal?.completed === true || todaysGoal?.is_completed === true;

  const moodTrend = Array.isArray(moodSummary?.trend) ? moodSummary.trend : [];

  /*
  |--------------------------------------------------------------------------
  | Affirmation
  |--------------------------------------------------------------------------
  */
  const affirmation =
    data?.ai_affirmation ||
    data?.affirmation ||
    data?.daily_affirmation ||
    "You are capable, resilient, and stronger than you think.";

  const affirmationText =
    typeof affirmation === "object"
      ? affirmation?.text ||
        affirmation?.affirmation ||
        "You are capable, resilient, and stronger than you think."
      : affirmation;

  /*
  |--------------------------------------------------------------------------
  | Dynamic Greeting
  |--------------------------------------------------------------------------
  */
  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
        ? "Good Afternoon"
        : "Good Evening";

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <FiRefreshCw
            className="mx-auto animate-spin text-indigo-600"
            size={32}
          />

          <p className="mt-4 font-bold text-slate-800 dark:text-white">
            Loading your dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Syncing your wellness data
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */
  if (error) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-900/50 dark:bg-slate-900">
          <FiAlertCircle className="mx-auto text-red-500" size={40} />

          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Dashboard Unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Dashboard Summary Cards
  |--------------------------------------------------------------------------
  */
  const stats = [
    {
      title: "Today's Mood",
      value: hasCheckedInToday
        ? `${todayMoodEmoji} ${todayMoodLabel}`
        : "No check-in",
      subtitle: hasCheckedInToday
        ? "Today's mood is recorded"
        : "Complete your daily check-in",
      icon: <FiSmile size={20} />,
      link: "/mood-checkin",
      badge: hasCheckedInToday ? "Completed" : "Pending",
    },
    {
      title: "Daily Goal",
      value: isGoalCompleted ? "Completed" : "In Progress",
      subtitle: isGoalCompleted
        ? "Today's target achieved"
        : "Keep working toward your target",
      icon: <FiTarget size={20} />,
      link: "/goals",
      badge: isGoalCompleted ? "Completed" : "Pending",
    },
    {
      title: "Total XP",
      value: `${totalXP.toLocaleString()} XP`,
      subtitle: "Verified from your account",
      icon: <FiActivity size={20} />,
      link: "/profile",
      badge: `Level ${level}`,
    },
    {
      title: "Current Streak",
      value: `${streak} Days`,
      subtitle: "Consistency builds performance",
      icon: <FiAward size={20} />,
      link: "/dashboard",
      badge: "Active",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Dashboard UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              <FiZap size={13} />
              Athlete Performance Hub
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {greeting},{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {userSummary?.name || userSummary?.username || "Athlete"}
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Track your mental wellness, daily goals, consistency, and overall
              XP from one place.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <FiRefreshCw size={15} />
              Refresh
            </button>

            <Link
              to="/mood-checkin"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <FiSmile size={16} />
              Mood Check-In
            </Link>
          </div>
        </header>

        {/* XP BANNER */}
        <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-50 via-purple-50 to-emerald-50 p-6 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-emerald-950/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                <FiZap size={25} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Athlete XP
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {totalXP.toLocaleString()} XP
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current account level: <strong>Level {level}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
                <FiCheckCircle className="mr-1 inline text-emerald-500" />
                Mood: {hasCheckedInToday ? "Done" : "Pending"}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
                <FiTarget className="mr-1 inline text-indigo-500" />
                Goal: {isGoalCompleted ? "Done" : "Pending"}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
                <FiAward className="mr-1 inline text-amber-500" />
                {streak} Day Streak
              </div>
            </div>
          </div>
        </section>

        {/* STATS GRID */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              to={stat.link}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {stat.icon}
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {stat.badge}
                </span>
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                {stat.title}
              </p>

              <h3 className="mt-1 truncate text-xl font-black">{stat.value}</h3>

              <p className="mt-1 text-xs text-slate-500">{stat.subtitle}</p>
            </Link>
          ))}
        </section>

        {/* MAIN CONTENT GRID */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* RECENT MOOD ACTIVITY */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Recent Mood Activity</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your recent wellness check-ins
                </p>
              </div>

              <FiTrendingUp className="text-indigo-500" size={22} />
            </div>

            <div className="mt-5 space-y-3">
              {moodTrend.length > 0 ? (
                moodTrend.slice(0, 6).map((mood, index) => {
                  const moodLabel = getMoodLabel(mood);

                  const moodDate =
                    typeof mood === "object"
                      ? mood?.created_at || mood?.date || null
                      : null;

                  const moodEmoji = getMoodEmoji(mood);

                  return (
                    <div
                      key={mood?.id || moodDate || `${moodLabel}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800">
                          <span className="text-lg">{moodEmoji}</span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {moodLabel}
                          </p>

                          <p className="text-[10px] text-slate-500">
                            Daily mood check-in
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg border px-3 py-1 text-[10px] font-bold ${getMoodStyle(
                          moodLabel,
                        )}`}
                      >
                        {formatMoodDate(moodDate)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <FiSmile className="mx-auto text-slate-400" size={30} />

                  <p className="mt-3 text-sm font-bold">No mood records yet</p>

                  <Link
                    to="/mood-checkin"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600"
                  >
                    Start your first check-in
                    <FiArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* DAILY GOAL */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <FiTarget />
                </div>

                <div>
                  <h2 className="font-bold">Daily Goal</h2>

                  <p className="text-xs text-slate-500">Today's focus</p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  isGoalCompleted
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                }`}
              >
                {isGoalCompleted
                  ? "Completed"
                  : `${todaysGoal?.points ?? 100} XP`}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                {todaysGoal?.category || "Wellness"}
              </p>

              <h3 className="mt-2 font-bold">
                {todaysGoal?.title || "Create your daily goal"}
              </h3>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                {isGoalCompleted ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <FiCheck />
                    Goal completed
                  </div>
                ) : (
                  <Link
                    to="/goals"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    Open Goals
                    <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI COACH SECTION */}
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <FiShield />

            <span className="text-xs font-bold uppercase tracking-widest">
              AI Coach
            </span>
          </div>

          <p className="mt-3 text-lg font-medium leading-relaxed">
            "
            {aiGuide?.prompt ||
              "How are you preparing mentally for your next high-intensity session?"}
            "
          </p>

          <Link
            to="/bio-guide"
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400"
          >
            Reflect with AI Guide
            <FiArrowRight />
          </Link>
        </section>

        {/* DAILY AFFIRMATION SECTION */}
        <section className="overflow-hidden rounded-3xl bg-linear-to-r from-purple-950 via-indigo-950 to-slate-950 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <FiStar className="text-purple-300" size={22} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  Mindset & Resilience
                </p>

                <h2 className="mt-1 text-xl font-black">Daily Affirmation</h2>

                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-purple-100">
                  "{affirmationText}"
                </p>
              </div>
            </div>

            <Link
              to="/affirmations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold transition hover:bg-purple-500"
            >
              View Affirmations
              <FiArrowRight />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

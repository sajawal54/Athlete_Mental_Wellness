import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  TrophyIcon,
  GiftIcon,
  BoltIcon,
  FireIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

import {
  getGamificationOverviewAPI,
  claimRewardAPI,
} from "../services/gamificationService";

// ============================================================
// CONSTANTS
// ============================================================

const XP_PER_LEVEL = 100000;

const EMPTY_ARRAY = [];

// ============================================================
// HELPERS
// ============================================================

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString();
};

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (date) => {
  if (!date) {
    return "Activity";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Activity";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function GamificationDashboard() {
  // ----------------------------------------------------------
  // MAIN DATA
  // ----------------------------------------------------------

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const [activeTab, setActiveTab] = useState("overview");

  const [badgeFilter, setBadgeFilter] = useState("all");

  const [rewardFilter, setRewardFilter] = useState("all");

  // ----------------------------------------------------------
  // XP HISTORY
  // ----------------------------------------------------------

  const [xpHistory, setXpHistory] = useState([]);

  const [historyPage, setHistoryPage] = useState(1);

  const [hasMoreHistory, setHasMoreHistory] = useState(false);

  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  // ----------------------------------------------------------
  // REWARD
  // ----------------------------------------------------------

  const [claimingReward, setClaimingReward] = useState(null);

  // ==========================================================
  // UNIQUE HISTORY
  // ==========================================================

  const getUniqueHistory = useCallback((items) => {
    const seen = new Set();

    return items.filter((item) => {
      const identifier =
        item?.id || `${item?.created_at}-${item?.amount}-${item?.description}`;

      if (seen.has(identifier)) {
        return false;
      }

      seen.add(identifier);

      return true;
    });
  }, []);

  // ==========================================================
  // FETCH ALL GAMIFICATION DATA
  // ==========================================================

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getGamificationOverviewAPI();

        setData(response);

        const rawHistory = Array.isArray(response?.xp_history)
          ? response.xp_history
          : [];

        const uniqueHistory = getUniqueHistory(rawHistory);

        setXpHistory(uniqueHistory.slice(0, 20));

        setHistoryPage(1);

        setHasMoreHistory(rawHistory.length > 20);
      } catch (err) {
        console.error("Gamification Dashboard Error:", err);

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load gamification data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getUniqueHistory],
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    // API synchronization on initial component load.
    // The API function updates component state after the request.
    // This rule is intentionally disabled for this specific call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  // ==========================================================
  // SAFE DATA EXTRACTION
  // ==========================================================

  const profile = useMemo(() => {
    return data?.profile || {};
  }, [data]);

  const badges = useMemo(() => {
    return Array.isArray(data?.badges) ? data.badges : EMPTY_ARRAY;
  }, [data]);

  const earnedBadges = useMemo(() => {
    return Array.isArray(data?.earned_badges)
      ? data.earned_badges
      : EMPTY_ARRAY;
  }, [data]);

  const rewards = useMemo(() => {
    return Array.isArray(data?.rewards) ? data.rewards : EMPTY_ARRAY;
  }, [data]);

  const userRewards = useMemo(() => {
    return Array.isArray(data?.user_rewards) ? data.user_rewards : EMPTY_ARRAY;
  }, [data]);

  // ==========================================================
  // CORE GAMIFICATION VALUES
  // ==========================================================

  const currentXP = Number(profile?.xp || 0);

  const currentStreak = Number(profile?.streak || 0);

  const backendLevel = Number(profile?.level || 0);

  const calculatedLevel = Math.floor(currentXP / XP_PER_LEVEL) + 1;

  const currentLevel = Math.max(backendLevel, calculatedLevel);

  const xpInCurrentLevel = currentXP % XP_PER_LEVEL;

  const xpNeededForNextLevel = XP_PER_LEVEL - xpInCurrentLevel;

  const levelProgressPercent = Math.min(
    100,
    Math.max(0, (xpInCurrentLevel / XP_PER_LEVEL) * 100),
  );

  // ==========================================================
  // BADGES
  // ==========================================================

  const earnedBadgeNames = useMemo(() => {
    return new Set(
      earnedBadges
        .map((badge) => badge?.badge_name || badge?.name || badge?.title)
        .filter(Boolean),
    );
  }, [earnedBadges]);

  const badgeStats = useMemo(() => {
    const earned = earnedBadges.length;

    const total = badges.length;

    const locked = Math.max(total - earned, 0);

    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

    return {
      earned,
      total,
      locked,
      percentage,
    };
  }, [badges, earnedBadges]);

  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      const isEarned = earnedBadgeNames.has(badge?.name);

      if (badgeFilter === "earned") {
        return isEarned;
      }

      if (badgeFilter === "locked") {
        return !isEarned;
      }

      return true;
    });
  }, [badges, earnedBadgeNames, badgeFilter]);

  // ==========================================================
  // REWARDS
  // ==========================================================

  const userRewardMap = useMemo(() => {
    const map = new Map();

    userRewards.forEach((item) => {
      const name = item?.reward_name || item?.reward?.name || item?.name;

      if (name) {
        map.set(name, item);
      }
    });

    return map;
  }, [userRewards]);

  const getRewardStatus = useCallback(
    (reward) => {
      const rewardName = reward?.name || reward?.reward_name;

      const existingReward = userRewardMap.get(rewardName);

      if (existingReward) {
        return existingReward.status || "claimed";
      }

      const rewardXP = Number(reward?.xp_cost || 0);

      return currentXP >= rewardXP ? "available" : "locked";
    },
    [userRewardMap, currentXP],
  );

  const rewardStats = useMemo(() => {
    let claimed = 0;
    let available = 0;
    let locked = 0;

    rewards.forEach((reward) => {
      const status = getRewardStatus(reward);

      if (status === "claimed" || status === "redeemed") {
        claimed += 1;
      } else if (status === "available") {
        available += 1;
      } else {
        locked += 1;
      }
    });

    return {
      claimed,
      available,
      locked,
      total: rewards.length,
    };
  }, [rewards, getRewardStatus]);

  const filteredRewards = useMemo(() => {
    return rewards.filter((reward) => {
      const status = getRewardStatus(reward);

      if (rewardFilter === "available") {
        return status === "available";
      }

      if (rewardFilter === "claimed") {
        return status === "claimed" || status === "redeemed";
      }

      if (rewardFilter === "locked") {
        return status === "locked";
      }

      return true;
    });
  }, [rewards, getRewardStatus, rewardFilter]);

  // ==========================================================
  // MILESTONE
  // ==========================================================

  const nextMilestone = useMemo(() => {
    if (currentXP < 1000) {
      return {
        name: "XP Starter",
        target: 1000,
      };
    }

    if (currentXP < 50000) {
      return {
        name: "XP Explorer",
        target: 50000,
      };
    }

    if (currentXP < 100000) {
      return {
        name: "XP Champion",
        target: 100000,
      };
    }

    if (currentXP < 500000) {
      return {
        name: "Elite Athlete",
        target: 500000,
      };
    }

    return {
      name: "Elite Athlete",
      target: 500000,
    };
  }, [currentXP]);

  const milestoneProgress = Math.min(
    100,
    (currentXP / nextMilestone.target) * 100,
  );

  const milestoneRemaining = Math.max(
    0,
    nextMilestone.target - currentXP,
  );

  // ==========================================================
  // XP CHART
  // ==========================================================

  const xpChartData = useMemo(() => {
    if (!xpHistory.length) {
      return [
        {
          date: "Today",
          xp: 0,
        },
      ];
    }

    return [...xpHistory]
      .reverse()
      .slice(-10)
      .map((item) => ({
        date: formatShortDate(item?.created_at),
        xp: Number(item?.amount || 0),
      }));
  }, [xpHistory]);

  // ==========================================================
  // BADGE CHART
  // ==========================================================

  const badgeChartData = useMemo(() => {
    return [
      {
        name: "Earned",
        value: badgeStats.earned,
      },
      {
        name: "Locked",
        value: badgeStats.locked,
      },
    ];
  }, [badgeStats]);

  // ==========================================================
  // REWARD CHART
  // ==========================================================

  const rewardChartData = useMemo(() => {
    return [
      {
        name: "Claimed",
        value: rewardStats.claimed,
      },
      {
        name: "Available",
        value: rewardStats.available,
      },
      {
        name: "Locked",
        value: rewardStats.locked,
      },
    ];
  }, [rewardStats]);

  // ==========================================================
  // WELLNESS RADAR
  // ==========================================================

  const radarData = useMemo(() => {
    return [
      {
        subject: "XP",
        value: Math.min(100, (currentXP / 500000) * 100),
      },
      {
        subject: "Streak",
        value: Math.min(100, (currentStreak / 30) * 100),
      },
      {
        subject: "Badges",
        value: badgeStats.percentage,
      },
      {
        subject: "Rewards",
        value: Math.min(100, userRewards.length * 10),
      },
    ];
  }, [
    currentXP,
    currentStreak,
    badgeStats.percentage,
    userRewards.length,
  ]);

  // ==========================================================
  // RECENT HISTORY
  // ==========================================================

  const recentHistory = useMemo(() => {
    return [...xpHistory]
      .sort(
        (a, b) =>
          new Date(b?.created_at || 0) -
          new Date(a?.created_at || 0),
      )
      .slice(0, 6);
  }, [xpHistory]);

  // ==========================================================
  // LOAD MORE HISTORY
  // ==========================================================

  const handleLoadMoreHistory = async () => {
    if (loadingMoreHistory || !hasMoreHistory) {
      return;
    }

    try {
      setLoadingMoreHistory(true);

      const nextPage = historyPage + 1;

      const response = await axios.get(
        `/api/gamification/xp-history/?page=${nextPage}`,
      );

      const newResults = Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
          ? response.data
          : [];

      if (newResults.length > 0) {
        setXpHistory((prev) =>
          getUniqueHistory([...prev, ...newResults]),
        );

        setHistoryPage(nextPage);

        setHasMoreHistory(Boolean(response?.data?.next));
      } else {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error("Load More History Error:", err);

      setError("Unable to load more XP history.");
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  // ==========================================================
  // CLAIM REWARD
  // ==========================================================

  const handleClaimReward = async (reward) => {
    try {
      setClaimingReward(reward.id);

      setError("");

      await claimRewardAPI(reward.id);

      await fetchDashboard(true);
    } catch (err) {
      console.error("Claim Reward Error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Unable to claim this reward.",
      );
    } finally {
      setClaimingReward(null);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-16 w-80 rounded-2xl bg-slate-900" />

          <div className="h-64 rounded-3xl bg-slate-900" />

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-slate-900"
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 rounded-3xl bg-slate-900"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-amber-400" />

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Athlete Gamification
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Trophy Room
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Your complete wellness gamification — XP, achievements,
              rewards, consistency and progress in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-amber-500/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Syncing..." : "Sync Progress"}
          </button>
        </header>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />

            <div>
              <p className="text-sm font-semibold text-rose-300">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-rose-200/70">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            LEVEL HERO
        ==================================================== */}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-4 ring-amber-500/5">
                  <AcademicCapIcon className="h-9 w-9" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Current Rank
                  </p>

                  <h2 className="text-2xl font-black">
                    Athlete Level {currentLevel}
                  </h2>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">
                  {formatNumber(currentXP)}
                </span>

                <span className="mb-1 text-lg font-bold text-amber-400">
                  XP
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {formatNumber(xpNeededForNextLevel)} XP needed for Level{" "}
                {currentLevel + 1}.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Level Progress
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    Level {currentLevel}
                  </h3>
                </div>

                <span className="font-bold text-amber-400">
                  {levelProgressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-yellow-400 transition-all duration-700"
                  style={{
                    width: `${levelProgressPercent}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs">
                <span className="text-slate-500">
                  {formatNumber(xpInCurrentLevel)} XP
                </span>

                <span className="font-semibold text-amber-300">
                  {formatNumber(xpNeededForNextLevel)} remaining
                </span>

                <span className="text-slate-500">
                  {formatNumber(XP_PER_LEVEL)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
                <BoltIcon className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Total XP
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {formatNumber(currentXP)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Experience Points
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                <FireIcon className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Consistency
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {currentStreak}
              <span className="ml-1 text-lg text-slate-500">
                days
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Active daily streak
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <CheckBadgeIcon className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Achievements
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {badgeStats.earned}
              <span className="text-lg text-slate-600">
                {" "}
                / {badgeStats.total}
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {badgeStats.locked} badges remaining
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
                <GiftIcon className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Rewards
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {rewardStats.claimed}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {rewardStats.available} currently available
            </p>
          </div>
        </section>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mb-8 overflow-x-auto border-b border-slate-800">
          <div className="flex min-w-max">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: SparklesIcon,
              },
              {
                id: "achievements",
                label: "Achievements",
                icon: TrophyIcon,
              },
              {
                id: "rewards",
                label: "Rewards",
                icon: GiftIcon,
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: ChartBarIcon,
              },
              {
                id: "timeline",
                label: "XP Timeline",
                icon: ClockIcon,
              },
            ].map((tab) => {
              const Icon = tab.icon;

              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-amber-400 text-amber-400"
                      : "border-transparent text-slate-500 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-3xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Next Milestone
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {nextMilestone.name}
                    </h2>
                  </div>

                  <FlagIcon className="h-8 w-8 text-amber-400" />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-400">
                      {formatNumber(currentXP)} XP
                    </span>

                    <span className="font-bold text-amber-400">
                      {milestoneProgress.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-amber-500 to-yellow-400"
                      style={{
                        width: `${milestoneProgress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs">
                    <span className="text-slate-500">
                      Target {formatNumber(nextMilestone.target)} XP
                    </span>

                    <span className="font-semibold text-amber-300">
                      {formatNumber(milestoneRemaining)} XP left
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-violet-500/20 bg-linear-to-b from-violet-500/10 via-slate-900 to-slate-950 p-6">
                <SparklesIcon className="h-8 w-8 text-violet-400" />

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-violet-400">
                  Next Focus
                </p>

                <h3 className="mt-2 text-xl font-black">
                  Build Consistency
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Continue completing wellness activities to increase XP,
                  maintain your streak and unlock new achievements.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400" />

                    <span className="text-sm text-slate-300">
                      {badgeStats.earned} badges earned
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <FireIcon className="h-5 w-5 text-orange-400" />

                    <span className="text-sm text-slate-300">
                      {currentStreak} day streak
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <GiftIcon className="h-5 w-5 text-violet-400" />

                    <span className="text-sm text-slate-300">
                      {rewardStats.available} rewards available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BoltIcon className="h-5 w-5 text-amber-400" />

                  <h3 className="font-bold">
                    Recent XP Growth
                  </h3>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={xpChartData}>
                      <defs>
                        <linearGradient
                          id="overviewXpGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.4}
                          />

                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="xp"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#overviewXpGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-cyan-400" />

                  <h3 className="font-bold">
                    Progress Balance
                  </h3>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />

                      <PolarAngleAxis
                        dataKey="subject"
                        stroke="#94a3b8"
                        fontSize={11}
                      />

                      <Radar
                        name="Progress"
                        dataKey="value"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            ACHIEVEMENTS
        ==================================================== */}

        {activeTab === "achievements" && (
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Badges & Achievements
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Track everything you have unlocked and everything
                  still ahead.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <FunnelIcon className="h-4 w-4 text-slate-500" />

                {["all", "earned", "locked"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setBadgeFilter(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                      badgeFilter === filter
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredBadges.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                <TrophyIcon className="mx-auto h-10 w-10 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No achievements match this filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBadges.map((badge) => {
                  const isEarned = earnedBadgeNames.has(
                    badge?.name,
                  );

                  return (
                    <div
                      key={badge?.id || badge?.name}
                      className={`group rounded-2xl border p-5 transition ${
                        isEarned
                          ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                          : "border-slate-800 bg-slate-900/70 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            isEarned
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-slate-800 text-slate-600"
                          }`}
                        >
                          {isEarned ? (
                            <TrophyIcon className="h-6 w-6" />
                          ) : (
                            <LockClosedIcon className="h-5 w-5" />
                          )}
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${
                            isEarned
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-700 bg-slate-800 text-slate-500"
                          }`}
                        >
                          {isEarned ? "Unlocked" : "Locked"}
                        </span>
                      </div>

                      <h3 className="mt-4 font-bold">
                        {badge?.name}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {badge?.description ||
                          "Complete the requirement to unlock this achievement."}
                      </p>

                      <div className="mt-4 flex justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                        <span>
                          {badge?.category || "General"}
                        </span>

                        <span>
                          Req: {badge?.requirement_value || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            REWARDS
        ==================================================== */}

        {activeTab === "rewards" && (
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Wellness Rewards
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Use the XP you earn from wellness activities to
                  unlock perks.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {["all", "available", "claimed", "locked"].map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRewardFilter(filter)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                        rewardFilter === filter
                          ? "bg-violet-500 text-white"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {filter}
                    </button>
                  ),
                )}
              </div>
            </div>

            {filteredRewards.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                <GiftIcon className="mx-auto h-10 w-10 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No rewards match this filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map((reward) => {
                  const status = getRewardStatus(reward);

                  const canClaim = status === "available";

                  const isClaiming =
                    claimingReward === reward?.id;

                  return (
                    <div
                      key={reward?.id || reward?.name}
                      className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
                            <GiftIcon className="h-6 w-6" />
                          </div>

                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300">
                            {status}
                          </span>
                        </div>

                        <h3 className="mt-4 font-bold">
                          {reward?.name}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {reward?.description || "Wellness reward"}
                        </p>
                      </div>

                      <div className="mt-5 border-t border-slate-800 pt-4">
                        <div className="flex justify-between text-xs font-bold text-violet-300">
                          <span>
                            Cost: {formatNumber(reward?.xp_cost)} XP
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!canClaim || isClaiming}
                          onClick={() =>
                            handleClaimReward(reward)
                          }
                          className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                            canClaim
                              ? "bg-violet-600 text-white hover:bg-violet-500"
                              : "cursor-not-allowed bg-slate-800 text-slate-600"
                          }`}
                        >
                          {isClaiming
                            ? "Claiming..."
                            : status === "claimed" ||
                                status === "redeemed"
                              ? "Already Claimed"
                              : canClaim
                                ? "Claim Reward"
                                : "Locked"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        {activeTab === "analytics" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-black">
                Progress Analytics
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A visual breakdown of your actual gamification
                progress.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* XP */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-amber-400" />

                    <h3 className="font-bold">XP Growth</h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Recent XP activity from the backend.
                  </p>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={xpChartData}>
                      <defs>
                        <linearGradient
                          id="analyticsXpGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.4}
                          />

                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="xp"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#analyticsXpGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BADGES */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-emerald-400" />

                    <h3 className="font-bold">
                      Achievement Progress
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Earned versus locked achievements.
                  </p>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={badgeChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <YAxis
                        allowDecimals={false}
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill="#34d399"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* REWARDS */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <GiftIcon className="h-5 w-5 text-violet-400" />

                    <h3 className="font-bold">
                      Reward Progress
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Claimed, available and locked rewards.
                  </p>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rewardChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <YAxis
                        allowDecimals={false}
                        stroke="#64748b"
                        fontSize={11}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill="#a78bfa"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RADAR */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-cyan-400" />

                    <h3 className="font-bold">
                      Progress Balance
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    XP, consistency, achievements and rewards.
                  </p>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />

                      <PolarAngleAxis
                        dataKey="subject"
                        stroke="#94a3b8"
                        fontSize={11}
                      />

                      <Radar
                        name="Progress"
                        dataKey="value"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            TIMELINE
        ==================================================== */}

        {activeTab === "timeline" && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  XP Progress Timeline
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your latest XP earning activities.
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {xpHistory.length} loaded
              </span>
            </div>

            {xpHistory.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                <SparklesIcon className="mx-auto h-10 w-10 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No XP history available yet.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="space-y-3">
                  {recentHistory.map((item, index) => {
                    const amount = Number(item?.amount || 0);

                    return (
                      <div
                        key={
                          item?.id ||
                          `${item?.created_at}-${index}`
                        }
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                            <BoltIcon className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              {item?.description || "XP Activity"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(item?.created_at)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-black ${
                            amount >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {amount >= 0 ? "+" : ""}
                          {formatNumber(amount)} XP
                        </span>
                      </div>
                    );
                  })}
                </div>

                {hasMoreHistory && (
                  <div className="mt-5 border-t border-slate-800 pt-4 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMoreHistory}
                      disabled={loadingMoreHistory}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                    >
                      <ArrowPathIcon
                        className={`h-4 w-4 ${
                          loadingMoreHistory
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                      {loadingMoreHistory
                        ? "Loading..."
                        : "Load More History"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
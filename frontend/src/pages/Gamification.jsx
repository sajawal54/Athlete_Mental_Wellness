import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  TrophyIcon,
  GiftIcon,
  BoltIcon,
  FireIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ClockIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  getGamificationOverviewAPI,
  claimRewardAPI,
} from "../services/gamificationService";

const EMPTY_ARRAY = [];

export default function Gamification() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingReward, setClaimingReward] = useState(null);

  // XP HISTORY STATES
  const [xpHistory, setXpHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  // POPUP STATES
  const [unlockedBadgePopup, setUnlockedBadgePopup] = useState(null);
  const [claimedRewardPopup, setClaimedRewardPopup] = useState(null);

  const isInitialMount = useRef(true);

  // =========================================================
  // HELPER: REMOVE DUPLICATE HISTORY ITEMS
  // =========================================================

  const getUniqueHistory = useCallback((items) => {
    const seen = new Set();

    return items.filter((item) => {
      const identifier =
        item.id || `${item.created_at}-${item.amount}-${item.description}`;

      if (seen.has(identifier)) {
        return false;
      }

      seen.add(identifier);
      return true;
    });
  }, []);

  // =========================================================
  // FETCH GAMIFICATION OVERVIEW
  // =========================================================

  const fetchGamification = useCallback(async () => {
    try {
      setError("");

      const response = await getGamificationOverviewAPI();

      setData(response);

      // Top 10 items only for initial load
      const rawHistory = Array.isArray(response?.xp_history)
        ? response.xp_history
        : [];

      const latestTen = getUniqueHistory(rawHistory).slice(0, 10);

      setXpHistory(latestTen);
      setHistoryPage(1);
      setHasMoreHistory(rawHistory.length >= 10);
    } catch (err) {
      console.error("Gamification API Error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load gamification data."
      );
    }
  }, [getUniqueHistory]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);

      await fetchGamification();

      if (isMounted) {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchGamification]);

  // =========================================================
  // FETCH MORE XP HISTORY
  // =========================================================

  const handleLoadMoreHistory = async () => {
    if (loadingMoreHistory || !hasMoreHistory) {
      return;
    }

    try {
      setLoadingMoreHistory(true);

      const nextPage = historyPage + 1;

      const response = await axios.get(
        `/api/gamification/xp-history/?page=${nextPage}`
      );

      const newResults = response.data.results || response.data || [];

      if (Array.isArray(newResults) && newResults.length > 0) {
        setXpHistory((prev) =>
          getUniqueHistory([...prev, ...newResults])
        );

        setHistoryPage(nextPage);
        setHasMoreHistory(Boolean(response.data.next));
      } else {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error("Error fetching more XP history:", err);
      setHasMoreHistory(false);
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  // =========================================================
  // SAFE DATA EXTRACTS
  // =========================================================

  const profile = data?.profile || {};

  const badges = Array.isArray(data?.badges)
    ? data.badges
    : EMPTY_ARRAY;

  const earnedBadges = useMemo(() => {
    const value = data?.earned_badges;

    return Array.isArray(value) ? value : EMPTY_ARRAY;
  }, [data?.earned_badges]);

  const rewards = Array.isArray(data?.rewards)
    ? data.rewards
    : EMPTY_ARRAY;

  const userRewards = useMemo(() => {
    const value = data?.user_rewards;

    return Array.isArray(value) ? value : EMPTY_ARRAY;
  }, [data?.user_rewards]);

  // =========================================================
  // EARNED BADGE IDS
  // =========================================================

  const earnedBadgeIds = useMemo(() => {
    return new Set(
      earnedBadges
        .map((badge) => badge.badge_name)
        .filter(Boolean)
    );
  }, [earnedBadges]);

  // =========================================================
  // UNLOCKED BADGE POPUP CHECK
  // =========================================================

  useEffect(() => {
    if (!earnedBadges.length) {
      return;
    }

    const knownEarnedBadges = JSON.parse(
      localStorage.getItem("known_earned_badges") || "[]"
    );

    if (isInitialMount.current) {
      if (knownEarnedBadges.length === 0) {
        const currentBadgeNames = earnedBadges.map(
          (badge) => badge.badge_name
        );

        localStorage.setItem(
          "known_earned_badges",
          JSON.stringify(currentBadgeNames)
        );
      } else {
        const newBadge = earnedBadges.find(
          (badge) =>
            !knownEarnedBadges.includes(badge.badge_name)
        );

        if (newBadge) {
          const updatedBadges = [
            ...knownEarnedBadges,
            newBadge.badge_name,
          ];

          localStorage.setItem(
            "known_earned_badges",
            JSON.stringify(updatedBadges)
          );

          Promise.resolve().then(() =>
            setUnlockedBadgePopup(newBadge)
          );
        }
      }

      isInitialMount.current = false;
    } else {
      const newBadge = earnedBadges.find(
        (badge) =>
          !knownEarnedBadges.includes(badge.badge_name)
      );

      if (newBadge) {
        const updatedBadges = [
          ...knownEarnedBadges,
          newBadge.badge_name,
        ];

        localStorage.setItem(
          "known_earned_badges",
          JSON.stringify(updatedBadges)
        );

        Promise.resolve().then(() =>
          setUnlockedBadgePopup(newBadge)
        );
      }
    }
  }, [earnedBadges]);

  // =========================================================
  // USER REWARD MAP
  // =========================================================

  const userRewardMap = useMemo(() => {
    const map = new Map();

    userRewards.forEach((item) => {
      if (item.reward_name) {
        map.set(item.reward_name, item);
      }
    });

    return map;
  }, [userRewards]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString();
  };

  const formatCategory = (category) => {
    if (!category) {
      return "Achievement";
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const isBadgeEarned = (badge) => {
    return earnedBadgeIds.has(badge.name);
  };

  const getRewardStatus = (reward) => {
    const existingReward = userRewardMap.get(reward.name);

    if (existingReward) {
      return existingReward.status;
    }

    const currentXP = Number(profile?.xp || 0);
    const rewardXP = Number(reward?.xp_cost || 0);

    return currentXP >= rewardXP ? "available" : "locked";
  };

  const getRewardStatusLabel = (status) => {
    switch (status) {
      case "available":
        return "Available";

      case "claimed":
        return "Claimed";

      case "redeemed":
        return "Redeemed";

      default:
        return "Locked";
    }
  };

  const getRewardStatusClasses = (status) => {
    switch (status) {
      case "available":
        return "border-amber-400/30 bg-amber-500/10 text-amber-300";

      case "claimed":
        return "border-blue-400/30 bg-blue-500/10 text-blue-300";

      case "redeemed":
        return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";

      default:
        return "border-slate-700 bg-slate-800/70 text-slate-500";
    }
  };

  // =========================================================
  // CLAIM REWARD
  // =========================================================

  const handleClaimReward = async (reward) => {
    try {
      setClaimingReward(reward.id);
      setError("");

      await claimRewardAPI(reward.id);

      setClaimedRewardPopup(reward);

      await fetchGamification();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Unable to claim this reward."
      );
    } finally {
      setClaimingReward(null);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-10 w-72 rounded-lg bg-slate-800" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl border border-slate-800 bg-slate-900"
              />
            ))}
          </div>

          <div className="mt-8 h-72 rounded-2xl border border-slate-800 bg-slate-900" />
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-violet-400" />

              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
                Gamification
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your Achievements
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Track your XP, level, streaks, badges and rewards.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchGamification}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-800 hover:text-white"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* STATS OVERVIEW */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* XP */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-500/10 p-3">
                <BoltIcon className="h-6 w-6 text-violet-400" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                XP
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-white">
              {profile?.xp ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total experience
            </p>
          </div>

          {/* LEVEL */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-cyan-500/10 p-3">
                <TrophyIcon className="h-6 w-6 text-cyan-400" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Level
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-white">
              {profile?.level ?? 1}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Current level
            </p>
          </div>

          {/* STREAK */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-orange-500/10 p-3">
                <FireIcon className="h-6 w-6 text-orange-400" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Streak
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-white">
              {profile?.streak ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Consecutive days
            </p>
          </div>

          {/* BADGES */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <CheckBadgeIcon className="h-6 w-6 text-emerald-400" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Badges
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-white">
              {earnedBadges.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Achievements unlocked
            </p>
          </div>
        </div>

        {/* BADGES SECTION */}
        <section className="mb-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Badges
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete achievements to unlock badges.
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              {earnedBadges.length}/{badges.length} earned
            </span>
          </div>

          {badges.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <TrophyIcon className="mx-auto h-10 w-10 text-slate-700" />

              <p className="mt-3 text-sm text-slate-500">
                No badges available yet.
              </p>
            </div>
          ) : (
            <div className="max-h-125 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {badges.map((badge) => {
                  const earned = isBadgeEarned(badge);

                  return (
                    <div
                      key={badge.id}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
                        earned
                          ? "border-emerald-500/30 bg-linear-to-br from-emerald-500/10 via-slate-900 to-slate-950 shadow-lg shadow-emerald-950/20"
                          : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                              earned
                                ? "bg-emerald-500/20 text-emerald-400 shadow-inner"
                                : "bg-slate-800 text-slate-600"
                            }`}
                          >
                            {earned ? (
                              <TrophyIcon className="h-7 w-7" />
                            ) : (
                              <LockClosedIcon className="h-6 w-6" />
                            )}
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                              earned
                                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-700 bg-slate-800 text-slate-500"
                            }`}
                          >
                            {earned ? "Unlocked" : "Locked"}
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-semibold text-white">
                          {badge.name}
                        </h3>

                        <p className="mt-2 text-sm leading-5 text-slate-400">
                          {badge.description ||
                            "Complete this achievement to unlock the badge."}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Category
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-slate-300">
                              {formatCategory(badge.category)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Requirement
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-slate-300">
                              {badge.requirement_value}
                            </p>
                          </div>
                        </div>

                        {earned && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            <CheckBadgeIcon className="h-4 w-4" />
                            <span>Unlocked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* REWARDS SECTION */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">
              Rewards
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Use your earned XP to claim wellness rewards.
            </p>
          </div>

          {rewards.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <GiftIcon className="mx-auto h-10 w-10 text-slate-700" />

              <p className="mt-3 text-sm text-slate-500">
                No rewards are currently available.
              </p>
            </div>
          ) : (
            <div className="max-h-125 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => {
                  const rewardStatus = getRewardStatus(reward);
                  const rewardXP = Number(reward.xp_cost || 0);
                  const currentXP = Number(profile?.xp || 0);

                  const canClaim =
                    rewardStatus === "available" &&
                    currentXP >= rewardXP;

                  return (
                    <div
                      key={reward.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:bg-slate-900"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-400 transition-colors group-hover:bg-violet-500/20">
                            <GiftIcon className="h-7 w-7" />
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getRewardStatusClasses(
                              rewardStatus
                            )}`}
                          >
                            {getRewardStatusLabel(rewardStatus)}
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-semibold text-white">
                          {reward.name}
                        </h3>

                        <p className="mt-2 text-sm leading-5 text-slate-400">
                          {reward.description ||
                            "A wellness reward for your progress."}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-violet-500/10 p-1.5">
                              <BoltIcon className="h-4 w-4 text-violet-400" />
                            </div>

                            <span className="text-sm font-bold text-violet-300">
                              {rewardXP} XP
                            </span>
                          </div>

                          {rewardStatus === "locked" && (
                            <LockClosedIcon className="h-4 w-4 text-slate-700" />
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            !canClaim ||
                            claimingReward === reward.id ||
                            rewardStatus === "claimed" ||
                            rewardStatus === "redeemed"
                          }
                          onClick={() => handleClaimReward(reward)}
                          className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                            canClaim
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20 hover:bg-violet-500 hover:shadow-violet-900/30"
                              : "cursor-not-allowed bg-slate-800 text-slate-600"
                          }`}
                        >
                          {claimingReward === reward.id
                            ? "Claiming..."
                            : rewardStatus === "claimed"
                            ? "Already Claimed"
                            : rewardStatus === "redeemed"
                            ? "Redeemed"
                            : rewardStatus === "available"
                            ? "Claim Reward"
                            : "Locked"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* XP HISTORY SECTION */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                XP History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your recent XP activity stream.
              </p>
            </div>

            <span className="text-xs text-slate-500">
              Showing {xpHistory.length} events
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            {xpHistory.length === 0 ? (
              <div className="p-10 text-center">
                <BoltIcon className="mx-auto h-8 w-8 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No XP activity recorded yet.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800">
                  {xpHistory.map((item, idx) => {
                    const amount = Number(item.amount || 0);
                    const positive = amount > 0;

                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between px-5 py-3.5 transition-colors duration-200 hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`rounded-xl p-2.5 ${
                              positive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            <BoltIcon className="h-4 w-4" />
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-slate-200">
                              {item.description || "XP Activity"}
                            </h3>

                            <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                              <span className="capitalize text-slate-400">
                                {item.source || "activity"}
                              </span>

                              <span>•</span>

                              <div className="flex items-center gap-1 text-slate-500">
                                <ClockIcon className="h-3 w-3" />
                                {formatDate(item.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`text-sm font-bold ${
                            positive
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {amount} XP
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* LOAD MORE BUTTON */}
                {hasMoreHistory && (
                  <div className="border-t border-slate-800 bg-slate-900/90 p-3 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMoreHistory}
                      disabled={loadingMoreHistory}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      {loadingMoreHistory
                        ? "Loading..."
                        : "Load More History"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          UNLOCKED BADGE POPUP
      ===================================================== */}

      {unlockedBadgePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-center shadow-2xl shadow-emerald-950/50">
            <button
              type="button"
              onClick={() => setUnlockedBadgePopup(null)}
              className="absolute right-4 top-4 rounded-xl bg-slate-800/80 p-2 text-slate-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <TrophyIcon className="h-10 w-10 animate-bounce" />
            </div>

            <div className="mt-5">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                New Achievement Unlocked!
              </span>

              <h3 className="mt-3 text-2xl font-bold text-white">
                {unlockedBadgePopup.badge_name ||
                  unlockedBadgePopup.name}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {unlockedBadgePopup.badge_description ||
                  unlockedBadgePopup.description ||
                  "Great job!"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setUnlockedBadgePopup(null)}
              className="mt-6 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          CLAIMED REWARD POPUP
      ===================================================== */}

      {claimedRewardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/30 bg-slate-900 p-6 text-center shadow-2xl shadow-violet-950/50">
            <button
              type="button"
              onClick={() => setClaimedRewardPopup(null)}
              className="absolute right-4 top-4 rounded-xl bg-slate-800/80 p-2 text-slate-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/20 text-violet-400 ring-8 ring-violet-500/10">
              <GiftIcon className="h-10 w-10 animate-pulse" />
            </div>

            <div className="mt-5">
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
                Reward Claimed!
              </span>

              <h3 className="mt-3 text-2xl font-bold text-white">
                {claimedRewardPopup.name}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {claimedRewardPopup.description ||
                  "Your reward has been claimed successfully."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setClaimedRewardPopup(null)}
              className="mt-6 w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500"
            >
              Collect & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
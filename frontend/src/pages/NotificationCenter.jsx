import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BellIcon,
  CheckIcon,
  CheckCircleIcon,
  TrophyIcon,
  HeartIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import notificationService from "../services/notificationService";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "achievement", label: "Achievements" },
  { value: "wellness", label: "Wellness" },
  { value: "goal", label: "Goals" },
  { value: "support", label: "Support" },
  { value: "mood", label: "Mood" },
  { value: "streak", label: "Streak" },
  { value: "security", label: "Security" },
];

// ============================================================
// TARGET ROUTE
// ============================================================

const getTargetRoute = (notification) => {
  if (
    notification?.action_url &&
    notification.action_url !== "#"
  ) {
    return notification.action_url;
  }

  switch (notification?.type) {
    case "security":
      return "/settings";

    case "achievement":
      return "/trophy-room";

    case "wellness":
    case "mood":
      return "/wellness-tracker";

    case "goal":
      return "/goals";

    case "support":
      return "/support";

    case "streak":
      return "/dashboard";

    default:
      return undefined;
  }
};

// ============================================================
// NOTIFICATION ICON
// ============================================================

const getNotificationIcon = (type) => {
  switch (type) {
    case "achievement":
      return TrophyIcon;

    case "wellness":
      return HeartIcon;

    case "goal":
      return FlagIcon;

    case "support":
      return ChatBubbleLeftRightIcon;

    case "mood":
      return HeartIcon;

    case "streak":
      return FireIcon;

    case "security":
      return ShieldCheckIcon;

    default:
      return BellIcon;
  }
};

// ============================================================
// NOTIFICATION STYLE
// ============================================================

const getTypeStyle = (type, priority) => {
  if (priority === "critical") {
    return "bg-red-50 text-red-600 border-red-200";
  }

  switch (type) {
    case "achievement":
      return "bg-amber-50 text-amber-600 border-amber-200";

    case "wellness":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";

    case "goal":
      return "bg-indigo-50 text-indigo-600 border-indigo-200";

    case "support":
      return "bg-rose-50 text-rose-600 border-rose-200";

    case "mood":
      return "bg-pink-50 text-pink-600 border-pink-200";

    case "streak":
      return "bg-orange-50 text-orange-600 border-orange-200";

    case "security":
      return "bg-blue-50 text-blue-600 border-blue-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

// ============================================================
// DATE FORMAT
// ============================================================

const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ============================================================
// NOTIFICATION CENTER
// ============================================================

export default function NotificationCenter() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [filter, setFilter] = useState("all");

  const [unreadOnly, setUnreadOnly] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [nextPage, setNextPage] = useState(null);

  // ============================================================
  // SYNC TOP NAV
  // ============================================================

  const notifyTopNav = useCallback((count) => {
    const safeCount = Number.isFinite(Number(count))
      ? Number(count)
      : 0;

    window.dispatchEvent(
      new CustomEvent("notificationsUpdated", {
        detail: {
          unreadCount: safeCount,
        },
      }),
    );
  }, []);

  // ============================================================
  // HANDLE API ERROR
  // ============================================================

  const handleApiError = useCallback((err) => {
    console.error("Notification API error:", err);

    if (err?.response?.status === 401) {
      return "Your login session has expired. Please login again.";
    }

    if (err?.response?.status === 404) {
      return "Notification API endpoint was not found. Check your Django main urls.py.";
    }

    return (
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      "Unable to load notifications. Please try again."
    );
  }, []);

  // ============================================================
  // SET NEXT PAGE
  // ============================================================

  const updateNextPage = useCallback((data) => {
    if (!data?.next) {
      setNextPage(null);
      return;
    }

    try {
      const nextUrl = new URL(data.next);

      const nextPageNumber =
        nextUrl.searchParams.get("page");

      setNextPage(
        nextPageNumber
          ? Number(nextPageNumber)
          : null,
      );
    } catch {
      setNextPage(null);
    }
  }, []);

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications = useCallback(
    async ({ reset = true } = {}) => {
      try {
        setError("");

        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const page = reset ? 1 : nextPage;

        if (!page) {
          return;
        }

        const data =
          await notificationService.getNotifications({
            page,
            type: filter,
            unread: unreadOnly ? "true" : "",
            pageSize: 10,
          });

        const results = Array.isArray(data?.results)
          ? data.results
          : [];

        setNotifications((previous) => {
          if (reset) {
            return results;
          }

          const existingIds = new Set(
            previous.map((item) => item.id),
          );

          const newResults = results.filter(
            (item) => !existingIds.has(item.id),
          );

          return [...previous, ...newResults];
        });

        updateNextPage(data);

        const count = Number(
          data?.unread_count || 0,
        );

        const safeCount = Number.isFinite(count)
          ? count
          : 0;

        setUnreadCount(safeCount);

        notifyTopNav(safeCount);
      } catch (err) {
        const message = handleApiError(err);

        setError(message);

        if (reset) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [
      filter,
      unreadOnly,
      nextPage,
      updateNextPage,
      notifyTopNav,
      handleApiError,
    ],
  );

  // ============================================================
  // INITIAL LOAD / FILTER CHANGE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadFirstPage = async () => {
      try {
        setLoading(true);
        setError("");
        setNextPage(null);

        const data =
          await notificationService.getNotifications({
            page: 1,
            type: filter,
            unread: unreadOnly ? "true" : "",
            pageSize: 10,
          });

        if (!mounted) {
          return;
        }

        const results = Array.isArray(data?.results)
          ? data.results
          : [];

        setNotifications(results);

        updateNextPage(data);

        const count = Number(
          data?.unread_count || 0,
        );

        const safeCount = Number.isFinite(count)
          ? count
          : 0;

        setUnreadCount(safeCount);

        notifyTopNav(safeCount);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message = handleApiError(err);

        setError(message);
        setNotifications([]);
        setUnreadCount(0);

        notifyTopNav(0);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      mounted = false;
    };
  }, [
    filter,
    unreadOnly,
    updateNextPage,
    notifyTopNav,
    handleApiError,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const refreshNotifications = async () => {
    setRefreshing(true);
    setNextPage(null);

    await loadNotifications({
      reset: true,
    });
  };

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const handleMarkRead = async (notification) => {
    if (!notification || notification.is_read) {
      return;
    }

    try {
      setError("");

      // Optimistic UI update
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at:
                  item.read_at ||
                  new Date().toISOString(),
              }
            : item,
        ),
      );

      // Immediately decrease local badge
      setUnreadCount((previousCount) => {
        const newCount = Math.max(
          Number(previousCount) - 1,
          0,
        );

        notifyTopNav(newCount);

        return newCount;
      });

      // ONLY ONE API CALL
      const response =
        await notificationService.markAsRead(
          notification.id,
        );

      // If backend gives exact unread count,
      // use backend value.
      if (
        response?.unread_count !== undefined &&
        response?.unread_count !== null
      ) {
        const backendCount = Number(
          response.unread_count,
        );

        const safeCount = Number.isFinite(
          backendCount,
        )
          ? backendCount
          : 0;

        setUnreadCount(safeCount);
        notifyTopNav(safeCount);
      } else {
        window.dispatchEvent(
          new CustomEvent(
            "notificationsUpdated",
            {
              detail: {
                refresh: true,
              },
            },
          ),
        );
      }
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err,
      );

      // Revert optimistic update
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: false,
              }
            : item,
        ),
      );

      setUnreadCount((previousCount) => {
        const restoredCount =
          Number(previousCount) + 1;

        notifyTopNav(restoredCount);

        return restoredCount;
      });

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to mark this notification as read.",
      );
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setError("");

      // Optimistic UI
      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
          read_at:
            item.read_at ||
            new Date().toISOString(),
        })),
      );

      // Badge disappears IMMEDIATELY
      setUnreadCount(0);
      notifyTopNav(0);

      // ONLY ONE API CALL
      const response =
        await notificationService.markAllAsRead();

      const backendCount = Number(
        response?.unread_count ?? 0,
      );

      const safeCount = Number.isFinite(
        backendCount,
      )
        ? backendCount
        : 0;

      setUnreadCount(safeCount);

      // Immediately update TopNav
      notifyTopNav(safeCount);
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err,
      );

      // Refresh from backend if request fails
      await loadNotifications({
        reset: true,
      });

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to mark all notifications as read.",
      );
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (notificationId) => {
    const notificationToDelete =
      notifications.find(
        (item) => item.id === notificationId,
      );

    try {
      setError("");

      // Optimistic delete
      setNotifications((previous) =>
        previous.filter(
          (item) => item.id !== notificationId,
        ),
      );

      if (!notificationToDelete?.is_read) {
        setUnreadCount((previousCount) => {
          const newCount = Math.max(
            Number(previousCount) - 1,
            0,
          );

          notifyTopNav(newCount);

          return newCount;
        });
      }

      const response =
        await notificationService.deleteNotification(
          notificationId,
        );

      if (
        response?.unread_count !== undefined &&
        response?.unread_count !== null
      ) {
        const backendCount = Number(
          response.unread_count,
        );

        const safeCount = Number.isFinite(
          backendCount,
        )
          ? backendCount
          : 0;

        setUnreadCount(safeCount);
        notifyTopNav(safeCount);
      } else {
        window.dispatchEvent(
          new CustomEvent(
            "notificationsUpdated",
            {
              detail: {
                refresh: true,
              },
            },
          ),
        );
      }
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err,
      );

      await loadNotifications({
        reset: true,
      });

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to delete this notification.",
      );
    }
  };

  // ============================================================
  // NOTIFICATION CLICK
  // ============================================================

  const handleNotificationClick = async (
    notification,
  ) => {
    if (!notification) {
      return;
    }

    await handleMarkRead(notification);

    const targetRoute =
      getTargetRoute(notification);

    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  // ============================================================
  // LOAD MORE
  // ============================================================

  const handleLoadMore = async () => {
    if (!nextPage || loadingMore) {
      return;
    }

    await loadNotifications({
      reset: false,
    });
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* HEADER */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3">
              <BellIcon className="h-7 w-7 text-indigo-600" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-950">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black text-white">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Stay updated with your wellness,
                goals, achievements, and security
                notifications.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshNotifications}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />

              Mark All Read
            </button>
          </div>
        </div>
      </section>

      {/* FILTERS */}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-slate-400" />

            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Filter
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFilter(item.value)
                }
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                  filter === item.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) =>
                setUnreadOnly(
                  event.target.checked,
                )
              }
              className="h-4 w-4 accent-indigo-600"
            />

            Unread only
          </label>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-800">
              {error}
            </p>

            <button
              type="button"
              onClick={refreshNotifications}
              className="mt-2 text-xs font-black text-amber-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-indigo-500" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            Loading notifications...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        /* EMPTY */

        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
            <BellIcon className="h-8 w-8 text-slate-400" />
          </div>

          <h2 className="mt-5 text-lg font-black text-slate-900">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You're all caught up. New wellness,
            achievement, goal, and security
            notifications will appear here.
          </p>
        </div>
      ) : (
        /* NOTIFICATIONS LIST */

        <section className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(
              notification.type,
            );

            const iconStyle = getTypeStyle(
              notification.type,
              notification.priority,
            );

            const isCritical =
              notification.priority ===
              "critical";

            return (
              <article
                key={notification.id}
                className={`group rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  notification.is_read
                    ? "border-slate-200"
                    : isCritical
                      ? "border-red-300"
                      : "border-indigo-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* ICON */}

                  <button
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification,
                      )
                    }
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconStyle}`}
                    aria-label="Open notification"
                  >
                    <Icon className="h-6 w-6" />
                  </button>

                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm font-black ${
                              notification.is_read
                                ? "text-slate-700"
                                : "text-slate-950"
                            }`}
                          >
                            {notification.title}
                          </h3>

                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                          )}

                          {isCritical && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-700">
                              Critical
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[11px] font-bold text-slate-400">
                          {formatDate(
                            notification.created_at,
                          )}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                        {notification.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification,
                        )
                      }
                      className="mt-3 block text-left"
                    >
                      <p className="text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                    </button>

                    {/* ACTIONS */}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkRead(
                              notification,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <CheckCircleIcon className="h-4 w-4" />

                          Mark as read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(
                            notification,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-700 transition hover:bg-slate-200"
                      >
                        Open

                        <ChevronDownIcon className="h-3.5 w-3.5 -rotate-90" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            notification.id,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black text-red-500 transition hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />

                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* LOAD MORE */}

          {nextPage && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                )}

                {loadingMore
                  ? "Loading..."
                  : "Load More"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfileAPI } from "../services/profileService";
import notificationService from "../services/notificationService";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  notifications_enabled: true,
  goal_reminders: true,
  wellness_updates: true,
  achievement_updates: true,
  security_notifications: true,
};

export default function Settings() {
  const navigate = useNavigate();

  // =========================================================
  // USER PROFILE
  // =========================================================

  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    avatar: null,
  });

  const [avatarError, setAvatarError] = useState(false);

  // =========================================================
  // THEME
  // =========================================================

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // =========================================================
  // NOTIFICATION PREFERENCES
  // =========================================================

  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState(null);

  // =========================================================
  // FORMAT AVATAR URL
  // =========================================================

  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      return null;
    }

    if (
      avatarPath.startsWith("http://") ||
      avatarPath.startsWith("https://") ||
      avatarPath.startsWith("blob:")
    ) {
      return avatarPath;
    }

    return `${API_BASE_URL}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
  };

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await getProfileAPI();

        setUserProfile(data);
      } catch (error) {
        console.error(
          "Failed to load settings profile overview:",
          error
        );
      }
    };

    fetchProfileData();
  }, []);

  // =========================================================
  // LOAD NOTIFICATION PREFERENCES FROM BACKEND
  // =========================================================

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        setNotificationsLoading(true);

        const data = await notificationService.getPreferences();

        setNotifications({
          notifications_enabled:
            data?.notifications_enabled ?? true,

          goal_reminders:
            data?.goal_reminders ?? true,

          wellness_updates:
            data?.wellness_updates ?? true,

          achievement_updates:
            data?.achievement_updates ?? true,

          security_notifications:
            data?.security_notifications ?? true,
        });
      } catch (error) {
        console.error(
          "Failed to load notification preferences:",
          error
        );

        toast.error(
          "Unable to load notification preferences."
        );
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotificationPreferences();
  }, []);

  // =========================================================
  // UPDATE NOTIFICATION PREFERENCE
  // =========================================================

  const handleNotificationChange = async (key) => {
    if (savingPreference) {
      return;
    }

    const previousValue = notifications[key];
    const nextValue = !previousValue;

    // Optimistic UI update
    setNotifications((prev) => ({
      ...prev,
      [key]: nextValue,
    }));

    setSavingPreference(key);

    try {
      const updatedPreferences =
        await notificationService.updatePreferences({
          [key]: nextValue,
        });

      setNotifications({
        notifications_enabled:
          updatedPreferences?.notifications_enabled ?? true,

        goal_reminders:
          updatedPreferences?.goal_reminders ?? true,

        wellness_updates:
          updatedPreferences?.wellness_updates ?? true,

        achievement_updates:
          updatedPreferences?.achievement_updates ?? true,

        security_notifications:
          updatedPreferences?.security_notifications ?? true,
      });

      const messages = {
        notifications_enabled: nextValue
          ? "All notifications enabled."
          : "All optional notifications disabled.",

        goal_reminders: nextValue
          ? "Goal reminders enabled."
          : "Goal reminders disabled.",

        wellness_updates: nextValue
          ? "Wellness notifications enabled."
          : "Wellness notifications disabled.",

        achievement_updates: nextValue
          ? "Achievement notifications enabled."
          : "Achievement notifications disabled.",

        security_notifications: nextValue
          ? "Security notifications enabled."
          : "Security notifications disabled.",
      };

      toast.success(messages[key]);
    } catch (error) {
      console.error(
        "Failed to update notification preference:",
        error
      );

      // Rollback UI if API fails
      setNotifications((prev) => ({
        ...prev,
        [key]: previousValue,
      }));

      toast.error(
        "Failed to update notification preference."
      );
    } finally {
      setSavingPreference(null);
    }
  };

  // =========================================================
  // THEME TOGGLE
  // =========================================================

  const toggleTheme = () => {
    const nextMode = !isDarkMode;

    setIsDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");

      localStorage.setItem(
        "app-theme",
        "dark"
      );

      toast.success("Dark Mode Enabled");
    } else {
      document.documentElement.classList.remove("dark");

      localStorage.setItem(
        "app-theme",
        "light"
      );

      toast.success("Light Mode Enabled");
    }
  };

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // TOGGLE COMPONENT
  // =========================================================

  const NotificationToggle = ({
    settingKey,
    label,
    description,
  }) => {
    const enabled = notifications[settingKey];

    const isSaving = savingPreference === settingKey;

    return (
      <div className="flex items-center justify-between gap-5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </p>

          <p className="text-[11px] text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        <button
          type="button"
          disabled={
            notificationsLoading ||
            Boolean(savingPreference)
          }
          onClick={() =>
            handleNotificationChange(settingKey)
          }
          aria-label={`Toggle ${label}`}
          aria-pressed={enabled}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none ${
            notificationsLoading ||
            Boolean(savingPreference)
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          } ${
            enabled
              ? "bg-indigo-600"
              : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />

          {isSaving && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </span>
          )}
        </button>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 dark:bg-slate-900 min-h-screen">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <h2 className="text-lg font-black tracking-wider uppercase text-slate-800 dark:text-white">
          System Settings
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your application preferences, appearance,
          notifications, and account settings.
        </p>
      </div>

      {/* =====================================================
          1. USER SUMMARY
      ====================================================== */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-linear-to-tr from-indigo-600 to-violet-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 border border-slate-100 dark:border-slate-800">

            {userProfile.avatar && !avatarError ? (
              <img
                src={formatAvatarUrl(userProfile.avatar)}
                alt={
                  userProfile.username ||
                  "User Avatar"
                }
                onError={() =>
                  setAvatarError(true)
                }
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(
                userProfile.username
              )
            )}

          </div>

          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">

              {userProfile.username ||
                "Loading User..."}

              <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md uppercase border border-emerald-200 dark:border-emerald-800">
                Active
              </span>

            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userProfile.email ||
                "user@example.com"}
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200/60 dark:border-indigo-800 transition-all cursor-pointer active:scale-95"
        >
          <PencilSquareIcon className="w-4 h-4" />

          <span>Edit Profile</span>
        </button>

      </div>

      {/* =====================================================
          2. APPEARANCE
      ====================================================== */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">

        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">

          {isDarkMode ? (
            <MoonIcon className="w-4 h-4 text-indigo-500" />
          ) : (
            <SunIcon className="w-4 h-4 text-amber-500" />
          )}

          Appearance & Theme

        </h3>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">

          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Dark Background Mode
            </p>

            <p className="text-[11px] text-slate-400">
              Switch between standard light interface
              and contrast dark background.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            aria-pressed={isDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              isDarkMode
                ? "bg-indigo-600"
                : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>

        </div>

      </div>

      {/* =====================================================
          3. NOTIFICATIONS
      ====================================================== */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5 transition-colors">

        <div className="flex items-center justify-between gap-3">

          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">

            <BellIcon className="w-4 h-4 text-indigo-500" />

            Notifications & Reminders

          </h3>

          {!notificationsLoading && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900">

              <CheckCircleIcon className="w-3 h-3" />

              Synced

            </span>
          )}

        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">

          {notificationsLoading ? (
            <div className="space-y-4 py-3">

              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />

              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />

              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />

            </div>
          ) : (
            <>

              {/* MASTER SWITCH */}

              <div className="flex items-center justify-between gap-5 py-3 mb-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 px-3">

                <div className="min-w-0">

                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Enable Notifications
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Master switch for all optional
                    notification categories.
                  </p>

                </div>

                <button
                  type="button"
                  disabled={Boolean(savingPreference)}
                  onClick={() =>
                    handleNotificationChange(
                      "notifications_enabled"
                    )
                  }
                  aria-label="Toggle all notifications"
                  aria-pressed={
                    notifications.notifications_enabled
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none ${
                    savingPreference
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    notifications.notifications_enabled
                      ? "bg-indigo-600"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      notifications.notifications_enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>

              </div>

              {/* CATEGORY SETTINGS */}

              <div
                className={`divide-y divide-slate-100 dark:divide-slate-800 ${
                  !notifications.notifications_enabled
                    ? "opacity-50"
                    : ""
                }`}
              >

                <NotificationToggle
                  settingKey="goal_reminders"
                  label="Daily Goal Reminders"
                  description="Receive reminders about unfinished daily goals."
                />

                <NotificationToggle
                  settingKey="wellness_updates"
                  label="Wellness Updates"
                  description="Receive updates and reminders related to wellness modules."
                />

                <NotificationToggle
                  settingKey="achievement_updates"
                  label="Achievements & Streaks"
                  description="Receive level-up, achievement, trophy, and streak notifications."
                />

                <NotificationToggle
                  settingKey="security_notifications"
                  label="Security Notifications"
                  description="Receive important account and security alerts."
                />

              </div>

              {/* ALWAYS AVAILABLE TYPES */}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Important Notifications
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">

                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Mood
                    </p>

                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Enabled
                    </p>

                  </div>

                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">

                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Support
                    </p>

                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Enabled
                    </p>

                  </div>

                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">

                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      System
                    </p>

                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Enabled
                    </p>

                  </div>

                </div>

                <p className="text-[9px] text-slate-400 mt-3">
                  Mood, support, and system notifications
                  remain available for important application
                  communication.
                </p>

              </div>

            </>
          )}

        </div>

      </div>

      {/* =====================================================
          4. SECURITY
      ====================================================== */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">

        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">

          <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />

          Account Security

        </h3>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">

          <div>

            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Password Update
            </p>

            <p className="text-[11px] text-slate-400">
              Change your password directly from your
              main profile edit drawer.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Manage Password
          </button>

        </div>

      </div>

    </div>
  );
}
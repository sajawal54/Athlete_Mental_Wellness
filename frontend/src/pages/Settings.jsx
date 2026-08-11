import {
  SunIcon,
  MoonIcon,
  BellIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfileAPI } from "../services/profileService";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function Settings() {
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    avatar: null,
  });

  const [avatarError, setAvatarError] = useState(false);

  // Theme State Initialization with System Preference Fallback
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Notification Preference State (Persisted in Local Storage)
  const [notifications, setNotifications] = useState(() => {
    const savedNotifs = localStorage.getItem("app-notifications");

    return savedNotifs
      ? JSON.parse(savedNotifs)
      : {
          emailAlerts: true,
          goalReminders: true,
          securityNotifs: false,
        };
  });

  // Helper function to build correct avatar image URL
  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;

    if (
      avatarPath.startsWith("http://") ||
      avatarPath.startsWith("https://") ||
      avatarPath.startsWith("blob:")
    ) {
      return avatarPath;
    }

    return `${API_BASE_URL}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
  };

  useEffect(() => {
    // Fetch profile info for top summary card
    const fetchProfileData = async () => {
      try {
        const data = await getProfileAPI();
        setUserProfile(data);
      } catch (err) {
        console.error("Failed to load settings profile overview", err);
      }
    };

    fetchProfileData();
  }, []);

  // Sync Notifications State to LocalStorage
  const handleNotificationChange = (key) => {
    setNotifications((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };

      localStorage.setItem("app-notifications", JSON.stringify(updated));

      return updated;
    });
  };

  // Handle Functional Theme Toggle
  const toggleTheme = () => {
    const nextMode = !isDarkMode;

    setIsDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app-theme", "dark");
      toast.success("Dark Mode Enabled");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app-theme", "light");
      toast.success("Light Mode Enabled");
    }
  };

  const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "U");

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 dark:bg-slate-900 min-h-screen">
      {/* Header Title */}
      <div>
        <h2 className="text-lg font-black tracking-wider uppercase text-slate-800 dark:text-white">
          System Settings
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your application preferences, appearance, and account setup.
        </p>
      </div>

      {/* 1. USER SUMMARY CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-linear-to-tr from-indigo-600 to-violet-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 border border-slate-100 dark:border-slate-800">
            {userProfile.avatar && !avatarError ? (
              <img
                src={formatAvatarUrl(userProfile.avatar)}
                alt={userProfile.username || "User Avatar"}
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(userProfile.username)
            )}
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {userProfile.username || "Loading User..."}

              <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md uppercase border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userProfile.email || "user@example.com"}
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

      {/* 2. FUNCTIONAL THEME / APPEARANCE */}
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
              Switch between standard light interface and contrast dark
              background.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              isDarkMode ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. NOTIFICATIONS SETUP */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-indigo-500" />
            Notifications & Reminders
          </h3>

          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            Future API Sync
          </span>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Email Updates & Weekly Digest
            </span>

            <input
              type="checkbox"
              checked={notifications.emailAlerts}
              onChange={() => handleNotificationChange("emailAlerts")}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Daily Wellness & Goal Reminders
            </span>

            <input
              type="checkbox"
              checked={notifications.goalReminders}
              onChange={() => handleNotificationChange("goalReminders")}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. SECURITY & SESSION */}
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
              Change your password directly from your main profile edit drawer.
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

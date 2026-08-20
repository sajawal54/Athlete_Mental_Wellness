import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import notificationService from "../../services/notificationService";
import { logout } from "../../redux/slices/authSlice";
import {
  getProfileAPI,
  updateProfileAPI,
} from "../../services/profileService";
import { emergencyService } from "../../services/emergencySupportService";
import toast from "react-hot-toast";

const SEARCH_ITEMS = [
  {
    id: "mood",
    title: "Mood Check-In",
    description: "Track your daily mood and wellness",
    keywords: ["mood", "check-in", "checkin", "wellness", "emotion"],
    path: "/mood-checkin",
  },
  {
    id: "goals",
    title: "Daily Goal",
    description: "Manage your daily wellness goals",
    keywords: ["goal", "goals", "daily goal", "target", "focus"],
    path: "/goals",
  },
  {
    id: "xp",
    title: "Total XP",
    description: "View your XP and athlete account level",
    keywords: ["xp", "experience", "points", "level", "total xp"],
    path: "/profile",
  },
  {
    id: "streak",
    title: "Current Streak",
    description: "Track your consistency and daily streak",
    keywords: ["streak", "days", "consistency"],
    path: "/dashboard",
  },
  {
    id: "recent-mood",
    title: "Recent Mood Activity",
    description: "View your recent wellness check-ins",
    keywords: [
      "recent mood",
      "mood activity",
      "history",
      "activity",
      "check-ins",
    ],
    path: "/mood-checkin",
  },
  {
    id: "ai-coach",
    title: "AI Coach",
    description: "Reflect with your AI mental wellness guide",
    keywords: ["ai", "coach", "ai coach", "guide", "mental", "reflection"],
    path: "/bio-guide",
  },
  {
    id: "bio-guide",
    title: "Bio Guide",
    description: "Get mental wellness guidance from AI",
    keywords: ["bio", "bio guide", "guide", "ai guide"],
    path: "/bio-guide",
  },
  {
    id: "affirmations",
    title: "Daily Affirmation",
    description: "Build mindset and mental resilience",
    keywords: [
      "affirmation",
      "affirmations",
      "mindset",
      "resilience",
      "motivation",
    ],
    path: "/affirmations",
  },
];

const INITIAL_PASSWORDS = {
  new_password: "",
  confirm_password: "",
};

export default function TopNav({ setSidebarOpen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    is_counselor: false,
    avatar: null,
  });

  const [editUsername, setEditUsername] = useState("");
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);

  const [loading, setLoading] = useState(false);

  const [counselors, setCounselors] = useState([]);
  const [counselorsLoading, setCounselorsLoading] = useState(false);
  const [counselorsError, setCounselorsError] = useState("");

  // ============================================================
  // NOTIFICATION STATE
  // ============================================================

  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ============================================================
  // AVATAR
  // ============================================================

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

    return `http://127.0.0.1:8000${
      avatarPath.startsWith("/") ? "" : "/"
    }${avatarPath}`;
  };

  // ============================================================
  // PROFILE
  // ============================================================

  const fetchProfile = async () => {
    try {
      const data = await getProfileAPI();

      setUserProfile({
        username: data?.username || "",
        email: data?.email || "",
        is_counselor: Boolean(data?.is_counselor),
        avatar: data?.avatar || null,
      });

      setEditUsername(data?.username || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ============================================================
  // NOTIFICATION UNREAD COUNT
  // ============================================================

  useEffect(() => {
    let mounted = true;
    let timer = null;
    let fetching = false;

    const fetchUnreadCount = async () => {
      if (!mounted || fetching) {
        return;
      }

      fetching = true;

      try {
        const data = await notificationService.getNotifications({
          unread: "true",
          page: 1,
          pageSize: 1,
        });

        if (!mounted) {
          return;
        }

        const count = Number(data?.unread_count ?? 0);

        setUnreadCount(
          Number.isFinite(count) && count > 0 ? count : 0
        );
      } catch (error) {
        console.error(
          "Failed to fetch unread notification count:",
          error
        );
      } finally {
        fetching = false;
      }
    };

    // ========================================================
    // REPEATED CHECK
    // ========================================================

    const scheduleNextCheck = () => {
      if (!mounted) {
        return;
      }

      timer = setTimeout(async () => {
        await fetchUnreadCount();
        scheduleNextCheck();
      }, 2000);
    };

    // ========================================================
    // INITIAL CHECK
    // ========================================================

    fetchUnreadCount().then(() => {
      scheduleNextCheck();
    });

    // ========================================================
    // NOTIFICATION EVENT
    // ========================================================

    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "notificationsUpdated",
      handleNotificationsUpdated
    );

    // ========================================================
    // TAB VISIBILITY
    // ========================================================

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    // ========================================================
    // WINDOW FOCUS
    // ========================================================

    const handleWindowFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      mounted = false;

      if (timer) {
        clearTimeout(timer);
      }

      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationsUpdated
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, []);

  // ============================================================
  // CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // USER INITIALS
  // ============================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name.slice(0, 2).toUpperCase();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredSearchItems = SEARCH_ITEMS.filter((item) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return false;
    }

    const searchableText = [
      item.title,
      item.description,
      ...item.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchQuery(value);
    setSearchOpen(Boolean(value.trim()));
  };

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchQuery("");
      setSearchOpen(false);
    }

    if (
      event.key === "Enter" &&
      filteredSearchItems.length > 0
    ) {
      handleSearchSelect(
        filteredSearchItems[0].path
      );
    }
  };

  // ============================================================
  // PROFILE UPDATE
  // ============================================================

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    if (
      passwords.new_password &&
      passwords.new_password !== passwords.confirm_password
    ) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        username: editUsername,
      };

      if (passwords.new_password) {
        payload.password = passwords.new_password;
      }

      const data = await updateProfileAPI(payload);

      setUserProfile((previous) => ({
        ...previous,
        username: data?.username || editUsername,
        avatar: data?.avatar || previous.avatar,
      }));

      setEditUsername(
        data?.username || editUsername
      );

      toast.success(
        "Profile updated successfully!"
      );

      setPasswords(INITIAL_PASSWORDS);
      setActivePopup(null);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to update profile";

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // COUNSELORS
  // ============================================================

  const loadCounselors = async () => {
    setCounselorsLoading(true);
    setCounselorsError("");

    try {
      const response =
        await emergencyService.getCounselors();

      const counselorList =
        response?.counselors || [];

      setCounselors(counselorList);

      if (counselorList.length === 0) {
        setCounselorsError(
          "No counselors are currently available."
        );
      }
    } catch (error) {
      console.error(
        "Error loading counselors:",
        error
      );

      setCounselors([]);
      setCounselorsError(
        "Unable to load counselors. Please try again."
      );
    } finally {
      setCounselorsLoading(false);
    }
  };

  const handleBookSession = async () => {
    setActivePopup("counselors");
    await loadCounselors();
  };

  const handleContactCounselor = (counselor) => {
    const counselorEmail =
      counselor?.contact_email;

    if (!counselorEmail) {
      toast.error(
        "This counselor does not have an email address available."
      );
      return;
    }

    const counselorName =
      counselor?.name || "Doctor";

    const username =
      userProfile?.username || "an athlete";

    const subject = encodeURIComponent(
      "Counseling Support Request"
    );

    const body = encodeURIComponent(
      `Hello ${counselorName},

My name is ${username}. I would like to reach out for counseling support.

Thank you.`
    );

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(counselorEmail)}` +
      `&su=${subject}` +
      `&body=${body}`;

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // AVATAR URL
  // ============================================================

  const avatarUrl = formatAvatarUrl(
    userProfile.avatar
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ====================================================== */}
      {/* TOP NAV */}
      {/* ====================================================== */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                (previous) => !previous
              )
            }
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-white">
              Executive Workspace
            </h1>

            <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
              Welcome back,{" "}
              {userProfile.username || "User"}
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div
          ref={searchRef}
          className="mx-4 hidden max-w-sm flex-1 md:block"
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </span>

            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search dashboard..."
              aria-label="Search dashboard"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800"
            />

            {searchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {filteredSearchItems.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto p-2">
                    <p className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Dashboard Results
                    </p>

                    {filteredSearchItems.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            handleSearchSelect(
                              item.path
                            )
                          }
                          className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {item.title}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <MagnifyingGlassIcon className="mx-auto h-6 w-6 text-slate-400" />

                    <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      No dashboard result found
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Try searching mood, goals, XP,
                      streak, coach or affirmation.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="hidden items-center gap-2 xl:flex">
          <button
            type="button"
            onClick={() =>
              navigate("/mood-checkin")
            }
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200/60 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            <PlusCircleIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>+ Log Entry</span>
          </button>

          <button
            type="button"
            onClick={handleBookSession}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <CalendarDaysIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Book Session</span>
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* SETTINGS */}
          <button
            type="button"
            onClick={() =>
              navigate("/settings")
            }
            title="Open Settings"
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>

          {/* ================================================= */}
          {/* NOTIFICATION BELL */}
          {/* ================================================= */}

          <Link
            to="/notifications"
            onClick={() => {
              window.dispatchEvent(
                new Event("notificationsUpdated")
              );
            }}
            className="relative flex items-center justify-center rounded-xl p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Open notifications"
            title="Notifications"
          >
            <BellIcon className="h-5 w-5" />

            {/* UNREAD BADGE */}
            {unreadCount > 0 && (
              <span
                className="
                  absolute -right-0.5 -top-0.5
                  flex h-5 min-w-5
                  items-center justify-center
                  rounded-full
                  bg-linear-to-br from-red-500 to-rose-600
                  px-1
                  text-[10px]
                  font-black
                  text-white
                  shadow-lg
                  ring-2 ring-white
                  transition-all duration-200
                  dark:ring-slate-900
                "
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </Link>

          {/* USER */}
          <div
            className="relative"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() =>
                setDropdownOpen(
                  (previous) => !previous
                )
              }
              className="flex items-center gap-2.5 rounded-2xl border border-transparent p-1.5 transition-all hover:border-slate-200 hover:bg-slate-100 focus:outline-none dark:hover:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Open user menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-600/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(
                    userProfile.username
                  )
                )}
              </div>

              <span className="hidden max-w-28 truncate text-xs font-bold text-slate-700 dark:text-slate-200 sm:inline">
                {userProfile.username ||
                  "User"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-50 mt-3 w-60 rounded-2xl border border-slate-200/80 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="rounded-t-2xl border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Signed in as
                  </p>

                  <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                    {userProfile.username ||
                      "User"}
                  </p>
                </div>

                <div className="space-y-1 px-1.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/profile");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                  >
                    <UserCircleIcon className="h-4 w-4 text-slate-400" />
                    <span>
                      Athlete Profile Page
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                  >
                    <Cog6ToothIcon className="h-4 w-4 text-slate-400" />
                    <span>
                      Settings & Preferences
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setActivePopup("update");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                  >
                    <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                    <span>
                      Quick Account Edit
                    </span>
                  </button>
                </div>

                <div className="mt-1 border-t border-slate-100 px-1.5 pt-1.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================== */}
      {/* COUNSELORS DRAWER */}
      {/* ====================================================== */}

      {activePopup === "counselors" && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-indigo-100 p-2 dark:bg-indigo-900/40">
                    <UserGroupIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Counselor Support
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Connect with a counselor and
                  request support through email.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActivePopup(null)
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close counselors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {counselorsLoading ? (
                <div className="flex min-h-60 items-center justify-center">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Loading counselors...
                  </div>
                </div>
              ) : counselorsError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {counselorsError}
                      </p>

                      <button
                        type="button"
                        onClick={loadCounselors}
                        className="mt-3 text-xs font-bold text-amber-700 underline dark:text-amber-400"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {counselors.map(
                    (counselor) => (
                      <div
                        key={counselor.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-800"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40">
                            <UserGroupIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                              {counselor.name ||
                                "Counselor"}
                            </h3>

                            {counselor.specialization && (
                              <p className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {
                                  counselor.specialization
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {counselor.bio && (
                          <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">
                            {counselor.bio}
                          </p>
                        )}

                        {counselor.availability && (
                          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Availability
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {
                                counselor.availability
                              }
                            </p>
                          </div>
                        )}

                        {counselor.contact_email ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleContactCounselor(
                                counselor
                              )
                            }
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99]"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                            Contact Counselor via
                            Gmail
                          </button>
                        ) : (
                          <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-center text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                            Email contact is not
                            available
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setActivePopup(null)
                }
                className="w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* PROFILE DRAWER */}
      {/* ====================================================== */}

      {activePopup === "profile" && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-sm flex-col justify-between border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                  Account Overview
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setActivePopup(null)
                  }
                  className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close profile"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-indigo-100 bg-indigo-50 text-2xl font-extrabold text-indigo-600 shadow-inner dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(
                      userProfile.username
                    )
                  )}
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-left dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Username
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white">
                      {userProfile.username ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Email Address
                    </p>

                    <p className="mt-0.5 break-all text-xs font-bold text-slate-800 dark:text-white">
                      {userProfile.email ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      System Role
                    </p>

                    <span className="mt-1 inline-block rounded-lg bg-indigo-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {userProfile.is_counselor
                        ? "Counselor"
                        : "Athlete Member"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setActivePopup("update")
                }
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
              >
                Edit & Update Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* UPDATE DRAWER */}
      {/* ====================================================== */}

      {activePopup === "update" && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-sm flex-col justify-between border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePopup("profile")
                    }
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Back to profile"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>

                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                    Edit Settings
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActivePopup(null)
                  }
                  className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close update profile"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleUpdateSubmit}
                id="update-form"
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="edit-username"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Username
                  </label>

                  <input
                    id="edit-username"
                    type="text"
                    value={editUsername}
                    onChange={(event) =>
                      setEditUsername(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Password Update{" "}
                    <span className="font-normal lowercase text-slate-400">
                      (optional)
                    </span>
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-1 block text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                      >
                        New Password
                      </label>

                      <input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={
                          passwords.new_password
                        }
                        onChange={(event) =>
                          setPasswords(
                            (previous) => ({
                              ...previous,
                              new_password:
                                event.target.value,
                            })
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-1 block text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                      >
                        Confirm New Password
                      </label>

                      <input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={
                          passwords.confirm_password
                        }
                        onChange={(event) =>
                          setPasswords(
                            (previous) => ({
                              ...previous,
                              confirm_password:
                                event.target.value,
                            })
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setActivePopup("profile")
                }
                className="w-1/3 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Back
              </button>

              <button
                type="submit"
                form="update-form"
                disabled={loading}
                className="w-2/3 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
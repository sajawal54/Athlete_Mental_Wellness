import { useCallback, useEffect, useState } from "react";
import {
  UserIcon,
  CameraIcon,
  TrophyIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getProfileAPI,
  updateProfileAPI,
} from "../services/profileService";

export default function Profile() {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone_number: "",
    age: "",
    is_counselor: false,
    sport: "",
    team: "",
    position: "",
    personal_goals: "",
    preferences: "",
    email_notifications: true,
    reminder_notifications: true,
    theme_preference: "dark",
    profile_visibility: "private",
  });

  const [isEditing, setIsEditing] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Password state
  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // AVATAR URL HELPER
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

    return `http://127.0.0.1:8000${
      avatarPath.startsWith("/") ? "" : "/"
    }${avatarPath}`;
  };

  // =========================================================
  // FETCH PROFILE
  // =========================================================

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProfileAPI();

      setProfileData({
        username: data.username || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        age: data.age ?? "",
        is_counselor: data.is_counselor || false,
        sport: data.sport || "",
        team: data.team || "",
        position: data.position || "",
        personal_goals: data.personal_goals || "",
        preferences: data.preferences || "",
        email_notifications:
          data.email_notifications ?? true,
        reminder_notifications:
          data.reminder_notifications ?? true,
        theme_preference:
          data.theme_preference || "dark",
        profile_visibility:
          data.profile_visibility || "private",
      });

      if (data.avatar) {
        setAvatarPreview(
          formatAvatarUrl(data.avatar)
        );
      } else {
        setAvatarPreview(null);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);

      setError(
        "Failed to load profile information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD PROFILE ON MOUNT
  // =========================================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  // =========================================================
  // PROFILE INPUT HANDLER
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================================
  // PASSWORD INPUT HANDLER
  // =========================================================

  const handlePasswordInput = (e) => {
    const {
      name,
      value,
    } = e.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // AVATAR CHANGE
  // =========================================================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Revoke previous blob URL
    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(file);

    setAvatarPreview(
      URL.createObjectURL(file)
    );
  };

  // =========================================================
  // CANCEL EDITING
  // =========================================================

  const handleCancelEdit = () => {
    setIsEditing(false);

    setError("");
    setMessage("");

    setAvatarFile(null);

    setPasswords({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });

    fetchProfile();
  };

  // =========================================================
  // PROFILE UPDATE
  // =========================================================

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // =======================================================
    // PASSWORD VALIDATION
    // =======================================================

    if (passwords.new_password) {
      // Current password required
      if (!passwords.old_password) {
        setError(
          "Please enter your current password."
        );
        return;
      }

      // Confirm password
      if (
        passwords.new_password !==
        passwords.confirm_password
      ) {
        setError(
          "New passwords do not match!"
        );
        return;
      }

      // Prevent same password
      if (
        passwords.old_password ===
        passwords.new_password
      ) {
        setError(
          "New password must be different from your current password."
        );
        return;
      }
    }

    // If confirmation is entered without new password
    if (
      passwords.confirm_password &&
      !passwords.new_password
    ) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    // If current password is entered without new password
    if (
      passwords.old_password &&
      !passwords.new_password
    ) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      // =====================================================
      // BASIC ACCOUNT FIELDS
      // =====================================================

      formData.append(
        "username",
        profileData.username
      );

      formData.append(
        "phone_number",
        profileData.phone_number || ""
      );

      // =====================================================
      // AGE
      // =====================================================

      if (
        profileData.age !== "" &&
        profileData.age !== null
      ) {
        formData.append(
          "age",
          profileData.age
        );
      }

      // =====================================================
      // ATHLETE FIELDS
      // =====================================================

      formData.append(
        "sport",
        profileData.sport || ""
      );

      formData.append(
        "team",
        profileData.team || ""
      );

      formData.append(
        "position",
        profileData.position || ""
      );

      formData.append(
        "personal_goals",
        profileData.personal_goals || ""
      );

      formData.append(
        "preferences",
        profileData.preferences || ""
      );

      // =====================================================
      // SETTINGS
      // =====================================================

      formData.append(
        "email_notifications",
        profileData.email_notifications
      );

      formData.append(
        "reminder_notifications",
        profileData.reminder_notifications
      );

      formData.append(
        "theme_preference",
        profileData.theme_preference
      );

      formData.append(
        "profile_visibility",
        profileData.profile_visibility
      );

      // =====================================================
      // AVATAR
      // =====================================================

      if (avatarFile) {
        formData.append(
          "avatar",
          avatarFile
        );
      }

      // =====================================================
      // PASSWORD CHANGE
      // =====================================================

      if (passwords.new_password) {
        formData.append(
          "old_password",
          passwords.old_password
        );

        formData.append(
          "new_password",
          passwords.new_password
        );
      }

      // =====================================================
      // SEND REQUEST
      // =====================================================

      const updatedResponse =
        await updateProfileAPI(formData);

      // =====================================================
      // SUCCESS
      // =====================================================

      setMessage(
        passwords.new_password
          ? "Profile and password updated successfully!"
          : "Profile updated successfully!"
      );

      // Clear password fields
      setPasswords({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

      setAvatarFile(null);

      setIsEditing(false);

      // Update avatar preview
      if (updatedResponse.avatar) {
        setAvatarPreview(
          formatAvatarUrl(
            updatedResponse.avatar
          )
        );
      }

      // If avatar wasn't returned, reload profile
      if (!updatedResponse.avatar) {
        await fetchProfile();
      }
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      const errorData =
        err.response?.data;

      let errorMsg =
        "Failed to update profile. Please try again.";

      if (
        errorData?.detail
      ) {
        errorMsg =
          errorData.detail;
      } else if (
        typeof errorData === "object" &&
        errorData !== null
      ) {
        errorMsg =
          Object.entries(errorData)
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : value
                }`
            )
            .join(" | ");
      }

      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 animate-in fade-in duration-300 sm:p-6">

      {/* =====================================================
          TOP BANNER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-8">

        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Athlete Management
            </span>

            <h1 className="mt-2 text-2xl font-black tracking-tight">
              Athlete Profile
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              {isEditing
                ? "Editing your identity and sport settings."
                : "Overview of your identity, sports metrics, and performance focus."}
            </p>
          </div>

          <div className="flex items-center gap-3">

            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setIsEditing(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
              >
                <PencilSquareIcon className="h-4 w-4" />

                <span>
                  Edit Profile
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700"
              >
                <XMarkIcon className="h-4 w-4" />

                <span>
                  Cancel Editing
                </span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">

          <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />

          <span>
            {message}
          </span>

        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">

          <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-rose-600" />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* =====================================================
          MAIN PROFILE CARD
      ====================================================== */}

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8">

        <form
          onSubmit={handleUpdateProfile}
          className="space-y-8"
        >

          {/* =================================================
              AVATAR HEADER
          ================================================== */}

          <div className="flex flex-col items-center gap-6 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row">

            <div className="group relative">

              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-linear-to-tr from-indigo-600 to-violet-600 text-3xl font-black text-white shadow-xl dark:border-slate-800">

                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileData.username
                    .charAt(0)
                    .toUpperCase() || "A"
                )}

              </div>

              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-xl bg-indigo-600 p-2 text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95">

                  <CameraIcon className="h-4 w-4" />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                </label>
              )}

            </div>

            <div className="space-y-1 text-center sm:text-left">

              <h3 className="flex items-center justify-center gap-2 text-base font-bold text-slate-900 dark:text-white sm:justify-start">

                <span>
                  {profileData.username ||
                    "Athlete Member"}
                </span>

                <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                  {profileData.is_counselor
                    ? "Counselor"
                    : "Athlete"}
                </span>

              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profileData.email}
              </p>

              {isEditing && (
                <p className="pt-1 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
                  Click the camera icon on avatar to upload a new profile picture.
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              IDENTITY & ACCOUNT
          ================================================== */}

          <div className="space-y-4">

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">

              <UserIcon className="h-4 w-4 text-indigo-500" />

              <span>
                Identity & Account
              </span>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Email */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Email Address{" "}
                  <span className="font-normal text-slate-400">
                    (Locked)
                  </span>
                </label>

                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400"
                />

              </div>

              {/* Username */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

              {/* Age */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  value={profileData.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. 21"
                      : "Not specified"
                  }
                  min="1"
                  max="120"
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

              {/* Phone */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. +92 300 1234567"
                      : "Not specified"
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

            </div>
          </div>

          {/* =================================================
              SPORTS DETAILS
          ================================================== */}

          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">

              <TrophyIcon className="h-4 w-4 text-indigo-500" />

              <span>
                Sports & Performance Details
              </span>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Sport */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Sport
                </label>

                <input
                  type="text"
                  name="sport"
                  value={profileData.sport}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. Football"
                      : "Not specified"
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

              {/* Team */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Team / Club
                </label>

                <input
                  type="text"
                  name="team"
                  value={profileData.team}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. Varsity Team"
                      : "Not specified"
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

              {/* Position */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Position
                </label>

                <input
                  type="text"
                  name="position"
                  value={profileData.position}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. Midfielder"
                      : "Not specified"
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

            </div>

            <div className="space-y-4 pt-2">

              {/* Personal Goals */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Personal Focus Goals
                </label>

                <textarea
                  name="personal_goals"
                  rows="2"
                  value={profileData.personal_goals}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "What mental wellness goals are you targeting?"
                      : "No goals specified yet."
                  }
                  className={`w-full resize-none rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

              {/* Preferences */}

              <div>

                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Routine Preferences
                </label>

                <input
                  type="text"
                  name="preferences"
                  value={profileData.preferences}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    isEditing
                      ? "e.g. Morning Workouts, Mindful Breathing"
                      : "No routine preferences specified."
                  }
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isEditing
                      ? "border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      : "cursor-default border border-transparent bg-slate-100/70 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                />

              </div>

            </div>
          </div>

          {/* =================================================
              SECURITY / PASSWORD CHANGE
          ================================================== */}

          {isEditing && (
            <div className="space-y-4 border-t border-slate-100 pt-6 animate-in fade-in duration-200 dark:border-slate-800">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">

                <KeyIcon className="h-4 w-4 text-indigo-500" />

                <span>
                  Security / Change Password
                </span>

              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Leave the password fields empty if you do not
                want to change your password.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* Current Password */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Current Password
                  </label>

                  <input
                    type="password"
                    name="old_password"
                    placeholder="••••••••"
                    value={passwords.old_password}
                    onChange={handlePasswordInput}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* New Password */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    New Password
                  </label>

                  <input
                    type="password"
                    name="new_password"
                    placeholder="••••••••"
                    value={passwords.new_password}
                    onChange={handlePasswordInput}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* Confirm Password */}

                <div>

                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="••••••••"
                    value={passwords.confirm_password}
                    onChange={handlePasswordInput}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>
            </div>
          )}

          {/* =================================================
              SAVE / CANCEL BUTTONS
          ================================================== */}

          {isEditing && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 animate-in fade-in duration-200 dark:border-slate-800">

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="cursor-pointer rounded-2xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-2xl bg-indigo-600 px-8 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Profile..."
                  : "Save Profile Changes"}
              </button>

            </div>
          )}

        </form>
      </div>
    </div>
  );
}
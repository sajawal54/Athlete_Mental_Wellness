import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  CameraIcon, 
  TrophyIcon, 
  KeyIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  HashtagIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getProfileAPI, updateProfileAPI } from '../services/profileService';

export default function Profile() {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone_number: '',
    age: '',
    is_counselor: false,
    sport: '',
    team: '',
    position: '',
    personal_goals: '',
    preferences: '',
    email_notifications: true,
    reminder_notifications: true,
    theme_preference: 'dark',
    profile_visibility: 'private',
  });

  // State to handle Edit vs Read-Only View Mode
  const [isEditing, setIsEditing] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Helper function to build correct avatar image URL
  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }
    return `http://127.0.0.1:8000${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  // 1. Fetch Profile Data on Mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfileAPI();
      setProfileData({
        username: data.username || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        age: data.age || '',
        is_counselor: data.is_counselor || false,
        sport: data.sport || '',
        team: data.team || '',
        position: data.position || '',
        personal_goals: data.personal_goals || '',
        preferences: data.preferences || '',
        email_notifications: data.email_notifications ?? true,
        reminder_notifications: data.reminder_notifications ?? true,
        theme_preference: data.theme_preference || 'dark',
        profile_visibility: data.profile_visibility || 'private',
      });

      if (data.avatar) {
        setAvatarPreview(formatAvatarUrl(data.avatar));
      }
    } catch (err) {
      setError('Failed to load profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. Input Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePasswordInput = (e) => {
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    setMessage('');
    setPasswords({ new_password: '', confirm_password: '' });
    fetchProfile();
  };

  // 3. Submit Update to Backend
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwords.new_password && passwords.new_password !== passwords.confirm_password) {
      setError('New passwords do not match!');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();

      // Basic & Personal fields
      formData.append('username', profileData.username);
      formData.append('phone_number', profileData.phone_number);
      formData.append('age', profileData.age);

      // Athlete fields
      formData.append('sport', profileData.sport);
      formData.append('team', profileData.team);
      formData.append('position', profileData.position);
      formData.append('personal_goals', profileData.personal_goals);
      formData.append('preferences', profileData.preferences);

      // Settings fields
      formData.append('email_notifications', profileData.email_notifications);
      formData.append('reminder_notifications', profileData.reminder_notifications);
      formData.append('theme_preference', profileData.theme_preference);
      formData.append('profile_visibility', profileData.profile_visibility);

      // Avatar File
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Password Change
      if (passwords.new_password) {
        formData.append('password', passwords.new_password);
      }

      const updatedResponse = await updateProfileAPI(formData);

      setMessage('Profile updated successfully!');
      setPasswords({ new_password: '', confirm_password: '' });
      setAvatarFile(null);
      setIsEditing(false);

      if (updatedResponse.avatar) {
        setAvatarPreview(formatAvatarUrl(updatedResponse.avatar));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
              Athlete Management
            </span>
            <h1 className="text-2xl font-black mt-2 tracking-tight">Athlete Profile</h1>
            <p className="text-slate-400 text-xs mt-1">
              {isEditing ? 'Editing your identity and sport settings.' : 'Overview of your identity, sports metrics, and performance focus.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PencilSquareIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <ExclamationCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8 transition-colors">
        <form onSubmit={handleUpdateProfile} className="space-y-8">
          
          {/* Avatar Header Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-3xl flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profileData.username.charAt(0).toUpperCase() || 'A'
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-lg transition-transform active:scale-95">
                  <CameraIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <span>{profileData.username || 'Athlete Member'}</span>
                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold rounded-lg uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  {profileData.is_counselor ? 'Counselor' : 'Athlete'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profileData.email}</p>
              {isEditing && (
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold pt-1">
                  Click the camera icon on avatar to upload a new profile picture.
                </p>
              )}
            </div>
          </div>

          {/* Account Credentials & Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <UserIcon className="w-4 h-4 text-indigo-500" />
              <span>Identity & Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Locked)</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>

              {/* Age Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={profileData.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. 21" : "Not specified"}
                  min="1"
                  max="120"
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. +92 300 1234567" : "Not specified"}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Athlete Details Section */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <TrophyIcon className="w-4 h-4 text-indigo-500" />
              <span>Sports & Performance Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Sport</label>
                <input
                  type="text"
                  name="sport"
                  value={profileData.sport}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. Football" : "Not specified"}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Team / Club</label>
                <input
                  type="text"
                  name="team"
                  value={profileData.team}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. Varsity Team" : "Not specified"}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Position</label>
                <input
                  type="text"
                  name="position"
                  value={profileData.position}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. Midfielder" : "Not specified"}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Personal Focus Goals</label>
                <textarea
                  name="personal_goals"
                  rows="2"
                  value={profileData.personal_goals}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "What mental wellness goals are you targeting?" : "No goals specified yet."}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium resize-none transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Routine Preferences</label>
                <input
                  type="text"
                  name="preferences"
                  value={profileData.preferences}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "e.g. Morning Workouts, Mindful Breathing" : "No routine preferences specified."}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl font-medium transition-colors ${
                    isEditing 
                      ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500' 
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border border-transparent text-slate-700 dark:text-slate-300 cursor-default'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Security / Password Reset */}
          {isEditing && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <KeyIcon className="w-4 h-4 text-indigo-500" />
                <span>Security (Optional Password Reset)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    placeholder="••••••••"
                    value={passwords.new_password}
                    onChange={handlePasswordInput}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="••••••••"
                    value={passwords.confirm_password}
                    onChange={handlePasswordInput}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action Buttons */}
          {isEditing && (
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
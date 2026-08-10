import React, { useState, useRef, useEffect } from 'react';
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
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { getProfileAPI, updateProfileAPI } from '../../services/profileService';
import toast from 'react-hot-toast';

export default function TopNav({ setSidebarOpen }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null); // 'profile' or 'update'
  
  const [userProfile, setUserProfile] = useState({ username: '', email: '', is_counselor: false, avatar: null });
  const [editUsername, setEditUsername] = useState('');
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Helper function to build correct avatar image URL
  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }
    return `http://127.0.0.1:8000${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  const fetchProfile = async () => {
    try {
      const data = await getProfileAPI();
      setUserProfile(data);
      setEditUsername(data.username);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (passwords.new_password && passwords.new_password !== passwords.confirm_password) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const payload = { username: editUsername };
      if (passwords.new_password) {
        payload.password = passwords.new_password;
      }

      const data = await updateProfileAPI(payload);
      
      setUserProfile(prev => ({ ...prev, username: data.username, avatar: data.avatar || prev.avatar }));
      toast.success("Profile updated successfully!");
      setPasswords({ new_password: '', confirm_password: '' });
      setActivePopup(null);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = formatAvatarUrl(userProfile.avatar);

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        {/* Page Title & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(prev => !prev)} 
            className="lg:hidden text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-white">Executive Workspace</h1>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Welcome back, {userProfile.username || 'User'}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search modules, resources, counselors..." 
              className="w-full py-2 pl-10 pr-4 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Contextual Actions Buttons */}
        <div className="hidden xl:flex items-center gap-2">
          <button 
            onClick={() => toast.success("Opening new wellness log creator...")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-xl border border-indigo-200/60 dark:border-indigo-800 transition-all shadow-2xs"
          >
            <PlusCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>+ Log Entry</span>
          </button>
          <button 
            onClick={() => toast.success("Redirecting to session scheduler...")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
          >
            <CalendarDaysIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Book Session</span>
          </button>
        </div>

        {/* Right Section: Settings Shortcut, Notifications & User Menu */}
        <div className="flex items-center gap-3">
          {/* DIRECT SETTINGS SHORTCUT BUTTON */}
          <button 
            onClick={() => navigate('/settings')}
            title="Open Settings"
            className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          <button className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2.5 focus:outline-none p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              {/* Avatar Box: Shows Image if available, otherwise shows Initials */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shadow-md shadow-indigo-600/20 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(userProfile.username)
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline truncate max-w-28">
                {userProfile.username || 'User'}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">{userProfile.username}</p>
                </div>

                <div className="py-1.5 px-1.5 space-y-1">
                  {/* Navigate to Profile Page */}
                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                  >
                    <UserCircleIcon className="w-4 h-4 text-slate-400" />
                    <span>Athlete Profile Page</span>
                  </button>

                  {/* Navigate to Settings Page */}
                  <button 
                    onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4 text-slate-400" />
                    <span>Settings & Preferences</span>
                  </button>

                  {/* Quick Edit Drawer Trigger */}
                  <button 
                    onClick={() => { setDropdownOpen(false); setActivePopup('update'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4 text-slate-400" />
                    <span>Quick Account Edit</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 px-1.5 mt-1">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PROFILE VIEW DRAWER */}
      {activePopup === 'profile' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-all">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">Account Overview</h3>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 space-y-6 text-center">
                {/* Large Drawer Avatar */}
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl rounded-3xl mx-auto flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-800 shadow-inner overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(userProfile.username)
                  )}
                </div>

                <div className="space-y-4 text-left bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{userProfile.username}</p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{userProfile.email}</p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Role</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                      {userProfile.is_counselor ? 'Counselor' : 'Athlete Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setActivePopup('update')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                Edit & Update Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROFILE DRAWER */}
      {activePopup === 'update' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-all">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActivePopup('profile')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">Edit Settings</h3>
                </div>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} id="update-form" className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input 
                    type="text" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Password Update <span className="text-slate-400 font-normal lowercase">(optional)</span></p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={passwords.new_password}
                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                        className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={passwords.confirm_password}
                        onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                        className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button 
                type="button"
                onClick={() => setActivePopup('profile')}
                className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Back
              </button>
              <button 
                type="submit"
                form="update-form"
                disabled={loading}
                className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
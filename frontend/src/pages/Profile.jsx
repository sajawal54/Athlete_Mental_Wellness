import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile() {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    is_counselor: false,
  });

  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch Profile Data on Load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access');
        const response = await axios.get('http://127.0.0.1:8000/api/auth/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData({
          username: response.data.username || '',
          email: response.data.email || '',
          is_counselor: response.data.is_counselor || false,
        });
      } catch (err) {
        setError('Failed to load profile information.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Handle Input Change for Username
  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordInput = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  // 3. Submit Update to Backend
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Password validation check agar user password change karna chahta hai
    if (passwords.new_password && passwords.new_password !== passwords.confirm_password) {
      setError('New passwords do not match!');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('access');
      
      const payload = {
        username: profileData.username,
      };

      if (passwords.new_password) {
        payload.password = passwords.new_password;
      }

      // Backend API call (PUT or PATCH)
      const response = await axios.put('http://127.0.0.1:8000/api/auth/profile/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Profile updated successfully and saved in database!');
      setPasswords({ new_password: '', confirm_password: '' }); // reset password fields
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading profile details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Account Profile</h2>
        <p className="text-xs text-slate-500 mb-6">Manage your account credentials and personal settings.</p>

        {message && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{message}</div>}
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{error}</div>}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Email (Locked / Read-only) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-slate-400 font-normal">(Cannot be changed)</span>
            </label>
            <input 
              type="email" 
              value={profileData.email} 
              disabled 
              className="w-full px-4 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
            />
          </div>

          {/* Username (Editable) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <input 
              type="text" 
              name="username" 
              value={profileData.username} 
              onChange={handleChange} 
              required
              className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
            />
          </div>

          {/* Password Change Section */}
          <div className="border-t border-slate-100 pt-4 mt-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Change Password (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
                <input 
                  type="password" 
                  name="new_password" 
                  placeholder="Leave blank to keep current" 
                  value={passwords.new_password} 
                  onChange={handlePasswordInput}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  placeholder="Confirm new password" 
                  value={passwords.confirm_password} 
                  onChange={handlePasswordInput}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
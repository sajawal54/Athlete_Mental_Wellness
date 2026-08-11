import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

import { logout } from "../redux/slices/authSlice";

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-xs border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="text-xl font-black tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Athlete Wellness
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors py-2"
            >
              <FiHome className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors py-2"
            >
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 mx-1" />

            {/* Display User Greeting */}
            {user?.username && (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {user.username}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="md:hidden text-gray-600 hover:text-indigo-600 p-2 rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {user?.username && (
              <div className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg inline-block mb-2">
                Signed in as: {user.username}
              </div>
            )}
            
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <FiHome className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </Link>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
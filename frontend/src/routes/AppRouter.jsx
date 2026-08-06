import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProtectedRoute from "./protectedRoutes";
import { logout } from "../redux/slices/authSlice";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

// Temporary Dashboard Component (Isko baad mein alag pages/ folder mein bhi shift kar sakta hai)
function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl rounded-3xl bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back to your workspace
            </p>
          </div>
          <span className="inline-flex items-center rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            {user?.is_counselor ? "Counselor Account" : "Standard User"}
          </span>
        </div>

        <div className="space-y-3 rounded-2xl bg-slate-950/50 p-6 border border-slate-800/80">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Username:</span>
            <span className="font-medium text-white">
              {user?.username || "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Email Address:</span>
            <span className="font-medium text-white">
              {user?.email || "N/A"}
            </span>
          </div>
        </div>

        <button
          onClick={() => dispatch(logout())}
          className="w-full rounded-xl bg-rose-600/10 hover:bg-rose-600 px-4 py-3 text-sm font-semibold text-rose-400 hover:text-white border border-rose-500/25 transition-all cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Protected Dashboard Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
        }
      />
      <Route
        path="/reset-password"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

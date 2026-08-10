import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MoodCheckIn from "./pages/MoodCheckIn";
import Goals from "./pages/Goals";
import BioGuide from "./pages/BioGuide";

import ProtectedRoute from "./components/ProtectedRoutes";
import DashboardLayout from "./components/layout/DashboardLayout";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

          {/* Mood Tracker */}
          <Route path="/mood-checkin" element={<MoodCheckIn />} />

          {/* Daily Goals */}
          <Route path="/goals" element={<Goals />} />

          {/* AI Bio Guide */}
          <Route path="/bio-guide" element={<BioGuide />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

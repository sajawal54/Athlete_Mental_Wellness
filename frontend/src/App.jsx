import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Dashboard & Activity Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MoodCheckIn from "./pages/MoodCheckIn";
import Goals from "./pages/Goals";
import BioGuide from "./pages/BioGuide";
import SoundTherapy from "./pages/SoundTherapy";
import Affirmations from "./pages/Affirmations";
import Gamification from "./pages/Gamification";
import TrophyRoom from "./pages/TrophyRoom";
import EmergencySupport from "./pages/EmergencySupport";
import NotificationCenter from "./pages/NotificationCenter";

// Athlete Wellness Hub Page (Houses all 10 Modules)
import { WellnessHub } from "./pages/WellnessHub";

// Layout & Route Guards
import ProtectedRoute from "./components/ProtectedRoutes";
import DashboardLayout from "./components/layout/DashboardLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes inside Dashboard Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mood-checkin" element={<MoodCheckIn />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/sound-therapy" element={<SoundTherapy />} />
          <Route path="/affirmations" element={<Affirmations />} />
          <Route path="/bio-guide" element={<BioGuide />} />
          <Route path="/gamification" element={<Gamification />} />

          {/* Integrated Athlete Wellness Hub Route */}
          <Route path="/modules" element={<WellnessHub />} />
          <Route path="/wellness" element={<WellnessHub />} />
          <Route path="/wellness/:moduleSlug" element={<WellnessHub />} />
          <Route path="/notifications" element={<NotificationCenter />}/>
          <Route path="/trophy-room" element={<TrophyRoom />} />
          <Route path="/support" element={<EmergencySupport />} />
          <Route path="/settings" element={<Settings />} />

          {/* Additional pages */}
          <Route path="/profile" element={<Profile />} />

          {/* Legacy / Redirect Routes */}
          <Route path="/activities/sound-therapy" element={<Navigate to="/sound-therapy" replace />} />
          <Route path="/activities/bio-guide" element={<Navigate to="/bio-guide" replace />} />
          <Route path="/activities/daily-goals" element={<Navigate to="/goals" replace />} />
          <Route path="/activities/goals" element={<Navigate to="/goals" replace />} />
          <Route path="/activities/trophy-room" element={<Navigate to="/trophy-room" replace />} />
          <Route path="/activities/progress-analytics" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

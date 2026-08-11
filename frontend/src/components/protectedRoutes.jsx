import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ counselorOnly = false }) {
  const { isAuthenticated, user, loading } = useSelector(
    (state) => state.auth
  );

  // Optional: Agar Redux state me initial user token verification / load ho raha ho
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Check 1: User authenticated hai ya nahi
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check 2: Aggar route counselor-only hai aur user counselor nahi hai
  if (counselorOnly && !user?.is_counselor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
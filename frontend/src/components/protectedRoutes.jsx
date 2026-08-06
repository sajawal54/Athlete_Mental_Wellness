import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ counselorOnly = false }) {

    const { isAuthenticated, user } = useSelector(
        (state) => state.auth
    );

    if (!isAuthenticated) {

        return <Navigate to="/login" replace />;

    }

    if (counselorOnly && !user?.is_counselor) {

        return <Navigate to="/dashboard" replace />;

    }

    return <Outlet />;

}

export default ProtectedRoute;
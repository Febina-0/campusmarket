
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ adminOnly = false, studentOnly = false }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Checking login...</p>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Admins can access only admin pages and shared public pages.
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Students cannot access admin pages.
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Admins cannot access student-only pages.
  if (studentOnly && user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "CLIENT" | "PROVIDER" | "ADMIN";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const location = useLocation();

  // If still loading, don't redirect
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && authState.user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
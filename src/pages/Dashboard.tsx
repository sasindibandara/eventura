
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import ClientDashboard from "./ClientDashboard";
import ProviderDashboard from "./ProviderDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { authState } = useAuth();
  const { isAuthenticated, user } = authState;

  useEffect(() => {
    document.title = "Dashboard | Eventura";
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // We have the user role from the auth context, but as a fallback we can also get it from the JWT
  const userRole = user?.role || authService.getUserRole();

  switch (userRole) {
    case "CLIENT":
      return <ClientDashboard />;
    case "PROVIDER":
      return <ProviderDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Role Not Recognized</h1>
              <p className="mt-2 text-gray-600">
                Your user role could not be determined. Please contact support.
              </p>
            </div>
          </div>
        </div>
      );
  }
};

export default Dashboard;

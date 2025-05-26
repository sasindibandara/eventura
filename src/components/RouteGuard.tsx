import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Routes that suspended users can still access
const ALLOWED_ROUTES = [
  "/logout",
  "/profile",
  "/contact-admin",
];

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is suspended and trying to access a restricted route
    if (
      authState.user?.accountStatus === "SUSPENDED" &&
      !ALLOWED_ROUTES.includes(location.pathname)
    ) {
      // Redirect to profile page with a message
      navigate("/profile", {
        state: { message: "Your account is suspended. You can only access limited features." }
      });
    }
  }, [authState.user, location.pathname, navigate]);

  // If user is suspended and trying to access a restricted route, don't render the children
  if (
    authState.user?.accountStatus === "SUSPENDED" &&
    !ALLOWED_ROUTES.includes(location.pathname)
  ) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard; 
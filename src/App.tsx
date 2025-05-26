import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteGuard from "./components/RouteGuard";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProviderProfile from "./pages/ProviderProfile";
import ProvidersList from "./pages/ProvidersList";
import ProviderDetails from "./pages/ProviderDetails";
import NotFound from "./pages/NotFound";
import CreateRequest from "@/pages/CreateRequest";
import MyRequests from "@/pages/MyRequests";
import AllRequests from "@/pages/AllRequests";
import AllPitches from "@/pages/AllPitches";
import RequestPitches from "@/pages/RequestPitches";
import OngoingRequests from "@/pages/OngoingRequests";
import OngoingWork from "@/pages/OngoingWork";
import Earnings from "@/pages/Earnings";
import ProviderPortfolio from "@/pages/ProviderPortfolio";
import AdminDashboard from "./pages/AdminDashboard";
import ServiceRequestsPage from "./pages/admin/ServiceRequestsPage";
import UsersPage from "./pages/admin/UsersPage";
import ProviderVerificationPage from "./pages/admin/ProviderVerificationPage";
import RequestCalendarPage from "./pages/admin/RequestCalendarPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000, // Refetch every 5 seconds
      refetchIntervalInBackground: true, // Continue refetching even when tab is not active
      staleTime: 0, // Consider data stale immediately
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="ADMIN">
                <RouteGuard>
                  <AdminDashboard />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute requiredRole="ADMIN">
                <RouteGuard>
                  <ServiceRequestsPage />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="ADMIN">
                <RouteGuard>
                  <UsersPage />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/verification" element={
              <ProtectedRoute requiredRole="ADMIN">
                <RouteGuard>
                  <ProviderVerificationPage />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/calendar" element={
              <ProtectedRoute requiredRole="ADMIN">
                <RouteGuard>
                  <RequestCalendarPage />
                </RouteGuard>
              </ProtectedRoute>
            } />

            {/* Protected routes with suspension check */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RouteGuard>
                <Dashboard />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <RouteGuard>
                <Profile />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/provider/profile" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <RouteGuard>
                <ProviderProfile />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/providers" element={
              <ProtectedRoute>
                <RouteGuard>
                <ProvidersList />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/providers/:providerId" element={
              <ProtectedRoute>
                <RouteGuard>
                <ProviderDetails />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <RouteGuard>
                <MyRequests />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/requests/:requestId/pitches" element={
              <ProtectedRoute>
                <RouteGuard>
                <RequestPitches />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/all-requests" element={
              <ProtectedRoute>
                <RouteGuard>
                <AllRequests />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/create-request" element={
              <ProtectedRoute requiredRole="CLIENT">
                <RouteGuard>
                <CreateRequest />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/all-pitches" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <RouteGuard>
                <AllPitches />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/ongoing-requests" element={
              <ProtectedRoute requiredRole="CLIENT">
                <RouteGuard>
                <OngoingRequests />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/ongoing-work" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <RouteGuard>
                <OngoingWork />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/earnings" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <RouteGuard>
                <Earnings />
                </RouteGuard>
              </ProtectedRoute>
            } />
            <Route path="/provider/portfolio" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <RouteGuard>
                <ProviderPortfolio />
                </RouteGuard>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

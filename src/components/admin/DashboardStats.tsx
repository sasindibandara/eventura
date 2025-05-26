import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { providerService } from "@/services/providerService";
import { userService } from "@/services/userService";
import { serviceRequestService } from "@/services/serviceRequestService";
import { ServiceType } from "@/types/provider";
import { ServiceRequestStatus } from "@/types/serviceRequest";
import { UserRole } from "@/types/user";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatsData {
  providerStats: {
    totalProviders: number;
    verifiedProviders: number;
    providersByType: { type: ServiceType; count: number }[];
    averagePortfolioItems: number;
  };
  requestStats: {
    totalRequests: number;
    openRequests: number;
    requestsByType: { type: ServiceType; count: number }[];
    requestsByStatus: { status: ServiceRequestStatus; count: number }[];
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    usersByRole: { role: UserRole; count: number }[];
    newUsersLast30Days: number;
  };
}

const COLORS = {
  PHOTOGRAPHY: "#8B5CF6", // purple
  CATERING: "#F97316", // orange
  VENUE: "#EC4899", // pink
  DECORATION: "#6366F1", // indigo
  WEDDING_PLANNING: "#10B981", // emerald
  MUSIC: "#F59E0B", // amber
  OTHER: "#6B7280", // gray
};

const SERVICE_TYPES: ServiceType[] = [
  "CATERING",
  "WEDDING_PLANNING",
  "VENUE",
  "PHOTOGRAPHY",
  "MUSIC",
  "DECORATION",
  "OTHER"
];

const REQUEST_STATUSES: ServiceRequestStatus[] = [
  "OPEN",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
  "DRAFT",
  "DELETED"
];

const USER_ROLES: UserRole[] = ["CLIENT", "PROVIDER", "ADMIN"];

const REFRESH_INTERVAL = 30000; // 30 seconds

const DashboardStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all necessary data
      const [providers, users, requests] = await Promise.all([
        providerService.getAllProviders(0, 100),
        userService.getAllUsers(0, 100),
        serviceRequestService.getAllRequests(0, 100),
      ]);

      // Calculate provider statistics
      const verifiedProviders = providers.content.filter(p => p.isVerified).length;
      const providersByType = SERVICE_TYPES.map(type => ({
        type,
        count: providers.content.filter(p => p.serviceType === type).length,
      }));

      // Calculate request statistics
      const openRequests = requests.content.filter(r => r.status === "OPEN").length;
      const requestsByType = SERVICE_TYPES.map(type => ({
        type,
        count: requests.content.filter(r => r.serviceType === type).length,
      }));
      const requestsByStatus = REQUEST_STATUSES.map(status => ({
        status,
        count: requests.content.filter(r => r.status === status).length,
      }));

      // Calculate user statistics
      const activeUsers = users.content.filter(u => u.accountStatus === "ACTIVE").length;
      const usersByRole = USER_ROLES.map(role => ({
        role,
        count: users.content.filter(u => u.role === role).length,
      }));

      // Calculate new users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = users.content.filter(u => 
        new Date(u.createdAt) > thirtyDaysAgo
      ).length;

      setStats({
        providerStats: {
          totalProviders: providers.content.length,
          verifiedProviders,
          providersByType,
          averagePortfolioItems: 0,
        },
        requestStats: {
          totalRequests: requests.content.length,
          openRequests,
          requestsByType,
          requestsByStatus,
        },
        userStats: {
          totalUsers: users.content.length,
          activeUsers,
          usersByRole,
          newUsersLast30Days,
        },
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up auto-refresh
    const intervalId = setInterval(fetchStats, REFRESH_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  if (loading && !stats) {
    return <div className="text-center py-4">Loading statistics...</div>;
  }

  if (error && !stats) {
    return (
      <div className="text-center py-4 text-red-600">
        Error: {error || "Failed to load statistics"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Updated Indicator */}
      <div className="text-sm text-gray-500 text-right">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Provider Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Providers</CardTitle>
            <CardDescription>All registered service providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.providerStats.totalProviders}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.providerStats.verifiedProviders} verified
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Rate</CardTitle>
            <CardDescription>Provider verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((stats.providerStats.verifiedProviders / stats.providerStats.totalProviders) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              of providers verified
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Requests</CardTitle>
            <CardDescription>Active service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.requestStats.openRequests}</div>
            <div className="text-sm text-gray-500 mt-1">
              of {stats.requestStats.totalRequests} total requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Users</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.userStats.newUsersLast30Days}</div>
            <div className="text-sm text-gray-500 mt-1">
              of {stats.userStats.totalUsers} total users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Providers by Service Type */}
        <Card>
          <CardHeader>
            <CardTitle>Providers by Service Type</CardTitle>
            <CardDescription>Distribution of providers across service categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.providerStats.providersByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.providerStats.providersByType.map((entry) => (
                      <Cell key={entry.type} fill={COLORS[entry.type]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Requests by Status</CardTitle>
            <CardDescription>Distribution of service requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.requestStats.requestsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {stats.userStats.usersByRole.map(({ role, count }) => (
                  <div key={role} className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500">{role}</div>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                {stats.userStats.activeUsers} active users out of {stats.userStats.totalUsers} total
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Type Distribution</CardTitle>
            <CardDescription>Most requested service types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.requestStats.requestsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats; 
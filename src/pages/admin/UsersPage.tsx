import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { userService, PageableUserResponse, UserResponse, UserStatus } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function UsersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState<PageableUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers(currentPage, pageSize);
      setUsers(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "PROVIDER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "CLIENT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      case "SUSPENDED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const handleStatusUpdate = async (userId: number, currentStatus: string) => {
    try {
      const newStatus: UserStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await userService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <AdminSidebar
        isCollapsed={!isSidebarOpen}
        onCollapse={() => setIsSidebarOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isSidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage platform users and their accounts
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all platform users. You can update user status, view details, and manage their roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-100">
                    {error}
                  </div>
                )}
                
                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : users && users.content.length > 0 ? (
                  <div className="space-y-4">
                    {users.content.map((user: UserResponse) => (
                      <div key={user.id} className="p-4 border rounded-md bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.mobileNumber}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge className={getStatusBadgeColor(user.accountStatus)}>
                              {user.accountStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button
                            variant={user.accountStatus === "ACTIVE" ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleStatusUpdate(user.id, user.accountStatus)}
                          >
                            {user.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {users.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= users.totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No users found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { notificationService } from "@/services/notificationService";
import { NotificationResponse } from "@/types/notification";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const { user } = authState;
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 p-3",
                          !notification.isRead && "bg-accent"
                        )}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 
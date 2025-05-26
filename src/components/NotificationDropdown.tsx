import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/services/notificationService";
import { NotificationResponse } from "@/types/notification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NotificationDropdown = () => {
  const { authState } = useAuth();
  const { isAuthenticated } = authState;
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notifications with React Query
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAllNotifications(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count separately
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleNotificationClick = async (notification: NotificationResponse) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        // Optimistically update the UI
        queryClient.setQueryData(['notifications'], (old: NotificationResponse[] = []) =>
          old.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Optimistically update the UI
      queryClient.setQueryData(['notifications'], (old: NotificationResponse[] = []) =>
        old.map(n => ({ ...n, isRead: true }))
      );
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h4 className="font-medium">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs hover:bg-gray-100"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 cursor-pointer ${
                    !notification.isRead 
                      ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm ${!notification.isRead ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedNotification.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="text-base text-gray-900">{selectedNotification.message}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationDropdown; 
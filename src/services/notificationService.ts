import { api } from "./api";
import { NotificationPage, NotificationResponse } from "@/types/notification";

class NotificationService {
  async getNotifications(
    page = 0, 
    size = 100,
    isRead?: boolean,
    sort: string = "createdAt,desc"
  ): Promise<NotificationPage> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort
    });
    
    if (isRead !== undefined) {
      params.append('isRead', isRead.toString());
    }

    const response = await api.get<NotificationPage>(`/api/notifications?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }

  async markAsRead(notificationId: number): Promise<void> {
    await api.put(`/api/notifications/${notificationId}/read`, null, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  async markAllAsRead(): Promise<void> {
    await api.put('/api/notifications/read-all', null, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<NotificationPage>('/api/notifications?isRead=false&size=1', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.totalElements;
  }

  async getAllNotifications(): Promise<NotificationResponse[]> {
    const response = await api.get<NotificationPage>('/api/notifications?size=1000', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.content;
  }
}

export const notificationService = new NotificationService(); 
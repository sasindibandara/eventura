export interface NotificationResponse {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
} 
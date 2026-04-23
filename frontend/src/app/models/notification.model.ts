export interface AppNotification {
  notificationId: number;
  user: { id: number; name: string; role: string };
  message: string;
  category: string;
  status: string;
  createdDate: string;
}

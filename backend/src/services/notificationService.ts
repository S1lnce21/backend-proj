import { Server } from 'socket.io';

interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

class NotificationService {
  private notifications: Map<number, Notification[]> = new Map();
  private io: Server | null = null;

  setIo(io: Server) {
    this.io = io;
  }

  addNotification(userId: number, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'): Notification {
    const notification: Notification = {
      id: Date.now().toString(),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);
    
    if (this.io) {
      this.io.to(`user_${userId}`).emit('new-notification', notification);
    }
    
    return notification;
  }

  getNotifications(userId: number): Notification[] {
    return this.notifications.get(userId) || [];
  }

  getUnreadCount(userId: number): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.isRead).length;
  }

  markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;
    
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  markAllAsRead(userId: number): void {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      userNotifications.forEach(n => n.isRead = true);
    }
  }

  deleteNotification(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;
    
    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      userNotifications.splice(index, 1);
      return true;
    }
    return false;
  }

  deleteAll(userId: number): void {
    this.notifications.delete(userId);
  }
}

export const notificationService = new NotificationService();
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

class NotificationService {
  private listeners: Set<(notification: Notification) => void> = new Set();
  private notifications: Notification[] = [];

  subscribe(callback: (notification: Notification) => void) {
    console.log('[NotificationService] New subscriber added. Total listeners:', this.listeners.size + 1);
    this.listeners.add(callback);
    return () => {
      console.log('[NotificationService] Subscriber removed. Total listeners:', this.listeners.size - 1);
      this.listeners.delete(callback);
    };
  }

  emit(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.push(fullNotification);
    this.listeners.forEach((callback) => {
      try {
        callback(fullNotification);
      } catch (error) {
        console.error('[NotificationService] Error calling listener:', error);
      }
    });
  }

  getAll() {
    return this.notifications;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  getListenerCount() {
    return this.listeners.size;
  }
}

// Use global singleton pattern to ensure same instance across API routes
// This is crucial for Next.js API routes which can run in different contexts
declare global {
  var notificationService: NotificationService | undefined;
}

export const notificationService = 
  global.notificationService ?? 
  (global.notificationService = new NotificationService());

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
  global.notificationService = notificationService;
}
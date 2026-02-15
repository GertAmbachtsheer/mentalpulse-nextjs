/**
 * Push Notification Utility
 * Handles browser push notifications for panic alerts
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  );
}

/**
 * Show a push notification
 */
export async function showPushNotification(options: NotificationOptions): Promise<void> {
  if (!canShowNotifications()) {
    console.warn('Cannot show notification: permission not granted');
    return;
  }

  try {
    // If service worker is available, use it for better notification handling
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon512_rounded.png',
        badge: options.badge || '/icon512_rounded.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction ?? true,
        actions: [
          {
            action: 'respond',
            title: 'Respond',
          },
          {
            action: 'decline',
            title: 'Decline',
          },
        ],
      } as NotificationOptions & { actions: Array<{ action: string; title: string }> });
    } else {
      // Fallback to regular notification API
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon512_rounded.png',
        badge: options.badge || '/icon512_rounded.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction ?? true,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Trigger custom event for notification click
        if (options.data) {
          window.dispatchEvent(new CustomEvent('notificationclick', {
            detail: options.data,
          }));
        }
      };
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Show a panic alert notification
 */
export async function showPanicAlertNotification(
  distance: string,
  timeAgo: string,
  alertId: string
): Promise<void> {
  await showPushNotification({
    title: '🚨 Emergency Alert Nearby!',
    body: `Someone needs help approximately ${distance}km away (${timeAgo})`,
    tag: `panic-alert-${alertId}`,
    data: {
      type: 'panic-alert',
      alertId,
    },
    requireInteraction: true,
  });
}

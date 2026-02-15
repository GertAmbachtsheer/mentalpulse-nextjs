/// <reference lib="webworker" />

// Custom Service Worker for Push Notifications
// This file is bundled by @ducanh2912/next-pwa into the generated service worker

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'respond') {
    console.log('[SW] Respond action clicked');
    // Open the app and focus on the alert
    event.waitUntil(
      sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(sw.location.origin) && 'focus' in client) {
            // Post message to the client to handle the alert
            console.log('[SW] Posting message to client:', data);
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action: 'respond',
              alert: data,
            });
            return (client as WindowClient).focus();
          }
        }
        
        // If no window is open, open a new one
        if (sw.clients.openWindow) {
          return sw.clients.openWindow('/');
        }
      })
    );
  } else if (action === 'decline') {
    console.log('[SW] Decline action clicked');
    // Just close the notification (already done above)
    return;
  } else {
    console.log('[SW] Default notification click (no action)');
    // Default click behavior - open the app
    event.waitUntil(
      sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(sw.location.origin) && 'focus' in client) {
            return (client as WindowClient).focus();
          }
        }
        
        if (sw.clients.openWindow) {
          return sw.clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push events (for future server-sent push notifications)
sw.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || 'MentalPulse Alert';
  const options: NotificationOptions & { actions: Array<{ action: string; title: string }> } = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon512_rounded.png',
    badge: '/icon512_rounded.png',
    data: data.data || {},
    requireInteraction: data.requireInteraction ?? true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    sw.registration.showNotification(title, options)
  );
});

export {};

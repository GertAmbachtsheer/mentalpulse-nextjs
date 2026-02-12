// Custom Service Worker for Push Notifications
// This will be imported by the main service worker

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, data } = event;
  
  if (action === 'view' && data?.alert) {
    // Open the app and focus on the alert
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Post message to the client to handle the alert
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              alert: data.alert,
            });
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (action === 'close') {
    // Just close the notification (already done above)
    return;
  } else {
    // Default click behavior - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push events (for future server-sent push notifications)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || 'MentalPulse Alert';
  const options = {
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
    self.registration.showNotification(title, options)
  );
});

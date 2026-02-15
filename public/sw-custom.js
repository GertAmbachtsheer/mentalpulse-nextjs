// Custom Service Worker for Push Notifications
// This will be imported by the main service worker

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'respond') {
    console.log('[SW] Respond action clicked');
    // Open the app and focus on the alert
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Post message to the client to handle the alert
            console.log('[SW] Posting message to client:', data);
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action: 'respond',
              alert: data,
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
  } else if (action === 'decline') {
    console.log('[SW] Decline action clicked');
    // Just close the notification (already done above)
    return;
  } else {
    console.log('[SW] Default notification click (no action)');
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

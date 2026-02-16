/// <reference lib="webworker" />

// Custom Service Worker for Push Notifications
// This file is bundled by @ducanh2912/next-pwa into the generated service worker

const sw = self as unknown as ServiceWorkerGlobalScope;

// Handle push events from the server (Web Push / VAPID)
sw.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || 'MentalPulse Alert';
  const options: NotificationOptions & { actions: Array<{ action: string; title: string }> } = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon512_rounded.png',
    badge: data.badge || '/icon512_rounded.png',
    data: data.data || {},
    requireInteraction: data.requireInteraction ?? true,
    actions: [],
  };

  // Customize actions based on notification type
  if (data.data?.type === 'panic-alert') {
    options.actions = [
      { action: 'respond', title: '💚 Respond' },
      { action: 'decline', title: 'Dismiss' },
    ];
  } else if (data.data?.type === 'panic-response') {
    options.actions = [
      { action: 'view-response', title: '🗺️ View Map' },
      { action: 'close', title: 'Dismiss' },
    ];
  } else if (data.data?.type === 'alert-cancelled') {
    options.actions = [
      { action: 'close', title: 'OK' },
    ];
  } else {
    options.actions = [
      { action: 'view', title: 'View Details' },
      { action: 'close', title: 'Dismiss' },
    ];
  }

  event.waitUntil(
    sw.registration.showNotification(title, options)
  );
});

// Handle notification clicks
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'respond' && data?.type === 'panic-alert') {
    // User clicked "Respond" on a panic alert notification
    event.waitUntil(
      (async () => {
        try {
          const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          for (const client of clients) {
            if (client.url.includes(sw.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                action: 'respond',
                alertId: data.alertId,
                triggerUserId: data.triggerUserId,
              });
              return (client as WindowClient).focus();
            }
          }

          // If no window is open, open one and pass the alert data via URL
          if (sw.clients.openWindow) {
            return sw.clients.openWindow(`/?respondToAlert=${data.alertId}`);
          }
        } catch (error) {
          console.error('[SW] Error handling respond action:', error);
        }
      })()
    );
  } else if (action === 'view-response' && data?.type === 'panic-response') {
    // Creator clicked "View Map" on a panic-response notification
    // Send message to client to show the response map
    event.waitUntil(
      (async () => {
        try {
          const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          for (const client of clients) {
            if (client.url.includes(sw.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'SHOW_RESPONSE_MAP',
                alertId: data.alertId,
                responderUserId: data.responderUserId,
                responderLatitude: data.responderLatitude,
                responderLongitude: data.responderLongitude,
                alertLatitude: data.alertLatitude,
                alertLongitude: data.alertLongitude,
              });
              return (client as WindowClient).focus();
            }
          }

          // If no window is open, just open the app
          if (sw.clients.openWindow) {
            return sw.clients.openWindow('/');
          }
        } catch (error) {
          console.error('[SW] Error handling view-response action:', error);
        }
      })()
    );
  } else if ((action === 'close' || !action) && data?.type === 'alert-cancelled') {
    // Responder clicked OK/Dismiss on "Alert Cancelled" notification
    // Notify the client so it can show a dialog/redirect
    event.waitUntil(
      (async () => {
        try {
          const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          for (const client of clients) {
            if (client.url.includes(sw.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'ALERT_CANCELLED',
                alertId: data.alertId,
              });
              return (client as WindowClient).focus();
            }
          }

          // If no window is open, open one
          if (sw.clients.openWindow) {
            return sw.clients.openWindow('/');
          }
        } catch (error) {
          console.error('[SW] Error handling alert-cancelled action:', error);
        }
      })()
    );
  } else if (action === 'decline' || action === 'close') {
    // Just close the notification (already done above)
    return;
  } else if (data?.type === 'panic-response') {
    // Default click on panic-response notification — show the map
    event.waitUntil(
      (async () => {
        try {
          const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
          
          for (const client of clients) {
            if (client.url.includes(sw.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'SHOW_RESPONSE_MAP',
                alertId: data.alertId,
                responderUserId: data.responderUserId,
                responderLatitude: data.responderLatitude,
                responderLongitude: data.responderLongitude,
                alertLatitude: data.alertLatitude,
                alertLongitude: data.alertLongitude,
              });
              return (client as WindowClient).focus();
            }
          }

          if (sw.clients.openWindow) {
            return sw.clients.openWindow('/');
          }
        } catch (error) {
          console.error('[SW] Error handling panic-response click:', error);
        }
      })()
    );
  } else {
    // Default click — open/focus the app
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

export {};

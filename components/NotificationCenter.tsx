'use client';

import { useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { toast } from 'sonner';

/**
 * Thin component that listens for messages from the service worker
 * (notification click events) and handles them appropriately.
 */
export default function NotificationCenter() {
  const { user } = useUser();

  // Listen for notification clicks from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !user?.id) return;

    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      console.log('[NotificationCenter] Received message from SW:', event.data);

      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { action, alertId } = event.data;

        if (action === 'respond' && alertId) {
          // Call the respond API
          try {
            const response = await fetch('/api/panic-alerts/respond', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alertId,
                responderUserId: user.id,
              }),
            });

            if (response.ok) {
              toast.success("Response sent!", {
                description: "The person in distress has been notified that you responded.",
                position: "top-center",
                duration: 5000,
              });
            } else {
              toast.error("Failed to send response", {
                position: "top-center",
                duration: 3000,
              });
            }
          } catch (error) {
            console.error('[NotificationCenter] Error sending response:', error);
            toast.error("Failed to send response", {
              position: "top-center",
              duration: 3000,
            });
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [user?.id]);

  // Handle ?respondToAlert= URL parameter (when app opens from notification click)
  useEffect(() => {
    if (!user?.id) return;

    const params = new URLSearchParams(window.location.search);
    const alertId = params.get('respondToAlert');

    if (alertId) {
      // Remove the param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('respondToAlert');
      window.history.replaceState({}, '', url.toString());

      // Send the response
      fetch('/api/panic-alerts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          responderUserId: user.id,
        }),
      })
        .then((res) => {
          if (res.ok) {
            toast.success("Response sent!", {
              description: "The person in distress has been notified.",
              position: "top-center",
              duration: 5000,
            });
          }
        })
        .catch((error) => {
          console.error('[NotificationCenter] Error responding via URL:', error);
        });
    }
  }, [user?.id]);

  return <></>;
}
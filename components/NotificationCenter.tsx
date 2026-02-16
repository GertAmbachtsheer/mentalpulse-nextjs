'use client';

import { useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { toast } from 'sonner';
import { usePanicAlertStore } from '@/store/panicAlertStore';

/**
 * Thin component that listens for messages from the service worker
 * (notification click events) and handles them appropriately.
 */
export default function NotificationCenter() {
  const { user } = useUser();
  const { setActiveResponseAlert } = usePanicAlertStore();

  // Listen for notification clicks from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !user?.id) return;

    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      console.log('[NotificationCenter] Received message from SW:', event.data);

      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { action, alertId, triggerUserId, responderUserId, responderLatitude, responderLongitude, alertLatitude, alertLongitude } = event.data;

        if (action === 'respond' && alertId) {
          // Get current location to send with the response
          let latitude: string | undefined;
          let longitude: string | undefined;

          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              });
            });
            latitude = position.coords.latitude.toString();
            longitude = position.coords.longitude.toString();
          } catch (err) {
            console.warn('[NotificationCenter] Could not get location for response:', err);
          }

          // Call the respond API
          try {
            const response = await fetch('/api/panic-alerts/respond', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alertId,
                responderUserId: user.id,
                latitude,
                longitude,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              toast.success("Response sent!", {
                description: "The person in distress has been notified. Showing map...",
                position: "top-center",
                duration: 3000,
              });

              // Show the response map for the responder
              if (data.alert) {
                setActiveResponseAlert({
                  alertId: data.alert.id,
                  creatorUserId: data.alert.user_id,
                  responderUserId: user.id,
                  creatorLatitude: data.alert.latitude,
                  creatorLongitude: data.alert.longitude,
                  responderLatitude: latitude || data.alert.responderLatitude || '',
                  responderLongitude: longitude || data.alert.responderLongitude || '',
                });
              }
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
        } else if (action === 'show-response-map' || (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.notificationType === 'panic-response')) {
          // Creator side: someone responded, show the map
          if (alertId && responderUserId) {
            setActiveResponseAlert({
              alertId,
              creatorUserId: user.id,
              responderUserId,
              creatorLatitude: alertLatitude || '',
              creatorLongitude: alertLongitude || '',
              responderLatitude: responderLatitude || '',
              responderLongitude: responderLongitude || '',
            });
          }
        }
      }

      // Handle SHOW_RESPONSE_MAP messages from SW (panic-response notification "View" click)
      if (event.data?.type === 'SHOW_RESPONSE_MAP') {
        const { alertId, responderUserId, responderLatitude, responderLongitude, alertLatitude, alertLongitude } = event.data;
        if (alertId) {
          setActiveResponseAlert({
            alertId,
            creatorUserId: user.id,
            responderUserId: responderUserId || '',
            creatorLatitude: alertLatitude || '',
            creatorLongitude: alertLongitude || '',
            responderLatitude: responderLatitude || '',
            responderLongitude: responderLongitude || '',
          });
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [user?.id, setActiveResponseAlert]);

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

      // Get current location
      let latitude: string | undefined;
      let longitude: string | undefined;

      const sendResponse = async () => {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          latitude = position.coords.latitude.toString();
          longitude = position.coords.longitude.toString();
        } catch (err) {
          console.warn('[NotificationCenter] Could not get location:', err);
        }

        // Send the response
        try {
          const res = await fetch('/api/panic-alerts/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alertId,
              responderUserId: user.id,
              latitude,
              longitude,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            toast.success("Response sent!", {
              description: "The person in distress has been notified.",
              position: "top-center",
              duration: 5000,
            });

            // Show the map
            if (data.alert) {
              setActiveResponseAlert({
                alertId: data.alert.id,
                creatorUserId: data.alert.user_id,
                responderUserId: user.id,
                creatorLatitude: data.alert.latitude,
                creatorLongitude: data.alert.longitude,
                responderLatitude: latitude || data.alert.responderLatitude || '',
                responderLongitude: longitude || data.alert.responderLongitude || '',
              });
            }
          }
        } catch (error) {
          console.error('[NotificationCenter] Error responding via URL:', error);
        }
      };

      sendResponse();
    }
  }, [user?.id, setActiveResponseAlert]);

  return <></>;
}
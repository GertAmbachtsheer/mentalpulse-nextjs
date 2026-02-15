'use client';

import { useEffect, useState } from 'react';
import { Notification } from '@/lib/notificationService';
import { canShowNotifications, showPanicAlertNotification  } from '@/lib/pushNotifications';
import { useLocationStore } from '@/store/locationStore';
import { useUser } from "@clerk/nextjs";
import { toast } from 'sonner';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { isLocationEnabled } = useLocationStore();
  const { user } = useUser();
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set());

  // Helper function to fetch panic alert data
  const fetchPanicAlert = async (alertId: string, latitude: string, longitude: string) => {
    try {
      // Call the API endpoint to fetch panic alert data
      const response = await fetch('/api/panic-alerts/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          userId: user?.id,
          latitude,
          longitude,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to fetch panic alert:', response.statusText);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching panic alert:', error);
      return null;
    }
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Skip connection confirmation messages
        if (data.type === 'connected') {
          return;
        }

        if (data.type === 'panicAlert') {
          if (!isLocationEnabled || !canShowNotifications()) return;

          const {alertId, userId } = JSON.parse(data.message);

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              // Use position data directly - no need for state
              const currentLocation = {
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString(),
              };
              
              // Fetch the panic alert data
              const panicAlert = await fetchPanicAlert(
                alertId,
                currentLocation.latitude,
                currentLocation.longitude
              );
              console.log(panicAlert)
              if (panicAlert && panicAlert.length > 0) {
                const alert = panicAlert[0];
                const timeAgo = new Date(alert.timestamp).toLocaleString();
                
                setNotifications(panicAlert);
                // await showPanicAlertNotification("", timeAgo, alertId);
              } else {
                console.log('No panic alert found or alert not within range');
              }
            },
            (err) => {
              toast.error(err.message, 
                {
                  position: "top-center",
                  duration: 2000,
                })
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );

          return;
        }

        // Add notification to the list
        // setNotifications((prev) => [data, ...prev].slice(0, 10)); // Keep last 10
        
      } catch (error) {
        console.error('[NotificationCenter] Error parsing notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[NotificationCenter] SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      console.log('[NotificationCenter] Closing SSE connection');
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    if (!notifications || !isLocationEnabled || !canShowNotifications()) return;

    // Show push notification for new alerts
    notifications.forEach(async (alert) => {
      const alertKey = `${alert._id}`;
      
      if (!shownAlerts.has(alertKey)) {
        const timeAgo = new Date(alert.timestamp).toLocaleString()
        
        await showPanicAlertNotification("", timeAgo, alert._id);
        
        setShownAlerts((prev) => new Set(prev).add(alertKey));
      }
    });
  }, [notifications]);
  
  // Listen for notification clicks from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('[NotificationCenter] Received message from SW:', event.data);
      
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { alert, action } = event.data;
        
        console.log('[NotificationCenter] Notification click event:', { alert, action });
        
        if (alert) {
          // Could navigate to a map view or show more details
          console.log("View alert from notification:", alert);
          // TODO: Implement navigation to alert details/map view
          toast.success("View alert from notification", {
            position: "top-center",
            duration: 5000,
          })
        }
      }
    };

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      console.log('[NotificationCenter] Setting up service worker message listener');
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        console.log('[NotificationCenter] Removing service worker message listener');
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  // Listen for notification clicks (fallback for non-service worker notifications)
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { alert } = customEvent.detail;
      
      if (alert) {
        // Could navigate to a map view or show more details
        console.log("View alert:", alert);
        // TODO: Implement navigation to alert details/map view
        toast.success("View alert from notification", {
          position: "top-center",
          duration: 5000,
        })
      }
    };

    window.addEventListener('notificationclick', handleNotificationClick);
    
    return () => {
      window.removeEventListener('notificationclick', handleNotificationClick);
    };
  }, []);
  
  return (
    <></>
  );
}
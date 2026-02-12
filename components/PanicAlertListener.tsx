'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { panicAlertsApi, locationsApi } from "@/lib/convexCalls";
import { useLocationStore } from "@/store/locationStore";
import { 
  requestNotificationPermission, 
  showPanicAlertNotification,
  canShowNotifications 
} from "@/lib/pushNotifications";

export default function PanicAlertListener() {
  const { user } = useUser();
  const { isLocationEnabled } = useLocationStore();
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Request notification permission on mount
  useEffect(() => {
    const initNotifications = async () => {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'denied') {
        console.warn('Notification permission denied. Panic alerts will not be shown.');
      }
    };
    
    initNotifications();
  }, []);
  
  // Get user's current location
  const userLocation = useQuery(
    locationsApi.getUserLocation,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Get relevant panic alerts (within 20km)
  const relevantAlerts = useQuery(
    panicAlertsApi.getRelevantPanicAlerts,
    user?.id && userLocation?.latitude && userLocation?.longitude
      ? {
          userId: user.id,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }
      : "skip"
  );

  useEffect(() => {
    if (!relevantAlerts || !isLocationEnabled || !canShowNotifications()) return;

    // Show push notification for new alerts
    relevantAlerts.forEach(async (alert) => {
      const alertKey = `${alert._id}`;
      
      if (!shownAlerts.has(alertKey)) {
        const distance = alert.distance.toFixed(1);
        const timeAgo = getTimeAgo(alert.timestamp);
        
        await showPanicAlertNotification(distance, timeAgo, alert);
        
        setShownAlerts((prev) => new Set(prev).add(alertKey));
      }
    });
  }, [relevantAlerts, isLocationEnabled, shownAlerts]);

  // Listen for notification clicks from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { alert } = event.data;
        
        if (alert) {
          // Could navigate to a map view or show more details
          console.log("View alert from notification:", alert);
          // TODO: Implement navigation to alert details/map view
        }
      }
    };

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
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
      }
    };

    window.addEventListener('notificationclick', handleNotificationClick);
    
    return () => {
      window.removeEventListener('notificationclick', handleNotificationClick);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 120) return "1 minute ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return "1 hour ago";
  return `${Math.floor(seconds / 3600)} hours ago`;
}

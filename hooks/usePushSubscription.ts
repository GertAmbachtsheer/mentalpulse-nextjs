'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * Converts a base64 URL-safe string to a Uint8Array for the VAPID key.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook that subscribes the current user to Web Push notifications.
 * Runs once on mount when the user is authenticated.
 */
export function usePushSubscription() {
  const { user } = useUser();
  const subscribed = useRef(false);

  useEffect(() => {
    if (!user?.id || subscribed.current) return;

    const subscribe = async () => {
      try {
        // Check browser support
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('[PushSubscription] Push notifications not supported');
          return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[PushSubscription] Notification permission denied');
          return;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe with VAPID public key
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.error('[PushSubscription] VAPID public key not configured');
            return;
          }

          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
          });
        }

        // Send subscription to the server
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            subscription: subscription.toJSON(),
          }),
        });

        if (response.ok) {
          console.log('[PushSubscription] Successfully subscribed to push notifications');
          subscribed.current = true;
        } else {
          console.error('[PushSubscription] Failed to save subscription to server');
        }
      } catch (error) {
        console.error('[PushSubscription] Error subscribing:', error);
      }
    };

    subscribe();
  }, [user?.id]);
}

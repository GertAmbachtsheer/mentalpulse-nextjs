import { create } from 'zustand';

interface LocationState {
  userId: string | null;
  isLocationEnabled: boolean;
  notificationsEnabled: boolean;
  initForUser: (userId: string) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  reset: () => void;
}

function storageKey(userId: string) {
  return `location-storage-${userId}`;
}

function loadFromStorage(userId: string): { isLocationEnabled: boolean; notificationsEnabled: boolean } {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { isLocationEnabled: false, notificationsEnabled: false };
    return JSON.parse(raw);
  } catch {
    return { isLocationEnabled: false, notificationsEnabled: false };
  }
}

function saveToStorage(userId: string, data: { isLocationEnabled: boolean; notificationsEnabled: boolean }) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function registerPushSubscription(userId: string): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidKey) {
    console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
    return false;
  }

  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    console.error('[Push] No service worker registered');
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  // Unsubscribe from any stale subscription before creating a new one
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) await existingSub.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer.slice(0) as ArrayBuffer,
  });

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
  });

  if (!res.ok) {
    console.error('[Push] Subscribe API failed:', await res.text());
    return false;
  }

  return true;
}

async function unregisterPushSubscription(userId: string): Promise<void> {
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export const useLocationStore = create<LocationState>()((set, get) => ({
  userId: null,
  isLocationEnabled: false,
  notificationsEnabled: false,
  initForUser: (userId) => {
    const saved = loadFromStorage(userId);
    set({ userId, ...saved });
  },
  setLocationEnabled: (enabled) => {
    const { userId, notificationsEnabled } = get();
    set({ isLocationEnabled: enabled });
    if (userId) saveToStorage(userId, { isLocationEnabled: enabled, notificationsEnabled });
  },
  setNotificationsEnabled: async (enabled) => {
    const { userId, isLocationEnabled } = get();
    if (!userId) return;

    // Update store immediately so the Switch stays in sync and doesn't re-fire
    set({ notificationsEnabled: enabled });
    saveToStorage(userId, { isLocationEnabled, notificationsEnabled: enabled });

    if (enabled) {
      try {
        const granted = await registerPushSubscription(userId);
        if (!granted) {
          set({ notificationsEnabled: false });
          saveToStorage(userId, { isLocationEnabled, notificationsEnabled: false });
        }
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        console.error('[Push] Failed to register subscription:', err);
        if (isAbort) {
          console.warn('[Push] Push service error — clear site data in browser settings and retry.');
        }
        set({ notificationsEnabled: false });
        saveToStorage(userId, { isLocationEnabled, notificationsEnabled: false });
      }
    } else {
      await unregisterPushSubscription(userId);
    }
  },
  reset: () => set({ userId: null, isLocationEnabled: false, notificationsEnabled: false }),
}));

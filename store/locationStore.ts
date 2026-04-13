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

function buffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  return va.every((byte, i) => byte === vb[i]);
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

async function savePushSubscriptionToServer(userId: string, subscription: PushSubscription): Promise<boolean> {
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

async function registerPushSubscription(userId: string): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const keyRes = await fetch(`/api/push/public-key?k=${Date.now()}`, { cache: 'no-store' });
  if (!keyRes.ok) {
    console.error('[Push] Could not load VAPID public key from server:', keyRes.status, await keyRes.text());
    return false;
  }
  let vapidKey: string;
  try {
    const body = (await keyRes.json()) as { publicKey?: string };
    vapidKey = body.publicKey?.trim() ?? '';
  } catch {
    console.error('[Push] Invalid JSON from /api/push/public-key');
    return false;
  }
  if (!vapidKey) {
    console.error('[Push] Server returned empty publicKey');
    return false;
  }

  let keyBytes: Uint8Array;
  try {
    keyBytes = urlBase64ToUint8Array(vapidKey);
  } catch {
    console.error('[Push] VAPID public key is not valid base64url');
    return false;
  }
  // Uncompressed P-256 SPKI / raw public key from web-push is 65 bytes (0x04 || x || y)
  if (keyBytes.length !== 65) {
    console.error(
      '[Push] VAPID public key decodes to wrong length (expected 65 bytes, got',
      keyBytes.length,
      '). Check env for quotes, newlines, or a truncated value.'
    );
    return false;
  }
  // Extract a plain ArrayBuffer (not ArrayBufferLike) — required by pushManager.subscribe()
  const applicationServerKey = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;

  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.update();
  } catch {
    /* ignore */
  }
  console.log('[Push] SW scope:', registration.scope);
  console.log('[Push] SW scriptURL:', registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL);

  // Ensure the current page is controlled by a SW before subscribing.
  // In some update/claim edge-cases, ready resolves but controller isn't set yet.
  if (!navigator.serviceWorker.controller) {
    console.warn('[Push] No SW controller yet; waiting for controllerchange');
    await new Promise<void>((resolve) => {
      const onChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onChange);
      // safety timeout
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve();
      }, 2000);
    });
    console.log('[Push] SW controller now:', !!navigator.serviceWorker.controller);
  }

  // Best-effort: detect if this network blocks Google FCM endpoints.
  // no-cors avoids CORS errors; a network block typically throws instead of returning an opaque response.
  try {
    // Hit the origin (not /fcm/send) to avoid noisy 404s.
    await fetch('https://fcm.googleapis.com/', { mode: 'no-cors', cache: 'no-store' });
    console.log('[Push] FCM probe: reachable (opaque response expected)');
  } catch (e) {
    console.warn('[Push] FCM probe: failed (possible network/adblock/corporate firewall blocking googleapis)', e);
  }

  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    // Only reuse the existing subscription if it was created with the current VAPID key.
    // A mismatch (e.g. after VAPID key rotation) causes Chrome to throw
    // "AbortError: Registration failed - push service error" on the next subscribe() call.
    const existingKey = existingSub.options?.applicationServerKey;
    const keysMatch = existingKey ? buffersEqual(existingKey, applicationServerKey) : false;

    if (keysMatch) {
      const synced = await savePushSubscriptionToServer(userId, existingSub);
      if (synced) return true;
    } else {
      console.warn('[Push] Existing subscription has a different VAPID key — unsubscribing to create a fresh one');
    }

    try {
      await existingSub.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });
  } catch (err) {
    console.error('[Push] subscribe() failed:', err);
    throw err;
  }

  return savePushSubscriptionToServer(userId, subscription);
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

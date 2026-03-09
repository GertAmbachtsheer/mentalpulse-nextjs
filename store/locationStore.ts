import { create } from 'zustand';

interface LocationState {
  userId: string | null;
  isLocationEnabled: boolean;
  notificationsEnabled: boolean;
  initForUser: (userId: string) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
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
  setNotificationsEnabled: (enabled) => {
    const { userId, isLocationEnabled } = get();
    set({ notificationsEnabled: enabled });
    if (userId) saveToStorage(userId, { isLocationEnabled, notificationsEnabled: enabled });
  },
  reset: () => set({ userId: null, isLocationEnabled: false, notificationsEnabled: false }),
}));

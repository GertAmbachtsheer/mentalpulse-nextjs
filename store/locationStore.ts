import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  isLocationEnabled: boolean;
  isTracking: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  setTracking: (tracking: boolean) => void;
  enableLocation: () => void;
  disableLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      isLocationEnabled: false,
      isTracking: false,
      setLocationEnabled: (enabled) => set({ isLocationEnabled: enabled }),
      setTracking: (tracking) => set({ isTracking: tracking }),
      enableLocation: () => set({ isLocationEnabled: true, isTracking: true }),
      disableLocation: () => set({ isLocationEnabled: false, isTracking: false }),
    }),
    {
      name: 'location-storage', // name of the item in localStorage
    }
  )
);

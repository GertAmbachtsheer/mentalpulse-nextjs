import { create } from 'zustand';

interface AlertResponseData {
  alertId: string;
  creatorUserId: string;
  responderUserId: string;
  creatorLatitude: string;
  creatorLongitude: string;
  responderLatitude: string;
  responderLongitude: string;
}

interface PanicAlertState {
  activeResponseAlert: AlertResponseData | null;
  alertCancelledNotice: boolean;
  setActiveResponseAlert: (alert: AlertResponseData) => void;
  clearActiveResponseAlert: () => void;
  setAlertCancelledNotice: (cancelled: boolean) => void;
}

export const usePanicAlertStore = create<PanicAlertState>()((set) => ({
  activeResponseAlert: null,
  alertCancelledNotice: false,
  setActiveResponseAlert: (alert) =>
    set({ activeResponseAlert: alert }),
  clearActiveResponseAlert: () =>
    set({ activeResponseAlert: null, alertCancelledNotice: false }),
  setAlertCancelledNotice: (cancelled) =>
    set({ alertCancelledNotice: cancelled }),
}));

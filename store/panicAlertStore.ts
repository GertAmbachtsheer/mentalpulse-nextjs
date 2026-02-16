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
  showResponseMap: boolean;
  setActiveResponseAlert: (alert: AlertResponseData) => void;
  clearActiveResponseAlert: () => void;
  setShowResponseMap: (show: boolean) => void;
}

export const usePanicAlertStore = create<PanicAlertState>()((set) => ({
  activeResponseAlert: null,
  showResponseMap: false,
  setActiveResponseAlert: (alert) =>
    set({ activeResponseAlert: alert, showResponseMap: true }),
  clearActiveResponseAlert: () =>
    set({ activeResponseAlert: null, showResponseMap: false }),
  setShowResponseMap: (show) => set({ showResponseMap: show }),
}));

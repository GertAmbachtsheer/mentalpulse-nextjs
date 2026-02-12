import { api } from "../convex/_generated/api";

// Export the API references directly
// Components should call hooks (useQuery, useMutation) directly with these
export const moodsApi = {
  getMoods: api.moods.getMoods,
  getRecentUserMood: api.moods.getRecentUserMood,
  upsertMood: api.moods.upsertMood,
};

export const locationsApi = {
  getUserLocation: api.locations.getUserLocation,
  upsertLocation: api.locations.upsertLocation,
};

export const supportApi = {
  getSupport: api.support.getSupport,
};

export const panicAlertsApi = {
  triggerPanicAlert: api.panicAlerts.triggerPanicAlert,
  getActivePanicAlerts: api.panicAlerts.getActivePanicAlerts,
  getNearbyUsers: api.panicAlerts.getNearbyUsers,
  dismissPanicAlert: api.panicAlerts.dismissPanicAlert,
  getRelevantPanicAlerts: api.panicAlerts.getRelevantPanicAlerts,
  getUserActivePanicAlert: api.panicAlerts.getUserActivePanicAlert,
};

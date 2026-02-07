import { api } from "../convex/_generated/api";

// Export the API references directly
// Components should call hooks (useQuery, useMutation) directly with these
export const moodsApi = {
  getMoods: api.moods.getMoods,
  getRecentUserMood: api.moods.getRecentUserMood,
  upsertMood: api.moods.upsertMood,
};
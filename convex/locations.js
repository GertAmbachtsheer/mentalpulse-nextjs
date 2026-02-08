import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserLocation = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db
      .query("locations")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .first();
  },
});

export const upsertLocation = mutation({
  args: {
    id: v.optional(v.id("locations")),
    userId: v.string(),
    longitude: v.string(),
    latitude: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      return await ctx.db.replace(args.id, {
        userId: args.userId,
        longitude: args.longitude,
        latitude: args.latitude,
      });
    } else {
      return await ctx.db.insert("locations", {
        userId: args.userId,
        longitude: args.longitude,
        latitude: args.latitude,
      });
    }
  },
});
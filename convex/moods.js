import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMoods = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db
      .query("moods")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("asc")
      .take(14);
  },
});

export const getRecentUserMood = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db
      .query("moods")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .first();
  },
});

export const upsertMood = mutation({
  args: {
    id: v.optional(v.id("moods")),
    userId: v.string(),
    mood: v.string(),
    sameDay: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.sameDay) {
      const existing = await ctx.db
        .query("moods")
        .filter((q) => q.eq(q.field("_id"), args.id))
        .order("desc")
        .first();
      
      await ctx.db.replace(existing._id, {
        userId: args.userId,
        mood: args.mood,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("moods", {
        userId: args.userId,
        mood: args.mood,
      });
    }
  },
});
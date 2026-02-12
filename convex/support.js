import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSupport = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("support")
      .collect();
  },
});
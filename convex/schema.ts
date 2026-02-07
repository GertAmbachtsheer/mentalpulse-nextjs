import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  moods: defineTable({
    mood: v.string(),
    userId: v.string(),
  }).index("by_userId", { fields: ["userId"] }),
});
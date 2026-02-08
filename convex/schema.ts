import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  locations: defineTable({
    longitude: v.string(),
    latitude: v.string(),
    userId: v.string(),
  }).index("by_userId", { fields: ["userId"] }),
  moods: defineTable({
    mood: v.string(),
    userId: v.string(),
  }).index("by_userId", { fields: ["userId"] }),
});
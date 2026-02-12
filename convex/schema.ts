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
  support: defineTable({
    title: v.string(),
    description: v.string(),
    benefits: v.string(),
    price: v.string(),
    sortOrder: v.number(),
    type: v.string(),
  }).index("by_type", { fields: ["type"] }),
});
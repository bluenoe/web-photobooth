import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  photos: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    filename: v.string(),
    filter: v.optional(v.string()),
    frameId: v.optional(v.string()),
    overlays: v.optional(v.array(v.object({
      type: v.string(),
      x: v.number(),
      y: v.number(),
      scale: v.number(),
      rotation: v.optional(v.number())
    })))
  }).index("by_user", ["userId"])
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

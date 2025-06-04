import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhoto = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.db.insert("photos", {
      userId,
      storageId: args.storageId,
      filename: args.filename,
      filter: args.filter,
      frameId: args.frameId,
      overlays: args.overlays
    });
  },
});

export const getUserPhotos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: await ctx.storage.getUrl(photo.storageId),
      }))
    );
  },
});

export const deletePhoto = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.userId !== userId) {
      throw new Error("Photo not found or unauthorized");
    }
    
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
  },
});

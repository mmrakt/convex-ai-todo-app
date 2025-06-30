import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const logAIContent = mutation({
  args: {
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("decomposition"),
      v.literal("research"),
      v.literal("suggestion")
    ),
    content: v.string(),
    metadata: v.optional(
      v.object({
        provider: v.optional(v.string()),
        model: v.string(),
        tokens: v.number(),
        cost: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or insufficient permissions");
    }

    return await ctx.db.insert("aiContents", {
      taskId: args.taskId,
      type: args.type,
      content: args.content,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

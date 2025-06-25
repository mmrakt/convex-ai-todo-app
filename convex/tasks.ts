import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTasks = query({
  args: {
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed"), v.literal("on_hold"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    let tasksQuery = ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId));
    
    if (args.status) {
      tasksQuery = tasksQuery.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    if (args.priority) {
      tasksQuery = tasksQuery.filter((q) => q.eq(q.field("priority"), args.priority));
    }

    const tasks = await tasksQuery.collect();
    
    if (args.limit) {
      return tasks.slice(0, args.limit);
    }
    
    return tasks;
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const task = await ctx.db.get(args.id);
    
    if (!task || task.userId !== userId) {
      return null;
    }

    return task;
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    deadline: v.optional(v.number()),
    category: v.string(),
    estimatedTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const now = Date.now();
    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      description: args.description,
      status: "todo" as const,
      priority: args.priority,
      deadline: args.deadline,
      category: args.category,
      estimatedTime: args.estimatedTime,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed"), v.literal("on_hold"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    deadline: v.optional(v.number()),
    category: v.optional(v.string()),
    estimatedTime: v.optional(v.number()),
    actualTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const { taskId, ...updateFields } = args;
    const task = await ctx.db.get(taskId);
    
    if (!task || task.userId !== userId) {
      throw new Error("タスクが見つからないか、権限がありません");
    }

    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );

    return await ctx.db.patch(taskId, {
      ...fieldsToUpdate,
      updatedAt: Date.now(),
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed"), v.literal("on_hold")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("タスクが見つからないか、権限がありません");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "completed" && !task.actualTime) {
      const elapsedTime = Math.floor((Date.now() - task.createdAt) / (1000 * 60));
      updateData.actualTime = elapsedTime;
    }

    return await ctx.db.patch(args.taskId, updateData);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const task = await ctx.db.get(args.taskId);
    
    if (!task || task.userId !== userId) {
      throw new Error("タスクが見つからないか、権限がありません");
    }

    // 関連するサブタスクを削除
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const subtask of subtasks) {
      await ctx.db.delete(subtask._id);
    }

    // AI生成コンテンツを削除
    const aiContents = await ctx.db
      .query("aiContents")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const aiContent of aiContents) {
      await ctx.db.delete(aiContent._id);
    }

    return await ctx.db.delete(args.taskId);
  },
});

export const getTaskStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "todo").length,
      urgent: tasks.filter(t => t.priority === "urgent").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      onHold: tasks.filter(t => t.status === "on_hold").length,
      high: tasks.filter(t => t.priority === "high").length,
      medium: tasks.filter(t => t.priority === "medium").length,
      low: tasks.filter(t => t.priority === "low").length,
    };

    return stats;
  },
});

export const updateMemo = mutation({
  args: {
    id: v.id("tasks"),
    memo: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("タスクが見つからないか、権限がありません");
    }

    return await ctx.db.patch(args.id, {
      memo: args.memo,
      updatedAt: Date.now(),
    });
  },
});
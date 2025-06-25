import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getSubtasks = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query('subtasks')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('asc')
      .collect();
  },
});

export const createSubtask = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error('タスクが見つからないか、権限がありません');
    }

    const existingSubtasks = await ctx.db
      .query('subtasks')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .collect();

    const maxOrder = existingSubtasks.length > 0 
      ? Math.max(...existingSubtasks.map(s => s.order))
      : 0;

    return await ctx.db.insert('subtasks', {
      taskId: args.taskId,
      title: args.title,
      completed: false,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const updateSubtask = mutation({
  args: {
    subtaskId: v.id('subtasks'),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const subtask = await ctx.db.get(args.subtaskId);
    if (!subtask) {
      throw new Error('サブタスクが見つかりません');
    }

    const task = await ctx.db.get(subtask.taskId);
    if (!task || task.userId !== userId) {
      throw new Error('権限がありません');
    }

    const { subtaskId, ...updateFields } = args;
    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );

    return await ctx.db.patch(args.subtaskId, fieldsToUpdate);
  },
});

export const toggleSubtask = mutation({
  args: { subtaskId: v.id('subtasks') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const subtask = await ctx.db.get(args.subtaskId);
    if (!subtask) {
      throw new Error('サブタスクが見つかりません');
    }

    const task = await ctx.db.get(subtask.taskId);
    if (!task || task.userId !== userId) {
      throw new Error('権限がありません');
    }

    return await ctx.db.patch(args.subtaskId, {
      completed: !subtask.completed,
    });
  },
});

export const deleteSubtask = mutation({
  args: { subtaskId: v.id('subtasks') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const subtask = await ctx.db.get(args.subtaskId);
    if (!subtask) {
      throw new Error('サブタスクが見つかりません');
    }

    const task = await ctx.db.get(subtask.taskId);
    if (!task || task.userId !== userId) {
      throw new Error('権限がありません');
    }

    return await ctx.db.delete(args.subtaskId);
  },
});

export const reorderSubtasks = mutation({
  args: {
    taskId: v.id('tasks'),
    subtaskOrders: v.array(v.object({
      subtaskId: v.id('subtasks'),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error('権限がありません');
    }

    for (const { subtaskId, order } of args.subtaskOrders) {
      await ctx.db.patch(subtaskId, { order });
    }
  },
});
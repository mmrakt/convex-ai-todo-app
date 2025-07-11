import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';

// AIコンテンツの作成
export const create = internalMutation({
  args: {
    taskId: v.id('tasks'),
    type: v.union(v.literal('decomposition'), v.literal('research'), v.literal('suggestion')),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.string(),
        tokens: v.number(),
        cost: v.number(),
      }),
    ),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('aiContents', args);
  },
});

// タスクに関連するAIコンテンツの取得
export const getByTask = query({
  args: {
    taskId: v.id('tasks'),
    type: v.optional(
      v.union(v.literal('decomposition'), v.literal('research'), v.literal('suggestion')),
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('aiContents').withIndex('by_task', (q) => q.eq('taskId', args.taskId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field('type'), args.type));
    }

    return await query.order('desc').collect();
  },
});

// Get the latest support content for a task
export const getLatestSupport = query({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query('aiContents')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .filter((q) => q.eq(q.field('type'), 'suggestion'))
      .order('desc')
      .first();

    return latest;
  },
});

// AIコンテンツの削除
export const deleteByTask = internalMutation({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const contents = await ctx.db
      .query('aiContents')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .collect();

    for (const content of contents) {
      await ctx.db.delete(content._id);
    }
  },
});

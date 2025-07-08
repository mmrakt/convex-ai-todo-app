import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { AuthenticationError, handleError } from './lib/base';
import type { TaskData } from './lib/repositories/taskRepository';
import { TaskService, type UpdateTaskInput } from './lib/services/taskService';

// Query: Get tasks with optional filters
export const getTasks = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('todo'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('on_hold'),
      ),
    ),
    priority: v.optional(
      v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      return await service.getTasks(args);
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Query: Get single task by ID
export const get = query({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return null;
      }
      const service = new TaskService({ ...ctx, userId });
      return await service.getTask(args.id);
    } catch (_error) {
      // Return null for not found errors to maintain backwards compatibility
      return null;
    }
  },
});

// Query: Get single task by ID (alias for compatibility)
export const getTask = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return null;
      }
      const service = new TaskService({ ...ctx, userId });
      return await service.getTask(args.taskId);
    } catch (_error) {
      return null;
    }
  },
});

// Mutation: Create new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('todo'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('on_hold'),
      ),
    ),
    priority: v.optional(
      v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
    ),
    deadline: v.optional(v.number()),
    category: v.optional(v.string()),
    estimatedTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      return await service.createTask(args);
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Mutation: Update task
export const updateTask = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('todo'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('on_hold'),
      ),
    ),
    priority: v.optional(
      v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
    ),
    deadline: v.optional(v.number()),
    category: v.optional(v.string()),
    estimatedTime: v.optional(v.number()),
    actualTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const { taskId, ...updateFields } = args;
      const service = new TaskService({ ...ctx, userId });
      await service.updateTask(taskId, updateFields);
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Mutation: Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id('tasks'),
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('on_hold'),
    ),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      const task = await service.getTask(args.taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      const updateData: UpdateTaskInput = { status: args.status as TaskData['status'] };

      // Auto-calculate actual time when completing
      if (args.status === 'completed' && !task.actualTime) {
        const elapsedTime = Math.floor((Date.now() - task.createdAt) / (1000 * 60));
        updateData.actualTime = elapsedTime;
      }

      await service.updateTask(args.taskId, updateData);
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Mutation: Delete task
export const deleteTask = mutation({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      await service.deleteTask(args.taskId);
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Query: Get task statistics
export const getTaskStats = query({
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      const stats = await service.getTaskStats();

      // Transform to match expected format
      return {
        total: stats.totalTasks,
        todo: stats.byStatus.todo || 0,
        inProgress: stats.byStatus.in_progress || 0,
        completed: stats.byStatus.completed || 0,
        onHold: stats.byStatus.on_hold || 0,
        low: stats.byPriority.low || 0,
        medium: stats.byPriority.medium || 0,
        high: stats.byPriority.high || 0,
        urgent: stats.byPriority.urgent || 0,
      };
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Mutation: Update task memo
export const updateMemo = mutation({
  args: {
    id: v.id('tasks'),
    memo: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });
      await service.updateTask(args.id, { memo: args.memo });
    } catch (error) {
      throw handleError(error);
    }
  },
});

// Mutation: Update AI support status
export const updateAISupport = mutation({
  args: {
    taskId: v.id('tasks'),
    status: v.union(v.literal('generating'), v.literal('completed'), v.literal('error')),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }
      const service = new TaskService({ ...ctx, userId });

      const updateData: UpdateTaskInput = {
        aiSupportStatus: args.status,
      };

      if (args.content) {
        updateData.aiSupportContent = args.content;
        updateData.aiSupportGeneratedAt = Date.now();
      }

      await service.updateTask(args.taskId, updateData);
    } catch (error) {
      throw handleError(error);
    }
  },
});

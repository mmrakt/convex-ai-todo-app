import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuthenticationError, handleError } from "./lib/base";
import { SubtaskRepository } from "./lib/repositories/subtaskRepository";
import { TaskRepository } from "./lib/repositories/taskRepository";

export const getSubtasks = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return [];
      }

      const taskRepo = new TaskRepository(ctx.db);
      // Verify task ownership
      await taskRepo.findByIdAndUserId(args.taskId, userId);

      const subtaskRepo = new SubtaskRepository(ctx.db);
      return await subtaskRepo.findByTaskId(args.taskId);
    } catch (error) {
      // Return empty array for errors to maintain backwards compatibility
      return [];
    }
  },
});

export const createSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }

      const taskRepo = new TaskRepository(ctx.db);
      // Verify task ownership
      await taskRepo.findByIdAndUserId(args.taskId, userId);

      const subtaskRepo = new SubtaskRepository(ctx.db);
      return await subtaskRepo.create(args);
    } catch (error) {
      throw handleError(error);
    }
  },
});

export const updateSubtask = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }

      const subtaskRepo = new SubtaskRepository(ctx.db);
      const taskRepo = new TaskRepository(ctx.db);

      // Get subtask and verify ownership through task
      const subtask = await subtaskRepo.findById(args.subtaskId);
      if (!subtask) {
        throw new Error("サブタスクが見つかりません");
      }

      await taskRepo.findByIdAndUserId(subtask.taskId, userId);

      const { subtaskId, ...updateFields } = args;
      return await subtaskRepo.update(subtaskId, updateFields);
    } catch (error) {
      throw handleError(error);
    }
  },
});

export const toggleSubtask = mutation({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }

      const subtaskRepo = new SubtaskRepository(ctx.db);
      const taskRepo = new TaskRepository(ctx.db);

      // Get subtask and verify ownership through task
      const subtask = await subtaskRepo.findById(args.subtaskId);
      if (!subtask) {
        throw new Error("サブタスクが見つかりません");
      }

      await taskRepo.findByIdAndUserId(subtask.taskId, userId);

      return await subtaskRepo.toggle(args.subtaskId);
    } catch (error) {
      throw handleError(error);
    }
  },
});

export const deleteSubtask = mutation({
  args: { subtaskId: v.id("subtasks") },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }

      const subtaskRepo = new SubtaskRepository(ctx.db);
      const taskRepo = new TaskRepository(ctx.db);

      // Get subtask and verify ownership through task
      const subtask = await subtaskRepo.findById(args.subtaskId);
      if (!subtask) {
        throw new Error("サブタスクが見つかりません");
      }

      await taskRepo.findByIdAndUserId(subtask.taskId, userId);

      return await subtaskRepo.delete(args.subtaskId);
    } catch (error) {
      throw handleError(error);
    }
  },
});

export const reorderSubtasks = mutation({
  args: {
    taskId: v.id("tasks"),
    subtaskOrders: v.array(
      v.object({
        subtaskId: v.id("subtasks"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AuthenticationError();
      }

      const taskRepo = new TaskRepository(ctx.db);
      const subtaskRepo = new SubtaskRepository(ctx.db);

      // Verify task ownership
      await taskRepo.findByIdAndUserId(args.taskId, userId);

      await subtaskRepo.reorder(args.taskId, args.subtaskOrders);
    } catch (error) {
      throw handleError(error);
    }
  },
});

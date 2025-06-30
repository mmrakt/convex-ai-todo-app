import type { Id } from "@/_generated/dataModel";
import {
  type AuthenticatedMutationCtx,
  type AuthenticatedQueryCtx,
  BaseService,
  ValidationError,
} from "@/lib/base";
import { SubtaskRepository } from "@/lib/repositories/subtaskRepository";
import {
  type TaskData,
  type TaskFilter,
  TaskRepository,
} from "@/lib/repositories/taskRepository";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskData["status"];
  priority?: TaskData["priority"];
  deadline?: number;
  category?: string;
  estimatedTime?: number;
  memo?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskData["status"];
  priority?: TaskData["priority"];
  deadline?: number;
  category?: string;
  estimatedTime?: number;
  actualTime?: number;
  memo?: string;
}

export class TaskService extends BaseService {
  private taskRepo: TaskRepository;
  private subtaskRepo: SubtaskRepository;

  constructor(private ctx: AuthenticatedQueryCtx | AuthenticatedMutationCtx) {
    super();
    this.taskRepo = new TaskRepository(ctx.db);
    this.subtaskRepo = new SubtaskRepository(ctx.db);
  }

  async getTasks(filter: Omit<TaskFilter, "userId">): Promise<TaskData[]> {
    return this.taskRepo.findByUser({
      ...filter,
      userId: this.ctx.userId,
    });
  }

  async getTask(id: Id<"tasks">): Promise<TaskData | null> {
    try {
      return await this.taskRepo.findByIdAndUserId(id, this.ctx.userId);
    } catch {
      return null;
    }
  }

  async createTask(input: CreateTaskInput): Promise<Id<"tasks">> {
    // Validate input
    this.validateTaskInput(input);

    return await this.taskRepo.create({
      ...input,
      userId: this.ctx.userId,
      status: input.status || "todo",
      priority: input.priority || "medium",
    });
  }

  async updateTask(id: Id<"tasks">, input: UpdateTaskInput): Promise<void> {
    // Verify ownership
    await this.taskRepo.findByIdAndUserId(id, this.ctx.userId);

    // Validate input if provided
    if (input.title !== undefined) {
      this.validateTaskInput({
        title: input.title,
        description: input.description,
      });
    }

    await this.taskRepo.update(id, input);
  }

  async deleteTask(id: Id<"tasks">): Promise<void> {
    // Verify ownership
    await this.taskRepo.findByIdAndUserId(id, this.ctx.userId);

    // Delete all subtasks first
    await this.subtaskRepo.deleteByTaskId(id);

    // Delete the task
    await this.taskRepo.delete(id);
  }

  async getTaskStats(): Promise<{
    totalTasks: number;
    byStatus: Record<TaskData["status"], number>;
    byPriority: Record<TaskData["priority"], number>;
    upcomingDeadlines: TaskData[];
  }> {
    const userId = this.ctx.userId;
    const tasks = await this.taskRepo.findByUser({ userId });

    const byStatus = await this.taskRepo.countByStatus(userId);

    const byPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskData["priority"], number>);

    const upcomingDeadlines = await this.taskRepo.getUpcomingDeadlines(userId);

    return {
      totalTasks: tasks.length,
      byStatus,
      byPriority,
      upcomingDeadlines,
    };
  }

  async getTaskWithProgress(
    id: Id<"tasks">
  ): Promise<TaskData & { progress: number }> {
    const task = await this.taskRepo.findByIdAndUserId(id, this.ctx.userId);
    const progress = await this.subtaskRepo.getCompletionRate(id);

    return {
      ...task,
      progress,
    };
  }

  private validateTaskInput(input: {
    title: string;
    description?: string;
  }): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }

    if (input.title.length > 200) {
      throw new ValidationError("Title must be 200 characters or less");
    }

    if (input.description && input.description.length > 2000) {
      throw new ValidationError("Description must be 2000 characters or less");
    }
  }
}

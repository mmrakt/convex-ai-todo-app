import type { Id } from "../../_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "../../_generated/server";
import { AuthorizationError, NotFoundError } from "../base";

export interface TaskData {
  _id: Id<"tasks">;
  userId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed" | "on_hold";
  priority: "low" | "medium" | "high" | "urgent";
  deadline?: number;
  category: string;
  estimatedTime?: number;
  actualTime?: number;
  memo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskFilter {
  userId: string;
  status?: TaskData["status"];
  priority?: TaskData["priority"];
  limit?: number;
}

export class TaskRepository {
  constructor(private db: DatabaseReader | DatabaseWriter) {}

  async findById(id: Id<"tasks">): Promise<TaskData | null> {
    return await this.db.get(id);
  }

  async findByIdAndUserId(id: Id<"tasks">, userId: string): Promise<TaskData> {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError("タスク");
    }
    if (task.userId !== userId) {
      throw new AuthorizationError();
    }
    return task;
  }

  async findByUser(filter: TaskFilter): Promise<TaskData[]> {
    let query = this.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", filter.userId));

    if (filter.status) {
      query = query.filter((q) => q.eq(q.field("status"), filter.status));
    }

    if (filter.priority) {
      query = query.filter((q) => q.eq(q.field("priority"), filter.priority));
    }

    const tasks = await query.collect();

    if (filter.limit) {
      return tasks.slice(0, filter.limit);
    }

    return tasks;
  }

  async create(
    data: Omit<TaskData, "_id" | "createdAt" | "updatedAt">
  ): Promise<Id<"tasks">> {
    if (!(this.db as DatabaseWriter).insert) {
      throw new Error("Create operation requires a DatabaseWriter");
    }

    return await (this.db as DatabaseWriter).insert("tasks", {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async update(
    id: Id<"tasks">,
    updates: Partial<Omit<TaskData, "_id" | "userId" | "createdAt">>
  ): Promise<void> {
    if (!(this.db as DatabaseWriter).patch) {
      throw new Error("Update operation requires a DatabaseWriter");
    }

    await (this.db as DatabaseWriter).patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  async delete(id: Id<"tasks">): Promise<void> {
    if (!(this.db as DatabaseWriter).delete) {
      throw new Error("Delete operation requires a DatabaseWriter");
    }

    await (this.db as DatabaseWriter).delete(id);
  }

  async countByStatus(
    userId: string
  ): Promise<Record<TaskData["status"], number>> {
    const tasks = await this.findByUser({ userId });

    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskData["status"], number>);
  }

  async getUpcomingDeadlines(
    userId: string,
    days: number = 7
  ): Promise<TaskData[]> {
    const now = Date.now();
    const futureDate = now + days * 24 * 60 * 60 * 1000;

    const tasks = await this.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "completed"),
          q.gte(q.field("deadline"), now),
          q.lte(q.field("deadline"), futureDate)
        )
      )
      .collect();

    return tasks.sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  }
}

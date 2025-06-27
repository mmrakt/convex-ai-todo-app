import type { Id } from "../../_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "../../_generated/server";
import { NotFoundError } from "../base";

export interface SubtaskData {
  _id: Id<"subtasks">;
  taskId: Id<"tasks">;
  title: string;
  completed: boolean;
  order: number;
  createdAt: number;
}

export interface SubtaskCreateData {
  taskId: Id<"tasks">;
  title: string;
}

export interface SubtaskUpdateData {
  title?: string;
  completed?: boolean;
  order?: number;
}

export class SubtaskRepository {
  constructor(private db: DatabaseReader | DatabaseWriter) {}

  async findById(id: Id<"subtasks">): Promise<SubtaskData | null> {
    return await this.db.get(id);
  }

  async findByTaskId(taskId: Id<"tasks">): Promise<SubtaskData[]> {
    return await this.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .order("asc")
      .collect();
  }

  async create(data: SubtaskCreateData): Promise<Id<"subtasks">> {
    if (!(this.db as DatabaseWriter).insert) {
      throw new Error("Create operation requires a DatabaseWriter");
    }

    // Get max order for the task
    const existingSubtasks = await this.findByTaskId(data.taskId);
    const maxOrder =
      existingSubtasks.length > 0
        ? Math.max(...existingSubtasks.map((s) => s.order))
        : 0;

    return await (this.db as DatabaseWriter).insert("subtasks", {
      ...data,
      completed: false,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  }

  async update(id: Id<"subtasks">, updates: SubtaskUpdateData): Promise<void> {
    if (!(this.db as DatabaseWriter).patch) {
      throw new Error("Update operation requires a DatabaseWriter");
    }

    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(fieldsToUpdate).length > 0) {
      await (this.db as DatabaseWriter).patch(id, fieldsToUpdate);
    }
  }

  async toggle(id: Id<"subtasks">): Promise<void> {
    const subtask = await this.findById(id);
    if (!subtask) {
      throw new NotFoundError("サブタスク");
    }

    await this.update(id, { completed: !subtask.completed });
  }

  async delete(id: Id<"subtasks">): Promise<void> {
    if (!(this.db as DatabaseWriter).delete) {
      throw new Error("Delete operation requires a DatabaseWriter");
    }

    await (this.db as DatabaseWriter).delete(id);
  }

  async reorder(
    taskId: Id<"tasks">,
    subtaskOrders: Array<{ subtaskId: Id<"subtasks">; order: number }>
  ): Promise<void> {
    if (!(this.db as DatabaseWriter).patch) {
      throw new Error("Reorder operation requires a DatabaseWriter");
    }

    for (const { subtaskId, order } of subtaskOrders) {
      await (this.db as DatabaseWriter).patch(subtaskId, { order });
    }
  }

  async getCompletionRate(taskId: Id<"tasks">): Promise<number> {
    const subtasks = await this.findByTaskId(taskId);
    if (subtasks.length === 0) return 0;

    const completed = subtasks.filter((s) => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  async deleteByTaskId(taskId: Id<"tasks">): Promise<void> {
    if (!(this.db as DatabaseWriter).delete) {
      throw new Error("Delete operation requires a DatabaseWriter");
    }

    const subtasks = await this.findByTaskId(taskId);
    for (const subtask of subtasks) {
      await (this.db as DatabaseWriter).delete(subtask._id);
    }
  }
}

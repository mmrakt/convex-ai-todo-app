import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  userProfiles: defineTable({
    userId: v.string(), // Convex AuthのユーザーIDを参照
    name: v.string(),
    skills: v.array(v.string()),
    preferences: v.object({
      theme: v.string(),
      notifications: v.boolean(),
      language: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),
  tasks: defineTable({
    userId: v.string(), // Convex AuthのユーザーIDを使用
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("on_hold")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    deadline: v.optional(v.number()),
    category: v.optional(v.string()),
    estimatedTime: v.optional(v.number()),
    actualTime: v.optional(v.number()),
    memo: v.optional(v.string()),
    aiSupportStatus: v.optional(v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("error")
    )),
    aiSupportContent: v.optional(v.string()),
    aiSupportGeneratedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_deadline", ["deadline"]),
  subtasks: defineTable({
    taskId: v.id("tasks"),
    title: v.string(),
    completed: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),
  aiContents: defineTable({
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("decomposition"),
      v.literal("research"),
      v.literal("suggestion")
    ),
    content: v.string(),
    metadata: v.optional(v.object({
      model: v.string(),
      tokens: v.number(),
      cost: v.number(),
    })),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_type", ["type"]),
});

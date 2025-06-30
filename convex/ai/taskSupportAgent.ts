
import { v } from "convex/values";
import { api } from "@/_generated/api";
import { action } from "@/_generated/server";
import { checkRateLimit, estimateTokens, OLLAMA_CONFIG } from "@/ai/config";

export const supportTask = action({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; content?: string; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    try {
      await checkRateLimit(ctx, identity.subject);

      const task = await ctx.runQuery(api.tasks.get, { id: args.taskId });
      if (!task) {
        throw new Error("Task not found");
      }

      // Set status to generating immediately
      await ctx.runMutation(api.tasks.updateAISupport, {
        taskId: args.taskId,
        status: "generating",
      });

      const prompt: string = `
You are an excellent task support AI assistant.
For the following task, please collect useful information to help the user accomplish the task,
create an execution plan, and summarize the support content in markdown format.

Task Information:
- Title: ${task.title}
- Description: ${task.description || 'No description provided'}
- Category: ${task.category || 'No category'}
- Priority: ${task.priority}
${
  task.deadline
    ? `- Deadline: ${new Date(task.deadline).toLocaleDateString("en-US")}`
    : ""
}

Please provide comprehensive support from the following perspectives:

1. **Background and Purpose Analysis**
   - Why this task is important
   - Expected outcomes

2. **Execution Plan Development**
   - Specific steps
   - Recommended order
   - Estimated time for each step

3. **Related Information and Resources**
   - Useful information sources
   - Required tools or services
   - Learning resources (if applicable)

4. **Implementation Notes**
   - Common pitfalls
   - Tips for success

5. **Next Actions**
   - First thing to focus on
   - Checkpoints

Please output in markdown format with a readable and well-structured layout.
`;

      let supportContent: string;

      try {
        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OLLAMA_CONFIG.model,
            messages: [{ role: "user", content: prompt }],
            options: {
              temperature: OLLAMA_CONFIG.temperature,
              num_predict: OLLAMA_CONFIG.maxTokens,
            },
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Ollama API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        supportContent = data.message.content;
      } catch (ollamaError) {
        console.warn(
          "Ollama execution error, using fallback response:",
          ollamaError
        );
        // フォールバック: 静的なテンプレート応答
        supportContent = `
# Task Support: ${task.title}

## Background and Purpose Analysis
This task is set as "${task.title}" with the following description:
${task.description || "No description provided"}

## Execution Plan Development
1. **Information Gathering**: Collect information and resources related to the task
2. **Planning**: Break down into specific steps
3. **Execution**: Proceed step by step according to the plan
4. **Verification**: Confirm completion of each step

## Related Information and Resources
- Category: ${task.category || 'No category'}
- Priority: ${task.priority}
${
  task.deadline
    ? `- Deadline: ${new Date(task.deadline).toLocaleDateString("en-US")}`
    : ""
}

## Implementation Notes
- Since the priority is ${task.priority}, please allocate resources appropriately
- If there's a deadline, plan with sufficient buffer time

## Next Actions
We recommend starting with information gathering and then creating a specific plan.

*Note: This is a fallback response when Ollama is not available.*
        `;
      }

      // Ollamaはローカル実行なのでコストは0
      const cost = 0;
      const totalTokens =
        estimateTokens(prompt) + estimateTokens(supportContent);

      // Update task with completed AI support
      await ctx.runMutation(api.tasks.updateAISupport, {
        taskId: args.taskId,
        status: "completed",
        content: supportContent,
      });

      await ctx.runMutation(api.tasks.updateMemo, {
        id: args.taskId,
        memo: supportContent,
      });

      await ctx.runMutation(api.ai.logAIContent, {
        taskId: args.taskId,
        type: "suggestion",
        content: supportContent,
        metadata: {
          model: OLLAMA_CONFIG.model,
          tokens: totalTokens,
          cost,
        },
      });

      return { success: true, content: supportContent };
    } catch (error) {
      console.error("Task support error:", error);
      
      // Update status to error
      await ctx.runMutation(api.tasks.updateAISupport, {
        taskId: args.taskId,
        status: "error",
      });
      
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while executing task support",
      };
    }
  },
});

import { action } from "@/_generated/server";
import { v } from "convex/values";
import { getApiConfig, rateLimiter, OLLAMA_CONFIG } from "@/ai/config";
import { AIProviderFactory, AIRequest } from "@/lib/ai/providers";
import { handleError } from "@/lib/base";

export const decomposeTask = action({
  args: {
    taskTitle: v.string(),
    taskDescription: v.string(),
    userSkills: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    const { taskTitle, taskDescription, userSkills = [] } = args;
    
    try {
      const apiConfig = getApiConfig();
      
      // Create AI provider
      const provider = AIProviderFactory.create({
        openaiApiKey: apiConfig.openaiApiKey,
        anthropicApiKey: apiConfig.anthropicApiKey,
        ollamaBaseUrl: OLLAMA_CONFIG.baseUrl,
        ollamaModel: OLLAMA_CONFIG.model,
        preferredModel: apiConfig.aiModel,
      });
      
      // Check rate limit
      if (!rateLimiter.canMakeRequest(apiConfig.aiModel)) {
        throw new Error("Rate limit reached. Please try again later.");
      }
      
      // Create prompt
      const prompt = createDecompositionPrompt(taskTitle, taskDescription, userSkills);
      
      // Make AI request
      const request: AIRequest = {
        prompt,
        systemPrompt: "You are a task decomposition expert. Please break down the given task into small, executable steps.",
        temperature: 0.7,
        maxTokens: 2000,
      };
      
      const result = await provider.generateResponse(request);
      
      // Parse result
      const subtasks = parseDecompositionResult(result.content);
      
      return {
        subtasks,
        metadata: {
          model: result.model,
          tokens: result.tokens,
          cost: result.cost,
        },
      };
      
    } catch (error) {
      console.error("Task decomposition error:", error);
      throw handleError(error);
    }
  },
});

// Create prompt
const createDecompositionPrompt = (
  title: string,
  description: string,
  skills: string[]
): string => {
  return `Please break down the following task into small, executable steps:

Title: ${title}
Description: ${description}
User Skills: ${skills.length > 0 ? skills.join(", ") : "General skill level"}

Requirements:
- Each subtask should be specific and executable
- Arrange in logical order
- Include estimated time (minutes)
- Break down into maximum 10 subtasks

Please respond in the following JSON format:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Detailed description",
      "estimatedTime": 30,
      "order": 1,
      "dependencies": []
    }
  ]
}`;
};


// Parse decomposition result
const parseDecompositionResult = (content: string): Array<{
  title: string;
  description: string;
  estimatedTime: number;
  order: number;
  dependencies: string[];
}> => {
  try {
    // JSON部分を抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON format response not found");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      throw new Error("subtasks is not an array");
    }
    
    return parsed.subtasks.map((task: any, index: number) => ({
      title: task.title || `Subtask ${index + 1}`,
      description: task.description || "",
      estimatedTime: Number(task.estimatedTime) || 30,
      order: Number(task.order) || index + 1,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    }));
    
  } catch (error) {
    console.error("Decomposition result parsing error:", error);
    
    // Fallback: return original task as is
    return [
      {
        title: "Execute task",
        description: "AI decomposition failed, please execute the original task as is",
        estimatedTime: 60,
        order: 1,
        dependencies: [],
      },
    ];
  }
};
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
        throw new Error("レート制限に達しました。しばらく時間を置いてから再試行してください。");
      }
      
      // Create prompt
      const prompt = createDecompositionPrompt(taskTitle, taskDescription, userSkills);
      
      // Make AI request
      const request: AIRequest = {
        prompt,
        systemPrompt: "あなたはタスク分解の専門家です。与えられたタスクを実行可能な小さなステップに分解してください。",
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
      console.error("タスク分解エラー:", error);
      throw handleError(error);
    }
  },
});

// プロンプト作成
const createDecompositionPrompt = (
  title: string,
  description: string,
  skills: string[]
): string => {
  return `以下のタスクを実行可能な小さなステップに分解してください：

タイトル: ${title}
説明: ${description}
ユーザーのスキル: ${skills.length > 0 ? skills.join(", ") : "一般的なスキルレベル"}

要件:
- 各サブタスクは具体的で実行可能であること
- 論理的な順序で並べること
- 推定所要時間（分）を含めること
- 最大10個のサブタスクに分解すること

以下のJSON形式で回答してください:
{
  "subtasks": [
    {
      "title": "サブタスクのタイトル",
      "description": "詳細な説明",
      "estimatedTime": 30,
      "order": 1,
      "dependencies": []
    }
  ]
}`;
};


// 分解結果のパース
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
      throw new Error("JSON形式の応答が見つかりません");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      throw new Error("subtasksが配列ではありません");
    }
    
    return parsed.subtasks.map((task: any, index: number) => ({
      title: task.title || `サブタスク ${index + 1}`,
      description: task.description || "",
      estimatedTime: Number(task.estimatedTime) || 30,
      order: Number(task.order) || index + 1,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    }));
    
  } catch (error) {
    console.error("分解結果のパースエラー:", error);
    
    // フォールバック: 元のタスクをそのまま返す
    return [
      {
        title: "タスクの実行",
        description: "AIによる分解に失敗したため、元のタスクをそのまま実行してください",
        estimatedTime: 60,
        order: 1,
        dependencies: [],
      },
    ];
  }
};
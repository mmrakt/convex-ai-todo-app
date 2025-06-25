import { action } from "../_generated/server";
import { v } from "convex/values";
import { getApiConfig, rateLimiter, withRetry, AIServiceError, estimateTokens, calculateCost } from "./config";

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
      
      // レート制限チェック
      if (!rateLimiter.canMakeRequest(apiConfig.aiModel)) {
        throw new AIServiceError(
          "レート制限に達しました。しばらく時間を置いてから再試行してください。",
          "RATE_LIMIT_EXCEEDED",
          true
        );
      }
      
      // プロンプト作成
      const prompt = createDecompositionPrompt(taskTitle, taskDescription, userSkills);
      
      // OpenAI API呼び出し
      const result = await withRetry(async () => {
        if (apiConfig.openaiApiKey) {
          return await callOpenAI(apiConfig.openaiApiKey, apiConfig.aiModel, prompt);
        } else if (apiConfig.anthropicApiKey) {
          return await callClaude(apiConfig.anthropicApiKey, prompt);
        } else {
          throw new AIServiceError("利用可能なAPIキーがありません", "NO_API_KEY");
        }
      });
      
      // 結果をパース
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
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        "タスクの分解中にエラーが発生しました",
        "DECOMPOSITION_ERROR"
      );
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

// OpenAI API呼び出し
const callOpenAI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ content: string; model: string; tokens: number; cost: number }> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "あなたはタスク分解の専門家です。与えられたタスクを実行可能な小さなステップに分解してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new AIServiceError(
      `OpenAI APIエラー: ${error.error?.message || "不明なエラー"}`,
      "OPENAI_API_ERROR",
      response.status >= 500
    );
  }
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new AIServiceError("APIからの応答が不正です", "INVALID_RESPONSE");
  }
  
  const inputTokens = estimateTokens(prompt);
  const outputTokens = data.usage?.completion_tokens || estimateTokens(content);
  const cost = calculateCost(inputTokens + outputTokens);
  
  return {
    content,
    model,
    tokens: inputTokens + outputTokens,
    cost,
  };
};

// Claude API呼び出し（基本実装）
const callClaude = async (
  apiKey: string,
  prompt: string
): Promise<{ content: string; model: string; tokens: number; cost: number }> => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new AIServiceError(
      `Claude APIエラー: ${error.error?.message || "不明なエラー"}`,
      "CLAUDE_API_ERROR",
      response.status >= 500
    );
  }
  
  const data = await response.json();
  const content = data.content[0]?.text;
  
  if (!content) {
    throw new AIServiceError("APIからの応答が不正です", "INVALID_RESPONSE");
  }
  
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(content);
  const cost = calculateCost(inputTokens + outputTokens);
  
  return {
    content,
    model: "claude-3-sonnet",
    tokens: inputTokens + outputTokens,
    cost,
  };
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
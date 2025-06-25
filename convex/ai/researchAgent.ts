import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getApiConfig, rateLimiter, withRetry, AIServiceError, estimateTokens, calculateCost } from "./config";

export const researchTopic = action({
  args: {
    topic: v.string(),
    taskId: v.id("tasks"),
    searchDepth: v.optional(v.union(v.literal("basic"), v.literal("detailed"))),
  },
  handler: async (ctx, args) => {
    const { topic, taskId, searchDepth = "basic" } = args;
    
    try {
      // Web検索の実行（初期はモック実装）
      const searchResults = await performWebSearch(topic, searchDepth);
      
      // AI要約の実行
      const summary = await generateSummary(topic, searchResults);
      
      // 結果をデータベースに保存
      await ctx.runMutation(internal.aiContents.create, {
        taskId,
        type: "research",
        content: JSON.stringify({
          topic,
          summary: summary.content,
          sources: searchResults.sources,
          searchDepth,
        }),
        metadata: {
          model: summary.model,
          tokens: summary.tokens,
          cost: summary.cost,
        },
        createdAt: Date.now(),
      });
      
      return {
        topic,
        summary: summary.content,
        sources: searchResults.sources,
        metadata: {
          model: summary.model,
          tokens: summary.tokens,
          cost: summary.cost,
        },
      };
      
    } catch (error) {
      console.error("リサーチエラー:", error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        "トピックのリサーチ中にエラーが発生しました",
        "RESEARCH_ERROR"
      );
    }
  },
});

// Web検索の実行（モック実装）
const performWebSearch = async (
  topic: string,
  depth: "basic" | "detailed"
): Promise<{
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  searchQuery: string;
}> => {
  // 実際の実装では、Google Search API、Bing Search API、またはSerpAPIなどを使用
  // 初期はモックデータを返す
  const mockSources = [
    {
      title: `${topic}に関する基本情報`,
      url: `https://example.com/basic-${topic.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `${topic}について説明します。基本的な概念と重要なポイントについて詳しく解説しています。`,
      relevance: 0.9,
    },
    {
      title: `${topic}の実践的な活用方法`,
      url: `https://example.com/practical-${topic.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `${topic}を実際のプロジェクトで活用する方法について、具体例を交えて説明します。`,
      relevance: 0.8,
    },
  ];
  
  if (depth === "detailed") {
    mockSources.push(
      {
        title: `${topic}の詳細ガイド`,
        url: `https://example.com/detailed-${topic.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `${topic}について詳細に解説した包括的なガイドです。上級者向けの内容も含まれています。`,
        relevance: 0.85,
      },
      {
        title: `${topic}のベストプラクティス`,
        url: `https://example.com/best-practices-${topic.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `${topic}を使用する際のベストプラクティスと注意点について解説します。`,
        relevance: 0.75,
      }
    );
  }
  
  return {
    sources: mockSources,
    searchQuery: topic,
  };
};

// AI要約の生成
const generateSummary = async (
  topic: string,
  searchResults: {
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: number;
    }>;
    searchQuery: string;
  }
): Promise<{ content: string; model: string; tokens: number; cost: number }> => {
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
  const prompt = createSummaryPrompt(topic, searchResults);
  
  // AI API呼び出し
  return await withRetry(async () => {
    if (apiConfig.openaiApiKey) {
      return await callOpenAIForSummary(apiConfig.openaiApiKey, apiConfig.aiModel, prompt);
    } else if (apiConfig.anthropicApiKey) {
      return await callClaudeForSummary(apiConfig.anthropicApiKey, prompt);
    } else {
      throw new AIServiceError("利用可能なAPIキーがありません", "NO_API_KEY");
    }
  });
};

// 要約用プロンプト作成
const createSummaryPrompt = (
  topic: string,
  searchResults: {
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: number;
    }>;
    searchQuery: string;
  }
): string => {
  const sourcesText = searchResults.sources
    .map((source, index) => 
      `${index + 1}. ${source.title}\n   ${source.snippet}\n   URL: ${source.url}`
    )
    .join("\n\n");
  
  return `以下の検索結果に基づいて、「${topic}」について包括的で実用的な要約を作成してください：

検索結果:
${sourcesText}

要求事項:
- 重要なポイントを整理して、わかりやすく説明する
- 実践的な活用方法や注意点を含める
- 300-500文字程度でまとめる
- 情報源を適切に参照する
- 日本語で回答する

以下のJSON形式で回答してください:
{
  "summary": "要約内容",
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "practicalTips": ["実践的なTip1", "実践的なTip2"],
  "references": ["参照URL1", "参照URL2"]
}`;
};

// OpenAI API呼び出し（要約用）
const callOpenAIForSummary = async (
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
          content: "あなたは優秀なリサーチアシスタントです。与えられた情報を元に、正確で実用的な要約を作成してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
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

// Claude API呼び出し（要約用）
const callClaudeForSummary = async (
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
      max_tokens: 1000,
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
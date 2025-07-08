// Provider types
export type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'gemini';

// Provider configuration
export const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama') as AIProvider;

// OpenAI configuration
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  baseUrl: 'https://api.openai.com/v1',
};

// Anthropic configuration
export const ANTHROPIC_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 2000,
  baseUrl: 'https://api.anthropic.com/v1',
};

// Ollama configuration
export const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  temperature: 0.7,
  maxTokens: 2000,
};

// Google Gemini configuration
export const GEMINI_CONFIG = {
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 2000,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
};

// Legacy support
export const MODEL_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
};

export const AI_CONFIG = {
  // デフォルトモデル設定
  DEFAULT_MODEL: 'gpt-3.5-turbo',

  // レート制限設定（リクエスト/分）
  RATE_LIMIT: {
    GPT_35_TURBO: 100,
    GPT_4: 60,
    CLAUDE_3: 50,
  },

  // コスト設定（1000トークンあたりのUSD）
  TOKEN_COSTS: {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
  },

  // タイムアウト設定（ミリ秒）
  TIMEOUT: 30000,

  // リトライ設定
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// Get current provider configuration
export const getCurrentProviderConfig = () => {
  switch (AI_PROVIDER) {
    case 'openai':
      if (!OPENAI_CONFIG.apiKey) {
        throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
      }
      return OPENAI_CONFIG;
    case 'anthropic':
      if (!ANTHROPIC_CONFIG.apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider');
      }
      return ANTHROPIC_CONFIG;
    case 'gemini':
      if (!GEMINI_CONFIG.apiKey) {
        throw new Error('GOOGLE_API_KEY is required when using Gemini provider');
      }
      return GEMINI_CONFIG;
    case 'ollama':
      return OLLAMA_CONFIG;
    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }
};

// Legacy API config function for backward compatibility
export const getApiConfig = () => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const aiModel = process.env.AI_MODEL || AI_CONFIG.DEFAULT_MODEL;

  return {
    openaiApiKey,
    anthropicApiKey,
    aiModel,
  };
};

// レート制限管理
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(model: string): boolean {
    const now = Date.now();
    const limit = this.getModelLimit(model);
    const requests = this.requests.get(model) || [];

    // 1分以内のリクエストをフィルタ
    const recentRequests = requests.filter((time) => now - time < 60000);

    if (recentRequests.length >= limit) {
      return false;
    }

    // リクエスト記録を更新
    recentRequests.push(now);
    this.requests.set(model, recentRequests);

    return true;
  }

  private getModelLimit(model: string): number {
    if (model.includes('gpt-4')) return AI_CONFIG.RATE_LIMIT.GPT_4;
    if (model.includes('gpt-3.5')) return AI_CONFIG.RATE_LIMIT.GPT_35_TURBO;
    if (model.includes('claude')) return AI_CONFIG.RATE_LIMIT.CLAUDE_3;
    return AI_CONFIG.RATE_LIMIT.GPT_35_TURBO;
  }
}

export const rateLimiter = new RateLimiter();

// エラーハンドリング用のカスタムエラー
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// リトライ機能付きのAPIコール
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = AI_CONFIG.MAX_RETRIES,
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        break;
      }

      // リトライ可能なエラーかチェック
      if (error instanceof AIServiceError && !error.retryable) {
        break;
      }

      // 指数バックオフでリトライ
      const delay = AI_CONFIG.RETRY_DELAY * 2 ** i;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new AIServiceError(
    `最大リトライ回数（${maxRetries}回）を超えました: ${lastError?.message || '不明なエラー'}`,
    'MAX_RETRIES_EXCEEDED',
  );
};

// トークン数の推定（簡易版）
export const estimateTokens = (text: string): number => {
  // 大まかな推定: 4文字 ≈ 1トークン
  return Math.ceil(text.length / 4);
};

// コスト計算（簡易版 - トータルトークンのみ）
export const calculateCost = (totalTokens: number): number => {
  const model = MODEL_CONFIG.model;
  const costs = AI_CONFIG.TOKEN_COSTS[model as keyof typeof AI_CONFIG.TOKEN_COSTS];
  if (!costs) {
    return 0;
  }

  // 簡易的に入力と出力を半分ずつと仮定
  const inputTokens = totalTokens / 2;
  const outputTokens = totalTokens / 2;

  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
};

// レート制限チェック（Convexのコンテキスト付き）
export const checkRateLimit = async (_ctx: unknown, _userId: string): Promise<void> => {
  // 実際のレート制限実装はここに追加
  // 現在は簡易的な実装
  if (!rateLimiter.canMakeRequest(MODEL_CONFIG.model)) {
    throw new AIServiceError(
      'レート制限に達しました。しばらく時間を置いてから再試行してください。',
      'RATE_LIMIT_EXCEEDED',
      true,
    );
  }
};

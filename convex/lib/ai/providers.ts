import {
  AI_CONFIG,
  AIServiceError,
  calculateCost,
  estimateTokens,
  withRetry,
} from '../../ai/config';
import { AppError } from '../base';

// Common types for AI providers
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  cost: number;
}

export interface AIProvider {
  name: string;
  generateResponse(request: AIRequest): Promise<AIResponse>;
  isAvailable(): boolean;
}

// Base class for AI providers
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;

  protected async makeRequest<T>(
    requestFn: () => Promise<T>,
    retryable: boolean = true,
  ): Promise<T> {
    if (retryable) {
      return withRetry(requestFn);
    }
    return requestFn();
  }

  abstract generateResponse(request: AIRequest): Promise<AIResponse>;
  abstract isAvailable(): boolean;
}

// OpenAI Provider
export class OpenAIProvider extends BaseAIProvider {
  name = 'OpenAI';

  constructor(
    private apiKey: string,
    private model: string = AI_CONFIG.DEFAULT_MODEL,
  ) {
    super();
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new AIServiceError('OpenAI APIキーが設定されていません', 'NO_API_KEY');
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await this.makeRequest(async () => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new AIServiceError(
          `OpenAI APIエラー: ${error.error?.message || '不明なエラー'}`,
          'OPENAI_API_ERROR',
          res.status >= 500,
        );
      }

      return res.json();
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIServiceError('APIからの応答が不正です', 'INVALID_RESPONSE');
    }

    const inputTokens = estimateTokens(request.prompt);
    const outputTokens = response.usage?.completion_tokens || estimateTokens(content);
    const totalTokens = inputTokens + outputTokens;

    return {
      content,
      model: this.model,
      tokens: totalTokens,
      cost: calculateCost(totalTokens),
    };
  }
}

// Claude Provider
export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude';
  private model = 'claude-3-sonnet-20240229';

  constructor(private apiKey: string) {
    super();
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new AIServiceError('Claude APIキーが設定されていません', 'NO_API_KEY');
    }

    const messages: Array<{ role: 'user'; content: string }> = [
      {
        role: 'user',
        content: request.systemPrompt
          ? `${request.systemPrompt}\n\n${request.prompt}`
          : request.prompt,
      },
    ];

    const response = await this.makeRequest(async () => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? 2000,
          messages,
          temperature: request.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new AIServiceError(
          `Claude APIエラー: ${error.error?.message || '不明なエラー'}`,
          'CLAUDE_API_ERROR',
          res.status >= 500,
        );
      }

      return res.json();
    });

    const content = response.content[0]?.text;
    if (!content) {
      throw new AIServiceError('APIからの応答が不正です', 'INVALID_RESPONSE');
    }

    const inputTokens = estimateTokens(request.prompt);
    const outputTokens = estimateTokens(content);
    const totalTokens = inputTokens + outputTokens;

    return {
      content,
      model: 'claude-3-sonnet',
      tokens: totalTokens,
      cost: calculateCost(totalTokens),
    };
  }
}

// Ollama Provider
export class OllamaProvider extends BaseAIProvider {
  name = 'Ollama';

  constructor(
    private baseUrl: string,
    private model: string,
  ) {
    super();
  }

  isAvailable(): boolean {
    return !!this.baseUrl && !!this.model;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new AIServiceError('Ollama設定が不完全です', 'OLLAMA_CONFIG_ERROR');
    }

    const prompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const response = await this.makeRequest(async () => {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 2000,
          },
        }),
      });

      if (!res.ok) {
        throw new AIServiceError(
          `Ollama APIエラー: ${res.statusText}`,
          'OLLAMA_API_ERROR',
          res.status >= 500,
        );
      }

      return res.json();
    }, false); // Ollama is local, no retry needed

    if (!response.response) {
      throw new AIServiceError('Ollamaからの応答が不正です', 'INVALID_RESPONSE');
    }

    const tokens = estimateTokens(response.response);

    return {
      content: response.response,
      model: this.model,
      tokens,
      cost: 0, // Ollama is free
    };
  }
}

// Factory for creating AI providers
interface ProviderConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  preferredModel?: string;
}

export function createAIProvider(config: ProviderConfig): AIProvider {
  // Try to create provider based on preferred model
  if (config.preferredModel?.includes('gpt') && config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey, config.preferredModel);
  }

  if (config.preferredModel?.includes('claude') && config.anthropicApiKey) {
    return new ClaudeProvider(config.anthropicApiKey);
  }

  // Fallback to available providers
  if (config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey, config.preferredModel);
  }

  if (config.anthropicApiKey) {
    return new ClaudeProvider(config.anthropicApiKey);
  }

  if (config.ollamaBaseUrl && config.ollamaModel) {
    return new OllamaProvider(config.ollamaBaseUrl, config.ollamaModel);
  }

  throw new AppError('利用可能なAIプロバイダーが見つかりません', 'NO_AI_PROVIDER');
}

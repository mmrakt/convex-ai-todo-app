import {
  AI_PROVIDER,
  AIServiceError,
  ANTHROPIC_CONFIG,
  GEMINI_CONFIG,
  OLLAMA_CONFIG,
  OPENAI_CONFIG,
  withRetry,
} from './config';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens?: number;
  cost?: number;
}

// OpenAI API implementation
const callOpenAI = async (messages: AIMessage[]): Promise<AIResponse> => {
  const config = OPENAI_CONFIG;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new AIServiceError(
      `OpenAI API error: ${response.status} ${response.statusText}`,
      'OPENAI_API_ERROR',
      response.status >= 500,
    );
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    model: config.model,
    tokens: data.usage?.total_tokens,
    cost: calculateOpenAICost(data.usage?.total_tokens || 0),
  };
};

// Anthropic API implementation
const callAnthropic = async (messages: AIMessage[]): Promise<AIResponse> => {
  const config = ANTHROPIC_CONFIG;

  // Convert messages to Anthropic format
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMessage?.content,
      messages: userMessages,
    }),
  });

  if (!response.ok) {
    throw new AIServiceError(
      `Anthropic API error: ${response.status} ${response.statusText}`,
      'ANTHROPIC_API_ERROR',
      response.status >= 500,
    );
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || '',
    model: config.model,
    tokens: data.usage?.input_tokens + data.usage?.output_tokens,
    cost: calculateAnthropicCost(data.usage?.input_tokens || 0, data.usage?.output_tokens || 0),
  };
};

// Google Gemini API implementation
const callGemini = async (messages: AIMessage[]): Promise<AIResponse> => {
  const config = GEMINI_CONFIG;

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === 'system');

  interface GenerationConfig {
    temperature: number;
    maxOutputTokens: number;
  }

  interface RequestBody {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    generationConfig: GenerationConfig;
    systemInstruction?: { parts: Array<{ text: string }> };
  }

  const requestBody: RequestBody = {
    contents,
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction.content }],
    };
  }

  const response = await fetch(
    `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    throw new AIServiceError(
      `Gemini API error: ${response.status} ${response.statusText}`,
      'GEMINI_API_ERROR',
      response.status >= 500,
    );
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new AIServiceError('Invalid Gemini API response format', 'GEMINI_INVALID_RESPONSE');
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    model: config.model,
    tokens: data.usageMetadata?.totalTokenCount,
    cost: calculateGeminiCost(data.usageMetadata?.totalTokenCount || 0),
  };
};

// Ollama API implementation
const callOllama = async (messages: AIMessage[]): Promise<AIResponse> => {
  const config = OLLAMA_CONFIG;

  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new AIServiceError(
      `Ollama API error: ${response.status} ${response.statusText}`,
      'OLLAMA_API_ERROR',
      response.status >= 500,
    );
  }

  const data = await response.json();

  return {
    content: data.message?.content || '',
    model: config.model,
    tokens: 0, // Ollama doesn't provide token count
    cost: 0, // Ollama is free/local
  };
};

// Main AI service function
export const callAI = async (messages: AIMessage[]): Promise<AIResponse> => {
  return withRetry(async () => {
    switch (AI_PROVIDER) {
      case 'openai':
        return await callOpenAI(messages);
      case 'anthropic':
        return await callAnthropic(messages);
      case 'gemini':
        return await callGemini(messages);
      case 'ollama':
        return await callOllama(messages);
      default:
        throw new AIServiceError(`Unsupported AI provider: ${AI_PROVIDER}`, 'UNSUPPORTED_PROVIDER');
    }
  });
};

// Cost calculation functions
const calculateOpenAICost = (totalTokens: number): number => {
  const model = OPENAI_CONFIG.model;
  if (model.includes('gpt-4')) {
    return (totalTokens / 1000) * 0.03; // Approximate
  } else if (model.includes('gpt-3.5')) {
    return (totalTokens / 1000) * 0.002; // Approximate
  }
  return 0;
};

const calculateAnthropicCost = (inputTokens: number, outputTokens: number): number => {
  const model = ANTHROPIC_CONFIG.model;
  if (model.includes('claude-3-sonnet')) {
    return (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
  }
  return 0;
};

const calculateGeminiCost = (totalTokens: number): number => {
  const model = GEMINI_CONFIG.model;
  if (model.includes('gemini-1.5-flash')) {
    return (totalTokens / 1000) * 0.00015; // Very approximate
  } else if (model.includes('gemini-1.5-pro')) {
    return (totalTokens / 1000) * 0.0035; // Very approximate
  }
  return 0;
};

// Helper function to create a simple user message
export const createUserMessage = (content: string): AIMessage[] => [{ role: 'user', content }];

// Helper function to create messages with system prompt
export const createMessagesWithSystem = (systemPrompt: string, userPrompt: string): AIMessage[] => [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt },
];

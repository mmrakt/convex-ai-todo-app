"use node";

import { Ollama } from "ollama";
import { OLLAMA_CONFIG } from "./config";

// @convex-dev/agent用のカスタムチャットモデル
export function createOllamaChat() {
  const ollama = new Ollama({ host: OLLAMA_CONFIG.baseUrl });

  return {
    async chat(args: {
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }) {
      try {
        const response = await ollama.chat({
          model: OLLAMA_CONFIG.model,
          messages: args.messages,
          options: {
            temperature: args.temperature ?? OLLAMA_CONFIG.temperature,
            num_predict: args.maxTokens ?? OLLAMA_CONFIG.maxTokens,
          },
        });

        return {
          content: response.message.content,
          usage: {
            totalTokens: estimateTokens(
              args.messages.map(m => m.content).join("") + response.message.content
            ),
          },
        };
      } catch (error) {
        console.error("Ollama chat error:", error);
        throw new Error(`Ollama chat failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
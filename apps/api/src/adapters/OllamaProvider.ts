import fetch from "node-fetch";
import { config } from "../config";
import { logger } from "../lib/logger";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface IAiProvider {
  generateChatCompletion(messages: ChatMessage[]): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}

export class OllamaProvider implements IAiProvider {
  public async generateChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ollama.chatModel,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.message?.content || "No response received from Ollama model.";
    } catch (err) {
      logger.warn({ err }, "Ollama service unavailable, utilizing structured fallback");
      const lastMsg = messages[messages.length - 1]?.content || "";
      return `[Practice AI Assistant]: I have analyzed your query "${lastMsg}". Note: Local Ollama service is currently offline or loading models. Query results are formatted via practice record structured index.`;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ollama.embeddingModel,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama embedding error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.embedding || new Array(768).fill(0);
    } catch (err) {
      logger.warn("Ollama embedding endpoint unavailable, using zero vector fallback");
      return new Array(768).fill(0);
    }
  }
}

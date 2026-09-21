export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiSourceCitation {
  title: string;
  url: string;
}

export interface AiCompletionResult {
  text: string;
  sources: AiSourceCitation[];
  grounded: boolean;
  model: string;
  webSearchQueries?: string[];
}

export interface AiGenerateOptions {
  /** Enable Gemini Google Search grounding for current/public tax info */
  useGrounding?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Provider-agnostic AI interface so Gemini can be swapped later.
 */
export interface IAiProvider {
  generateChatCompletion(
    messages: ChatMessage[],
    options?: AiGenerateOptions
  ): Promise<AiCompletionResult>;
}

import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../lib/logger";
import { AppError } from "../middleware/errorHandler";
import {
  AiCompletionResult,
  AiGenerateOptions,
  AiSourceCitation,
  ChatMessage,
  IAiProvider
} from "./IAiProvider";

const MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractStatusCode(err: unknown): number | undefined {
  const anyErr = err as any;
  return (
    anyErr?.status ??
    anyErr?.statusCode ??
    anyErr?.code ??
    anyErr?.error?.code ??
    anyErr?.response?.status
  );
}

function isRetryable(err: unknown): boolean {
  const status = Number(extractStatusCode(err));
  if (RETRYABLE_STATUS.has(status)) return true;
  const message = String((err as any)?.message || "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("rate") ||
    message.includes("unavailable") ||
    message.includes("429")
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError(`Gemini request timed out after ${ms}ms`, 504, "AI_TIMEOUT"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function mapMessagesToContents(messages: ChatMessage[]) {
  const systemParts: string[] = [];
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
      continue;
    }
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  return {
    systemInstruction: systemParts.length ? systemParts.join("\n\n") : undefined,
    contents
  };
}

function extractSources(response: any): { sources: AiSourceCitation[]; grounded: boolean; webSearchQueries?: string[] } {
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  const chunks = metadata?.groundingChunks || [];
  const sources: AiSourceCitation[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const url = chunk?.web?.uri || chunk?.web?.url;
    const title = chunk?.web?.title || "Web source";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title, url });
  }

  const webSearchQueries: string[] | undefined = Array.isArray(metadata?.webSearchQueries)
    ? metadata.webSearchQueries.filter((q: unknown) => typeof q === "string")
    : undefined;

  return {
    sources,
    grounded: sources.length > 0 || Boolean(webSearchQueries?.length),
    webSearchQueries
  };
}

export class GeminiProvider implements IAiProvider {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!config.gemini.apiKey) {
      throw new AppError(
        "GEMINI_API_KEY is not configured on the server",
        503,
        "AI_NOT_CONFIGURED"
      );
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
    return this.client;
  }

  public async generateChatCompletion(
    messages: ChatMessage[],
    options: AiGenerateOptions = {}
  ): Promise<AiCompletionResult> {
    const { systemInstruction, contents } = mapMessagesToContents(messages);
    if (!contents.length) {
      throw new AppError("No user content provided for Gemini", 400, "VALIDATION_ERROR");
    }

    const model = config.gemini.model;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const ai = this.getClient();
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: options.temperature ?? 0.2,
              maxOutputTokens: options.maxOutputTokens ?? 2048,
              ...(options.useGrounding ? { tools: [{ googleSearch: {} }] } : {})
            }
          }),
          config.gemini.timeoutMs
        );

        const text = (response as any)?.text?.trim?.() || "";
        if (!text) {
          throw new AppError("Gemini returned an empty response", 502, "AI_EMPTY_RESPONSE");
        }

        const { sources, grounded, webSearchQueries } = extractSources(response);

        return {
          text,
          sources,
          grounded,
          model,
          webSearchQueries
        };
      } catch (err) {
        lastError = err;
        const status = Number(extractStatusCode(err));

        // Never log API keys or raw request payloads
        logger.warn(
          {
            attempt,
            status: Number.isFinite(status) ? status : undefined,
            message: (err as any)?.message || "Gemini request failed"
          },
          "Gemini generateContent failed"
        );

        if (attempt < MAX_RETRIES && isRetryable(err) && status !== 404) {
          // Quota/rate limits: one short backoff only, then surface to caller
          if (status === 429 && attempt >= 2) break;
          const backoff = status === 429 ? 1500 : Math.min(2000 * 2 ** (attempt - 1), 8000);
          await sleep(backoff);
          continue;
        }

        break;
      }
    }

    if (lastError instanceof AppError) throw lastError;

    const status = Number(extractStatusCode(lastError));
    if (status === 429) {
      throw new AppError(
        "Gemini rate limit reached. Please wait a moment and try again.",
        429,
        "AI_RATE_LIMITED"
      );
    }

    throw new AppError(
      "TaxFlow AI is temporarily unavailable. Please try again shortly.",
      503,
      "AI_UNAVAILABLE"
    );
  }
}

/** Factory keeps provider swappable without touching business logic. */
export function createAiProvider(): IAiProvider {
  return new GeminiProvider();
}

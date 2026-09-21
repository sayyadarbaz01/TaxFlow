import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock3,
  Lightbulb,
  Link2
} from "lucide-react";
import { AiSourceCitation } from "@ca-saas/shared-types";
import { useAskAiMutation } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceType?: string;
  sources?: AiSourceCitation[];
  lastUpdated?: string | null;
  suggestedActions?: string[];
  isError?: boolean;
}

const QUICK_PROMPTS = [
  "Show clients with GST returns due this month.",
  "What GST compliance actions are pending?",
  "Summarize pending ITR filings.",
  "Which documents are missing?",
  "What's the latest GST filing deadline?",
  "Give me a practice compliance risk summary."
];

function formatSourceLabel(sourceType?: string) {
  switch (sourceType) {
    case "structured":
      return "Practice database";
    case "grounded":
      return "Gemini + web sources";
    case "gemini":
      return "Gemini";
    case "fallback":
      return "Practice fallback";
    default:
      return sourceType || "TaxFlow AI";
  }
}

/** Lightweight markdown → React (no extra dependency). */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[11px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline"
        >
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l) || l.trim() === "");
        if (isList && lines.some((l) => l.trim())) {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-1">
              {lines
                .filter((l) => l.trim())
                .map((l, li) => (
                  <li key={li}>{renderInlineMarkdown(l.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>
                ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="whitespace-pre-wrap">
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                {line.startsWith("### ")
                  ? <span className="font-bold text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300">{renderInlineMarkdown(line.slice(4))}</span>
                  : line.startsWith("## ")
                    ? <span className="font-bold">{renderInlineMarkdown(line.slice(3))}</span>
                    : line === "---"
                      ? <hr className="border-slate-200 dark:border-slate-700 my-1" />
                      : renderInlineMarkdown(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export const AiAssistantPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello — I'm TaxFlow AI. Ask about ITR, GST, TDS/TCS, deadlines, or your clients. Practice answers use live RBAC-scoped records; tax-law questions use Gemini with cited sources when available.",
      sourceType: "structured",
      suggestedActions: [
        "Summarize pending ITR filings.",
        "Show clients with GST returns due this month.",
        "What's the latest GST filing deadline?"
      ]
    }
  ]);

  const [askAi, { isLoading }] = useAskAiMutation();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customQuery || query).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: textToSend
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    try {
      const res = await askAi({
        query: textToSend,
        conversationId
      }).unwrap();

      if (res.conversationId) setConversationId(res.conversationId);

      const aiMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: res.answer,
        sourceType: res.sourceType,
        sources: res.sources || [],
        lastUpdated: res.lastUpdated,
        suggestedActions: res.suggestedActions || []
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const apiMessage =
        err?.data?.error?.message ||
        err?.error ||
        "Unable to reach TaxFlow AI. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "assistant",
          content: String(apiMessage),
          isError: true,
          sourceType: "fallback"
        }
      ]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AI Tax Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini-powered guidance with RBAC-scoped practice data and cited web sources for current tax info.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          Backend-only API key · Scoped to your clients
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-h-[560px] xl:h-[calc(100vh-12rem)]">
        <Card className="xl:col-span-2 flex flex-col h-full min-h-[480px] p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-1 shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl max-w-[92%] sm:max-w-xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-xs"
                      : m.isError
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-bl-none"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs"
                  }`}
                >
                  {m.role === "assistant" && m.sourceType && !m.isError && (
                    <div className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1">
                      <Database className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      <span>Source: {formatSourceLabel(m.sourceType)}</span>
                    </div>
                  )}
                  {m.isError && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Request failed
                    </div>
                  )}
                  <div className={m.role === "user" ? "whitespace-pre-wrap" : undefined}>
                    {m.role === "assistant" ? <MarkdownContent content={m.content} /> : m.content}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Link2 className="w-3 h-3" />
                        Citations
                        {m.lastUpdated && (
                          <span className="ml-auto normal-case font-medium flex items-center gap-1 text-slate-400">
                            <Clock3 className="w-3 h-3" />
                            Last updated {new Date(m.lastUpdated).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {m.sources.slice(0, 5).map((s, idx) => (
                        <a
                          key={`${s.url}-${idx}`}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="break-all">{s.title || s.url}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => handleSend(undefined, action)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/70 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-smooth"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-1">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-xs">
                  AI
                </div>
                <div className="px-3.5 py-3 rounded-2xl rounded-bl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:300ms]" />
                    </span>
                    TaxFlow AI is thinking…
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(undefined, p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-smooth border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about ITR, GST, deadlines, documents, or a specific client…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <Button type="submit" size="sm" isLoading={isLoading} leftIcon={<Send className="w-3.5 h-3.5" />}>
              Send
            </Button>
          </form>
        </Card>

        <Card className="h-full space-y-4 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Assistant Capabilities
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Model</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">Google Gemini</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Swappable provider adapter · key never sent to the browser
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Practice data</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">RBAC-scoped live records</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Clients, filings, documents, tasks, invoices — only your authorized scope
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Current tax info</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">Google Search grounding</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Citations + last-updated shown when external sources are used
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-200">
              <p className="font-semibold text-[11px]">Professional use notice</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                Always verify statutory dates, rates, and filings against official portals before submission. TaxFlow AI does not replace CA professional judgment.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Bot, Send, User, Sparkles, Database, CheckCircle2 } from "lucide-react";
import { useAskAiMutation } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceType?: string;
}

export const AiAssistantPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your CA Practice AI Assistant powered by Ollama and local structured data. How can I assist with client compliance, missing documents, or billing today?",
      sourceType: "structured"
    }
  ]);

  const [askAi, { isLoading }] = useAskAiMutation();

  const handleSend = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    try {
      const res = await askAi({ query: textToSend }).unwrap();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        sourceType: res.sourceType
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Error connecting to AI service." }
      ]);
    }
  };

  const quickPrompts = [
    "Client ka GST pending hai",
    "Which ITR is pending?",
    "Which clients have overdue invoices?",
    "PAN document kis client ka missing hai?"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AI Practice Assistant & RAG Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hybrid Intent Engine querying live practice database and local Ollama vectors.</p>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Column: Chat Conversation Stream */}
        <Card className="lg:col-span-2 flex flex-col h-full p-0 overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs"
                  }`}
                >
                  {m.sourceType && (
                    <div className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1">
                      <Database className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      <span>Source: {m.sourceType} query index</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
                    U
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(undefined, p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-smooth border border-slate-200 dark:border-slate-750"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about clients, filings, invoices, or missing docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" isLoading={isLoading} leftIcon={<Send className="w-3.5 h-3.5" />}>
              Send
            </Button>
          </form>
        </Card>

        {/* Right Column: Database Context Sidebar */}
        <Card className="h-full space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Authorized Practice Context Scope
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Model Architecture</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">Ollama llama3.1:8b</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Vector Embeddings</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">nomic-embed-text (pgvector 768d)</p>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-200">
              <p className="font-semibold text-[11px]">🔒 Permission-Scoped Retrieval</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">Queries strictly enforce staff row-level access rules before returning context.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

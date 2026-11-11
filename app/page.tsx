"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";

const SUGGESTED_PROMPTS = [
  "Show me your bestselling jackets",
  "What sustainable winter coats do you have?",
  "I need a lightweight packable jacket",
  "What makes Save the Duck sustainable?",
];

const TOOL_LABELS: Record<string, string> = {
  search_catalog: "Searching catalog",
  ask_business: "Looking up store info",
  create_cart: "Creating cart",
  update_cart: "Updating cart",
};

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white text-zinc-900">
      <header className="shrink-0 border-b border-zinc-100 px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">S</span>
        </div>
        <span className="text-sm font-semibold tracking-wide">
          Save the Duck Shopping Assistant
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {empty && (
            <div className="text-center pt-16 pb-8 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
                  How can I help you today?
                </h1>
                <p className="text-zinc-500 text-sm">
                  Ask me about jackets, coats, or anything about Save the Duck.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => submit(prompt)}
                    className="text-sm px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-zinc-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[80%] space-y-1">
                {message.role === "assistant" && (
                  <div className="text-xs text-zinc-400 ml-1">Assistant</div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-zinc-900 text-white rounded-br-sm"
                      : "bg-zinc-50 text-zinc-900 rounded-bl-sm border border-zinc-100"
                  }`}
                >
                  {(message.parts ?? []).map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <p key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    if (
                      part.type === "dynamic-tool" &&
                      (part.state === "input-streaming" ||
                        part.state === "input-available")
                    ) {
                      const label = TOOL_LABELS[part.toolName] ?? part.toolName;
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-full"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          {label}…
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3.5">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-100 px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="max-w-2xl mx-auto flex gap-2 items-center"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about jackets, sustainability, or add items to your cart…"
            disabled={isLoading}
            className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50 transition-opacity"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send"
            className="shrink-0 w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center disabled:opacity-40 hover:bg-zinc-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 7h12M8 2l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

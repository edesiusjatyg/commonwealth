"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { LightweightChart } from "@/components/chat/lightweight-chart";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  coins?: string[];
  timeframe?: string;
  suggestedPrompts?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle visual viewport resize (keyboard open/close)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const update = () => {
      const offset = window.innerHeight - window.visualViewport!.height;
      setKeyboardOffset(offset);
      // Scroll to bottom when keyboard opens
      setTimeout(scrollToBottom, 50);
    };

    window.visualViewport.addEventListener("resize", update);
    return () => window.visualViewport?.removeEventListener("resize", update);
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: messageText.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      if (data.meta?.session_id) {
        setSessionId(data.meta.session_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data?.explanation || "Sorry, I couldn't process that.",
        coins: data.data?.coins || [],
        timeframe: data.data?.timeframe || "1m",
        suggestedPrompts: data.suggested_next_prompts || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        suggestedPrompts: ["Try again", "Ask something else"],
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-gray-50"
      style={{ paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined }}
    >
      {/* Header - compact on mobile */}
      <header className="flex-shrink-0 flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-200">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">The Scribe</h1>
            <p className="text-[10px] text-gray-500">Crypto Analysis</p>
          </div>
        </div>
      </header>

      {/* Messages - flexible scroll area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              How can I help?
            </h2>
            <p className="text-xs text-gray-500 mb-4 max-w-[280px]">
              Ask about crypto prices, trends, or analysis.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["Compare BTC & ETH", "How is SOL?", "Top performers"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:border-purple-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {/* Chart before message */}
                {message.role === "assistant" && message.coins && message.coins.length > 0 && (
                  <div className="mb-2">
                    <LightweightChart
                      coins={message.coins}
                      timeframe={message.timeframe || "1m"}
                      height="200px"
                    />
                  </div>
                )}

                {/* Message bubble */}
                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      message.role === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {/* Suggested prompts */}
                {message.role === "assistant" && message.suggestedPrompts && message.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {message.suggestedPrompts.slice(0, 3).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        disabled={isLoading}
                        className="px-2 py-1 text-[11px] bg-gray-100 text-gray-600 rounded-full hover:bg-purple-100 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    <span className="text-xs text-gray-500">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - fixed at bottom, respects keyboard */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-3 py-2 safe-area-pb">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crypto..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600 text-white disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

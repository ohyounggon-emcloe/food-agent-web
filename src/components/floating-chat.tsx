"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, ExternalLink, Loader2, X, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; url: string; site_name: string; similarity: number }[];
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    scrollToBottom();

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "응답 실패");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}` },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed top-0 right-0 z-[9999] w-96 h-full bg-white shadow-2xl border-l flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium text-sm">{"AI-FX 어시스턴트"}</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-emerald-700 rounded p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Bot className="w-10 h-10 text-emerald-300" />
                <p className="text-xs text-center">{"식품안전 관련 궁금한 점을 질문해보세요."}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {["식중독 예방법", "HACCP이란?", "최근 회수 현황"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                )}

                <div className={`max-w-[85%]`}>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {msg.sources.map((src) => (
                        <a
                          key={src.id}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-teal-600 hover:underline"
                        >
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                            {src.similarity}%
                          </Badge>
                          <span className="line-clamp-1">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="bg-gray-100 rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t bg-gray-50">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              disabled={loading}
              className="flex-1 text-sm h-9"
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-9 px-3">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

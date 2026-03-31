"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, ExternalLink } from "lucide-react";

interface Source {
  id: number;
  title: string;
  url: string;
  site_name: string;
  similarity: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
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
    setStreamingText("");
    scrollToBottom();

    let sources: Source[] = [];
    let fullText = "";

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

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "sources") {
              sources = event.sources || [];
            } else if (event.type === "text") {
              fullText += event.text;
              setStreamingText(fullText);
              scrollToBottom();
            }
          } catch {
            // 파싱 실패 무시
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText, sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingText("");
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{"AI 어시스턴트"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {"식품안전/위생/법규에 대해 AI-FX에게 질문하세요. 수집된 데이터를 기반으로 답변합니다."}
        </p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <Bot className="w-16 h-16 text-emerald-300" />
            <div className="text-center space-y-2">
              <p className="font-medium text-gray-500">{"AI-FX 어시스턴트"}</p>
              <p className="text-sm">{"식품안전 관련 궁금한 점을 질문해보세요."}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {["최근 식중독 사고 알려줘", "HACCP 인증 절차가 뭐야?", "이번 달 행정처분 현황"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
            )}

            <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
              <Card className={`py-0 ${msg.role === "user" ? "bg-emerald-600 text-white border-emerald-600" : ""}`}>
                <CardContent className="py-3 px-4">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </CardContent>
              </Card>

              {/* 참고 문서 */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">{"참고 문서:"}</p>
                  {msg.sources.map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline"
                    >
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {src.site_name === "웹 검색" ? "웹" : `${src.similarity}%`}
                      </Badge>
                      <span className="line-clamp-1">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* 스트리밍 중인 응답 */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="max-w-[80%]">
              <Card className="py-0">
                <CardContent className="py-3 px-4">
                  {streamingText ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {streamingText}
                      <span className="inline-block w-1.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요..."
          disabled={loading}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Insight {
  id: number;
  insight_date: string;
  category: string;
  title: string;
  content: string;
  affected_industries: string[];
  action_items: string[] | { [key: string]: string }[];
  created_at: string;
}

const CATEGORY_STYLE: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  "핵심이슈": { label: "핵심 이슈", icon: "🔴", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  "업종체크": { label: "업종 체크", icon: "🟡", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  "법규변경": { label: "법규 변경", icon: "🔵", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [days, setDays] = useState("7");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("days", days);
    if (category !== "all") params.set("category", category);

    fetch(`/api/insights?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInsights(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, days]);

  // 날짜별 그룹핑
  const grouped: Record<string, Insight[]> = {};
  for (const ins of insights) {
    const date = ins.insight_date?.split("T")[0] || "unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(ins);
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);

      if (diff === 0) return "오늘";
      if (diff === 1) return "어제";
      return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    } catch {
      return dateStr;
    }
  };

  const parseActionItems = (items: Insight["action_items"]): string[] => {
    if (!items) return [];
    if (typeof items === "string") {
      try { return JSON.parse(items); } catch { return [items]; }
    }
    if (Array.isArray(items)) {
      return items.map((i) => (typeof i === "string" ? i : JSON.stringify(i)));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI 인사이트</h2>
        <p className="text-gray-500 text-sm mt-1">
          수집된 식품안전 뉴스에서 추출한 실무 인사이트
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={category} onValueChange={(v) => setCategory(v || "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="핵심이슈">핵심 이슈</SelectItem>
            <SelectItem value="업종체크">업종 체크</SelectItem>
            <SelectItem value="법규변경">법규 변경</SelectItem>
          </SelectContent>
        </Select>
        <Select value={days} onValueChange={(v) => setDays(v || "7")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">오늘</SelectItem>
            <SelectItem value="3">3일</SelectItem>
            <SelectItem value="7">7일</SelectItem>
            <SelectItem value="30">30일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          해당 기간에 생성된 인사이트가 없습니다
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 border-b pb-1">
              {formatDate(date)}
            </h3>
            <div className="space-y-4">
              {items.map((ins) => {
                const style = CATEGORY_STYLE[ins.category] || {
                  label: ins.category, icon: "⚪", bg: "bg-gray-50 border-gray-200", text: "text-gray-700",
                };
                const actions = parseActionItems(ins.action_items);

                return (
                  <div
                    key={ins.id}
                    className={`rounded-lg border p-4 ${style.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{style.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.text} bg-white/70`}>
                            {style.label}
                          </span>
                          {ins.affected_industries?.length > 0 && (
                            <div className="flex gap-1">
                              {ins.affected_industries.map((ind) => (
                                <span key={ind} className="text-xs text-gray-500 bg-white/50 px-1.5 py-0.5 rounded">
                                  {ind}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {ins.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {ins.content}
                        </p>
                        {actions.length > 0 && (
                          <div className="mt-3 bg-white/60 rounded p-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1.5">
                              실무 체크포인트
                            </p>
                            <ul className="space-y-1">
                              {actions.map((item, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                                  <span className="text-green-500 mt-0.5">{">"}</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

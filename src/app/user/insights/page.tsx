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
  source_article_ids: number[];
  source_articles: { id: number; title: string }[];
  cost_breakdown: string | null;
  severity: string | null;
  risk_score: number | null;
  estimated_cost: number | null;
  related_law: string | null;
  penalty_amount: string | null;
  efficiency_tip: string | null;
  logic: string | null;
  confidence: number | null;
  feedback_helpful: number;
  feedback_not_helpful: number;
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
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const [startDate, setStartDate] = useState(weekAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [feedbackState, setFeedbackState] = useState<Record<number, string | null>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleFeedback = async (insightId: number, type: "helpful" | "not_helpful") => {
    const current = feedbackState[insightId];
    const isCancel = current === type;

    // 즉시 UI 반영
    setFeedbackState((prev) => ({
      ...prev,
      [insightId]: isCancel ? null : type,
    }));

    // 카운트 즉시 업데이트
    setInsights((prev) =>
      prev.map((ins) => {
        if (ins.id !== insightId) return ins;
        const delta = isCancel ? -1 : 1;
        // 이전에 다른 버튼 눌렀으면 그쪽 -1
        const prevDelta = current && current !== type ? -1 : 0;
        return {
          ...ins,
          feedback_helpful:
            ins.feedback_helpful +
            (type === "helpful" ? delta : 0) +
            (current === "helpful" && type !== "helpful" ? prevDelta : 0),
          feedback_not_helpful:
            ins.feedback_not_helpful +
            (type === "not_helpful" ? delta : 0) +
            (current === "not_helpful" && type !== "not_helpful" ? prevDelta : 0),
        };
      })
    );

    // 서버 전송
    fetch("/api/insights/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insightId,
        helpful: type === "helpful",
        cancel: isCancel,
      }),
    }).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("start", startDate);
    params.set("end", endDate);
    if (category !== "all") params.set("category", category);

    fetch(`/api/insights?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInsights(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, startDate, endDate]);

  // 날짜별 그룹핑
  const grouped: Record<string, Insight[]> = {};
  for (const ins of insights) {
    const date = ins.insight_date?.split("T")[0] || "unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(ins);
  }

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      if (dateStr === todayStr) return `오늘 (${month}월 ${day}일)`;
      return `${year}년 ${month}월 ${day}일`;
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
        <h2 className="text-2xl font-bold">AI 식품 인사이트</h2>
        <p className="text-gray-500 text-sm mt-1">
          수집된 식품안전 뉴스에서 AI가 추출한 실무 인사이트
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={category} onValueChange={(v) => setCategory(v || "all")}>
          <SelectTrigger className="w-36">
            <SelectValue>{category === "all" ? "전체" : category === "핵심이슈" ? "핵심 이슈" : category === "업종체크" ? "업종 체크" : "법규 변경"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="핵심이슈">핵심 이슈</SelectItem>
            <SelectItem value="업종체크">업종 체크</SelectItem>
            <SelectItem value="법규변경">법규 변경</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-300 text-sm"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-300 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          해당 기간에 생성된 인사이트가 없습니다
        </div>
      ) : (
        Object.entries(grouped).map(([date, items], groupIdx) => {
          const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
          const isExpanded = expandedDates[date] ?? (groupIdx === 0 || date === todayStr);

          return (
          <div key={date}>
            <button
              onClick={() => setExpandedDates((prev) => ({ ...prev, [date]: !isExpanded }))}
              className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-600 text-xs font-bold">
                    {date.split("-")[2]?.replace(/^0/, "")}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-700">{formatDate(date)}</span>
                  <span className="text-xs text-gray-400 ml-2">{items.length}건의 인사이트</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${isExpanded ? "bg-teal-100 text-teal-700" : "bg-gray-200 text-gray-500"}`}>
                {isExpanded ? "접기" : "펼치기"}
              </span>
            </button>
            {isExpanded && <div className="space-y-4">
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
                        <h4 className="font-semibold text-gray-900 mb-1">
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
                        {/* 리스크 점수 + 과태료 + 법령 */}
                        {(ins.risk_score || ins.estimated_cost || ins.related_law) && (
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            {ins.risk_score && (
                              <div className="bg-white/60 rounded p-2 text-center">
                                <div className="text-gray-400">리스크 점수</div>
                                <div className={`text-lg font-bold ${ins.risk_score >= 7 ? "text-red-600" : ins.risk_score >= 4 ? "text-amber-600" : "text-green-600"}`}>
                                  {ins.risk_score}/10
                                </div>
                              </div>
                            )}
                            {ins.estimated_cost && (
                              <div className="bg-white/60 rounded p-2 text-center">
                                <div className="text-gray-400">예상 손실</div>
                                <div className="text-lg font-bold text-red-600">
                                  {ins.estimated_cost >= 10000
                                    ? `${(ins.estimated_cost / 10000).toFixed(0)}억원`
                                    : `${ins.estimated_cost}만원`}
                                </div>
                                {ins.cost_breakdown && (
                                  <div className="text-[10px] text-gray-400 mt-1 text-left leading-tight">
                                    {ins.cost_breakdown}
                                  </div>
                                )}
                              </div>
                            )}
                            {ins.penalty_amount && (
                              <div className="bg-white/60 rounded p-2 text-center">
                                <div className="text-gray-400">예상 처분</div>
                                <div className="text-sm font-semibold text-gray-700">{ins.penalty_amount}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {ins.efficiency_tip && (
                          <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-700">
                            💡 {ins.efficiency_tip}
                          </div>
                        )}

                        {ins.logic && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                              AI 추론 근거 보기
                            </summary>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {ins.logic}
                            </p>
                          </details>
                        )}

                        {/* 근거 뉴스 + 피드백 */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                            {ins.source_articles?.length > 0 ? (
                              <>
                                <span className="text-xs text-gray-400 shrink-0">근거:</span>
                                {ins.source_articles.map((sa) => (
                                  <a key={sa.id} href={`/user/news/${sa.id}`} className="text-xs text-blue-500 hover:underline truncate max-w-[200px]" title={sa.title}>
                                    {sa.title.length > 25 ? sa.title.slice(0, 25) + "..." : sa.title}
                                  </a>
                                ))}
                              </>
                            ) : ins.source_article_ids?.length > 0 ? (
                              <>
                                <span className="text-xs text-gray-400">근거:</span>
                                {ins.source_article_ids.map((aid) => (
                                  <a key={aid} href={`/user/news/${aid}`} className="text-xs text-blue-500 hover:underline">#{aid}</a>
                                ))}
                              </>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFeedback(ins.id, "helpful")}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                feedbackState[ins.id] === "helpful"
                                  ? "bg-green-100 text-green-700 font-semibold"
                                  : "text-gray-400 hover:text-green-600"
                              }`}
                            >
                              👍 도움됨{ins.feedback_helpful > 0 ? ` (${ins.feedback_helpful})` : ""}
                            </button>
                            <button
                              onClick={() => toggleFeedback(ins.id, "not_helpful")}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                feedbackState[ins.id] === "not_helpful"
                                  ? "bg-red-100 text-red-700 font-semibold"
                                  : "text-gray-400 hover:text-red-600"
                              }`}
                            >
                              👎 도움안됨{ins.feedback_not_helpful > 0 ? ` (${ins.feedback_not_helpful})` : ""}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
          </div>
          );
        })
      )}
    </div>
  );
}

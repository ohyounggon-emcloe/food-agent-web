"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SidoRisk {
  sido: string;
  today: number;
  todayLabel: string;
  tomorrow: number;
  tomorrowLabel: string;
  afterTomorrow: number;
  afterTomorrowLabel: string;
  baseDate: string;
}

interface RealtimeData {
  summary: SidoRisk[];
  totalRegions: number;
  baseDate: string;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "위험": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  "경고": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  "주의": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  "관심": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "안전": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const formatBaseDate = (d: string) => {
  if (!d || d.length < 8) return d;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
};

export function FoodPoisoningCard({ className }: { className?: string }) {
  const [data, setData] = useState<RealtimeData | null>(null);

  useEffect(() => {
    fetch("/api/food-poisoning/realtime")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || !data.summary?.length) return null;

  // 위험도 높은 순 정렬
  const sorted = [...data.summary].sort((a, b) => b.today - a.today);
  const warnings = sorted.filter((s) => s.today >= 51);
  const topRegions = sorted.slice(0, 8);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>오늘의 식중독 예측지수</span>
          <Badge variant="outline" className="text-xs font-normal">
            기준일 {formatBaseDate(data.baseDate)} · 실시간
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 주의 이상 지역 경고 */}
        {warnings.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-600 mb-1">
              ⚠️ 주의 이상 지역 {warnings.length}곳
            </p>
            <div className="flex flex-wrap gap-1.5">
              {warnings.map((w) => {
                const style = RISK_COLORS[w.todayLabel] || RISK_COLORS["관심"];
                return (
                  <span
                    key={w.sido}
                    className={`text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {w.sido} {w.today}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 지역별 예측지수 */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 text-xs text-gray-400 font-medium pb-1 border-b">
            <span>지역</span>
            <span className="text-center">오늘</span>
            <span className="text-center">내일</span>
            <span className="text-center">모레</span>
          </div>
          {topRegions.map((r) => (
            <div key={r.sido} className="grid grid-cols-4 text-xs items-center py-1">
              <span className="text-gray-700 font-medium truncate">{r.sido.replace("특별시", "").replace("광역시", "").replace("특별자치시", "").replace("특별자치도", "")}</span>
              <RiskCell score={r.today} label={r.todayLabel} />
              <RiskCell score={r.tomorrow} label={r.tomorrowLabel} />
              <RiskCell score={r.afterTomorrow} label={r.afterTomorrowLabel} />
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-400 mt-3 text-right">
          출처: 식중독예측지도 (poisonmap.mfds.go.kr)
        </p>
      </CardContent>
    </Card>
  );
}

function RiskCell({ score, label }: { score: number; label: string }) {
  const style = RISK_COLORS[label] || RISK_COLORS["안전"];
  return (
    <div className="flex justify-center">
      <span className={`px-1.5 py-0.5 rounded text-center min-w-[40px] ${style.bg} ${style.text} font-medium`}>
        {score}
      </span>
    </div>
  );
}

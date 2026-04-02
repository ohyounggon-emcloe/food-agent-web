"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FoodPoisoningData {
  year: string;
  totalIncidents: number;
  totalPatients: number;
  byRegion: { region: string; incidents: number; patients: number }[];
  byMonth: { month: string; incidents: number; patients: number }[];
}

export function FoodPoisoningCard({ className }: { className?: string }) {
  const [data, setData] = useState<FoodPoisoningData | null>(null);

  useEffect(() => {
    // 최신 연도 데이터 우선 시도 (2026 → 2025 폴백)
    const currentYear = new Date().getFullYear();
    fetch(`/api/food-poisoning?year=${currentYear}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.totalIncidents > 0) {
          setData(d);
        } else {
          // 올해 데이터 없으면 작년 조회
          fetch(`/api/food-poisoning?year=${currentYear - 1}`)
            .then((r) => (r.ok ? r.json() : null))
            .then(setData)
            .catch(() => setData(null));
        }
      })
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const topRegions = data.byRegion.slice(0, 5);
  const recentMonths = data.byMonth.slice(-3);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>최신 연간 식중독 발생현황</span>
          <Badge variant="outline" className="text-xs font-normal">
            {data.year}년 확정 통계
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 총계 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{data.totalIncidents}</p>
            <p className="text-xs text-red-400">발생 건수</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{data.totalPatients.toLocaleString()}</p>
            <p className="text-xs text-amber-400">환자 수</p>
          </div>
        </div>

        {/* 월별 추이 (최근 3개월) */}
        {recentMonths.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">최근 월별 추이</p>
            <div className="flex gap-2">
              {recentMonths.map((m) => (
                <div key={m.month} className="flex-1 bg-gray-50 rounded p-2 text-center">
                  <p className="text-xs text-gray-400">{m.month}월</p>
                  <p className="text-sm font-bold">{m.incidents}건</p>
                  <p className="text-xs text-gray-500">{m.patients}명</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 지역별 TOP 5 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">지역별 발생 TOP 5</p>
          <div className="space-y-1.5">
            {topRegions.map((r, i) => {
              const maxInc = topRegions[0]?.incidents || 1;
              const width = Math.max((r.incidents / maxInc) * 100, 8);
              return (
                <div key={r.region} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-10 shrink-0">{r.region}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-teal-400"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-16 text-right">
                    {r.incidents}건 / {r.patients}명
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

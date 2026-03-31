"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/skeleton-loader";

interface AnalysisData {
  totalArticles: number;
  dailyCounts: { date: string; count: number }[];
  riskDistribution: { risk_level: string; count: number }[];
  topSites: { site_name: string; count: number }[];
}

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-500",
  Level2: "bg-orange-500",
  Level3: "bg-yellow-500",
};

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    fetch("/api/analysis?days=30").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return <DashboardSkeleton />;
  }

  const totalRisk = data.riskDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{"상세 분석"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`최근 30일 식품 안전 데이터 분석 (${data.totalArticles}건)`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{"위험등급 분포"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.riskDistribution
                .sort((a, b) => b.count - a.count)
                .map((item) => {
                  const pct = totalRisk > 0 ? (item.count / totalRisk) * 100 : 0;
                  return (
                    <div key={item.risk_level} className="flex items-center gap-3">
                      <span className="text-sm w-16 shrink-0">
                        {item.risk_level}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${RISK_COLORS[item.risk_level] || "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right">
                        {item.count}{"건"} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{"상위 수집 기관 (Top 10)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSites.map((site, idx) => (
                <div key={site.site_name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                    <span className="text-sm">{site.site_name}</span>
                  </div>
                  <span className="text-sm font-medium">{site.count}{"건"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"일별 수집 추이"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {data.dailyCounts.slice(-30).map((day) => {
              const maxCount = Math.max(...data.dailyCounts.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 bg-blue-400 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${day.date}: ${day.count}건`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {day.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">
              {data.dailyCounts[0]?.date || ""}
            </span>
            <span className="text-xs text-gray-400">
              {data.dailyCounts[data.dailyCounts.length - 1]?.date || ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

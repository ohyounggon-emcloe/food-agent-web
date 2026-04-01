"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/types";

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-500",
  Level2: "bg-amber-500",
  Level3: "bg-blue-500",
  "해당없음": "bg-slate-400",
  "미분류": "bg-slate-300",
};

const RISK_LABELS: Record<string, string> = {
  Level1: "즉시 대응",
  Level2: "주의 관찰",
  Level3: "참고",
  "해당없음": "해당없음",
  "미분류": "미분류",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return <div className="text-red-500">데이터 로드 실패</div>;
  }

  const totalRisk = data.riskDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">대시보드</h2>
        <p className="text-gray-500 text-sm mt-1">
          AI-FX 시스템 현황
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 수집 게시글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              오늘 수집
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.todayArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              활성 사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.siteCounts.active}</div>
            {data.siteCounts.error > 0 && (
              <p className="text-xs text-red-500 mt-1">
                에러 {data.siteCounts.error}건
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              대기 중 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {data.pendingSuggestions.sites > 0 && (
                <Link href="/admin/sites/suggestions">
                  <Badge variant="secondary">
                    사이트 {data.pendingSuggestions.sites}
                  </Badge>
                </Link>
              )}
              {data.pendingSuggestions.keywords > 0 && (
                <Link href="/admin/keywords/suggestions">
                  <Badge variant="secondary">
                    키워드 {data.pendingSuggestions.keywords}
                  </Badge>
                </Link>
              )}
              {data.pendingSuggestions.sites === 0 &&
                data.pendingSuggestions.keywords === 0 && (
                  <span className="text-sm text-gray-400">없음</span>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className={data.unclassifiedCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              미분류 게시글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.unclassifiedCount > 0 ? "text-amber-600" : "text-gray-400"}`}>
              {data.unclassifiedCount || 0}
            </div>
            {data.unclassifiedCount > 0 && (
              <Link href="/admin/review?filter=미분류">
                <p className="text-xs text-amber-600 mt-1 hover:underline">
                  검토하기 →
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">위험 등급 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.riskDistribution
                .sort((a, b) => {
                  const order = ["Level1", "Level2", "Level3", "해당없음", "미분류"];
                  return order.indexOf(a.risk_level) - order.indexOf(b.risk_level);
                })
                .map((item) => {
                  const pct = totalRisk > 0 ? (item.count / totalRisk) * 100 : 0;
                  return (
                    <div key={item.risk_level} className="flex items-center gap-3">
                      <span className="text-sm w-20 shrink-0">
                        {RISK_LABELS[item.risk_level] || item.risk_level}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${RISK_COLORS[item.risk_level] || "bg-gray-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {item.count}건
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">에이전트 상태</CardTitle>
          </CardHeader>
          <CardContent>
            {data.agentStats.length === 0 ? (
              <p className="text-sm text-gray-400">실행 기록 없음</p>
            ) : (
              <div className="space-y-3">
                {data.agentStats.map((agent) => (
                  <div
                    key={agent.agent_name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {agent.agent_name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {agent.total_runs}회 실행
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          (agent.success_rate || 0) >= 90
                            ? "default"
                            : (agent.success_rate || 0) >= 70
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {Number(agent.success_rate || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

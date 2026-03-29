"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalArticles: number;
  todayArticles: number;
  riskDistribution: { risk_level: string; count: number }[];
  agentStats: { agent_name: string; success_rate: number | null; last_run_at: string | null }[];
}

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-500",
  Level2: "bg-amber-500",
  Level3: "bg-blue-500",
};

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentNews, setRecentNews] = useState<
    { id: number; title: string; risk_level: string; site_name: string; publish_date: string; url: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
    fetch("/api/news?limit=10&days=3").then((r) => r.json()).then((d) =>
      setRecentNews(Array.isArray(d) ? d : [])
    );
  }, []);

  if (!data) {
    return <p className="text-gray-500">{"로딩 중..."}</p>;
  }

  const highRisk = data.riskDistribution.filter(
    (r) => r.risk_level === "Level1" || r.risk_level === "Level2"
  );
  const highRiskCount = highRisk.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{"오늘의 AI-FX 현황"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {"AI 자동 수집을 통한 최신 위생법규 정보"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {"총 수집 게시글"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {"오늘 수집"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.todayArticles}</div>
          </CardContent>
        </Card>

        <Card className={highRiskCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {"고위험 게시글"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${highRiskCount > 0 ? "text-red-600" : ""}`}>
              {highRiskCount}
            </div>
            {highRiskCount > 0 && (
              <Link href="/user/news?risk_level=Level1" className="text-xs text-red-500 hover:underline">
                {"확인하기 →"}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{"최근 게시글"}</span>
            <Link href="/user/news" className="text-sm text-teal-600 font-normal hover:underline">
              {"전체 보기 →"}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNews.length === 0 ? (
            <p className="text-sm text-gray-400">{"최근 수집된 게시글이 없습니다"}</p>
          ) : (
            <div className="space-y-3">
              {recentNews.map((news) => (
                <div key={news.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <Badge
                    variant={
                      news.risk_level === "Level1"
                        ? "destructive"
                        : news.risk_level === "Level2"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs shrink-0 mt-0.5"
                  >
                    {news.risk_level || "-"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:text-teal-600 line-clamp-1"
                    >
                      {news.title}
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {news.site_name} | {news.publish_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

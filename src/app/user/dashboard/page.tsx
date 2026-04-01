"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/skeleton-loader";
import { Badge } from "@/components/ui/badge";
import { CrackdownCalendar } from "@/components/crackdown-calendar";
import { KoreaMap } from "@/components/korea-map";
import { FoodPoisoningCard } from "@/components/food-poisoning-card";

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

  const [error, setError] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setError(true), 10000);

    Promise.all([
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("dashboard fetch failed");
        return r.json();
      }).then(setData),
      fetch("/api/news?limit=10&days=3").then((r) => {
        if (!r.ok) return [];
        return r.json();
      }).then((d) => setRecentNews(Array.isArray(d) ? d : [])),
    ])
      .catch((err) => {
        console.error("Dashboard load error:", err);
        setError(true);
      })
      .finally(() => clearTimeout(timeout));
  }, []);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-medium">{"데이터를 불러올 수 없습니다"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          {"새로고침"}
        </button>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const highRisk = data.riskDistribution.filter(
    (r) => r.risk_level === "Level1" || r.risk_level === "Level2"
  );
  const highRiskCount = highRisk.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{"오늘의 식품위생법규 정보 현황"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {"AI 자동 수집을 통한 최신 식품 안전 정보"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="py-2 md:py-3">
          <CardContent className="pb-0 pt-0 px-2 md:px-4">
            <p className="text-[10px] md:text-xs font-medium text-gray-500">{"총 수집"}</p>
            <div className="text-lg md:text-2xl font-bold mt-0.5">{data.totalArticles}</div>
          </CardContent>
        </Card>

        <Card className="py-2 md:py-3">
          <CardContent className="pb-0 pt-0 px-2 md:px-4">
            <p className="text-[10px] md:text-xs font-medium text-gray-500">{"오늘 수집"}</p>
            <div className="text-lg md:text-2xl font-bold mt-0.5">{data.todayArticles}</div>
          </CardContent>
        </Card>

        <Card className={`py-2 md:py-3 ${highRiskCount > 0 ? "border-red-200 bg-red-50" : ""}`}>
          <CardContent className="pb-0 pt-0 px-2 md:px-4">
            <p className="text-[10px] md:text-xs font-medium text-gray-500">{"고위험"}</p>
            <div className={`text-lg md:text-2xl font-bold mt-0.5 ${highRiskCount > 0 ? "text-red-600" : ""}`}>
              {highRiskCount}
            </div>
            {highRiskCount > 0 && (
              <Link href="/user/news?risk_level=Level1" className="text-[10px] md:text-xs text-red-500 hover:underline">
                {"확인 →"}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 달력 + 지도 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrackdownCalendar />
        <KoreaMap />
      </div>

      {/* 식중독 현황 */}
      <FoodPoisoningCard />

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
                    <Link
                      href={`/user/news/${news.id}`}
                      className="text-sm font-medium hover:text-teal-600 line-clamp-1"
                    >
                      {news.title}
                    </Link>
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

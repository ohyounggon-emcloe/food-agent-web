import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days")) || 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // 날짜별 수집 건수
  const { data: articles } = await supabase
    .from("collected_info")
    .select("publish_date, risk_level, site_name")
    .gte("publish_date", cutoffStr)
    .order("publish_date", { ascending: true });

  // 날짜별 집계
  const dailyCounts: Record<string, number> = {};
  const riskCounts: Record<string, number> = {};
  const siteCounts: Record<string, number> = {};

  for (const a of articles || []) {
    const date = a.publish_date || "unknown";
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;

    const risk = a.risk_level || "미분류";
    riskCounts[risk] = (riskCounts[risk] || 0) + 1;

    const site = a.site_name || "unknown";
    siteCounts[site] = (siteCounts[site] || 0) + 1;
  }

  // 상위 기관
  const topSites = Object.entries(siteCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([site_name, count]) => ({ site_name, count }));

  return NextResponse.json({
    totalArticles: articles?.length || 0,
    dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    })),
    riskDistribution: Object.entries(riskCounts).map(
      ([risk_level, count]) => ({ risk_level, count })
    ),
    topSites,
  });
}

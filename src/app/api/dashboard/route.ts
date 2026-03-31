import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// 30초 캐시
export const revalidate = 30;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        totalArticles: 0,
        todayArticles: 0,
        riskDistribution: [],
        agentStats: [],
        siteCounts: { active: 0, error: 0, inactive: 0 },
        pendingSuggestions: { sites: 0, keywords: 0 },
      });
    }

    // 사전 집계 테이블에서 1회 조회 (6개 쿼리 → 1개로 축소)
    const [cacheResp, agentResp] = await Promise.all([
      supabase.from("dashboard_cache").select("*").eq("id", 1).single(),
      supabase.from("meta_monitor").select("*"),
    ]);

    const cache = cacheResp.data;

    if (!cache) {
      // 캐시 없으면 갱신 시도
      await supabase.rpc("refresh_dashboard_cache");
      return NextResponse.json({
        totalArticles: 0,
        todayArticles: 0,
        riskDistribution: [],
        agentStats: agentResp.data || [],
        siteCounts: { active: 0, error: 0, inactive: 0 },
        pendingSuggestions: { sites: 0, keywords: 0 },
      });
    }

    return NextResponse.json({
      totalArticles: cache.total_articles,
      todayArticles: cache.today_articles,
      riskDistribution: [
        { risk_level: "Level1", count: cache.level1_count },
        { risk_level: "Level2", count: cache.level2_count },
        { risk_level: "Level3", count: cache.level3_count },
      ],
      agentStats: agentResp.data || [],
      siteCounts: {
        active: cache.active_sites,
        error: cache.error_sites,
        inactive: 0,
      },
      pendingSuggestions: {
        sites: cache.suggested_sites,
        keywords: cache.pending_keywords,
      },
      cachedAt: cache.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: "대시보드 데이터 조회 실패" },
      { status: 500 }
    );
  }
}

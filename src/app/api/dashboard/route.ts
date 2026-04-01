import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

// 30초 캐시
export const revalidate = 30;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({
        totalArticles: 0,
        todayArticles: 0,
        riskDistribution: [],
        agentStats: [],
        siteCounts: { active: 0, error: 0, inactive: 0 },
        pendingSuggestions: { sites: 0, keywords: 0 },
      });
    }

    if (useNcloudDb()) {
      const [cache, agentStats, unclassified] = await Promise.all([
        queryOne<{
          total_articles: number;
          today_articles: number;
          level1_count: number;
          level2_count: number;
          level3_count: number;
          active_sites: number;
          error_sites: number;
          suggested_sites: number;
          pending_keywords: number;
          updated_at: string;
        }>("SELECT * FROM dashboard_cache WHERE id = 1"),
        query("SELECT * FROM meta_monitor"),
        queryOne<{ count: string }>(
          "SELECT count(*) FROM collected_info WHERE risk_level IS NULL OR risk_level IN ('미분류', '')"
        ),
      ]);

      if (!cache) {
        await query("SELECT refresh_dashboard_cache()");
        return NextResponse.json({
          totalArticles: 0,
          todayArticles: 0,
          riskDistribution: [],
          agentStats: agentStats || [],
          siteCounts: { active: 0, error: 0, inactive: 0 },
          pendingSuggestions: { sites: 0, keywords: 0 },
        });
      }

      const headers = { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" };
      return NextResponse.json({
        totalArticles: cache.total_articles,
        todayArticles: cache.today_articles,
        riskDistribution: [
          { risk_level: "Level1", count: cache.level1_count },
          { risk_level: "Level2", count: cache.level2_count },
          { risk_level: "Level3", count: cache.level3_count },
        ],
        agentStats: agentStats || [],
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
        unclassifiedCount: parseInt(unclassified?.count || "0"),
      }, { headers });
    }

    // Fallback: existing Supabase code
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

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// 60초 캐시 (ISR)
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 실패해도 대시보드 데이터는 반환 (공개 데이터)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // 미인증 시 빈 데이터 반환 (에러 대신)
      return NextResponse.json({
        totalArticles: 0,
        todayArticles: 0,
        riskDistribution: [],
        agentStats: [],
        siteCounts: { active: 0, error: 0, inactive: 0 },
        pendingSuggestions: { sites: 0, keywords: 0 },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const [
      totalResp,
      todayResp,
      level1Resp,
      level2Resp,
      level3Resp,
      agentResp,
      siteResp,
      kwSugResp,
    ] = await Promise.all([
      supabase.from("collected_info").select("id", { count: "exact", head: true }),
      supabase
        .from("collected_info")
        .select("id", { count: "exact", head: true })
        .eq("publish_date", today),
      supabase.from("collected_info").select("id", { count: "exact", head: true }).eq("risk_level", "Level1"),
      supabase.from("collected_info").select("id", { count: "exact", head: true }).eq("risk_level", "Level2"),
      supabase.from("collected_info").select("id", { count: "exact", head: true }).eq("risk_level", "Level3"),
      supabase.from("meta_monitor").select("*"),
      supabase.from("compliance_data").select("status"),
      supabase
        .from("keyword_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const riskDistribution = [
      { risk_level: "Level1", count: level1Resp.count || 0 },
      { risk_level: "Level2", count: level2Resp.count || 0 },
      { risk_level: "Level3", count: level3Resp.count || 0 },
    ];

    const siteCounts = { active: 0, error: 0, inactive: 0 };
    for (const row of siteResp.data || []) {
      const s = row.status || "active";
      if (s in siteCounts) {
        siteCounts[s as keyof typeof siteCounts] += 1;
      }
    }

    const suggestedSites = (siteResp.data || []).filter(
      (r) => r.status === "suggested"
    ).length;

    return NextResponse.json({
      totalArticles: totalResp.count || 0,
      todayArticles: todayResp.count || 0,
      riskDistribution,
      agentStats: agentResp.data || [],
      siteCounts,
      pendingSuggestions: {
        sites: suggestedSites,
        keywords: kwSugResp.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "대시보드 데이터 조회 실패" },
      { status: 500 }
    );
  }
}

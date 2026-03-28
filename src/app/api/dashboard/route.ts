import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [
      totalResp,
      todayResp,
      riskResp,
      agentResp,
      siteResp,
      kwSugResp,
    ] = await Promise.all([
      supabase.from("collected_info").select("id", { count: "exact", head: true }),
      supabase
        .from("collected_info")
        .select("id", { count: "exact", head: true })
        .eq("publish_date", today),
      supabase.from("collected_info").select("risk_level"),
      supabase.from("meta_monitor").select("*"),
      supabase.from("compliance_data").select("status"),
      supabase
        .from("keyword_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const riskCounts: Record<string, number> = {};
    for (const row of riskResp.data || []) {
      const level = row.risk_level || "미분류";
      riskCounts[level] = (riskCounts[level] || 0) + 1;
    }
    const riskDistribution = Object.entries(riskCounts).map(
      ([risk_level, count]) => ({ risk_level, count })
    );

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

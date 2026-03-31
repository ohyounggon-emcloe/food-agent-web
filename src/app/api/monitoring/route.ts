import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuth(supabase);
    if (isAuthError(authResult)) return authResult;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (useNcloudDb()) {
      const [
        totalResult,
        todayResult,
        highRiskData,
        riskData,
        trendData,
        agentData,
        logsData,
      ] = await Promise.all([
        queryOne<{ count: string }>("SELECT count(*) FROM collected_info"),
        queryOne<{ count: string }>("SELECT count(*) FROM collected_info WHERE publish_date = $1", [todayStr]),
        query(
          `SELECT id, title, url, site_name, risk_level, summary, publish_date, has_attachments
           FROM collected_info
           WHERE risk_level IN ('Level1', 'Level2') AND publish_date >= $1
           ORDER BY publish_date DESC
           LIMIT 20`,
          [weekAgo]
        ),
        query("SELECT risk_level FROM collected_info"),
        query(
          `SELECT publish_date FROM collected_info
           WHERE publish_date >= $1
           ORDER BY publish_date ASC`,
          [weekAgo]
        ),
        query("SELECT * FROM meta_monitor"),
        query(
          `SELECT agent_name, status, started_at, duration_ms, articles_count, error_message
           FROM system_logs
           ORDER BY started_at DESC
           LIMIT 10`
        ),
      ]);

      // 위험도 분포 집계
      const riskCounts: Record<string, number> = {};
      for (const row of riskData || []) {
        const level = (row as { risk_level: string | null }).risk_level || "미분류";
        riskCounts[level] = (riskCounts[level] || 0) + 1;
      }
      const riskDistribution = Object.entries(riskCounts).map(
        ([risk_level, count]) => ({ risk_level, count })
      );

      // 수집 추이 (날짜별 건수)
      const trendCounts: Record<string, number> = {};
      for (const row of trendData || []) {
        const d = (row as { publish_date: string }).publish_date || "unknown";
        trendCounts[d] = (trendCounts[d] || 0) + 1;
      }
      const collectionTrend = Object.entries(trendCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 에이전트 성공률
      const agentStats = (agentData || []).map((a: Record<string, unknown>) => ({
        agent_name: a.agent_name,
        total_runs: a.total_runs,
        success_rate: parseFloat(String(a.success_rate)) || 0,
        avg_duration_ms: parseInt(String(a.avg_duration_ms)) || 0,
        last_run_at: a.last_run_at,
      }));

      return NextResponse.json({
        totalArticles: parseInt(totalResult?.count || "0"),
        todayArticles: parseInt(todayResult?.count || "0"),
        highRiskAlerts: highRiskData || [],
        riskDistribution,
        collectionTrend,
        agentStats,
        recentLogs: logsData || [],
      });
    }

    // Fallback: existing Supabase code
    const [
      totalResp,
      todayResp,
      highRiskResp,
      riskResp,
      trendResp,
      agentResp,
      logsResp,
    ] = await Promise.all([
      // 전체 건수
      supabase
        .from("collected_info")
        .select("id", { count: "exact", head: true }),

      // 오늘 건수
      supabase
        .from("collected_info")
        .select("id", { count: "exact", head: true })
        .eq("publish_date", todayStr),

      // 위험 알림 (Level1/Level2, 최근 7일)
      supabase
        .from("collected_info")
        .select("id, title, url, site_name, risk_level, summary, publish_date, has_attachments")
        .in("risk_level", ["Level1", "Level2"])
        .gte("publish_date", weekAgo)
        .order("publish_date", { ascending: false })
        .limit(20),

      // 위험도 분포 (레벨별 COUNT)
      supabase.from("collected_info").select("risk_level"),

      // 수집 추이 (최근 7일, 날짜별)
      supabase
        .from("collected_info")
        .select("publish_date")
        .gte("publish_date", weekAgo)
        .order("publish_date", { ascending: true }),

      // 에이전트 통계
      supabase.from("meta_monitor").select("*"),

      // 최근 시스템 로그
      supabase
        .from("system_logs")
        .select("agent_name, status, started_at, duration_ms, articles_count, error_message")
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    // 위험도 분포 집계
    const riskCounts: Record<string, number> = {};
    for (const row of riskResp.data || []) {
      const level = row.risk_level || "미분류";
      riskCounts[level] = (riskCounts[level] || 0) + 1;
    }
    const riskDistribution = Object.entries(riskCounts).map(
      ([risk_level, count]) => ({ risk_level, count })
    );

    // 수집 추이 (날짜별 건수)
    const trendCounts: Record<string, number> = {};
    for (const row of trendResp.data || []) {
      const d = row.publish_date || "unknown";
      trendCounts[d] = (trendCounts[d] || 0) + 1;
    }
    const collectionTrend = Object.entries(trendCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 에이전트 성공률
    const agentStats = (agentResp.data || []).map((a) => ({
      agent_name: a.agent_name,
      total_runs: a.total_runs,
      success_rate: parseFloat(a.success_rate) || 0,
      avg_duration_ms: parseInt(a.avg_duration_ms) || 0,
      last_run_at: a.last_run_at,
    }));

    return NextResponse.json({
      totalArticles: totalResp.count || 0,
      todayArticles: todayResp.count || 0,
      highRiskAlerts: highRiskResp.data || [],
      riskDistribution,
      collectionTrend,
      agentStats,
      recentLogs: logsResp.data || [],
    });
  } catch (error) {
    console.error("Monitoring API error:", error);
    return NextResponse.json(
      { error: "모니터링 데이터 조회 실패" },
      { status: 500 }
    );
  }
}

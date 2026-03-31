import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry");
  const type = searchParams.get("type") || "all"; // daily | weekly | all

  try {
    // DEBUG: 환경변수 확인
    if (type === "debug") {
      return NextResponse.json({
        useNcloud: useNcloudDb(),
        USE_NCLOUD_DB: process.env.USE_NCLOUD_DB || "not set",
        NCLOUD_DB_HOST: process.env.NCLOUD_DB_HOST || "not set",
      });
    }

    if (useNcloudDb()) {
      const results: unknown[] = [];

      // 주간 리포트
      if (type === "all" || type === "weekly") {
        let sql = "SELECT *, 'weekly' as report_type FROM weekly_reports";
        const params: unknown[] = [];
        if (industry && industry !== "all") {
          sql += " WHERE industry = $1";
          params.push(industry);
        }
        sql += " ORDER BY week_start DESC LIMIT 30";
        const weekly = await query(sql, params);
        results.push(...(weekly || []));
      }

      // 일일 리포트
      if (type === "all" || type === "daily") {
        const daily = await query(
          "SELECT *, 'daily' as report_type FROM daily_reports ORDER BY report_date DESC LIMIT 30"
        );
        results.push(...(daily || []));
      }

      return NextResponse.json(results);
    }

    // Fallback: Supabase
    const results: unknown[] = [];

    if (type === "all" || type === "weekly") {
      let q = supabase
        .from("weekly_reports")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(30);
      if (industry && industry !== "all") {
        q = q.eq("industry", industry);
      }
      const { data } = await q;
      results.push(...(data || []).map((d) => ({ ...d, report_type: "weekly" })));
    }

    if (type === "all" || type === "daily") {
      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(30);
      results.push(...(data || []).map((d) => ({ ...d, report_type: "daily" })));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Reports API error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "리포트 조회 실패", detail: msg, useNcloud: useNcloudDb(), host: process.env.NCLOUD_DB_HOST || "not set" }, { status: 500 });
  }
}

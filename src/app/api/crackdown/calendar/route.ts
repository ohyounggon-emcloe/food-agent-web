import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuth(supabase);
    if (isAuthError(authResult)) return authResult;

    // 최근 3개월 단속 일정
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (useNcloudDb()) {
      const data = await query(
        `SELECT id, title, alert_type, region, enforcement_date, risk_level
         FROM crackdown_alerts
         WHERE created_at >= $1 AND enforcement_date IS NOT NULL
         ORDER BY enforcement_date ASC`,
        [cutoff]
      );
      return NextResponse.json(data || []);
    }

    // Fallback: existing Supabase code
    const { data, error } = await supabase
      .from("crackdown_alerts")
      .select("id, title, alert_type, region, enforcement_date, risk_level")
      .gte("created_at", cutoff)
      .not("enforcement_date", "is", null)
      .order("enforcement_date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: "캘린더 데이터 조회 실패" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuth(supabase);
    if (isAuthError(authResult)) return authResult;

    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    let rawData: { region: string | null; risk_level: string | null }[];

    if (useNcloudDb()) {
      rawData = await query<{ region: string | null; risk_level: string | null }>(
        "SELECT region, risk_level FROM crackdown_alerts WHERE created_at >= $1",
        [cutoff]
      );
    } else {
      // Fallback: existing Supabase code
      const { data, error } = await supabase
        .from("crackdown_alerts")
        .select("region, risk_level")
        .gte("created_at", cutoff);

      if (error) throw error;
      rawData = data || [];
    }

    const regionMap: Record<
      string,
      { region: string; count: number; level1: number; level2: number; level3: number }
    > = {};

    for (const row of rawData) {
      const region = row.region || "전국";
      if (!regionMap[region]) {
        regionMap[region] = { region, count: 0, level1: 0, level2: 0, level3: 0 };
      }
      regionMap[region].count += 1;
      if (row.risk_level === "Level1") regionMap[region].level1 += 1;
      else if (row.risk_level === "Level2") regionMap[region].level2 += 1;
      else if (row.risk_level === "Level3") regionMap[region].level3 += 1;
    }

    return NextResponse.json(Object.values(regionMap));
  } catch (error) {
    return NextResponse.json(
      { error: "지역별 통계 조회 실패" },
      { status: 500 }
    );
  }
}

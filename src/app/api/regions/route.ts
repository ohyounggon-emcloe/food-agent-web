import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  try {
    if (useNcloudDb()) {
      const data = await query<{ id: number; sido: string; sigungu: string | null }>(
        "SELECT id, sido, sigungu FROM regions_master WHERE is_active = true ORDER BY sido, sigungu"
      );

      // 시/도별로 그룹핑
      const grouped: Record<string, string[]> = {};
      for (const row of data || []) {
        if (!grouped[row.sido]) {
          grouped[row.sido] = [];
        }
        if (row.sigungu) {
          grouped[row.sido].push(row.sigungu);
        }
      }

      return NextResponse.json(grouped);
    }

    // Fallback: existing Supabase code
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("regions_master")
      .select("id, sido, sigungu")
      .eq("is_active", true)
      .order("sido")
      .order("sigungu");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 시/도별로 그룹핑
    const grouped: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!grouped[row.sido]) {
        grouped[row.sido] = [];
      }
      if (row.sigungu) {
        grouped[row.sido].push(row.sigungu);
      }
    }

    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json({ error: "지역 데이터 조회 실패" }, { status: 500 });
  }
}

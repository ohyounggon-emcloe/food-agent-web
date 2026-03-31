import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  try {
    if (useNcloudDb()) {
      const data = await query<{ id: number; category: string; sub_type: string | null }>(
        "SELECT id, category, sub_type FROM industry_master WHERE is_active = true ORDER BY category, sub_type"
      );

      // 대분류별로 그룹핑
      const grouped: Record<string, string[]> = {};
      for (const row of data || []) {
        if (!grouped[row.category]) {
          grouped[row.category] = [];
        }
        if (row.sub_type) {
          grouped[row.category].push(row.sub_type);
        }
      }

      return NextResponse.json(grouped);
    }

    // Fallback: existing Supabase code
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("industry_master")
      .select("id, category, sub_type")
      .eq("is_active", true)
      .order("category")
      .order("sub_type");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 대분류별로 그룹핑
    const grouped: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      if (row.sub_type) {
        grouped[row.category].push(row.sub_type);
      }
    }

    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json({ error: "업태 데이터 조회 실패" }, { status: 500 });
  }
}

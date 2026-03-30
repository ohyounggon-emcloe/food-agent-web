import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
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

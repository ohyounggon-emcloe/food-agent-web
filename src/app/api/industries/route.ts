import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    if (useNcloudDb()) {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (category && category !== "all") {
        // 선택한 업종 + 공통 항목 함께 조회
        conditions.push(`(category = $${paramIdx} OR category = '공통')`);
        params.push(category);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const data = await query(
        `SELECT * FROM self_inspection_items ${whereClause} ORDER BY CASE WHEN category = '공통' THEN 1 ELSE 0 END, criteria, id`,
        params
      );

      return NextResponse.json(data || []);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Inspection API error:", error);
    return NextResponse.json({ error: "점검항목 조회 실패" }, { status: 500 });
  }
}

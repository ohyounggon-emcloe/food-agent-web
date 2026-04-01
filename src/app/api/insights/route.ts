import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days")) || 7;
  const category = searchParams.get("category");

  if (useNcloudDb()) {
    try {
      let sql = `
        SELECT id, insight_date, category, title, content,
               affected_industries, action_items, source_article_ids, created_at
        FROM daily_insights
        WHERE insight_date >= CURRENT_DATE - $1::integer
      `;
      const params: unknown[] = [days];
      let paramIdx = 2;

      if (category && category !== "all") {
        sql += ` AND category = $${paramIdx}`;
        params.push(category);
        paramIdx++;
      }

      sql += " ORDER BY insight_date DESC, id DESC";

      const data = await query(sql, params);
      return NextResponse.json(data);
    } catch (err) {
      console.error("Insights API error:", err);
      return NextResponse.json([]);
    }
  }

  return NextResponse.json([]);
}

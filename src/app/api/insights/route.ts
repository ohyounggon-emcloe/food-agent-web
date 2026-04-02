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
               affected_industries, action_items, source_article_ids,
               severity, risk_score, estimated_cost, cost_breakdown, related_law,
               penalty_amount, efficiency_tip, logic, confidence,
               feedback_helpful, feedback_not_helpful, created_at
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

      // source_article_ids의 제목을 조회하여 추가
      const allIds = (data || []).flatMap((d: Record<string, unknown>) => (d.source_article_ids as number[]) || []);
      let articleTitles: Record<number, string> = {};
      if (allIds.length > 0) {
        const uniqueIds = [...new Set(allIds)];
        const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(",");
        const titles = await query<{ id: number; title: string }>(
          `SELECT id, title FROM collected_info WHERE id IN (${placeholders})`,
          uniqueIds
        );
        articleTitles = Object.fromEntries((titles || []).map((t) => [t.id, t.title]));
      }

      const enriched = (data || []).map((d: Record<string, unknown>) => ({
        ...d,
        source_articles: ((d.source_article_ids as number[]) || []).map((aid) => ({
          id: aid,
          title: articleTitles[aid] || `#${aid}`,
        })),
      }));

      return NextResponse.json(enriched);
    } catch (err) {
      console.error("Insights API error:", err);
      return NextResponse.json([]);
    }
  }

  return NextResponse.json([]);
}

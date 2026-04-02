import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { execute, queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { insightId, helpful, reason, cancel } = body;

  if (!insightId || typeof helpful !== "boolean") {
    return NextResponse.json({ error: "insightId and helpful are required" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const column = helpful ? "feedback_helpful" : "feedback_not_helpful";
    const delta = cancel ? -1 : 1;
    await execute(
      `UPDATE daily_insights SET ${column} = GREATEST(0, COALESCE(${column}, 0) + $1) WHERE id = $2`,
      [delta, insightId]
    );

    // "도움안됨" 시 피드백 메모리에도 저장 (자가 학습 루프)
    if (!helpful) {
      const insight = await queryOne<{ title: string; content: string; category: string }>(
        "SELECT title, content, category FROM daily_insights WHERE id = $1",
        [insightId]
      );
      if (insight) {
        await execute(
          `INSERT INTO feedback_vectors
           (article_title, article_content, old_level, new_level, reason, feedback_type)
           VALUES ($1, $2, $3, 'insight_rejected', $4, 'insight_feedback')`,
          [
            insight.title,
            (insight.content || "").substring(0, 500),
            insight.category,
            reason || "사용자가 도움안됨으로 평가",
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "DB not configured" }, { status: 500 });
}

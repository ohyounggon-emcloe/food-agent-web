import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { execute, useNcloudDb } from "@/lib/ncloud-db";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { insightId, helpful } = body;

  if (!insightId || typeof helpful !== "boolean") {
    return NextResponse.json({ error: "insightId and helpful are required" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const column = helpful ? "feedback_helpful" : "feedback_not_helpful";
    await execute(
      `UPDATE daily_insights SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = $1`,
      [insightId]
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "DB not configured" }, { status: 500 });
}

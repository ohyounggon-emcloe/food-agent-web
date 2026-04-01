import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const numId = Number(id);
  if (!numId) {
    return NextResponse.json({ error: "유효하지 않은 ID" }, { status: 400 });
  }

  try {
    if (useNcloudDb()) {
      const article = await queryOne(
        `SELECT id, title, url, site_name, publish_date, risk_level,
                summary, content, region, source_type,
                has_attachments, created_at
         FROM collected_info WHERE id = $1`,
        [numId]
      );

      if (!article) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
      }

      return NextResponse.json(article);
    }

    // Fallback: Supabase
    const { data, error } = await supabase
      .from("collected_info")
      .select("*")
      .eq("id", numId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("News detail API error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

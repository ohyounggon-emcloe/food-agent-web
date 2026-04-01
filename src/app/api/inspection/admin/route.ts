import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    if (useNcloudDb()) {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (category && category !== "all") {
        conditions.push(`category = $${paramIdx}`);
        params.push(category);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const data = await query(
        `SELECT * FROM self_inspection_items ${whereClause} ORDER BY category, criteria, id`,
        params
      );

      // 카테고리 목록도 함께 반환
      const categories = await query(
        "SELECT DISTINCT category FROM self_inspection_items ORDER BY category"
      );

      return NextResponse.json({
        items: data || [],
        categories: (categories || []).map((c: any) => c.category),
      });
    }

    return NextResponse.json({ items: [], categories: [] });
  } catch (error) {
    console.error("Inspection Admin API error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { category, criteria, method, content } = body;

  if (!category || !criteria || !content) {
    return NextResponse.json({ error: "카테고리, 점검기준, 점검내용은 필수입니다" }, { status: 400 });
  }

  try {
    if (useNcloudDb()) {
      const data = await queryOne(
        `INSERT INTO self_inspection_items (category, criteria, method, content)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [category, criteria, method || "O/X", content]
      );
      return NextResponse.json(data, { status: 201 });
    }
    return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
  } catch (error) {
    console.error("Inspection create error:", error);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { id, category, criteria, method, content } = body;

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  try {
    if (useNcloudDb()) {
      const data = await queryOne(
        `UPDATE self_inspection_items SET category=$1, criteria=$2, method=$3, content=$4
         WHERE id=$5 RETURNING *`,
        [category, criteria, method, content, id]
      );
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
  } catch (error) {
    console.error("Inspection update error:", error);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  try {
    if (useNcloudDb()) {
      await execute("DELETE FROM self_inspection_items WHERE id = $1", [Number(id)]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
  } catch (error) {
    console.error("Inspection delete error:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}

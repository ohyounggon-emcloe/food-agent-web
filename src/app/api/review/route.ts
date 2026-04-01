import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "pending";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const from = (page - 1) * pageSize;

  if (useNcloudDb()) {
    let filterCondition = "";
    if (filter === "pending") {
      filterCondition = "WHERE (risk_level = '미분류' OR risk_level = '해당없음' OR risk_level IS NULL)";
    } else if (filter === "해당없음") {
      filterCondition = "WHERE risk_level = '해당없음'";
    } else if (filter === "미분류") {
      filterCondition = "WHERE (risk_level = '미분류' OR risk_level IS NULL)";
    } else if (filter === "Level1" || filter === "Level2" || filter === "Level3") {
      filterCondition = `WHERE risk_level = '${filter}'`;
    }
    // filter === "all" → no filter

    const countResult = await queryOne<{ count: string }>(
      `SELECT count(*) FROM collected_info ${filterCondition}`
    );
    const total = parseInt(countResult?.count || "0");

    const data = await query(
      `SELECT id, title, url, site_name, publish_date, risk_level, summary, region, industry_tags
       FROM collected_info
       ${filterCondition}
       ORDER BY publish_date DESC
       OFFSET $1 LIMIT $2`,
      [from, pageSize]
    );

    return NextResponse.json({
      data: data || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  // Fallback: existing Supabase code
  const to = from + pageSize - 1;

  // 총 건수
  let countQuery = supabase
    .from("collected_info")
    .select("id", { count: "exact", head: true });

  if (filter === "pending") {
    countQuery = countQuery.or("risk_level.eq.미분류,risk_level.eq.해당없음,risk_level.is.null");
  } else if (filter === "해당없음") {
    countQuery = countQuery.eq("risk_level", "해당없음");
  } else if (filter === "미분류") {
    countQuery = countQuery.or("risk_level.eq.미분류,risk_level.is.null");
  } else if (filter === "Level1" || filter === "Level2" || filter === "Level3") {
    countQuery = countQuery.eq("risk_level", filter);
  }

  const { count } = await countQuery;

  // 데이터 조회
  let dataQuery = supabase
    .from("collected_info")
    .select("id, title, url, site_name, publish_date, risk_level, summary, region, industry_tags");

  if (filter === "pending") {
    dataQuery = dataQuery.or("risk_level.eq.미분류,risk_level.eq.해당없음,risk_level.is.null");
  } else if (filter === "해당없음") {
    dataQuery = dataQuery.eq("risk_level", "해당없음");
  } else if (filter === "미분류") {
    dataQuery = dataQuery.or("risk_level.eq.미분류,risk_level.is.null");
  } else if (filter === "Level1" || filter === "Level2" || filter === "Level3") {
    dataQuery = dataQuery.eq("risk_level", filter);
  }

  dataQuery = dataQuery
    .order("publish_date", { ascending: false })
    .range(from, to);

  const { data, error } = await dataQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { id, ids, risk_level, action } = body;

  // 일괄 변경 (ids 배열)
  if (ids && Array.isArray(ids) && ids.length > 0 && risk_level) {
    if (useNcloudDb()) {
      const placeholders = ids.map((_: number, i: number) => `$${i + 2}`).join(",");
      await execute(
        `UPDATE collected_info SET risk_level = $1 WHERE id IN (${placeholders})`,
        [risk_level, ...ids]
      );
      return NextResponse.json({ success: true, action: "bulk_updated", count: ids.length });
    }

    const { error } = await supabase
      .from("collected_info")
      .update({ risk_level })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "bulk_updated", count: ids.length });
  }

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (useNcloudDb()) {
    if (action === "delete") {
      await execute("DELETE FROM collected_info WHERE id = $1", [id]);
      return NextResponse.json({ success: true, action: "deleted" });
    }

    if (risk_level) {
      const before = await queryOne<{ risk_level: string; title: string; site_name: string }>(
        "SELECT risk_level, title, site_name FROM collected_info WHERE id = $1",
        [id]
      );

      await execute(
        "UPDATE collected_info SET risk_level = $1 WHERE id = $2",
        [risk_level, id]
      );

      const oldLevel = before?.risk_level || "미분류";
      if (oldLevel !== risk_level) {
        await execute(
          `INSERT INTO level_adjustments (article_id, article_title, site_name, old_level, new_level, adjusted_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, before?.title || "", before?.site_name || "", oldLevel, risk_level, authResult.user.id, body.reason || null]
        );
      }

      return NextResponse.json({ success: true, action: "updated" });
    }

    return NextResponse.json({ error: "risk_level or action required" }, { status: 400 });
  }

  // Fallback: existing Supabase code
  if (action === "delete") {
    const { error } = await supabase
      .from("collected_info")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "deleted" });
  }

  if (risk_level) {
    // 변경 전 데이터 조회 (조정 이력용)
    const { data: before } = await supabase
      .from("collected_info")
      .select("risk_level, title, site_name")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("collected_info")
      .update({ risk_level })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 조정 이력 기록
    const oldLevel = before?.risk_level || "미분류";
    if (oldLevel !== risk_level) {
      await supabase.from("level_adjustments").insert({
        article_id: id,
        article_title: before?.title || "",
        site_name: before?.site_name || "",
        old_level: oldLevel,
        new_level: risk_level,
        adjusted_by: authResult.user.id,
        reason: body.reason || null,
      });
    }

    return NextResponse.json({ success: true, action: "updated" });
  }

  return NextResponse.json({ error: "risk_level or action required" }, { status: 400 });
}
